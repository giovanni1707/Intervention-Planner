/* ============================================================
   views/chat.js — Real-time Chat (Public + Private DMs)
   ============================================================ */

window.Views = window.Views || {};

/* ── ChatBadge — global unread counter + per-conv counts ───── */
const ChatBadge = {
  _unsub: null,
  _total: 0,
  _perConv: {},   // { convId: count }

  start() {
    if (this._unsub) return;
    const uid = appState.currentUser?.id;
    if (!uid) return;
    this._unsub = db.collection('chatMessages')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .onSnapshot(snap => {
        const uid2 = appState.currentUser?.id;
        if (!uid2) return;
        const perConv = {};
        let total = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.senderId === uid2) return;              // own messages never count
          if ((data.readBy || []).includes(uid2)) return;  // already read
          const cid = data.conversationId;
          // Only count public channel OR a DM that involves this user
          if (cid !== 'public' && !cid.split('_').includes(uid2)) return;
          perConv[cid] = (perConv[cid] || 0) + 1;
          total++;
        });
        this._total  = total;
        this._perConv = perConv;
        this.updateBadge();
        if (typeof Views.Chat !== 'undefined') Views.Chat._updateConvBadges();
      }, err => console.warn('[ChatBadge] listener error:', err));
  },

  stop() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    this._total  = 0;
    this._perConv = {};
    this.updateBadge();
  },

  updateBadge() {
    const badge = document.getElementById('chatSidebarBadge');
    if (!badge) return;
    const count = this._total;
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.toggle('hidden', count === 0);
  },

  getConvCount(convId) {
    return this._perConv[convId] || 0;
  }
};

