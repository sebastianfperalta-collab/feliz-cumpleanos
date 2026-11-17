import * as THREE from 'three';
import { crearMundo, SENDERO, rnd } from './mundo.js';
import { crearCama, crearErizo, crearPastel, crearVelas, crearGolosina, BUENAS, crearTronco, crearRoca, crearTocon, crearArbusto, crearFarol, texBrillo } from './erizo.js';
import { audio, iniciarAudio, contexto } from './audio.js';

const cfg = window.DEMO_CONFIG;
cfg.retos = Object.assign({ erizosMeta: 8, largoSendero: 64, golosinasMeta: 20, segundosGolosinas: 45 }, cfg.retos || {});
const Q = new URLSearchParams(location.search);
const RAPIDO = Q.get('rapido') === '1';
const $ = (s) => document.querySelector(s);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = THREE.MathUtils.clamp;
const suave = (k) => k * k * (3 - 2 * k);

// ───────── Render ─────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
let PR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#vr').appendChild(renderer.domElement);
const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const mundo = crearMundo(escena); mundo.pr(PR);
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

const erizo = crearErizo(); escena.add(erizo);
const enrollar = (si) => erizo.userData.enrollar(si);
const pastel = crearPastel(); pastel.grupo.visible = false; escena.add(pastel.grupo);
const tocon = crearTocon(); tocon.visible = false; escena.add(tocon);
const cama = crearCama(); escena.add(cama);
let velas = null;

// cámara con suavizado
const cam = { pos: V(0, 1.7, 6.5), look: V(0, 0.6, 0), p: V(0, 1.7, 6.5), l: V(0, 0.6, 0), k: 3, sac: 0, orbita: true };
function enfocar(pos, look, inst = false, k = 3) { cam.pos.copy(pos); cam.look.copy(look); cam.k = k; if (inst) { cam.p.copy(pos); cam.l.copy(look); } }
const anchoVisible = (dist) => dist * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.aspect;
const _v = new THREE.Vector3();
function pantalla(obj, dy = 0) { obj.getWorldPosition(_v); _v.y += dy; _v.project(camara); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight }; }

// chispas (estallidos de luz)
const chispas = (() => {
  const N = 400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), vida = new Float32Array(N), base = new Float32Array(N * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.13, map: texBrillo(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; escena.add(m);
  let i0 = 0; const c = new THREE.Color();
  return {
    emitir(p, n = 30, hex = 0xffd27a, f = 2.2) {
      for (let k = 0; k < n; k++) {
        const i = i0; i0 = (i0 + 1) % N;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        const a = Math.random() * 6.28, b = Math.random() * 2 - 1, r = Math.sqrt(1 - b * b), s = f * (0.4 + Math.random() * 0.6);
        vel[i * 3] = Math.cos(a) * r * s; vel[i * 3 + 1] = Math.abs(b) * s + 0.6; vel[i * 3 + 2] = Math.sin(a) * r * s;
        c.setHex(Array.isArray(hex) ? hex[k % hex.length] : hex); base[i * 3] = c.r; base[i * 3 + 1] = c.g; base[i * 3 + 2] = c.b;
        vida[i] = 1;
      }
    },
    update(dt) {
      for (let i = 0; i < N; i++) {
        if (vida[i] <= 0) { col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
        vida[i] -= dt * 0.8;
        vel[i * 3 + 1] -= dt * 1.2; for (let k = 0; k < 3; k++) { vel[i * 3 + k] *= 1 - dt * 1.2; pos[i * 3 + k] += vel[i * 3 + k] * dt; }
        const l = Math.max(0, vida[i]); col[i * 3] = base[i * 3] * l; col[i * 3 + 1] = base[i * 3 + 1] * l; col[i * 3 + 2] = base[i * 3 + 2] * l;
      }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    }
  };
})();

// ───────── Entrada ─────────
const incl = { g: 0, b: 0, ok: false, g0: 0 };
addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; incl.ok = true; incl.g = e.gamma; incl.b = e.beta; });
async function pedirMovimiento() { try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) { } }
const calibrar = () => { incl.g0 = incl.g; };
const inclX = () => (incl.ok ? clamp((incl.g - incl.g0) / 20, -1, 1) : 0);
const teclas = {};
addEventListener('keydown', (e) => { teclas[e.key] = true; });
addEventListener('keyup', (e) => { teclas[e.key] = false; });
const teclaX = () => (teclas.ArrowLeft || teclas.a ? -1 : 0) + (teclas.ArrowRight || teclas.d ? 1 : 0);
const ptr = { abajo: false, x: 0, y: 0 };
let fase = null;
const cv = renderer.domElement;
cv.addEventListener('pointerdown', (e) => { ptr.abajo = true; ptr.x = e.clientX; ptr.y = e.clientY; fase?.abajo?.(e.clientX, e.clientY); });
addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; if (ptr.abajo) fase?.mover?.(e.clientX, e.clientY); });
const soltar = () => { ptr.abajo = false; fase?.arriba?.(); };
addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);

// ───────── Interfaz ─────────
const mostrar = (el, on = true) => el.classList.toggle('oculto', !on);
let toastT = 0;
function toast(t, ms = 1800) { const el = $('#toast'); el.textContent = t; mostrar(el); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; clearTimeout(toastT); toastT = setTimeout(() => mostrar(el, false), ms); }
function hud(etapa, info) { if (etapa != null) $('#hud-etapa').textContent = etapa; if (info != null) $('#hud-info').textContent = info; }
function progreso(n) { document.querySelectorAll('.progreso i').forEach((el, i) => { el.classList.toggle('hecho', i < n); el.classList.toggle('actual', i === n); }); }
function destello() { const d = $('#destello'); d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 60); }
let comboT = 0;
function combo(n) { const el = $('#combo'); if (n < 2) { mostrar(el, false); return; } el.textContent = `x${n} combo`; mostrar(el); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; clearTimeout(comboT); comboT = setTimeout(() => mostrar(el, false), 900); }

