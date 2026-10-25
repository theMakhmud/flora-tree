import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================== DOM refs =====================
const loginScreen   = document.getElementById('admin-login');
const dashboard     = document.getElementById('admin-dashboard');
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const loginErrorTxt = document.getElementById('login-error-text');
const loginBtn      = document.getElementById('login-btn');
const loginBtnText  = document.getElementById('login-btn-text');
const loginSpinner  = document.getElementById('login-spinner');

const screenPosts   = document.getElementById('screen-posts');
const screenEditor  = document.getElementById('screen-editor');

const postsList     = document.getElementById('admin-posts-list');
const postsCount    = document.getElementById('posts-count');
const adminEmail    = document.getElementById('admin-user-email');

const formHeading   = document.getElementById('form-heading');
const postForm      = document.getElementById('post-form');
const titleInput    = document.getElementById('post-title');
const slugInput     = document.getElementById('post-slug');
const excerptInput  = document.getElementById('post-excerpt');
const contentInput  = document.getElementById('post-content');

const slugPreview   = document.getElementById('slug-preview');
const slugWarning   = document.getElementById('slug-warning');
const excerptCounter = document.getElementById('excerpt-counter');

const errorTitle    = document.getElementById('error-title');
const errorSlug     = document.getElementById('error-slug');
const errorContent  = document.getElementById('error-content');

const postDates     = document.getElementById('post-dates');
const postCreatedAt = document.getElementById('post-created-at');
const postUpdatedAt = document.getElementById('post-updated-at');

const deleteModal   = document.getElementById('delete-modal');
const deleteTitle   = document.getElementById('delete-title');
const deleteCancel  = document.getElementById('delete-cancel');
const deleteConfirm = document.getElementById('delete-confirm');

const toastsEl      = document.getElementById('admin-toasts');

const coverInput     = document.getElementById('cover-input');
const coverPreview   = document.getElementById('cover-preview');
const coverImg       = document.getElementById('cover-preview-img');
const coverEmpty     = document.getElementById('cover-empty');
const coverUploading = document.getElementById('cover-uploading');
const coverAltField  = document.getElementById('cover-alt-field');
const coverAltInput  = document.getElementById('cover-alt-input');
const errorCoverAlt  = document.getElementById('error-cover-alt');

let currentCoverUrl  = null;
let currentCoverPath = null; // path in bucket for delete

let editingId = null;
let formDirty = false;
let deleteTargetId = null;

// ===================== Init: check session =====================
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard(session.user.email);
  }
})();

// ===================== Toggle password visibility =====================
document.getElementById('toggle-password').addEventListener('click', () => {
  const pwInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('eye-icon');
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';
  eyeIcon.classList.toggle('fa-eye', !isHidden);
  eyeIcon.classList.toggle('fa-eye-slash', isHidden);
  document.getElementById('toggle-password').setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
});

// ===================== Login =====================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideLoginError();
  setLoginLoading(true);

  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    showLoginError(error.message);
    setLoginLoading(false);
    return;
  }

  setLoginLoading(false);
  showDashboard(data.user.email);
});

function setLoginLoading(loading) {
  loginBtn.disabled = loading;
  loginBtnText.textContent = loading ? 'Signing in...' : 'Sign In';
  loginSpinner.style.display = loading ? 'inline-block' : 'none';
}

function showLoginError(msg) {
  loginErrorTxt.textContent = msg;
  loginError.style.display = 'flex';
}

function hideLoginError() {
  loginError.style.display = 'none';
  loginErrorTxt.textContent = '';
}

// ===================== Logout =====================
document.getElementById('btn-logout').addEventListener('click', async () => {
  await sb.auth.signOut();
  dashboard.style.display = 'none';
  loginScreen.style.display = 'flex';
  editingId = null;
  formDirty = false;
});

// ===================== Show dashboard =====================
async function showDashboard(email) {
  loginScreen.style.display  = 'none';
  dashboard.style.display    = 'block';
  if (email) adminEmail.textContent = email;
  loadAdminPosts();
}

// ===================== New Post =====================
document.getElementById('btn-new-post').addEventListener('click', () => {
  openEditor(null);
});

