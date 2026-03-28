/**
 * auth.js — Autenticación real con Supabase.
 * - Login / Registro de usuarios normales con Supabase Auth.
 * - Rol obtenido desde la tabla `administradores` (admin, organizer, treasurer).
 * - Se eliminó el registro de organizador: los interesados deben contactar al equipo.
 *
 * ARQUITECTURA:
 *   window.Auth se expone sincrónicamente con stubs seguros.
 *   El cliente de Supabase se carga de forma asíncrona (ESM CDN).
 *   El resto de los scripts (app.js, zones.js, etc.) pueden llamar a
 *   Auth.isLoggedIn() / Auth.session() de inmediato sin esperar.
 */

// ── Estado global - disponible de inmediato ────────────────────────────────
let _session = { name: '', role: '', email: '' };
let _sbReady  = false;   // true una vez que Supabase ha cargado
let _sb       = null;    // cliente Supabase

// ── Helpers de rol ─────────────────────────────────────────────────────────
function _normalizeRole(raw) {
  const r = (raw || '').toString().trim().toLowerCase();
  if (r === 'admin'     || r === 'administrador') return 'admin';
  if (r === 'organizer' || r === 'organizador')   return 'organizer';
  if (r === 'treasurer' || r === 'tesorero')      return 'treasurer';
  return 'user';
}

async function _fetchRole(sbUser) {
  if (!sbUser || !sbUser.email) return 'user';

  // Base de Datos: Solo confiamos en la tabla administradores
  // Ignoramos sesión caché u otras apps para máxima seguridad
  try {
    const { data, error } = await _sb
      .from('administradores')
      .select('rol')
      .eq('email', sbUser.email)
      .maybeSingle();

    if (!error && data?.rol) {
      return _normalizeRole(data.rol);
    }
  } catch (err) {
    console.warn("No se pudo consultar administradores en _fetchRole", err);
  }

  return 'user';
}

// ── Modal helpers ──────────────────────────────────────────────────────────
function openModal()  {
  document.getElementById('modal-overlay')?.classList.add('open');
  _goView('login');
}
function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
}
function closeOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ── View routing ───────────────────────────────────────────────────────────
function _goView(view) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  const stepsBar = document.getElementById('steps-bar');
  if (stepsBar) stepsBar.classList.add('hidden');
  body.innerHTML = VIEWS[view]?.() ?? '';

  setTimeout(() => {
    const lPass = document.getElementById('l-pass');
    const rPass = document.getElementById('r-pass');
    if (lPass) lPass.addEventListener('input', () => checkReqs('l-pass', 'lr'));
    if (rPass) rPass.addEventListener('input', () => checkReqs('r-pass', 'rr'));
  }, 0);
}

