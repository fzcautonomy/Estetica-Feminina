/* ============================================================
   STUDIO BELLA — admin.js
   Painel da dona do estúdio
   Senha padrão: bella2024  (troque nas configurações)
============================================================ */
'use strict';

const AdminApp = (() => {
  let currentTab   = 'agenda';
  let agendaCalendar = null;
  let selectedAdminDate = null;

  /* ── Bootstrap ───────────────────────────────────────── */
  function init() {
    checkLogin();
    document.getElementById('admin-login-form')
      ?.addEventListener('submit', handleLogin);
  }

  function checkLogin() {
    const auth = sessionStorage.getItem('bella-admin-auth');
    if (auth === '1') showDashboard();
    else             showLogin();
  }

  function handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if (BellaDB.checkAdminPass(pass)) {
      sessionStorage.setItem('bella-admin-auth', '1');
      showDashboard();
    } else {
      const err = document.getElementById('login-err');
      if (err) { err.textContent = 'Senha incorreta.'; err.classList.add('shake'); }
      setTimeout(() => err?.classList.remove('shake'), 500);
    }
  }

  function showLogin() {
    document.getElementById('login-screen').hidden    = false;
    document.getElementById('dashboard-screen').hidden = true;
  }

  function showDashboard() {
    document.getElementById('login-screen').hidden    = true;
    document.getElementById('dashboard-screen').hidden = false;
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
    initTabs();
    openTab('agenda');

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      sessionStorage.removeItem('bella-admin-auth');
      showLogin();
    });
  }

  /* ── Tabs ─────────────────────────────────────────────── */
  function initTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => openTab(btn.dataset.tab));
    });
  }

  function openTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.admin-panel').forEach(p =>
      p.hidden = p.id !== `panel-${tab}`);

    if (tab === 'agenda')   renderAgenda();
    if (tab === 'galeria')  renderGaleria();
    if (tab === 'config')   renderConfig();
  }

  /* ══════════════════════════════════════════════════════
     ABA: AGENDA
  ══════════════════════════════════════════════════════ */
  function renderAgenda() {
    const panel = document.getElementById('panel-agenda');
    if (!panel) return;

    panel.innerHTML = `
      <div class="admin-agenda-layout">
        <div class="admin-cal-wrap">
          <div id="admin-calendar"></div>
        </div>
        <div class="admin-apts-wrap">
          <div class="admin-apts-header">
            <h3 id="admin-date-label">Selecione uma data</h3>
            <button id="btn-block-day" class="adm-btn adm-btn-sm adm-btn-danger" hidden>🔒 Bloquear dia</button>
          </div>
          <div id="admin-apts-list"><p class="apts-hint">Clique em um dia no calendário.</p></div>
          <button id="btn-add-apt" class="adm-btn adm-btn-primary" hidden>+ Adicionar Agendamento</button>
        </div>
      </div>
    `;

    agendaCalendar = new BellaCalendar({
      container: '#admin-calendar',
      mode: 'admin',
      onSelect: date => {
        selectedAdminDate = date;
        renderDayAppointments(date);
      },
    });

    document.getElementById('btn-block-day')?.addEventListener('click', toggleBlockDay);
    document.getElementById('btn-add-apt')?.addEventListener('click', () => openAddAptModal());
  }

  function renderDayAppointments(dateStr) {
    const label  = document.getElementById('admin-date-label');
    const list   = document.getElementById('admin-apts-list');
    const blockBtn = document.getElementById('btn-block-day');
    const addBtn   = document.getElementById('btn-add-apt');

    const d = new Date(dateStr + 'T00:00:00');
    const formatted = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    if (label) label.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    const isBlocked = BellaDB.getBlockedDays().includes(dateStr);
    if (blockBtn) {
      blockBtn.hidden = false;
      blockBtn.textContent = isBlocked ? '🔓 Desbloquear dia' : '🔒 Bloquear dia';
    }
    if (addBtn) addBtn.hidden = false;

    const apts = BellaDB.getAppointments()
      .filter(a => a.data === dateStr)
      .sort((a, b) => a.horario.localeCompare(b.horario));

    const slots = BellaDB.getAvailableSlots(dateStr, null);
    const blockedSlots = BellaDB.getBlockedSlots()[dateStr] || [];

    if (!list) return;

    if (!apts.length && !blockedSlots.length) {
      list.innerHTML = '<p class="apts-hint">Nenhum agendamento neste dia.</p>';
    } else {
      list.innerHTML = apts.map(apt => renderAptCard(apt)).join('') +
        (blockedSlots.length ? `<p class="apts-blocked-label">Horários bloqueados: ${blockedSlots.join(', ')}</p>` : '');
    }

    /* Slots manager */
    list.innerHTML += `
      <div class="slots-manager">
        <h4>Gerenciar horários</h4>
        <div class="admin-slots-grid">
          ${slots.map(s => `
            <button class="adm-slot ${!s.available ? 'adm-slot-blocked' : ''}"
              data-time="${s.time}"
              title="${s.available ? 'Disponível — clique para bloquear' : 'Bloqueado — clique para liberar'}">
              ${s.time} ${!s.available ? '🔒' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    list.querySelectorAll('.adm-slot').forEach(btn => {
      btn.addEventListener('click', () => toggleSlot(dateStr, btn.dataset.time));
    });

    /* Ações nos cards */
    list.querySelectorAll('[data-confirm]').forEach(btn =>
      btn.addEventListener('click', () => { BellaDB.updateAppointment(btn.dataset.confirm, { status:'confirmed' }); renderDayAppointments(dateStr); agendaCalendar?.refresh(); }));
    list.querySelectorAll('[data-cancel]').forEach(btn =>
      btn.addEventListener('click', () => { if (confirm('Cancelar este agendamento?')) { BellaDB.updateAppointment(btn.dataset.cancel, { status:'cancelled' }); renderDayAppointments(dateStr); agendaCalendar?.refresh(); } }));
    list.querySelectorAll('[data-delete]').forEach(btn =>
      btn.addEventListener('click', () => { if (confirm('Excluir permanentemente?')) { BellaDB.deleteAppointment(btn.dataset.delete); renderDayAppointments(dateStr); agendaCalendar?.refresh(); } }));
  }

  function renderAptCard(apt) {
    const statusClass = { pending:'apt-pending', confirmed:'apt-confirmed', cancelled:'apt-cancelled' }[apt.status] || '';
    const statusLabel = { pending:'⏳ Pendente', confirmed:'✅ Confirmado', cancelled:'❌ Cancelado' }[apt.status] || apt.status;
    return `
      <div class="apt-card ${statusClass}">
        <div class="apt-time">${apt.horario}</div>
        <div class="apt-info">
          <strong>${apt.nome}</strong>
          <span>${apt.servico}</span>
          ${apt.whatsapp ? `<a href="https://wa.me/${apt.whatsapp.replace(/\D/g,'')}" target="_blank" class="apt-wpp">💬 ${apt.whatsapp}</a>` : ''}
          ${apt.observacoes ? `<em>${apt.observacoes}</em>` : ''}
        </div>
        <div class="apt-status">${statusLabel}</div>
        <div class="apt-actions">
          ${apt.status !== 'confirmed' ? `<button class="adm-btn adm-btn-xs adm-btn-success" data-confirm="${apt.id}">✓ Confirmar</button>` : ''}
          ${apt.status !== 'cancelled' ? `<button class="adm-btn adm-btn-xs adm-btn-danger"  data-cancel="${apt.id}">✗ Cancelar</button>` : ''}
          <button class="adm-btn adm-btn-xs" data-delete="${apt.id}">🗑</button>
        </div>
      </div>
    `;
  }

  function toggleBlockDay() {
    if (!selectedAdminDate) return;
    const blocked = BellaDB.getBlockedDays().includes(selectedAdminDate);
    blocked ? BellaDB.unblockDay(selectedAdminDate) : BellaDB.blockDay(selectedAdminDate);
    renderDayAppointments(selectedAdminDate);
    agendaCalendar?.refresh();
  }

  function toggleSlot(dateStr, time) {
    const bs = BellaDB.getBlockedSlots()[dateStr] || [];
    if (bs.includes(time)) BellaDB.unblockSlot(dateStr, time);
    else                   BellaDB.blockSlot(dateStr, time);
    renderDayAppointments(dateStr);
  }

  /* Modal: adicionar agendamento manual */
  function openAddAptModal() {
    if (!selectedAdminDate) return;
    const modal = document.getElementById('add-apt-modal');
    if (!modal) return;

    const dateEl = modal.querySelector('#m-date-label');
    if (dateEl) {
      const d = new Date(selectedAdminDate + 'T00:00:00');
      dateEl.textContent = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
    }

    /* Slots disponíveis */
    const slots = BellaDB.getAvailableSlots(selectedAdminDate, '');
    const slotsSel = modal.querySelector('#m-horario');
    if (slotsSel) {
      slotsSel.innerHTML = '<option value="">Escolha...</option>' +
        slots.filter(s => s.available).map(s => `<option>${s.time}</option>`).join('');
    }

    modal.hidden = false;

    modal.querySelector('.modal-close')?.addEventListener('click', () => modal.hidden = true);
    modal.querySelector('#apt-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      BellaDB.addAppointment({
        nome:        fd.get('nome'),
        whatsapp:    fd.get('wpp'),
        servico:     fd.get('servico'),
        data:        selectedAdminDate,
        horario:     fd.get('horario'),
        observacoes: fd.get('obs'),
      });
      modal.hidden = true;
      e.target.reset();
      renderDayAppointments(selectedAdminDate);
      agendaCalendar?.refresh();
    });
  }

  /* ══════════════════════════════════════════════════════
     ABA: GALERIA
  ══════════════════════════════════════════════════════ */
  const CAT_LABELS = {
    cilios:'Extensão de Cílios', unhas:'Nail Designer',
    sobrancelhas:'Design de Sobrancelhas', lash:'Lash Lifting',
    manicure:'Manicure & Pedicure', depilacao:'Depilação',
  };

  function renderGaleria() {
    const panel = document.getElementById('panel-galeria');
    if (!panel) return;

    panel.innerHTML = `
      <div class="gal-tabs">
        ${Object.entries(CAT_LABELS).map(([k,v],i) => `
          <button class="gal-cat-btn${i===0?' active':''}" data-cat="${k}">${v}</button>
        `).join('')}
      </div>
      <div id="gal-content"></div>
    `;

    panel.querySelectorAll('.gal-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.gal-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGalCategory(btn.dataset.cat);
      });
    });

    renderGalCategory('cilios');
  }

  function renderGalCategory(cat) {
    const content = document.getElementById('gal-content');
    if (!content) return;
    const items = BellaDB.getGallery()[cat] || [];

    content.innerHTML = `
      <div class="gal-items">
        ${items.map((item, i) => `
          <div class="gal-item" data-id="${item.id}">
            <div class="gal-item-preview">
              ${item.img ? `<img src="${item.img}" alt="${item.name}" />` : `<div class="gal-no-img">📷<br/>Sem foto</div>`}
            </div>
            <div class="gal-item-fields">
              <input type="text" placeholder="Nome" value="${esc(item.name)}" data-field="name" data-id="${item.id}" data-cat="${cat}" />
              <input type="number" placeholder="Preço R$" value="${item.price}" data-field="price" data-id="${item.id}" data-cat="${cat}" min="0" />
              <input type="text" placeholder="URL da foto (cole o link)" value="${esc(item.img||'')}" data-field="img" data-id="${item.id}" data-cat="${cat}" />
              <textarea placeholder="Descrição" data-field="desc" data-id="${item.id}" data-cat="${cat}">${esc(item.desc)}</textarea>
              <button class="adm-btn adm-btn-danger adm-btn-xs" data-del-item="${item.id}" data-cat="${cat}">🗑 Remover</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="gal-actions">
        <button class="adm-btn adm-btn-primary" id="btn-add-item" data-cat="${cat}">+ Adicionar opção</button>
        <button class="adm-btn adm-btn-success" id="btn-save-gal" data-cat="${cat}">💾 Salvar alterações</button>
      </div>
    `;

    /* Live edit */
    content.querySelectorAll('[data-field]').forEach(el => {
      el.addEventListener('input', () => {
        const { id, field, cat: c } = el.dataset;
        const gallery = BellaDB.getGallery();
        const item = (gallery[c] || []).find(it => it.id === id);
        if (item) {
          item[field] = field === 'price' ? Number(el.value) : el.value;
          if (field === 'img') {
            const preview = el.closest('.gal-item')?.querySelector('.gal-item-preview');
            if (preview) preview.innerHTML = el.value
              ? `<img src="${el.value}" alt="" />`
              : `<div class="gal-no-img">📷<br/>Sem foto</div>`;
          }
        }
      });
    });

    content.querySelector('#btn-add-item')?.addEventListener('click', () => {
      const gallery = BellaDB.getGallery();
      const catItems = gallery[cat] || [];
      catItems.push({ id: Date.now().toString(36), name:'Nova opção', price:0, desc:'', img:'' });
      BellaDB.setGalleryCategory(cat, catItems);
      renderGalCategory(cat);
    });

    content.querySelector('#btn-save-gal')?.addEventListener('click', () => {
      /* Coleta todos os valores atuais dos campos */
      const gallery = BellaDB.getGallery();
      const catItems = gallery[cat] || [];
      content.querySelectorAll('.gal-item').forEach(row => {
        const id  = row.dataset.id;
        const item = catItems.find(it => it.id === id);
        if (!item) return;
        item.name  = row.querySelector('[data-field="name"]')?.value  || item.name;
        item.price = Number(row.querySelector('[data-field="price"]')?.value) || item.price;
        item.img   = row.querySelector('[data-field="img"]')?.value   || item.img;
        item.desc  = row.querySelector('[data-field="desc"]')?.value  || item.desc;
      });
      BellaDB.setGalleryCategory(cat, catItems);
      showToast('Galeria salva com sucesso! ✓');
    });

    content.querySelectorAll('[data-del-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Remover esta opção?')) return;
        const gallery = BellaDB.getGallery();
        const filtered = (gallery[btn.dataset.cat] || []).filter(it => it.id !== btn.dataset.delItem);
        BellaDB.setGalleryCategory(btn.dataset.cat, filtered);
        renderGalCategory(btn.dataset.cat);
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     ABA: CONFIGURAÇÕES
  ══════════════════════════════════════════════════════ */
  function renderConfig() {
    const panel = document.getElementById('panel-config');
    if (!panel) return;

    const durations   = BellaDB.getDurations();
    const wh          = BellaDB.getWorkHours();
    const closedWdays = BellaDB.getClosedWeekdays();
    const WDAY_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

    panel.innerHTML = `
      <div class="config-sections">

        <div class="config-card">
          <h3>🕐 Horário de Funcionamento</h3>
          <div class="config-row">
            <label>Abertura <input type="time" id="cfg-start" value="${wh.start}" /></label>
            <label>Fechamento <input type="time" id="cfg-end" value="${wh.end}" /></label>
            <button class="adm-btn adm-btn-primary" id="btn-save-hours">Salvar</button>
          </div>
          <div class="config-row">
            <label>Dias fechados:</label>
            <div class="wday-checks">
              ${WDAY_LABELS.map((d,i) => `
                <label class="wday-label">
                  <input type="checkbox" value="${i}" ${closedWdays.includes(i)?'checked':''} />
                  ${d}
                </label>
              `).join('')}
            </div>
            <button class="adm-btn adm-btn-primary" id="btn-save-wdays">Salvar</button>
          </div>
        </div>

        <div class="config-card">
          <h3>⏱ Duração dos Serviços</h3>
          <p class="config-hint">Define quantos horários cada serviço ocupa na agenda.</p>
          ${Object.entries(durations).map(([svc, min]) => `
            <div class="config-row">
              <span class="cfg-svc-name">${svc}</span>
              <div class="duration-control">
                <button class="dur-btn" data-svc="${svc}" data-delta="-15">−</button>
                <span class="dur-val" id="dur-${svc.replace(/\s/g,'_')}">${min} min</span>
                <button class="dur-btn" data-svc="${svc}" data-delta="15">+</button>
              </div>
            </div>
          `).join('')}
          <button class="adm-btn adm-btn-success" id="btn-save-durations">💾 Salvar durações</button>
        </div>

        <div class="config-card">
          <h3>🔑 Alterar Senha</h3>
          <form id="change-pass-form" class="config-row" style="flex-direction:column;gap:10px">
            <input type="password" name="cur"  placeholder="Senha atual" required />
            <input type="password" name="new1" placeholder="Nova senha" required minlength="6" />
            <input type="password" name="new2" placeholder="Confirmar nova senha" required minlength="6" />
            <button type="submit" class="adm-btn adm-btn-primary">Alterar</button>
            <span id="pass-err" style="color:#e05a5a;font-size:.82rem"></span>
          </form>
        </div>

        <div class="config-card danger-zone">
          <h3>⚠️ Zona de Perigo</h3>
          <button class="adm-btn adm-btn-danger" id="btn-clear-data">🗑 Apagar todos os agendamentos</button>
          <button class="adm-btn adm-btn-danger" id="btn-export">📋 Exportar agendamentos (JSON)</button>
        </div>

      </div>
    `;

    /* Horário */
    panel.querySelector('#btn-save-hours')?.addEventListener('click', () => {
      BellaDB.setWorkHours(
        panel.querySelector('#cfg-start').value,
        panel.querySelector('#cfg-end').value,
      );
      showToast('Horário salvo! ✓');
    });

    /* Dias fechados */
    panel.querySelector('#btn-save-wdays')?.addEventListener('click', () => {
      const checked = [...panel.querySelectorAll('.wday-checks input:checked')].map(el => Number(el.value));
      BellaDB.setClosedWeekdays(checked);
      showToast('Dias fechados salvos! ✓');
      agendaCalendar?.refresh();
    });

    /* Duração */
    const durations2 = { ...BellaDB.getDurations() };
    panel.querySelectorAll('.dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const svc = btn.dataset.svc;
        const delta = Number(btn.dataset.delta);
        durations2[svc] = Math.max(15, (durations2[svc] || 60) + delta);
        const span = panel.querySelector(`#dur-${svc.replace(/\s/g,'_')}`);
        if (span) span.textContent = durations2[svc] + ' min';
      });
    });
    panel.querySelector('#btn-save-durations')?.addEventListener('click', () => {
      Object.entries(durations2).forEach(([k,v]) => BellaDB.setDuration(k, v));
      showToast('Durações salvas! ✓');
    });

    /* Senha */
    panel.querySelector('#change-pass-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const err = panel.querySelector('#pass-err');
      if (!BellaDB.checkAdminPass(fd.get('cur'))) { if(err) err.textContent='Senha atual incorreta.'; return; }
      if (fd.get('new1') !== fd.get('new2'))       { if(err) err.textContent='As senhas não coincidem.'; return; }
      BellaDB.setAdminPass(fd.get('new1'));
      e.target.reset();
      if (err) err.textContent = '';
      showToast('Senha alterada com sucesso! ✓');
    });

    /* Exportar */
    panel.querySelector('#btn-export')?.addEventListener('click', () => {
      const json = JSON.stringify(BellaDB.getAppointments(), null, 2);
      const blob = new Blob([json], { type:'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `agenda-bella-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    });

    /* Limpar */
    panel.querySelector('#btn-clear-data')?.addEventListener('click', () => {
      if (confirm('Apagar TODOS os agendamentos? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('bella-appointments');
        showToast('Agendamentos apagados.');
        agendaCalendar?.refresh();
      }
    });
  }

  /* ── Toast ─────────────────────────────────────────────── */
  function showToast(msg) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ── Utils ─────────────────────────────────────────────── */
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AdminApp.init);
} else {
  AdminApp.init();
}
