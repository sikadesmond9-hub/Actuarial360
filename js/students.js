// =============================================================
// STUDENTS.JS — ActuarialUCC
// Pulls student list from Supabase profiles table
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('studentGrid');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const countEl = document.getElementById('studentCount');
  const searchInput = document.getElementById('studentSearch');
  const tabs = document.querySelectorAll('#levelTabs .level-tab');

  if (!grid) return;

  let allStudents = [];
  let currentLevel = 'all';
  let currentSearch = '';

  // ---- Load profiles from Supabase ----
  try {
    const { data, error } = await window.sb
      .from('profiles')
      .select('full_name, student_id, level, role, bio, interests, photo_url, created_at')
      .order('level', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;
    allStudents = data || [];
  } catch (err) {
    console.error('Supabase error:', err);
    allStudents = [];
  }

  loadingState.style.display = 'none';

  // ---- Render ----
  function render() {
    const filtered = allStudents.filter(s => {
      const levelMatch = currentLevel === 'all' || String(s.level) === String(currentLevel);
      const q = currentSearch.trim().toLowerCase();
      const searchMatch = !q ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.student_id && String(s.student_id).toLowerCase().includes(q));
      return levelMatch && searchMatch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      countEl.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    countEl.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''} found`;

    grid.innerHTML = filtered.map(s => {
      const initials = (s.full_name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      const interests = Array.isArray(s.interests) ? s.interests : [];
      const avatarInner = s.photo_url
        ? `<img src="${s.photo_url}" alt="${s.full_name}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" />`
        : initials;

      return `
        <article class="student-card">
          <div class="student-avatar">${avatarInner}</div>
          <div class="student-body">
            <h3>${s.full_name || 'Unnamed Student'}</h3>
            ${s.level ? `<p class="student-level">Level ${s.level}</p>` : ''}
            ${s.role && s.role !== 'Student' ? `<p class="student-level" style="background:#dbeafe;color:#1e40af;">${s.role}</p>` : ''}
            ${s.student_id ? `<p class="student-id">ID: ${s.student_id}</p>` : ''}
            ${s.bio ? `<p class="student-bio">${s.bio}</p>` : ''}
            ${interests.length ? `
              <div class="student-tags">
                ${interests.map(t => `<span>${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // ---- Filters ----
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentLevel = tab.dataset.level;
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
