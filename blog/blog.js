import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';
// SUPABASE_URL is also used to validate image origins

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
    .select('title, slug, excerpt, cover_url, cover_alt, created_at')
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

    // Cover image
    const imgWrap = document.createElement('div');
    imgWrap.className = 'blog-card-img';

    if (post.cover_url && post.cover_url.startsWith(SUPABASE_URL)) {
      const img = document.createElement('img');
      img.src = post.cover_url;
      img.setAttribute('alt', post.cover_alt || '');
      img.width = 800;
      img.height = 500;
      img.loading = 'lazy';
      imgWrap.appendChild(img);
    } else {
      imgWrap.innerHTML = '<div class="blog-card-placeholder"><i class="fa-solid fa-tree"></i></div>';
    }

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
    link.appendChild(imgWrap);
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
  const ldData = {
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
  };
  if (data.cover_url && data.cover_url.startsWith(SUPABASE_URL)) {
    ldData.image = data.cover_url;
  }
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify(ldData);
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

  // Cover image (no lazy — this is LCP)
  if (data.cover_url && data.cover_url.startsWith(SUPABASE_URL)) {
    const coverImgEl = document.createElement('img');
    coverImgEl.src = data.cover_url;
    coverImgEl.setAttribute('alt', data.cover_alt || '');
    coverImgEl.className = 'blog-post-cover';
    coverImgEl.width = 1600;
    coverImgEl.height = 1000;
    postEl.appendChild(coverImgEl);

    // og:image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.content = data.cover_url;
  }

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
