/* =========================================
   PLUGINS
   ========================================= */
gsap.registerPlugin(ScrollTrigger);

/* =========================================
   HELPERS
   ========================================= */
function addMagneticHover(el, strength = 0.35) {
  el.addEventListener('mousemove', (e) => {
    const r  = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
}

function addClickPunch(el) {
  el.addEventListener('mousedown', () => {
    gsap.to(el, { scale: 0.88, duration: 0.1, ease: 'power2.in' });
  });
  el.addEventListener('mouseup', () => {
    gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1.4, 0.4)' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
  });
}

/* =========================================
   SCROLL PROGRESS BAR
   ========================================= */
const progressBar = document.getElementById('scrollProgress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = ((window.scrollY / max) * 100).toFixed(2) + '%';
  }, { passive: true });
}

/* =========================================
   NAV — scroll + hamburger
   ========================================= */
const nav        = document.getElementById('nav');
const navToggle  = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobileMenu');
const menuLinks  = document.querySelectorAll('.menu-link');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  updateBottomNav();
}, { passive: true });

navToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)';
    spans[1].style.opacity = '0';
    spans[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)';
  } else {
    spans.forEach(s => (s.style.cssText = ''));
  }
});
menuLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.querySelectorAll('span').forEach(s => (s.style.cssText = ''));
  });
});

/* =========================================
   HERO — ORCHESTRATED LOAD ANIMATION
   ========================================= */
(function initHeroTimeline() {
  /* Set initial hidden states — GSAP owns opacity from here */
  gsap.set('.hero-tag-row',   { opacity: 0, y: 16 });
  gsap.set('.hero-sub',       { opacity: 0, y: 14 });
  gsap.set('.hero-stats',     { opacity: 0, y: 22 });
  gsap.set('.hero-cta .btn',  { opacity: 0, y: 18 });
  gsap.set('.tool-badge',     { opacity: 0, scale: 0.5, rotation: -18 });
  gsap.set('.archive-card',   { opacity: 0, x: 48 });
  gsap.set('.archive-card .barcode-svg rect', { scaleY: 0, transformOrigin: 'bottom' });

  /* Name starts below clip boundary */
  gsap.set('.handwrite-big',  { yPercent: 108 });

  const tl = gsap.timeline({ delay: 0.15 });

  tl
    /* ── Name slides up through .name-clip overflow:hidden ── */
    .to('.handwrite-big', {
      yPercent: 0,
      duration: 1.2,
      ease: 'power4.out'
    })
    /* ── Tag row ── */
    .to('.hero-tag-row', {
      opacity: 1, y: 0,
      duration: 0.55, ease: 'power3.out'
    }, '-=0.8')
    /* ── Subtitle ── */
    .to('.hero-sub', {
      opacity: 1, y: 0,
      duration: 0.5, ease: 'power2.out'
    }, '-=0.65')
    /* ── Stats box ── */
    .to('.hero-stats', {
      opacity: 1, y: 0,
      duration: 0.55, ease: 'back.out(1.5)'
    }, '-=0.55')
    /* ── CTA buttons ── */
    .to('.hero-cta .btn', {
      opacity: 1, y: 0,
      stagger: 0.12, duration: 0.45, ease: 'back.out(1.8)'
    }, '-=0.45')
    /* ── Tool badges ── */
    .to('.tool-badge', {
      opacity: 1, scale: 1, rotation: 0,
      stagger: 0.08, duration: 0.45, ease: 'back.out(2.5)'
    }, '-=0.4')
    /* ── Archive card slides from right ── */
    .to('.archive-card', {
      opacity: 1, x: 0,
      duration: 0.9, ease: 'power3.out'
    }, 0.35)
    /* ── Barcode lines draw in ── */
    .to('.archive-card .barcode-svg rect', {
      scaleY: 1,
      duration: 0.5, stagger: 0.007, ease: 'power2.out'
    }, '-=0.35');
})();

/* =========================================
   SCROLL REVEALS (section content)
   ========================================= */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
);
/* Skip .archive-card — handled by hero timeline above */
document.querySelectorAll('.reveal:not(.archive-card)').forEach(el => revealObserver.observe(el));

/* Immediately reveal elements already in viewport */
requestAnimationFrame(() => {
  document.querySelectorAll('.reveal:not(.visible):not(.archive-card)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
  });
});

/* =========================================
   STAT COUNTERS — count up on scroll enter
   ========================================= */
document.querySelectorAll('.stat-n').forEach(el => {
  const raw    = el.textContent.trim();
  const num    = parseInt(raw) || 0;
  const suffix = raw.replace(/\d+/, '');

  el.textContent = '0' + suffix;

  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    once: true,
    onEnter() {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: num,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate() {
          el.textContent = Math.round(obj.val) + suffix;
        }
      });
    }
  });
});