// ── View templates ─────────────────────────────────────────────────────────
const VIEWS = {

  login: () => `
    <h2 class="modal-title">Inicia Sesión</h2>
    <p class="modal-sub" style="margin-bottom:14px">Accede a los mejores eventos en Ticketazo.</p>

    <div class="field">
      <label>Correo Electrónico</label>
      <div class="field-wrap">
        <span class="field-icon">${Icons.mail}</span>
        <input type="email" id="l-email" placeholder="ejemplo@gmail.com" autocomplete="email"/>
      </div>
    </div>

    <div class="field">
      <label>Contraseña</label>
      <div class="field-wrap">
        <span class="field-icon">${Icons.lock}</span>
        <input type="password" id="l-pass" placeholder="••••••••"/>
        <button class="eye-btn" type="button"
          onmousedown="Auth.showPass('l-pass',true)"   onmouseup="Auth.showPass('l-pass',false)"
          onmouseleave="Auth.showPass('l-pass',false)" ontouchstart="Auth.showPass('l-pass',true)"
          ontouchend="Auth.showPass('l-pass',false)"></button>
      </div>
      <div class="reqs-box">${_reqsHtml('lr')}</div>
    </div>

    <div class="field-error hidden" id="login-err"><span></span></div>
    <button class="btn btn-primary w-full" style="margin-top:6px" id="btn-do-login"
      onclick="Auth.doLogin()">Ingresar</button>

    <div class="modal-divider">o</div>
    <p class="modal-switch">¿No tienes cuenta? <a onclick="Auth._goView('reg1')">Regístrate aquí</a></p>`,

  reg1: () => `
    <h2 class="modal-title">Crea tu Cuenta</h2>
    <p class="modal-sub" style="margin-bottom:14px">Únete a Ticketazo hoy.</p>

    <div class="field">
      <label>Nombre Completo</label>
      <div class="field-wrap">
        <span class="field-icon"></span>
        <input type="text" id="r-name" placeholder="Tu nombre completo" autocomplete="name"/>
      </div>
    </div>

    <div class="field">
      <label>Correo Electrónico</label>
      <div class="field-wrap">
        <span class="field-icon">${Icons.mail}</span>
        <input type="email" id="r-email" placeholder="ejemplo@gmail.com" autocomplete="email"/>
      </div>
    </div>

    <div class="field">
      <label>Contraseña</label>
      <div class="field-wrap">
        <span class="field-icon">${Icons.lock}</span>
        <input type="password" id="r-pass" placeholder="••••••••"/>
        <button class="eye-btn" type="button"
          onmousedown="Auth.showPass('r-pass',true)"   onmouseup="Auth.showPass('r-pass',false)"
          onmouseleave="Auth.showPass('r-pass',false)" ontouchstart="Auth.showPass('r-pass',true)"
          ontouchend="Auth.showPass('r-pass',false)"></button>
      </div>
      <div class="reqs-box">${_reqsHtml('rr')}</div>
    </div>

    <div class="field-error hidden" id="reg1-err"><span></span></div>
    <button class="btn btn-primary w-full" style="margin-top:6px" id="btn-do-register"
      onclick="Auth.reg1Next()">Crear Cuenta</button>

    <div style="margin-top:15px;padding:12px;background-color:rgba(255,255,255,0.05);border-radius:8px;text-align:center;font-size:0.85rem;">
      ¿Interesado en crear eventos o giras? <br/>
      Contáctanos: <a href="mailto:contacto@ticketazo.com" style="color:var(--color-pink)">contacto@ticketazo.com</a>
      o <strong>+52 55 1234 5678</strong>
    </div>

    <p class="modal-switch">¿Ya tienes cuenta? <a onclick="Auth._goView('login')">Inicia Sesión</a></p>`,

  regDone: () => `
    <h2 class="modal-title">¡Casi listo! </h2>
    <p class="modal-sub" style="margin-bottom:14px">
      Te enviamos un correo de verificación. Revisa tu bandeja de entrada
      (y carpeta de spam) y haz clic en el enlace para activar tu cuenta.
    </p>
    <button class="btn btn-primary w-full" onclick="Auth._goView('login')">Ir a Iniciar Sesión</button>`,
};

// ── Helpers de UI ──────────────────────────────────────────────────────────
function _reqsHtml(prefix) {
  const reqs = [
    { key: 'upper',   label: '1 Mayúscula'  },
    { key: 'lower',   label: '1 Minúscula'  },
    { key: 'number',  label: '1 Número'     },
    { key: 'special', label: '1 Especial'   },
    { key: 'length',  label: 'Mín. 8 chars' },
  ];
  return `<div class="reqs-box" style="margin-top:8px">` +
    reqs.map(r => `
      <div class="req-item" id="${prefix}-${r.key}">
        <div class="req-dot"></div>${r.label}
      </div>`).join('') +
    '</div>';
}

function _validPass(p) {
  return /[A-Z]/.test(p) && /[a-z]/.test(p) &&
         /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p) && p.length >= 8;
}

function checkReqs(inputId, prefix) {
  const p = document.getElementById(inputId)?.value || '';
  const rules = {
    upper:   /[A-Z]/,
    lower:   /[a-z]/,
    number:  /[0-9]/,
    special: /[^A-Za-z0-9]/,
    length:  { test: v => v.length >= 8 },
  };
  Object.entries(rules).forEach(([k, r]) => {
    document.getElementById(`${prefix}-${k}`)?.classList.toggle('met', r.test(p));
  });
}

