/* ============================================================
   auth.js — Authentication & Session Management
   ============================================================ */

const Auth = {

  login(email, password) {
    const users = Storage.getUsers();
    const user = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Store session
    const session = { userId: user.id, role: user.role, loginAt: new Date().toISOString() };
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(session));

    // Update global state
    appState.currentUser = { ...user };

    return { success: true, user };
  },

  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
    appState.currentUser = null;
    appState.currentRoute = 'dashboard';
    resetFilters();
  },

  getCurrentUser() {
    try {
      const session = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION));
      if (!session || !session.userId) return null;
      return Storage.getUserById(session.userId);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  // Returns true for admin AND superadmin (superadmin has all admin privileges)
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