/* =========================================
   EXPERIENCE — clip-path wipe + bullet stagger
   ========================================= */
document.querySelectorAll('.exp-company').forEach(el => {
  gsap.fromTo(el,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.05,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    }
  );
});

document.querySelectorAll('.exp-role, .exp-date').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, x: -16 },
    { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' } }
  );
});

document.querySelectorAll('.exp-card').forEach(card => {
  const bullets = card.querySelectorAll('.exp-bullets li');
  if (!bullets.length) return;
  gsap.fromTo(bullets,
    { opacity: 0, x: -18 },
    { opacity: 1, x: 0, stagger: 0.07, duration: 0.5, ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 80%' } }
  );
});

/* =========================================
   SECTION INDEX NUMBERS — scroll parallax
   ========================================= */
document.querySelectorAll('.sec-num').forEach(el => {
  const section = el.closest('section');
  if (!section) return;
  gsap.to(el, {
    yPercent: -38,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end:   'bottom top',
      scrub: 1.8
    }
  });
});

/* =========================================
   WORKS CARDS — stagger cascade on scroll
   ========================================= */
(function initWorksReveal() {
  const grid = document.querySelector('.works-grid');
  if (!grid) return;

  ScrollTrigger.create({
    trigger: grid,
    start: 'top 88%',
    once: true,
    onEnter() {
      const cards = grid.querySelectorAll('.work-card');
      /* Add .visible first so CSS opacity:1 is the natural target */
      cards.forEach(c => c.classList.add('visible'));
      gsap.fromTo(cards,
        { opacity: 0, y: 55, scale: 0.93 },
        { opacity: 1, y: 0, scale: 1, duration: 0.75,
          stagger: { each: 0.09, from: 'start' }, ease: 'power3.out' }
      );
    }
  });
})();

/* =========================================
   CONTACT — title reveal on scroll
   ========================================= */
(function initContactReveal() {
  const title = document.querySelector('#contact .contact-title');
  if (!title) return;
  gsap.from(title, {
    opacity: 0, y: 40,
    duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: title, start: 'top 85%' }
  });
  const btn = document.querySelector('#contact .btn-primary');
  if (btn) {
    gsap.from(btn, {
      opacity: 0, y: 24, scale: 0.9,
      duration: 0.6, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: btn, start: 'top 90%' }
    });
  }
})();

/* =========================================
   GSAP MARQUEE — direction-aware
   ========================================= */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;

  /* Kill CSS animation — GSAP takes over */
  track.style.animation = 'none';

  const speed      = 1.1;   // px/frame at ~60fps
  let   x          = 0;
  let   dir        = 1;     // 1 = left (normal), -1 = right (scroll-up)
  let   targetDir  = 1;
  let   lastY      = window.scrollY;

  window.addEventListener('scroll', () => {
    const cy = window.scrollY;
    targetDir = cy >= lastY ? 1 : -1;
    lastY = cy;
  }, { passive: true });

  gsap.ticker.add(() => {
    /* Smooth direction transition */
    dir += (targetDir - dir) * 0.06;

    /* Half-width for seamless looping (content duplicated in HTML) */
    const half = track.scrollWidth / 2;
    x -= speed * dir;
    if (x <= -half) x += half;
    if (x >  0)     x -= half;
    gsap.set(track, { x });
  });
})();

/* =========================================
   GSAP — CTA buttons
   ========================================= */
document.querySelectorAll('.hero-cta .btn').forEach(btn => {
  addMagneticHover(btn, 0.4);
  addClickPunch(btn);
});
const contactBtn = document.querySelector('#contact .btn');
if (contactBtn) {
  addMagneticHover(contactBtn, 0.4);
  addClickPunch(contactBtn);
}

/* =========================================
   GSAP — stat pills hover
   ========================================= */
document.querySelectorAll('.stat-pill').forEach(pill => {
  pill.addEventListener('mouseenter', () => gsap.to(pill, { y: -6, scale: 1.06, duration: 0.35, ease: 'power2.out' }));
  pill.addEventListener('mouseleave', () => gsap.to(pill, { y:  0, scale: 1,    duration: 0.55, ease: 'elastic.out(1, 0.45)' }));
});

/* =========================================
   GSAP — tool badges hover
   ========================================= */
document.querySelectorAll('.tool-badge').forEach(badge => {
  badge.addEventListener('mouseenter', () => gsap.to(badge, { scale: 1.22, y: -4, duration: 0.28, ease: 'back.out(2)' }));
  badge.addEventListener('mouseleave', () => gsap.to(badge, { scale: 1,    y:  0, duration: 0.45, ease: 'elastic.out(1, 0.4)' }));
  addClickPunch(badge);
});

