/* ============================================================
   STUDIO BELLA — services-gallery.js
   Galeria fullscreen de serviços com expansão animada
============================================================ */
'use strict';

const ServiceGallery = (() => {
  const CATEGORY_META = {
    cilios:       { label: 'Extensão de Cílios', icon: '👁️', color: 'linear-gradient(135deg,#f8c8d4 0%,#d4a0b8 100%)' },
    unhas:        { label: 'Nail Designer',       icon: '💅', color: 'linear-gradient(135deg,#fdd5e0 0%,#f4a7b9 100%)' },
    sobrancelhas: { label: 'Design de Sobrancelhas', icon: '✨', color: 'linear-gradient(135deg,#f5e6da 0%,#c9a86c 100%)' },
    lash:         { label: 'Lash Lifting',        icon: '🌟', color: 'linear-gradient(135deg,#d4b8e0 0%,#c9a0d8 100%)' },
    manicure:     { label: 'Manicure & Pedicure', icon: '🌸', color: 'linear-gradient(135deg,#fde8f0 0%,#f4a7b9 100%)' },
    depilacao:    { label: 'Depilação',           icon: '🌺', color: 'linear-gradient(135deg,#f9d4c8 0%,#e8a090 100%)' },
  };

  let overlay, originRect, activeCategory;

  function init() {
    overlay = document.getElementById('sg-overlay');
    if (!overlay) return;

    /* Fechar — .sg-close é criado pelo renderContent(), não existe no init */
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });

    /* Cards de serviço abrem a galeria */
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => open(card.dataset.service, card.getBoundingClientRect()));
    });
  }

  function open(category, rect) {
    if (!overlay || !CATEGORY_META[category]) return;
    activeCategory = category;
    originRect = rect;

    /* Posiciona a partir do card clicado */
    overlay.style.cssText = `
      position:fixed;
      top:${rect.top}px; left:${rect.left}px;
      width:${rect.width}px; height:${rect.height}px;
      border-radius:16px;
      opacity:0;
    `;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    /* Anima para fullscreen */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.cssText = `
        position:fixed;
        top:0; left:0;
        width:100vw; height:100dvh;
        border-radius:0;
        opacity:1;
      `;
    }));

    /* Carrega conteúdo após animação */
    setTimeout(() => renderContent(category), 380);
  }

  function close() {
    const content = overlay.querySelector('.sg-content');
    if (content) content.style.opacity = '0';

    overlay.style.cssText = `
      position:fixed;
      top:${originRect ? originRect.top : '50%'}px;
      left:${originRect ? originRect.left : '50%'}px;
      width:${originRect ? originRect.width : '0'}px;
      height:${originRect ? originRect.height : '0'}px;
      border-radius:16px;
      opacity:0;
    `;

    setTimeout(() => {
      overlay.hidden = true;
      overlay.style.cssText = '';
      document.body.style.overflow = '';
    }, 380);
  }

  function renderContent(category) {
    const meta  = CATEGORY_META[category];
    const items = typeof BellaDB !== 'undefined'
      ? (BellaDB.getGallery()[category] || [])
      : [];

    overlay.innerHTML = `
      <div class="sg-content" style="opacity:0">
        <div class="sg-header" style="background:${meta.color}">
          <button class="sg-close" aria-label="Fechar">✕</button>
          <div class="sg-header-inner">
            <span class="sg-icon">${meta.icon}</span>
            <h2 class="sg-title">${meta.label}</h2>
            <p class="sg-sub">Escolha a opção ideal para você</p>
          </div>
        </div>
        <div class="sg-body">
          <div class="sg-grid">
            ${items.length ? items.map((item, i) => renderCard(item, category, i)).join('') : renderEmpty()}
          </div>
        </div>
      </div>
    `;

    /* Reaplicar eventos após re-render */
    overlay.querySelector('.sg-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    /* Botões "Agendar" */
    overlay.querySelectorAll('.sg-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        close();
        const service = btn.dataset.service;
        const svcSel  = document.getElementById('f-servico');
        if (svcSel) svcSel.value = service;
        setTimeout(() => {
          const booking = document.getElementById('agendamento');
          if (booking) booking.scrollIntoView({ behavior: 'smooth' });
        }, 450);
      });
    });

    /* Fade in do conteúdo */
    requestAnimationFrame(() => {
      const content = overlay.querySelector('.sg-content');
      if (content) content.style.opacity = '1';
    });
  }

  function renderCard(item, category, index) {
    const delay = index * 0.07;
    const meta  = CATEGORY_META[category];
    const imgHtml = item.img
      ? `<img src="${item.img}" alt="${item.name}" class="sg-card-img" loading="lazy" />`
      : `<div class="sg-card-img sg-card-placeholder" style="background:${meta.color}" aria-hidden="true">
           <span>${meta.icon}</span>
         </div>`;

    return `
      <div class="sg-card" style="animation-delay:${delay}s">
        <div class="sg-card-media">${imgHtml}</div>
        <div class="sg-card-info">
          <h3 class="sg-card-name">${item.name}</h3>
          <p class="sg-card-desc">${item.desc}</p>
          <div class="sg-card-footer">
            <span class="sg-card-price">R$ ${item.price}</span>
            <button class="sg-book-btn shimmer-btn" data-service="${CATEGORY_META[category].label}" aria-label="Agendar ${item.name}">
              Agendar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmpty() {
    return `
      <div class="sg-empty">
        <span>🖼️</span>
        <p>A dona do estúdio ainda não adicionou opções aqui.<br/>
           <a href="admin.html" target="_blank">Acesse o painel</a> para configurar.</p>
      </div>
    `;
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', ServiceGallery.init.bind(ServiceGallery));
