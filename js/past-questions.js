// =============================================================
// PAST-QUESTIONS.JS — ActuarialUCC
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('pqGrid');
  const empty = document.getElementById('pqEmpty');
  const loading = document.getElementById('pqLoading');
  const countEl = document.getElementById('pqCount');
  const searchInput = document.getElementById('pqSearch');
  const levelTabs = document.querySelectorAll('#levelTabs .level-tab');
  const yearFilter = document.getElementById('yearFilter');
  const loginNotice = document.getElementById('loginNotice');

  if (!grid) return;

  let all = [];
  let currentLevel = 'all';
  let currentYear = '';
  let currentSearch = '';
  let isLoggedIn = false;

  // Check login
  const { data: { session } } = await window.sb.auth.getSession();
  isLoggedIn = !!session;
  if (!isLoggedIn) loginNotice.style.display = 'block';

  try {
    const { data, error } = await window.sb
      .from('past_questions')
      .select('id, course_code, course_title, level, exam_year, semester, description, file_url, downloads, created_at')
      .order('exam_year', { ascending: false })
      .order('course_code', { ascending: true });

    if (error) throw error;
    all = data || [];
  } catch (err) {
    console.error(err);
    all = [];
  }

  loading.style.display = 'none';

  // Populate year filter
  const years = [...new Set(all.map(p => p.exam_year).filter(Boolean))].sort((a,b) => b - a);
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearFilter.appendChild(opt);
  });

  function render() {
    const filtered = all.filter(p => {
      const levelMatch = currentLevel === 'all' || String(p.level) === String(currentLevel);
      const yearMatch = !currentYear || String(p.exam_year) === String(currentYear);
      const q = currentSearch.trim().toLowerCase();
      const searchMatch = !q ||
        (p.course_code && p.course_code.toLowerCase().includes(q)) ||
        (p.course_title && p.course_title.toLowerCase().includes(q));
      return levelMatch && yearMatch && searchMatch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      countEl.textContent = '';
      return;
    }

    empty.style.display = 'none';
    countEl.textContent = `${filtered.length} past question${filtered.length !== 1 ? 's' : ''} found`;

    grid.innerHTML = filtered.map(p => {
      const year = p.exam_year || '—';
      const semester = p.semester || '';
      const title = p.course_title || 'Past Exam';
      const downloadLabel = isLoggedIn ? '⬇️ Download' : '🔒 Log in to download';
      const downloadAction = isLoggedIn
        ? `<a href="${p.file_url}" target="_blank" rel="noopener" class="btn-primary small full" data-id="${p.id}">${downloadLabel}</a>`
        : `<a href="login.html" class="btn-primary small full">${downloadLabel}</a>`;

      return `
        <article class="pq-card">
          <div class="pq-icon">📄</div>
          <div class="pq-body">
            <span class="pq-code">${p.course_code || '—'}</span>
            <h3>${title}</h3>
            <p class="pq-meta">Level ${p.level || '—'} · ${year}${semester ? ' · ' + semester : ''}</p>
            ${p.description ? `<p class="pq-desc">${p.description}</p>` : ''}
            <div class="pq-actions">${downloadAction}</div>
          </div>
        </article>
      `;
    }).join('');

    // Increment downloads on click
    grid.querySelectorAll('a[data-id]').forEach(a => {
      a.addEventListener('click', async () => {
        const id = a.dataset.id;
        try {
          const item = all.find(x => x.id === id);
          if (item) {
            await window.sb.from('past_questions')
              .update({ downloads: (item.downloads || 0) + 1 })
              .eq('id', id);
          }
        } catch (e) { /* ignore */ }
      });
    });
  }

  levelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      levelTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentLevel = tab.dataset.level;
      render();
    });
  });

  yearFilter.addEventListener('change', (e) => {
    currentYear = e.target.value;
    render();
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      render();
    });
  }

  render();
});