/* =========================================
   GSAP — filter buttons + filtering
   ========================================= */
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
  btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.08, y: -3, duration: 0.3, ease: 'back.out(2)' }));
  btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1,    y:  0, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' }));
  addClickPunch(btn);

  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter    = btn.dataset.filter;
    const noResults = document.getElementById('noResults');
    let visibleCount = 0;

    document.querySelectorAll('.work-card').forEach(card => {
      const match = filter === 'all' || card.dataset.cat === filter;
      if (match) {
        visibleCount++;
        card.classList.remove('hidden');
        card.classList.add('visible');
        gsap.fromTo(card,
          { opacity: 0, y: 24, scale: 0.94 },
          { opacity: 1, y:  0, scale: 1, duration: 0.4, ease: 'back.out(1.5)', delay: visibleCount * 0.05 }
        );
        gsap.set(card, { rotation: card.matches(':nth-child(odd)') ? -1.5 : 1.2 });
      } else {
        gsap.to(card, {
          opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in',
          onComplete: () => card.classList.add('hidden')
        });
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      if (visibleCount === 0) gsap.fromTo(noResults, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
    }
  });
});

/* =========================================
   GSAP — polaroid cards tilt + hover
   ========================================= */
document.querySelectorAll('.polaroid').forEach((card, i) => {
  const tilt = i % 2 === 0 ? -1.5 : 1.2;
  gsap.set(card, { rotation: tilt });

  card.addEventListener('mouseenter', () => {
    gsap.to(card, { rotation: 0, y: -6, scale: 1.02, boxShadow: '0 12px 40px rgba(16,16,16,0.14)', duration: 0.35, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotation: tilt, y: 0, scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  });

  const openBtn = card.querySelector('.work-open-btn');
  if (openBtn) {
    openBtn.addEventListener('mouseenter', () => gsap.to(openBtn, { scale: 1.2, rotation: 15, duration: 0.3, ease: 'back.out(2)' }));
    openBtn.addEventListener('mouseleave', () => gsap.to(openBtn, { scale: 1, rotation:  0, duration: 0.4, ease: 'elastic.out(1, 0.4)' }));
    addClickPunch(openBtn);
  }
});

/* =========================================
   GSAP — experience cards 3D tilt hover
   ========================================= */
document.querySelectorAll('.exp-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(card, { rotationY: nx * 6, rotationX: -ny * 4, y: -4, transformPerspective: 900, duration: 0.35, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, transformPerspective: 900, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
});

/* =========================================
   IMAGE LIGHTBOX
   ========================================= */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxCat   = document.getElementById('lightboxCat');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDesc  = document.getElementById('lightboxDesc');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(card) {
  lightboxImg.src           = card.dataset.img   || '';
  lightboxImg.alt           = card.dataset.title || '';
  lightboxCat.textContent   = card.dataset.cat   || '';
  lightboxTitle.textContent = card.dataset.title || '';
  lightboxDesc.textContent  = card.dataset.desc  || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  gsap.fromTo(
    lightbox.querySelector('.lightbox-content'),
    { opacity: 0, scale: 0.9, y: 24 },
    { opacity: 1, scale: 1,   y:  0, duration: 0.4, ease: 'back.out(1.5)' }
  );
}
function closeLightbox() {
  gsap.to(lightbox.querySelector('.lightbox-content'), {
    opacity: 0, scale: 0.92, y: 16, duration: 0.25, ease: 'power2.in',
    onComplete: () => { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  });
}

document.querySelectorAll('.work-card').forEach(card => {
  const btn = card.querySelector('.work-open-btn');
  if (btn) btn.addEventListener('click', e => { e.stopPropagation(); openLightbox(card); });
  card.addEventListener('click', () => openLightbox(card));
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lightboxClose.addEventListener('mouseenter', () => gsap.to(lightboxClose, { scale: 1.2, rotation: 90, duration: 0.3, ease: 'back.out(2)' }));
lightboxClose.addEventListener('mouseleave', () => gsap.to(lightboxClose, { scale: 1, rotation:  0, duration: 0.35, ease: 'power2.out' }));

/* =========================================
   VIDEO MODAL
   ========================================= */
const videoModal      = document.getElementById('videoModal');
const videoPlayer     = document.getElementById('videoPlayer');
const videoModalClose = document.getElementById('videoModalClose');

function closeVideoModal() {
  videoPlayer.pause();
  gsap.to(videoModal.querySelector('.video-modal-inner'), {
    opacity: 0, scale: 0.9, duration: 0.22, ease: 'power2.in',
    onComplete: () => { videoModal.classList.remove('open'); videoPlayer.src = ''; document.body.style.overflow = ''; }
  });
}
videoModalClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideoModal(); });

/* =========================================
   KEYBOARD
   ========================================= */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeVideoModal(); }
});

/* =========================================
   CUSTOM CURSOR — disabled (system cursor)
   ========================================= */
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  /* CSS hides them via display:none — nothing to init */
})();