function tarjeta({ sobre = '', titulo = '', html = '', botones = [['ok', '¡Vamos!']] }) {
  return new Promise((res) => {
    $('#tarjeta-sobre').textContent = sobre; $('#tarjeta-titulo').textContent = titulo; $('#tarjeta-texto').innerHTML = html;
    const cont = $('#tarjeta-botones'); cont.innerHTML = '';
    botones.forEach(([id, txt, cls]) => {
      const b = document.createElement('button'); b.className = 'btn ' + (cls || 'primario'); b.textContent = txt;
      b.onclick = () => { audio.clic(); mostrar($('#tarjeta'), false); res(id); };
      cont.appendChild(b);
    });
    mostrar($('#tarjeta'));
  });
}
function transicion(texto, cambio) {
  return new Promise(async (res) => {
    const t = $('#transicion'); $('#transicion-texto').textContent = texto || '';
    mostrar(t); void t.offsetWidth; t.classList.add('on');
    await espera(550); cambio?.(); await espera(texto ? 900 : 250);
    t.classList.remove('on'); await espera(500); mostrar(t, false); res();
  });
}
function desbloquear(i) {
  return new Promise((res) => {
    const f = (cfg.recuerdos || [])[i]; if (!f) return res();
    $('#foto-sobre').textContent = `Mensaje desbloqueado · ${i + 1} de ${cfg.recuerdos.length}`;
    $('#foto-texto').textContent = f.texto || '';
    audio.foto(); mostrar($('#foto'));
    $('#foto-btn').onclick = () => { audio.clic(); mostrar($('#foto'), false); res(); };
  });
}

// ───────── Reto 1: el bosque ─────────
async function fase1() {
  const meta = RAPIDO ? 4 : cfg.retos.erizosMeta;
  const vertical = camara.aspect < 0.8, n = vertical ? 5 : 6;
  const escondites = new THREE.Group(), spots = [];
  await transicion('Reto 1 · El bosque', () => {
    cam.orbita = false; progreso(0); mostrar($('#hud'));
    enfocar(V(0, 1.55, 6.4), V(0, 0.7, -1.2), true);
    const hw = Math.min(anchoVisible(8.2) * 0.8, 4.2);
    for (let i = 0; i < n; i++) {
      const x = -hw + 2 * hw * (i / (n - 1)), z = -0.6 - (i % 2 ? 1.7 : 0.3);
      const a = crearArbusto(vertical ? 0.95 : 1.1); a.position.set(x, 0, z); escondites.add(a); spots.push(V(x, 0, z));
    }
    escena.add(escondites);
    erizo.visible = false; erizo.scale.setScalar(vertical ? 0.85 : 1); enrollar(false); mundo.calida.position.set(0, 2.4, -2.5);
    hud('Reto 1 · El bosque', `🦔 0/${meta}`);
  });
  await tarjeta({ sobre: 'Reto 1 de 4', titulo: 'El bosque', html: `Tu erizo está jugando a esconderse entre los arbustos.<br><b>Tócalo</b> cada vez que se asome, antes de que se enrolle y desaparezca.<br><br>Atrápalo <b>${meta} veces</b>.` });

  return new Promise((resolve) => {
    let st = 'espera', tt = 0, pausa = 0.6, idx = -1, atrapados = 0, dur = 1.9;
    const pose = (s, dz, dy = 0) => { erizo.position.set(s.x, dy, s.z + dz); erizo.lookAt(cam.p.x, dy, cam.p.z); };
    fase = {
      update(dt, t) {
        tt += dt; const s = spots[idx] || spots[0];
        if (st === 'espera') { erizo.visible = false; if (tt > pausa) { let k; do k = Math.floor(Math.random() * spots.length); while (k === idx); idx = k; st = 'sale'; tt = 0; erizo.visible = true; enrollar(false); audio.asoma(); } }
        else if (st === 'sale') { const k = Math.min(1, tt / 0.25); pose(s, -0.4 + 1.0 * suave(k)); if (k >= 1) { st = 'visible'; tt = 0; } }
        else if (st === 'visible') { pose(s, 0.6, Math.abs(Math.sin(t * 9)) * 0.05); if (tt > dur) { st = 'huye'; tt = 0; enrollar(true); audio.huye(); } }
        else if (st === 'feliz') { const k = Math.min(1, tt / 0.55); pose(s, 0.6, Math.sin(k * Math.PI) * 0.55); erizo.rotateY(k * Math.PI * 2); if (k >= 1) { if (atrapados >= meta) terminar(); else { st = 'huye'; tt = 0; } } }
        else if (st === 'huye') { const k = Math.min(1, tt / 0.28); pose(s, 0.6 - 1.0 * suave(k)); if (k >= 1) { st = 'espera'; tt = 0; pausa = 0.35 + Math.random() * 0.7; } }
      },
      abajo(x, y) {
        if (st !== 'sale' && st !== 'visible') return;
        const p = pantalla(erizo, 0.35);
        if (Math.hypot(p.x - x, p.y - y) > 90) return;
        atrapados++; st = 'feliz'; tt = 0; dur = Math.max(0.85, dur - 0.13);
        chispas.emitir(erizo.position.clone().add(V(0, 0.5, 0)), 36, [0xffd27a, 0x7ff6ff, 0xffffff]);
        audio.atrapa(atrapados); hud(null, `🦔 ${atrapados}/${meta}`);
      }
    };
    async function terminar() {
      fase = null; erizo.visible = true; enrollar(false); audio.exito();
      chispas.emitir(erizo.position.clone().add(V(0, 0.6, 0)), 80, [0xffd27a, 0x7ff6ff, 0xff8fb1], 3);
      toast('¡Lo encontraste!'); await espera(1400);
      escena.remove(escondites); erizo.scale.setScalar(1); resolve();
    }
  });
}


