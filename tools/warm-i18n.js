#!/usr/bin/env node
/* Builds assets/js/i18n-cache.js: every string the site can show, translated once,
   so a visitor's switch to French costs no requests and happens instantly.

   Run it after changing content:

       node tools/warm-i18n.js

   It reads the same sources the page does - data.js plus the text in the two HTML
   files - talks to the same providers assets/js/i18n.js uses, and writes the result
   as a plain object. Nothing here is edited by hand: re-run it and commit the file.
   Anything it misses (a label a renderer builds at runtime) still gets translated
   live by the module, so the site is correct either way - just one request slower.

   Flags:
     --check    report what is missing or stale and exit; writes nothing
     --force    retranslate everything instead of keeping what is already there
*/

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "js", "i18n-cache.js");
const CHECK = process.argv.includes("--check");
const FORCE = process.argv.includes("--force");

/* ---------- the site's own content ---------- */

function loadSite() {
  const code = fs.readFileSync(path.join(ROOT, "assets", "js", "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.SITE || {};
}

const SITE = loadSite();
const CFG = SITE.translate || {};
const FROM = CFG.source || "en";
const TO = CFG.lang || "fr";

/* The module's rules, repeated here so both sides agree on what is worth sending. */
const HAS_WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/;
const IS_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_URL = /^(https?:\/\/|www\.|@)\S+$/i;
const EDGES = /^[\s"'“”«»(\[]+|[\s"'“”«»)\]:;,.!?·—–-]+$/g;

const protect = new Set();
function guard(value) {
  if (typeof value === "string" && value.trim()) protect.add(value.trim().toLowerCase());
}

guard((SITE.profile || {}).name);
guard((SITE.profile || {}).githubHandle);
guard((SITE.profile || {}).email);
(SITE.projects || []).forEach((project) => {
  (project.tags || []).forEach(guard);
  (project.stack || []).forEach((layer) => (layer.items || []).forEach(guard));
});
(CFG.protect || []).forEach(guard);

const overrides = new Set(Object.keys(CFG.overrides || {}));

function wanted(text) {
  if (!text || text.length < 2 || text.length > 4000) return false;
  if (!HAS_WORD.test(text)) return false;
  if (IS_EMAIL.test(text) || IS_URL.test(text)) return false;
  if (overrides.has(text)) return false;
  const bare = text.replace(EDGES, "");
  return !protect.has(text.toLowerCase()) && !(bare && protect.has(bare.toLowerCase()));
}

/* ---------- gathering ---------- */

const strings = new Set();

function take(value) {
  if (typeof value !== "string") return;
  // data.js keeps paragraphs in one field, split by blank lines; the page renders
  // each as its own element, so each is its own string.
  value.split(/\n\s*\n/).forEach((part) => {
    const text = part.trim();
    if (wanted(text)) strings.add(text);
  });
}

/* Every string in the content tree, minus the keys that are never shown as prose. */
const SKIP_KEYS = new Set([
  "slug", "src", "poster", "logo", "video", "live", "source", "photo", "resume",
  "email", "github", "githubHandle", "instagram", "chatEndpoint", "icon", "id",
  "fonts", "display", "body", "radius", "ease", "index"
]);

(function walk(node, key) {
  if (node == null) return;
  if (typeof node === "string") {
    if (!SKIP_KEYS.has(key)) take(node);
    return;
  }
  if (Array.isArray(node)) { node.forEach((item) => walk(item, key)); return; }
  if (typeof node === "object") {
    Object.keys(node).forEach((k) => {
      if (k === "translate" || k === "brand") return;      // config, not copy
      walk(node[k], k);
      if (!Array.isArray(node) && isNaN(Number(k))) take(k); // "Role", "Timeline", ...
    });
  }
})(SITE, "");

/* Text sitting in the markup: element text plus the attributes the module reads. */
const ATTRS = ["aria-label", "title", "placeholder", "alt", "data-tip", "data-caption"];

["index.html", "project.html"].forEach((file) => {
  let html = fs.readFileSync(path.join(ROOT, file), "utf8");

  html = html.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, " ");

  const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (title) take(decode(title[1]));

  const meta = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html);
  if (meta) take(decode(meta[1]));

  ATTRS.forEach((attr) => {
    const re = new RegExp(attr + '=["\']([^"\']+)["\']', "gi");
    let m;
    while ((m = re.exec(html))) take(decode(m[1]));
  });

  html.replace(/<[^>]+>/g, "\n").split("\n").forEach((line) => take(decode(line)));
});

function decode(text) {
  return String(text)
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "…").replace(/&mdash;/g, "—").replace(/&middot;/g, "·")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
}

/* ---------- providers ---------- */

