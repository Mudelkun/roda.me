/* "Ask my AI": the chat, in three parts that share one conversation per visit.

   - Prompt bars (AskAI.bar): the glowing input in the hero, the contact section and
     the project pages. Typing there, or tapping a suggestion, opens the panel.
   - The panel: a floating conversation on desktop, a bottom sheet on mobile. It grows
     out of whatever opened it.
   - The launcher: an "Ask AI" button that floats in once no prompt bar is on screen.

   The whole chat speaks as me, in the first person, like the rest of the site.

   Answers come from SITE.chatEndpoint (server.mjs, Claude grounded in profile.md). With
   no endpoint, or whenever it can't answer, the panel falls back to keyword answers from
   data.js, so it is never a dead end.

   The French switch (i18n.js) translates whatever text lands in the page, so nothing here
   animates text by rewriting it: rotating examples are all in the markup at once and only
   their visibility changes, and replies are revealed with a mask over the finished text. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var UI = window.UI;
  var esc = UI.esc;

  var STORE_KEY = "roda-ask";
  var MAX_QUESTION = 500;
  var MAX_KEPT = 40;

  var mqMobile = window.matchMedia("(max-width: 860px)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function profileName() {
    return (SITE.profile && SITE.profile.name) || "me";
  }

  function email() {
    return (SITE.profile && SITE.profile.email) || "";
  }

  /* ---------- icons ---------- */

  // A four-point spark: the site's ★ mark, softened into the AI's avatar.
  var SPARK = '<path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z"/>';

  function spark(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + SPARK + "</svg>";
  }

  function sparks(cls) {
    return '<span class="' + cls + '" aria-hidden="true">' +
      '<svg class="spark spark--big" viewBox="0 0 24 24">' + SPARK + "</svg>" +
      '<svg class="spark spark--small" viewBox="0 0 24 24">' + SPARK + "</svg>" +
    "</span>";
  }

  var ICON = {
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.6 5.3 11.3l1.5 1.5L11 8.6V20h2V8.6l4.2 4.2 1.5-1.5Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4Z"/></svg>',
    fresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7.5 6.5 12 11V8a5 5 0 1 1-5 5H5a7 7 0 1 0 7-8Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.2 5.6-1.4 1.4 4 4H4v2h11.8l-4 4 1.4 1.4L19.6 12Z"/></svg>'
  };

  /* ---------- storage (per tab, optional) ---------- */

  function load() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORE_KEY));
      if (saved && typeof saved.conversation === "string" && Array.isArray(saved.messages)) return saved;
    } catch (e) { /* private mode or blocked storage: start fresh */ }
    return null;
  }

  function save(state) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({
        conversation: state.conversation,
        messages: state.messages.slice(-MAX_KEPT)
      }));
    } catch (e) { /* not worth interrupting the chat over */ }
  }

  function newConversationId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  /* ---------- reply text: plain, with emails and links made clickable ---------- */

  var LINKS = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?:https?:\/\/|www\.)[^\s<>()]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:me|app|com|ca|dev|io)(?:\/[^\s<>()]*)?)/gi;

  /* Only my own addresses become clickable. Replies come from a model a visitor can try
     to steer, so anything else it writes stays plain text: it can never show a working
     link to somewhere I didn't put on this site. */
  var trustedHosts = (function () {
    var hosts = [location.hostname].concat(SITE.chatLinkHosts || []);
    var p = SITE.profile || {};
    [p.github, p.instagram].concat((SITE.projects || []).map(function (proj) { return proj.live; }),
      (SITE.projects || []).map(function (proj) { return proj.source; })).forEach(function (url) {
      try { if (url) hosts.push(new URL(url).hostname); } catch (e) { /* not a URL */ }
    });
    return hosts.map(function (h) { return String(h).toLowerCase().replace(/^www\./, ""); }).filter(Boolean);
  })();

  function trustedUrl(href) {
    try {
      var url = new URL(href);
      if (url.protocol !== "https:" && url.protocol !== "http:") return false;
      var host = url.hostname.toLowerCase().replace(/^www\./, "");
      return trustedHosts.some(function (h) { return host === h || host.slice(-(h.length + 1)) === "." + h; });
    } catch (e) {
      return false;
    }
  }

  function fillText(node, text) {
    node.textContent = "";
    var last = 0;
    String(text).replace(LINKS, function (match, mail, url, offset) {
      // Sentence punctuation after a link belongs to the sentence.
      var trail = (match.match(/[.,;:!?'")\]]+$/) || [""])[0];
      var core = match.slice(0, match.length - trail.length);
      if (!core) return match;

      var href = mail ? "mailto:" + core : (/^https?:\/\//i.test(core) ? core : "https://" + core);
      var ok = mail ? core.toLowerCase() === email().toLowerCase() : trustedUrl(href);
      if (!ok) return match;

      node.appendChild(document.createTextNode(text.slice(last, offset)));
      var a = document.createElement("a");
      a.textContent = core;
      a.href = href;
      if (!mail) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      node.appendChild(a);
      last = offset + core.length;
      return match;
    });
    node.appendChild(document.createTextNode(text.slice(last)));
  }

  /* ---------- the conversation ---------- */

  function Ask(opts) {
    this.project = opts.project || null;
    this.busy = false;
    this.opener = null;
    this.bars = [];
    this.visibleBars = 0;

    var saved = load();
    this.state = saved || { conversation: newConversationId(), messages: [] };

    this.build();
    this.bind();
    this.restore();
  }

  Ask.prototype.suggestions = function () {
    if (this.project) {
      var name = this.project.title.split(":")[0].trim();
      return [
        "What does " + name + " do?",
        "What's the stack behind " + name + "?",
        "What did you learn building " + name + "?",
        "Are you open to work?"
      ];
    }
    return (SITE.chatSuggestions || []).slice(0, 4);
  };

  Ask.prototype.build = function () {
    var name = esc(profileName());
    var chips = this.suggestions().map(function (s) {
      return '<button type="button" class="aichat__idea">' +
        '<span>' + esc(s) + "</span>" + ICON.arrow + "</button>";
    }).join("");

    this.panel = UI.el('' +
      '<section class="aichat" id="aichat" role="dialog" aria-modal="false" aria-labelledby="aichat-title" hidden>' +
        '<div class="aichat__aura" aria-hidden="true"></div>' +
        '<button type="button" class="aichat__grip" aria-label="Close the chat"></button>' +
        '<header class="aichat__head">' +
          '<span class="aiorb aiorb--sm" aria-hidden="true">' + spark("aiorb__spark") + "</span>" +
          '<div class="aichat__id">' +
            '<h2 class="aichat__title" id="aichat-title">' + name + "’s AI</h2>" +
            '<p class="aichat__sub"><span class="aichat__live" aria-hidden="true"></span>Answers from my résumé &amp; projects</p>' +
          "</div>" +
          '<button type="button" class="aichat__tool aichat__fresh" aria-label="Start a new chat" title="New chat" hidden>' + ICON.fresh + "</button>" +
          '<button type="button" class="aichat__tool aichat__close" aria-label="Close the chat">' + ICON.close + "</button>" +
        "</header>" +
        '<div class="aichat__body">' +
          '<div class="aichat__hello">' +
            '<span class="aiorb aiorb--lg" aria-hidden="true">' + spark("aiorb__spark") + "</span>" +
            '<p class="aichat__hello-t">Hey, it’s ' + name + ". Well, my AI.</p>" +
            '<p class="aichat__hello-s">' + (this.project
              ? "Ask me anything about " + esc(this.project.title.split(":")[0].trim()) + ", or about me."
              : "Ask me about my projects, my stack, my experience or whether I’m available.") + "</p>" +
            '<div class="aichat__ideas">' + chips + "</div>" +
          "</div>" +
          '<div class="aichat__log" role="log" aria-live="polite" aria-label="Conversation"></div>' +
        "</div>" +
        '<form class="aichat__form">' +
          '<div class="aifield aifield--compose">' +
            '<label class="sr" for="aichat-input">Your question</label>' +
            '<textarea class="aifield__input" id="aichat-input" rows="1" maxlength="' + MAX_QUESTION + '" placeholder="Ask a follow-up…" enterkeyhint="send"></textarea>' +
            '<button class="aisend" type="submit" aria-label="Send">' + ICON.send + "</button>" +
          "</div>" +
          '<p class="aichat__fine">Answers come only from my own words · Chats are saved</p>' +
        "</form>" +
      "</section>");

    this.scrim = UI.el('<div class="aichat-scrim" hidden></div>');

    this.fab = UI.el('' +
      '<button type="button" class="aifab" aria-controls="aichat" aria-expanded="false">' +
        '<span class="aiorb aiorb--fab" aria-hidden="true">' + spark("aiorb__spark") + "</span>" +
        '<span class="aifab__label">Ask my AI</span>' +
      "</button>");

    document.body.appendChild(this.scrim);
    document.body.appendChild(this.panel);
    document.body.appendChild(this.fab);

    this.head = this.panel.querySelector(".aichat__head");
    this.body = this.panel.querySelector(".aichat__body");
    this.hello = this.panel.querySelector(".aichat__hello");
    this.log = this.panel.querySelector(".aichat__log");
    this.form = this.panel.querySelector(".aichat__form");
    this.input = this.panel.querySelector(".aifield__input");
    this.send = this.panel.querySelector(".aisend");
    this.fresh = this.panel.querySelector(".aichat__fresh");
  };

  Ask.prototype.bind = function () {
    var self = this;

    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      self.submit(self.input.value, self.send);
    });

    this.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        self.submit(self.input.value, self.send);
      }
    });
    this.input.addEventListener("input", function () {
      self.grow();
      self.input.parentNode.classList.toggle("has-text", self.input.value.trim().length > 0);
    });

    this.panel.querySelectorAll(".aichat__idea").forEach(function (btn) {
      btn.addEventListener("click", function () {
        self.submit(btn.textContent, btn);
      });
    });

    this.panel.querySelector(".aichat__close").addEventListener("click", function () { self.close(); });
    this.panel.querySelector(".aichat__grip").addEventListener("click", function () { self.close(); });
    this.scrim.addEventListener("click", function () { self.close(); });
    this.fresh.addEventListener("click", function () { self.reset(); });

    this.fab.addEventListener("click", function () {
      self.open(self.fab);
      self.focusComposer();
    });

    this.panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); self.close(); }
    });

    // "/" from anywhere that isn't a text field: jump to the nearest way of asking.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      var bar = self.bars.filter(function (b) { return b.onScreen; })[0];
      if (bar && !self.isOpen()) bar.input.focus();
      else { self.open(self.fab); self.focusComposer(); }
    });

    this.dragToClose();
  };

  /* Pull the sheet down by its grip to dismiss it (mobile). */
  Ask.prototype.dragToClose = function () {
    var self = this;
    var grip = this.panel.querySelector(".aichat__grip");
    var startY = null;
    var dy = 0;

    grip.addEventListener("pointerdown", function (e) {
      if (!mqMobile.matches) return;
      startY = e.clientY;
      dy = 0;
      grip.setPointerCapture(e.pointerId);
      self.panel.classList.add("is-dragging");
    });
    grip.addEventListener("pointermove", function (e) {
      if (startY == null) return;
      dy = Math.max(0, e.clientY - startY);
      self.panel.style.transform = "translateY(" + dy + "px)";
    });
    function end() {
      if (startY == null) return;
      startY = null;
      self.panel.classList.remove("is-dragging");
      self.panel.style.transform = "";
      if (dy > 90) self.close();
    }
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
    // A drag isn't a click: only a still tap on the grip closes through its click handler.
    grip.addEventListener("click", function (e) {
      if (dy > 6) { e.stopImmediatePropagation(); dy = 0; }
    }, true);
  };

  Ask.prototype.grow = function () {
    this.input.style.height = "auto";
    this.input.style.height = Math.min(this.input.scrollHeight, 132) + "px";
  };

  Ask.prototype.focusComposer = function () {
    var input = this.input;
    // On phones, the keyboard would cover the welcome and its suggestions.
    if (mqMobile.matches && !this.state.messages.length) return;
    setTimeout(function () { input.focus({ preventScroll: true }); }, reduced() ? 0 : 260);
  };

  Ask.prototype.isOpen = function () {
    return !this.panel.hidden;
  };

  /* Opens the panel, growing it out of `from` (a bar, a chip, the launcher). */
  Ask.prototype.open = function (from) {
    if (this.isOpen()) return;
    this.opener = document.activeElement;

    this.panel.hidden = false;
    this.scrim.hidden = false;
    this.fab.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("aichat-open");
    this.syncFab();
    this.scrollToEnd();

    if (reduced()) return;

    var end = this.panel.getBoundingClientRect();
    var keyframes;

    if (mqMobile.matches) {
      keyframes = [
        { transform: "translateY(100%)" },
        { transform: "none" }
      ];
    } else {
      var src = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null;
      var dx = src ? (src.left + src.width / 2) - (end.left + end.width / 2) : 0;
      var dy = src ? (src.top + src.height / 2) - (end.top + end.height / 2) : 40;
      keyframes = [
        { transform: "translate(" + dx + "px," + dy + "px) scale(.35)", opacity: 0, filter: "blur(10px)" },
        { opacity: 1, offset: .55 },
        { transform: "none", opacity: 1, filter: "blur(0)" }
      ];
    }

    this.panel.animate(keyframes, { duration: 560, easing: "cubic-bezier(.2, .9, .22, 1)" });
    this.scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
  };

  Ask.prototype.close = function () {
    if (!this.isOpen()) return;
    var self = this;

    function done() {
      self.panel.hidden = true;
      self.scrim.hidden = true;
      self.fab.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("aichat-open");
      self.syncFab();
      var back = self.opener;
      self.opener = null;
      if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
    }

    if (reduced()) return done();

    var frames = mqMobile.matches
      ? [{ transform: "none" }, { transform: "translateY(100%)" }]
      : [{ transform: "none", opacity: 1 }, { transform: "translateY(18px) scale(.96)", opacity: 0 }];

    this.scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in" });
    this.panel.animate(frames, { duration: 240, easing: "cubic-bezier(.4, 0, 1, 1)" }).onfinish = done;
  };

  /* Every way of asking ends here. */
  Ask.prototype.submit = function (raw, from) {
    var text = String(raw || "").trim().slice(0, MAX_QUESTION);
    if (!text || this.busy) return false;

    this.open(from);
    this.input.value = "";
    this.input.parentNode.classList.remove("has-text");
    this.grow();
    this.burst(from);
    this.ask(text);
    return true;
  };

  Ask.prototype.restore = function () {
    var self = this;
    this.state.messages.forEach(function (m) {
      self.render(m.role === "user" ? "user" : "bot", m.content, { still: true });
    });
    this.syncEmpty();
  };

  Ask.prototype.reset = function () {
    if (this.busy) return;
    this.state = { conversation: newConversationId(), messages: [] };
    save(this.state);
    this.log.textContent = "";
    this.syncEmpty();
    this.input.focus();
  };

  Ask.prototype.syncEmpty = function () {
    var empty = this.state.messages.length === 0 && !this.busy;
    this.hello.hidden = !empty;
    this.fresh.hidden = empty;
    this.panel.classList.toggle("is-empty", empty);
  };

  Ask.prototype.scrollToEnd = function () {
    var body = this.body;
    body.scrollTo({ top: body.scrollHeight, behavior: reduced() || this.panel.hidden ? "auto" : "smooth" });
  };

  Ask.prototype.render = function (who, text, opts) {
    opts = opts || {};
    var row = document.createElement("div");
    row.className = "aimsg aimsg--" + who + (opts.still ? "" : " is-new");

    if (who !== "user") {
      row.insertAdjacentHTML("afterbegin", '<span class="aiorb aiorb--xs" aria-hidden="true">' + spark("aiorb__spark") + "</span>");
    }

    var bubble = document.createElement("div");
    bubble.className = "aimsg__text";
    if (who === "user") bubble.textContent = text;
    else fillText(bubble, text);
    row.appendChild(bubble);

    this.log.appendChild(row);
    this.scrollToEnd();
    return row;
  };

  Ask.prototype.thinking = function () {
    var row = UI.el('' +
      '<div class="aimsg aimsg--bot aimsg--thinking">' +
        '<span class="aiorb aiorb--xs is-thinking" aria-hidden="true">' + spark("aiorb__spark") + "</span>" +
        '<div class="aimsg__text"><span class="aishimmer" role="status">Thinking</span></div>' +
      "</div>");
    this.log.appendChild(row);
    this.scrollToEnd();
    return row;
  };

  Ask.prototype.ask = function (text) {
    var self = this;
    var earlier = this.state.messages.slice(-10);

    this.busy = true;
    this.panel.classList.add("is-busy");
    this.state.messages.push({ role: "user", content: text });
    save(this.state);
    this.syncEmpty();
    this.render("user", text);

    var pending = this.thinking();

    this.respond(text, earlier)
      .then(function (reply) {
        pending.remove();
        self.render("bot", reply);
        self.state.messages.push({ role: "assistant", content: reply });
        save(self.state);
      })
      .catch(function () {
        pending.remove();
        self.render("err", "That didn’t go through. Try again, or email me" + (email() ? " at " + email() : "") + ".");
      })
      .then(function () {
        self.busy = false;
        self.panel.classList.remove("is-busy");
        self.syncEmpty();
        if (!mqMobile.matches) self.input.focus({ preventScroll: true });
      });
  };

  Ask.prototype.respond = function (text, earlier) {
    var self = this;

    if (!SITE.chatEndpoint) return this.fallback(text);

    return fetch(SITE.chatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: earlier,
        conversation: this.state.conversation,
        project: this.project ? this.project.slug : null
      })
    }).then(function (r) {
      return r.json();
    }).then(function (data) {
      if (data.reply) return data.reply;
      if (data.limited) {
        return "That’s the limit for questions today. For anything else, email me" + (email() ? " at " + email() : "") + ".";
      }
      // { fallback: true }, an error, or no AI configured on the server.
      return self.fallback(text);
    }, function () {
      // Offline, or a static server with no /api/chat behind it.
      return self.fallback(text);
    });
  };

  Ask.prototype.fallback = function (text) {
    var self = this;

    // localAnswer matches on English keywords. With the French switch on, the
    // question goes back through the translator first; the reply is written in
    // English and the page's French layer picks it up where it lands.
    var asked = window.I18N ? window.I18N.toSource(text) : Promise.resolve(text);

    return asked.then(function (english) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(self.localAnswer(english)); }, 450);
      });
    });
  };

  /* Keyword answers drawn from data.js: the fallback when the AI can't answer. */
  Ask.prototype.localAnswer = function (text) {
    var q = text.toLowerCase();
    var p = SITE.profile || {};
    var projects = SITE.projects || [];
    var scoped = this.project;

    var named = projects.filter(function (proj) {
      return q.indexOf(proj.title.toLowerCase()) !== -1 || q.indexOf(proj.slug) !== -1;
    })[0] || scoped;

    if (/stack|tech|built with|language|framework/.test(q)) {
      if (named) {
        return named.title + " is built with " +
          named.stack.map(function (l) { return l.layer.toLowerCase() + ": " + l.items.join(", "); }).join("; ") + ".";
      }
      var all = [];
      projects.forEach(function (proj) {
        proj.tags.forEach(function (t) { if (all.indexOf(t) === -1) all.push(t); });
      });
      return "Across my projects, I've used " + all.join(", ") + ".";
    }

    if (/hire|available|open to work|looking|job|role|freelance|contract/.test(q)) {
      return p.contactBlurb || (p.openToWork ? "Yes, I'm open to work." : "I'm not looking right now.");
    }

    if (/contact|email|reach|hello|touch/.test(q)) {
      return "Email is the best way to reach me: " + (p.email || "see the contact section") +
        (p.github ? ". My code is at " + p.github + "." : ".");
    }

    if (/where|located|location|based|remote|timezone/.test(q)) {
      return "I'm based in " + (p.location || "Canada") + ".";
    }

    if (/who|about|yourself|background/.test(q)) {
      return p.bio || "See the about section at the top of the page.";
    }

    if (/learn|hard|broke|challenge|difficult/.test(q) && named) {
      return named.whatILearned;
    }

    if (/why/.test(q) && named && named.whyIBuiltIt) {
      return named.whyIBuiltIt;
    }

    if (named) {
      return [named.description || named.whatItDoes, named.pitch].filter(Boolean).join(" ");
    }

    if (/project|work|portfolio|built/.test(q)) {
      return "I've put " + projects.length + " builds here: " +
        projects.map(function (proj) { return proj.title + " (" + proj.tags.slice(0, 3).join(", ") + ")"; }).join(" and ") +
        ". Ask me about either one.";
    }

    return "I can answer questions about my projects, the stack behind them, and my availability. " +
      "For anything else, email me" + (p.email ? " at " + p.email : "") + ".";
  };

  /* A handful of sparks thrown from whatever sent the question. */
  Ask.prototype.burst = function (from) {
    if (reduced() || !from || !from.getBoundingClientRect) return;
    var r = from.getBoundingClientRect();
    if (!r.width) return;

    var layer = document.createElement("div");
    layer.className = "aiburst";
    layer.setAttribute("aria-hidden", "true");
    layer.style.left = (r.left + r.width / 2) + "px";
    layer.style.top = (r.top + r.height / 2) + "px";

    for (var i = 0; i < 9; i++) {
      var s = document.createElement("i");
      s.style.setProperty("--a", (i * 40 + Math.random() * 20) + "deg");
      s.style.setProperty("--r", (26 + Math.random() * 22) + "px");
      s.style.setProperty("--s", (.5 + Math.random() * .6).toFixed(2));
      s.innerHTML = '<svg viewBox="0 0 24 24">' + SPARK + "</svg>";
      layer.appendChild(s);
    }

    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 900);
  };

  /* The launcher floats in only when no prompt bar is on screen and the panel is closed. */
  Ask.prototype.syncFab = function () {
    var show = !this.isOpen() && this.visibleBars === 0;
    this.fab.classList.toggle("is-shown", show);
    this.fab.tabIndex = show ? 0 : -1;
    this.fab.setAttribute("aria-hidden", show ? "false" : "true");
  };

  /* ---------- prompt bars ---------- */

  function barMarkup(opts) {
    var examples = (opts.examples || []).map(function (s, i) {
      return '<span class="aighost__line' + (i === 0 ? " is-on" : "") + '">' + esc(s) + "</span>";
    }).join("");

    var chips = (opts.chips || []).map(function (s) {
      return '<button type="button" class="aichip">' + esc(s) + "</button>";
    }).join("");

    return '' +
      '<div class="aibar' + (opts.compact ? " aibar--compact" : "") + '">' +
        (opts.label ? '' +
          '<div class="aibar__top">' +
            '<p class="aibar__label">' + spark("aibar__label-i") + "<span>" + esc(opts.label) + "</span></p>" +
            (opts.hint ? '<p class="aibar__hint">' + esc(opts.hint) + "</p>" : "") +
          "</div>" : "") +
        '<form class="aifield aifield--bar' + (examples ? " has-ghost" : "") + '">' +
          sparks("aifield__sparks") +
          '<span class="aifield__slot">' +
            '<label class="sr" for="' + esc(opts.id) + '">' + esc(opts.placeholder) + "</label>" +
            '<input class="aifield__input" id="' + esc(opts.id) + '" type="text" maxlength="' + MAX_QUESTION + '" ' +
              'autocomplete="off" enterkeyhint="send" placeholder="' + esc(opts.placeholder) + '">' +
            (examples ? '<span class="aighost" aria-hidden="true">' + examples + "</span>" : "") +
          "</span>" +
          '<kbd class="aifield__kbd" aria-hidden="true" translate="no">/</kbd>' +
          '<button class="aisend" type="submit" aria-label="Ask">' + ICON.send + "</button>" +
        "</form>" +
        (chips ? '<div class="aibar__chips">' + chips + "</div>" : "") +
      "</div>";
  }

  Ask.prototype.bar = function (container, opts) {
    if (!container) return;
    var self = this;
    var node = UI.el(barMarkup(opts));
    container.appendChild(node);

    var form = node.querySelector(".aifield");
    var input = node.querySelector(".aifield__input");
    var send = node.querySelector(".aisend");
    var record = { node: node, input: input, onScreen: false };
    this.bars.push(record);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (self.submit(input.value, send)) {
        input.value = "";
        sync();
      } else if (!input.value.trim()) {
        input.focus();
      }
    });

    node.querySelectorAll(".aichip").forEach(function (chip) {
      chip.addEventListener("click", function () { self.submit(chip.textContent, chip); });
    });

    function sync() {
      form.classList.toggle("has-text", input.value.trim().length > 0);
    }
    input.addEventListener("input", sync);
    input.addEventListener("focus", function () { form.classList.add("is-focused"); });
    input.addEventListener("blur", function () { form.classList.remove("is-focused"); });

    this.cycle(form);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting === record.onScreen) return;
          record.onScreen = entry.isIntersecting;
          self.visibleBars += entry.isIntersecting ? 1 : -1;
          self.syncFab();
        });
      }, { threshold: 0.4 }).observe(form);
    }
  };

  /* Rotates the example questions shown where the placeholder would be. Only classes
     change, so each line is translated once rather than on every swap. */
  Ask.prototype.cycle = function (form) {
    var lines = form.querySelectorAll(".aighost__line");
    if (lines.length < 2 || reduced()) return;

    var i = 0;
    setInterval(function () {
      if (document.hidden || form.classList.contains("is-focused") || form.classList.contains("has-text")) return;
      lines[i].classList.remove("is-on");
      i = (i + 1) % lines.length;
      lines[i].classList.add("is-on");
    }, 3600);
  };

  /* ---------- public ---------- */

  var instance = null;

  window.AskAI = {
    /* Call once per page. opts.project scopes the answers to a project page. */
    init: function (opts) {
      if (!instance) {
        instance = new Ask(opts || {});
        instance.syncFab();
      }
      return instance;
    },

    bar: function (container, opts) {
      var ask = window.AskAI.init();
      opts = opts || {};
      ask.bar(container, {
        id: opts.id || "ask-" + ask.bars.length,
        label: opts.label,
        hint: opts.hint,
        compact: !!opts.compact,
        placeholder: opts.placeholder || "Ask me anything…",
        examples: opts.examples,
        chips: opts.chips
      });
    },

    open: function (from) {
      var ask = window.AskAI.init();
      ask.open(from);
      ask.focusComposer();
    },

    isMobile: function () { return mqMobile.matches; },
    hasFinePointer: function () { return mqFine.matches; }
  };
})();
