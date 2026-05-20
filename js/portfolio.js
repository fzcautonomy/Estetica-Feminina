/* ============================================================
   STUDIO BELLA — portfolio.js
   Grid masonry, filtros, lightbox, swipe gesture
   PERSONALIZE: Adicione suas fotos reais em assets/portfolio/
============================================================ */

'use strict';

/* ── Dados do portfólio ──────────────────────────────────── */
/*
   PERSONALIZE: Troque os gradientes por src reais:
   Ex: { src: 'assets/portfolio/cilios-1.jpg', ... }
*/
const PORTFOLIO_ITEMS = [
  { id: 1,  cat: 'cilios',       label: 'Extensão Volume Russo',    gradient: 'linear-gradient(135deg,#f8c8d4,#e8a0b8)', tall: true },
  { id: 2,  cat: 'unhas',        label: 'Nail Art Floral',          gradient: 'linear-gradient(135deg,#fdd5e0,#f4a7b9)' },
  { id: 3,  cat: 'sobrancelhas', label: 'Micropigmentação Natural', gradient: 'linear-gradient(135deg,#f5e6da,#e8d0b8)', tall: true },
  { id: 4,  cat: 'cilios',       label: 'Lash Lifting Curva C',     gradient: 'linear-gradient(135deg,#d4b8e0,#c9a0d8)' },
  { id: 5,  cat: 'unhas',        label: 'Gel Francesinha',          gradient: 'linear-gradient(135deg,#fff,#f5e6da)', tall: true },
  { id: 6,  cat: 'sobrancelhas', label: 'Henna Escura',             gradient: 'linear-gradient(135deg,#c9a86c,#a8874e)' },
  { id: 7,  cat: 'cilios',       label: 'Mega Volume',              gradient: 'linear-gradient(135deg,#f4a7b9,#c9a86c)', tall: true },
  { id: 8,  cat: 'unhas',        label: 'Acrigel Rosa Nude',        gradient: 'linear-gradient(135deg,#f9e0ea,#f0b8cc)' },
  { id: 9,  cat: 'sobrancelhas', label: 'Design + Linha',           gradient: 'linear-gradient(135deg,#e8c8a0,#c9a86c)' },
  { id: 10, cat: 'unhas',        label: 'Glitter Dourado',          gradient: 'linear-gradient(135deg,#ffd700,#c9a86c)', tall: true },
  { id: 11, cat: 'cilios',       label: 'Fio a Fio Natural',        gradient: 'linear-gradient(135deg,#b8d4e8,#a0b8c8)' },
  { id: 12, cat: 'sobrancelhas', label: 'Micropig Loira',           gradient: 'linear-gradient(135deg,#e8d4b8,#d4b890)' },
];

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
    const filtered = filter === 'all'
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter(it => it.cat === filter);

    /* Atualiza lista para lightbox */
    lbItems = filtered;

    grid.innerHTML = '';
    filtered.forEach((item, i) => {
      const el = document.createElement('figure');
      el.className = 'portfolio-item';
      el.setAttribute('role', 'listitem');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', item.label);
      el.style.animationDelay = `${i * 0.06}s`;

      /* Se tiver src real, usa img; caso contrário, div gradiente */
      const mediaEl = item.src
        ? `<img class="portfolio-item-img" src="${item.src}" alt="${item.label}" loading="lazy" />`
        : `<div class="portfolio-item-img" style="background:${item.gradient};width:100%;aspect-ratio:${item.tall ? '3/5' : '3/4'};"></div>`;

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
      if (item.src) {
        lbImgWrap.innerHTML = `<img src="${item.src}" alt="${item.label}" style="border-radius:12px" />`;
      } else {
        lbImgWrap.innerHTML = `<div style="width:300px;height:400px;background:${item.gradient};border-radius:12px;display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,0.7);font-size:0.9rem;text-align:center;padding:20px">${item.label}</span></div>`;
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
