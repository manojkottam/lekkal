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
//    Applied to inputs inside `.field` containers (the standard form pattern across calculators).
//    Skips inputs in custom grid rows (.line-row, .holder-row, .round-row) and any input with data-noinc.
(function () {
  function init() {
    var inputs = document.querySelectorAll(".field input[type=number]:not([data-noinc])");
    inputs.forEach(function (input) {
      if (input.parentNode && input.parentNode.classList.contains("num-wrap")) return;
      // Build wrapper preserving any inline width/margin on the input
      var wrap = document.createElement("div");
      wrap.className = "num-wrap";
      // Transfer top/bottom margin from input → wrap so absolutely-positioned
      // buttons stay anchored to the input visually.
      if (input.style.marginTop)    { wrap.style.marginTop    = input.style.marginTop;    input.style.marginTop = ""; }
      if (input.style.marginBottom) { wrap.style.marginBottom = input.style.marginBottom; input.style.marginBottom = ""; }
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "num-btn num-minus";
      minus.setAttribute("aria-label", "Decrease");
      minus.tabIndex = -1;
      minus.textContent = "−"; // minus sign

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
