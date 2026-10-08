// ===== CURRICULUM LEVEL TABS =====
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.level-tab');
  const panels = document.querySelectorAll('.level-panel');

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const level = tab.dataset.level;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`.level-panel[data-level="${level}"]`);
      if (panel) panel.classList.add('active');
    });
  });
});
