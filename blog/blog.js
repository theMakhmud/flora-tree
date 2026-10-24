import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const grid = document.getElementById('blog-grid');
const empty = document.getElementById('blog-empty');

// Detect context: blog list or single post
const isPostPage = document.getElementById('blog-post') !== null;

if (isPostPage) {
  loadPost();
} else {
  loadPosts();
}

// --- Blog list ---
async function loadPosts() {
  const { data, error } = await sb
    .from('posts')
    .select('title, slug, excerpt, created_at')
    .order('created_at', { ascending: false });

  // Remove skeletons
  grid.querySelectorAll('.blog-card--skeleton').forEach(el => el.remove());

  if (error || !data || data.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  data.forEach(post => {
    const article = document.createElement('article');
    article.className = 'blog-card';

    const link = document.createElement('a');
    link.href = 'blog/post.html?slug=' + encodeURIComponent(post.slug);
    link.className = 'blog-card-link';

    const body = document.createElement('div');
    body.className = 'blog-card-body';

    const time = document.createElement('time');
    time.className = 'blog-card-date';
    const d = new Date(post.created_at);
    time.dateTime = d.toISOString();
    time.textContent = d.toLocaleDateString('en-AU', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const h2 = document.createElement('h2');
    h2.className = 'blog-card-title';
    h2.textContent = post.title;

    const p = document.createElement('p');
    p.className = 'blog-card-excerpt';
    p.textContent = post.excerpt || '';

    const more = document.createElement('span');
    more.className = 'blog-card-more';
    more.textContent = 'Read more →';

    body.append(time, h2, p, more);
    link.appendChild(body);
    article.appendChild(link);
    grid.appendChild(article);
  });
}

// --- Single post ---
async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const postEl = document.getElementById('blog-post');
  const skeleton = document.getElementById('post-skeleton');
  const notfound = document.getElementById('post-notfound');

  if (!slug) {
    if (skeleton) skeleton.style.display = 'none';
    if (notfound) notfound.style.display = 'block';
    return;
  }

  const { data, error } = await sb
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (skeleton) skeleton.style.display = 'none';

  if (error || !data) {
    if (notfound) notfound.style.display = 'block';
    document.title = 'Post not found | Flora Tree Services Blog';
    return;
  }

  // Update SEO
  document.title = data.title + ' | Flora Tree Services Blog';

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = data.excerpt || '';

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = 'https://floratreeservices.com.au/blog/post.html?slug=' + encodeURIComponent(data.slug);
  }

  // JSON-LD BlogPosting
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    datePublished: data.created_at,
    dateModified: data.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Flora Tree Services'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Flora Tree Services',
      url: 'https://floratreeservices.com.au/'
    }
  });
  document.head.appendChild(ld);

  // Render content
  const d = new Date(data.created_at);

  const time = document.createElement('time');
  time.className = 'blog-post-date';
  time.dateTime = d.toISOString();
  time.textContent = d.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const h2 = document.createElement('h2');
  h2.textContent = data.title;

  postEl.append(time, h2);

  // Safe content rendering: split by double newline into paragraphs
  const paragraphs = data.content.split(/\n\n+/);
  paragraphs.forEach(text => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const p = document.createElement('p');
    p.textContent = trimmed;
    postEl.appendChild(p);
  });
}
