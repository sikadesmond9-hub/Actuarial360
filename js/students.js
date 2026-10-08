// ===== LOAD & FILTER STUDENT DIRECTORY =====
(function () {
  const grid = document.getElementById('student-grid');
  const countEl = document.getElementById('student-count');
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  let allStudents = [];
  let activeFilter = 'all';

  function initials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function render() {
    const list = activeFilter === 'all'
      ? allStudents
      : allStudents.filter(s => s.level === parseInt(activeFilter));

    grid.innerHTML = '';

    if (list.length === 0) {
      grid.innerHTML = '<p class="empty-state">No students found for this level.</p>';
      if (countEl) countEl.textContent = '0 students';
      return;
    }

    list.forEach(s => {
      const card = document.createElement('article');
      card.className = 'student-card';
      card.innerHTML = `
        <div class="student-avatar">${initials(s.name)}</div>
        <div class="student-body">
          <span class="level-tag level-${s.level}">Level ${s.level}</span>
          <h3>${s.name}</h3>
          <p class="student-role">${s.role}</p>
          <p class="student-interest">${s.interests}</p>
          <div class="student-contact">
            <a href="mailto:${s.email}">✉️ Email</a>
            <a href="tel:${s.phone.replace(/\s/g, '')}">📞 Call</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    if (countEl) {
      countEl.textContent = list.length + (list.length === 1 ? ' student' : ' students');
    }
  }

  // Fetch data
  fetch('data/students.json')
    .then(res => res.json())
    .then(data => {
      // Sort ordinally: Level 100 first, then 200, 300, 400; then by name
      allStudents = data.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
      render();
    })
    .catch(err => {
      grid.innerHTML = '<p class="empty-state">Could not load student data. Please try again later.</p>';
      console.error(err);
    });

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.level;
      render();
    });
  });
})();