// ───────── Recorrido por el bosque (entre retos) ─────────
function crearLetrero(texto) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#5a3d27'; x.beginPath(); x.roundRect(8, 8, 496, 240, 26); x.fill();
  x.strokeStyle = '#c9a36e'; x.lineWidth = 8; x.beginPath(); x.roundRect(18, 18, 476, 220, 20); x.stroke();
  x.fillStyle = '#ffe9b8'; x.textAlign = 'center'; x.font = '600 46px Fredoka, sans-serif';
  const ws = texto.split(' '), ls = []; let l = '';
  for (const w of ws) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > 400 && l) { ls.push(l); l = w; } else l = t; }
  if (l) ls.push(l);
  const y0 = 128 - (ls.length - 1) * 30 + 16; ls.forEach((t, i) => x.fillText(t, 256, y0 + i * 60));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6), new THREE.MeshLambertMaterial({ color: 0x4a3426 })); post.position.y = 0.8; g.add(post);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), new THREE.MeshBasicMaterial({ map: tex, color: 0xe6e6e6 })); board.position.set(0, 1.55, 0.09); g.add(board);
  return g;
}
async function recorrido(n) {
  const R = cfg.recorrido || {};
  const nombres = R.nombres || ['Camino de las luciérnagas', 'Bosque de los hongos', 'Hacia el claro del pastel'];
  const frases = (R.letreros || [
    ['Sigue las luces: el bosque te conoce', 'Cada paso suma una sonrisa'],
    ['Los hongos brillan para darte la bienvenida', 'Lo bueno llega caminando despacio'],
    ['Ya huele a pastel...', 'El claro está al final del sendero']
  ])[n - 1] || [];
  const dur = RAPIDO ? 6 : (cfg.retos.segundosRecorrido || 14), vel = 2.6, z0 = 4, z1 = z0 - vel * dur;
  const px = (z) => -Math.sin(z * 0.3) * 0.2;
  const grupo = new THREE.Group(), orbes = [], tex = texBrillo();
  for (let z = z0 - 6; z > z1 + 2; z -= 2.6) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: Math.random() < 0.7 ? 0xffd27a : 0x7ff6ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(0.5); const o = { s, z, x: px(z) + (Math.random() - 0.5) * 3.2, y: 0.5 + Math.random() * 1.1, f: Math.random() * 6, ok: false };
    s.position.set(o.x, o.y, z); grupo.add(s); orbes.push(o);
  }
  frases.forEach((t, i) => { const g = crearLetrero(t), z = z0 - (i + 1) * (vel * dur) / (frases.length + 1), lado = i % 2 ? 1 : -1; g.position.set(px(z) + lado * 2.1, 0, z); g.rotation.y = -lado * 0.5; grupo.add(g); });
  await transicion(`Recorrido · ${nombres[n - 1] || ''}`, () => {
    escena.add(grupo); progreso(n); mostrar($('#hud')); cam.orbita = false;
    pastel.grupo.visible = false; tocon.visible = false; if (velas) velas.grupo.visible = false;
    erizo.visible = true; enrollar(false); erizo.scale.setScalar(1); erizo.userData.gorro.visible = false; erizo.position.set(px(z0), 0, z0); erizo.rotation.set(0, Math.PI, 0);
    enfocar(V(px(z0) * 0.45, 2.5, z0 + 5), V(px(z0), 0.4, z0 - 5), true, 6);
    hud('Recorrido', '✨ 0');
  });
  toast('Toca las luces que flotan por el camino', 2600);
  return new Promise((resolve) => {
    let z = z0, rec = 0, salto = 0;
    fase = {
      update(dt, t) {
        const v = vel;
        z -= v * dt; salto = Math.max(0, salto - dt * 2.2);
        const sal = Math.sin(salto * Math.PI) * 0.45;
        erizo.position.set(px(z), Math.abs(Math.sin(t * 9)) * 0.045 * (v / vel) + sal, z);
        erizo.rotation.set(0, Math.PI, Math.sin(t * 9) * 0.05);
        enfocar(V(px(z) * 0.45, 2.5, z + 5), V(px(z), 0.4, z - 5), false, 6);
        mundo.calida.position.set(px(z), 2.4, z - 1.8);
        for (const o of orbes) if (!o.ok) o.s.position.y = o.y + Math.sin(t * 1.8 + o.f) * 0.12;
        if (z <= z1 + 0.3) terminar();
      },
      abajo(x, y) {
        let mejor = null, md = 80;
        for (const o of orbes) if (!o.ok) { const p = pantalla(o.s); const d = Math.hypot(p.x - x, p.y - y); if (d < md) { md = d; mejor = o; } }
        if (mejor) { mejor.ok = true; mejor.s.visible = false; rec++; audio.luz(); chispas.emitir(mejor.s.position, 18, [0xffd27a, 0x7ff6ff, 0xffffff], 1.6); hud(null, `✨ ${rec}`); return; }
        const pe = pantalla(erizo, 0.35);
        if (Math.hypot(pe.x - x, pe.y - y) < 90 && salto <= 0) { salto = 1; audio.asoma(); chispas.emitir(erizo.position.clone().add(V(0, 0.6, 0)), 10, 0xff8fb1, 1.2); }
      }
    };
    async function terminar() {
      fase = null; audio.chime();
      chispas.emitir(erizo.position.clone().add(V(0, 0.7, 0)), 40, [0xffd27a, 0x7ff6ff, 0xff8fb1], 2.2);
      toast(rec ? `Recogiste ${rec} ${rec === 1 ? 'luz' : 'luces'}` : 'Seguimos el camino', 1000); await espera(700);
      escena.remove(grupo); resolve();
    }
  });
}