/* =========================================
   PARTICLE CANVAS — disabled via CSS opacity:0
   ========================================= */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  }, { passive: true });

  const PALETTE = ['#c4bdb0', '#b0a898', '#cc1e0e', '#8a8278', '#d4c8b8', '#a09488'];
  const COUNT   = 65;

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x     = Math.random() * W;
      this.y     = init ? Math.random() * H : H + 16;
      this.r     = Math.random() * 4.5 + 1.5;
      this.vy    = Math.random() * 0.45 + 0.12;
      this.phase = Math.random() * Math.PI * 2;
      this.amp   = Math.random() * 0.7 + 0.2;
      this.freq  = Math.random() * 0.018 + 0.006;
      this.rot   = Math.random() * Math.PI * 2;
      this.drot  = (Math.random() - 0.5) * 0.025;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.alpha = Math.random() * 0.45 + 0.15;
      this.star  = Math.random() > 0.55;
    }
    update() {
      this.phase += this.freq;
      this.x    += Math.sin(this.phase) * this.amp;
      this.y    -= this.vy;
      this.rot  += this.drot;
      if (this.y < -16) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      if (this.star) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const rad = i % 2 === 0 ? this.r : this.r * 0.42;
          i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
                  : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const particles = Array.from({ length: COUNT }, () => new Particle());
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) { p.update(); p.draw(); }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* =========================================
   3D TILT — archive card
   ========================================= */
(function initArchiveTilt() {
  const card = document.querySelector('.archive-card');
  if (!card) return;
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(card, { rotationY: nx * 14, rotationX: -ny * 9, transformPerspective: 700, duration: 0.4, ease: 'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotationY: 0, rotationX: 0, transformPerspective: 700, duration: 0.85, ease: 'elastic.out(1, 0.4)' });
  });
})();

/* =========================================
   BOTTOM NAV (mobile)
   ========================================= */
const NAV_ITEMS = [
  { id: 'profile',    label: 'Profile',  icon: '◉' },
  { id: 'experience', label: 'Exp',      icon: '✦' },
  { id: 'works',      label: 'Works',    icon: '◈' },
  { id: 'videos',     label: 'Videos',   icon: '▶' },
  { id: 'contact',    label: 'Contact',  icon: '✉' },
];

const bottomNav = document.createElement('nav');
bottomNav.id = 'bottomNav';
bottomNav.setAttribute('aria-label', 'Mobile navigation');
bottomNav.innerHTML = `
  <div class="bnav-track">
    ${NAV_ITEMS.map((item, i) => `
      <a href="#${item.id}" class="bnav-item${i === 0 ? ' active' : ''}" data-section="${item.id}">
        <span class="bnav-icon">${item.icon}</span>
        <span class="bnav-label">${item.label}</span>
      </a>
    `).join('')}
    <div class="bnav-bubble" aria-hidden="true"></div>
  </div>
`;
document.body.appendChild(bottomNav);

const bnavStyle = document.createElement('style');
bnavStyle.textContent = `
  #bottomNav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 150;
    background: rgba(243, 240, 235, 0.96);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(16,16,16,0.1);
  }
  .bnav-track {
    display: flex; align-items: stretch; justify-content: space-around;
    background: none; border-radius: 0; box-shadow: none;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom);
    position: relative;
  }
  .bnav-bubble { display: none; }
  .bnav-item {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0; padding: 12px 8px 10px;
    text-decoration: none; position: relative; flex: 1;
    border-top: 2px solid transparent;
    transition: border-color 0.18s;
  }
  .bnav-item.active { border-top-color: #101010; }
  .bnav-icon { display: none; }
  .bnav-label {
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(16,16,16,0.38);
    white-space: nowrap;
    font-weight: 400;
    transition: color 0.18s;
  }
  .bnav-item.active .bnav-label { color: #101010; font-weight: 700; }
  @media (max-width: 768px) {
    #bottomNav { display: block; }
    body { padding-bottom: 50px; }
    .mobile-menu { padding-bottom: 50px; }
  }
`;
document.head.appendChild(bnavStyle);

const bnavItems = document.querySelectorAll('.bnav-item');

bnavItems.forEach(item => {
  item.addEventListener('click', () => {
    bnavItems.forEach(b => b.classList.remove('active'));
    item.classList.add('active');
  });
});

function updateBottomNav() {
  const sectionEls = Array.from(document.querySelectorAll('section[id]'));
  const scrollY    = window.scrollY + window.innerHeight * 0.35;
  let current = sectionEls[0];
  for (const s of sectionEls) { if (s.offsetTop <= scrollY) current = s; }
  bnavItems.forEach(b => b.classList.toggle('active', b.dataset.section === current.id));
}

setTimeout(() => updateBottomNav(), 120);
