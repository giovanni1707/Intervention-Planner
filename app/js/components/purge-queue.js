/* ============================================================
   components/purge-queue.js — Background 24-hour purge sweeper
   Runs only for superadmin sessions. Checks every 5 minutes for
   deletedJobs records whose 24-hour window has expired and
   permanently removes them from Firestore.
   ============================================================ */

const PurgeQueue = (() => {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  let _timer = null;

  async function _sweep() {
    if (!Auth.isSuperAdmin()) return;
    try {
      const count = await Storage.sweepExpiredPurgeQueue();
      if (count > 0) {
        console.info(`[PurgeQueue] Permanently removed ${count} expired queued record(s).`);
        // If the deleted-jobs view is currently mounted, refresh it
        if (appState.currentRoute === 'deleted-jobs' && Views.DeletedJobs) {
          await Views.DeletedJobs.mount();
        }
      }
    } catch (e) {
      console.warn('[PurgeQueue] Sweep error:', e);
    }
  }

  return {
    start() {
      if (_timer) return;
      _sweep(); // run immediately on start
      _timer = setInterval(_sweep, INTERVAL_MS);
    },
    stop() {
      if (_timer) { clearInterval(_timer); _timer = null; }
    }
  };
})();
