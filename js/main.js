/* ============================================================
   STUDIO BELLA — main.js
   Splash, cursor, parallax, scroll reveal, dark mode,
   pull-to-refresh, testimonials, stats counter, menu
============================================================ */

'use strict';

/* ── Constantes ──────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Splash Screen ───────────────────────────────────────── */
(function initSplash() {
  const splash = $('#splash');
  const canvas = $('#particles-canvas');
  if (!splash || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H + H,
      size: Math.random() * 8 + 4,
      speedY: -(Math.random() * 1.2 + 0.4),
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      emoji: ['🌸','✨','🌺','💫','⭐','🌟'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
    };
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      if (p.y < -20) particles[i] = createParticle();
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.font = `${p.size * 2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    });
    raf = requestAnimationFrame(drawParticles);
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 30; i++) {
    const p = createParticle();
    p.y = Math.random() * H;
    particles.push(p);
  }
  drawParticles();

  setTimeout(() => {
    splash.classList.add('hide');
    cancelAnimationFrame(raf);
    setTimeout(() => {
      splash.style.display = 'none';
      document.body.style.overflow = '';
    }, 900);
  }, 3000);

  document.body.style.overflow = 'hidden';
})();

/* ── Custom Cursor (desktop) ─────────────────────────────── */
(function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  const cursor = $('#custom-cursor');
  const trail  = $('#cursor-trail');
  if (!cursor || !trail) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  (function animTrail() {
    tx += (mx - tx) * 0.15;
    ty += (my - ty) * 0.15;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  })();

  document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(0.8)');
  document.addEventListener('mouseup',   () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
})();

/* ── Scroll Progress Bar ─────────────────────────────────── */
(function initScrollBar() {
  const bar = $('#scroll-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / total * 100) + '%';
  }, { passive: true });
})();

/* ── Header scroll behavior ──────────────────────────────── */
(function initHeader() {
  const header = $('#site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ── Mobile Menu ─────────────────────────────────────────── */
(function initMenu() {
  const btn = $('#menu-btn');
  const nav = $('#main-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  $$('[data-nav]', nav).forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
})();

/* ── Dark / Light Mode ───────────────────────────────────── */
(function initTheme() {
  const btn  = $('#theme-toggle');
  const icon = btn ? btn.querySelector('.theme-icon') : null;
  const html = document.documentElement;
  const KEY  = 'bella-theme';

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(KEY, theme);
  }

  const saved = localStorage.getItem(KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  apply(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      btn.classList.add('spinning');
      setTimeout(() => btn.classList.remove('spinning'), 400);
      apply(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }
})();

/* ── Scroll Reveal ───────────────────────────────────────── */
(function initScrollReveal() {
  const els = $$('.reveal, .reveal-group');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

/* ── Parallax Hero ───────────────────────────────────────── */
(function initParallax() {
  const bg = $('#hero-bg');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        bg.style.transform = `translateY(${window.scrollY * 0.35}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── Pull-to-Refresh visual ──────────────────────────────── */
(function initPullToRefresh() {
  const loader = $('#ptr-loader');
  if (!loader) return;

  let startY = 0, pulling = false, triggered = false;
  const THRESHOLD = 80;

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY;
      pulling = true;
      triggered = false;
    }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!pulling) return;
    const delta = e.touches[0].pageY - startY;
    if (delta > 20) {
      loader.classList.add('visible');
      if (delta > THRESHOLD && !triggered) triggered = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    loader.classList.remove('visible');
    if (triggered) {
      setTimeout(() => window.location.reload(), 400);
    }
  });
})();

/* ── Floating Petals (background decoration) ─────────────── */
(function initPetals() {
  const hero = $('#hero');
  if (!hero) return;
  const emojis = ['🌸','✨','🌺','💫'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'petal';
    el.textContent = emojis[i % emojis.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${6 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 6}s;
      font-size: ${0.8 + Math.random() * 0.8}rem;
    `;
    hero.appendChild(el);
  }
})();

/* ── Service Cards + Modal ───────────────────────────────── */
const SERVICE_DATA = {
  cilios: {
    icon: '👁️',
    title: 'Extensão de Cílios',
    desc: 'Transforme seu olhar com fios de alta qualidade aplicados um a um. Resultado natural ou dramático, conforme seu estilo.',
    details: [
      'Fio a fio, volume russo e mega volume',
      'Fios de seda, silicone e mink',
      'Duração de 3 a 6 semanas',
      'Manutenção quinzenal disponível',
    ],
    price: 'A partir de <strong>R$ 120</strong>',
  },
  unhas: {
    icon: '💅',
    title: 'Nail Designer',
    desc: 'Arte exclusiva nas pontas dos dedos com os melhores materiais do mercado.',
    details: [
      'Gel, acrigel e fibra de vidro',
      'Nail art personalizada',
      'Esmaltação em gel (3 semanas)',
      'Remoção e preparação incluídas',
    ],
    price: 'A partir de <strong>R$ 80</strong>',
  },
  sobrancelhas: {
    icon: '✨',
    title: 'Design de Sobrancelhas',
    desc: 'Moldagem perfeita que enquadra e valoriza seu rosto, com henna ou micropigmentação.',
    details: [
      'Design personalizado para seu rosto',
      'Henna (duração até 4 semanas)',
      'Micropigmentação (duração 1-2 anos)',
      'Linha e pinça para acabamento perfeito',
    ],
    price: 'A partir de <strong>R$ 45</strong>',
  },
  lash: {
    icon: '🌟',
    title: 'Lash Lifting',
    desc: 'Cílios naturais curvados e renovados com queratina. Zero colagem, zero extensão.',
    details: [
      'Curvatura personalizada (C, D, L)',
      'Inclui tintura de cílios',
      'Duração até 8 semanas',
      'Procedimento seguro e sem dor',
    ],
    price: 'A partir de <strong>R$ 90</strong>',
  },
  manicure: {
    icon: '🌸',
    title: 'Manicure & Pedicure',
    desc: 'Tratamento completo e relaxante para mãos e pés com produtos de alta qualidade.',
    details: [
      'Hidratação profunda',
      'Esmaltação comum ou gel',
      'Remoção de calosidades (pés)',
      'Massagem relaxante incluída',
    ],
    price: 'A partir de <strong>R$ 35</strong>',
  },
  depilacao: {
    icon: '🌺',
    title: 'Depilação',
    desc: 'Pele lisa e macia com o menor desconforto possível. Técnicas variadas para cada região.',
    details: [
      'Cera quente e cera fria',
      'Linha para rosto e buço',
      'Todos os tipos de pele',
      'Pós-depilação calmante incluso',
    ],
    price: 'A partir de <strong>R$ 25</strong>',
  },
};

(function initServices() {
  const modal    = $('#service-modal');
  const mIcon    = $('#modal-icon');
  const mTitle   = $('#modal-title');
  const mDesc    = $('#modal-desc');
  const mDetails = $('#modal-details');
  const mPrice   = $('#modal-price');
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;
  if (!modal) return;

  function openModal(key) {
    const d = SERVICE_DATA[key];
    if (!d) return;
    mIcon.textContent  = d.icon;
    mTitle.textContent = d.title;
    mDesc.textContent  = d.desc;
    mDetails.innerHTML = d.details.map(t => `<li>${t}</li>`).join('');
    mPrice.innerHTML   = d.price;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-cta').focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  $$('.service-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.service));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.service);
    });
  });

  closeBtn && closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* ── Testimonials Carousel ───────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ana Clara', service: 'Extensão de Cílios', text: 'Simplesmente apaixonada! Meus cílios ficaram perfeitos, naturais e duraram mais de um mês. Profissionalismo impecável!', rating: 5, color: '#F4A7B9' },
  { name: 'Bianca Lima', service: 'Nail Designer', text: 'As unhas ficaram lindíssimas! Nail art exclusiva, acabamento perfeito e a atenção da profissional foi incrível.', rating: 5, color: '#C9A86C' },
  { name: 'Camila Souza', service: 'Design de Sobrancelhas', text: 'Já era fã da micropigmentação, mas aqui superou tudo. Resultado natural, moldagem perfeita para meu rosto!', rating: 5, color: '#F5E6DA' },
  { name: 'Daniela Rocha', service: 'Lash Lifting', text: 'Nunca mais volto à máscara de cílios. O lash lifting durou 7 semanas e meus cílios pareciam sempre arrumados.', rating: 5, color: '#D4A0B8' },
  { name: 'Eduarda Melo', service: 'Manicure & Pedicure', text: 'Ambiente aconchegante, atendimento carinhoso e minhas unhas ficaram lindas. Indico de olhos fechados!', rating: 5, color: '#B8A0C9' },
  { name: 'Fernanda Dias', service: 'Depilação', text: 'Super profissional e cuidadosa. Uso cera quente e nunca senti tanto conforto. Voltei três vezes já!', rating: 4, color: '#A0B8C9' },
];

(function initTestimonials() {
  const track = $('#testimonials-track');
  const dots  = $('#testimonials-dots');
  if (!track) return;

  TESTIMONIALS.forEach((t, i) => {
    const stars = '⭐'.repeat(t.rating) + (t.rating < 5 ? '☆'.repeat(5 - t.rating) : '');
    const initials = t.name.split(' ').map(w => w[0]).join('').slice(0,2);
    const card = document.createElement('article');
    card.className = 'testimonial-card glass-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="test-header">
        <div class="test-avatar" style="background:${t.color}">${initials}</div>
        <div class="test-info">
          <div class="test-stars" aria-label="${t.rating} estrelas">${stars}</div>
          <div class="test-name">${t.name}</div>
          <div class="test-service">${t.service}</div>
        </div>
      </div>
      <p class="test-text">${t.text}</p>
    `;
    track.appendChild(card);
  });

  TESTIMONIALS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 't-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots && dots.appendChild(dot);
  });

  let current = 0, autoInterval, isDragging = false;
  let startX = 0, diffX = 0;

  function goTo(idx) {
    const cards = $$('.testimonial-card', track);
    if (!cards.length) return;
    current = ((idx % cards.length) + cards.length) % cards.length;
    const cardW = cards[0].offsetWidth + 16;
    track.style.transform = `translateX(-${current * cardW}px)`;
    $$('.t-dot', dots).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function startAuto() { autoInterval = setInterval(next, 3800); }
  function stopAuto()  { clearInterval(autoInterval); }

  /* Touch / mouse swipe */
  const wrap = track.parentElement;
  if (wrap) {
    wrap.addEventListener('touchstart',  e => { startX = e.touches[0].clientX; isDragging = true; stopAuto(); }, { passive: true });
    wrap.addEventListener('touchmove',   e => { if (isDragging) diffX = e.touches[0].clientX - startX; }, { passive: true });
    wrap.addEventListener('touchend',    () => { isDragging = false; if (diffX < -40) next(); else if (diffX > 40) goTo(current - 1); diffX = 0; startAuto(); });
    wrap.addEventListener('mouseenter',  () => stopAuto());
    wrap.addEventListener('mouseleave',  () => startAuto());
  }

  window.addEventListener('resize', () => goTo(current));
  goTo(0);
  startAuto();
})();

/* ── Stats Counter ───────────────────────────────────────── */
(function initStats() {
  const nums = $$('.stat-number[data-target]');
  if (!nums.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const end = parseInt(el.dataset.target, 10);
      let start = 0;
      const dur = 1400;
      const step = Math.ceil(end / (dur / 16));
      const id = setInterval(() => {
        start = Math.min(start + step, end);
        el.textContent = start;
        if (start >= end) clearInterval(id);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
})();

/* ── Back to Top / FAB visibility ────────────────────────── */
(function initFloatingBtns() {
  const btt = $('#back-to-top');
  const fab = $('#fab');

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    if (btt) {
      if (show) btt.removeAttribute('hidden');
      else      btt.setAttribute('hidden', '');
    }
    if (fab) fab.classList.toggle('visible', show);
  }, { passive: true });

  if (btt) {
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

/* ── Button ripple effect ────────────────────────────────── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-primary');
  if (!btn) return;
  const r = document.createElement('span');
  r.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  r.style.left = (e.clientX - rect.left) + 'px';
  r.style.top  = (e.clientY - rect.top)  + 'px';
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

/* ── Footer year ─────────────────────────────────────────── */
const yearEl = $('#footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Register Service Worker (PWA) ──────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