function _showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  const span = el.querySelector('span');
  if (span) span.textContent = msg;
}
function _hideErr(id) { document.getElementById(id)?.classList.add('hidden'); }

function _setBusy(btnId, busy) {
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = busy;
}

// ── Sync sesión → navbar y paneles ────────────────────────────────────────
async function _applySession(sbSession) {
  if (!sbSession?.user) {
    _session = { name: '', role: '', email: '' };
    closeModal();
    if (typeof App !== 'undefined') App.updateNav();
    if (typeof Zones !== 'undefined') Zones.init();
    return;
  }

  const role = await _fetchRole(sbSession.user);
  const name = sbSession.user.user_metadata?.full_name ||
               sbSession.user.email?.split('@')[0] || 'Usuario';

  _session = { name, role, email: sbSession.user.email || '' };
  closeModal();
  if (typeof App !== 'undefined') App.updateNav();

  if (['admin', 'organizer', 'treasurer'].includes(role)) {
    if (typeof Zones !== 'undefined') {
      Zones.init();
      setTimeout(() => Zones.openDashboard(), 200);
    }
  } else {
    if (typeof Zones !== 'undefined') Zones.init();
  }

  if (document.getElementById('page-profile')?.classList.contains('active')) {
    if (typeof Profile !== 'undefined') Profile.render();
  }
}

// ── Acciones de autenticación ──────────────────────────────────────────────
async function doLogin() {
  if (!_sbReady) { _showErr('login-err', 'Conectando con el servidor, intenta de nuevo.'); return; }

  const email = document.getElementById('l-email')?.value.trim();
  const pass  = document.getElementById('l-pass')?.value;

  if (!email) { _showErr('login-err', 'Ingresa tu correo');     return; }
  if (!pass)  { _showErr('login-err', 'Ingresa tu contraseña'); return; }
  _hideErr('login-err');
  _setBusy('btn-do-login', true);

  let data, error;
  try {
    ({ data, error } = await _sb.auth.signInWithPassword({ email, password: pass }));
  } catch (netErr) {
    _showErr('login-err', 'Sin conexión. Verifica tu internet e intenta de nuevo.');
    _setBusy('btn-do-login', false);
    return;
  }

  if (error) {
    const code = (error.code || '').toLowerCase();
    const msg2 = (error.message || '').toLowerCase();
    let msg;
    if (code === 'email_not_confirmed' || (msg2.includes('email') && msg2.includes('confirm'))) {
      msg = 'Verifica tu correo antes de iniciar sesión. Revisa tu bandeja de entrada (y spam).';
    } else if (code === 'invalid_credentials' || msg2.includes('invalid login') || error.status === 400) {
      msg = 'Correo o contraseña incorrectos.';
    } else {
      msg = error.message || 'No se pudo iniciar sesión.';
    }
    _showErr('login-err', msg);
    _setBusy('btn-do-login', false);
    return;
  }

  // Doble verificación local por si Supabase no bloqueó antes
  const confirmed = data?.user?.email_confirmed_at ||
                    data?.user?.user_metadata?.email_confirmed_at;
  if (!confirmed) {
    _showErr('login-err', 'Verifica tu correo antes de iniciar sesión.');
    await _sb.auth.signOut();
    _setBusy('btn-do-login', false);
    return;
  }

  _setBusy('btn-do-login', false);
  await _applySession(data.session);
}

