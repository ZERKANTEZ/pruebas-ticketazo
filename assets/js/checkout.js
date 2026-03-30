/**
 * checkout.js — Flujo de compra de boletos.
 * Paso 1: Elegir zona y cantidad
 * Paso 2: Resumen + confirmación simulada
 */
window.Checkout = (() => {
  let _eventId = null;
  let _selectedZone = null;
  let _qty = 1;

  // ── Abrir ─────────────────────────────────
  function open(eventId) {
    _eventId = eventId;
    _selectedZone = null;
    _qty = 1;
    _render('zones');
    document.getElementById('checkout-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('checkout-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
    _eventId = null;
    _selectedZone = null;
  }

  function closeOutside(e) {
    if (e.target === document.getElementById('checkout-overlay')) close();
  }

  // ── Progress bar helper ──────────────────
  function _progressBar(activeStep) {
    const steps = [
      { label: 'Zona' },
      { label: 'Pago' },
      { label: 'Listo' },
    ];
    let html = '<div class="ck-progress">';
    steps.forEach((s, i) => {
      const state = i < activeStep ? 'done' : i === activeStep ? 'active' : '';
      html += `<div class="ck-step ${state}">
        <div class="ck-step-circle">${i < activeStep ? '<span class="material-symbols-outlined" style="font-size:13px">check</span>' : i + 1}</div>
        <div class="ck-step-label">${s.label}</div>
      </div>`;
      if (i < steps.length - 1) html += `<div class="ck-step-line ${i < activeStep ? 'done' : ''}"></div>`;
    });
    html += '</div>';
    return html;
  }

  // ── Render step ───────────────────────────
  function _render(step) {
    const body = document.getElementById('checkout-body');
    if (!body) return;
    if (step === 'zones')   body.innerHTML = _stepZones();
    if (step === 'confirm') body.innerHTML = _stepConfirm();
    if (step === 'success') body.innerHTML = _stepSuccess();
  }

  // ── Paso 1: Selección de zona ──────────────
  function _stepZones() {
    const ev = EVENTS.find(e => e.id === _eventId);
    if (!ev) return '<p>Evento no encontrado.</p>';
    const zones = Zones.getZones(_eventId);
    const dateStr = new Date(ev.date).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return `
      ${_progressBar(0)}
      <div class="ck-header">
        <div class="ck-event-img" style="background-image:url('${ev.image}')"></div>
        <div class="ck-event-info">
          <div class="ck-event-title">${ev.title}</div>
          <div class="ck-event-meta">${ev.artist}</div>
          <div class="ck-event-meta">${dateStr}</div>
          <div class="ck-event-meta">${ev.venue ? ev.venue + ', ' : ''}${ev.city}</div>
        </div>
      </div>

      <div class="ck-body">
        <div class="ck-section-title">
          <span class="material-symbols-outlined" style="font-size:16px">chair</span>
          Selecciona tu zona
        </div>

        <div class="ck-zones">
          ${zones.length ? zones.map((z, i) => `
            <div class="ck-zone ${_selectedZone === i ? 'selected' : ''}"
                 id="ck-zone-${i}" onclick="Checkout.selectZone(${i})">
              <div class="ck-zone-dot" style="background:${z.color}"></div>
              <div class="ck-zone-info">
                <div class="ck-zone-name">${z.name}</div>
                <div class="ck-zone-cap">${z.capacity.toLocaleString()} lugares</div>
              </div>
              <div class="ck-zone-price">$${z.price.toLocaleString()}</div>
              <div class="ck-zone-check">${_selectedZone === i ? '<span class="material-symbols-outlined" style="font-size:20px;color:#a78bfa">check_circle</span>' : ''}</div>
            </div>`).join('')
            : '<p style="color:#475569;font-size:.85rem">Sin zonas configuradas para este evento.</p>'}
        </div>

        ${_selectedZone !== null ? `
          <div class="ck-qty-row">
            <div class="ck-qty-label">Cantidad de boletos</div>
            <div class="ck-qty-ctrl">
              <button class="ck-qty-btn" onclick="Checkout.changeQty(-1)">−</button>
              <span class="ck-qty-val" id="ck-qty-val">${_qty}</span>
              <button class="ck-qty-btn" onclick="Checkout.changeQty(1)">+</button>
            </div>
          </div>
          <div class="ck-subtotal">
            Subtotal: <strong>$${(zones[_selectedZone].price * _qty).toLocaleString()}</strong>
          </div>
          <button class="ck-btn-primary" onclick="Checkout.goConfirm()">
            Continuar
            <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:6px">arrow_forward</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  // ── Paso 2: Confirmación ──────────────────
  function _stepConfirm() {
    const ev = EVENTS.find(e => e.id === _eventId);
    const zones = Zones.getZones(_eventId);
    const zone = zones[_selectedZone];
    const total = zone.price * _qty;

    return `
      ${_progressBar(1)}
      <div class="ck-body">
        <div class="ck-back" onclick="Checkout._render('zones')">
          <span class="material-symbols-outlined" style="font-size:17px">arrow_back</span>
          Cambiar zona
        </div>

        <div class="ck-section-title">
          <span class="material-symbols-outlined" style="font-size:16px">receipt_long</span>
          Resumen de compra
        </div>

        <div class="ck-summary">
          <div class="ck-summary-row"><span>Evento</span><strong>${ev.title}</strong></div>
          <div class="ck-summary-row">
            <span>Zona</span>
            <strong style="display:flex;align-items:center;gap:6px">
              <span style="width:10px;height:10px;border-radius:50%;background:${zone.color};display:inline-block"></span>
              ${zone.name}
            </strong>
          </div>
          <div class="ck-summary-row"><span>Precio por boleto</span><strong>$${zone.price.toLocaleString()}</strong></div>
          <div class="ck-summary-row"><span>Cantidad</span><strong>${_qty} boleto${_qty > 1 ? 's' : ''}</strong></div>
          <div class="ck-summary-divider"></div>
          <div class="ck-summary-row ck-total"><span>Total</span><strong>$${total.toLocaleString()}</strong></div>
        </div>

        <div class="ck-section-title">
          <span class="material-symbols-outlined" style="font-size:16px">credit_card</span>
          Datos de pago
        </div>

        <div class="ck-card-form">
          <div class="ck-field">
            <label>Número de tarjeta</label>
            <input type="text" id="ck-card-num" placeholder="0000 0000 0000 0000" maxlength="19"
              oninput="Checkout.fmtCard(this)" class="ck-input"/>
          </div>
          <div class="ck-field-row">
            <div class="ck-field">
              <label>Titular</label>
              <input type="text" id="ck-card-name" placeholder="Como en la tarjeta" class="ck-input"/>
            </div>
            <div class="ck-field ck-field--sm">
              <label>Vence</label>
              <input type="text" id="ck-card-exp" placeholder="MM/AA" maxlength="5"
                oninput="Checkout.fmtExp(this)" class="ck-input"/>
            </div>
            <div class="ck-field ck-field--sm">
              <label>CVC</label>
              <input type="text" id="ck-card-cvc" placeholder="•••" maxlength="4"
                oninput="this.value=this.value.replace(/\\D/g,'')" class="ck-input"/>
            </div>
          </div>
          <div class="ck-secure-note">
            <span class="material-symbols-outlined" style="font-size:14px;color:#22c55e">lock</span>
            Pago simulado · Tus datos no se almacenan
          </div>
        </div>

        <div id="ck-err" class="ck-err hidden"></div>

        <button class="ck-btn-primary" onclick="Checkout.pay()">
          <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px">payments</span>
          Pagar $${total.toLocaleString()}
        </button>
      </div>
    `;
  }

  // ── Paso 3: Éxito ─────────────────────────
  function _stepSuccess() {
    const ev = EVENTS.find(e => e.id === _eventId);
    const zones = Zones.getZones(_eventId);
    const zone = zones[_selectedZone];

    return `
      ${_progressBar(2)}
      <div class="ck-success">
        <div class="ck-success-icon">
          <span class="material-symbols-outlined" style="font-size:52px;color:#22c55e" filled>check_circle</span>
        </div>
        <h2 class="ck-success-title">¡Compra exitosa!</h2>
        <p class="ck-success-sub">Tus boletos han sido reservados.</p>

        <div class="ck-ticket">
          <div class="ck-ticket-header">
            <div class="ck-ticket-logo">
              <span class="material-symbols-outlined" style="font-size:20px;color:#fff">confirmation_number</span>
            </div>
            <div>
              <div class="ck-ticket-event">${ev?.title}</div>
              <div class="ck-ticket-artist">${ev?.artist}</div>
            </div>
          </div>
          <div class="ck-ticket-detail">
            <div class="ck-ticket-row"><span>Fecha</span><strong>${new Date(ev?.date).toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})}</strong></div>
            <div class="ck-ticket-row"><span>Lugar</span><strong>${ev?.venue || ev?.city}</strong></div>
            <div class="ck-ticket-row">
              <span>Zona</span>
              <strong style="display:flex;align-items:center;gap:6px">
                <span style="width:8px;height:8px;border-radius:50%;background:${zone?.color};display:inline-block"></span>
                ${zone?.name}
              </strong>
            </div>
            <div class="ck-ticket-row"><span>Boletos</span><strong>${_qty}</strong></div>
          <div style="text-align: center; border-style: dashed; border-color: #cbd5e1; border-width: 1px 0 0 0; padding-top: 16px; margin-top: auto; padding-bottom: 8px; cursor: pointer;" onclick="Checkout.close(); App.navigate('profile')">
            <span class="material-symbols-outlined" style="font-size: 64px; color: #1e293b;">qr_code_2</span>
            <div style="font-size: .75rem; color: #64748b; margin-top: 4px; font-weight: 600; letter-spacing: 1px;">VER EN MIS BOLETOS (CLIC AQUÍ)</div>
          </div>
        </div>

        <button class="ck-btn-primary" onclick="Checkout.close(); App.navigate('profile')" style="margin-bottom: 8px;">
          Ir a mis boletos
        </button>
        <button class="ck-btn-secondary" onclick="Checkout.close()">
          Cerrar
        </button>
      </div>
    `;
  }

  // ── Acciones ───────────────────────────────
  function selectZone(idx) {
    _selectedZone = idx;
    _qty = 1;
    _render('zones');
  }

  function changeQty(delta) {
    const zones = Zones.getZones(_eventId);
    const max = zones[_selectedZone]?.capacity || 10;
    _qty = Math.max(1, Math.min(_qty + delta, 10, max));
    // Re-render just qty display without full re-render
    document.getElementById('ck-qty-val').textContent = _qty;
    const price = zones[_selectedZone]?.price || 0;
    const sub = document.querySelector('.ck-subtotal');
    if (sub) sub.innerHTML = `Subtotal: <strong>$${(price * _qty).toLocaleString()}</strong>`;
  }

  function goConfirm() {
    if (_selectedZone === null) return;
    _render('confirm');
  }

  function fmtCard(el) {
    el.value = el.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})(?=\d)/g,'$1 ');
  }

  function fmtExp(el) {
    const c = el.value.replace(/\D/g,'').slice(0,4);
    el.value = c.length > 2 ? c.slice(0,2) + '/' + c.slice(2) : c;
  }

  function pay() {
    const num  = document.getElementById('ck-card-num')?.value.replace(/\s/g,'');
    const name = document.getElementById('ck-card-name')?.value.trim();
    const exp  = document.getElementById('ck-card-exp')?.value.trim();
    const cvc  = document.getElementById('ck-card-cvc')?.value.trim();

    const errEl = document.getElementById('ck-err');
    function showErr(msg) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    }

    if (num.length < 16)  { showErr('Ingresa un número de tarjeta válido (16 dígitos).'); return; }
    if (!name)            { showErr('Ingresa el nombre del titular.'); return; }
    if (exp.length < 5)   { showErr('Ingresa la fecha de vencimiento (MM/AA).'); return; }
    if (cvc.length < 3)   { showErr('Ingresa el CVC (3-4 dígitos).'); return; }

    errEl.classList.add('hidden');

    // Simulación de pago (en producción: llamar a pasarela de pago)
    const btn = document.querySelector('.ck-btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    setTimeout(() => {
      const zones = typeof Zones !== 'undefined' ? Zones.getZones(_eventId) : [];
      if (typeof Profile !== 'undefined' && Profile.addTickets) {
        Profile.addTickets(_eventId, zones[_selectedZone]?.name || 'general', _qty);
      }
      _render('success');
    }, 1200);
  }

  return { open, close, closeOutside, selectZone, changeQty, goConfirm, pay, fmtCard, fmtExp, _render };
})();