// ===================== Back / Cancel =====================
document.getElementById('btn-back').addEventListener('click', () => {
  if (formDirty && !confirmLeave()) return;
  showPostsScreen();
});

document.getElementById('btn-cancel').addEventListener('click', () => {
  if (formDirty && !confirmLeave()) return;
  showPostsScreen();
});

function confirmLeave() {
  return window.confirm('You have unsaved changes. Leave anyway?');
}

// ===================== Cover image — compress =====================
async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Not an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('File too large (max 10 MB).');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Compression failed.'));
        resolve(blob);
      }, 'image/webp', 0.82);
    };
    img.onerror = () => reject(new Error('Cannot read image.'));
    img.src = URL.createObjectURL(file);
  });
}

// ===================== Cover image — upload =====================
coverInput.addEventListener('change', async () => {
  const file = coverInput.files[0];
  if (!file) return;

  try {
    coverEmpty.style.display = 'none';
    coverPreview.style.display = 'none';
    coverUploading.style.display = 'flex';

    const blob = await compressImage(file);
    const slug = slugInput.value.trim() || 'cover';
    const fileName = slug + '-' + Date.now() + '.webp';

    // Delete old file if replacing
    if (currentCoverPath) {
      await sb.storage.from('blog-images').remove([currentCoverPath]);
    }

    const { data, error } = await sb.storage
      .from('blog-images')
      .upload(fileName, blob, { contentType: 'image/webp', upsert: false });

    if (error) throw new Error(error.message);

    const { data: urlData } = sb.storage.from('blog-images').getPublicUrl(data.path);

    currentCoverUrl  = urlData.publicUrl;
    currentCoverPath = data.path;

    coverImg.src = currentCoverUrl;
    coverPreview.style.display = 'block';
    coverUploading.style.display = 'none';
    coverAltField.style.display = 'block';
    formDirty = true;

    showToast('Cover image uploaded.', 'success');
  } catch (err) {
    coverUploading.style.display = 'none';
    if (currentCoverUrl) coverPreview.style.display = 'block';
    else coverEmpty.style.display = 'block';
    showToast(err.message, 'error');
  }
  coverInput.value = '';
});

// ===================== Cover image — remove =====================
document.getElementById('btn-cover-remove').addEventListener('click', async () => {
  if (currentCoverPath) {
    await sb.storage.from('blog-images').remove([currentCoverPath]);
  }
  currentCoverUrl  = null;
  currentCoverPath = null;
  coverImg.src = '';
  coverPreview.style.display = 'none';
  coverAltField.style.display = 'none';
  coverAltInput.value = '';
  coverEmpty.style.display = 'block';
  formDirty = true;
  showToast('Cover image removed.', 'success');
});

// ===================== Auto-slug from title =====================
titleInput.addEventListener('input', () => {
  formDirty = true;
  if (!editingId) {
    slugInput.value = toSlug(titleInput.value);
    updateSlugPreview();
  }
});

slugInput.addEventListener('input', () => {
  formDirty = true;
  updateSlugPreview();
});

excerptInput.addEventListener('input', () => {
  formDirty = true;
  const len = excerptInput.value.length;
  excerptCounter.textContent = len + '/160';
  excerptCounter.classList.toggle('admin-char-counter--over', len > 160);
});

