/* ============================================================
   STUDIO BELLA — db.js
   Camada de dados via localStorage (sem backend)
============================================================ */
'use strict';

const BellaDB = {
  K: {
    APPOINTMENTS:  'bella-appointments',
    DURATIONS:     'bella-service-durations',
    BLOCKED_SLOTS: 'bella-blocked-slots',
    BLOCKED_DAYS:  'bella-blocked-days',
    CLOSED_WDAYS:  'bella-closed-weekdays',
    GALLERY:       'bella-service-gallery',
    ADMIN_HASH:    'bella-admin-hash',
    WORK_START:    'bella-work-start',
    WORK_END:      'bella-work-end',
  },

  _get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },

  /* ── Agendamentos ─────────────────────────────────────── */
  getAppointments() { return this._get(this.K.APPOINTMENTS, []); },
  addAppointment(apt) {
    const all = this.getAppointments();
    apt.id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    apt.status = 'pending';
    apt.createdAt = Date.now();
    all.push(apt);
    this._set(this.K.APPOINTMENTS, all);
    return apt;
  },
  updateAppointment(id, patch) {
    const all = this.getAppointments().map(a => a.id === id ? { ...a, ...patch } : a);
    this._set(this.K.APPOINTMENTS, all);
  },
  deleteAppointment(id) {
    this._set(this.K.APPOINTMENTS, this.getAppointments().filter(a => a.id !== id));
  },
  getAppointmentsByDate(dateStr) {
    return this.getAppointments().filter(a => a.data === dateStr && a.status !== 'cancelled');
  },

  /* ── Durações dos serviços (minutos) ──────────────────── */
  DEFAULT_DURATIONS: {
    'Extensão de Cílios': 120,
    'Nail Designer':       90,
    'Design de Sobrancelhas': 45,
    'Lash Lifting':        60,
    'Manicure e Pedicure': 60,
    'Depilação':           30,
  },
  getDurations() { return { ...this.DEFAULT_DURATIONS, ...this._get(this.K.DURATIONS, {}) }; },
  setDuration(service, minutes) {
    const d = this._get(this.K.DURATIONS, {});
    d[service] = minutes;
    this._set(this.K.DURATIONS, d);
  },

  /* ── Slots bloqueados manualmente ─────────────────────── */
  getBlockedSlots() { return this._get(this.K.BLOCKED_SLOTS, {}); },
  blockSlot(dateStr, time) {
    const bs = this.getBlockedSlots();
    if (!bs[dateStr]) bs[dateStr] = [];
    if (!bs[dateStr].includes(time)) bs[dateStr].push(time);
    this._set(this.K.BLOCKED_SLOTS, bs);
  },
  unblockSlot(dateStr, time) {
    const bs = this.getBlockedSlots();
    if (bs[dateStr]) bs[dateStr] = bs[dateStr].filter(t => t !== time);
    this._set(this.K.BLOCKED_SLOTS, bs);
  },

  /* ── Dias bloqueados ──────────────────────────────────── */
  getBlockedDays() { return this._get(this.K.BLOCKED_DAYS, []); },
  blockDay(dateStr) {
    const bd = this.getBlockedDays();
    if (!bd.includes(dateStr)) { bd.push(dateStr); this._set(this.K.BLOCKED_DAYS, bd); }
  },
  unblockDay(dateStr) {
    this._set(this.K.BLOCKED_DAYS, this.getBlockedDays().filter(d => d !== dateStr));
  },

  /* ── Dias da semana fechados (0=Dom,6=Sáb) ────────────── */
  getClosedWeekdays() { return this._get(this.K.CLOSED_WDAYS, [0]); },
  setClosedWeekdays(arr) { this._set(this.K.CLOSED_WDAYS, arr); },

  /* ── Horário de trabalho ──────────────────────────────── */
  getWorkHours() {
    return {
      start: this._get(this.K.WORK_START, '09:00'),
      end:   this._get(this.K.WORK_END,   '18:00'),
    };
  },
  setWorkHours(start, end) {
    this._set(this.K.WORK_START, start);
    this._set(this.K.WORK_END, end);
  },

  /* ── Galeria de serviços ──────────────────────────────── */
  DEFAULT_GALLERY: {
    cilios: [
      { id:'c1', name:'Fio a Fio Natural',   price:120, desc:'Resultado natural e discreto, perfeito para o dia a dia.',      img:'' },
      { id:'c2', name:'Volume Russo',         price:160, desc:'Volume intenso e dramático com leques de múltiplos fios.',      img:'' },
      { id:'c3', name:'Mega Volume',          price:180, desc:'Máximo volume para um olhar poderoso e marcante.',              img:'' },
      { id:'c4', name:'Volume Híbrido',       price:150, desc:'Mix perfeito entre natural e volume, muito elegante.',          img:'' },
    ],
    unhas: [
      { id:'u1', name:'Gel Simples',          price:80,  desc:'Esmaltação em gel com acabamento impecável e duração de 3 semanas.', img:'' },
      { id:'u2', name:'Acrigel',              price:120, desc:'Unhas alongadas com acrigel de alta resistência.',             img:'' },
      { id:'u3', name:'Fibra de Vidro',       price:130, desc:'Alongamento ultra resistente e levíssimo.',                    img:'' },
      { id:'u4', name:'Nail Art Exclusiva',   price:150, desc:'Arte personalizada criada especialmente para você.',           img:'' },
      { id:'u5', name:'Francesinha',          price:90,  desc:'Clássica e elegante, nunca sai de moda.',                     img:'' },
    ],
    sobrancelhas: [
      { id:'s1', name:'Design + Henna',       price:60,  desc:'Moldagem precisa e henna para definir e preencher.',           img:'' },
      { id:'s2', name:'Design + Linha',       price:45,  desc:'Finalização perfeita com linha egípcia.',                      img:'' },
      { id:'s3', name:'Micropigmentação',     price:350, desc:'Procedimento semi-permanente com resultado de 1 a 2 anos.',   img:'' },
    ],
    lash: [
      { id:'l1', name:'Lash Lifting Curva C', price:90,  desc:'Curvatura suave e natural, ideal para cílios finos.',         img:'' },
      { id:'l2', name:'Lash Lifting Curva D', price:90,  desc:'Curvatura mais aberta para olhos amendoados.',                img:'' },
      { id:'l3', name:'Lash Lifting + Tintura',price:120, desc:'Curvatura + cor para máximo impacto sem maquiagem.',         img:'' },
    ],
    manicure: [
      { id:'m1', name:'Manicure Simples',     price:35,  desc:'Cutilagem e esmaltação tradicional.',                         img:'' },
      { id:'m2', name:'Pedicure Completo',    price:45,  desc:'Tratamento completo dos pés com hidratação.',                 img:'' },
      { id:'m3', name:'Mani + Pedi',          price:70,  desc:'Combo completo mãos e pés com mimo extra.',                   img:'' },
      { id:'m4', name:'Esmaltação em Gel',    price:60,  desc:'Durabilidade de 3 semanas sem lascar.',                      img:'' },
    ],
    depilacao: [
      { id:'d1', name:'Buço / Sobrancelha',   price:25,  desc:'Depilação facial com cera ou linha.',                         img:'' },
      { id:'d2', name:'Axilas',               price:30,  desc:'Cera quente para resultado duradouro.',                       img:'' },
      { id:'d3', name:'Pernas Completas',     price:80,  desc:'Pernas totalmente lisas e macias.',                           img:'' },
      { id:'d4', name:'Virilha Completa',     price:60,  desc:'Higiene e conforto com máximo cuidado.',                     img:'' },
    ],
  },
  getGallery() {
    const saved = this._get(this.K.GALLERY, {});
    const merged = {};
    Object.keys(this.DEFAULT_GALLERY).forEach(cat => {
      merged[cat] = saved[cat] || this.DEFAULT_GALLERY[cat];
    });
    return merged;
  },
  setGalleryCategory(cat, items) {
    const g = this._get(this.K.GALLERY, {});
    g[cat] = items;
    this._set(this.K.GALLERY, g);
  },

  /* ── Cálculo de slots disponíveis ─────────────────────── */
  getAvailableSlots(dateStr, serviceName) {
    const wh = this.getWorkHours();
    const durations = this.getDurations();
    const serviceDur = serviceName ? (durations[serviceName] || 60) : 60;

    /* Gera todos os slots do dia */
    const allSlots = [];
    let [sh, sm] = wh.start.split(':').map(Number);
    let [eh, em] = wh.end.split(':').map(Number);
    let cur = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while (cur + serviceDur <= endMin) {
      const h = String(Math.floor(cur / 60)).padStart(2, '0');
      const m = String(cur % 60).padStart(2, '0');
      allSlots.push(`${h}:${m}`);
      cur += 60; // intervalos de 1 hora
    }

    /* Slots bloqueados: agendamentos existentes */
    const appointments = this.getAppointmentsByDate(dateStr);
    const occupied = new Set();
    appointments.forEach(apt => {
      const aptDur = durations[apt.servico] || 60;
      const [ah, am] = apt.horario.split(':').map(Number);
      const aptStart = ah * 60 + am;
      for (let i = 0; i < aptDur; i += 60) {
        const t = aptStart + i;
        const th = String(Math.floor(t / 60)).padStart(2, '0');
        const tm = String(t % 60).padStart(2, '0');
        occupied.add(`${th}:${tm}`);
      }
    });

    /* Slots bloqueados manualmente */
    const manualBlocked = this.getBlockedSlots()[dateStr] || [];
    manualBlocked.forEach(t => occupied.add(t));

    /* Remove slots no passado (se hoje) */
    const now = new Date();
    const isToday = dateStr === now.toISOString().slice(0, 10);
    const nowMin = now.getHours() * 60 + now.getMinutes() + 30; // 30min de antecedência

    return allSlots.map(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotMin = h * 60 + m;
      const unavailable = occupied.has(slot) || (isToday && slotMin < nowMin);
      return { time: slot, available: !unavailable };
    });
  },

  /* ── Admin hash simples ───────────────────────────────── */
  ADMIN_DEFAULT: 'bella2024',
  checkAdminPass(pass) {
    const stored = this._get(this.K.ADMIN_HASH, null);
    if (!stored) return pass === this.ADMIN_DEFAULT;
    return this._simpleHash(pass) === stored;
  },
  setAdminPass(pass) { this._set(this.K.ADMIN_HASH, this._simpleHash(pass)); },
  _simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h.toString(36);
  },
};

if (typeof module !== 'undefined') module.exports = BellaDB;