// ───────── Reto 2: la bolita ─────────
async function fase2() {
  const z0 = SENDERO.z0, largo = RAPIDO ? 32 : cfg.retos.largoSendero, z1 = z0 - largo, AN = SENDERO.ancho, R = 0.36;
  const grupo = new THREE.Group(), obst = [], luces = [];
  const tex = texBrillo();
  for (let z = z0 - 9; z > z1 + 4; z -= 5.4 + Math.random() * 1.6) {
    if (Math.random() < 0.55) {
      const lado = Math.random() < 0.5 ? -1 : 1, l = 2.3 + Math.random() * 0.6;
      const x0 = lado < 0 ? -AN - 0.3 : AN + 0.3 - l, x1 = x0 + l;
      const m = crearTronco(l); m.position.set((x0 + x1) / 2, 0.24, z); grupo.add(m); obst.push({ t: 'tronco', z, x0, x1 });
    } else {
      const xa = (Math.random() - 0.5) * 2 * (AN - 0.6), r1 = 0.38 + Math.random() * 0.15;
      const a = crearRoca(r1); a.position.set(xa, r1 * 0.45, z); grupo.add(a); obst.push({ t: 'roca', z, x: xa, r: r1 });
      if (Math.random() < 0.6) { let xb = xa + (xa > 0 ? -1 : 1) * (2.0 + Math.random() * 0.4); xb = clamp(xb, -AN + 0.4, AN - 0.4); const r2 = 0.3 + Math.random() * 0.12; const b = crearRoca(r2); b.position.set(xb, r2 * 0.45, z - 1.2); grupo.add(b); obst.push({ t: 'roca', z: z - 1.2, x: xb, r: r2 }); }
    }
  }
  for (let z = z0 - 4; z > z1 + 2; z -= 2.6) {
    const x = (Math.random() - 0.5) * 2 * (AN - 0.6);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffd27a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(0.55); s.position.set(x, 0.45, z); grupo.add(s); luces.push({ s, x, z, ok: false });
  }
  const cps = []; for (let z = z0 - 16; z > z1 + 4; z -= 16) cps.push(z);
  for (const z of [...cps, z1]) for (const sx of [-1, 1]) { const f = crearFarol(); f.position.set(sx * (AN + 0.5), 0, z); grupo.add(f); }
  const arco = new THREE.Group();
  for (let i = 0; i <= 12; i++) { const u = i / 12, x = -AN - 0.5 + u * (2 * AN + 1); const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: i % 2 ? 0x7ff6ff : 0xffd27a, blending: THREE.AdditiveBlending, depthWrite: false })); b.scale.setScalar(0.35); b.position.set(x, 1.38 + Math.sin(u * Math.PI) * 0.5, z1); arco.add(b); }
  grupo.add(arco);

  await transicion('Reto 2 · La bolita', () => {
    escena.add(grupo); progreso(1); mostrar($('#hud')); cam.orbita = false;
    erizo.visible = true; enrollar(true); erizo.rotation.set(0, Math.PI, 0); erizo.position.set(0, 0, z0);
    enfocar(V(0, 2.9, z0 + 6.2), V(0, 0.3, z0 - 5), true, 6);
    hud('Reto 2 · La bolita', `✨ 0`);
  });
  const conInc = incl.ok;
  await tarjeta({
    sobre: 'Reto 2 de 4', titulo: 'La bolita', html: `Algo asustó a tu erizo y se enrolló. Llévalo rodando hasta la meta esquivando troncos y piedras.<br><br>${conInc ? '<b>Inclina el celular</b> a los lados para guiarlo. También puedes ' : ''}<b>mantener presionado</b> el lado izquierdo o derecho de la pantalla.<br><br>Si chocas, vuelves al último farol. Recoge las luces que encuentres.`
  });
  calibrar();
  return new Promise((resolve) => {
    let x = 0, z = z0, cp = z0, ci = 0, inv = 0, recog = 0;
    const vel = RAPIDO ? 9 : 5.4;
    const bola = erizo.userData.bola;
    fase = {
      update(dt) {
        let s = teclaX();
        if (!s && ptr.abajo) s = clamp((ptr.x - innerWidth / 2) / (innerWidth * 0.25), -1, 1);
        if (!s) s = inclX();
        x = clamp(x + s * 5 * dt, -AN + R, AN - R);
        z -= vel * dt; inv -= dt;
        bola.rotation.x += vel * dt / R; bola.rotation.z = -s * 0.25;
        if (inv <= 0) for (const o of obst) {
          const hit = o.t === 'tronco' ? (Math.abs(z - o.z) < 0.24 + R * 0.8 && x > o.x0 - R * 0.6 && x < o.x1 + R * 0.6) : Math.hypot(x - o.x, z - o.z) < o.r * 0.85 + R * 0.8;
          if (hit) { choque(); break; }
        }
        if (ci < cps.length && z < cps[ci]) { cp = cps[ci]; ci++; toast('Farol alcanzado: punto de control'); audio.chime(); }
        for (const l of luces) if (!l.ok && Math.abs(l.z - z) < 0.5 && Math.abs(l.x - x) < 0.6) { l.ok = true; l.s.visible = false; recog++; audio.luz(); chispas.emitir(l.s.position, 14, 0xffd27a, 1.5); hud(null, `✨ ${recog}`); }
        erizo.position.set(x, inv > 0 ? Math.abs(Math.sin(inv * 12)) * 0.15 : 0, z);
        mundo.calida.position.set(x, 2.4, z - 1.8);
        enfocar(V(x * 0.45, 2.9, z + 6.2), V(x * 0.6, 0.3, z - 5), false, 6);
        if (z <= z1) terminar();
      }
    };
    function choque() {
      inv = 1.2; audio.golpe(); cam.sac = 0.35; destello();
      toast('¡Ups! De vuelta al farol'); z = cp; x = 0;
      enfocar(V(0, 2.9, z + 6.2), V(0, 0.3, z - 5), true, 6);
    }
    async function terminar() {
      fase = null; audio.exito(); enrollar(false); erizo.rotation.set(0, 0, 0); erizo.lookAt(cam.p.x, 0, cam.p.z);
      chispas.emitir(erizo.position.clone().add(V(0, 0.6, 0)), 90, [0xffd27a, 0x7ff6ff, 0xff8fb1], 3);
      toast('¡Llegaste a la meta!'); await espera(1500);
      escena.remove(grupo); resolve(recog);
    }
  });
}

