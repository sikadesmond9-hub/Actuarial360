// =============================================================
// AUTH.JS — ActuarialUCC
// Updates the nav bar on every page based on login state.
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.sb) return; // Supabase not loaded on this page

  const navUl = document.querySelector('.nav ul');
  if (!navUl) return;

  const { data: { session } } = await window.sb.auth.getSession();

  const loginLink = navUl.querySelector('a[href="login.html"]');
  const registerLink = navUl.querySelector('a[href="register.html"]');

  if (session) {
    // User is logged in
    const name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
    const firstName = name.split(' ')[0];

    if (loginLink) {
      loginLink.textContent = '👤 ' + firstName;
      loginLink.href = 'students.html';
      loginLink.classList.remove('btn-outline');
    }

    if (registerLink) {
      registerLink.textContent = 'Logout';
      registerLink.href = '#';
      registerLink.classList.remove('btn-primary');
      registerLink.classList.add('btn-outline');
      registerLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.sb.auth.signOut();
        window.location.reload();
      });
    }
  }
});
