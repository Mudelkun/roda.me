#!/usr/bin/env node
/* Prints tools/resume.html to assets/media/resume.pdf with headless Chrome, which is how
   the PDF has always been made. Edit the HTML, run this, and commit both:

       node tools/build-resume.mjs

   Chrome is found in the usual places; set CHROME to a browser path if yours is elsewhere:

       CHROME="/path/to/chrome" node tools/build-resume.mjs */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "tools", "resume.html");
const target = path.join(root, "assets", "media", "resume.pdf");

const candidates = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const chrome = candidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) {
  console.error(`No Chrome found. Tried:\n${candidates.map((c) => `  ${c}`).join("\n")}`);
  console.error("Set CHROME to your browser's path and run again (see the top of this file).");
  process.exit(1);
}

// A throwaway profile, so an already-running Chrome doesn't take the job and exit straight away.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));

try {
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      `--user-data-dir=${profile}`,
      "--no-pdf-header-footer",
      `--print-to-pdf=${target}`,
      new URL(`file:///${source.replace(/\\/g, "/")}`).href,
    ],
    { stdio: "inherit" },
  );
} finally {
  fs.rmSync(profile, { recursive: true, force: true });
}

console.log(`Wrote ${path.relative(root, target)} (${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