// ───────── Reto 3: lluvia de dulces ─────────
async function fase3() {
  const meta = RAPIDO ? 10 : cfg.retos.golosinasMeta, T = RAPIDO ? 30 : cfg.retos.segundosGolosinas;
  const E = 0.72; // escala del pastel
  let lim = 1;
  const preparar = () => {
    progreso(2); mostrar($('#hud')); cam.orbita = false; mundo.calida.position.set(0, 2.4, -2.5); pastel.grupo.visible = true; pastel.grupo.scale.setScalar(E); pastel.grupo.position.set(0, 0.42, 0.4); pastel.mostrar(0);
    if (velas) velas.grupo.visible = false;
    tocon.visible = false;
    enfocar(V(0, 2.5, 7.4), V(0, 2.25, 0), true);
    lim = Math.max(0.7, anchoVisible(7.0) - 0.62);
    erizo.visible = true; enrollar(false); erizo.scale.setScalar(0.8); erizo.position.set(-lim + 0.1, 0, -1.6); erizo.lookAt(0, 0, 7);
  };
  await transicion('Reto 3 · La lluvia de dulces', preparar);
  await tarjeta({ sobre: 'Reto 3 de 4', titulo: 'La lluvia de dulces', html: `Para encontrar el pastel hay que armarlo. Mueve el plato y <b>atrapa los dulces</b>: cada una suma al pastel.<br><br>Arrastra el dedo${incl.ok ? ' o inclina el celular' : ''}. <b>No atrapes las piedras grises</b>: te quitan 3 segundos.<br><br>Necesitas <b>${meta}</b> en ${T} segundos.` });

  while (true) {
    const res = await ronda();
    if (res.ok) break;
    await tarjeta({ sobre: 'Reto 3 de 4', titulo: '¡Casi!', html: `Atrapaste <b>${res.n} de ${meta}</b>. El erizo cree en ti: inténtalo otra vez.`, botones: [['ok', 'Intentar de nuevo']] });
    preparar();
  }
  erizo.scale.setScalar(1);

  function ronda() {
    calibrar();
    return new Promise((resolve) => {
      let px = 0, n = 0, c = 0, tiempo = T, spawn = 0.5, sacP = 0, arrastre = false;
      const items = [];
      const umbrales = [0.2, 0.4, 0.6, 0.8, 1].map((u) => Math.round(meta * u));
      const info = () => hud('Reto 3 · Dulces', `🎂 ${n}/${meta} · ⏱ ${Math.ceil(Math.max(0, tiempo))}`);
      info();
      fase = {
        abajo(x) { arrastre = true; this.mover(x); },
        mover(x) { if (arrastre) px = clamp((x / innerWidth * 2 - 1) * anchoVisible(7.0), -lim, lim); },
        arriba() { arrastre = false; },
        update(dt, t) {
          tiempo -= dt;
          if (!arrastre) { const s = teclaX() || inclX(); px = clamp(px + s * 4.5 * dt, -lim, lim); }
          sacP = Math.max(0, sacP - dt);
          pastel.grupo.position.x += (px - pastel.grupo.position.x) * Math.min(1, dt * 18);
          pastel.grupo.position.y = 0.42 + Math.sin(sacP * 40) * sacP * 0.3;
          spawn -= dt;
          if (spawn <= 0) {
            spawn = Math.max(0.42, 0.85 - n * 0.02) * (0.8 + Math.random() * 0.4);
            const malo = Math.random() < 0.28, tipo = malo ? 'piedra' : BUENAS[Math.floor(Math.random() * BUENAS.length)];
            const m = crearGolosina(tipo); m.position.set((Math.random() * 2 - 1) * (lim + 0.2), 5.8, 0.4);
            m.rotation.set(Math.random() * 3, Math.random() * 3, 0); escena.add(m);
            items.push({ m, malo, vy: 1.7 + Math.random() * 0.7 + n * 0.04, rx: (Math.random() - 0.5) * 4, ry: (Math.random() - 0.5) * 4 });
          }
          const topY = pastel.grupo.position.y + pastel.altura() * E;
          for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i]; it.m.position.y -= it.vy * dt; it.m.rotation.x += it.rx * dt; it.m.rotation.y += it.ry * dt;
            const y = it.m.position.y, dx = Math.abs(it.m.position.x - pastel.grupo.position.x);
            if (y < topY + 0.15 && y > topY - 0.3 && dx < 0.6) {
              escena.remove(it.m); items.splice(i, 1);
              if (it.malo) { c = 0; tiempo -= 3; sacP = 0.35; audio.mal(); toast('¡Piedra! −3 s', 900); destello(); combo(0); }
              else {
                n++; c++; audio.bueno(c); combo(c);
                chispas.emitir(it.m.position, 16, [0xffd27a, 0xff8fb1, 0x7ff6ff], 1.4);
                const nivel = umbrales.filter((u) => n >= u).length;
                if (nivel > pastel.nivel) { pastel.mostrar(nivel); audio.capa(); erizo.position.y = 0.3; }
              }
              info();
            } else if (y < -0.4) { escena.remove(it.m); items.splice(i, 1); if (!it.malo) { c = 0; } }
          }
          erizo.position.y = Math.max(0, erizo.position.y - dt * 1.2);
          if (Math.floor(t * 4) % 2 === 0) info();
          if (n >= meta) fin(true); else if (tiempo <= 0) fin(false);
        }
      };
      async function fin(ok) {
        fase = null; items.forEach((it) => escena.remove(it.m)); combo(0);
        if (ok) {
          pastel.mostrar(5); audio.exito();
          chispas.emitir(pastel.grupo.position.clone().add(V(0, 0.6, 0)), 100, [0xffd27a, 0xff8fb1, 0x7ff6ff], 3);
          toast('¡Pastel listo!'); await espera(1600);
        }
        resolve({ ok, n });
      }
    });
  }
}

