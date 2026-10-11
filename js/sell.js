// =============================================================
// SELL.JS — ActuarialUCC Marketplace
// Lets logged-in students list items for sale
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingState');
  const notLoggedIn = document.getElementById('notLoggedIn');
  const sellCard = document.getElementById('sellCard');
  const form = document.getElementById('sellForm');
  const msg = document.getElementById('sellMessage');
  const btn = document.getElementById('sellBtn');
  const photoInput = document.getElementById('photoInput');
  const previewWrap = document.getElementById('photoPreviewWrap');
  const preview = document.getElementById('photoPreview');

  if (!form) return;

  const { data: { session } } = await window.sb.auth.getSession();
  loading.style.display = 'none';

  if (!session) {
    notLoggedIn.style.display = 'block';
    return;
  }

  sellCard.style.display = 'block';
  const userId = session.user.id;

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      previewWrap.style.display = 'none';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showMessage('❌ Photo must be under 3MB', 'error');
      photoInput.value = '';
      previewWrap.style.display = 'none';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  function showMessage(text, type) {
    msg.textContent = text;
    msg.style.color = type === 'success' ? '#059669' : '#dc2626';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('', '');
    btn.disabled = true;
    btn.textContent = 'Listing…';

    try {
      const data = new FormData(form);
      let photoUrl = null;

      const file = photoInput.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await window.sb.storage
          .from('listings')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = window.sb.storage.from('listings').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { error: insertErr } = await window.sb
        .from('marketplace_items')
        .insert({
          seller_id: userId,
          name: data.get('name').trim(),
          category: data.get('category'),
          description: data.get('description').trim() || null,
          price: parseFloat(data.get('price')) || null,
          condition: data.get('condition') || null,
          photo_url: photoUrl
        });

      if (insertErr) throw insertErr;

      showMessage('✅ Item listed! Redirecting to marketplace…', 'success');

      setTimeout(() => {
        window.location.href = 'marketplace.html';
      }, 1500);

    } catch (err) {
      console.error(err);
      showMessage('❌ ' + (err.message || 'Something went wrong'), 'error');
      btn.disabled = false;
      btn.textContent = 'List Item';
    }
  });
});
