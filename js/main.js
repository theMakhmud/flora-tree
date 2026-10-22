

function mag() {
    document.getElementById("box").style.animationName = "input"
    document.getElementById("int").style.display = "block"
    addEventListener("dblclick", function () {
        document.getElementById("box").style.animationName = "revers"
        document.getElementById("int").style.display = "none"
    })
}

let a = 0
function one() {
    a++
    document.getElementById("options").style.display = "block"
    document.getElementById("options").style.animationName = "open"
    document.getElementById("h2").style.animationName = "h2"

    if (a == 2) {
        document.getElementById("options").style.animationName = "exit"
        document.getElementById("h2").style.animationName = "none"
        setTimeout(exit, 500)
        a = 0
    }
}
function exit() {
    document.getElementById("options").style.display = "none"
}


let b = 0
function two() {
    b++
    document.getElementById("option").style.display = "block"
    document.getElementById("option").style.animationName = "open"
    document.getElementById("h3").style.animationName = "h2"

    if (b == 2) {
        document.getElementById("option").style.animationName = "exit"
        document.getElementById("h3").style.animationName = "none"
        setTimeout(exits, 500)
        b = 0
    }
}
function exits() {
    document.getElementById("option").style.display = "none"
}


let v = 0
function thre() {
    v++
    document.getElementById("optionThree").style.display = "block"
    document.getElementById("optionThree").style.animationName = "open"
    document.getElementById("h4").style.animationName = "h2"

    if (v == 2) {
        document.getElementById("optionThree").style.animationName = "exit"
        document.getElementById("h4").style.animationName = "none"
        setTimeout(exiting, 500)
        v = 0
    }

}
function exiting() {
    document.getElementById("optionThree").style.display = "none"
}

function not() {
    alert("not information")
}

function hideMotion() {
  const videoDiv = document.getElementById("moushnVideo");
  if (!videoDiv) return;
  videoDiv.classList.add("hidden");    
  setTimeout(() => { videoDiv.style.display = "none"; }, 600);
}

document.addEventListener("DOMContentLoaded", hideMotion);

setTimeout(hideMotion, 1200);

function format(command, value = null) {
    document.execCommand(command, false, value);
}

 
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  const btn = document.getElementById("backToTop");
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}
 
document.getElementById("backToTop").addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ========= helpers =========
function qs(s, r=document){ return r.querySelector(s); }
function qsa(s, r=document){ return r.querySelectorAll(s); }

// Are we in overlay (hamburger) mode? (reads CSS; no hard-coded px)
function isOverlayMode(){
  const hb = qs('.hamburger');
  return hb && getComputedStyle(hb).display !== 'none';
}

// ========= hamburger (panel) =========
function openMenu(btn){
  const panel = qs('.text-navbar');
  if (!panel || panel.classList.contains('active')) return;
  panel.classList.add('active');

  if (btn){
    btn.setAttribute('aria-expanded','true');
    const ic = btn.querySelector('i');
    if (ic){ ic.classList.remove('fa-bars'); ic.classList.add('fa-xmark'); }
  }
  document.body.classList.add('menu-open');
}

function closeMenu(btn){
  const panel = qs('.text-navbar');
  if (!panel) return;

  // close panel
  panel.classList.remove('active');

  // collapse any open dropdowns & reset their icons/aria
  qsa('.text-navbar .drop.open').forEach(closeDropdown);

  if (btn){
    btn.setAttribute('aria-expanded','false');
    const ic = btn.querySelector('i');
    if (ic){ ic.classList.remove('fa-xmark'); ic.classList.add('fa-bars'); }
  }
  document.body.classList.remove('menu-open');
}

// called from HTML onclick on the hamburger button
function toggleMenu(btn){
  const panel = qs('.text-navbar');
  panel && panel.classList.contains('active') ? closeMenu(btn) : openMenu(btn);
}

// ========= services dropdown (accordion in overlay) =========
function openDropdown(drop){
  drop.classList.add('open');
  const t = qs(':scope > p', drop);
  if (t) t.setAttribute('aria-expanded','true');
  const i = t && qs('i', t);
  if (i){
    i.classList.add('fa-angle-up','fa-chevron-up');
    i.classList.remove('fa-angle-down','fa-chevron-down');
    // if you rely on CSS rotation, leave transform alone
  }
}

