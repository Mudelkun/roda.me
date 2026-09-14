/* "Ask me a question" panel.
   Desktop: an inline card. Mobile: a pull-up sheet with a drag handle.
   Posts to SITE.chatEndpoint when one is configured; otherwise answers
   locally from the content in data.js so the UI is never a dead end. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var esc = window.UI.esc;

  function Chat(root, options) {
    this.root = root;
    this.opts = options || {};
    this.history = [];
    this.busy = false;
    this.mq = window.matchMedia("(max-width: 860px)");

    this.log = root.querySelector(".chat__log");
    this.form = root.querySelector(".chat__form");
    this.input = root.querySelector(".chat__input");
    this.handle = root.querySelector(".chat__handle");
    this.status = root.querySelector(".chat__status");

    this.bind();
    this.greet();
  }

  Chat.prototype.bind = function () {
    var self = this;

    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = self.input.value.trim();
      if (!text || self.busy) return;
      self.input.value = "";
      self.ask(text);
    });

    this.root.querySelectorAll(".chat__suggestions .pill").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (self.busy) return;
        self.open(true);
        self.ask(btn.textContent.trim());
      });
    });

    // Focusing the composer on mobile expands the sheet.
    this.input.addEventListener("focus", function () {
      if (self.mq.matches) self.open(true);
    });

    if (this.handle) {
      this.handle.addEventListener("click", function () {
        self.open(self.root.dataset.open !== "true");
      });
      this.dragify();
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && self.mq.matches && self.root.dataset.open === "true") {
        self.open(false);
      }
    });

    if (this.status) this.status.dataset.state = SITE.chatEndpoint ? "on" : "off";
  };

  /* Drag the handle down to collapse, up to expand. */
  Chat.prototype.dragify = function () {
    var self = this;
    var startY = null;

    this.handle.addEventListener("pointerdown", function (e) {
      startY = e.clientY;
      self.handle.setPointerCapture(e.pointerId);
    });

    this.handle.addEventListener("pointerup", function (e) {
      if (startY == null) return;
      var dy = e.clientY - startY;
      startY = null;
      if (Math.abs(dy) > 24) self.open(dy < 0);
    });

    this.handle.addEventListener("pointercancel", function () { startY = null; });
  };

  Chat.prototype.open = function (state) {
    this.root.dataset.open = state ? "true" : "false";
    if (this.handle) this.handle.setAttribute("aria-expanded", state ? "true" : "false");
    if (state) this.scrollToEnd();
  };

  Chat.prototype.summon = function () {
    this.open(true);
    this.input.focus();
  };

  Chat.prototype.greet = function () {
    var name = (SITE.profile && SITE.profile.name) || "me";
    var scope = this.opts.project
      ? "Ask me anything about " + this.opts.project.title + "."
      : "Ask about " + name + "'s work, stack or availability.";
    this.say(scope, "bot");
  };

  Chat.prototype.say = function (text, who) {
    var node = document.createElement("div");
    node.className = "chat__msg chat__msg--" + who;
    node.textContent = text;
    this.log.appendChild(node);
    this.scrollToEnd();
    return node;
  };

  Chat.prototype.scrollToEnd = function () {
    this.log.scrollTop = this.log.scrollHeight;
  };

  Chat.prototype.typing = function () {
    var node = document.createElement("div");
    node.className = "chat__msg chat__msg--bot";
    node.innerHTML = '<span class="chat__typing" role="status" aria-label="Thinking"><i></i><i></i><i></i></span>';
    this.log.appendChild(node);
    this.scrollToEnd();
    return node;
  };

  Chat.prototype.ask = function (text) {
    var self = this;
    this.busy = true;
    this.say(text, "user");
    this.history.push({ role: "user", content: text });

    var pending = this.typing();

    this.respond(text)
      .then(function (reply) {
        pending.remove();
        self.say(reply, "bot");
        self.history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        pending.remove();
        var node = self.say("That did not go through. Try again, or email " +
          ((SITE.profile && SITE.profile.email) || "me") + ".", "bot");
        node.className = "chat__msg chat__msg--err";
      })
      .then(function () { self.busy = false; });
  };

  Chat.prototype.respond = function (text) {
    var self = this;

    if (!SITE.chatEndpoint) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(self.localAnswer(text)); }, 350);
      });
    }

    return fetch(SITE.chatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: this.history.slice(-10),
        project: this.opts.project ? this.opts.project.slug : null
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (data) {
      return data.reply || self.localAnswer(text);
    });
  };

  /* Keyword answers drawn from data.js - a useful default until a real
     endpoint is wired up in SITE.chatEndpoint. */
  Chat.prototype.localAnswer = function (text) {
    var q = text.toLowerCase();
    var p = SITE.profile || {};
    var projects = SITE.projects || [];
    var scoped = this.opts.project;

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
      return "Across the projects here: " + all.join(", ") + ".";
    }

    if (/hire|available|open to work|looking|job|role|freelance|contract/.test(q)) {
      return p.contactBlurb || (p.openToWork ? "Yes - open to work." : "Not looking right now.");
    }

    if (/contact|email|reach|hello|touch/.test(q)) {
      return "Email is best: " + (p.email || "see the contact section") +
        (p.github ? ". Code is at " + p.github + "." : ".");
    }

    if (/where|located|location|based|remote|timezone/.test(q)) {
      return (p.name || "I") + " is based in " + (p.location || "see the header") + ".";
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
      return "There are " + projects.length + " builds here: " +
        projects.map(function (proj) { return proj.title + " (" + proj.tags.slice(0, 3).join(", ") + ")"; }).join(" and ") +
        ". Ask about either one.";
    }

    return "I can answer questions about the projects, the stack behind them, and availability. " +
      "For anything else, email " + (p.email || "via the contact section") + ".";
  };

  /* ---------- markup ---------- */

  function template(opts) {
    var suggestions = (SITE.chatSuggestions || []).map(function (s) {
      return '<button type="button" class="pill">' + esc(s) + "</button>";
    }).join("");

    return '' +
      '<section class="chat' + (opts.summoned ? " chat--summoned" : "") + '" data-open="' + (opts.open ? "true" : "false") + '" aria-label="Ask a question">' +
        '<button type="button" class="chat__handle" aria-expanded="' + (opts.open ? "true" : "false") + '" aria-label="Expand or collapse the chat"></button>' +
        '<div class="chat__head">' +
          '<h2 class="h-sub">' + esc(opts.title) + "</h2>" +
          '<span class="chat__status" aria-hidden="true"></span>' +
        "</div>" +
        '<p class="note chat__blurb">' + esc(opts.blurb) + "</p>" +
        '<div class="chat__log" role="log" aria-live="polite" aria-label="Conversation"></div>' +
        (suggestions ? '<div class="chat__suggestions">' + suggestions + "</div>" : "") +
        '<form class="chat__form">' +
          '<label class="sr" for="' + esc(opts.id) + '">Your question</label>' +
          '<input class="chat__input" id="' + esc(opts.id) + '" name="q" type="text" autocomplete="off" placeholder="Type a question…">' +
          '<button class="btn btn--primary chat__send" type="submit" aria-label="Send">↑</button>' +
        "</form>" +
      "</section>";
  }

  window.mountChat = function (container, opts) {
    opts = opts || {};
    var node = window.UI.el(template({
      id: opts.id || "chat-input",
      title: opts.title || "Ask me a question",
      blurb: opts.blurb || "AI trained on my résumé + projects",
      open: !!opts.open,
      summoned: !!opts.summoned
    }));
    container.appendChild(node);
    return new Chat(node, opts);
  };
})();