const PROVIDERS = {
  google: {
    batch: (texts) =>
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + FROM + "&tl=" + TO +
      "&dt=t" + texts.map((t) => "&q=" + encodeURIComponent(t)).join(""),
    read: (data, texts) => {
      const pairs = new Map();
      (function scan(node) {
        if (!node || typeof node !== "object") return;
        if (typeof node[0] === "string" && typeof node[1] === "string") {
          pairs.set(node[1].trim(), node[0]);
          return;
        }
        for (const child of node) scan(child);
      })(data);

      const out = [];
      for (const text of texts) {
        const hit = pairs.get(text.trim());
        if (!hit) return null;
        out.push(hit);
      }
      return out;
    }
  },
  mymemory: {
    batch: (texts) => texts.length === 1
      ? "https://api.mymemory.translated.net/get?langpair=" + FROM + "|" + TO +
        "&q=" + encodeURIComponent(texts[0])
      : null,
    read: (data) => {
      const out = data && data.responseData && data.responseData.translatedText;
      if (!out || /^[A-Z ]*(INVALID|QUERY LENGTH|MYMEMORY WARNING)/.test(out)) return null;
      return [out];
    }
  }
};

const order = (CFG.providers || ["google", "mymemory"]).filter((id) => PROVIDERS[id]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The endpoints are free and they rate-limit, so this backs off and keeps going
   rather than giving up on the run. */
async function ask(texts) {
  for (const id of order) {
    const url = PROVIDERS[id].batch(texts);
    if (!url) continue;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(url);
        if (res.status === 429 || res.status === 503) {
          const wait = 4000 * Math.pow(2, attempt);
          process.stdout.write("  rate-limited by " + id + ", waiting " + Math.round(wait / 1000) + "s\n");
          await sleep(wait);
          continue;
        }
        if (!res.ok) break;

        const out = PROVIDERS[id].read(await res.json(), texts);
        if (out && out.every(Boolean)) return out.map(entity);
        break;
      } catch (e) {
        await sleep(1500);
      }
    }
  }
  return null;
}

function entity(text) {
  return decode(String(text));
}

/* ---------- run ---------- */

function chunk(texts, maxItems, maxChars) {
  const out = [];
  let buf = [];
  let size = 0;

  for (const text of texts) {
    const cost = encodeURIComponent(text).length + 3;
    if (buf.length && (buf.length >= maxItems || size + cost > maxChars)) {
      out.push(buf); buf = []; size = 0;
    }
    buf.push(text);
    size += cost;
  }
  if (buf.length) out.push(buf);
  return out;
}

function existing() {
  if (FORCE || !fs.existsSync(OUT)) return {};
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try { vm.runInContext(fs.readFileSync(OUT, "utf8"), sandbox); } catch (e) { return {}; }
  return sandbox.window.I18N_CACHE || {};
}

(async () => {
  const have = existing();
  const all = [...strings].sort();
  const todo = all.filter((text) => !have[text]);
  const stale = Object.keys(have).filter((key) => !strings.has(key) && key.charCodeAt(0) !== 1);

  console.log("strings on the site : " + all.length);
  console.log("already translated  : " + (all.length - todo.length));
  console.log("to translate        : " + todo.length);
  if (stale.length) console.log("no longer used      : " + stale.length + " (kept; --force clears them)");

  if (CHECK) {
    if (todo.length) console.log("\nmissing:\n  " + todo.slice(0, 20).map((t) => JSON.stringify(t.slice(0, 70))).join("\n  "));
    process.exit(todo.length ? 1 : 0);
  }
  if (!todo.length) { console.log("\nnothing to do."); return; }

  const short = todo.filter((t) => t.length <= 200 && !/[.!?…]\s/.test(t));
  const long = todo.filter((t) => !short.includes(t));

  const batches = chunk(short, 24, 1400).concat(long.map((t) => [t]));
  const done = Object.assign({}, have);
  let failed = 0;
  let blanks = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Both services refusing in a row means the quota is gone, not that these
    // particular strings are awkward. Stop and keep what was translated.
    if (blanks >= 3) {
      console.log("\nproviders are refusing - stopping here. What is done is saved;");
      console.log("run the script again later to pick up the rest.");
      break;
    }
    process.stdout.write("[" + (i + 1) + "/" + batches.length + "] " + batch.length + " string(s)… ");

    let out = await ask(batch);

    if (!out && batch.length > 1) {
      process.stdout.write("batch failed, one at a time… ");
      out = [];
      for (const text of batch) {
        const single = await ask([text]);
        out.push(single ? single[0] : null);
        await sleep(200);
      }
    }

    if (!out) { failed += batch.length; blanks++; console.log("failed"); continue; }

    blanks = 0;
    batch.forEach((text, n) => {
      if (out[n]) done[text] = out[n];
      else failed++;
    });
    console.log("ok");
    await sleep(350);
  }

  const keys = Object.keys(done).sort();
  const body = keys.map((key) => "  " + JSON.stringify(key) + ": " + JSON.stringify(done[key])).join(",\n");

  fs.writeFileSync(OUT,
    "/* Generated by tools/warm-i18n.js - do not edit by hand.\n" +
    "   " + keys.length + " strings, " + FROM + " to " + TO + ", built " + new Date().toISOString().slice(0, 10) + ".\n" +
    "   Re-run the script after changing content; anything missing here is still\n" +
    "   translated live by assets/js/i18n.js. */\n\n" +
    "window.I18N_CACHE = {\n" + body + "\n};\n", "utf8");

  console.log("\nwrote " + path.relative(ROOT, OUT) + " with " + keys.length + " strings" +
    (failed ? " (" + failed + " could not be translated; they will be fetched live)" : ""));
})();
