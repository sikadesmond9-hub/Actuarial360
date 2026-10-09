// =============================================================
// PROFILE.JS — ActuarialUCC
// Allows logged-in students to edit their profile + upload photo
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingState');
  const notLoggedIn = document.getElementById('notLoggedIn');
  const editCard = document.getElementById('editCard');
  const form = document.getElementById('profileForm');
  const msg = document.getElementById('profileMessage');
  const saveBtn = document.getElementById('saveBtn');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');

  if (!form) return;

  const { data: { session } } = await window.sb.auth.getSession();
  loading.style.display = 'none';

  if (!session) {
    notLoggedIn.style.display = 'block';
    return;
  }

  editCard.style.display = 'block';

  const userId = session.user.id;

  // ---- Load current profile ----
  const { data: profile, error: loadErr } = await window.sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (loadErr) console.warn('Load error:', loadErr);

  if (profile) {
    form.full_name.value = profile.full_name || '';
    form.student_id.value = profile.student_id || '';
    form.level.value = profile.level || '';
    form.bio.value = profile.bio || '';
    form.interests.value = Array.isArray(profile.interests) ? profile.interests.join(', ') : '';

    if (profile.photo_url) {
      photoPreview.innerHTML = `<img src="${profile.photo_url}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      photoPreview.textContent = (profile.full_name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    }
  }

  // ---- Photo preview ----
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
      photoPreview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    };
    reader.readAsDataURL(file);
  });

  function showMessage(text, type) {
    msg.textContent = text;
    msg.style.color = type === 'success' ? '#059669' : '#dc2626';
  }

  // ---- Save ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('', '');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      let photoUrl = profile?.photo_url || null;

      // Upload photo if selected
      const file = photoInput.files[0];
      if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadErr } = await window.sb.storage
          .from('avatars')
          .upload(path, file, { upsert: true, cacheControl: '3600' });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = window.sb.storage.from('avatars').getPublicUrl(path);
        photoUrl = urlData.publicUrl + '?t=' + Date.now(); // cache-bust
      }

      // Update profile
      const interests = form.interests.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const { error: updateErr } = await window.sb
        .from('profiles')
        .update({
          full_name: form.full_name.value.trim(),
          student_id: form.student_id.value.trim(),
          level: parseInt(form.level.value, 10),
          bio: form.bio.value.trim() || null,
          interests: interests.length ? interests : null,
          photo_url: photoUrl
        })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      showMessage('✅ Profile saved!', 'success');

      // Update avatar preview to final URL
      if (photoUrl) {
        photoPreview.innerHTML = `<img src="${photoUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      }

    } catch (err) {
      console.error(err);
      showMessage('❌ ' + (err.message || 'Could not save changes'), 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });
});
