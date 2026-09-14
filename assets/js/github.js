/* Live GitHub activity: the contribution graph and the numbers around it.

   Polls while the tab is visible, so a push shows up on the page on its own —
   no rebuild, no deploy. There is no token in here: the graph is read from a
   public mirror of the profile contribution graph, which counts private-repo
   contributions when GitHub is set to show them. Configured in data.js under
   SITE.github. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var UI = window.UI || {};
  var esc = UI.esc || function (v) { return String(v == null ? "" : v); };

  var DEFAULTS = {
    contributionEndpoints: [
      "https://github-contributions-api.jogruber.de/v4/{handle}?y=last",
      "https://github-contributions.vercel.app/api/v1/{handle}"
    ],
    graphRefreshSeconds: 60
  };

  var WEEKS = 53;
  var DAY_MS = 86400000;
  var LEVEL_LABEL = ["No", "Low", "Medium", "High", "Very high"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var state = {
    days: [],
    total: 0,
    fetchedAt: 0,
    graphFails: 0,
    lastTotal: null,
    freshCount: 0,
    freshAt: 0,
    scrolled: false,
    painted: false,
    timers: { graph: null, ago: null }
  };

  var nodes = {};

  /* ---------- config ---------- */

  function handle() {
    var gh = SITE.github || {};
    var profile = SITE.profile || {};
    if (gh.handle) return gh.handle;
    if (profile.githubHandle && profile.githubHandle !== "your-handle") return profile.githubHandle;
    var m = /github\.com\/([^/?#]+)/i.exec(profile.github || "");
    return m ? m[1] : "";
  }

  function config() {
    var gh = SITE.github || {};
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      out[k] = gh[k] == null ? DEFAULTS[k] : gh[k];
    });
    // A single custom endpoint (the old SITE.githubContributionsEndpoint) still works.
    if (typeof out.contributionEndpoints === "string") out.contributionEndpoints = [out.contributionEndpoints];
    if (SITE.githubContributionsEndpoint) out.contributionEndpoints = [SITE.githubContributionsEndpoint];
    out.handle = handle();
    return out;
  }

  /* ---------- fetch ---------- */

  function expand(tpl, who) {
    return String(tpl).replace(/\{handle\}/g, encodeURIComponent(who));
  }

  function bust(url) {
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now();
  }

  function getJSON(url) {
    return fetch(bust(url), { cache: "no-store", headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
  }

  /* Walk the endpoint list until one answers. */
  function getFirst(urls, i) {
    i = i || 0;
    if (i >= urls.length) return Promise.reject(new Error("no endpoint answered"));
    return getJSON(urls[i]).catch(function () { return getFirst(urls, i + 1); });
  }

  /* ---------- shaping ---------- */

  function ymd(date) {
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }

  function parseDay(iso) {
    var p = String(iso).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  /* Accepts the shapes the public mirrors return:
     { contributions: [{ date, count, level|intensity }] }, a bare array, or
     weeks nested one level deep. Keeps the trailing 53 weeks, oldest first. */
  function normalize(json) {
    var raw = json;
    if (raw && !Array.isArray(raw) && Array.isArray(raw.contributions)) raw = raw.contributions;
    if (!Array.isArray(raw)) return [];
    if (raw.length && Array.isArray(raw[0])) raw = [].concat.apply([], raw);

    var today = ymd(new Date());
    var days = raw.map(function (d) {
      var level = d.level == null ? d.intensity : d.level;
      return {
        date: d.date || null,
        count: d.count == null ? null : Number(d.count),
        level: level == null ? null : Number(level)
      };
    }).filter(function (d) {
      return d.date && d.date <= today;
    });

    days.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    // Mirrors that return several years: cut to the last 53 weeks.
    var floor = ymd(new Date(Date.now() - (WEEKS * 7 - 1) * DAY_MS));
    days = days.filter(function (d) { return d.date >= floor; });

    // Fill a level in when only counts came back.
    var max = days.reduce(function (m, d) { return Math.max(m, d.count || 0); }, 0);
    days.forEach(function (d) {
      if (d.level != null && !isNaN(d.level)) return;
      var c = d.count || 0;
      d.level = c === 0 ? 0 : max <= 4 ? Math.min(c, 4)
        : c >= max * 0.6 ? 4 : c >= max * 0.35 ? 3 : c >= max * 0.15 ? 2 : 1;
    });

    return days;
  }

  /* Sunday-aligned columns, so the weekday labels tell the truth. */
  function toWeeks(days) {
    if (!days.length) return [];
    var cells = days.slice();
    var lead = parseDay(cells[0].date).getDay();
    while (lead--) cells.unshift(null);
    var weeks = [];
    for (var i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks.slice(-WEEKS);
  }

  function streaks(days) {
    var longest = 0, run = 0, current = 0, i;

    for (i = 0; i < days.length; i++) {
      run = (days[i].count || 0) > 0 ? run + 1 : 0;
      if (run > longest) longest = run;
    }

    // Count back from the end; an empty today does not break a live streak yet.
    for (i = days.length - 1; i >= 0; i--) {
      if ((days[i].count || 0) > 0) current++;
      else if (i === days.length - 1) continue;
      else break;
    }

    return { current: current, longest: longest };
  }

  function todayEntry(days) {
    var t = ymd(new Date());
    for (var i = days.length - 1; i >= 0; i--) if (days[i].date === t) return days[i];
    return null;
  }

  /* ---------- time ---------- */

  function ago(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 45) return s + "s ago";
    var m = Math.round(s / 60);
    if (m < 60) return m + "m ago";
    var h = Math.round(m / 60);
    if (h < 24) return h + "h ago";
    var d = Math.round(h / 24);
    if (d < 31) return d + "d ago";
    return Math.round(d / 30) + "mo ago";
  }

  function longDate(iso) {
    var d = parseDay(iso);
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  /* ---------- render: graph ---------- */

  function renderMonths(weeks) {
    if (!nodes.months) return;
    var html = "";
    var prev = -1;
    var start = 0;
    var label = "";

    function flush(end) {
      if (!label) return;
      var span = Math.max(1, end - start);
      html += '<span style="grid-column:' + (start + 1) + " / span " + span + '">' +
        (span >= 2 ? label : "") + "</span>";
    }

    weeks.forEach(function (week, i) {
      var first = week.filter(Boolean)[0];
      if (!first) return;
      var month = parseDay(first.date).getMonth();
      if (month !== prev) {
        flush(i);
        prev = month;
        start = i;
        label = MONTHS[month];
      }
    });
    flush(weeks.length);

    nodes.months.innerHTML = html;
  }

  function renderGraph(weeks, fresh) {
    var grid = nodes.grid;
    if (!grid) return;

    // Set on the chart so the month labels inherit the same column count.
    var chart = grid.parentNode || grid;
    chart.style.setProperty("--gh-weeks", String(weeks.length || WEEKS));
    grid.textContent = "";

    var frag = document.createDocumentFragment();
    var today = ymd(new Date());

    weeks.forEach(function (week, col) {
      for (var d = 0; d < 7; d++) {
        var day = week[d];
        var cell = document.createElement("span");
        cell.className = "gh__cell";
        cell.style.setProperty("--col", String(col));

        if (!day) {
          cell.classList.add("is-void");
          cell.setAttribute("aria-hidden", "true");
        } else {
          // Read by the hover tooltip; no native title, which would double up.
          cell.setAttribute("data-level", String(day.level || 0));
          cell.setAttribute("data-date", day.date);
          if (day.count != null) cell.setAttribute("data-count", String(day.count));
          if (day.date === today) {
            cell.classList.add("is-today");
            if (fresh) cell.classList.add("is-fresh");
          }
        }
        frag.appendChild(cell);
      }
    });

    hideTip();
    grid.appendChild(frag);

    // The year fills in once, on first data; later polls swap in place.
    if (!state.painted) {
      state.painted = true;
      grid.classList.add("is-first");
      setTimeout(function () { grid.classList.remove("is-first"); }, 1400);
    }

    grid.setAttribute("aria-label",
      state.total.toLocaleString() + " GitHub contributions in the last 12 months");

    // Land on the most recent weeks when the chart has to scroll.
    if (!state.scrolled && nodes.scroll) {
      nodes.scroll.scrollLeft = nodes.scroll.scrollWidth;
      state.scrolled = true;
    }
    syncFades();
  }

  var STATS = [
    { key: "total", label: "Contributions" },
    { key: "today", label: "Today" },
    { key: "current", label: "Current streak" },
    { key: "longest", label: "Longest streak" },
    { key: "last30", label: "Last 30 days" }
  ];

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* Tiles are built once and then updated in place, so a poll that changes a
     number can animate it instead of replacing the whole row. */
  function ensureTiles() {
    if (nodes.stats.getAttribute("data-built")) return;
    nodes.stats.innerHTML = STATS.map(function (s) {
      return '<div class="gh__stat" data-stat="' + s.key + '">' +
        '<p class="gh__stat-n"><span class="gh__stat-v">—</span><span class="gh__stat-s"></span></p>' +
        '<p class="gh__stat-l">' + esc(s.label) + "</p>" +
        '<p class="gh__stat-h"></p>' +
        "</div>";
    }).join("");
    nodes.stats.setAttribute("data-built", "1");
  }

  function countTo(node, from, to, ms) {
    if (node._raf) cancelAnimationFrame(node._raf);
    if (reducedMotion() || from === to) {
      node.textContent = to.toLocaleString();
      return;
    }
    var start = null;
    function step(t) {
      if (start == null) start = t;
      var k = Math.min(1, (t - start) / ms);
      var eased = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * eased).toLocaleString();
      node._raf = k < 1 ? requestAnimationFrame(step) : 0;
    }
    node._raf = requestAnimationFrame(step);
  }

  function setStat(key, value, suffix, hint) {
    var tile = nodes.stats.querySelector('[data-stat="' + key + '"]');
    if (!tile) return;

    var v = tile.querySelector(".gh__stat-v");
    tile.querySelector(".gh__stat-s").textContent = suffix || "";
    tile.querySelector(".gh__stat-h").textContent = hint || "";

    if (value == null) {
      tile.removeAttribute("data-value");
      v.textContent = "—";
      return;
    }

    var prevAttr = tile.getAttribute("data-value");
    var prev = prevAttr == null ? null : Number(prevAttr);
    if (prev === value) return;

    tile.setAttribute("data-value", String(value));
    countTo(v, prev == null ? 0 : prev, value, prev == null ? 900 : 520);

    // A live change, not the first fill: give the number a small nudge.
    if (prev != null) {
      tile.classList.remove("is-bumped");
      void tile.offsetWidth;
      tile.classList.add("is-bumped");
    }
  }

  function renderStats(days) {
    if (!nodes.stats) return;
    ensureTiles();

    var s = streaks(days);
    var today = todayEntry(days);
    var last30 = days.slice(-30).reduce(function (n, d) { return n + (d.count || 0); }, 0);
    var busiest = days.reduce(function (best, d) {
      return (d.count || 0) > ((best && best.count) || 0) ? d : best;
    }, null);

    setStat("total", state.total, "", "last 12 months");
    setStat("today", today && today.count != null ? today.count : null, "",
      today && today.count ? "and counting" : "so far");
    setStat("current", s.current, s.current === 1 ? " day" : " days",
      s.current ? "consecutive" : "start one today");
    setStat("longest", s.longest, s.longest === 1 ? " day" : " days",
      busiest && busiest.count ? "best day · " + busiest.count : "");
    setStat("last30", last30, "", "rolling");
  }

  /* ---------- graph interactions ---------- */

  var tip = null;
  var picked = null;

  function tipText(cell) {
    var count = cell.getAttribute("data-count");
    var level = Number(cell.getAttribute("data-level") || 0);
    var head = count == null
      ? "<b>" + esc(LEVEL_LABEL[level]) + "</b> activity"
      : "<b>" + esc(Number(count).toLocaleString()) + "</b>" +
        (count === "1" ? " contribution" : " contributions");
    return head + "<span>" + esc(longDate(cell.getAttribute("data-date"))) + "</span>";
  }

  function showTip(cell) {
    if (!tip || !cell || !cell.getAttribute("data-date")) return;
    var card = tip.parentNode;

    if (picked && picked !== cell) picked.classList.remove("is-picked");
    picked = cell;

    tip.innerHTML = tipText(cell);
    tip.classList.add("is-on");

    var cr = card.getBoundingClientRect();
    var br = cell.getBoundingClientRect();
    var w = tip.offsetWidth;
    var h = tip.offsetHeight;

    var x = br.left - cr.left + br.width / 2 - w / 2;
    x = Math.max(6, Math.min(x, cr.width - w - 6));

    var y = br.top - cr.top - h - 8;
    if (y < 4) y = br.bottom - cr.top + 8;

    tip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
  }

  function hideTip() {
    if (tip) tip.classList.remove("is-on");
    if (picked) picked.classList.remove("is-picked");
    picked = null;
  }

  function initTip() {
    var card = nodes.grid.closest(".gh__card");
    if (!card) return;
    card.style.position = "relative";

    tip = document.createElement("div");
    tip.className = "gh__tip";
    tip.setAttribute("aria-hidden", "true");
    card.appendChild(tip);

    nodes.grid.addEventListener("pointerover", function (e) {
      if (e.pointerType === "touch") return;
      var cell = e.target.closest(".gh__cell");
      if (cell) showTip(cell);
    });
    nodes.grid.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "touch") hideTip();
    });

    // Touch: tap a day to read it, tap it again (or anywhere else) to dismiss.
    nodes.grid.addEventListener("click", function (e) {
      var cell = e.target.closest(".gh__cell");
      if (!cell || !cell.getAttribute("data-date")) return;
      if (picked === cell && tip.classList.contains("is-on")) { hideTip(); return; }
      showTip(cell);
      cell.classList.add("is-picked");
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest("#gh-grid")) hideTip();
    });

    if (nodes.scroll) nodes.scroll.addEventListener("scroll", hideTip, { passive: true });
    window.addEventListener("resize", hideTip);
  }

  /* Legend swatches isolate one intensity across the year: hover on desktop,
     tap to pin (and tap again to release) anywhere. */
  function initLegend() {
    var legend = document.getElementById("gh-legend");
    if (!legend) return;
    var pinned = null;
    var swatches = Array.prototype.slice.call(legend.querySelectorAll("[data-level]"));

    function apply(level) {
      if (level == null) nodes.grid.removeAttribute("data-dim");
      else nodes.grid.setAttribute("data-dim", level);
      swatches.forEach(function (b) {
        var on = b.getAttribute("data-level") === pinned;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    swatches.forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse" && pinned == null) apply(b.getAttribute("data-level"));
      });
      b.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse") apply(pinned);
      });
      b.addEventListener("click", function () {
        var level = b.getAttribute("data-level");
        pinned = pinned === level ? null : level;
        apply(pinned);
      });
    });
  }

  function initRefresh() {
    var btn = document.getElementById("gh-refresh");
    if (!btn) return;

    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add("is-busy");
      var began = Date.now();

      loadGraph().then(function () {
        // Keep the spin visible long enough to read as feedback.
        setTimeout(function () {
          btn.disabled = false;
          btn.classList.remove("is-busy");
        }, Math.max(0, 600 - (Date.now() - began)));
        schedule("graph", loadGraph, config().graphRefreshSeconds, "graphFails");
      });
    });
  }

  /* Edge fades tell a narrow screen there is more year to the left. */
  function syncFades() {
    var wrap = nodes.scrollwrap;
    var sc = nodes.scroll;
    if (!wrap || !sc) return;
    var max = sc.scrollWidth - sc.clientWidth;
    wrap.classList.toggle("has-start", max > 2 && sc.scrollLeft > 2);
    wrap.classList.toggle("has-end", max > 2 && sc.scrollLeft < max - 2);
  }

  function initFades() {
    if (!nodes.scroll) return;
    nodes.scroll.addEventListener("scroll", syncFades, { passive: true });
    window.addEventListener("resize", syncFades);
    syncFades();
  }

  /* ---------- render: status ---------- */

  function setStatus(mode, text) {
    if (!nodes.live) return;
    nodes.live.dataset.state = mode;
    if (nodes.status) nodes.status.textContent = text;
  }

  function refreshAgo() {
    if (!state.fetchedAt || !nodes.live) return;
    if (nodes.live.dataset.state === "off") return;
    var note = "";
    if (state.freshCount && Date.now() - state.freshAt < 90000) {
      note = " · +" + state.freshCount + " just now";
    }
    setStatus("on", "Live · updated " + ago(state.fetchedAt) + note);
  }

  /* ---------- polling ---------- */

  function loadGraph() {
    var cfg = config();
    if (!cfg.handle || !cfg.contributionEndpoints.length) return Promise.resolve();

    var urls = cfg.contributionEndpoints.map(function (t) { return expand(t, cfg.handle); });

    return getFirst(urls).then(function (json) {
      var days = normalize(json);
      if (!days.length) throw new Error("empty graph");

      var total = json && json.total && json.total.lastYear != null
        ? Number(json.total.lastYear)
        : days.reduce(function (n, d) { return n + (d.count || 0); }, 0);

      var grew = state.lastTotal != null && total > state.lastTotal;
      if (grew) {
        state.freshCount = total - state.lastTotal;
        state.freshAt = Date.now();
      }

      state.days = days;
      state.total = total;
      state.lastTotal = total;
      state.fetchedAt = Date.now();
      state.graphFails = 0;

      var weeks = toWeeks(days);
      renderMonths(weeks);
      renderGraph(weeks, grew);
      renderStats(days);
      if (nodes.total) {
        nodes.total.textContent = total.toLocaleString() + " contributions in the last 12 months";
      }
      refreshAgo();
    }).catch(function () {
      state.graphFails++;
      if (!state.fetchedAt) setStatus("off", "GitHub unreachable · retrying");
      else setStatus("stale", "Last update " + ago(state.fetchedAt) + " · retrying");
    });
  }

  function backoff(seconds, fails) {
    return Math.min(seconds * Math.pow(2, Math.min(fails, 4)), 900) * 1000;
  }

  function schedule(key, work, seconds, failKey) {
    clearTimeout(state.timers[key]);
    state.timers[key] = setTimeout(function () {
      if (document.visibilityState === "hidden") {
        schedule(key, work, seconds, failKey);
        return;
      }
      work().then(function () { schedule(key, work, seconds, failKey); });
    }, backoff(seconds, state[failKey]));
  }

  function startPolling() {
    schedule("graph", loadGraph, config().graphRefreshSeconds, "graphFails");

    state.timers.ago = setInterval(refreshAgo, 10000);

    // Coming back to the tab should show current data, not a stale snapshot.
    function catchUp() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - state.fetchedAt < 20000) return;
      loadGraph().then(function () {
        schedule("graph", loadGraph, config().graphRefreshSeconds, "graphFails");
      });
    }

    document.addEventListener("visibilitychange", catchUp);
    window.addEventListener("focus", catchUp);
    window.addEventListener("online", catchUp);
  }

  /* ---------- boot ---------- */

  function init() {
    nodes = {
      grid: document.getElementById("gh-grid"),
      months: document.getElementById("gh-months"),
      scroll: document.getElementById("gh-scroll"),
      scrollwrap: document.getElementById("gh-scrollwrap"),
      stats: document.getElementById("gh-stats"),
      total: document.getElementById("gh-total"),
      live: document.getElementById("gh-live"),
      status: document.getElementById("gh-status"),
      handle: document.getElementById("gh-handle")
    };
    if (!nodes.grid) return;

    initTip();
    initLegend();
    initRefresh();
    initFades();

    var cfg = config();

    if (nodes.handle && cfg.handle) {
      nodes.handle.textContent = "@" + cfg.handle;
      nodes.handle.href = "https://github.com/" + cfg.handle;
    }

    if (!cfg.handle) {
      setStatus("off", "No GitHub handle in data.js");
      return;
    }

    setStatus("loading", "Reading GitHub…");
    loadGraph();
    startPolling();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Manual poke from the console, handy while wiring this up.
  window.GH = { refresh: loadGraph };
})();
