// Lekkal — shared nav + form behavior

// 1) Close <details class="nav-dropdown"> menus when clicking outside or hitting Escape.
(function () {
  document.addEventListener("click", function (e) {
    document.querySelectorAll("details.nav-dropdown[open]").forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll("details.nav-dropdown[open]").forEach(function (d) {
        d.removeAttribute("open");
      });
    }
  });
})();

// 2) Replace native number-input spin buttons with custom +/- controls.
(function () {
  function init() {
    var inputs = document.querySelectorAll("input[type=number]:not([data-noinc])");
    inputs.forEach(function (input) {
      if (input.parentNode && input.parentNode.classList.contains("num-wrap")) return;
      var tight = !!input.closest(".holder-row, .round-row, .line-row");
      var wrap = document.createElement("div");
      wrap.className = "num-wrap" + (tight ? " num-wrap--tight" : "");
      if (input.style.marginTop)    { wrap.style.marginTop    = input.style.marginTop;    input.style.marginTop = ""; }
      if (input.style.marginBottom) { wrap.style.marginBottom = input.style.marginBottom; input.style.marginBottom = ""; }
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "num-btn num-minus";
      minus.setAttribute("aria-label", "Decrease");
      minus.tabIndex = -1;
      minus.textContent = "−";

      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "num-btn num-plus";
      plus.setAttribute("aria-label", "Increase");
      plus.tabIndex = -1;
      plus.textContent = "+";

      function fire() {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      plus.addEventListener("click", function () { input.stepUp(); fire(); });
      minus.addEventListener("click", function () { input.stepDown(); fire(); });

      wrap.appendChild(plus);
      wrap.appendChild(minus);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// 3) Wire up lead-capture forms — POST to /api/subscribe, show success state, handle errors gracefully.
(function () {
  function init() {
    document.querySelectorAll(".lc-form").forEach(function (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var card  = form.closest(".lc-card");
        var btn   = form.querySelector("button[type=submit]");
        var input = form.querySelector("input[type=email]");
        var origLabel = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Sending…";

        try {
          var res = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { "Accept": "application/json" },
          });
          var body = {};
          try { body = await res.json(); } catch (_) {}

          if (res.ok && body.ok !== false) {
            // Success — show the thank-you state
            card.classList.add("sent");
          } else {
            btn.disabled = false;
            btn.textContent = "Try again";
            var msg = (body && body.error) || "Something went wrong. Please try again.";
            // Inline error message under the form
            var existing = card.querySelector(".lc-error");
            if (existing) existing.remove();
            var p = document.createElement("p");
            p.className = "lc-error";
            p.style.cssText = "color:var(--danger);font-size:12px;margin:8px 0 0;grid-column:1 / -1;";
            p.textContent = msg;
            card.appendChild(p);
            input.focus();
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = origLabel;
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
