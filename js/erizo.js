// Modelos: erizo pigmeo (normal y enrollado), gorro de fiesta, pastel por capas, velas, golosinas y obstáculos.
import * as THREE from 'three';
import { Lote, M4 } from './geo.js';
import { arbusto } from './mundo.js';

const lam = () => new THREE.MeshLambertMaterial({ vertexColors: true });
const CREMA = 0xf3e4cc, CREMA2 = 0xfaf0e0, CAFE = 0x5a3a26, CAFE2 = 0x744c32, ROSA = 0xf2b4a6, NEGRO = 0x1b1411, PUNTA = 0xf3e6cf;
const UP = new THREE.Vector3(0, 1, 0);

// púas: cono oscuro con punta clara
function puas(L, radios, centro, filtro, n, largo, grosor, atras = 0.55) {
  const ga = Math.PI * (3 - Math.sqrt(5)), d = new THREE.Vector3(), eje = new THREE.Vector3(), q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
    d.set(Math.cos(th) * r, y, Math.sin(th) * r);
    if (!filtro(d)) continue;
    eje.set(d.x, d.y + 0.12 * atras, d.z - atras).normalize();
    q.setFromUnitVectors(UP, eje);
    const lg = largo * (0.85 + ((i * 7919) % 100) / 100 * 0.3);
    const base = new THREE.Vector3(d.x * radios[0], d.y * radios[1], d.z * radios[2]).add(centro);
    const s1 = base.clone().addScaledVector(eje, lg * 0.3);
    L.add(new THREE.ConeGeometry(grosor, lg, 5), i % 3 ? CAFE : CAFE2, null, new THREE.Matrix4().compose(s1, q, new THREE.Vector3(1, 1, 1)), {});
    const s2 = base.clone().addScaledVector(eje, lg * 0.3 + lg * 0.3);
    L.add(new THREE.ConeGeometry(grosor * 0.46, lg * 0.4, 5), PUNTA, null, new THREE.Matrix4().compose(s2, q, new THREE.Vector3(1, 1, 1)), {});
  }
}

export function crearErizo() {
  const g = new THREE.Group();
  // cuerpo de pie (mira hacia +z)
  const L = new Lote();
  const C = new THREE.Vector3(0, 0.36, -0.02), R = [0.42, 0.32, 0.5];
  L.add(new THREE.SphereGeometry(1, 22, 16), CREMA, null, M4(C.x, C.y, C.z, 0, 0, 0, R[0], R[1], R[2]), { suave: true, g: [0.78, 1.05] });
  L.add(new THREE.SphereGeometry(1, 18, 12), CAFE, null, M4(0, 0.42, -0.1, 0, 0, 0, 0.43, 0.34, 0.47), { suave: true });
  puas(L, [0.43, 0.34, 0.47], new THREE.Vector3(0, 0.42, -0.1), (d) => d.z < 0.42 && d.y > -0.25, 260, 0.24, 0.05);
  L.add(new THREE.ConeGeometry(0.17, 0.32, 14), CREMA2, null, M4(0, 0.3, 0.56, Math.PI / 2, 0, 0), { suave: true });
  L.add(new THREE.SphereGeometry(0.058, 10, 8), NEGRO, null, M4(0, 0.3, 0.73), { suave: true });
  for (const s of [-1, 1]) {
    L.add(new THREE.SphereGeometry(0.062, 10, 8), NEGRO, null, M4(s * 0.15, 0.42, 0.42), { suave: true });
    L.add(new THREE.SphereGeometry(0.02, 6, 4), 0xffffff, null, M4(s * 0.15 + 0.018, 0.445, 0.475), { suave: true, g: [1.3, 1.3] });
    L.add(new THREE.SphereGeometry(1, 12, 8), ROSA, null, M4(s * 0.26, 0.6, 0.2, 0, 0, -s * 0.35, 0.085, 0.095, 0.035), { suave: true });
    L.add(new THREE.SphereGeometry(1, 10, 6), 0xf6a39c, null, M4(s * 0.25, 0.31, 0.38, 0, 0, 0, 0.07, 0.04, 0.03), { suave: true });
    for (const fz of [0.24, -0.24]) L.add(new THREE.SphereGeometry(1, 8, 6), ROSA, null, M4(s * 0.2, 0.05, fz, 0, 0, 0, 0.08, 0.05, 0.1), { suave: true });
  }
  const cuerpo = L.malla(lam()); g.add(cuerpo);

  // enrollado en bolita
  const B = new Lote();
  B.add(new THREE.SphereGeometry(0.33, 18, 14), CAFE, null, null, { suave: true });
  puas(B, [0.33, 0.33, 0.33], new THREE.Vector3(), (d) => !(d.z > 0.55 && d.y < -0.2), 300, 0.22, 0.05, 0.0);
  B.add(new THREE.SphereGeometry(0.15, 10, 8), CREMA2, null, M4(0, -0.17, 0.27), { suave: true });
  B.add(new THREE.SphereGeometry(0.045, 8, 6), NEGRO, null, M4(0, -0.2, 0.41), { suave: true });
  const bola = B.malla(lam()); bola.position.y = 0.4; bola.visible = false; g.add(bola);

  // gorro de fiesta
  const H = new Lote();
  H.add(new THREE.ConeGeometry(0.13, 0.32, 16, 6), (x, y) => (Math.floor((y + 0.16) * 18) % 2 ? 0xff6f91 : 0xffd166), null, null, { suave: true });
  H.add(new THREE.SphereGeometry(0.05, 10, 8), 0xffffff, null, M4(0, 0.17, 0), { suave: true });
  H.add(new THREE.TorusGeometry(0.125, 0.018, 6, 18), 0x7ff6ff, null, M4(0, -0.15, 0, Math.PI / 2, 0, 0), {});
  const gorro = H.malla(lam()); gorro.position.set(0.06, 0.74, 0.12); gorro.rotation.set(0.15, 0, -0.28); gorro.visible = false; g.add(gorro);

  g.userData = { cuerpo, bola, gorro };
  g.userData.enrollar = (si) => { cuerpo.visible = !si; bola.visible = si; gorro.visible = gorro.visible && !si; };
  return g;
}

