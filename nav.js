// Lekkal — shared nav behavior
// Close <details class="nav-dropdown"> menus when clicking outside or hitting Escape.
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
