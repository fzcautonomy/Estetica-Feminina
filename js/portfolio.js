/* ============================================================
   STUDIO BELLA — portfolio.js
   Grid masonry, filtros, lightbox, swipe gesture
============================================================ */

'use strict';

/* ── Gradientes de fallback por categoria ─────────────────── */
const CAT_GRADIENTS = {
  cilios:       'linear-gradient(135deg,#f8c8d4,#e8a0b8)',
  unhas:        'linear-gradient(135deg,#fdd5e0,#f4a7b9)',
  sobrancelhas: 'linear-gradient(135deg,#f5e6da,#e8d0b8)',
  lash:         'linear-gradient(135deg,#d4b8e0,#c9a0d8)',
  manicure:     'linear-gradient(135deg,#f9e0ea,#f0b8cc)',
  depilacao:    'linear-gradient(135deg,#e8d4b8,#d4b890)',
};

/* ── Estado do lightbox ──────────────────────────────────── */
let lbItems  = [];
let lbIndex  = 0;
let lbStartX = 0;

(function initPortfolio() {
  const grid       = $('#portfolio-grid');
  const filterBtns = $$('.filter-btn');
  const lightbox   = $('#lightbox');
  if (!grid) return;

  let activeFilter = 'all';

  /* ── Renderiza skeletons primeiro ──────────────────────── */
  function renderSkeletons() {
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const sk = document.createElement('div');
      sk.className = 'portfolio-item skeleton';
      sk.style.cssText = `aspect-ratio:3/4;${i % 3 === 0 ? 'aspect-ratio:3/5' : ''}`;
      grid.appendChild(sk);
    }
  }

  /* ── Renderiza os itens reais ──────────────────────────── */
  function renderItems(filter) {
    activeFilter = filter;
    const all      = BellaDB.getPortfolio();
    const filtered = filter === 'all' ? all : all.filter(it => it.cat === filter);

    lbItems = filtered;

    grid.innerHTML = '';
    filtered.forEach((item, i) => {
      const el = document.createElement('figure');
      el.className = 'portfolio-item';
      el.setAttribute('role', 'listitem');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', item.label);
      el.style.animationDelay = `${i * 0.06}s`;

      const gradient = CAT_GRADIENTS[item.cat] || 'linear-gradient(135deg,#f8c8d4,#c9a86c)';
      const mediaEl = item.img
        ? `<img class="portfolio-item-img" src="${item.img}" alt="${item.label}" loading="lazy" />`
        : `<div class="portfolio-item-img" style="background:${gradient};width:100%;aspect-ratio:${item.tall ? '3/5' : '3/4'};"></div>`;

      el.innerHTML = `
        ${mediaEl}
        <div class="portfolio-item-overlay">
          <span>${item.label}</span>
        </div>
      `;

      el.addEventListener('click',   () => openLightbox(i));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openLightbox(i); });
      grid.appendChild(el);
    });
  }

  /* ── Filtros ───────────────────────────────────────────── */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderSkeletons();
      setTimeout(() => renderItems(btn.dataset.filter), 400);
    });
  });

  /* ── Inicialização ─────────────────────────────────────── */
  renderSkeletons();
  setTimeout(() => renderItems('all'), 600);

  /* ── Lightbox ──────────────────────────────────────────── */
  if (!lightbox) return;

  const lbImgWrap = $('#lb-img-wrap');
  const lbCaption = $('#lb-caption');
  const lbClose   = lightbox.querySelector('.lb-close');
  const lbPrev    = lightbox.querySelector('.lb-prev');
  const lbNext    = lightbox.querySelector('.lb-next');

  function openLightbox(index) {
    lbIndex = index;
    renderLightboxItem();
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lbClose && lbClose.focus();
  }

  function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function renderLightboxItem() {
    if (!lbImgWrap || !lbItems.length) return;
    const item = lbItems[lbIndex];
    if (!item) return;
    lbImgWrap.classList.add('transitioning');
    setTimeout(() => {
      const gradient = CAT_GRADIENTS[item.cat] || 'linear-gradient(135deg,#f8c8d4,#c9a86c)';
      if (item.img) {
        lbImgWrap.innerHTML = `<img src="${item.img}" alt="${item.label}" style="border-radius:12px" />`;
      } else {
        lbImgWrap.innerHTML = `<div style="width:300px;height:400px;background:${gradient};border-radius:12px;display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,0.7);font-size:0.9rem;text-align:center;padding:20px">${item.label}</span></div>`;
      }
      if (lbCaption) lbCaption.textContent = `${item.label} (${lbIndex + 1}/${lbItems.length})`;
      lbImgWrap.classList.remove('transitioning');
    }, 150);
  }

  function lbGoNext() { lbIndex = (lbIndex + 1) % lbItems.length; renderLightboxItem(); }
  function lbGoPrev() { lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; renderLightboxItem(); }

  lbClose && lbClose.addEventListener('click', closeLightbox);
  lbNext  && lbNext.addEventListener('click', lbGoNext);
  lbPrev  && lbPrev.addEventListener('click', lbGoPrev);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  /* Swipe gesture no lightbox */
  lightbox.addEventListener('touchstart', e => {
    lbStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - lbStartX;
    if (diff < -50) lbGoNext();
    else if (diff > 50) lbGoPrev();
  });

  /* Teclado */
  document.addEventListener('keydown', e => {
    if (lightbox.hasAttribute('hidden')) return;
    if (e.key === 'ArrowRight') lbGoNext();
    if (e.key === 'ArrowLeft')  lbGoPrev();
    if (e.key === 'Escape')     closeLightbox();
  });

})();
