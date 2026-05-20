/* ============================================================
   STUDIO BELLA — calendar.js
   Componente de calendário visual reutilizável
============================================================ */
'use strict';

class BellaCalendar {
  constructor({ container, onSelect, minDate, mode = 'client' }) {
    this.container  = typeof container === 'string' ? document.querySelector(container) : container;
    this.onSelect   = onSelect || (() => {});
    this.minDate    = minDate || new Date();
    this.mode       = mode; // 'client' | 'admin'
    this.today      = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.viewYear   = this.today.getFullYear();
    this.viewMonth  = this.today.getMonth();
    this.selected   = null;

    this._render();
  }

  /* ── API pública ─────────────────────────────────────── */
  refresh() { this._renderGrid(); }

  setSelected(dateStr) {
    this.selected = dateStr;
    this._renderGrid();
  }

  /* ── Navegação ───────────────────────────────────────── */
  _prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this._renderGrid();
  }
  _nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this._renderGrid();
  }

  /* ── Render estrutura ─────────────────────────────────── */
  _render() {
    this.container.innerHTML = `
      <div class="bc-wrap">
        <div class="bc-header">
          <button class="bc-nav bc-prev" aria-label="Mês anterior">‹</button>
          <span class="bc-title"></span>
          <button class="bc-nav bc-next" aria-label="Próximo mês">›</button>
        </div>
        <div class="bc-weekdays">
          ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="bc-grid"></div>
      </div>
    `;

    this.container.querySelector('.bc-prev').addEventListener('click', () => this._prevMonth());
    this.container.querySelector('.bc-next').addEventListener('click', () => this._nextMonth());
    this._renderGrid();
  }

  /* ── Render grid de dias ──────────────────────────────── */
  _renderGrid() {
    const title = this.container.querySelector('.bc-title');
    const grid  = this.container.querySelector('.bc-grid');

    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    title.textContent = `${months[this.viewMonth]} ${this.viewYear}`;

    const firstDay   = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth= new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

    const closedWdays  = typeof BellaDB !== 'undefined' ? BellaDB.getClosedWeekdays() : [0];
    const blockedDays  = typeof BellaDB !== 'undefined' ? BellaDB.getBlockedDays()    : [];

    let html = '';
    /* Células vazias antes do 1º dia */
    for (let i = 0; i < firstDay; i++) html += `<span class="bc-day bc-empty"></span>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const date    = new Date(this.viewYear, this.viewMonth, d);
      const dateStr = this._toStr(date);
      const wday    = date.getDay();
      const isPast  = date < this.today;
      const isClosed= closedWdays.includes(wday);
      const isBlocked = blockedDays.includes(dateStr);
      const isSel   = dateStr === this.selected;
      const isToday = dateStr === this._toStr(this.today);

      /* Conta agendamentos (para mostrar indicador) */
      let aptsCount = 0;
      if (typeof BellaDB !== 'undefined') {
        aptsCount = BellaDB.getAppointmentsByDate(dateStr).length;
      }

      const disabled = isPast || isClosed || isBlocked;
      let cls = 'bc-day';
      if (disabled) cls += ' bc-disabled';
      if (isSel)    cls += ' bc-selected';
      if (isToday)  cls += ' bc-today';
      if (aptsCount > 0 && !disabled) cls += ' bc-has-apts';

      const dot = (aptsCount > 0 && !disabled)
        ? `<span class="bc-dot" title="${aptsCount} agendamento(s)">${aptsCount}</span>`
        : '';

      html += `<button class="${cls}" data-date="${dateStr}" ${disabled ? 'disabled aria-disabled="true"' : ''} aria-label="${d} de ${months[this.viewMonth]}">${d}${dot}</button>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.bc-day:not(.bc-disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selected = btn.dataset.date;
        this._renderGrid();
        this.onSelect(btn.dataset.date);
      });
    });
  }

  _toStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