// ───────── Reto 4: las velas ─────────
let micStream = null;
async function abrirMicrofono() {
  const ctx = iniciarAudio(); if (!ctx || !navigator.mediaDevices?.getUserMedia) return null;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = ctx.createMediaStreamSource(micStream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    return an;
  } catch (e) { return null; }
}
async function fase4() {
  const n = cfg.edad || 32;
  await transicion('Reto 4 · Las velas', () => {
    progreso(3); mostrar($('#hud')); cam.orbita = false;
    tocon.visible = true; tocon.position.set(0, 0, 0);
    pastel.grupo.visible = true; pastel.grupo.scale.setScalar(1); pastel.grupo.position.set(0, 0.6, 0); pastel.mostrar(5);
    if (!velas) { velas = crearVelas(pastel, n); pastel.grupo.add(velas.grupo); }
    velas.grupo.visible = true; velas.llamas.forEach((l) => { l.on = true; l.s.visible = true; if (l.g) l.g.visible = true; });
    erizo.visible = true; enrollar(false); erizo.scale.setScalar(0.72); erizo.position.set(0.78, 0, 1.05); erizo.lookAt(0, 0, 6); erizo.userData.gorro.visible = true;
    const d = clamp(1.5 / (Math.tan(THREE.MathUtils.degToRad(27.5)) * camara.aspect), 2.8, 6.8);
    enfocar(V(0, 1.25 + d * 0.22, d), V(0.15, 1.05, 0), true);
    mundo.calida.position.set(0, 1.9, 0.6);
    hud('Reto 4 · Las velas', `🕯️ ${n} encendidas`);
  });
  const modo = await tarjeta({ sobre: 'Reto 4 de 4', titulo: `Las ${n} velas`, html: `El pastel está listo y tu erizo ya tiene su gorro. Ahora <b>sopla</b> para apagar las velas.<br><br>Mantén la barra en la <b>zona verde</b>, que se hace más angosta a medida que se apagan. Cada soplido gasta <b>aire</b>: cuando se acabe, para y respira. Si soplas muy fuerte o tardas mucho, algunas velas <b>se vuelven a encender</b>.`, botones: [['mic', 'Soplar al micrófono'], ['boton', 'Soplar con un botón', 'secundario']] });
  let an = null;
  if (modo === 'mic') { an = await abrirMicrofono(); if (!an) toast('No pude usar el micrófono. Sopla con el botón.', 2600); }
  const btn = $('#btn-soplar'); mostrar($('#soplido')); mostrar(btn, !an);
  let pres = false;
  btn.onpointerdown = (e) => { e.preventDefault(); pres = true; btn.classList.add('activo'); };
  btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { pres = false; btn.classList.remove('activo'); };
  const Z0 = 0.22, Z1 = 0.95, MAX = 1.2;
  const buf = an ? new Float32Array(an.fftSize) : null;
  let piso = 0.01, cal = 0.6;
  const llama = (l, on) => { l.on = on; l.s.visible = on; if (l.g) l.g.visible = on; };
  return new Promise((resolve) => {
    let nivel = 0, acc = 0, sobre = 0, enc = n, ult = performance.now(), aire = 1, quieto = 0, revive = 0, sinAire = false;
    const barra = $('#soplido-barra'), txt = $('#soplido-txt'), barAire = $('#soplido-aire'), zonaEl = $('#soplido .zona');
    fase = {
      update(_dt, t) {
        const ahora = performance.now(), dt = Math.min(0.25, (ahora - ult) / 1000); ult = ahora;
        let objetivo;
        if (an) {
          an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
          const rms = Math.sqrt(s / buf.length);
          if (cal > 0) { cal -= dt; piso = piso * 0.9 + rms * 0.1; objetivo = 0; }
          else objetivo = clamp((rms - piso * 1.6) * 5, 0, MAX);
          nivel += (objetivo - nivel) * Math.min(1, dt * 10);
        } else nivel = clamp(nivel + (pres ? 0.95 : -1.5) * dt, 0, MAX);
        // la zona verde se angosta a medida que se apagan las velas
        const zf = Z1 - (Z1 - 0.66) * (1 - enc / n);
        zonaEl.style.left = (Z0 / MAX * 100) + '%'; zonaEl.style.width = ((zf - Z0) / MAX * 100) + '%';
        barra.style.width = (nivel / MAX * 100) + '%'; barra.classList.toggle('fuerte', nivel >= zf);
        // aire: se gasta soplando y se recupera al dejar de soplar
        if (nivel > Z0 * 0.6) aire = Math.max(0, aire - dt * 0.62); else aire = Math.min(1, aire + dt * 0.55);
        if (aire <= 0) sinAire = true; else if (aire > 0.45) sinAire = false;
        barAire.style.width = (aire * 100) + '%'; barAire.classList.toggle('vacio', sinAire);
        const zona = nivel > Z0 && nivel < zf && !sinAire;
        txt.textContent = sinAire ? '¡Sin aire! Para y respira' : nivel >= zf ? '¡Muy fuerte!' : zona ? '¡Así, sigue!' : (quieto > 2.2 && enc < n ? '¡Sopla otra vez, se reavivan!' : (an ? 'Sopla suave y constante' : 'Mantén presionado y suelta a tiempo'));
        // si dejas de soplar mucho rato, las velas reviven
        if (nivel < Z0 && enc < n) { quieto += dt; if (quieto > 3.2) { revive += dt; if (revive > 0.9) { revive = 0; const l = velas.llamas.find((q) => !q.on); if (l) { llama(l, true); enc++; audio.reaviva(); } } } }
        else { quieto = 0; revive = 0; }
        if (zona) {
          acc += dt;
          while (acc > 0.11 && enc > 0) {
            acc -= 0.11; const vivas = velas.llamas.filter((l) => l.on); const l = vivas[Math.floor(Math.random() * vivas.length)];
            llama(l, false); enc--; audio.puff();
            const p = new THREE.Vector3(); l.s.getWorldPosition(p); chispas.emitir(p, 5, 0x9aa3ad, 0.4);
          }
        } else acc = Math.max(0, acc - dt);
        if (nivel >= zf && enc < n) { sobre += dt; if (sobre > 0.5) { sobre = 0; let k = 3; for (const l of velas.llamas) if (!l.on && k-- > 0) { llama(l, true); enc++; } audio.reaviva(); toast('Muy fuerte: algunas se encendieron otra vez', 1500); } }
        else sobre = Math.max(0, sobre - dt);
        for (const l of velas.llamas) if (l.on) { const f = 1 + Math.sin(t * 18 + l.f) * 0.14 + Math.sin(t * 7.3 + l.f * 2) * 0.06 - nivel * 0.3; l.s.scale.set(0.085 * f, 0.17 * f, 1); l.s.position.x = l.base.x - nivel * 0.04; if (l.g) { const gf = 0.8 + Math.sin(t * 11 + l.f) * 0.15; l.g.scale.setScalar(0.3 * gf); } }
        mundo.calida.intensity = 3 + enc / n * 6;
        hud(null, `🕯️ ${enc} encendidas`);
        if (enc === 0) terminar();
      }
    };
    async function terminar() {
      fase = null; mostrar($('#soplido'), false);
      if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
      audio.exito(); audio.cumple();
      for (let k = 0; k < 5; k++) setTimeout(() => chispas.emitir(V((Math.random() - 0.5) * 2, 1.4 + Math.random(), (Math.random() - 0.5)), 70, [0xffd27a, 0xff8fb1, 0x7ff6ff, 0xb7a6ff, 0xffffff], 3.2), k * 350);
      toast('¡Feliz cumple...!', 3000);
      mundo.calida.intensity = 9;
      await espera(3600); resolve();
    }
  });
}