/* ── Views.Chat ─────────────────────────────────────────────── */
Views.Chat = {

  _activeConvId: 'public',
  _messages: [],
  _unsubListener: null,
  _sending: false,
  // convIds hidden by current user (soft-delete): stored in localStorage
  _hiddenKey: null,

  /* ── Entry / Exit ─────────────────────────────────────────── */
  mount() {
    const content = document.getElementById('mainContent');
    if (!content) return;
    this._hiddenKey = `bps_chat_hidden_${appState.currentUser?.id}`;
    content.style.padding  = '0';
    content.style.overflow = 'hidden';
    content.innerHTML = this._template();
    this._renderConvList();
    this._switchConv(this._activeConvId);
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

  /* ── Hidden (soft-deleted) conversations ─────────────────── */
  _getHidden() {
    try { return JSON.parse(localStorage.getItem(this._hiddenKey)) || []; }
    catch { return []; }
  },
  _setHidden(arr) {
    localStorage.setItem(this._hiddenKey, JSON.stringify(arr));
  },
  _hideConv(convId) {
    const h = this._getHidden();
    if (!h.includes(convId)) { h.push(convId); this._setHidden(h); }
  },
  // Unhide when a new message arrives in a hidden conversation
  _unhideConv(convId) {
    const h = this._getHidden().filter(id => id !== convId);
    this._setHidden(h);
  },

  /* ── Hidden (soft-deleted) messages (per user, localStorage) ── */
  _getMsgHiddenKey() {
    return `bps_chat_msghidden_${appState.currentUser?.id}`;
  },
  _getHiddenMsgs() {
    try { return JSON.parse(localStorage.getItem(this._getMsgHiddenKey())) || []; }
    catch { return []; }
  },
  _hideMsg(msgId) {
    const h = this._getHiddenMsgs();
    if (!h.includes(msgId)) {
      h.push(msgId);
      localStorage.setItem(this._getMsgHiddenKey(), JSON.stringify(h));
    }
  },
  _isMsgHidden(msgId) {
    return this._getHiddenMsgs().includes(msgId);
  },

  /* ── Helpers ──────────────────────────────────────────────── */
  _dmId(otherUid) {
    return [appState.currentUser.id, otherUid].sort().join('_');
  },

  _convLabel(convId) {
    if (convId === 'public') return { name: 'Public Channel', sub: 'All team members', isPublic: true };
    const uid     = appState.currentUser.id;
    const otherId = convId.split('_').find(id => id !== uid);
    const other   = appState.users.find(u => u.id === otherId);
    return {
      name:     other ? other.name : 'Unknown User',
      sub:      other ? (CONFIG.ROLES[other.role] || other.role) : '',
      isPublic: false,
      initials: other ? Utils.getInitials(other.name) : '?'
    };
  },

  _conversations() {
    const uid    = appState.currentUser.id;
    const hidden = this._getHidden();
    const others = appState.users
      .filter(u => u.id !== uid)
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { id: 'public' },
      ...others.map(u => ({ id: this._dmId(u.id) }))
    ].filter(c => !hidden.includes(c.id));
  },

  _fmtTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d)) return '';
    const now = new Date();
    return d.toDateString() === now.toDateString()
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
    if (convs.length === 0) {
      el.innerHTML = `<div style="padding:20px 16px;font-size:0.786rem;color:var(--gray-400);text-align:center">No conversations</div>`;
      return;
    }
    el.innerHTML = convs.map(({ id }) => {
      const info    = this._convLabel(id);
      const unread  = ChatBadge.getConvCount(id);
      const isActive = id === this._activeConvId;
      const otherUserId  = !info.isPublic ? id.split('_').find(x => x !== appState.currentUser.id) : null;
      const otherUser    = otherUserId ? appState.users.find(u => u.id === otherUserId) : null;
      const avatarContent = info.isPublic
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>`
        : Utils.userAvatarHtml(otherUser || { name: info.name });
      const convAvatarBg = info.isPublic ? '' : (otherUser?.photoURL ? 'background:transparent;padding:0;overflow:hidden' : `background:${this._userColor(id)}`);
      return `
        <div class="chat-conv-item${isActive ? ' active' : ''}" data-conv-id="${Utils.escapeHtml(id)}">
          <div class="chat-conv-avatar${info.isPublic ? ' chat-conv-avatar-public' : ''}" style="${convAvatarBg}"
               onclick="Views.Chat._switchConv('${id}')">${avatarContent}</div>
          <div class="chat-conv-info" onclick="Views.Chat._switchConv('${id}')">
            <div class="chat-conv-name">${Utils.escapeHtml(info.name)}</div>
            <div class="chat-conv-last">${Utils.escapeHtml(info.sub)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
            <span class="chat-unread-badge${unread === 0 ? ' hidden' : ''}" id="chatBadge_${id.replace(/_/g,'__')}">${unread > 99 ? '99+' : unread}</span>
          </div>
        </div>`;
    }).join('');
  },

  /* ── Update per-conv unread badges (called by ChatBadge) ──── */
  _updateConvBadges() {
    // Update sidebar main badge
    ChatBadge.updateBadge();

    // Update per-conversation badges in conv list
    document.querySelectorAll('.chat-conv-item').forEach(item => {
      const convId = item.dataset.convId;
      if (!convId) return;
      const count  = ChatBadge.getConvCount(convId);
      const badge  = item.querySelector('.chat-unread-badge');
      if (!badge) return;
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.toggle('hidden', count === 0);

      // Bold conv name when unread
      const nameEl = item.querySelector('.chat-conv-name');
      if (nameEl) nameEl.style.fontWeight = count > 0 ? '700' : '600';
    });

    // Zero out active conversation badge immediately
    const activeBadgeId = `chatBadge_${this._activeConvId.replace(/_/g,'__')}`;
    const activeBadge = document.getElementById(activeBadgeId);
    if (activeBadge) { activeBadge.textContent = '0'; activeBadge.classList.add('hidden'); }
  },

  /* ── Switch Conversation ──────────────────────────────────── */
  _switchConv(convId) {
    // Unhide if re-opening a hidden conv via direct call
    this._unhideConv(convId);
    this._activeConvId = convId;

    document.querySelectorAll('.chat-conv-item').forEach(el => {
      el.classList.toggle('active', el.dataset.convId === convId);
    });

    this._renderHeader(convId);
    this._attachListener(convId);
  },

  _renderHeader(convId) {
    const header = document.getElementById('chatHeader');
    if (!header) return;
    const info = this._convLabel(convId);
    const hOtherUserId = !info.isPublic ? convId.split('_').find(x => x !== appState.currentUser.id) : null;
    const hOtherUser   = hOtherUserId ? appState.users.find(u => u.id === hOtherUserId) : null;
    const avatarContent = info.isPublic
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>`
      : Utils.userAvatarHtml(hOtherUser || { name: info.name });
    const avatarBg = info.isPublic ? '' : (hOtherUser?.photoURL ? 'background:transparent;padding:0;overflow:hidden' : `background:${this._userColor(convId)}`);
    header.innerHTML = `
      <div class="chat-header-avatar${info.isPublic ? ' chat-header-avatar-public' : ''}" style="${avatarBg}">${avatarContent}</div>
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

        // If a new message arrives in a hidden conv, unhide it
        const latestMsg = this._messages[this._messages.length - 1];
        if (latestMsg && latestMsg.senderId !== appState.currentUser.id) {
          this._unhideConv(convId);
        }

        this._renderMessages();
        this._markRead(convId);
        // Zero this conv's badge immediately in conv list
        this._updateConvBadges();
      }, err => {
        console.error('[Chat] listener error:', err);
        if (msgEl) msgEl.innerHTML = `<div class="chat-empty"><div class="chat-empty-title">Failed to load messages.</div><div class="chat-empty-sub">${Utils.escapeHtml(err.message)}</div></div>`;
      });
  },

  _detachListener() {
    if (this._unsubListener) { this._unsubListener(); this._unsubListener = null; }
  },

  /* ── Delete Individual Message ───────────────────────────── */
  _confirmDeleteMsg(msgId) {
    const msg = this._messages.find(m => m.id === msgId);
    if (!msg) return;
    const uid    = appState.currentUser.id;
    const isOwn  = msg.senderId === uid;

    const text = isOwn
      ? 'Delete this message? It will be removed for everyone in this conversation.'
      : 'Hide this message from your view?';

    Modals.confirm(text, 'Delete Message?').then(confirmed => {
      if (!confirmed) return;
      if (isOwn) {
        // Hard delete from Firestore — removes for all participants
        db.collection('chatMessages').doc(msgId).delete()
          .catch(err => {
            console.error('[Chat] delete msg error:', err);
            Toast.error('Failed to delete message.');
          });
        // Snapshot listener will re-render automatically
      } else {
        // Soft-delete locally for this user only
        this._hideMsg(msgId);
        this._renderMessages();
      }
    });
  },

  /* ── Render Messages ──────────────────────────────────────── */
  _renderMessages() {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    const uid = appState.currentUser.id;

    // Filter out locally hidden messages
    const visible = this._messages.filter(m => !this._isMsgHidden(m.id));

    if (visible.length === 0) {
      el.innerHTML = `
        <div class="chat-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <div class="chat-empty-title">No messages yet</div>
          <div class="chat-empty-sub">Be the first to say something!</div>
        </div>`;
      return;
    }

    let lastDateSep  = null;
    let lastSenderId = null;
    let lastTs       = null;

    // For DMs only: find the id of the last own message that has been read by the other party
    const isDm = this._activeConvId !== 'public';
    const otherId = isDm
      ? this._activeConvId.split('_').find(id => id !== uid)
      : null;
    // Walk backwards to find the last message sent by me that the other user has read
    let lastReadByOtherMsgId = null;
    if (isDm && otherId) {
      for (let i = visible.length - 1; i >= 0; i--) {
        const m = visible[i];
        if (m.senderId === uid && (m.readBy || []).includes(otherId)) {
          lastReadByOtherMsgId = m.id;
          break;
        }
      }
    }

    const html = visible.map(msg => {
      const isOwn   = msg.senderId === uid;
      const ts      = msg.createdAt;
      const dateSep = this._fmtDateSep(ts);
      let out = '';

      if (dateSep && dateSep !== lastDateSep) {
        lastDateSep  = dateSep;
        out += `<div class="chat-date-sep">${dateSep}</div>`;
        lastSenderId = null;
      }

      const isSameSender = msg.senderId === lastSenderId;
      const tsMs         = ts?.toMillis?.() || 0;
      const lastMs       = lastTs?.toMillis?.() || 0;
      const within5Min   = tsMs - lastMs < 5 * 60 * 1000;
      const showAvatar   = !isOwn && (!isSameSender || !within5Min);
      const showName     = !isOwn && showAvatar && this._activeConvId === 'public';

      lastSenderId = msg.senderId;
      lastTs       = ts;

      const senderUser  = appState.users.find(u => u.id === msg.senderId);
      const senderPhoto = senderUser?.photoURL;
      const avatarHtml  = isOwn ? ''
        : showAvatar
          ? `<div class="chat-avatar-sm" style="${senderPhoto ? 'background:transparent;padding:0;overflow:hidden' : `background:${this._userColor(msg.senderId)}`}">${Utils.userAvatarHtml(senderUser || { name: msg.senderName })}</div>`
          : `<div class="chat-avatar-sm-placeholder"></div>`;

      const deleteBtn = `
        <button class="chat-msg-delete-btn" title="${isOwn ? 'Delete for everyone' : 'Hide message'}"
                onclick="Views.Chat._confirmDeleteMsg('${msg.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>`;

      // Read receipt: show "Seen" only under the last own message the other party has read
      const showSeen = isDm && isOwn && msg.id === lastReadByOtherMsgId;
      const seenHtml = showSeen ? `
        <div class="chat-seen-receipt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" style="margin-left:-6px"><polyline points="20 6 9 17 4 12"/></svg>
          Seen
        </div>` : '';

      out += `
        <div class="chat-msg-row chat-msg-row-${isOwn ? 'out' : 'in'}">
          ${avatarHtml}
          <div class="chat-msg-wrap">
            <div class="chat-bubble chat-bubble-${isOwn ? 'out' : 'in'}">
              ${showName ? `<span class="chat-bubble-sender">${Utils.escapeHtml(msg.senderName)}</span>` : ''}
              <p class="chat-bubble-text">${Utils.escapeHtml(msg.text)}</p>
              <span class="chat-bubble-time">${this._fmtTime(ts)}</span>
            </div>
            ${deleteBtn}
          </div>
        </div>
        ${seenHtml}`;
      return out;
    }).join('');

    const wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    el.innerHTML = html;
    if (wasAtBottom || visible.length <= 5) el.scrollTop = el.scrollHeight;
  },

  _userColor(uid) {
    const colors = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#14B8A6','#F97316','#6366F1'];
    let hash = 0;
    for (let i = 0; i < (uid || '').length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
    return colors[hash % colors.length];
  },

  /* ── Mark Read ────────────────────────────────────────────── */
  _markRead(convId) {
    const uid = appState.currentUser?.id;
    if (!uid) return;
    const unread = this._messages.filter(m => !(m.readBy || []).includes(uid));
    if (!unread.length) return;

    // Optimistically clear this conv from ChatBadge immediately
    const cleared = ChatBadge._perConv[convId] || 0;
    if (cleared > 0) {
      delete ChatBadge._perConv[convId];
      ChatBadge._total = Math.max(0, ChatBadge._total - cleared);
      ChatBadge.updateBadge();
    }

    // Firestore batches are limited to 500 writes — chunk if needed
    const chunkSize = 400;
    for (let i = 0; i < unread.length; i += chunkSize) {
      const batch = db.batch();
      unread.slice(i, i + chunkSize).forEach(m => {
        batch.update(db.collection('chatMessages').doc(m.id), {
          readBy: firebase.firestore.FieldValue.arrayUnion(uid)
        });
      });
      batch.commit().catch(err => console.warn('[Chat] markRead error:', err));
    }
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
      // Sending to a conv re-shows it for both parties
      this._unhideConv(this._activeConvId);
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
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendMessage(); }
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