function closeDropdown(drop){
  drop.classList.remove('open');
  const t = qs(':scope > p', drop);
  if (t) t.setAttribute('aria-expanded','false');
  const i = t && qs('i', t);
  if (i){
    i.classList.add('fa-angle-down','fa-chevron-down');
    i.classList.remove('fa-angle-up','fa-chevron-up');
  }
}

// ========= global listeners =========

// 1) Toggle Services dropdown (only in overlay mode)
document.addEventListener('click', function (e) {
  const trigger = e.target.closest('.text-navbar .drop > p');
  if (!trigger) return;
  if (!isOverlayMode()) return; // desktop uses CSS hover

  e.preventDefault();
  const drop = trigger.parentElement;

  // close other open dropdowns first
  drop.parentElement && qsa('.drop.open', drop.parentElement).forEach(d => {
    if (d !== drop) closeDropdown(d);
  });

  // toggle current
  drop.classList.contains('open') ? closeDropdown(drop) : openDropdown(drop);
});

// 2) Close panel when a menu link is tapped
document.addEventListener('click', function (e) {
  const link  = e.target.closest('.text-navbar a');
  const panel = qs('.text-navbar');
  const btn   = qs('.hamburger');
  if (link && panel && panel.classList.contains('active') && btn) {
    closeMenu(btn);
  }
});

// 3) Close when clicking outside the nav while overlay is open
document.addEventListener('click', function (e) {
  const panelOpen = qs('.text-navbar')?.classList.contains('active');
  if (!panelOpen || !isOverlayMode()) return;
  const insideNav = e.target.closest('nav');
  if (!insideNav){
    closeMenu(qs('.hamburger'));
  }
});



// Reviews carousel 