// ───────── El sueño (inicio y despertar) ─────────
const sueno = cfg.sueno || {};
function escenaCama(dormido) {
  cama.visible = true; tocon.visible = false; pastel.grupo.visible = false; if (velas) velas.grupo.visible = false;
  erizo.visible = true; erizo.scale.setScalar(0.85); erizo.userData.gorro.visible = !dormido;
  if (dormido) { enrollar(true); erizo.position.set(0.05, 0.55, -0.42); erizo.rotation.set(0.5, 0.35, 0); }
  else { enrollar(false); erizo.position.set(0, 0.62, -0.25); erizo.rotation.set(0, 0.45, 0); }
  mundo.calida.position.set(1.2, 2.0, 1.4);
  enfocar(V(2.3, 2.3, 3.1), V(0, 0.55, -0.3), true, 3);
}
function respirar() {
  const b = erizo.userData.bola;
  fase = { update(dt, t) { const k = 1 + Math.sin(t * 1.6) * 0.035; b.scale.set(1 + (k - 1) * 0.6, k, 1 + (k - 1) * 0.6); } };
}
async function escribir(texto, msXLetra = 55) {
  const el = $('#subtitulo'); el.textContent = ''; mostrar(el);
  const letras = [...texto], ms = RAPIDO ? 8 : msXLetra, t0 = performance.now();
  for (let n = 0; n < letras.length;) { await espera(25); n = Math.min(letras.length, Math.floor((performance.now() - t0) / ms)); el.textContent = letras.slice(0, n).join(''); }
}
async function viajeSueno(texto, cambio) {
  const s = $('#sueno'); $('#sueno-texto').textContent = texto;
  $('#vr').classList.add('difuso'); mostrar(s); void s.offsetWidth; s.classList.add('on');
  await espera(1300); cambio?.(); await espera(RAPIDO ? 400 : 1800);
  $('#vr').classList.remove('difuso'); s.classList.remove('on'); await espera(1200); mostrar(s, false);
}
async function dormirse() {
  escenaCama(true); respirar(); cam.orbita = false;
  enfocar(V(1.7, 1.75, 2.3), V(0, 0.62, -0.35), false, 0.6);
  await espera(RAPIDO ? 300 : 1200); mostrar($('#zzz'));
  await escribir(sueno.frase || 'Soy un pastelito horneado de canela...');
  await espera(RAPIDO ? 600 : 2600);
  mostrar($('#subtitulo'), false);
  await viajeSueno('...y empezó a soñar', () => {
    mostrar($('#zzz'), false); cama.visible = false; fase = null; erizo.userData.bola.scale.setScalar(1); erizo.scale.setScalar(1); erizo.rotation.set(0, 0, 0);
  });
}
async function despertar() {
  mostrar($('#hud'), false);
  await viajeSueno('Despierta...', () => { escenaCama(true); respirar(); });
  await espera(RAPIDO ? 300 : 900);
  fase = null; erizo.userData.bola.scale.setScalar(1);
  audio.chime(); escenaCama(false); erizo.position.y += 0.12;
  chispas.emitir(erizo.position.clone().add(V(0, 0.5, 0)), 40, [0xffd27a, 0xff8fb1, 0x7ff6ff], 2);
  setTimeout(() => (erizo.position.y -= 0.12), 220);
  enfocar(V(1.6, 1.6, 2.2), V(0, 0.72, -0.3), false, 1);
  await escribir(sueno.despertar || '¿Fue un sueño? ¡Feliz cumpleaños!', 45);
  await espera(RAPIDO ? 600 : 3200);
  mostrar($('#subtitulo'), false);
}

