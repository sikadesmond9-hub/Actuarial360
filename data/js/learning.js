// ===== LEARNING HUB — MENTORS & LECTURERS =====
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('mentorGrid');
  const emptyState = document.getElementById('mentorEmpty');
  const countEl = document.getElementById('mentorCount');
  const searchInput = document.getElementById('mentorSearch');
  const tabs = document.querySelectorAll('#roleTabs .level-tab');

  if (!grid) return;

  let allMentors = [];
  let currentRole = 'all';
  let currentSearch = '';

  try {
    const res = await fetch('data/mentors.json');
    if (!res.ok) throw new Error('Failed to load mentors.json');
    allMentors = await res.json();
  } catch (err) {
    console.warn('Mentors load error:', err);
    allMentors = [];
  }

  function render() {
    const filtered = allMentors.filter(m => {
      const roleMatch = currentRole === 'all' || m.role === currentRole;
      const q = currentSearch.trim().toLowerCase();
      const searchMatch = !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (Array.isArray(m.subjects) && m.subjects.some(s => s.toLowerCase().includes(q)));
      return roleMatch && searchMatch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      countEl.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'person' : 'people'} found`;

    grid.innerHTML = filtered.map(m => {
      const initials = (m.name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      const subjects = Array.isArray(m.subjects) ? m.subjects : [];
      const email = m.email || '';
      const phone = m.phone || '';

      const actions = [
        email ? `<a class="btn-primary small" href="mailto:${email}?subject=Learning%20Hub%20—%20Question">✉️ Email</a>` : '',
        phone ? `<a class="btn-outline" href="tel:${phone}">📞 Call</a>` : ''
      ].filter(Boolean).join('');

      return `
        <article class="mentor-card">
          <div class="mentor-avatar">${initials}</div>
          <div class="mentor-body">
            <h3>${m.name || 'Unnamed'}</h3>
            <p class="mentor-role">${m.role || '—'}${m.title ? ` · ${m.title}` : ''}</p>
            ${m.bio ? `<p class="mentor-bio">${m.bio}</p>` : ''}
            ${subjects.length ? `<div class="mentor-tags">${subjects.map(s => `<span>${s}</span>`).join('')}</div>` : ''}
            ${actions ? `<div class="mentor-actions">${actions}</div>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRole = tab.dataset.role;
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      render();
    });
  }

  render();
});
