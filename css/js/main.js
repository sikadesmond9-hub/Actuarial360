// ===== MOBILE MENU TOGGLE =====
(function() {
  function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav ul');

    if (!toggle || !nav) {
      console.warn('Menu elements not found — check your HTML classes');
      return;
    }

    // Toggle on hamburger click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      nav.classList.toggle('open');
      // Change icon ☰ ↔ ✕
      toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
    });

    // Close when a link is clicked (nice UX on mobile)
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.textContent = '☰';
      });
    });

    // Close when clicking outside the menu
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.textContent = '☰';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }
})();
