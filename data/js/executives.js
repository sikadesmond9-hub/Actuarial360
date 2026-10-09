// ===== EXECUTIVES DIRECTORY =====
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('execGrid');
  const emptyState = document.getElementById('execEmpty');
  const countEl = document.getElementById('execCount');
  const searchInput = document.getElementById('execSearch');
  const tabs = document.querySelectorAll('#roleTabs .level-tab');

  if (!grid) return;

  let allExecs = [];
  let currentRole = 'all';
  let currentSearch = '';

  try {
    const res = await fetch('data/executives.json');
    if (!res.ok) throw new Error('Failed to load executives.json');
    allExecs = await res.json();
  } catch (err) {
    console.warn('Executives load error:', err);
    allExecs = [];
  }

  function render() {
    const filtered = allExecs.filter(p => {
      const roleMatch = currentRole === 'all' || p.role === currentRole;
      const q = currentSearch.trim().toLowerCase();
      const searchMatch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.role && p.role.toLowerCase().includes(q));
      return roleMatch && searchMatch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      countEl.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    countEl.textContent = `${filtered.length} executive${filtered.length !== 1 ? 's' : ''} shown`;

    grid.innerHTML = filtered.map(p => {
      const initials = (p.name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      const socials = p.socials || {};
      const socialLinks = [
        socials.email ? `<a href="mailto:${socials.email}" title="Email">✉️</a>` : '',
        socials.phone ? `<a href="tel:${socials.phone}" title="Phone">📞</a>` : '',
        socials.linkedin ? `<a href="${socials.linkedin}" target="_blank" rel="noopener" title="LinkedIn">in</a>` : '',
        socials.twitter ? `<a href="${socials.twitter}" target="_blank" rel="noopener" title="X">𝕏</a>` : ''
      ].filter(Boolean).join('');

      return `
        <article class="exec-card">
          <div class="exec-avatar">${initials}</div>
          <div class="exec-body">
            <h3>${p.name || 'Unnamed Executive'}</h3>
            <p class="exec-role">${p.role || '—'}</p>
            ${p.level ? `<p class="exec-level">Level ${p.level}</p>` : ''}
            ${p.bio ? `<p class="exec-bio">${p.bio}</p>` : ''}
            ${socialLinks ? `<div class="exec-socials">${socialLinks}</div>` : ''}
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
