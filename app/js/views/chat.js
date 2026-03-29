/* ============================================================
   views/chat.js — Real-time Chat (Public + Private DMs)
   ============================================================ */

window.Views = window.Views || {};

/* ── ChatBadge — global unread counter (module-level) ─────── */
const ChatBadge = {
  _unsub: null,
  _count: 0,

  start() {
    if (this._unsub) return;
    const uid = appState.currentUser?.id;
    if (!uid) return;
    this._unsub = db.collection('chatMessages')
      .orderBy('createdAt', 'desc')
      .limit(300)
      .onSnapshot(snap => {
        this._count = snap.docs.filter(d => {
          const data = d.data();
          return data.senderId !== uid && !(data.readBy || []).includes(uid);
        }).length;
        this.updateBadge();
      }, err => console.warn('[ChatBadge] listener error:', err));
  },

  stop() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    this._count = 0;
    this.updateBadge();
  },

  updateBadge() {
    const badge = document.getElementById('chatSidebarBadge');
    if (!badge) return;
    badge.textContent = this._count > 99 ? '99+' : this._count;
    badge.classList.toggle('hidden', this._count === 0);
  }
};

/* ── Views.Chat ─────────────────────────────────────────────── */
Views.Chat = {

  _activeConvId: 'public',
  _messages: [],
  _unsubListener: null,
  _sending: false,
  _unreadCounts: {},    // { convId: number }

  /* ── Entry / Exit ─────────────────────────────────────────── */
  mount() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    content.style.padding  = '0';
    content.style.overflow = 'hidden';
    content.innerHTML = this._template();
    this._renderConvList();
    this._switchConv(this._activeConvId, false);
    this._bindEvents();
  },

  unmount() {
    this._detachListener();
    const content = document.getElementById('mainContent');
    if (content) {
      content.style.padding  = '';
      content.style.overflow = '';
    }
  },

  /* ── Helpers ──────────────────────────────────────────────── */
  _dmId(otherUid) {
    return [appState.currentUser.id, otherUid].sort().join('_');
  },

  _convLabel(convId) {
    if (convId === 'public') return { name: 'Public Channel', sub: 'All team members', isPublic: true };
    const otherId = convId.split('_').find(id => id !== appState.currentUser.id);
    const other   = appState.users.find(u => u.id === otherId);
    return {
      name:     other ? other.name : 'Unknown User',
      sub:      other ? (CONFIG.ROLES[other.role] || other.role) : '',
      isPublic: false,
      initials: other ? Utils.getInitials(other.name) : '?'
    };
  },

  _conversations() {
    const uid = appState.currentUser.id;
    const others = appState.users
      .filter(u => u.id !== uid)
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { id: 'public' },
      ...others.map(u => ({ id: this._dmId(u.id) }))
    ];
  },

  _fmtTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d)) return '';
    const now  = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : Utils.formatDateTime(d.toISOString());
  },

  _fmtDateSep(ts) {
    if (!ts) return null;
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d)) return null;
    const now  = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  /* ── Template ─────────────────────────────────────────────── */
  _template() {
    return `
      <div class="chat-layout">
        <div class="chat-sidebar" id="chatSidebar">
          <div class="chat-sidebar-header">
            <div class="chat-sidebar-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17" style="vertical-align:-3px;margin-right:6px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Messages
            </div>
          </div>
          <div class="chat-conv-list" id="chatConvList"></div>
        </div>
        <div class="chat-main">
          <div class="chat-header" id="chatHeader"></div>
          <div class="chat-messages" id="chatMessages">
            <div class="chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <div class="chat-empty-title">Loading messages…</div>
            </div>
          </div>
          <div class="chat-input-area">
            <textarea id="chatInput" class="chat-input" placeholder="Type a message… (Enter to send, Shift+Enter for new line)" rows="1" maxlength="2000"></textarea>
            <button id="chatSendBtn" class="chat-send-btn" title="Send (Enter)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /* ── Conversation List ────────────────────────────────────── */
  _renderConvList() {
    const el = document.getElementById('chatConvList');
    if (!el) return;
    const convs = this._conversations();
    el.innerHTML = convs.map(({ id }) => {
      const info    = this._convLabel(id);
      const unread  = this._unreadCounts[id] || 0;
      const isActive = id === this._activeConvId;
      const avatarContent = info.isPublic
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>`
        : Utils.escapeHtml(info.initials || Utils.getInitials(info.name));
      return `
        <div class="chat-conv-item${isActive ? ' active' : ''}" data-conv-id="${id}"
             onclick="Views.Chat._switchConv('${id}')">
          <div class="chat-conv-avatar${info.isPublic ? ' chat-conv-avatar-public' : ''}">${avatarContent}</div>
          <div class="chat-conv-info">
            <div class="chat-conv-name">${Utils.escapeHtml(info.name)}</div>
            <div class="chat-conv-last">${Utils.escapeHtml(info.sub)}</div>
          </div>
          <span class="chat-unread-badge${unread === 0 ? ' hidden' : ''}" id="chatBadge_${id}">${unread > 99 ? '99+' : unread}</span>
        </div>`;
    }).join('');
  },

  /* ── Switch Conversation ──────────────────────────────────── */
  _switchConv(convId, rerender = true) {
    this._activeConvId = convId;

    // Update active state in list
    document.querySelectorAll('.chat-conv-item').forEach(el => {
      el.classList.toggle('active', el.dataset.convId === convId);
    });

    // Update header
    this._renderHeader(convId);

    // Attach real-time listener for this conversation
    this._attachListener(convId);
  },

  _renderHeader(convId) {
    const header = document.getElementById('chatHeader');
    if (!header) return;
    const info = this._convLabel(convId);
    const avatarContent = info.isPublic
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>`
      : Utils.escapeHtml(info.initials || Utils.getInitials(info.name));
    header.innerHTML = `
      <div class="chat-header-avatar${info.isPublic ? ' chat-header-avatar-public' : ''}">${avatarContent}</div>
      <div class="chat-header-info">
        <div class="chat-header-name">${Utils.escapeHtml(info.name)}</div>
        <div class="chat-header-sub">${Utils.escapeHtml(info.sub)}</div>
      </div>
    `;
  },

  /* ── Real-time Listener ───────────────────────────────────── */
  _attachListener(convId) {
    this._detachListener();
    this._messages = [];
    const msgEl = document.getElementById('chatMessages');
    if (msgEl) msgEl.innerHTML = `<div class="chat-empty"><div class="chat-empty-title" style="color:var(--gray-400);font-size:0.857rem">Loading…</div></div>`;

    this._unsubListener = db.collection('chatMessages')
      .where('conversationId', '==', convId)
      .orderBy('createdAt', 'asc')
      .limitToLast(100)
      .onSnapshot(snap => {
        this._messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this._renderMessages();
        this._markRead();
        this._computeUnread(snap);
      }, err => {
        console.error('[Chat] listener error:', err);
        if (msgEl) msgEl.innerHTML = `<div class="chat-empty"><div class="chat-empty-title">Failed to load messages.</div><div class="chat-empty-sub">${Utils.escapeHtml(err.message)}</div></div>`;
      });
  },

  _detachListener() {
    if (this._unsubListener) { this._unsubListener(); this._unsubListener = null; }
  },

  /* ── Render Messages ──────────────────────────────────────── */
  _renderMessages() {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    const uid = appState.currentUser.id;

    if (this._messages.length === 0) {
      el.innerHTML = `
        <div class="chat-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div class="chat-empty-title">No messages yet</div>
          <div class="chat-empty-sub">Be the first to say something!</div>
        </div>`;
      return;
    }

    let lastDateSep = null;
    let lastSenderId = null;
    let lastTs = null;

    const html = this._messages.map((msg, idx) => {
      const isOwn   = msg.senderId === uid;
      const ts      = msg.createdAt;
      const dateSep = this._fmtDateSep(ts);
      let out = '';

      // Date separator
      if (dateSep && dateSep !== lastDateSep) {
        lastDateSep = dateSep;
        out += `<div class="chat-date-sep">${dateSep}</div>`;
        lastSenderId = null; // reset grouping on date change
      }

      // Group consecutive messages from same sender within 5 min
      const isSameSender  = msg.senderId === lastSenderId;
      const tsMs   = ts?.toMillis?.() || 0;
      const lastMs = lastTs?.toMillis?.() || 0;
      const within5Min    = tsMs - lastMs < 5 * 60 * 1000;
      const showAvatar    = !isOwn && (!isSameSender || !within5Min);
      const showSenderName = !isOwn && showAvatar && this._activeConvId === 'public';

      lastSenderId = msg.senderId;
      lastTs       = ts;

      const avatarHtml = isOwn
        ? ''
        : showAvatar
          ? `<div class="chat-avatar-sm" style="background:${this._userColor(msg.senderId)}">${Utils.escapeHtml(Utils.getInitials(msg.senderName))}</div>`
          : `<div class="chat-avatar-sm-placeholder"></div>`;

      const senderHtml = showSenderName
        ? `<span class="chat-bubble-sender">${Utils.escapeHtml(msg.senderName)}</span>`
        : '';

      const timeHtml = `<span class="chat-bubble-time">${this._fmtTime(ts)}</span>`;

      out += `
        <div class="chat-msg-row chat-msg-row-${isOwn ? 'out' : 'in'}">
          ${avatarHtml}
          <div class="chat-bubble chat-bubble-${isOwn ? 'out' : 'in'}">
            ${senderHtml}
            <p class="chat-bubble-text">${Utils.escapeHtml(msg.text)}</p>
            ${timeHtml}
          </div>
        </div>`;
      return out;
    }).join('');

    const wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    el.innerHTML = html;
    if (wasAtBottom || this._messages.length <= 5) {
      el.scrollTop = el.scrollHeight;
    }
  },

  // Deterministic pastel color per user ID for avatars
  _userColor(uid) {
    const colors = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#14B8A6','#F97316','#6366F1'];
    let hash = 0;
    for (let i = 0; i < (uid || '').length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
    return colors[hash % colors.length];
  },

  /* ── Mark Read ────────────────────────────────────────────── */
  _markRead() {
    const uid = appState.currentUser?.id;
    if (!uid) return;
    const unread = this._messages.filter(m => !(m.readBy || []).includes(uid));
    if (!unread.length) return;
    const batch = db.batch();
    unread.slice(0, 20).forEach(m => {
      batch.update(db.collection('chatMessages').doc(m.id), {
        readBy: firebase.firestore.FieldValue.arrayUnion(uid)
      });
    });
    batch.commit().catch(err => console.warn('[Chat] markRead error:', err));
  },

  /* ── Unread Counts (per conversation) ────────────────────── */
  _computeUnread(snap) {
    // Only update count for conversations OTHER than the active one
    // (active one is always marked read immediately)
    // For simplicity, use the ChatBadge global count and set active conv to 0
    this._unreadCounts[this._activeConvId] = 0;
    const badge = document.getElementById(`chatBadge_${this._activeConvId}`);
    if (badge) { badge.textContent = '0'; badge.classList.add('hidden'); }
  },

  /* ── Send Message ─────────────────────────────────────────── */
  async _sendMessage() {
    if (this._sending) return;
    const input = document.getElementById('chatInput');
    const text  = (input?.value || '').trim();
    if (!text) return;

    this._sending = true;
    const btn = document.getElementById('chatSendBtn');
    if (btn) btn.disabled = true;

    try {
      await db.collection('chatMessages').add({
        conversationId: this._activeConvId,
        senderId:       appState.currentUser.id,
        senderName:     appState.currentUser.name,
        text,
        createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
        readBy:         [appState.currentUser.id]
      });
      if (input) { input.value = ''; input.style.height = 'auto'; input.focus(); }
    } catch (err) {
      Toast.error('Failed to send message. Please try again.');
      console.error('[Chat] send error:', err);
    } finally {
      this._sending = false;
      if (btn) btn.disabled = false;
    }
  },

  /* ── Bind Events ──────────────────────────────────────────── */
  _bindEvents() {
    const input = document.getElementById('chatInput');
    const btn   = document.getElementById('chatSendBtn');

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._sendMessage();
        }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
      setTimeout(() => input.focus(), 100);
    }
    if (btn) btn.addEventListener('click', () => this._sendMessage());
  }
};
