/* ============================================================
   STUDIO BELLA — services-gallery.js
   Galeria fullscreen mobile-first: slide-up, swipe, dots
============================================================ */
'use strict';

const ServiceGallery = (() => {
  const CATEGORY_META = {
    cilios:       { label: 'Extensão de Cílios',      icon: '👁️', color: 'linear-gradient(135deg,#f8c8d4 0%,#d4a0b8 100%)' },
    unhas:        { label: 'Nail Designer',            icon: '💅', color: 'linear-gradient(135deg,#fdd5e0 0%,#f4a7b9 100%)' },
    sobrancelhas: { label: 'Design de Sobrancelhas',   icon: '✨', color: 'linear-gradient(135deg,#f5e6da 0%,#c9a86c 100%)' },
    lash:         { label: 'Lash Lifting',             icon: '🌟', color: 'linear-gradient(135deg,#d4b8e0 0%,#c9a0d8 100%)' },
    manicure:     { label: 'Manicure & Pedicure',      icon: '🌸', color: 'linear-gradient(135deg,#fde8f0 0%,#f4a7b9 100%)' },
    depilacao:    { label: 'Depilação',                icon: '🌺', color: 'linear-gradient(135deg,#f9d4c8 0%,#e8a090 100%)' },
  };

  let overlay, originRect, activeCategory;
  const isMobile = () => window.innerWidth < 768;

  /* ── Init ──────────────────────────────────────────────── */
  function init() {
    overlay = document.getElementById('sg-overlay');
    if (!overlay) return;

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });

    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => open(card.dataset.service, card.getBoundingClientRect()));
    });
  }

  /* ── Open ──────────────────────────────────────────────── */
  function open(category, rect) {
    if (!overlay || !CATEGORY_META[category]) return;
    activeCategory = category;
    originRect = rect;

    // Pre-render content while overlay is off-screen (prevents "tap empty → close" race)
    renderContent(category);
    document.body.style.overflow = 'hidden';

    if (isMobile()) {
      /* Mobile: slide-up from bottom */
      overlay.style.transition = 'none';
      overlay.style.transform = 'translateY(100%)';
      overlay.style.opacity = '1';
      overlay.hidden = false;
      /* Force reflow so browser commits the initial position before animating */
      void overlay.offsetHeight;
      overlay.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
      overlay.style.transform = 'translateY(0)';
    } else {
      /* Desktop: expand from card */
      overlay.style.cssText = `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;border-radius:16px;opacity:0;transition:none;`;
      overlay.hidden = false;
      void overlay.offsetHeight;
      overlay.style.cssText = 'top:0;left:0;width:100vw;height:100dvh;border-radius:0;opacity:1;';
    }
  }

  /* ── Close ─────────────────────────────────────────────── */
  function close() {
    const content = overlay.querySelector('.sg-content');
    if (content) content.style.opacity = '0';

    if (isMobile()) {
      overlay.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1)';
      overlay.style.transform = 'translateY(100%)';
    } else {
      overlay.style.cssText = `top:${originRect?.top ?? 50}px;left:${originRect?.left ?? 50}px;width:${originRect?.width ?? 0}px;height:${originRect?.height ?? 0}px;border-radius:16px;opacity:0;`;
    }

    setTimeout(() => {
      overlay.hidden = true;
      overlay.style.cssText = '';
      overlay.innerHTML = '';
      document.body.style.overflow = '';
    }, 420);
  }

  /* ── Render content ────────────────────────────────────── */
  function renderContent(category) {
    const meta  = CATEGORY_META[category];
    const items = typeof BellaDB !== 'undefined' ? (BellaDB.getGallery()[category] || []) : [];

    overlay.innerHTML = `
      <div class="sg-content" style="opacity:0">
        <div class="sg-header" style="background:${meta.color}">
          <div class="sg-swipe-hint"></div>
          <button class="sg-close" aria-label="Fechar">✕</button>
          <div class="sg-header-inner">
            <span class="sg-icon">${meta.icon}</span>
            <h2 class="sg-title">${meta.label}</h2>
            <p class="sg-sub">Deslize para ver as opções ✨</p>
          </div>
        </div>
        <div class="sg-body">
          <div class="sg-grid" id="sg-grid-inner">
            ${items.length ? items.map((item, i) => renderCard(item, category, i)).join('') : renderEmpty()}
          </div>
          ${items.length > 1 ? `<div class="sg-dots">${items.map((_, i) => `<div class="sg-dot${i === 0 ? ' active' : ''}"></div>`).join('')}</div>` : ''}
        </div>
      </div>
    `;

    /* Close button */
    overlay.querySelector('.sg-close').addEventListener('click', close);

    /* Dots sync on scroll */
    const grid = overlay.querySelector('#sg-grid-inner');
    const dots = overlay.querySelectorAll('.sg-dot');
    if (grid && dots.length) {
      grid.addEventListener('scroll', () => {
        const idx = Math.round(grid.scrollLeft / grid.offsetWidth);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }, { passive: true });
    }

    /* Swipe down to close (mobile) */
    if (isMobile()) {
      let startY = 0, dragging = false;
      overlay.addEventListener('touchstart', e => { startY = e.touches[0].clientY; dragging = true; }, { passive: true });
      overlay.addEventListener('touchmove', e => {
        if (!dragging) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 0) overlay.style.transform = `translateY(${dy}px)`;
      }, { passive: true });
      overlay.addEventListener('touchend', e => {
        dragging = false;
        const dy = e.changedTouches[0].clientY - startY;
        if (dy > 90) { close(); } else { overlay.style.transform = 'translateY(0)'; overlay.style.transition = 'transform .3s ease'; }
      });
    }

    /* Book buttons */
    overlay.querySelectorAll('.sg-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        close();
        const svcSel = document.getElementById('f-servico');
        if (svcSel) svcSel.value = btn.dataset.service;
        setTimeout(() => {
          document.getElementById('agendamento')?.scrollIntoView({ behavior: 'smooth' });
        }, 460);
      });
    });

    /* Fade in content */
    requestAnimationFrame(() => {
      const c = overlay.querySelector('.sg-content');
      if (c) c.style.opacity = '1';
    });
  }

  /* ── Render card ───────────────────────────────────────── */
  function renderCard(item, category, index) {
    const meta = CATEGORY_META[category];
    const delay = index * 0.06;
    const imgHtml = item.img
      ? `<img src="${item.img}" alt="${item.name}" class="sg-card-img" loading="lazy" />`
      : `<div class="sg-card-img sg-card-placeholder" style="background:${meta.color}">${meta.icon}</div>`;

    return `
      <div class="sg-card" style="animation-delay:${delay}s">
        <div class="sg-card-media">
          ${imgHtml}
          <span class="sg-price-badge">R$ ${item.price}</span>
        </div>
        <div class="sg-card-info">
          <h3 class="sg-card-name">${item.name}</h3>
          <p class="sg-card-desc">${item.desc}</p>
          <div class="sg-card-footer">
            <span class="sg-card-price">R$ ${item.price}</span>
            <button class="sg-book-btn shimmer-btn" data-service="${meta.label}">
              Agendar agora
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmpty() {
    return `<div class="sg-empty"><span>🖼️</span><p>Nenhuma opção cadastrada ainda.<br/><a href="admin.html" target="_blank">Acesse o painel admin</a> para adicionar.</p></div>`;
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ServiceGallery.init.bind(ServiceGallery));
} else {
  ServiceGallery.init();
}
