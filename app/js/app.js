/* ============================================================
   app.js — Application Bootstrap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── 0. APPLY SAVED SETTINGS (theme, font size, colors) ───
  Settings.apply();

  // ── 1. SEED DEMO DATA (first run only) ───────────────────
  seedDemoData();

  // ── 2. BIND MODAL CLOSE BUTTON ───────────────────────────
  Modals.bindCloseButton();

  // ── 3. CHECK EXISTING SESSION ────────────────────────────
  const user = Auth.getCurrentUser();
  if (user) {
    appState.currentUser = user;
    showApp();
  } else {
    showLogin();
  }

  // ── 4. BIND LOGIN FORM ───────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // ── 5. KEYBOARD SHORTCUTS ────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modalOverlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        Modals.close();
      }
    }
  });
});

// ── SHOW/HIDE APP ───────────────────────────────────────────
function showApp() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell    = document.getElementById('appShell');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (appShell)    appShell.classList.remove('hidden');

  // Load all data from localStorage into reactive state
  loadStateFromStorage();

  // Render sidebar
  Sidebar.render();

  // Start scheduling alerts monitor
  Scheduler.start();

  // Start router (triggers first view render)
  const user = appState.currentUser;
  if (user && user.role === 'technician') {
    // Technicians go directly to their interventions
    // Pre-filter by their ID
    appState.filters.technicianId = user.id;
    Router.init();
  } else {
    Router.init();
  }
}

function showLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell    = document.getElementById('appShell');

  if (appShell)    appShell.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');

  // Clear any login error
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.classList.add('hidden');
}

// ── LOGIN HANDLER ───────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();

  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const loginBtn = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');
  const btnText  = document.getElementById('loginBtnText');

  // Loading state
  if (loginBtn) loginBtn.disabled = true;
  if (btnText)  btnText.textContent = 'Signing in…';
  if (errEl)    errEl.classList.add('hidden');

  // Small delay for UX feel
  setTimeout(() => {
    const result = Auth.login(email, password);

    if (result.success) {
      showApp();
    } else {
      if (errEl) {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
      }
      if (loginBtn) loginBtn.disabled = false;
      if (btnText)  btnText.textContent = 'Sign In';
    }
  }, 300);
}