(function () {
  function initReviewsCarousel() {
    const host  = document.querySelector('.reviews') || document.querySelector('.comments');
    const track = host?.querySelector('.review')    || host?.querySelector('.com');
    
      const cards = document.querySelectorAll('.review > div, .com > div');
  if (!cards.length) return;

  const colors = ['#1B5E20','#2E7D32','#0277BD','#1565C0','#6A1B9A','#D84315','#00897B','#5D4037','#455A64','#8E24AA'];
  const hash = s => { let h=0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0; return Math.abs(h); };

  cards.forEach(card => {
    const nameEl = card.querySelector('h3');
    if (!nameEl) return;

    const nameWrap = nameEl.parentElement;        // the <div> that wraps <h3>
    const row      = nameWrap?.parentElement;     // the flex row
    if (!row || row.querySelector('.rev-avatar')) return;

    // build badge
    const initials = (nameEl.textContent.trim().split(/\s+/).map(s=>s[0]).filter(Boolean).slice(0,1) + (nameEl.textContent.trim().split(/\s+/).pop()||'')[0]).toUpperCase();
    const badge = document.createElement('span');
    badge.className = 'rev-avatar';
    badge.textContent = initials;
    badge.style.setProperty('--bg', colors[hash(nameEl.textContent) % colors.length]);

    // remove any old photo
    //const oldImg = card.querySelector('img'); if (oldImg) oldImg.remove();

    // insert the badge LEFT of the name wrapper
    row.insertBefore(badge, nameWrap);
  });
    
    if (!host || !track || host.dataset.carouselInit === '1') return;
    host.dataset.carouselInit = '1';

    const slides = Array.from(track.children);
    if (slides.length === 0) return;

    // Make track focusable for keyboard control
    track.setAttribute('tabindex', '0');

    // Build nav + dots if not present
    const prev = document.createElement('button');
    prev.className = 'rev-btn prev'; prev.innerHTML = '&#10094;'; prev.ariaLabel = 'Previous';

    const next = document.createElement('button');
    next.className = 'rev-btn next'; next.innerHTML = '&#10095;'; next.ariaLabel = 'Next';

    const dotsWrap = document.createElement('div'); dotsWrap.className = 'rev-dots';
    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'rev-dot'; d.type = 'button'; d.ariaLabel = `Go to slide ${i + 1}`;
      d.addEventListener('click', () => { stopAuto(); goTo(i); restartAutoLater(); });
      dotsWrap.appendChild(d);
      return d;
    });

    host.appendChild(prev);
    host.appendChild(next);
    host.appendChild(dotsWrap);

    // Helpers
    const gap = () => parseFloat(getComputedStyle(track).gap) || 0;
    const slideW = () => slides[0].getBoundingClientRect().width + gap();
    const perView = () => parseFloat(getComputedStyle(track).getPropertyValue('--perView')) || 1;
    const maxStartIndex = () => Math.max(0, slides.length - Math.ceil(perView()));

    function activeIndex() { return Math.round(track.scrollLeft / slideW()); }
    function goTo(i) {
      const idx = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: Math.round(idx * slideW()), behavior: 'smooth' });
    }
    function refresh() {
      const i = activeIndex();
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
      prev.disabled = (i === 0);
      next.disabled = (perView() === 1 && i >= slides.length - 1);
    }

    // Nav button actions
    prev.addEventListener('click', () => { stopAuto(); goTo(activeIndex() - 1); restartAutoLater(); });
    next.addEventListener('click', () => { stopAuto(); goTo(activeIndex() + 1); restartAutoLater(); });

    // Keyboard
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); next.click(); restartAutoLater(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stopAuto(); prev.click(); restartAutoLater(); }
    });

    // Debounced refresh on scroll/resize
    track.addEventListener('scroll', () => { clearTimeout(track._t); track._t = setTimeout(refresh, 60); });
    window.addEventListener('resize', () => setTimeout(() => { refresh(); resetAuto(); }, 60));

    // ===== Autoplay =====
    const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoTimer = null, resumeTimer = null;
    const INTERVAL = 3000;

    function tick() {
      const i = activeIndex();
      const maxI = maxStartIndex();
      const nextI = (i >= maxI) ? 0 : i + 1;  // wrap to start
      goTo(nextI);
    }
    function startAuto() {
      if (PREFERS_REDUCED) return;
      if (autoTimer || slides.length <= perView()) return;
      autoTimer = setInterval(tick, INTERVAL);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
    }
    function restartAutoLater(delay = 4000) {
      if (PREFERS_REDUCED) return;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { startAuto(); }, delay);
    }
    function resetAuto() {
      stopAuto();
      startAuto();
    }

    // Pause on hover/focus/touch, resume after
    host.addEventListener('mouseenter', stopAuto);
    host.addEventListener('mouseleave', () => restartAutoLater(1000));
    track.addEventListener('focusin', stopAuto);
    track.addEventListener('focusout', () => restartAutoLater(1500));
    track.addEventListener('pointerdown', stopAuto, { passive: true });
    track.addEventListener('pointerup', () => restartAutoLater(2000), { passive: true });

    // Pause when tab/window not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else restartAutoLater(1000);
    });

    // Init
    refresh();
    startAuto();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewsCarousel);
  } else {
    initReviewsCarousel();
  }
})();

