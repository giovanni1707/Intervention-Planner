/* ============================================================
   app.js — Application Bootstrap (Firebase Auth)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── 0. APPLY SAVED SETTINGS (theme, font size, colors) ───
  Settings.apply();

  // ── 1. BIND MODAL CLOSE BUTTON ───────────────────────────
  Modals.bindCloseButton();

  // ── 2. KEYBOARD SHORTCUTS ────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modalOverlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        Modals.close();
      }
    }
  });

  // ── 3. FIREBASE AUTH STATE OBSERVER ──────────────────────
  // This fires once on load (with null if not signed in, or user if
  // a previous session is still valid) and again on every login/logout.
  fbAuth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      // Signed in — load profile from Firestore
      try {
        const profile = await _loadProfileWithRetry(firebaseUser.uid);
        if (profile) {
          appState.currentUser = { ...profile };
          await _bootApp();
        } else {
          // Firebase account exists but no Firestore profile — sign out
          await fbAuth.signOut();
          showLogin();
        }
      } catch (err) {
        console.error('[Auth] Failed to load user profile:', err);
        await fbAuth.signOut();
        showLogin();
      }
    } else {
      // Not signed in
      detachListeners();
      appState.currentUser = null;
      showLogin();
    }
  });

  // ── 4. BIND LOGIN FORM ───────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // ── 5. BIND FORGOT PASSWORD ──────────────────────────────
  document.getElementById('forgotPwLink')?.addEventListener('click', () => {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPwPanel').classList.remove('hidden');
    document.getElementById('forgotPwEmail').value = document.getElementById('loginEmail')?.value || '';
    document.getElementById('forgotPwMsg').innerHTML = '';
    document.getElementById('forgotPwEmail').focus();
  });

  document.getElementById('forgotPwBack')?.addEventListener('click', () => {
    document.getElementById('forgotPwPanel').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  });

  document.getElementById('forgotPwBtn')?.addEventListener('click', handleForgotPassword);
  document.getElementById('forgotPwEmail')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleForgotPassword();
  });
});

// ── LOAD PROFILE WITH RETRY (handles Firestore offline at startup) ──
async function _loadProfileWithRetry(uid, retries = 5, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const profile = await Storage.getUserById(uid);
      return profile; // null means no profile doc — don't retry
    } catch (err) {
      const isOffline = err.code === 'unavailable' || (err.message || '').toLowerCase().includes('offline');
      if (!isOffline || i === retries - 1) throw err;
      // Firestore not yet connected — wait then retry
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

// ── BOOT APP (after auth confirmed) ─────────────────────────
async function _bootApp() {
  // Seed demo data once per Firestore (guard inside prevents re-runs)
  try { await seedDemoData(); } catch (e) { console.warn('[Seed] Error:', e); }

  // Attach real-time Firestore listeners — they populate appState live.
  // No initial fetch needed; onSnapshot fires immediately on attach.
  attachListeners();

  showApp();
}

// ── SHOW/HIDE APP ───────────────────────────────────────────
function showApp() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell    = document.getElementById('appShell');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (appShell)    appShell.classList.remove('hidden');

  Sidebar.render();
  GlobalSearch.init();
  Scheduler.start();
  AutoRefresh.start();
  if (typeof ChatBadge !== 'undefined') ChatBadge.start();
  if (Auth.isSuperAdmin()) PurgeQueue.start();

  if (Auth.isAdmin()) {
    setTimeout(() => Views.MaintenanceContracts._checkNotifications(), 800);
  }

  Router.init();
}

function showLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell    = document.getElementById('appShell');

  if (appShell)    appShell.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (typeof ChatBadge !== 'undefined') ChatBadge.stop();

  const errEl = document.getElementById('loginError');
  if (errEl) errEl.classList.add('hidden');

  // Clear form fields so no previous user's credentials remain
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.reset();
    loginForm.classList.remove('hidden');
  }
  const forgotPanel = document.getElementById('forgotPwPanel');
  if (forgotPanel) forgotPanel.classList.add('hidden');

  // Reset login button if it was disabled
  const loginBtn = document.getElementById('loginBtn');
  const btnText  = document.getElementById('loginBtnText');
  if (loginBtn) loginBtn.disabled = false;
  if (btnText)  btnText.textContent = 'Sign In';
}

// ── FORGOT PASSWORD HANDLER ─────────────────────────────────
async function handleForgotPassword() {
  const email  = document.getElementById('forgotPwEmail')?.value.trim().toLowerCase();
  const btn    = document.getElementById('forgotPwBtn');
  const btnTxt = document.getElementById('forgotPwBtnText');
  const msgEl  = document.getElementById('forgotPwMsg');

  msgEl.innerHTML = '';

  if (!email) {
    msgEl.innerHTML = `<div class="login-forgot-msg login-forgot-msg-error">Please enter your email address.</div>`;
    return;
  }

  btn.disabled = true;
  btnTxt.textContent = 'Sending…';

  try {
    await fbAuth.sendPasswordResetEmail(email);
    msgEl.innerHTML = `
      <div class="login-forgot-msg login-forgot-msg-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
        Reset link sent! Check your inbox at <strong>${email}</strong>. The link expires in 1 hour.
      </div>`;
    btn.disabled = false;
    btnTxt.textContent = 'Resend Link';
  } catch (err) {
    let msg = 'Failed to send reset email. Please try again.';
    // Firebase returns auth/user-not-found for unregistered emails.
    // We show a generic success to avoid user enumeration.
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
      msgEl.innerHTML = `
        <div class="login-forgot-msg login-forgot-msg-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
          If an account exists for <strong>${email}</strong>, a reset link has been sent.
        </div>`;
      btn.disabled = false;
      btnTxt.textContent = 'Resend Link';
      return;
    }
    if (err.code === 'auth/too-many-requests') msg = 'Too many requests. Please wait a moment before trying again.';
    msgEl.innerHTML = `<div class="login-forgot-msg login-forgot-msg-error">${msg}</div>`;
    btn.disabled = false;
    btnTxt.textContent = 'Send Reset Link';
  }
}

// ── LOGIN HANDLER ───────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();

  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const loginBtn = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');
  const btnText  = document.getElementById('loginBtnText');

  if (loginBtn) loginBtn.disabled = true;
  if (btnText)  btnText.textContent = 'Signing in…';
  if (errEl)    errEl.classList.add('hidden');

  const result = await Auth.login(email, password);

  if (!result.success) {
    if (errEl) {
      errEl.textContent = result.error;
      errEl.classList.remove('hidden');
    }
    if (loginBtn) loginBtn.disabled = false;
    if (btnText)  btnText.textContent = 'Sign In';
  }
  // On success, onAuthStateChanged fires automatically and calls _bootApp()
}
