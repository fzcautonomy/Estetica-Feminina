/* ============================================================
   STUDIO BELLA — agendamento.js
   Formulário com calendário visual + slots dinâmicos
   PERSONALIZE: Troque WPP_NUMBER pelo número real
============================================================ */
'use strict';

const WPP_NUMBER = '5511986075848';

(function initAgendamento() {
  const form     = document.getElementById('booking-form');
  if (!form) return;

  const fNome    = document.getElementById('f-nome');
  const fWpp     = document.getElementById('f-wpp');
  const fServico = document.getElementById('f-servico');
  const fHorario = document.getElementById('f-horario');
  const fObs     = document.getElementById('f-obs');
  const calWrap  = document.getElementById('booking-calendar');
  const slotsWrap= document.getElementById('time-slots');
  const selectedDateDisplay = document.getElementById('selected-date-display');

  let selectedDate = null;

  /* ── Calendário ──────────────────────────────────────── */
  if (calWrap && typeof BellaCalendar !== 'undefined') {
    new BellaCalendar({
      container: calWrap,
      onSelect: (dateStr) => {
        selectedDate = dateStr;
        showDateLabel(dateStr);
        renderSlots(dateStr);
        clearError('err-data');
      },
    });
  }

  function showDateLabel(dateStr) {
    if (!selectedDateDisplay) return;
    const d = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
    selectedDateDisplay.textContent = `📅 ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    selectedDateDisplay.classList.add('visible');
  }

  /* ── Slots de horário ────────────────────────────────── */
  function renderSlots(dateStr) {
    if (!slotsWrap) return;
    fHorario.value = '';

    const service = fServico ? fServico.value : '';
    const slots = typeof BellaDB !== 'undefined'
      ? BellaDB.getAvailableSlots(dateStr, service)
      : generateFallbackSlots();

    if (!slots.length) {
      slotsWrap.innerHTML = '<p class="slots-empty">Sem horários disponíveis nesta data.</p>';
      return;
    }

    slotsWrap.innerHTML = slots.map(s => `
      <button type="button" class="time-slot${s.available ? '' : ' unavailable'}"
        data-time="${s.time}"
        ${s.available ? '' : 'disabled aria-disabled="true"'}
        aria-label="${s.time}${s.available ? '' : ' — indisponível'}">
        ${s.time}
        ${!s.available ? '<span class="slot-x">×</span>' : ''}
      </button>
    `).join('');

    slotsWrap.querySelectorAll('.time-slot:not(.unavailable)').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsWrap.querySelectorAll('.time-slot').forEach(b => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        fHorario.value = btn.dataset.time;
        clearError('err-horario');
      });
    });
  }

  function generateFallbackSlots() {
    return ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
      .map(t => ({ time: t, available: true }));
  }

  /* Atualiza slots ao trocar serviço */
  fServico && fServico.addEventListener('change', () => {
    if (selectedDate) renderSlots(selectedDate);
    clearError('err-servico', fServico);
    if (fServico.value) localStorage.setItem('bella-last-service', fServico.value);
  });

  /* Pré-seleciona serviço salvo */
  const saved = localStorage.getItem('bella-last-service');
  if (saved && fServico) fServico.value = saved;

  /* ── Formatação WhatsApp ─────────────────────────────── */
  fWpp && fWpp.addEventListener('input', () => {
    let v = fWpp.value.replace(/\D/g, '').slice(0, 11);
    if (v.length >= 7)      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length >= 3) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    fWpp.value = v;
    validateField(fWpp, validateWpp(v), 'err-wpp');
  });

  fNome && fNome.addEventListener('blur', () =>
    validateField(fNome, validateNome(fNome.value), 'err-nome'));

  /* ── Validações ──────────────────────────────────────── */
  const validateNome    = v => v.trim().length < 3 ? 'Nome deve ter ao menos 3 caracteres.' : '';
  const validateWpp     = v => v.replace(/\D/g,'').length < 10 ? 'WhatsApp inválido.' : '';
  const validateServico = v => !v ? 'Selecione um serviço.' : '';
  const validateDate    = () => !selectedDate ? 'Selecione uma data no calendário.' : '';
  const validateHorario = v => !v ? 'Selecione um horário.' : '';

  function validateField(el, msg, errId) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = msg;
    el && el.classList.toggle('error', !!msg);
    el && el.classList.toggle('valid', !msg);
  }
  function clearError(errId, el) { validateField(el || null, '', errId); }
  function showError(errId, el, msg) { validateField(el, msg, errId); }

  /* ── Submit ──────────────────────────────────────────── */
  form.addEventListener('submit', e => {
    e.preventDefault();

    const errors = [
      { id: 'err-nome',    el: fNome,    msg: validateNome(fNome.value) },
      { id: 'err-wpp',     el: fWpp,     msg: validateWpp(fWpp.value) },
      { id: 'err-servico', el: fServico, msg: validateServico(fServico.value) },
      { id: 'err-data',    el: null,     msg: validateDate() },
      { id: 'err-horario', el: null,     msg: validateHorario(fHorario.value) },
    ];

    let hasError = false;
    errors.forEach(({ id, el, msg }) => {
      if (msg) { showError(id, el, msg); hasError = true; }
      else      clearError(id, el);
    });

    if (hasError) {
      const first = form.querySelector('.error');
      first && first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Salva no localStorage */
    const apt = {
      nome:         fNome.value.trim(),
      whatsapp:     fWpp.value,
      servico:      fServico.value,
      data:         selectedDate,
      horario:      fHorario.value,
      observacoes:  fObs ? fObs.value.trim() : '',
    };
    if (typeof BellaDB !== 'undefined') BellaDB.addAppointment(apt);

    /* Gera mensagem WhatsApp */
    const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const obs = apt.observacoes ? `\n📝 Observações: ${apt.observacoes}` : '';
    const msg = encodeURIComponent(
      `Olá! Gostaria de agendar um horário no Studio Bella 🌸\n\n` +
      `👤 Nome: ${apt.nome}\n` +
      `📱 WhatsApp: ${apt.whatsapp}\n` +
      `💅 Serviço: ${apt.servico}\n` +
      `📅 Data: ${dateLabel}\n` +
      `🕐 Horário: ${apt.horario}` + obs
    );

    window.open(`https://wa.me/${WPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');
    showConfirmation();
    localStorage.setItem('bella-last-service', fServico.value);
  });

  /* ── Tela de confirmação com confetes ────────────────── */
  function showConfirmation() {
    const screen = document.getElementById('confirmation-screen');
    if (!screen) return;
    screen.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    launchConfetti();
  }

  const backBtn = document.getElementById('confirm-back');
  backBtn && backBtn.addEventListener('click', () => {
    const screen = document.getElementById('confirmation-screen');
    if (screen) { screen.setAttribute('hidden', ''); document.body.style.overflow = ''; }
    form.reset();
    selectedDate = null;
    fHorario.value = '';
    if (selectedDateDisplay) { selectedDateDisplay.textContent = ''; selectedDateDisplay.classList.remove('visible'); }
    if (slotsWrap) slotsWrap.innerHTML = '<p class="slots-hint">← Primeiro escolha a data acima</p>';
    form.querySelectorAll('.error,.valid').forEach(el => el.classList.remove('error','valid'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#F4A7B9','#C9A86C','#F5E6DA','#fff','#e75480','#ffd700'];
    const pieces = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.5,
      w: Math.random() * 10 + 4, h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 1.5, vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 8, opacity: 1,
    }));
    let frame;
    (function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      pieces.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.rot += p.rotSpeed;
        if (p.y > canvas.height * 0.85) p.opacity -= 0.025;
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
    })();
    setTimeout(() => cancelAnimationFrame(frame), 5500);
  }
})();