/* ===========================
   Quote form: init + UX + submit
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const form = document.querySelector('#quoteForm');
  if (!form) return; // form not on this page

  // UI refs (all queried inside the form)
  const statusEl   = form.querySelector('#formStatus');
  const serviceSel = form.querySelector('#serviceSelect');
  const photosIn   = form.querySelector('#photos');
  const dropZone   = form.querySelector('#dropZone');
  const previewUl  = form.querySelector('#preview');
  const submitBtn  = form.querySelector('.btn-send');

  const MAX_FILES = 5;
  const MAX_SIZE  = 10 * 1024 * 1024; // 10 MB

  // ---- Helpers -------------------------------------------------------------

  const setStatus = (msg, ok = true) => {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.style.color = ok ? '#2f6d2e' : '#b91c1c';
  };

  const clearStatus = () => setStatus('', true);

  const validateService = () => {
    if (!serviceSel) return true;
    const valid = !!serviceSel.value;
    serviceSel.setCustomValidity(valid ? '' : 'Please select a service.');
    return valid;
  };

  const resetPreview = () => {
    if (previewUl) previewUl.innerHTML = '';
  };

  const applyFilesToInput = (files) => {
    // Creates a new FileList for the input
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    photosIn.files = dt.files;
  };

  const renderThumbs = (files) => {
    resetPreview();
    if (!previewUl) return;
    files.forEach(f => {
      const li   = document.createElement('li');
      const img  = document.createElement('img');
      const cap  = document.createElement('span');
      cap.textContent = f.name;

      li.appendChild(img);
      li.appendChild(cap);
      previewUl.appendChild(li);

      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(f);
    });
  };

  const pickAcceptedImages = (fileList) => {
    const accepted = [];
    clearStatus();

    for (const f of fileList) {
      if (!f.type || !f.type.startsWith('image/')) continue;
      if (f.size > MAX_SIZE) {
        setStatus(`“${f.name}” is larger than 10MB.`, false);
        continue;
      }
      accepted.push(f);
      if (accepted.length >= MAX_FILES) break;
    }

    if (accepted.length === 0 && fileList.length > 0) {
      // All rejected due to size/type
      resetPreview();
    }
    if (fileList.length > MAX_FILES) {
      setStatus(`You can upload up to ${MAX_FILES} images.`, false);
    }
    return accepted;
  };

  const handleFiles = (files) => {
    const list = Array.from(files);
    const accepted = pickAcceptedImages(list);
    applyFilesToInput(accepted);
    renderThumbs(accepted);
  };

  // ---- Events: service validation -----------------------------------------

  if (serviceSel) {
    serviceSel.addEventListener('change', validateService);
    validateService();
  }

  // ---- Events: file input + drag & drop -----------------------------------

  if (photosIn) {
    photosIn.addEventListener('change', (e) => handleFiles(e.target.files));
  }

  if (dropZone) {
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

    ['dragenter', 'dragover'].forEach((type) => {
      dropZone.addEventListener(type, (e) => {
        prevent(e);
        dropZone.classList.add('drag');
      });
    });

    ['dragleave', 'drop'].forEach((type) => {
      dropZone.addEventListener(type, (e) => {
        prevent(e);
        dropZone.classList.remove('drag');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length) handleFiles(files);
    });
  }

  // ---- Submit --------------------------------------------------------------
/*
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    // Run native + custom validation
    const serviceOK = validateService();
    if (!form.checkValidity() || !serviceOK) {
      form.reportValidity();
      return;
    }

    // If you’re posting to a real endpoint:
    // 1) Put the URL in form.action (Formspree/Netlify/your API)
    // 2) Uncomment the fetch block below
    // 3) Optional: set Accept header for JSON responses

    const endpoint = form.getAttribute('action');
    const hasEndpoint = endpoint && endpoint !== '#';

    submitBtn?.setAttribute('disabled', 'true');

    try {
      if (hasEndpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
          // Try reading message (Formspree sends JSON on error)
          let msg = 'Something went wrong. Please try again.';
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch (_) {}
          throw new Error(msg);
        }
      }

      // Success UI
      form.reset();
      resetPreview();
      validateService();
      setStatus('Thanks! We’ll be in touch shortly.');
    } catch (err) {
      setStatus(err?.message || 'Network error. Please try again.', false);
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
  */
});


document.addEventListener('DOMContentLoaded', function() {
  // Track WhatsApp clicks (any link with wa.me in href)
  document.querySelectorAll("a[href*='wa.me']").forEach(function(el) {
    el.addEventListener("click", function() {
      gtag('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: 'WhatsApp Contact'
      });
    });
  });

  // Track Email clicks (any mailto: link)
  document.querySelectorAll("a[href^='mailto:']").forEach(function(el) {
    el.addEventListener("click", function() {
      gtag('event', 'email_click', {
        event_category: 'engagement',
        event_label: 'Email Contact'
      });
    });
  });
});

// Helper function to delay opening a URL until a gtag event is sent
function gtagSendEvent(url) {
  var callback = function () {
    if (typeof url === 'string') {
      window.location = url;
    }
  };
  gtag('event', 'whatsapp_click', {
    'event_callback': callback,
    'event_timeout': 2000
  });
  return false;
}
