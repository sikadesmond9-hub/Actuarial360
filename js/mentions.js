// =============================================================
// MENTIONS.JS — ActuarialUCC
// @-mentions autocomplete + rendering for chat messages
// =============================================================

(function() {
  let allUsers = null;

  // ---- Load all users once ----
  async function loadUsers() {
    if (allUsers) return allUsers;
    try {
      const { data, error } = await window.sb
        .from('profiles')
        .select('id, full_name, photo_url, level, role')
        .order('full_name', { ascending: true });
      if (error) throw error;
      allUsers = data || [];
    } catch (e) {
      console.warn('Mentions: could not load users', e);
      allUsers = [];
    }
    return allUsers;
  }

  // ---- Escape ----
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  // ---- Escape regex ----
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ---- Render mentions inside a text string ----
  async function renderMentions(text) {
    if (!text) return '';
    const users = await loadUsers();
    if (!users.length) return escapeHtml(text);

    // Sort longest names first so "@Kofi Mensah" matches before "@Kofi"
    const sorted = [...users].sort((a, b) => (b.full_name || '').length - (a.full_name || '').length);

    let html = escapeHtml(text);
    sorted.forEach(u => {
      if (!u.full_name) return;
      const pattern = new RegExp('@' + escapeRegex(u.full_name), 'g');
      html = html.replace(
        pattern,
        `<a class="mention" href="students.html" data-id="${u.id}">@${escapeHtml(u.full_name)}</a>`
      );
    });

    return html;
  }

  // ---- Autocomplete dropdown for an input ----
  function attachAutocomplete(inputEl) {
    if (!inputEl) return;

    // Create dropdown element
    const dropdown = document.createElement('div');
    dropdown.className = 'mention-dropdown';
    dropdown.style.display = 'none';
    inputEl.parentElement.style.position = 'relative';
    inputEl.parentElement.appendChild(dropdown);

    let currentMatches = [];
    let selectedIndex = 0;

    function closeDropdown() {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      currentMatches = [];
    }

    function getCurrentQuery() {
      const val = inputEl.value;
      const pos = inputEl.selectionStart;
      const before = val.slice(0, pos);
      const at = before.lastIndexOf('@');
      if (at === -1) return null;
      // Must be at start or preceded by whitespace
      if (at > 0 && !/\s/.test(before[at - 1])) return null;
      const query = before.slice(at + 1);
      // Stop if query contains whitespace beyond the first name char
      if (query.length > 30) return null;
      return { at, query };
    }

    async function updateMatches() {
      const ctx = getCurrentQuery();
      if (!ctx) { closeDropdown(); return; }

      const users = await loadUsers();
      const q = ctx.query.toLowerCase();
      currentMatches = users
        .filter(u => u.full_name && u.full_name.toLowerCase().includes(q))
        .slice(0, 8);

      if (!currentMatches.length) { closeDropdown(); return; }

      selectedIndex = 0;
      dropdown.innerHTML = currentMatches.map((u, i) => {
        const initials = u.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const avatar = u.photo_url
          ? `<img src="${u.photo_url}" alt="" />`
          : `<span>${initials}</span>`;
        return `
          <div class="mention-option ${i === 0 ? 'selected' : ''}" data-index="${i}">
            <div class="mention-avatar">${avatar}</div>
            <div>
              <div class="mention-name">${escapeHtml(u.full_name)}</div>
              <div class="mention-meta">Level ${u.level || '—'}${u.role && u.role !== 'Student' ? ' · ' + u.role : ''}</div>
            </div>
          </div>
        `;
      }).join('');
      dropdown.style.display = 'block';
    }

    function insertMention(user) {
      const ctx = getCurrentQuery();
      if (!ctx) return;
      const val = inputEl.value;
      const before = val.slice(0, ctx.at);
      const after = val.slice(inputEl.selectionStart);
      inputEl.value = `${before}@${user.full_name} ${after}`;
      const newPos = before.length + user.full_name.length + 2;
      inputEl.setSelectionRange(newPos, newPos);
      closeDropdown();
      inputEl.focus();
    }

    inputEl.addEventListener('input', updateMatches);
    inputEl.addEventListener('click', updateMatches);

    inputEl.addEventListener('keydown', (e) => {
      if (dropdown.style.display === 'none') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, currentMatches.length - 1);
        updateSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelected();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (currentMatches[selectedIndex]) insertMention(currentMatches[selectedIndex]);
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    function updateSelected() {
      const opts = dropdown.querySelectorAll('.mention-option');
      opts.forEach((o, i) => o.classList.toggle('selected', i === selectedIndex));
    }

    dropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.mention-option');
      if (!opt) return;
      const idx = parseInt(opt.dataset.index, 10);
      if (currentMatches[idx]) insertMention(currentMatches[idx]);
    });

    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
    });
  }

  // ---- Expose to other scripts ----
  window.Mentions = {
    renderMentions,
    attachAutocomplete,
    loadUsers
  };
})();
