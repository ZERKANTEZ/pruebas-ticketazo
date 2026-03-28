/**
 * zones.js — Módulo de zonas y dashboard.
 *
 * LÓGICA NUEVA:
 *   El shell (sidebar + main) vive en index.html como HTML estático.
 *   Este módulo SOLO llena:
 *     · #db-nav        → botones según rol
 *     · #db-user-block → nombre y acciones del usuario
 *     · #panel-*       → contenido de cada pestaña
 */

const Zones = (() => {

  const COLORS = [
    '#FF69B4','#87CEEB','#8A2BE2','#facc15','#fb923c',
    '#34d399','#f87171','#a78bfa','#60a5fa','#e879f9',
    '#4ade80','#38bdf8','#fbbf24','#94a3b8','#f472b6',
  ];

  const _state = {};

  /* ── Init ── */
  function init() {
    EVENTS.forEach(ev => {
      if (_state[ev.id]) return;
      _state[ev.id] = { zones: _legacyZones(ev.prices), status: 'approved', note: '' };
    });
  }

  function _legacyZones(prices) {
    const map = { plata: COLORS[1], oro: COLORS[3], vip: COLORS[0] };
    return Object.entries(prices || {}).map(([name, price], i) => ({
      id: `z${i}`, name: name.charAt(0).toUpperCase() + name.slice(1),
      price, color: map[name] || COLORS[i % COLORS.length], capacity: 500,
    }));
  }

  /* ── Getters ── */
  function getZones(id)    { return _state[id]?.zones  || []; }
  function getStatus(id)   { return _state[id]?.status || 'draft'; }
  function getMinPrice(id) { const z = getZones(id); return z.length ? Math.min(...z.map(z => z.price)) : 0; }
  function getPending()    { return EVENTS.filter(ev => _state[ev.id]?.status === 'pending'); }

  /* ══════════════════════════════════════════════════════════
     ABRIR DASHBOARD
     Solo actualiza nav + user block, luego navega.
     El shell HTML ya existe — no se toca.
  ══════════════════════════════════════════════════════════ */
  function openDashboard() {
    if (!Auth.isLoggedIn()) { Auth.openModal(); return; }
    const role = Auth.session().role;
    if (!['organizer','treasurer','admin'].includes(role)) {
      alert('No tienes acceso a este panel.'); return;
    }
    _buildNav();
    _buildUser();
    App.navigate('dashboard');
  }

  function _buildNav() {
    const nav   = document.getElementById('db-nav');
    if (!nav) return;
    const role  = Auth.session().role;
    const isOrg = role === 'organizer';
    const isTrea= role === 'treasurer';
    const pend  = getPending().length;

    const tabs = isOrg ? [
      { key:'events', icon:Icons.ticket, label:'Mis Eventos y Zonas', badge:0    },
      { key:'new',    icon:'', label:'Crear Evento',        badge:0    },
    ] : isTrea ? [
      { key:'review',  icon:'', label:'Revisar Precios',       badge:pend },
      { key:'sales',   icon:'', label:'Ventas por Evento',     badge:0    },
      { key:'payouts', icon:'', label:'Pagos a Organizadores', badge:0    },
      { key:'refunds', icon:'↩',  label:'Reembolsos',            badge:0    },
    ] : [
      { key:'overview', icon:'', label:'Resumen General', badge:0    },
      { key:'review',   icon:'', label:'Aprobar Zonas',   badge:pend },
    ];

    nav.innerHTML = tabs.map((t, i) => `
        <button class="db-nav-btn${i===0?' active':''}" id="tab-${t.key}"
          onclick="Zones.switchTab('${t.key}',this)">
          <span class="db-nav-icon">${t.icon}</span>
          <span class="db-nav-label">${t.label}</span>
          ${t.badge > 0 ? `<span class="db-nav-badge">${t.badge}</span>` : ''}
        </button>`).join('');

    // Vaciar todos los paneles (el usuario puede cambiar de rol entre sesiones)
    document.querySelectorAll('.db-panel').forEach(p => { p.classList.remove('active'); p.innerHTML = ''; });

    // Activar y llenar el primer panel
    const firstPanel = document.getElementById(`panel-${tabs[0].key}`);
    if (firstPanel) { firstPanel.classList.add('active'); firstPanel.innerHTML = _panelContent(tabs[0].key); }

    const titleEl = document.getElementById('db-topbar-title');
    if (titleEl) titleEl.textContent = tabs[0].label;
  }

  function _buildUser() {
    const el = document.getElementById('db-user-block');
    if (!el) return;
    const sess     = Auth.session();
    const initials = sess.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const roleIcons= { organizer:'', treasurer:'', admin:'' };
    const roleNames= { organizer:'Organizador', treasurer:'Tesorero', admin:'Administrador' };
    el.innerHTML = `
      <div class="db-user-avatar">${initials}</div>
      <div class="db-user-info">
        <div class="db-user-name">${sess.name}</div>
        <div class="db-user-role">${roleIcons[sess.role]||''} ${roleNames[sess.role]||sess.role}</div>
      </div>
      <div class="db-user-actions">
        <button class="db-user-action-btn" onclick="Profile.open()" title="Mi Perfil"></button>
        <button class="db-user-action-btn" onclick="Auth.logout()" title="Cerrar Sesión"></button>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════
     CAMBIO DE PESTAÑA
  ══════════════════════════════════════════════════════════ */
  function switchTab(key, btn) {
    // 1. Nav buttons
    document.querySelectorAll('.db-nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // 2. Show panel
    document.querySelectorAll('.db-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${key}`);
    if (!panel) return;
    panel.classList.add('active');

    // 3. Fill if empty
    if (panel.innerHTML.trim() === '') panel.innerHTML = _panelContent(key);

    // 4. Title
    const titles = {
      events:'Mis Eventos y Zonas', new:'Crear Evento',
      review:'Revisión de Precios', sales:'Ventas por Evento',
      payouts:'Pagos a Organizadores', overview:'Resumen General', refunds:'Reembolsos',
    };
    const t = document.getElementById('db-topbar-title');
    if (t && titles[key]) t.textContent = titles[key];
  }

  function _panelContent(key) {
    const map = {
      events: _renderMyEvents, new: _renderCreateForm,
      review: _renderReview,  sales: _renderSales,
      payouts:_renderPayouts, overview:_renderOverview, refunds:_renderRefunds,
    };
    return map[key] ? map[key]() : '';
  }

  /* ── Sidebar mobile ── */
  function openSidebar() {
    if (window.innerWidth > 900) return;
    document.getElementById('db-sidebar')?.classList.add('open');
    document.getElementById('db-overlay')?.classList.add('open');
  }
  function closeSidebar() {
    document.getElementById('db-sidebar')?.classList.remove('open');
    document.getElementById('db-overlay')?.classList.remove('open');
  }

  /* ══════════════════════════════════════════════════════════
     ORGANIZADOR — MIS EVENTOS
  ══════════════════════════════════════════════════════════ */
  function _renderMyEvents() {
    const email    = Auth.session().email;
    const myEvents = EVENTS.filter(e => e.organizerId === email || e.organizerId === 'eber.higuera@gmail.com');
    const approved = myEvents.filter(e => (_state[e.id]?.status||'draft') === 'approved').length;
    const pending  = myEvents.filter(e => (_state[e.id]?.status||'draft') === 'pending').length;
    return `
      <div class="db-page-header">
        <div><h1>Mis Eventos</h1><p>Gestiona tus eventos y define los niveles de boletos.</p></div>
      </div>
      <div class="db-stats">
        <div class="db-stat blue"><div class="db-stat-icon"></div><div><div class="db-stat-label">Eventos Activos</div><div class="db-stat-value">${myEvents.length}</div></div></div>
        <div class="db-stat green"><div class="db-stat-icon"></div><div><div class="db-stat-label">Zonas Aprobadas</div><div class="db-stat-value">${approved}</div></div></div>
        <div class="db-stat purple"><div class="db-stat-icon">⏳</div><div><div class="db-stat-label">En Revisión</div><div class="db-stat-value">${pending}</div></div></div>
      </div>
      ${myEvents.length
        ? myEvents.map(ev => _eventCard(ev)).join('')
        : `<div class="db-empty"><div class="db-empty-icon"></div><div class="db-empty-text">Aún no tienes eventos creados.</div></div>`}`;
  }

  function _eventCard(ev) {
    const st     = _state[ev.id] || {};
    const status = st.status || 'draft';
    const canEdit= status === 'draft' || status === 'rejected';
    const labels = {approved:'Aprobado',pending:'⏳ En revisión',rejected:'Rechazado',draft:'Borrador'};
    const note   = st.note ? `<div class="db-rejection"><strong>Nota del tesorero:</strong> ${st.note}</div>` : '';
    return `
      <div class="db-event-card" id="evc-${ev.id}">
        <div class="db-event-card-head" onclick="Zones.toggleExpand('${ev.id}')">
          <div class="db-event-thumb"><img src="${ev.image}" alt="${ev.title}" loading="lazy"/></div>
          <div class="db-event-info">
            <div class="db-event-name">${ev.title}</div>
            <div class="db-event-meta">${ev.city} · ${_fmt(ev.date)}</div>
          </div>
          <span class="db-badge ${status}">${labels[status]}</span>
          <span class="db-expand" id="exp-${ev.id}">▾</span>
        </div>
        <div class="db-zone-builder" id="zb-${ev.id}">
          ${note}
          ${canEdit ? _zoneEditor(ev.id, st.zones||[]) : _zoneReadonly(st.zones||[], status)}
        </div>
      </div>`;
  }

  function toggleExpand(id) {
    document.getElementById(`zb-${id}`)?.classList.toggle('open');
    document.getElementById(`exp-${id}`)?.classList.toggle('open');
  }

  function _zoneEditor(eventId, zones) {
    const rows = zones.map((z, i) => `
      <div class="db-zone-row" id="zrow-${eventId}-${i}">
        <div class="dz-dot" style="background:${z.color}" onclick="Zones.pickColor('${eventId}',${i},this)"></div>
        <input class="dz-input" type="text"   placeholder="Nombre"    value="${z.name}"     oninput="Zones.setField('${eventId}',${i},'name',this.value)"/>
        <input class="dz-input" type="number" placeholder="Precio"    value="${z.price}"    oninput="Zones.setField('${eventId}',${i},'price',+this.value)" min="0"/>
        <input class="dz-input" type="number" placeholder="Capacidad" value="${z.capacity}" oninput="Zones.setField('${eventId}',${i},'capacity',+this.value)" min="1"/>
        <button class="dz-del" onclick="Zones.deleteZone('${eventId}',${i})"></button>
      </div>`).join('');
    return `
      <div style="font-size:.82rem;font-weight:700;color:#374151;margin-bottom:10px"><span style="display:inline-flex;margin-right:6px;vertical-align:text-bottom">${Icons.ticket}</span> Niveles de Boletos</div>
      <div class="db-zone-rows" id="zrows-${eventId}">${rows}</div>
      <button class="db-add-zone" onclick="Zones.addZone('${eventId}')">＋ Agregar nivel</button>
      <div class="db-zone-actions">
        <button class="db-btn db-btn-secondary" onclick="Zones.toggleExpand('${eventId}')">Cancelar</button>
        <button class="db-btn db-btn-primary"   onclick="Zones.submitZones('${eventId}')">Guardar y enviar al tesorero →</button>
      </div>`;
  }

  function _zoneReadonly(zones, status) {
    const pill = {pending:'<span class="db-status-pill pending">⏳ Esperando aprobación</span>',approved:'<span class="db-status-pill approved">Zonas aprobadas</span>'}[status]||'';
    return `<div style="margin-bottom:10px">${pill}</div><div class="db-zone-preview">${zones.map(z=>`
      <div class="db-zone-preview-row">
        <div class="db-zone-preview-left"><div class="db-dot-sm" style="background:${z.color}"></div><span class="db-zone-preview-name">${z.name}</span><span class="db-zone-preview-cap">(${z.capacity.toLocaleString()})</span></div>
        <span class="db-zone-preview-price">$${z.price.toLocaleString()}</span>
      </div>`).join('')}</div>`;
  }

  function addZone(eventId) {
    if (!_state[eventId]) _state[eventId]={zones:[],status:'draft',note:''};
    _state[eventId].zones.push({id:`z${Date.now()}`,name:'',price:0,color:COLORS[_state[eventId].zones.length%COLORS.length],capacity:500});
    _refreshCard(eventId);
  }
  function deleteZone(eventId, idx) { _state[eventId]?.zones.splice(idx,1); _refreshCard(eventId); }
  function setField(eventId, idx, field, val) { if (_state[eventId]?.zones[idx]) _state[eventId].zones[idx][field]=val; }
  function submitZones(eventId) {
    const st=_state[eventId];
    if (!st) return;
    if (st.zones.some(z=>!z.name.trim()||z.price<=0||z.capacity<=0)){alert('Completa todos los niveles.');return;}
    if (!st.zones.length){alert('Agrega al menos un nivel.');return;}
    st.status='pending';st.note='';
    _refreshCard(eventId);
    _toast('Enviado al tesorero','success');
  }
  function _refreshCard(eventId) {
    const ev=EVENTS.find(e=>e.id===eventId);
    const card=document.getElementById(`evc-${eventId}`);
    if (!ev||!card) return;
    const open=document.getElementById(`zb-${eventId}`)?.classList.contains('open');
    card.outerHTML=_eventCard(ev);
    if (open){document.getElementById(`zb-${eventId}`)?.classList.add('open');document.getElementById(`exp-${eventId}`)?.classList.add('open');}
  }

  function pickColor(eventId, idx, dotEl) {
    _showColorPicker(dotEl, c=>{setField(eventId,idx,'color',c);dotEl.style.background=c;});
  }
  function pickColorNew(i, dotEl) { _showColorPicker(dotEl, c=>{dotEl.style.background=c;}); }
  function _showColorPicker(dotEl, onPick) {
    document.getElementById('_cp')?.remove();
    const pop=document.createElement('div');pop.className='dz-color-picker';pop.id='_cp';
    COLORS.forEach(c=>{
      const o=document.createElement('div');o.className='dz-color-opt';o.style.background=c;
      o.onmousedown=e=>{e.stopPropagation();onPick(c);pop.remove();};
      pop.appendChild(o);
    });
    document.body.appendChild(pop);
    const r=dotEl.getBoundingClientRect();
    pop.style.top=(r.bottom+5)+'px';
    pop.style.left=Math.min(r.left,window.innerWidth-180)+'px';
    setTimeout(()=>{document.addEventListener('click',function h(e){if(!pop.contains(e.target)){pop.remove();document.removeEventListener('click',h);}});},0);
  }

  /* ══════════════════════════════════════════════════════════
     ORGANIZADOR — CREAR EVENTO
  ══════════════════════════════════════════════════════════ */
  function _renderCreateForm() {
    return `
      <div class="db-page-header"><div><h1>Crear Nuevo Evento</h1><p>Define información y niveles de boletos.</p></div></div>
      <div class="db-card"><div class="db-card-head"><div class="db-card-title">Información General</div></div>
        <div class="db-card-body"><div class="db-grid2">
          <div class="db-field"><label class="db-label">Nombre del Evento</label><input class="db-input" type="text" placeholder="Ej. Most Wanted Tour"/></div>
          <div class="db-field"><label class="db-label">Artista / Grupo</label><input class="db-input" type="text" placeholder="Nombre del artista"/></div>
          <div class="db-field"><label class="db-label">Nombre de Gira <span style="color:#9ca3af;font-weight:400">— opcional</span></label><input class="db-input" type="text" placeholder="Ej. Most Wanted Tour 2026"/></div>
          <div class="db-field"><label class="db-label">Categoría</label><select class="db-select"><option value="">Selecciona...</option>${CATEGORIES.filter(c=>c!=='Todos').map(c=>`<option>${c}</option>`).join('')}</select></div>
          <div class="db-field"><label class="db-label">Fecha</label><input class="db-input" type="date"/></div>
          <div class="db-field"><label class="db-label">Hora</label><input class="db-input" type="time" value="20:00"/></div>
          <div class="db-field"><label class="db-label">Ciudad</label><input class="db-input" type="text" placeholder="Ciudad"/></div>
          <div class="db-field"><label class="db-label">Recinto</label><input class="db-input" type="text" placeholder="Ej. Foro Sol"/></div>
        </div><label class="db-checkbox" style="margin-top:6px"><input type="checkbox"/><span>Solo para adultos (+18)</span></label>
        </div></div>
      <div class="db-card"><div class="db-card-head"><div class="db-card-title">Imagen Promocional</div></div>
        <div class="db-card-body"><div class="db-upload"><div class="db-upload-icon"></div><div class="db-upload-text">Arrastra o haz clic</div><div class="db-upload-hint">JPG, PNG, WEBP · Máx. 10 MB</div></div></div></div>
      <div class="db-card"><div class="db-card-head"><div class="db-card-title"><span style="display:inline-flex;margin-right:6px;vertical-align:text-bottom">${Icons.ticket}</span> Niveles de Boletos</div><span style="font-size:.73rem;color:#64748b">El tesorero aprueba los precios.</span></div>
        <div class="db-card-body">
          <div class="db-zone-rows" id="new-zone-rows">${_newZoneRow(0,{name:'General',price:500,color:COLORS[1],capacity:1000})}</div>
          <button class="db-add-zone" onclick="Zones.addNewZone()">＋ Agregar nivel</button>
        </div></div>
      <div class="db-card"><div class="db-card-head"><div class="db-card-title">Descripción</div></div>
        <div class="db-card-body"><textarea class="db-textarea" rows="4" placeholder="Describe el evento..."></textarea></div></div>
      <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:4px">
        <button class="db-btn db-btn-secondary">Guardar borrador</button>
        <button class="db-btn db-btn-primary" onclick="alert('Enviado al tesorero para revisión.')">Crear y enviar →</button>
      </div>`;
  }
  let _nzc=1;
  function _newZoneRow(i,d){d=d||{};const color=d.color||COLORS[i%COLORS.length];return`<div class="db-zone-row" id="nzr-${i}"><div class="dz-dot" style="background:${color}" onclick="Zones.pickColorNew('${i}',this)"></div><input class="dz-input" type="text" placeholder="Nombre" value="${d.name||''}"/><input class="dz-input" type="number" placeholder="Precio" value="${d.price||''}" min="0"/><input class="dz-input" type="number" placeholder="Capacidad" value="${d.capacity||''}" min="1"/><button class="dz-del" onclick="document.getElementById('nzr-${i}').remove()"></button></div>`;}
  function addNewZone(){const l=document.getElementById('new-zone-rows');if(!l)return;const d=document.createElement('div');d.innerHTML=_newZoneRow(_nzc++);l.appendChild(d.firstElementChild);}

  /* ══════════════════════════════════════════════════════════
     TESORERO — REVISAR PRECIOS
  ══════════════════════════════════════════════════════════ */
  function _renderReview() {
    const pending=getPending();
    return `
      <div class="db-page-header"><div><h1>Revisión de Precios</h1><p>Ajusta y aprueba los precios propuestos.</p></div>${pending.length?`<span style="background:#fefce8;color:#ca8a04;font-size:.72rem;font-weight:700;padding:4px 12px;border-radius:999px;border:1px solid #fde68a">${pending.length} pendiente${pending.length>1?'s':''}</span>`:''}</div>
      ${!pending.length?`<div class="db-empty"><div class="db-empty-icon"></div><div class="db-empty-text">No hay precios pendientes.</div></div>`:pending.map(ev=>{
        const zones=_state[ev.id]?.zones||[];
        return`<div class="db-review-card" id="rev-${ev.id}">
          <div class="db-review-head">
            <div class="db-review-thumb"><img src="${ev.image}" alt="${ev.title}" loading="lazy"/></div>
            <div><div class="db-review-title">${ev.title}</div><div class="db-review-meta">${ev.city} · ${_fmt(ev.date)}</div><div class="db-review-org">Organizado por: ${ev.organizerId||'eber.higuera@gmail.com'}</div></div>
          </div>
          <div class="db-review-zones"><div class="db-review-zones-label">Precios propuestos — puedes ajustarlos antes de aprobar</div>
            ${zones.map((z,i)=>`<div class="db-review-zone-row">
              <div class="db-review-zone-left"><div class="db-dot-sm" style="background:${z.color}"></div><span class="db-review-zone-name">${z.name}</span><span class="db-review-zone-cap">(${z.capacity.toLocaleString()})</span></div>
              <div class="db-review-price-wrap"><span class="db-review-price">$${z.price.toLocaleString()}</span><div><div class="db-override-label">Ajustar:</div><input class="db-override-input" type="number" min="0" placeholder="${z.price}" oninput="Zones.overridePrice('${ev.id}',${i},+this.value)"/></div></div>
            </div>`).join('')}
          </div>
          <div class="db-reject-note-row"><label class="db-reject-note-label">Nota de rechazo (opcional)</label><input class="db-reject-note-input" id="rnote-${ev.id}" type="text" placeholder="Motivo..."/></div>
          <div class="db-review-actions"><button class="db-btn db-btn-danger" onclick="Zones.rejectEvent('${ev.id}')">Rechazar</button><button class="db-btn db-btn-success" onclick="Zones.approveEvent('${ev.id}')">Aprobar zonas</button></div>
        </div>`;}).join('')}`;
  }
  function overridePrice(eventId,idx,val){if(_state[eventId]?.zones[idx]&&val>0)_state[eventId].zones[idx].price=val;}
  function approveEvent(eventId){if(!_state[eventId])return;_state[eventId].status='approved';_state[eventId].note='';document.getElementById(`rev-${eventId}`)?.remove();_toast('Zonas aprobadas','success');}
  function rejectEvent(eventId){const note=document.getElementById(`rnote-${eventId}`)?.value.trim()||'Sin motivo';if(!_state[eventId])return;_state[eventId].status='rejected';_state[eventId].note=note;document.getElementById(`rev-${eventId}`)?.remove();_toast('Rechazado','error');}

  /* ══════════════════════════════════════════════════════════
     TESORERO — VENTAS (columnas dinámicas)
  ══════════════════════════════════════════════════════════ */
  function _renderSales() {
    const data=EVENTS.filter(ev=>ev.status!=='expired'&&getZones(ev.id).length>0).map(ev=>{
      const zones=getZones(ev.id);
      const sold=zones.map(z=>({...z,sold:Math.floor(z.capacity*(0.35+Math.random()*0.45))}));
      const rev=sold.reduce((a,z)=>a+z.sold*z.price,0);
      const tot=sold.reduce((a,z)=>a+z.sold,0);
      return{ev,sold,rev,tot};
    });
    if(!data.length)return`<div class="db-page-header"><div><h1>Ventas por Evento</h1></div></div><div class="db-empty"><div class="db-empty-icon"></div><div class="db-empty-text">Sin datos aún.</div></div>`;
    const tRev=data.reduce((a,e)=>a+e.rev,0),tSold=data.reduce((a,e)=>a+e.tot,0),maxRev=Math.max(...data.map(e=>e.rev));
    return`
      <div class="db-page-header"><div><h1>Ventas por Evento</h1><p>Columnas según niveles reales de cada evento.</p></div></div>
      <div class="db-stats">
        <div class="db-stat blue"><div class="db-stat-icon"></div><div><div class="db-stat-label">Ingresos</div><div class="db-stat-value">$${(tRev/1000).toFixed(0)}k</div></div></div>
        <div class="db-stat pink"><div class="db-stat-icon">${Icons.ticket}</div><div><div class="db-stat-label">Boletos</div><div class="db-stat-value">${tSold.toLocaleString()}</div></div></div>
        <div class="db-stat purple"><div class="db-stat-icon"></div><div><div class="db-stat-label">Eventos</div><div class="db-stat-value">${data.length}</div></div></div>
      </div>
      <div class="db-card" style="margin-bottom:20px"><div class="db-card-head"><div class="db-card-title">Ingresos por Evento</div></div><div class="db-card-body"><div class="sc-chart">
        ${data.map(e=>{const pct=maxRev>0?Math.round((e.rev/maxRev)*100):0;return`<div class="sc-row"><div><div class="sc-name">${e.ev.title}</div><div class="sc-org">‍${e.ev.organizerId||'eber.higuera@gmail.com'}</div></div><div class="sc-bar-wrap"><div class="sc-bar" style="width:${Math.max(pct,8)}%"><span class="sc-bar-label">$${(e.rev/1000).toFixed(0)}k</span></div></div><div class="sc-count">${e.tot.toLocaleString()}</div></div>`;}).join('')}
      </div></div></div>
      ${data.map(e=>{
        const cap=e.sold.reduce((a,z)=>a+z.capacity,0),fill=cap>0?Math.round((e.tot/cap)*100):0;
        return`<div class="db-card" style="margin-bottom:14px">
          <div class="db-card-head" style="flex-wrap:wrap;gap:8px"><div><div class="db-card-title">${e.ev.title}</div><div style="font-size:.7rem;color:#64748b;margin-top:1px">‍${e.ev.organizerId||'eber.higuera@gmail.com'}</div></div><div style="font-size:.74rem;display:flex;gap:10px"><span style="color:#64748b">${e.tot.toLocaleString()} boletos · ${fill}% ocup.</span><span style="color:#8A2BE2;font-weight:700">$${(e.rev/1000).toFixed(0)}k</span></div></div>
          <div class="db-table-wrap"><table class="db-table">
            <thead><tr>${e.sold.map(z=>`<th><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${z.color};margin-right:4px"></span>${z.name}</th>`).join('')}<th>Total</th><th>Ingresos</th></tr></thead>
            <tbody><tr>${e.sold.map(z=>`<td><div style="font-weight:600;font-size:.79rem">${z.sold.toLocaleString()}</div><div style="font-size:.65rem;color:#94a3b8">de ${z.capacity.toLocaleString()}</div><div style="font-size:.65rem;color:#8A2BE2">$${(z.sold*z.price/1000).toFixed(0)}k</div></td>`).join('')}<td style="font-weight:700">${e.tot.toLocaleString()}</td><td style="font-weight:700;color:#8A2BE2">$${(e.rev/1000).toFixed(0)}k</td></tr></tbody>
          </table></div></div>`;
      }).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════
     TESORERO — PAGOS
  ══════════════════════════════════════════════════════════ */
  function _renderPayouts() {
    const orgs=[{email:'eber.higuera@gmail.com',name:'Eber Higuera',events:['Bad Bunny CDMX','Synthwave','Neon Nights'],gross:5334000,paid:false},{email:'other.organizer@gmail.com',name:'Compañía Teatral Elite',events:['El Fantasma de la Ópera'],gross:1130000,paid:true}];
    return`<div class="db-page-header"><div><h1>Pagos a Organizadores</h1><p>Distribuye ingresos descontando comisión (5%).</p></div></div>
      ${orgs.map(org=>{const fee=Math.round(org.gross*.05),payout=org.gross-fee;return`<div class="db-card" style="margin-bottom:14px">
        <div class="db-card-head"><div><div class="db-card-title">${org.name}</div><div style="font-size:.7rem;color:#64748b;margin-top:1px">${org.email}</div></div><span class="db-badge ${org.paid?'approved':'pending'}">${org.paid?'Pagado':'⏳ Pendiente'}</span></div>
        <div class="db-card-body">
          <div class="db-stats" style="margin-bottom:14px">
            <div class="db-stat blue"><div class="db-stat-icon" style="font-size:.85rem"></div><div><div class="db-stat-label">Ingresos Brutos</div><div class="db-stat-value" style="font-size:1.1rem">$${org.gross.toLocaleString()}</div></div></div>
            <div class="db-stat pink"><div class="db-stat-icon" style="font-size:.85rem">%</div><div><div class="db-stat-label">Comisión 5%</div><div class="db-stat-value" style="font-size:1.1rem;color:#dc2626">−$${fee.toLocaleString()}</div></div></div>
            <div class="db-stat green"><div class="db-stat-icon" style="font-size:.85rem"></div><div><div class="db-stat-label">A Pagar</div><div class="db-stat-value" style="font-size:1.1rem;color:#16a34a">$${payout.toLocaleString()}</div></div></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">${org.events.map(e=>`<span style="font-size:.72rem;padding:3px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;color:#374151;display:inline-flex;align-items:center;gap:4px"><span>${Icons.ticket}</span> ${e}</span>`).join('')}</div>
          ${!org.paid?`<div style="display:flex;gap:8px;justify-content:flex-end"><button class="db-btn db-btn-secondary" onclick="alert('Comprobante solicitado')">Solicitar comprobante</button><button class="db-btn db-btn-primary" onclick="this.closest('.db-card').querySelector('.db-badge').className='db-badge approved';this.closest('.db-card').querySelector('.db-badge').textContent='Pagado';this.parentElement.remove()">Marcar como Pagado</button></div>`:`<div style="font-size:.78rem;color:#16a34a;text-align:right">Pago registrado</div>`}
        </div></div>`;}).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════
     TESORERO — REEMBOLSOS
  ══════════════════════════════════════════════════════════ */
  function _renderRefunds() {
    const list=[{id:'R-1001',user:'juan.perez@gmail.com',event:'Bad Bunny CDMX',amount:1500,status:'pending'},{id:'R-1002',user:'maria.gomez@outlook.com',event:'Synthwave',amount:2000,status:'approved'},{id:'R-1003',user:'luis.rdz@hotmail.com',event:'Neon Nights',amount:800,status:'pending'}];
    return`<div class="db-page-header"><div><h1>Reembolsos</h1></div><button class="db-btn db-btn-primary" style="font-size:.78rem" onclick="alert('Pagos distribuidos')">Distribuir Pagos</button></div>
      <div class="db-card"><div class="db-table-wrap"><table class="db-table"><thead><tr><th>ID</th><th>Usuario</th><th>Evento</th><th>Monto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
        ${list.map(r=>`<tr><td><code style="font-size:.75rem;color:#8A2BE2">${r.id}</code></td><td style="font-size:.78rem">${r.user}</td><td style="font-size:.78rem">${r.event}</td><td style="font-weight:700">$${r.amount.toLocaleString()}</td><td><span class="db-badge ${r.status==='approved'?'approved':'pending'}">${r.status==='approved'?'Aprobado':'⏳ Pendiente'}</span></td><td>${r.status==='pending'?`<button class="db-btn db-btn-success" style="font-size:.71rem;padding:5px 10px" onclick="alert('${r.id} aprobado')">Aprobar</button>`:'—'}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  /* ══════════════════════════════════════════════════════════
     ADMIN — RESUMEN
  ══════════════════════════════════════════════════════════ */
  function _renderOverview() {
    const p=getPending();
    return`<div class="db-page-header"><div><h1>Centro de Control</h1><p>Supervisión global.</p></div><div style="background:rgba(138,43,226,.08);color:#8A2BE2;padding:6px 14px;border-radius:9px;font-size:.78rem;font-weight:700;border:1px solid rgba(138,43,226,.15)">Operativa</div></div>
      <div class="db-stats">
        <div class="db-stat blue"><div class="db-stat-icon"></div><div><div class="db-stat-label">Usuarios</div><div class="db-stat-value">45,231</div></div></div>
        <div class="db-stat pink"><div class="db-stat-icon"></div><div><div class="db-stat-label">Alertas</div><div class="db-stat-value">2</div></div></div>
        <div class="db-stat purple"><div class="db-stat-icon"></div><div><div class="db-stat-label">Zonas Pendientes</div><div class="db-stat-value">${p.length}</div></div></div>
      </div>
      <div class="db-card"><div class="db-card-head"><div class="db-card-title">Solicitudes Pendientes</div></div><div class="db-card-body">
        ${p.length?p.map(ev=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:11px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;margin-bottom:7px;flex-wrap:wrap;gap:7px"><div style="display:flex;align-items:center;gap:9px"><img src="${ev.image}" style="width:36px;height:36px;border-radius:7px;object-fit:cover"/><div><div style="font-size:.82rem;font-weight:600;color:#0f172a">${ev.title}</div><div style="font-size:.7rem;color:#64748b">${ev.organizerId||'eber.higuera@gmail.com'}</div></div></div><button class="db-btn db-btn-primary" style="font-size:.73rem;padding:6px 12px" onclick="Zones.switchTab('review',document.getElementById('tab-review'))">Revisar →</button></div>`).join(''):`<div class="db-empty"><div class="db-empty-icon"></div><div class="db-empty-text">Sin solicitudes</div></div>`}
      </div></div>`;
  }

  /* ── Utilidades ── */
  function _fmt(d){return new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});}
  function _toast(msg,type){
    let t=document.getElementById('_tz');
    if(!t){t=document.createElement('div');t.id='_tz';t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(40px);padding:8px 20px;border-radius:999px;font-size:.8rem;font-weight:600;z-index:9999;transition:all .25s;opacity:0;white-space:nowrap;pointer-events:none';document.body.appendChild(t);}
    t.textContent=msg;t.style.background=type==='success'?'rgba(134,239,172,.15)':'rgba(248,113,113,.15)';t.style.border=`1px solid ${type==='success'?'rgba(134,239,172,.3)':'rgba(248,113,113,.3)'}`;t.style.color=type==='success'?'#86efac':'#f87171';
    requestAnimationFrame(()=>{t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';});
    setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(40px)';},3000);
  }

  return {
    init, openDashboard,
    getZones, getStatus, getMinPrice, getPending,
    openSidebar, closeSidebar, switchTab,
    toggleExpand, addZone, deleteZone, setField, submitZones,
    pickColor, pickColorNew, addNewZone,
    overridePrice, approveEvent, rejectEvent,
  };
})();
