// =============================================================
// UPLOAD-QUESTION.JS — ActuarialUCC Past Questions
// =============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingState');
  const notLoggedIn = document.getElementById('notLoggedIn');
  const uploadCard = document.getElementById('uploadCard');
  const form = document.getElementById('uploadForm');
  const msg = document.getElementById('uploadMessage');
  const btn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');

  if (!form) return;

  const { data: { session } } = await window.sb.auth.getSession();
  loading.style.display = 'none';

  if (!session) {
    notLoggedIn.style.display = 'block';
    return;
  }

  uploadCard.style.display = 'block';
  const userId = session.user.id;

  function showMessage(text, type) {
    msg.textContent = text;
    msg.style.color = type === 'success' ? '#059669' : '#dc2626';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('', '');
    btn.disabled = true;
    btn.textContent = 'Uploading…';

    try {
      const data = new FormData(form);
      const file = fileInput.files[0];

      if (!file) throw new Error('Please choose a PDF file');
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      if (file.type !== 'application/pdf') throw new Error('Only PDF files allowed');

      const courseCode = data.get('course_code').trim().toUpperCase();
      const safeCode = courseCode.replace(/[^A-Z0-9]/g, '-');
      const path = `${userId}/${safeCode}-${Date.now()}.pdf`;

      // Upload PDF
      const { error: uploadErr } = await window.sb.storage
        .from('past-questions')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: 'application/pdf' });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = window.sb.storage.from('past-questions').getPublicUrl(path);

      // Insert row
      const { error: insertErr } = await window.sb
        .from('past_questions')
        .insert({
          uploader_id: userId,
          course_code: courseCode,
          course_title: data.get('course_title')?.trim() || null,
          level: parseInt(data.get('level'), 10),
          exam_year: parseInt(data.get('exam_year'), 10),
          semester: data.get('semester') || null,
          description: data.get('description')?.trim() || null,
          file_url: urlData.publicUrl,
          file_path: path,
          file_size: file.size
        });

      if (insertErr) throw insertErr;

      showMessage('✅ Uploaded! Redirecting to library…', 'success');

      setTimeout(() => {
        window.location.href = 'past-questions.html';
      }, 1500);

    } catch (err) {
      console.error(err);
      showMessage('❌ ' + (err.message || 'Upload failed'), 'error');
      btn.disabled = false;
      btn.textContent = 'Upload Past Question';
    }
  });
});
