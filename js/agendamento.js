/* ============================================================
   STUDIO BELLA — agendamento.js
   Formulário de agendamento + geração de link WhatsApp
   PERSONALIZE: Troque o número em WPP_NUMBER pelo seu
============================================================ */

'use strict';

/* PERSONALIZE: Coloque aqui o número do WhatsApp (somente dígitos, com DDI) */
const WPP_NUMBER = '5511986075848';

const $ = (sel, ctx = document) => ctx.querySelector(sel);

(function initAgendamento() {
  const form        = $('#booking-form');
  if (!form) return;

  const fNome     = $('#f-nome');
  const fWpp      = $('#f-wpp');
  const fServico  = $('#f-servico');
  const fData     = $('#f-data');
  const fHorario  = $('#f-horario');
  const fObs      = $('#f-obs');
  const timeSlotsEl = $('#time-slots');
  const btnAgendar  = $('#btn-agendar');

  /* ── Gera slots de horário ─────────────────────────────── */
  const SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  function renderSlots() {
    if (!timeSlotsEl) return;
    timeSlotsEl.innerHTML = '';
    SLOTS.forEach(hour => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.textContent = hour;
      btn.setAttribute('data-time', hour);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.addEventListener('click', () => selectSlot(btn, hour));
      timeSlotsEl.appendChild(btn);
    });
  }

  function selectSlot(btn, hour) {
    document.querySelectorAll('.time-slot').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-checked', 'true');
    fHorario.value = hour;
    clearError('err-horario', fHorario);
  }

  renderSlots();

  /* ── Define data mínima (hoje) ─────────────────────────── */
  if (fData) {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    fData.min   = `${yyyy}-${mm}-${dd}`;
  }

  /* ── Pré-seleciona serviço via hash ou localStorage ────── */
  const lastService = localStorage.getItem('bella-last-service');
  if (lastService && fServico) {
    fServico.value = lastService;
  }
  const hashService = decodeURIComponent(window.location.hash.replace('#agendar-', ''));
  if (hashService && fServico) {
    // tenta mapear pelo serviço
    [...fServico.options].forEach(opt => {
      if (opt.value.toLowerCase().includes(hashService.toLowerCase())) {
        fServico.value = opt.value;
      }
    });
  }

  /* ── Validação em tempo real ───────────────────────────── */
  function showError(errId, field, msg) {
    const el = $(`#${errId}`);
    if (el) el.textContent = msg;
    if (field) {
      field.classList.add('error');
      field.classList.remove('valid');
    }
  }
  function clearError(errId, field) {
    const el = $(`#${errId}`);
    if (el) el.textContent = '';
    if (field) {
      field.classList.remove('error');
      field.classList.add('valid');
    }
  }

  function validateNome(val) {
    if (!val.trim()) return 'Por favor, informe seu nome.';
    if (val.trim().length < 3) return 'Nome muito curto.';
    return '';
  }
  function validateWpp(val) {
    const digits = val.replace(/\D/g, '');
    if (!digits) return 'Por favor, informe seu WhatsApp.';
    if (digits.length < 10) return 'Número inválido (mínimo 10 dígitos).';
    return '';
  }
  function validateServico(val) {
    if (!val) return 'Selecione um serviço.';
    return '';
  }
  function validateData(val) {
    if (!val) return 'Selecione uma data.';
    const chosen = new Date(val + 'T00:00:00');
    const today  = new Date(); today.setHours(0,0,0,0);
    if (chosen < today) return 'A data não pode ser no passado.';
    return '';
  }
  function validateHorario(val) {
    if (!val) return 'Selecione um horário.';
    return '';
  }

  /* Formatação ao digitar */
  fWpp && fWpp.addEventListener('input', () => {
    let v = fWpp.value.replace(/\D/g, '').slice(0, 11);
    if (v.length >= 7)      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length >= 3) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    fWpp.value = v;
    const err = validateWpp(v);
    err ? showError('err-wpp', fWpp, err) : clearError('err-wpp', fWpp);
  });

  fNome && fNome.addEventListener('blur', () => {
    const err = validateNome(fNome.value);
    err ? showError('err-nome', fNome, err) : clearError('err-nome', fNome);
  });
  fServico && fServico.addEventListener('change', () => {
    const err = validateServico(fServico.value);
    err ? showError('err-servico', fServico, err) : clearError('err-servico', fServico);
    if (!err) localStorage.setItem('bella-last-service', fServico.value);
  });
  fData && fData.addEventListener('change', () => {
    const err = validateData(fData.value);
    err ? showError('err-data', fData, err) : clearError('err-data', fData);
  });

  /* ── Envio do formulário ───────────────────────────────── */
  form.addEventListener('submit', e => {
    e.preventDefault();

    const errors = [
      { id: 'err-nome',    field: fNome,    msg: validateNome(fNome.value) },
      { id: 'err-wpp',     field: fWpp,     msg: validateWpp(fWpp.value) },
      { id: 'err-servico', field: fServico, msg: validateServico(fServico.value) },
      { id: 'err-data',    field: fData,    msg: validateData(fData.value) },
      { id: 'err-horario', field: null,     msg: validateHorario(fHorario.value) },
    ];

    let hasError = false;
    errors.forEach(({ id, field, msg }) => {
      if (msg) {
        showError(id, field, msg);
        hasError = true;
      } else {
        clearError(id, field);
      }
    });

    if (hasError) {
      const firstErr = form.querySelector('.error, .field-error:not(:empty)');
      firstErr && firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Formata data para exibição */
    const rawDate = new Date(fData.value + 'T00:00:00');
    const formatted = rawDate.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const obs = fObs && fObs.value.trim() ? `\n📝 Observações: ${fObs.value.trim()}` : '';

    const message = encodeURIComponent(
      `Olá! Gostaria de agendar um horário no Studio Bella 🌸\n\n` +
      `👤 Nome: ${fNome.value.trim()}\n` +
      `📱 WhatsApp: ${fWpp.value}\n` +
      `💅 Serviço: ${fServico.value}\n` +
      `📅 Data: ${formatted}\n` +
      `🕐 Horário: ${fHorario.value}` +
      obs
    );

    const url = `https://wa.me/${WPP_NUMBER}?text=${message}`;

    /* Abre WhatsApp */
    window.open(url, '_blank', 'noopener,noreferrer');

    /* Mostra tela de confirmação */
    showConfirmation();

    /* Salva último serviço */
    localStorage.setItem('bella-last-service', fServico.value);
  });

  /* ── Tela de confirmação + confetes ────────────────────── */
  function showConfirmation() {
    const screen = $('#confirmation-screen');
    if (!screen) return;
    screen.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    launchConfetti();
  }

  function hideConfirmation() {
    const screen = $('#confirmation-screen');
    if (!screen) return;
    screen.setAttribute('hidden', '');
    document.body.style.overflow = '';
    form.reset();
    document.querySelectorAll('.time-slot').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-checked', 'false');
    });
    fHorario.value = '';
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
      el.classList.remove('valid', 'error');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const backBtn = $('#confirm-back');
  backBtn && backBtn.addEventListener('click', hideConfirmation);

  /* ── Confetes CSS via canvas ───────────────────────────── */
  function launchConfetti() {
    const canvas = $('#confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F4A7B9','#C9A86C','#F5E6DA','#fff','#e75480','#ffd700'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.5,
      w: Math.random() * 10 + 4,
      h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    }));

    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      pieces.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height * 0.8) p.opacity -= 0.02;
        if (p.opacity <= 0) return;
        alive++;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive > 0) frame = requestAnimationFrame(draw);
    }
    draw();

    setTimeout(() => cancelAnimationFrame(frame), 5000);
  }
})();