// ───────── Carta final ─────────
function mostrarCarta() {
  progreso(4); mostrar($('#hud'), false);
  $('#carta-titulo').textContent = '¡Feliz cumple...!';
  $('#carta-texto').innerHTML = cfg.mensaje.map((p) => `<p>${esc(p)}</p>`).join('');
  $('#carta-firma').textContent = `Con cariño, ${cfg.firma}`;
  mostrar($('#carta'));
  cam.orbita = true;
}
async function descargarCarta() {
  try { await document.fonts.ready; } catch (e) { }
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#06111d'); g.addColorStop(0.55, '#0b2a36'); g.addColorStop(1, '#071a24');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const px = Math.random() * W, py = Math.random() * H, r = 2 + Math.random() * 7; const rg = x.createRadialGradient(px, py, 0, px, py, r * 3); const col = Math.random() < 0.7 ? '255,210,122' : '127,246,255'; rg.addColorStop(0, `rgba(${col},0.9)`); rg.addColorStop(1, `rgba(${col},0)`); x.fillStyle = rg; x.beginPath(); x.arc(px, py, r * 3, 0, 7); x.fill(); }
  x.textAlign = 'center'; x.fillStyle = '#7ff6ff'; x.font = '800 30px Nunito, sans-serif'; x.fillText(`${cfg.edad} VELAS APAGADAS`, W / 2, 120);
  x.fillStyle = '#ffd27a'; x.font = '700 78px Fredoka, sans-serif'; x.shadowColor = 'rgba(255,190,90,0.6)'; x.shadowBlur = 30;
  x.fillText('¡Feliz cumple...!', W / 2, 260); x.shadowBlur = 0;
  // texto
  const parrafos = cfg.mensaje, maxW = 880, y0 = 470, yMax = H - 230;
  let fs = 50, lineas;
  const partir = (t) => { const ws = t.split(' '), out = []; let l = ''; for (const w of ws) { const p = l ? l + ' ' + w : w; if (x.measureText(p).width > maxW && l) { out.push(l); l = w; } else l = p; } if (l) out.push(l); return out; };
  while (fs > 28) { x.font = `500 ${fs}px Caveat, cursive`; lineas = parrafos.map(partir); const alto = lineas.reduce((a, ls) => a + ls.length * fs * 1.15 + fs * 0.5, 0); if (y0 + alto < yMax) break; fs -= 2; }
  x.textAlign = 'left'; x.fillStyle = '#fff4dc'; let y = y0;
  lineas.forEach((ls) => { ls.forEach((l) => { x.fillText(l, (W - maxW) / 2, y); y += fs * 1.15; }); y += fs * 0.5; });
  x.textAlign = 'right'; x.fillStyle = '#ffd27a'; x.font = `700 ${Math.round(fs * 1.25)}px Caveat, cursive`; x.fillText(`Con cariño, ${cfg.firma}`, W - 100, Math.min(y + 40, H - 120));
  x.textAlign = 'center'; x.fillStyle = 'rgba(169,198,204,0.7)'; x.font = '600 26px Nunito, sans-serif'; x.fillText('🦔 El erizo cumpleañero', W / 2, H - 50);
  c.toBlob((b) => {
    const url = URL.createObjectURL(b), a = document.createElement('a');
    a.href = url; a.download = `feliz-cumpleanos-${cfg.nombre.toLowerCase()}.png`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
$('#carta-descargar').onclick = () => { audio.clic(); descargarCarta(); };
$('#carta-repetir').onclick = () => location.reload();
$('#carta-ver').onclick = () => { mostrar($('#carta'), false); toast('Recarga la página para jugar otra vez', 2600); };

// ───────── Inicio ─────────
$('#intro-titulo').textContent = 'El erizo cumpleañero';
$('#intro-bajada').innerHTML = `Es la noche antes de tu cumpleaños. Tu erizo se acurrucó en su camita… y empezó a soñar. En el sueño, tu pastel desapareció en el bosque. <b>Supera los 4 retos</b> y desbloquea los mensajes en el camino.`;
escenaCama(true); respirar(); cam.orbita = false;
$('#btn-sonido').onclick = () => { audio.setMudo(!audio.mudo); $('#btn-sonido').textContent = audio.mudo ? '🔇' : '🔊'; };

$('#btn-comenzar').onclick = async () => {
  iniciarAudio(); audio.clic(); await pedirMovimiento();
  mostrar($('#intro'), false); mostrar($('#btn-sonido'));
  const desde = clamp(parseInt(Q.get('fase') || '1', 10) || 1, 1, 4);
  if (desde <= 1) await dormirse(); else { cama.visible = false; fase = null; }
  if (desde <= 1) { await fase1(); await desbloquear(0); }
  if (desde <= 2) { if (desde < 2) await recorrido(1); await fase2(); await desbloquear(1); }
  if (desde <= 3) { await fase3(); await desbloquear(2); }
  await fase4();
  await despertar();
  mostrarCarta();
};

// ───────── Bucle ─────────
const reloj = new THREE.Clock();
const cal = { n: 0, s: 0, nivel: 0 };
function bucle() {
  const dt = Math.min(0.05, reloj.getDelta()), t = reloj.elapsedTime;
  fase?.update(dt, t);
  if (cam.orbita) { const a = t * 0.12; cam.pos.set(Math.sin(a) * 1.2, 1.45, 4.6 + Math.cos(a) * 0.4); }
  const k = 1 - Math.exp(-cam.k * dt);
  cam.p.lerp(cam.pos, k); cam.l.lerp(cam.look, k);
  cam.sac = Math.max(0, cam.sac - dt);
  camara.position.copy(cam.p);
  camara.position.x += Math.sin(t * 0.5) * 0.03 + (Math.random() - 0.5) * cam.sac * 0.3;
  camara.position.y += Math.sin(t * 0.7) * 0.02 + (Math.random() - 0.5) * cam.sac * 0.3;
  camara.lookAt(cam.l);
  if (!fase && erizo.visible && !erizo.userData.bola.visible && cam.orbita) erizo.position.y = Math.abs(Math.sin(t * 2.2)) * 0.03;
  pastel.animar(dt); chispas.update(dt); mundo.animar(t, camara);
  // calidad adaptativa
  cal.n++; cal.s += dt;
  if (cal.s > 2.5) { const fps = cal.n / cal.s; cal.n = 0; cal.s = 0; if (fps < 26 && cal.nivel < 2) { cal.nivel++; if (cal.nivel === 1) { PR = Math.max(1, PR * 0.7); } else { PR = 1; mundo.halos.visible = false; mundo.brumas.visible = false; } renderer.setPixelRatio(PR); mundo.pr(PR); } }
  renderer.render(escena, camara);
  requestAnimationFrame(bucle);
}
bucle();

window.__demo = { escena, camara, erizo, pastel, cfg, get fase() { return fase; }, cam };