contentInput.addEventListener('input', () => {
  formDirty = true;
  autoGrow(contentInput);
});

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function updateSlugPreview() {
  const val = slugInput.value.trim();
  if (val) {
    slugPreview.textContent = 'floratreeservices.com.au/blog/post.html?slug=' + val;
    slugPreview.style.display = 'block';
  } else {
    slugPreview.style.display = 'none';
  }
}

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// ===================== Unsaved changes warning =====================
window.addEventListener('beforeunload', (e) => {
  if (formDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ===================== Save (create or update) =====================
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const post = {
    title:     titleInput.value.trim(),
    slug:      slugInput.value.trim(),
    excerpt:   excerptInput.value.trim() || null,
    content:   contentInput.value.trim(),
    cover_url: currentCoverUrl,
    cover_alt: coverAltInput.value.trim() || null
  };

  let valid = true;
  if (!post.title) {
    showFieldError(errorTitle, 'Title is required.');
    valid = false;
  }
  if (!post.slug) {
    showFieldError(errorSlug, 'Slug is required.');
    valid = false;
  }
  if (!post.content) {
    showFieldError(errorContent, 'Content is required.');
    valid = false;
  }
  if (currentCoverUrl && !post.cover_alt) {
    showFieldError(errorCoverAlt, 'Alt text is required when a cover image is set.');
    valid = false;
  }
  if (!valid) return;

  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="admin-spinner"></span> Saving...';

  let result;
  if (editingId) {
    result = await sb.from('posts').update(post).eq('id', editingId).select();
  } else {
    result = await sb.from('posts').insert(post).select();
  }

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save';

  if (result.error) {
    if (result.error.message.includes('duplicate') || result.error.message.includes('unique')) {
      showFieldError(errorSlug, 'This slug is already taken. Choose a different one.');
    } else if (result.error.code === '42501') {
      showToast('Permission denied. Are you signed in as an admin?', 'error');
    } else {
      showToast(result.error.message, 'error');
    }
    return;
  }

  formDirty = false;
  showToast(editingId ? 'Post updated.' : 'Post created.', 'success');
  showPostsScreen();
  loadAdminPosts();
});

// ===================== Load posts list =====================
async function loadAdminPosts() {
  const { data, error } = await sb
    .from('posts')
    .select('id, title, slug, excerpt, cover_url, created_at, updated_at')
    .order('created_at', { ascending: false });

  postsList.innerHTML = '';

  if (error) {
    postsList.innerHTML = '<p class="admin-load-error"><i class="fa-solid fa-circle-exclamation"></i> Failed to load posts: ' + error.message + '</p>';
    return;
  }

  postsCount.textContent = data && data.length ? '(' + data.length + ')' : '(0)';

  if (!data || data.length === 0) {
    postsList.innerHTML = `
      <div class="admin-empty">
        <i class="fa-regular fa-file-lines admin-empty-icon"></i>
        <p class="admin-empty-text">No posts yet</p>
        <button class="btn-admin" id="btn-first-post">Create your first post</button>
      </div>`;
    document.getElementById('btn-first-post').addEventListener('click', () => openEditor(null));
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Title</th>
        <th>Updated</th>
        <th>Actions</th>
      </tr>
    </thead>`;

  const tbody = document.createElement('tbody');

  data.forEach(post => {
    const tr = document.createElement('tr');
    tr.className = 'admin-table-row';

    const excerptText = post.excerpt
      ? '<span class="admin-table-excerpt">' + escHtml(post.excerpt) + '</span>'
      : '';

    const dateStr = formatDate(post.updated_at || post.created_at);

    const thumbHtml = post.cover_url
      ? '<img class="admin-table-thumb" src="' + escHtml(post.cover_url) + '" alt="" width="32" height="32">'
      : '<span class="admin-table-thumb admin-table-thumb--empty"><i class="fa-regular fa-image"></i></span>';

    tr.innerHTML = `
      <td class="admin-table-title-cell">
        ${thumbHtml}
        <div>
          <span class="admin-table-title">${escHtml(post.title)}</span>
          ${excerptText}
        </div>
      </td>
      <td class="admin-table-date">${dateStr}</td>
      <td class="admin-table-actions">
        <a href="../blog/post.html?slug=${encodeURIComponent(post.slug)}" target="_blank" rel="noopener"
           class="btn-admin-icon" title="View post" aria-label="View post">
          <i class="fa-solid fa-up-right-from-square"></i>
        </a>
        <button class="btn-admin-icon btn-admin-icon--edit js-edit-btn" data-id="${post.id}" title="Edit" aria-label="Edit post">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-admin-icon btn-admin-icon--delete js-delete-btn" data-id="${post.id}" data-title="${escAttr(post.title)}" title="Delete" aria-label="Delete post">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>`;

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  postsList.appendChild(table);

  // Bind table buttons
  postsList.querySelectorAll('.js-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editPost(btn.dataset.id));
  });
  postsList.querySelectorAll('.js-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.title));
  });
}