// ── Pastel por capas ──
export function crearPastel() {
  const g = new THREE.Group(), capas = [], alturas = [0.06];
  const P = new Lote();
  P.add(new THREE.CylinderGeometry(0.8, 0.72, 0.06, 36), 0xf6f2ea, null, M4(0, 0.03, 0), { suave: true });
  P.add(new THREE.TorusGeometry(0.78, 0.02, 6, 36), 0xffd27a, null, M4(0, 0.06, 0, Math.PI / 2, 0, 0), {});
  P.add(new THREE.CylinderGeometry(0.1, 0.22, 0.2, 18), 0xece6dc, null, M4(0, -0.1, 0), { suave: true });
  g.add(P.malla(lam()));
  let y = 0.06;
  const defs = [{ h: 0.2, r: 0.62, c: 0xf2c48a, b: 0xfffaf0 }, { h: 0.2, r: 0.6, c: 0xf59bb0, b: 0xfff0f4 }, { h: 0.2, r: 0.58, c: 0x8a5a3c, b: 0xf9e6d0 }];
  for (const d of defs) {
    const L = new Lote();
    L.add(new THREE.CylinderGeometry(d.r, d.r, d.h, 36), d.c, null, M4(0, d.h / 2, 0), { suave: true, g: [0.85, 1.05] });
    L.add(new THREE.TorusGeometry(d.r, 0.028, 6, 36), d.b, null, M4(0, d.h, 0, Math.PI / 2, 0, 0), { suave: true });
    const m = L.malla(lam()); m.position.y = y; g.add(m); capas.push(m); y += d.h; alturas.push(y);
  }
  // cobertura con gotas
  const F = new Lote();
  F.add(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 36), 0xfffbf4, null, M4(0, 0.025, 0), { suave: true });
  for (let k = 0; k < 18; k++) {
    const a = k / 18 * Math.PI * 2, l = 0.06 + ((k * 37) % 7) / 7 * 0.08;
    F.add(new THREE.SphereGeometry(1, 8, 6), 0xfffbf4, null, M4(Math.cos(a) * 0.585, 0.02 - l * 0.6, Math.sin(a) * 0.585, 0, 0, 0, 0.045, l, 0.045), { suave: true });
  }
  const fm = F.malla(lam()); fm.position.y = y; g.add(fm); capas.push(fm); y += 0.05; alturas.push(y);
  // decoración: fresas y chispas
  const D = new Lote();
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2, x = Math.cos(a) * 0.5, z = Math.sin(a) * 0.5;
    D.add(new THREE.SphereGeometry(1, 10, 8), 0xe8344e, null, M4(x, 0.06, z, 0, 0, 0, 0.06, 0.075, 0.06), { suave: true });
    D.add(new THREE.ConeGeometry(0.035, 0.04, 5), 0x3c9a3a, null, M4(x, 0.135, z, Math.PI, 0, 0), {});
  }
  const chis = [0xff6f91, 0xffd166, 0x7ff6ff, 0x9b8cff, 0xffffff];
  for (let k = 0; k < 46; k++) {
    const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.4;
    D.add(new THREE.CapsuleGeometry(0.008, 0.03, 2, 4), chis[k % 5], null, M4(Math.cos(a) * r, 0.012, Math.sin(a) * r, Math.PI / 2, 0, Math.random() * 3), {});
  }
  const dm = D.malla(lam()); dm.position.y = y; g.add(dm); capas.push(dm);
  const ultimo = y; // donde van las velas
  capas.forEach((c) => (c.visible = false));
  let nivel = 0;
  return {
    grupo: g, capas, tope: ultimo, alturas,
    get nivel() { return nivel; },
    altura() { return alturas[Math.min(nivel, 4)]; },
    mostrar(n) { nivel = n; capas.forEach((c, i) => { const v = i < n; if (v && !c.visible) { c.visible = true; c.userData.pop = 0; } c.visible = v; }); },
    animar(dt) { for (const c of capas) if (c.userData.pop !== undefined && c.userData.pop < 1) { c.userData.pop = Math.min(1, c.userData.pop + dt * 3); const k = c.userData.pop; const s = 1 + Math.sin(k * Math.PI) * 0.18; c.scale.set(s, k < 0.5 ? k * 2 : s, s); } }
  };
}

