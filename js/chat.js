// =============================================================
// CHAT.JS — Actuaries Chat (real-time group chat)
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const notLoggedIn = document.getElementById('notLoggedIn');
  const chatWrap = document.getElementById('chatWrap');
  const messages = document.getElementById('chatMessages');
  const chatEmpty = document.getElementById('chatEmpty');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const roomTabs = document.querySelectorAll('.room-tab');
  const roomTitle = document.getElementById('roomTitle');
  const roomSub = document.getElementById('roomSub');

  if (!messages) return;

  // Check login
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) {
    notLoggedIn.style.display = 'block';
    return;
  }
  chatWrap.style.display = 'block';

  const userId = session.user.id;
  const myName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  let currentRoom = 'general';
  let subscription = null;

  // Cache of profile info for display
  const profileCache = {};

  async function getProfile(userId) {
    if (profileCache[userId]) return profileCache[userId];
    const { data } = await window.sb
      .from('profiles')
      .select('full_name, photo_url, role')
      .eq('id', userId)
      .single();
    const profile = data || { full_name: 'Student', photo_url: null, role: 'Student' };
    profileCache[userId] = profile;
    return profile;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function renderMessages(list) {
    if (!list.length) {
      messages.innerHTML = '';
      messages.appendChild(chatEmpty);
      chatEmpty.style.display = 'flex';
      return;
    }
    chatEmpty.style.display = 'none';

    const items = await Promise.all(list.map(async m => {
      const profile = await getProfile(m.sender_id);
      const mine = m.sender_id === userId;
      const initials = (profile.full_name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
      const avatar = profile.photo_url
        ? `<img src="${profile.photo_url}" alt="${profile.full_name}" />`
        : initials;

      return `
        <div class="chat-msg ${mine ? 'mine' : 'theirs'}">
          <div class="chat-avatar">${avatar}</div>
          <div class="chat-bubble">
            <div class="chat-meta">
              <strong>${escapeHtml(mine ? 'You' : profile.full_name)}</strong>
              <span>${formatTime(m.created_at)}</span>
            </div>
            <div class="chat-text">${escapeHtml(m.body)}</div>
          </div>
        </div>
      `;
    }));

    messages.innerHTML = items.join('');
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadRoom(room) {
    currentRoom = room;
    messages.innerHTML = '<div class="chat-empty"><span>⏳</span><p>Loading messages…</p></div>';

    // Update title
    const titles = {
      general: ['General Chat', 'Open to all Actuarial Science students'],
      L100: ['Level 100 Chat', 'For first-year students'],
      L200: ['Level 200 Chat', 'For second-year students'],
      L300: ['Level 300 Chat', 'For third-year students'],
      L400: ['Level 400 Chat', 'For final-year students']
    };
    roomTitle.textContent = titles[room]?.[0] || room;
    roomSub.textContent = titles[room]?.[1] || '';

    // Tabs
    roomTabs.forEach(t => t.classList.toggle('active', t.dataset.room === room));

    // Fetch messages
    const { data, error } = await window.sb
      .from('chat_messages')
      .select('id, sender_id, body, created_at')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error(error);
      messages.innerHTML = '<div class="chat-empty"><span>⚠️</span><p>Could not load messages.</p></div>';
      return;
    }

    await renderMessages(data || []);

    // Realtime subscription
    if (subscription) {
      window.sb.removeChannel(subscription);
      subscription = null;
    }

    subscription = window.sb
      .channel('chat_' + room)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
        async (payload) => {
          const newMsg = payload.new;
          if (newMsg.sender_id === userId) return; // already shown optimistically
          const profile = await getProfile(newMsg.sender_id);
          const initials = (profile.full_name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
          const avatar = profile.photo_url
            ? `<img src="${profile.photo_url}" alt="${profile.full_name}" />`
            : initials;

          chatEmpty.style.display = 'none';
          const html = `
            <div class="chat-msg theirs">
              <div class="chat-avatar">${avatar}</div>
              <div class="chat-bubble">
                <div class="chat-meta">
                  <strong>${escapeHtml(profile.full_name)}</strong>
                  <span>${formatTime(newMsg.created_at)}</span>
                </div>
                <div class="chat-text">${escapeHtml(newMsg.body)}</div>
              </div>
            </div>
          `;
          messages.insertAdjacentHTML('beforeend', html);
          messages.scrollTop = messages.scrollHeight;
        }
      )
      .subscribe();
  }

  // Send message
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    input.disabled = true;

    // Optimistic UI
    const initials = myName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    const myProfile = await getProfile(userId);
    const avatar = myProfile.photo_url
      ? `<img src="${myProfile.photo_url}" alt="${myName}" />`
      : initials;

    chatEmpty.style.display = 'none';
    const tempHtml = `
      <div class="chat-msg mine pending">
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">
          <div class="chat-meta">
            <strong>You</strong>
            <span>${formatTime(new Date().toISOString())}</span>
          </div>
          <div class="chat-text">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
    messages.insertAdjacentHTML('beforeend', tempHtml);
    messages.scrollTop = messages.scrollHeight;
    input.value = '';

    const { error } = await window.sb
      .from('chat_messages')
      .insert({ room: currentRoom, sender_id: userId, body: text });

    if (error) {
      console.error(error);
      alert('Could not send: ' + error.message);
    } else {
      // Remove pending class
      const last = messages.lastElementChild;
      if (last) last.classList.remove('pending');
    }

    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  });

  // Room tabs
  roomTabs.forEach(tab => {
    tab.addEventListener('click', () => loadRoom(tab.dataset.room));
  });

  // Load default room
   // Attach @-mention autocomplete to the chat input
  if (window.Mentions && window.Mentions.attachAutocomplete) {
    window.Mentions.attachAutocomplete(input);
  }

  await loadRoom('general');
});
});
