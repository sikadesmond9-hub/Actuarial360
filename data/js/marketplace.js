// ===== MARKETPLACE =====
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('productEmpty');
  const countEl = document.getElementById('productCount');
  const searchInput = document.getElementById('productSearch');
  const tabs = document.querySelectorAll('#catTabs .level-tab');

  if (!grid) return;

  let allProducts = [];
  let currentCat = 'all';
  let currentSearch = '';

  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Failed to load products.json');
    allProducts = await res.json();
  } catch (err) {
    console.warn('Products load error:', err);
    allProducts = [];
  }

  function formatPrice(p) {
    if (p.price === undefined || p.price === null || p.price === '') return '';
    return `GH₵${Number(p.price).toLocaleString()}`;
  }

  function render() {
    const filtered = allProducts.filter(p => {
      const catMatch = currentCat === 'all' || p.category === currentCat;
      const q = currentSearch.trim().toLowerCase();
      const searchMatch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));
      return catMatch && searchMatch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      countEl.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    countEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`;

    grid.innerHTML = filtered.map(p => {
      const price = formatPrice(p);
      const email = p.contactEmail || '';
      const phone = p.contactPhone || '';
      const actions = [
        email ? `<a class="btn-primary small" href="mailto:${email}?subject=Marketplace%20—%20${encodeURIComponent(p.name || 'Item')}">✉️ Email Seller</a>` : '',
        phone ? `<a class="btn-outline" href="tel:${phone}">📞 Call</a>` : ''
      ].filter(Boolean).join('');

      return `
        <article class="product-card">
          <div class="product-thumb">${p.image ? `<img src="${p.image}" alt="${p.name || ''}" loading="lazy" />` : (p.category ? p.category.charAt(0) : '🛒')}</div>
          <div class="product-body">
            ${p.category ? `<span class="product-cat">${p.category}</span>` : ''}
            <h3>${p.name || 'Untitled Item'}</h3>
            ${p.description ? `<p class="product-desc">${p.description}</p>` : ''}
            <div class="product-meta">
              ${price ? `<span class="product-price">${price}</span>` : '<span class="product-price">Contact for price</span>'}
              ${p.condition ? `<span class="product-condition">${p.condition}</span>` : ''}
            </div>
            ${actions ? `<div class="product-actions">${actions}</div>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCat = tab.dataset.cat;
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
