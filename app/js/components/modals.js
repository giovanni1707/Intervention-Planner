/* ============================================================
   components/modals.js — Modal & Confirm Dialog Management
   ============================================================ */

const Modals = {
  _onCloseCallback: null,

  open(title, bodyHTML, footerHTML = '', options = {}) {
    const overlay   = document.getElementById('modalOverlay');
    const titleEl   = document.getElementById('modalTitle');
    const bodyEl    = document.getElementById('modalBody');
    const footerEl  = document.getElementById('modalFooter');
    const container = document.getElementById('modalContainer');

    titleEl.textContent = title;
    bodyEl.innerHTML    = bodyHTML;
    footerEl.innerHTML  = footerHTML;

    // Adjust modal size
    container.className = 'modal-container';
    if (options.size) container.classList.add('modal-' + options.size);

    overlay.classList.remove('hidden');

    this._onCloseCallback = options.onClose || null;

    if (options.onOpen) {
      setTimeout(() => options.onOpen(), 0);
    }
  },

  close() {
    const overlay  = document.getElementById('modalOverlay');
    const bodyEl   = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');

    overlay.classList.add('hidden');
    bodyEl.innerHTML   = '';
    footerEl.innerHTML = '';

    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }
  },

  confirm(message, title = 'Confirm Action') {
    return new Promise(resolve => {
      const overlay = document.getElementById('confirmOverlay');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl   = document.getElementById('confirmMessage');
      const okBtn   = document.getElementById('confirmOkBtn');
      const cancelBtn = document.getElementById('confirmCancelBtn');

      titleEl.textContent = title;
      msgEl.textContent   = message;
      overlay.classList.remove('hidden');

      const cleanup = () => overlay.classList.add('hidden');

      const onOk = () => {
        cleanup();
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(false);
      };

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  },

  // Bind close button (called from app.js init)
  bindCloseButton() {
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay backdrop click
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }
  }
};