async function reg1Next() {
  if (!_sbReady) { _showErr('reg1-err', 'Conectando con el servidor, intenta de nuevo.'); return; }

  const name  = document.getElementById('r-name')?.value.trim();
  const email = document.getElementById('r-email')?.value.trim();
  const pass  = document.getElementById('r-pass')?.value;

  if (!name)             { _showErr('reg1-err', 'Ingresa tu nombre completo');          return; }
  if (!email)            { _showErr('reg1-err', 'Ingresa tu correo');                   return; }
  if (!_validPass(pass)) { _showErr('reg1-err', 'La contraseña no cumple los requisitos'); return; }
  _hideErr('reg1-err');
  _setBusy('btn-do-register', true);

  // Nota: no consultamos `administradores` aquí porque la política RLS
  // puede bloquear la consulta desde el frontend.
  // El rol correcto se asigna en _fetchRole() al iniciar sesión.

  let data, error;
  try {
    ({ data, error } = await _sb.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        data: { full_name: name },
      },
    }));
  } catch (netErr) {
    _showErr('reg1-err', 'Sin conexión. Verifica tu internet e intenta de nuevo.');
    _setBusy('btn-do-register', false);
    return;
  }

  if (error) {
    const msg2 = (error.message || '').toLowerCase();
    let msg = error.message || 'No se pudo crear la cuenta.';
    if (msg2.includes('already registered') || msg2.includes('user already registered')) {
      msg = 'Ese correo ya existe. Intenta iniciar sesión.';
    } else if (msg2.includes('weak password') || msg2.includes('password')) {
      msg = 'Contraseña demasiado débil. Usa al menos 8 caracteres con mayúsculas, número y especial.';
    }
    _showErr('reg1-err', msg);
    _setBusy('btn-do-register', false);
    return;
  }

  _setBusy('btn-do-register', false);

  // Si el proyecto no requiere confirmación de email → sesión directa
  if (data?.user?.email_confirmed_at) {
    await _applySession(data.session);
  } else {
    _goView('regDone');
  }
}

async function logout() {
  try {
    if (_sbReady) await _sb.auth.signOut();
  } catch (err) {
    console.warn("Error enviando signOut al servidor (posible 429 o red):", err);
  } finally {
    // Siempre destrozamos la sesión local para que la UI se restaure
    _session = { name: '', role: '', email: '' };
    if (typeof App !== 'undefined') {
      App.updateNav();
      App.navigate('home');
    }
    // Si estuviéramos en dashboard, reseteamos la vista
    const isMobileDash = document.getElementById('db-sidebar')?.classList.contains('open');
    if (isMobileDash && typeof Zones !== 'undefined') Zones.closeSidebar();
  }
}

// ── Utilidades ─────────────────────────────────────────────────────────────
function showPass(id, show) {
  const el = document.getElementById(id);
  if (el) el.type = show ? 'text' : 'password';
}
function fmtCard(el) {
  el.value = el.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExp(el) {
  const c = el.value.replace(/\D/g, '').slice(0, 4);
  el.value = c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c;
}

// ── API pública — expuesta sincrónicamente ─────────────────────────────────
function isLoggedIn() { return !!_session.name; }
function session()    { return _session; }

// Stubs que otros módulos pueden llamar de inmediato
window.Auth = {
  openModal, closeModal, closeOutside,
  _goView,
  doLogin, reg1Next, logout,
  isLoggedIn, session,
  showPass, fmtCard, fmtExp, checkReqs,
};

// ── Carga asíncrona de Supabase (no bloquea el resto de la página) ─────────
(async () => {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    _sb = createClient(
      'https://urumaghjardjgdveblxa.supabase.co',
      'sb_publishable_hpITakDbpUWFx3Tv9AJg-A_MnyJOtd0',
      {
        auth: {
          persistSession:     true,
          autoRefreshToken:   true,
          detectSessionInUrl: true,
        },
      }
    );

    _sbReady = true;

    // Listener de cambios de sesión
    _sb.auth.onAuthStateChange(async (_event, sbSession) => {
      await _applySession(sbSession);
    });

    // Sesión guardada en localStorage (regresa el usuario sin volver a hacer login)
    const { data: { session: existing } } = await _sb.auth.getSession();
    if (existing) await _applySession(existing);

  } catch (err) {
    console.error('[Auth] Error al cargar Supabase:', err);
  }
})();
