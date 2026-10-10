// =============================================================
// SELL.JS — ActuarialUCC
// Handles posting a new marketplace listing
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingState');
  const notLoggedIn = document.getElementById('notLoggedIn');
  const sellCard = document.getElementById('sellCard');
  const form = document.getElementById('sellForm');
  const msg = document.getElementById('sellMessage');
  const submitBtn = document.getElementById('submitBtn');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');

  if (!form) return;

  const { data: { session } } = await window.sb.auth.getSession();
  loading.style.display = 'none';

  if (!session) {
    notLoggedIn.style.display = 'block';
    return;
  }

  sellCard.style.display = 'block';
  const userId = session.user.id;

  // Prefill contact email from account
  form.contact_email.value = session.user.email || '';

  // Photo preview
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMessage('❌ Photo must be under 2MB', 'error');
      photoInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoPreview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`;
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
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting…';

    try {
      let photoUrl = null;

      // Upload photo if selected
      const file = photoInput.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await window.sb.storage
          .from('listings')
          .upload(path, file, { upsert: false });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = window.sb.storage.from('listings').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Save listing
      const { error: insertErr } = await window.sb
        .from('listings')
        .insert({
          seller_id: userId,
          title: form.title.value.trim(),
          category: form.category.value,
          price: parseFloat(form.price.value),
          condition: form.condition.value || null,
          description: form.description.value.trim() || null,
          photo_url: photoUrl,
          contact_email: form.contact_email.value.trim(),
          contact_phone: form.contact_phone.value.trim() || null,
          status: 'active'
        });

      if (insertErr) throw insertErr;

      showMessage('✅ Listing posted! Redirecting to marketplace…', 'success');

      setTimeout(() => {
        window.location.href = 'marketplace.html';
      }, 1500);

    } catch (err) {
      console.error(err);
      showMessage('❌ ' + (err.message || 'Could not post listing.'), 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Listing';
    }
  });
});