// ===================== Open editor =====================
function openEditor(id) {
  editingId = id;
  formDirty = false;
  clearFieldErrors();
  postForm.reset();
  excerptCounter.textContent = '0/160';
  excerptCounter.classList.remove('admin-char-counter--over');
  slugPreview.style.display = 'none';
  slugWarning.style.display = 'none';
  postDates.style.display = 'none';
  contentInput.style.height = '';

  formHeading.textContent = id ? 'Edit Post' : 'New Post';

  // Reset cover state
  currentCoverUrl  = null;
  currentCoverPath = null;
  coverImg.src = '';
  coverPreview.style.display = 'none';
  coverEmpty.style.display = 'block';
  coverAltField.style.display = 'none';
  coverAltInput.value = '';

  showEditorScreen();
  titleInput.focus();
}

// ===================== Edit =====================
async function editPost(id) {
  openEditor(id);

  const { data, error } = await sb.from('posts').select('*').eq('id', id).single();

  if (error || !data) {
    showToast('Failed to load post.', 'error');
    showPostsScreen();
    return;
  }

  titleInput.value   = data.title;
  slugInput.value    = data.slug;
  excerptInput.value = data.excerpt || '';
  contentInput.value = data.content;

  const len = excerptInput.value.length;
  excerptCounter.textContent = len + '/160';
  excerptCounter.classList.toggle('admin-char-counter--over', len > 160);

  updateSlugPreview();
  autoGrow(contentInput);

  // Load cover
  if (data.cover_url) {
    currentCoverUrl = data.cover_url;
    const urlObj = new URL(data.cover_url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/blog-images\/(.*)/);
    currentCoverPath = pathMatch ? pathMatch[1] : null;
    coverImg.src = data.cover_url;
    coverPreview.style.display = 'block';
    coverEmpty.style.display = 'none';
    coverAltField.style.display = 'block';
    coverAltInput.value = data.cover_alt || '';
  } else {
    currentCoverUrl  = null;
    currentCoverPath = null;
    coverImg.src = '';
    coverPreview.style.display = 'none';
    coverEmpty.style.display = 'block';
    coverAltField.style.display = 'none';
    coverAltInput.value = '';
  }

  slugWarning.style.display = 'flex';

  if (data.created_at || data.updated_at) {
    postDates.style.display = 'block';
    postCreatedAt.textContent = data.created_at ? formatDate(data.created_at) : '—';
    postUpdatedAt.textContent = data.updated_at ? formatDate(data.updated_at) : '—';
  }

  titleInput.focus();
}

// ===================== Delete modal =====================
function openDeleteModal(id, title) {
  deleteTargetId = id;
  deleteTitle.textContent = title;
  deleteModal.style.display = 'flex';
}

deleteCancel.addEventListener('click', () => {
  deleteModal.style.display = 'none';
  deleteTargetId = null;
});

deleteConfirm.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  const id = deleteTargetId;
  deleteModal.style.display = 'none';
  deleteTargetId = null;

  // Clean up cover image from storage before deleting the post
  const { data: postData } = await sb.from('posts').select('cover_url').eq('id', id).single();
  if (postData && postData.cover_url) {
    const urlObj = new URL(postData.cover_url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/blog-images\/(.*)/);
    if (pathMatch) {
      await sb.storage.from('blog-images').remove([pathMatch[1]]);
    }
  }

  const { error } = await sb.from('posts').delete().eq('id', id);

  if (error) {
    showToast('Failed to delete: ' + error.message, 'error');
    return;
  }

  showToast('Post deleted.', 'success');
  loadAdminPosts();
});

// Close modal on overlay click
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = 'none';
    deleteTargetId = null;
  }
});

// ===================== Screen switching =====================
function showPostsScreen() {
  screenPosts.style.display  = 'block';
  screenEditor.style.display = 'none';
  editingId = null;
}

function showEditorScreen() {
  screenPosts.style.display  = 'none';
  screenEditor.style.display = 'block';
}

// ===================== Field validation helpers =====================
function showFieldError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function clearFieldErrors() {
  [errorTitle, errorSlug, errorContent, errorCoverAlt].forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// ===================== Toasts =====================
function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = 'admin-toast admin-toast--' + (type || 'success');
  toast.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + escHtml(msg);
  toastsEl.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('admin-toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('admin-toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}

// ===================== Utilities =====================
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