// textura de llama
function texLlama() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 82, 2, 32, 74, 46);
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,220,120,0.95)'); g.addColorStop(0.55, 'rgba(255,140,40,0.55)'); g.addColorStop(1, 'rgba(255,90,20,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(32, 4); x.bezierCurveTo(58, 60, 58, 124, 32, 124); x.bezierCurveTo(6, 124, 6, 60, 32, 4); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function texBrillo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function crearVelas(pastel, n) {
  const g = new THREE.Group(), V = new Lote(), llamas = [];
  const tex = texLlama(), cols = [0xff8fb1, 0x7ff6ff, 0xffd166, 0xb7a6ff];
  const anillos = n > 20 ? [[20, 0.47], [n - 20, 0.27]] : [[n, 0.42]];
  let k = 0;
  for (const [cant, r] of anillos) for (let i = 0; i < cant; i++, k++) {
    const a = i / cant * Math.PI * 2 + (r < 0.4 ? 0.15 : 0), x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.15;
    const c = cols[k % 4];
    V.add(new THREE.CylinderGeometry(0.016, 0.016, h, 8, 4), (xx, y) => (Math.floor((y + h / 2) * 40) % 2 ? c : 0xffffff), null, M4(x, h / 2, z), { suave: true });
    V.add(new THREE.CylinderGeometry(0.003, 0.003, 0.025, 3), 0x222222, null, M4(x, h + 0.012, z), {});
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.set(0.05, 0.1, 1); s.position.set(x, h + 0.05, z); g.add(s);
    llamas.push({ s, on: true, f: Math.random() * 10, base: new THREE.Vector3(x, h + 0.05, z) });
  }
  g.add(V.malla(lam()));
  g.position.y = pastel.tope;
  return { grupo: g, llamas };
}

// ── Golosinas que caen ──
const geos = {};
function geoGolosina(tipo) {
  if (geos[tipo]) return geos[tipo];
  const L = new Lote();
  if (tipo === 'estrella') {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.1 : 0.23; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }); eg.translate(0, 0, -0.035);
    L.add(eg, 0xffd54a, null, null, {});
  } else if (tipo === 'galleta') {
    L.add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 18), 0xd09450, null, M4(0, 0, 0, Math.PI / 2, 0, 0), { suave: true, var: 0.1 });
    for (let i = 0; i < 6; i++) { const a = i * 1.1, r = 0.05 + (i % 3) * 0.045; L.add(new THREE.SphereGeometry(0.026, 6, 4), 0x3b2416, null, M4(Math.cos(a) * r, Math.sin(a) * r, 0.03), {}); }
  } else if (tipo === 'fresa') {
    L.add(new THREE.SphereGeometry(1, 12, 10), 0xe8344e, null, M4(0, -0.02, 0, 0, 0, 0, 0.15, 0.19, 0.15), { suave: true });
    for (let i = 0; i < 5; i++) { const a = i * 1.256; L.add(new THREE.ConeGeometry(0.04, 0.12, 4), 0x3c9a3a, null, M4(Math.cos(a) * 0.06, 0.17, Math.sin(a) * 0.06, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2), {}); }
  } else if (tipo === 'caramelo') {
    L.add(new THREE.SphereGeometry(0.13, 14, 10), (x, y) => (Math.floor((x + y) * 18) % 2 ? 0xff7ab8 : 0xffffff), null, null, { suave: true });
    for (const s of [-1, 1]) L.add(new THREE.ConeGeometry(0.09, 0.14, 8), 0xffc2df, null, M4(s * 0.18, 0, 0, 0, 0, s * Math.PI / 2), {});
  } else {
    L.add(new THREE.DodecahedronGeometry(0.19, 0), 0x777b80, null, null, { jit: 0.03, var: 0.25 });
  }
  geos[tipo] = L.geometria(); return geos[tipo];
}
const matG = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2a1c10 });
const matP = new THREE.MeshLambertMaterial({ vertexColors: true });
export const BUENAS = ['estrella', 'galleta', 'fresa', 'caramelo'];
export function crearGolosina(tipo) { return new THREE.Mesh(geoGolosina(tipo), tipo === 'piedra' ? matP : matG); }

