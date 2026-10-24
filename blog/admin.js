import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM refs
const loginSection = document.getElementById('admin-login');
const dashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const postsList = document.getElementById('admin-posts-list');
const formWrap = document.getElementById('admin-form-wrap');
const formHeading = document.getElementById('form-heading');
const postForm = document.getElementById('post-form');
const formError = document.getElementById('form-error');
const slugWarning = document.getElementById('slug-warning');
const titleInput = document.getElementById('post-title');
const slugInput = document.getElementById('post-slug');
const excerptInput = document.getElementById('post-excerpt');
const contentInput = document.getElementById('post-content');

let editingId = null;

// --- Init: check session ---
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard();
  }
})();

// --- Login ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    return;
  }

  showDashboard();
});

// --- Logout ---
document.getElementById('btn-logout').addEventListener('click', async () => {
  await sb.auth.signOut();
  loginSection.style.display = 'block';
  dashboard.style.display = 'none';
  formWrap.style.display = 'none';
  editingId = null;
});

// --- New post ---
document.getElementById('btn-new-post').addEventListener('click', () => {
  editingId = null;
  formHeading.textContent = 'New Post';
  postForm.reset();
  formError.textContent = '';
  slugWarning.style.display = 'none';
  formWrap.style.display = 'block';
  titleInput.focus();
});

// --- Cancel ---
document.getElementById('btn-cancel').addEventListener('click', () => {
  formWrap.style.display = 'none';
  editingId = null;
});

// --- Auto-slug from title ---
titleInput.addEventListener('input', () => {
  if (!editingId) {
    slugInput.value = toSlug(titleInput.value);
  }
});

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// --- Save (create or update) ---
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const post = {
    title: titleInput.value.trim(),
    slug: slugInput.value.trim(),
    excerpt: excerptInput.value.trim() || null,
    content: contentInput.value.trim()
  };

  if (!post.title || !post.slug || !post.content) {
    formError.textContent = 'Title, slug and content are required.';
    return;
  }

  let result;

  if (editingId) {
    result = await sb
      .from('posts')
      .update(post)
      .eq('id', editingId)
      .select();
  } else {
    result = await sb
      .from('posts')
      .insert(post)
      .select();
  }

  if (result.error) {
    if (result.error.message.includes('duplicate') || result.error.message.includes('unique')) {
      formError.textContent = 'This slug is already taken. Choose a different one.';
    } else if (result.error.code === '42501') {
      formError.textContent = 'Permission denied. Are you signed in as an admin?';
    } else {
      formError.textContent = result.error.message;
    }
    return;
  }

  formWrap.style.display = 'none';
  editingId = null;
  loadAdminPosts();
});

// --- Show dashboard ---
async function showDashboard() {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
  loadAdminPosts();
}

// --- Load posts list ---
async function loadAdminPosts() {
  const { data, error } = await sb
    .from('posts')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    postsList.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'admin-error';
    p.textContent = 'Failed to load posts: ' + error.message;
    postsList.appendChild(p);
    return;
  }

  postsList.innerHTML = '';

  if (!data || data.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No posts yet. Click "+ New Post" to create one.';
    postsList.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = '<thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead>';
  const tbody = document.createElement('tbody');

  data.forEach(post => {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.textContent = post.title;

    const tdDate = document.createElement('td');
    tdDate.textContent = new Date(post.created_at).toLocaleDateString('en-AU');

    const tdActions = document.createElement('td');
    tdActions.className = 'admin-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-admin btn-admin--small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editPost(post.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-admin btn-admin--small btn-admin--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePost(post.id, post.title));

    tdActions.append(editBtn, deleteBtn);
    tr.append(tdTitle, tdDate, tdActions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  postsList.appendChild(table);
}

// --- Edit ---
async function editPost(id) {
  formError.textContent = '';
  const { data, error } = await sb
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    alert('Failed to load post.');
    return;
  }

  editingId = id;
  formHeading.textContent = 'Edit Post';
  titleInput.value = data.title;
  slugInput.value = data.slug;
  excerptInput.value = data.excerpt || '';
  contentInput.value = data.content;
  slugWarning.style.display = 'block';
  formWrap.style.display = 'block';
  titleInput.focus();
}

// --- Delete ---
async function deletePost(id, title) {
  if (!window.confirm('Delete "' + title + '"? This cannot be undone.')) return;

  const { error } = await sb
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Failed to delete: ' + error.message);
    return;
  }

  loadAdminPosts();
}
