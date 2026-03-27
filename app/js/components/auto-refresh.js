/* ============================================================
   components/auto-refresh.js — Periodic View Re-render
   ============================================================
   Fires a view re-render every 5 minutes so all users see
   the latest data written by others without a manual page reload.

   The app already has live Firestore onSnapshot listeners, so data
   is always current in appState. This component only re-renders the
   currently active view so the screen reflects what's in appState.

   SAFE REFRESH — the re-render is silently skipped when:
     1. A modal is open (user may be editing a form inside it).
     2. Any text/number/textarea input or select in the main content
        area currently has focus (user is actively typing).
     3. Auto-refresh is disabled in Settings.

   The user is shown a subtle "Refreshed" toast only when a refresh
   actually fires, so they know the page is up to date.
   ============================================================ */

const AutoRefresh = {

  _INTERVAL_MS: 5 * 60 * 1000,   // 5 minutes
  _intervalId:  null,
  _COUNTDOWN_KEY: 'bps_ar_next',  // timestamp of next scheduled refresh

  // ── LIFECYCLE ──────────────────────────────────────────────

  start() {
    this.stop(); // Clear any existing interval first
    if (!this._isEnabled()) return;
    this._scheduleNext();
    this._intervalId = setInterval(() => this._tick(), this._INTERVAL_MS);
    this._updateIndicator();
  },

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._updateIndicator();
  },

  /** Called by Settings when the toggle changes */
  onSettingChange(enabled) {
    if (enabled) {
      this.start();
      Toast.info('Auto-refresh enabled — view will refresh every 5 minutes', 3500);
    } else {
      this.stop();
      Toast.info('Auto-refresh disabled', 2500);
    }
    this._updateIndicator();
  },

  // ── CORE TICK ──────────────────────────────────────────────

  _tick() {
    if (!this._isEnabled()) {
      this.stop();
      return;
    }

    if (this._isUserBusy()) {
      // Reschedule silently — user is mid-edit, try again next interval
      return;
    }

    this._rerenderCurrentView();
    this._scheduleNext();
    this._updateIndicator();
  },

  _rerenderCurrentView() {
    try {
      Router._rerender();
      Toast.info(
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" style="vertical-align:-2px;margin-right:5px"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.87"/></svg>View refreshed`,
        2200
      );
    } catch (err) {
      console.warn('[AutoRefresh] Re-render error:', err);
    }
  },

  // ── BUSY DETECTION ─────────────────────────────────────────
  // Skip refresh if a modal is open OR if the user is actively typing.

  _isUserBusy() {
    // 1. Modal open?
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && !modalOverlay.classList.contains('hidden')) return true;

    const confirmOverlay = document.getElementById('confirmOverlay');
    if (confirmOverlay && !confirmOverlay.classList.contains('hidden')) return true;

    // 2. Active focus on an input/select/textarea anywhere in the page?
    const active = document.activeElement;
    if (active) {
      const tag = active.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return true;
      if (active.isContentEditable) return true;
    }

    return false;
  },

  // ── HELPERS ────────────────────────────────────────────────

  _isEnabled() {
    return !!(Settings.get().autoRefresh);
  },

  _scheduleNext() {
    const next = Date.now() + this._INTERVAL_MS;
    sessionStorage.setItem(this._COUNTDOWN_KEY, next.toString());
  },

  /** Update the small status indicator in the Settings page if it's visible */
  _updateIndicator() {
    const el = document.getElementById('arStatusIndicator');
    if (!el) return;
    const enabled = this._isEnabled() && this._intervalId !== null;
    el.textContent = enabled ? 'Active — refreshes every 5 minutes' : 'Off';
    el.style.color  = enabled ? 'var(--green)' : 'var(--gray-400)';
  }
};
