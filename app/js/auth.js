/* ============================================================
   auth.js — Authentication via Firebase Auth + Firestore profile
   ============================================================ */

const Auth = {

  /**
   * Sign in with Firebase Auth, then load the Firestore user profile.
   * Returns { success, user } or { success: false, error }.
   */
  async login(email, password) {
    try {
      // Apply session persistence preference before signing in
      const sessionMode = (() => {
        try {
          const s = JSON.parse(localStorage.getItem('bps_settings'));
          return (s && s.sessionPersistence === 'session')
            ? firebase.auth.Auth.Persistence.SESSION
            : firebase.auth.Auth.Persistence.LOCAL;
        } catch { return firebase.auth.Auth.Persistence.LOCAL; }
      })();
      await fbAuth.setPersistence(sessionMode);

      const cred = await fbAuth.signInWithEmailAndPassword(
        email.toLowerCase().trim(),
        password
      );
      const uid  = cred.user.uid;
      // Load profile from Firestore users collection (doc ID = Firebase UID)
      const profile = await Storage.getUserById(uid);
      if (!profile) {
        await fbAuth.signOut();
        return { success: false, error: 'User profile not found. Please contact an administrator.' };
      }
      appState.currentUser = { ...profile };
      return { success: true, user: profile };
    } catch (err) {
      let msg = 'Invalid email or password.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Please try again later.';
      if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      return { success: false, error: msg };
    }
  },

  async logout() {
    await fbAuth.signOut();
    appState.currentUser = null;
    appState.currentRoute = 'dashboard';
    resetFilters();
  },

  /**
   * Returns the current Firestore user profile synchronously from appState,
   * or null if not signed in.
   */
  getCurrentUser() {
    return appState.currentUser || null;
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'superadmin');
  },

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'superadmin';
  },

  requireAdmin() {
    return this.isAdmin();
  }
};