// ── Obstáculos, tocón y arbustos de escondite ──
export function crearTronco(largo) {
  const L = new Lote();
  L.add(new THREE.CylinderGeometry(0.24, 0.26, largo, 10), (x, y, z) => (z < -0.1 ? 0x46733a : 0x5a3d2a), null, M4(0, 0, 0, Math.PI / 2, 0, Math.PI / 2), { var: 0.15 });
  for (const s of [-1, 1]) L.add(new THREE.CircleGeometry(0.24, 10), 0xc9a36e, null, M4(s * largo / 2 + s * 0.001, 0, 0, 0, s * Math.PI / 2, 0), {});
  return L.malla(lam());
}
export function crearRoca(r) {
  const L = new Lote();
  L.add(new THREE.DodecahedronGeometry(1, 1), (x, y) => (y > 0.4 ? 0x4c7a3c : 0x5a6570), null, M4(0, 0, 0, 0, Math.random() * 6, 0, r, r * 0.75, r), { jit: 0.1, var: 0.2 });
  return L.malla(lam());
}
export function crearTocon() {
  const L = new Lote();
  L.add(new THREE.CylinderGeometry(0.62, 0.75, 0.6, 14), 0x5a3d2a, null, M4(0, 0.3, 0), { var: 0.15, g: [0.7, 1] });
  L.add(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 24), (x, y, z) => (Math.floor(Math.hypot(x, z) * 14) % 2 ? 0xd2ab78 : 0xbf955f), null, M4(0, 0.6, 0), {});
  for (let k = 0; k < 5; k++) { const a = k * 1.26; L.add(new THREE.ConeGeometry(0.16, 0.6, 5), 0x4e3424, null, M4(Math.cos(a) * 0.75, 0.08, Math.sin(a) * 0.75, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25), {}); }
  return L.malla(lam());
}
export function crearArbusto(s = 1) { const L = new Lote(); arbusto(L, 0, 0, s); return L.malla(lam()); }
export function crearFarol() {
  const g = new THREE.Group(), L = new Lote();
  L.add(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), 0x4a3426, null, M4(0, 0.65, 0), {});
  g.add(L.malla(lam()));
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a })); b.position.y = 1.38; g.add(b);
  return g;
}
