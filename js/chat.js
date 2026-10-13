// =============================================================
// CHAT.JS — Actuaries Chat (text + voice notes + mentions)
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

  const micBtn = document.getElementById('micBtn');
  const voicePreview = document.getElementById('voicePreview');
  const voiceAudioPreview = document.getElementById('voiceAudioPreview');
  const voiceSend = document.getElementById('voiceSend');
  const voiceCancel = document.getElementById('voiceCancel');
  const voiceTimer = document.getElementById('voiceTimer');
  const recordingIndicator = document.getElementById('recordingIndicator');
  const recTimer = document.getElementById('recTimer');

  if (!messages) return;

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
  const profileCache = {};

  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let recInterval = null;
  let recStartTime = 0;

  async function getProfile(uid) {
    if (profileCache[uid]) return profileCache[uid];
    const { data } = await window.sb
      .from('profiles')
      .select('full_name, photo_url, role')
      .eq('id', uid)
      .single();
    const p = data || { full_name: 'Student', photo_url: null, role: 'Student' };
    profileCache[uid] = p;
    return p;
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  async function buildMessageHtml(m, profile, mine) {
    const initials = (profile.full_name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    const avatar = profile.photo_url
      ? `<img src="${profile.photo_url}" alt="${profile.full_name}" />`
      : initials;

    let content = '';
    if (m.body) {
      let bodyHtml;
      if (window.Mentions && window.Mentions.renderMentions) {
        bodyHtml = await window.Mentions.renderMentions(m.body);
      } else {
        bodyHtml = escapeHtml(m.body);
      }
      content += `<div class="chat-text">${bodyHtml}</div>`;
    }
    if (m.voice_url) {
      content += `
        <div class="voice-note">
          <audio controls preload="metadata" src="${m.voice_url}"></audio>
        </div>
      `;
    }

    return `
      <div class="chat-msg ${mine ? 'mine' : 'theirs'}">
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">
          <div class="chat-meta">
            <strong>${escapeHtml(mine ? 'You' : profile.full_name)}</strong>
            <span>${formatTime(m.created_at)}</span>
          </div>
          ${content}
        </div>
      </div>
    `;
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
      return await buildMessageHtml(m, profile, m.sender_id === userId);
    }));
    messages.innerHTML = items.join('');
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadRoom(room) {
    currentRoom = room;
    messages.innerHTML = '<div class="chat-empty"><span>⏳</span><p>Loading messages…</p></div>';

    const titles = {
      general: ['General Chat', 'Open to all Actuarial Science students'],
      L100: ['Level 100 Chat', 'For first-year students'],
      L200: ['Level 200 Chat', 'For second-year students'],
      L300: ['Level 300 Chat', 'For third-year students'],
      L400: ['Level 400 Chat', 'For final-year students']
    };
    roomTitle.textContent = titles[room]?.[0] || room;
    roomSub.textContent = titles[room]?.[1] || '';
    roomTabs.forEach(t => t.classList.toggle('active', t.dataset.room === room));

    const { data, error } = await window.sb
      .from('chat_messages')
      .select('id, sender_id, body, voice_url, created_at')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error(error);
      messages.innerHTML = '<div class="chat-empty"><span>⚠️</span><p>Could not load messages.</p></div>';
      return;
    }
    await renderMessages(data || []);

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
          if (newMsg.sender_id === userId) return;
          const profile = await getProfile(newMsg.sender_id);
          chatEmpty.style.display = 'none';
          const html = await buildMessageHtml(newMsg, profile, false);
          messages.insertAdjacentHTML('beforeend', html);
          messages.scrollTop = messages.scrollHeight;
        }
      )
      .subscribe();
  }

  // ---- Send text ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    const myProfile = await getProfile(userId);
    const optimistic = {
      sender_id: userId,
      body: text,
      voice_url: null,
      created_at: new Date().toISOString()
    };
    chatEmpty.style.display = 'none';
    const html = await buildMessageHtml(optimistic, myProfile, true);
    messages.insertAdjacentHTML('beforeend', html);
    messages.scrollTop = messages.scrollHeight;
    input.value = '';

    const { error } = await window.sb
      .from('chat_messages')
      .insert({ room: currentRoom, sender_id: userId, body: text });

    if (error) alert('Could not send: ' + error.message);
    sendBtn.disabled = false;
    input.focus();
  });

  // ---- Voice recording ----
  micBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        stream.getTracks().forEach(t => t.stop());
        recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(recordedBlob);
        voiceAudioPreview.src = url;
        voicePreview.style.display = 'block';
        recordingIndicator.style.display = 'none';
        micBtn.classList.remove('recording');
        micBtn.textContent = '🎙️';
        clearInterval(recInterval);
      });

      mediaRecorder.start();
      micBtn.classList.add('recording');
      micBtn.textContent = '⏹';
      recordingIndicator.style.display = 'flex';

      recStartTime = Date.now();
      recTimer.textContent = '0:00';
      voiceTimer.textContent = '0:00';
      recInterval = setInterval(() => {
        const sec = Math.floor((Date.now() - recStartTime) / 1000);
        recTimer.textContent = formatDuration(sec);
        voiceTimer.textContent = formatDuration(sec);
        if (sec >= 120) mediaRecorder.stop();
      }, 500);

    } catch (err) {
      alert('Could not access microphone: ' + err.message);
    }
  });

  voiceCancel.addEventListener('click', () => {
    voicePreview.style.display = 'none';
    recordedBlob = null;
    voiceAudioPreview.src = '';
  });

  voiceSend.addEventListener('click', async () => {
    if (!recordedBlob) return;
    voiceSend.disabled = true;
    voiceSend.textContent = 'Uploading…';
    try {
      const path = `${userId}/${Date.now()}.webm`;
      const { error: uploadErr } = await window.sb.storage
        .from('voice-notes')
        .upload(path, recordedBlob, { contentType: 'audio/webm', cacheControl: '3600' });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = window.sb.storage.from('voice-notes').getPublicUrl(path);
      const voiceUrl = urlData.publicUrl;

      const { error: insertErr } = await window.sb
        .from('chat_messages')
        .insert({ room: currentRoom, sender_id: userId, body: null, voice_url: voiceUrl });
      if (insertErr) throw insertErr;

      const myProfile = await getProfile(userId);
      const optimistic = {
        sender_id: userId,
        body: null,
        voice_url: voiceUrl,
        created_at: new Date().toISOString()
      };
      chatEmpty.style.display = 'none';
      const html = await buildMessageHtml(optimistic, myProfile, true);
      messages.insertAdjacentHTML('beforeend', html);
      messages.scrollTop = messages.scrollHeight;

      voicePreview.style.display = 'none';
      recordedBlob = null;
      voiceAudioPreview.src = '';

    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      voiceSend.disabled = false;
      voiceSend.textContent = 'Send ▶';
    }
  });

  roomTabs.forEach(tab => {
    tab.addEventListener('click', () => loadRoom(tab.dataset.room));
  });

  if (window.Mentions && window.Mentions.attachAutocomplete) {
    window.Mentions.attachAutocomplete(input);
  }

  await loadRoom('general');
});
