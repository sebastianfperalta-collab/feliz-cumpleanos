// Bosque nocturno: suelo, árboles retorcidos, río turquesa brillante, hongos y flores que brillan, luciérnagas y cielo.
import * as THREE from 'three';
import { Lote, h1, h3, M4, matRim } from './geo.js';

let semilla = 11;
export const rnd = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
export const rioX = (z) => 6.6 + Math.sin(z * 0.07) * 2.2;
export const SENDERO = { z0: -10, ancho: 2.6 };

export function libre(x, z, m = 0) {
  if (x * x + z * z < (7.5 + m) ** 2) return false;               // claro
  if (z < -4 && z > -90 && Math.abs(x) < 3.9 + m) return false;  // sendero
  if (Math.abs(x - rioX(z)) < 2.1 + m) return false;             // río
  return true;
}

const lam = () => new THREE.MeshLambertMaterial({ vertexColors: true });

// ── Puntos que brillan (luciérnagas y halos) ──
export function crearPuntos(pos, col, tam, mover) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const f = new Float32Array(pos.length / 3); for (let i = 0; i < f.length; i++) f[i] = Math.random();
  g.setAttribute('fase', new THREE.BufferAttribute(f, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uTam: { value: tam }, uPR: { value: 1 }, uMov: { value: mover ? 1 : 0 } },
    vertexShader: `attribute float fase; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uT, uTam, uPR, uMov;
      void main(){
        vec3 p = position + uMov * vec3(sin(uT*0.5+fase*40.0)*0.7, sin(uT*0.8+fase*20.0)*0.4, cos(uT*0.45+fase*30.0)*0.7);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        float tw = uMov > 0.5 ? 0.3 + 0.7*pow(0.5+0.5*sin(uT*2.2+fase*60.0), 2.0) : 0.8 + 0.2*sin(uT*1.5+fase*50.0);
        vA = tw; vC = color;
        gl_PointSize = uTam * uPR * (0.5 + 0.5*tw) * 300.0 / max(0.5, -mv.z);
      }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a = a*a; gl_FragColor = vec4(vC * a * 1.7 * vA, a * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const p = new THREE.Points(g, mat); p.frustumCulled = false; return p;
}

function suelo() {
  const g = new THREE.PlaneGeometry(150, 200, 90, 120);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -40);
  const p = g.attributes.position, col = [];
  const c = new THREE.Color(), cG = new THREE.Color(0x1d4a2e), cM = new THREE.Color(0x4f9434), cP = new THREE.Color(0x5c4a35), cR = new THREE.Color(0x14302c), cL = new THREE.Color(0x7cc440);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const n = Math.sin(x * 0.35 + z * 0.21) * 0.5 + Math.sin(x * 0.9 - z * 0.7) * 0.25 + (h1(i) - 0.5) * 0.35;
    c.copy(cG).lerp(cM, Math.max(0, n) * 0.55);
    const enCamino = (z < -3 && z > -90) ? Math.max(0, 1 - Math.abs(x + Math.sin(z * 0.3) * 0.2) / 2.8) : 0;
    const enClaro = Math.max(0, 1 - Math.hypot(x, z) / 5.8);
    c.lerp(cP, Math.min(1, Math.max(enCamino, enClaro) * 1.7) * 0.72);
    const dr = Math.abs(x - rioX(z));
    if (dr < 2.2) c.lerp(cR, (1 - dr / 2.2) * 0.75);
    else if (dr < 5.2) c.lerp(cL, Math.max(0, 1 - Math.abs(dr - 3.1) / 2.1) * 0.6);
    let y = 0;
    if (libre(x, z, 1.5)) y = (Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.5 + 0.5) * 0.7 + n * 0.15;
    if (dr < 2.0) y = -0.18;
    p.setY(i, y);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, lam());
}

function arbol(L, x, z, s, grande) {
  const tronco = grande ? 0x55362b : 0x34262b;
  const nr = grande ? 6 : 3, r0 = (grande ? 0.85 : 0.28 + rnd() * 0.14) * s, a0 = rnd() * 6.28;
  for (let k = 0; k < nr; k++) {
    const a = a0 + k * 6.28 / nr + (rnd() - 0.5) * 0.4, lr = r0 * (grande ? 3.8 : 3.2);
    L.add(new THREE.ConeGeometry(r0 * 0.5, lr, 6), tronco, null,
      M4(x + Math.cos(a) * r0 * 1.15, 0.15, z + Math.sin(a) * r0 * 1.15, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2), { var: 0.2, jit: grande ? 0.05 : 0 });
  }
  const alto = (grande ? 9 : 5 + rnd() * 3.5) * s, n = grande ? 7 : 5, giro = grande ? 0.55 : 0.4;
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(x, -0.2, z);
  const verdes = [0x15423f, 0x1c5348, 0x12393c, 0x246354], claros = [0x2f7f66, 0x3a8f6a];
  const copa = (c, r, cl) => L.add(new THREE.IcosahedronGeometry(1, 1), cl ? claros[Math.floor(rnd() * 2)] : verdes[Math.floor(rnd() * 4)], null,
    M4(c.x, c.y, c.z, rnd(), rnd(), rnd(), r, r * 0.76, r), { g: cl ? [0.7, 1.3] : [0.42, 1.2], var: 0.2, jit: 0.13 });
  let rb = r0;
  for (let i = 0; i < n; i++) {
    const len = alto / n, ra = r0 * (1 - i / n * 0.62); rb = r0 * (1 - (i + 1) / n * 0.62);
    dir.x += (rnd() - 0.5) * giro; dir.z += (rnd() - 0.5) * giro; dir.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const c = p.clone().addScaledVector(dir, len / 2);
    L.add(new THREE.CylinderGeometry(rb, ra, len * 1.12, grande ? 9 : 7), tronco, null, new THREE.Matrix4().compose(c, q, new THREE.Vector3(1, 1, 1)), { var: 0.28, g: [0.7, 1.08], jit: grande ? 0.04 : 0 });
    if (i >= 2 && rnd() < 0.7) {
      const a = rnd() * 6.28, bd = new THREE.Vector3(Math.cos(a), 0.7, Math.sin(a)).normalize(), bl = alto * 0.25;
      const bq = new THREE.Quaternion().setFromUnitVectors(up, bd);
      L.add(new THREE.CylinderGeometry(rb * 0.25, rb * 0.55, bl, 6), tronco, null, new THREE.Matrix4().compose(c.clone().addScaledVector(bd, bl / 2), bq, new THREE.Vector3(1, 1, 1)), { var: 0.2 });
      const e = c.clone().addScaledVector(bd, bl); e.y += 0.2; copa(e, (0.9 + rnd() * 0.6) * s);
    }
    p.addScaledVector(dir, len);
  }
  // ramas maestras que se abren (solo en los árboles protagonistas)
  if (grande) for (let k = 0; k < 3; k++) {
    const a = a0 + k * 2.1 + rnd() * 0.6, bd = new THREE.Vector3(Math.cos(a), 0.55, Math.sin(a)).normalize(), bl = alto * 0.34;
    const bq = new THREE.Quaternion().setFromUnitVectors(up, bd);
    L.add(new THREE.CylinderGeometry(rb * 0.3, rb * 0.85, bl, 7), tronco, null, new THREE.Matrix4().compose(p.clone().addScaledVector(bd, bl / 2), bq, new THREE.Vector3(1, 1, 1)), { var: 0.25, jit: 0.03 });
    const e = p.clone().addScaledVector(bd, bl);
    for (let j = 0; j < 3; j++) copa(e.clone().add(new THREE.Vector3((rnd() - 0.5) * 1.6, (rnd() - 0.2) * 1.2, (rnd() - 0.5) * 1.6)), (1.3 + rnd() * 0.8) * s, j === 2);
  }
  const nC = grande ? 7 : 4 + Math.floor(rnd() * 3);
  for (let k = 0; k < nC; k++) {
    const a = rnd() * 6.28, d = rnd() * 1.6 * s * (grande ? 1.5 : 1), r = (1.2 + rnd()) * s * (grande ? 1.4 : 1);
    copa(new THREE.Vector3(p.x + Math.cos(a) * d, p.y + (rnd() - 0.3) * 1.3 * s, p.z + Math.sin(a) * d), r, k === nC - 1);
  }
}

// helecho: hojas planas que se abren desde el centro
function helecho(L, x, z, s) {
  const n = 6 + Math.floor(rnd() * 3), a0 = rnd() * 6.28;
  for (let k = 0; k < n; k++) {
    const a = a0 + k * 6.28 / n, t = 0.75 + rnd() * 0.35;
    L.add(new THREE.ConeGeometry(0.09, 0.62, 4), k % 2 ? 0x3f9a48 : 0x2f8050, null,
      M4(x + Math.cos(a) * 0.17 * s, 0.2 * s, z + Math.sin(a) * 0.17 * s, Math.sin(a) * t, 0, -Math.cos(a) * t, s, s, s * 0.3), { g: [0.45, 1.25] });
  }
}

function texNiebla() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(0.7, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function arbusto(L, x, z, s = 1, y = 0) {
  const verdes = [0x2b663f, 0x357545, 0x23563c];
  const n = 3 + Math.floor(rnd() * 3);
  for (let k = 0; k < n; k++) {
    const a = rnd() * 6.28, d = rnd() * 0.35 * s, r = (0.32 + rnd() * 0.22) * s;
    L.add(new THREE.IcosahedronGeometry(1, 1), verdes[k % 3], null, M4(x + Math.cos(a) * d, y + r * 0.8, z + Math.sin(a) * d, rnd(), rnd(), 0, r, r * 0.85, r), { g: [0.45, 1.15], var: 0.2, jit: 0.1 });
  }
}

function roca(L, x, z, s) {
  L.add(new THREE.DodecahedronGeometry(1, 0), (xx, yy) => yy > 0.35 ? 0x47703a : 0x4f5a64, null,
    M4(x, s * 0.25, z, rnd(), rnd() * 6, rnd() * 0.3, s, s * 0.6, s * (0.8 + rnd() * 0.4)), { var: 0.2, jit: 0.12 });
}

export function crearMundo(escena) {
  escena.fog = new THREE.Fog(0x18485f, 12, 60);
  escena.add(new THREE.HemisphereLight(0x9cc8ff, 0x2a4a2c, 1.6));
  escena.add(new THREE.AmbientLight(0x3a5a80, 1.0));
  const luna = new THREE.DirectionalLight(0xb9d8ff, 1.3); luna.position.set(12, 22, -18); escena.add(luna);
  const calida = new THREE.PointLight(0xffb45a, 9, 18, 1.4); calida.position.set(0, 2.4, -2.5); escena.add(calida);

  // cielo
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vD; uniform float uT;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        float y = vD.y; vec3 top = vec3(0.015,0.03,0.1), hor = vec3(0.094,0.282,0.373), low = vec3(0.05,0.14,0.19);
        vec3 c = mix(hor, top, smoothstep(0.0, 0.55, y)); c = mix(low, c, smoothstep(-0.2, 0.02, y));
        vec3 cel = floor(vD*220.0); float s = h(cel);
        c += vec3(0.85,0.92,1.0) * step(0.9955, s) * smoothstep(0.08,0.35,y) * (0.55+0.45*sin(uT*2.0+s*90.0));
        vec3 md = normalize(vec3(0.25,0.42,-0.87)); float m = max(dot(vD, md), 0.0);
        c += vec3(0.8,0.92,1.0)*smoothstep(0.9990,0.9994,m) + vec3(0.25,0.45,0.65)*pow(m, 40.0)*0.7;
        float gl = pow(max(dot(normalize(vec3(vD.x, vD.y*2.2, vD.z)), vec3(0.0,0.0,-1.0)), 0.0), 5.0);
        c += vec3(0.42,0.2,0.6) * gl * 0.4 * smoothstep(0.5, 0.0, vD.y);
        gl_FragColor = vec4(c, 1.0);
      }`
  }));
  cielo.renderOrder = -1; escena.add(cielo);

  escena.add(suelo());

  const L = new Lote(), G = new Lote();          // estático y lo que brilla
  const halo = { p: [], c: [] }, addHalo = (x, y, z, hex, k = 1) => { const c = new THREE.Color(hex); halo.p.push(x, y, z); halo.c.push(c.r * k, c.g * k, c.b * k); };

  const ch = { p: [], u: [], c: [], i: [] };
  const charco = (x, z, r, hex, k = 1) => {
    if (libre(x, z, 1.5)) return;                       // solo donde el suelo es plano
    const c = new THREE.Color(hex), b = ch.p.length / 3;
    ch.p.push(x - r, 0.05, z - r, x + r, 0.05, z - r, x + r, 0.05, z + r, x - r, 0.05, z + r); ch.u.push(0, 0, 1, 0, 1, 1, 0, 1);
    for (let j = 0; j < 4; j++) ch.c.push(c.r * k, c.g * k, c.b * k);
    ch.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
  };
  // árboles protagonistas alrededor del claro
  [[-5.6, -3.2, 1.25], [5.4, -4.2, 1.2], [-4.2, -8.4, 1.0], [4.6, -8.8, 1.05], [-7.2, 1.8, 1.1], [7.4, 1.2, 1.0], [-3.6, 7.8, 0.9]]
    .forEach(([x, z, s]) => arbol(L, x, z, s, true));
  let n = 0;
  for (let k = 0; k < 2500 && n < 230; k++) {
    const x = (rnd() - 0.5) * 100, z = 22 - rnd() * 125;
    if (!libre(x, z, 0.6)) continue;
    const cerca = Math.abs(x) < 16 || Math.hypot(x, z) < 20;
    if (!cerca && rnd() < 0.55) continue;
    arbol(L, x, z, 0.85 + rnd() * 0.5, false); n++;
  }
  // arbustos en los bordes del sendero y del claro
  for (let z = -6; z > -88; z -= 1.7) for (const s of [-1, 1]) if (rnd() < 0.75) arbusto(L, s * (3.7 + rnd() * 1.6), z + rnd(), 0.9 + rnd() * 0.5);
  for (let a = 0; a < 6.28; a += 0.32) { const r = 7.6 + rnd() * 1.6, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > -5 || Math.abs(x) > 4) arbusto(L, x, z, 1 + rnd() * 0.4); }
  // pasto: más tupido y luminoso junto al río
  for (let k = 0; k < 2500; k++) {
    let x, z; const orilla = k % 3 === 0;
    if (orilla) { z = 18 - rnd() * 110; x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (1.8 + rnd() * 2.6); }
    else { x = (rnd() - 0.5) * 60; z = 18 - rnd() * 110; }
    if (Math.abs(x - rioX(z)) < 1.6) continue;
    if (Math.hypot(x, z) < 4.6 || (z < -3 && Math.abs(x) < 2.4)) continue;
    const h = (orilla ? 0.32 : 0.25) + rnd() * 0.3, col = orilla ? (rnd() < 0.5 ? 0x7fcf4a : 0x9be05a) : (rnd() < 0.5 ? 0x3f8236 : 0x55993c);
    for (let j = 0; j < 3; j++) L.add(new THREE.ConeGeometry(0.035, h, 3), col, null, M4(x + (rnd() - .5) * 0.15, h / 2, z + (rnd() - .5) * 0.15, (rnd() - .5) * 0.5, rnd() * 3, (rnd() - .5) * 0.5), { g: [0.45, 1.3] });
  }
  // detalle del claro y del sendero: hojas caídas, matas bajas y florecitas con su charco de luz
  for (let k = 0; k < 420; k++) {
    let x, z;
    if (k < 200) { const an = rnd() * 6.28, r = 2.3 + rnd() * 4.6; x = Math.cos(an) * r; z = Math.sin(an) * r; }
    else { z = -5 - rnd() * 84; x = (rnd() - 0.5) * 5.4 - Math.sin(z * 0.3) * 0.2; }
    const t = rnd();
    if (t < 0.5) L.add(new THREE.IcosahedronGeometry(1, 0), [0x8a5a2c, 0xb07a34, 0x6f7a2e, 0x4e6a30][k % 4], null, M4(x, 0.012, z, 0, rnd() * 6, 0, 0.07 + rnd() * 0.05, 0.008, 0.04 + rnd() * 0.02), { var: 0.2 });
    else if (t < 0.9) { const h = 0.1 + rnd() * 0.1; for (let j = 0; j < 3; j++) L.add(new THREE.ConeGeometry(0.025, h, 3), rnd() < 0.5 ? 0x4f9438 : 0x6aae40, null, M4(x + (rnd() - .5) * 0.1, h / 2, z + (rnd() - .5) * 0.1, (rnd() - .5) * 0.6, rnd() * 3, (rnd() - .5) * 0.6), { g: [0.5, 1.3] }); }
    else { const col = rnd() < 0.5 ? 0x6ff3ff : 0xffd24a; G.add(new THREE.IcosahedronGeometry(1, 0), col, null, M4(x, 0.05, z, rnd(), rnd(), 0, 0.035, 0.025, 0.035), {}); addHalo(x, 0.06, z, col, 0.6); charco(x, z, 0.5, col, 0.28); }
  }
  // helechos en los bordes del sendero, el claro y el río
  for (let k = 0; k < 190; k++) {
    let x, z; const t = rnd();
    if (t < 0.5) { z = -5 - rnd() * 84; x = (rnd() < 0.5 ? -1 : 1) * (3.2 + rnd() * 2.2); }
    else if (t < 0.75) { const a = rnd() * 6.28, r = 6.2 + rnd() * 3; x = Math.cos(a) * r; z = Math.sin(a) * r; if (z < -4 && Math.abs(x) < 3.2) continue; }
    else { z = 18 - rnd() * 110; x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (2.3 + rnd() * 1.5); }
    helecho(L, x, z, 0.8 + rnd() * 0.8);
  }
  // piedras planas del sendero y del claro
  for (let k = 0; k < 120; k++) {
    let x, z;
    if (k < 30) { const a = Math.PI + rnd() * Math.PI, r = 2.5 + rnd() * 3; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else { z = -5 - rnd() * 82; x = (rnd() < 0.5 ? -1 : 1) * (2.0 + rnd() * 1.0); }
    const s = 0.14 + rnd() * 0.16;
    L.add(new THREE.CylinderGeometry(s, s * 1.08, 0.06, 7), 0x6d6b62, null, M4(x, 0.02, z, 0, rnd() * 3, 0, 1, 1, 0.75 + rnd() * 0.4), { var: 0.25 });
  }
  // rocas en el río y sus orillas
  for (let z = 20; z > -95; z -= 1.4) {
    if (rnd() < 0.6) { const s = rnd() < 0.5 ? -1 : 1; roca(L, rioX(z) + s * (1.5 + rnd() * 0.8), z, 0.3 + rnd() * 0.45); }
    if (rnd() < 0.25) roca(L, rioX(z) + (rnd() - 0.5) * 1.6, z, 0.15 + rnd() * 0.2);
  }
  // troncos caídos con musgo
  for (const [x, z, ry] of [[-6.2, -1, 0.4], [8.5, -12, 1.2], [-6, -30, 2.2], [6, -48, 0.8], [-7, -64, 1.6]]) {
    L.add(new THREE.CylinderGeometry(0.32, 0.38, 3.6, 9), (xx, yy, zz) => zz < -0.12 ? 0x3f6b30 : 0x4a3426, null, M4(x, 0.3, z, Math.PI / 2, ry, 0), { var: 0.2 });
  }
  // hongos que brillan (como en las referencias)
  const hongo = (x, z, s) => {
    const h = 0.16 * s + rnd() * 0.12 * s;
    L.add(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, h, 6), 0xe9dcc0, null, M4(x, h / 2, z), {});
    const col = rnd() < 0.82 ? 0xffd24a : 0xff9a5a;
    G.add(new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), col, null, M4(x, h, z, 0, 0, 0, 0.12 * s, 0.08 * s, 0.12 * s), { g: [0.75, 1.1] });
    addHalo(x, h + 0.04 * s, z, col, 0.9); charco(x, z, 0.6 * s, col, 0.3);
  };
  for (let k = 0; k < 140; k++) {
    let x, z;
    const t = rnd();
    if (t < 0.35) { const a = rnd() * 6.28, r = 5.6 + rnd() * 2.6; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    else if (t < 0.75) { z = -5 - rnd() * 85; x = (rnd() < 0.5 ? -1 : 1) * (3.0 + rnd() * 1.6); }
    else { z = 18 - rnd() * 110; x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (1.9 + rnd()); }
    const g = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < g; j++) hongo(x + (rnd() - .5) * 0.4, z + (rnd() - .5) * 0.4, 0.8 + rnd() * 0.9);
  }
  // flores cian y violeta (bioluminiscentes)
  for (let k = 0; k < 220; k++) {
    let x, z;
    if (rnd() < 0.6) { z = 20 - rnd() * 112; x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (1.6 + rnd() * 1.4); }
    else { const a = rnd() * 6.28, r = 5 + rnd() * 4; x = Math.cos(a) * r; z = Math.sin(a) * r; if (z < -4 && Math.abs(x) < 3) continue; }
    const h = 0.2 + rnd() * 0.25, col = rnd() < 0.7 ? 0x6ff3ff : 0x9b8cff;
    L.add(new THREE.CylinderGeometry(0.008, 0.012, h, 4), 0x2f6b3a, null, M4(x, h / 2, z), {});
    G.add(new THREE.IcosahedronGeometry(1, 0), col, null, M4(x, h, z, rnd(), rnd(), 0, 0.05, 0.03, 0.05), {});
    addHalo(x, h, z, col, 0.8); charco(x, z, 0.4, col, 0.22);
  }
  // hongos protagonistas: sombrero naranja con pecas claras
  const hongoGrande = (x, z, s) => {
    const h = 0.5 * s;
    L.add(new THREE.CylinderGeometry(0.06 * s, 0.11 * s, h, 8), 0xf3e6c8, null, M4(x, h / 2, z, 0, 0, (rnd() - 0.5) * 0.2), { g: [0.7, 1.1] });
    G.add(new THREE.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2),
      (px, py, pz) => (h3(Math.round(px * 3.1), Math.round(py * 3.1) + 7, Math.round(pz * 3.1)) > 0.7 ? 0xfff0c4 : 0xe8743a), null,
      M4(x, h - 0.02 * s, z, 0, rnd() * 6, 0, 0.36 * s, 0.2 * s, 0.36 * s), { g: [0.62, 1.12] });
    G.add(new THREE.CylinderGeometry(0.33 * s, 0.1 * s, 0.05 * s, 12), 0xffd98a, null, M4(x, h - 0.04 * s, z), {});
    addHalo(x, h * 0.75, z, 0xffb45a, 1.3); charco(x, z, 1.7 * s, 0xffa040, 0.5);
  };
  [[-3.3, -5.7, 1.35], [3.9, -3.1, 1.0], [4.7, 4.3, 1.2], [-5.3, 3.4, 0.9], [-2.2, 6.2, 0.8]].forEach(([x, z, s]) => hongoGrande(x, z, s));
  for (let z = -11, k = 0; z > -88; z -= 6 + rnd() * 5, k++) hongoGrande((k % 2 ? 1 : -1) * (3.5 + rnd() * 1.3), z, 0.8 + rnd() * 0.7);
  // flores azules grandes de cinco pétalos
  for (let k = 0; k < 80; k++) {
    let x, z;
    if (rnd() < 0.5) { z = 20 - rnd() * 112; x = rioX(z) + (rnd() < 0.5 ? -1 : 1) * (1.9 + rnd() * 1.6); }
    else if (rnd() < 0.5) { const a = rnd() * 6.28, r = 5.4 + rnd() * 3.2; x = Math.cos(a) * r; z = Math.sin(a) * r; if (z < -4 && Math.abs(x) < 3) continue; }
    else { z = -5 - rnd() * 84; x = (rnd() < 0.5 ? -1 : 1) * (3.1 + rnd() * 1.6); }
    const h = 0.22 + rnd() * 0.22, col = rnd() < 0.6 ? 0x6f9cff : 0xa98cff, a0 = rnd() * 6.28;
    L.add(new THREE.CylinderGeometry(0.012, 0.016, h, 4), 0x2f7040, null, M4(x, h / 2, z), {});
    for (let j = 0; j < 5; j++) { const a = a0 + j * 1.2566; G.add(new THREE.SphereGeometry(1, 6, 4), col, null, M4(x + Math.cos(a) * 0.075, h + 0.012, z + Math.sin(a) * 0.075, 0, -a, 0.35, 0.075, 0.014, 0.045), { g: [0.8, 1.15] }); }
    G.add(new THREE.SphereGeometry(0.028, 6, 4), 0xeaf6ff, null, M4(x, h + 0.02, z), {});
    addHalo(x, h + 0.03, z, col, 1.0); charco(x, z, 0.55, col, 0.35);
  }
  const estatico = L.malla(matRim(0.55)); escena.add(estatico);
  const brillo = G.malla(new THREE.MeshBasicMaterial({ vertexColors: true })); escena.add(brillo);
  const halos = crearPuntos(halo.p, halo.c, 0.75, false); escena.add(halos);

  // charcos de luz en el suelo bajo hongos y flores
  const gc = new THREE.BufferGeometry();
  gc.setAttribute('position', new THREE.Float32BufferAttribute(ch.p, 3)); gc.setAttribute('uv', new THREE.Float32BufferAttribute(ch.u, 2));
  gc.setAttribute('color', new THREE.Float32BufferAttribute(ch.c, 3)); gc.setIndex(ch.i);
  const charcos = new THREE.Mesh(gc, new THREE.MeshBasicMaterial({ map: texNiebla(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  charcos.renderOrder = 1; escena.add(charcos);

  // bruma luminosa detrás de los árboles (los recorta a contraluz) y resplandor violeta al fondo del sendero
  const tn = texNiebla(), brumas = new THREE.Group();
  const bruma = (x, y, z, e, hex, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tn, color: hex, opacity: op, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sp.position.set(x, y, z); sp.scale.set(e, e * 0.7, 1); brumas.add(sp); return sp; };
  for (let z = 14; z > -100; z -= 13) for (const l of [-1, 1]) bruma(l * (17 + rnd() * 9), 3.5 + rnd() * 2, z + rnd() * 6, 24 + rnd() * 10, rnd() < 0.7 ? 0x2aa6c8 : 0x3f7ae0, 0.2 + rnd() * 0.1);
  for (let a = 0.4; a < 6.28; a += 1.05) bruma(Math.cos(a) * 25, 4, Math.sin(a) * 25, 26, 0x2aa6c8, 0.2);
  const fondo = bruma(0, 3.5, -75, 42, 0xa04fe0, 0.4), fondo2 = bruma(0, 2, -50, 20, 0xff7ac8, 0.16);
  escena.add(brumas);

  // río turquesa con vetas de luz
  const pos = [], uv = [], idx = [];
  let i = 0;
  for (let z = 30; z >= -105; z -= 1, i++) {
    const x = rioX(z), w = 1.5 + Math.sin(z * 0.13) * 0.35;
    pos.push(x - w, 0.03, z, x + w, 0.03, z); uv.push(0, -z * 0.1, 1, -z * 0.1);
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const gr = new THREE.BufferGeometry();
  gr.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gr.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gr.setIndex(idx);
  const agua = new THREE.ShaderMaterial({
    transparent: true, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vU; uniform float uT;
      void main(){
        float w = sin(vU.y*9.0 - uT*1.4 + sin(vU.x*7.0 + vU.y*3.0)*2.2);
        float w2 = sin(vU.y*14.0 - uT*2.1 + vU.x*11.0 + sin(vU.y*5.0+uT)*1.5);
        float lin = smoothstep(0.9, 1.0, w) + smoothstep(0.93, 1.0, w2)*0.7;
        float borde = smoothstep(0.32, 0.5, abs(vU.x - 0.5));
        vec3 c = mix(vec3(0.02,0.16,0.22), vec3(0.05,0.42,0.5), 0.45 + 0.35*sin(vU.y*2.0 + uT*0.25));
        c += vec3(0.45,1.0,1.0) * lin * 0.9 + vec3(0.3,0.95,1.0) * borde * 0.5;
        gl_FragColor = vec4(c, 0.93);
      }`
  });
  escena.add(new THREE.Mesh(gr, agua));

  // luciérnagas
  const fp = [], fc = [], cA = new THREE.Color(0xffcf5a), cB = new THREE.Color(0x7ff6ff);
  for (let k = 0; k < 650; k++) {
    let x, z;
    if (k < 220) { const a = Math.random() * 6.28, r = 2 + Math.random() * 9; x = Math.cos(a) * r; z = Math.sin(a) * r - 1; }
    else { z = 15 - Math.random() * 100; x = (Math.random() - 0.5) * 26; }
    fp.push(x, 0.4 + Math.random() * 4.5, z);
    const c = Math.random() < 0.72 ? cA : cB; fc.push(c.r, c.g, c.b);
  }
  const luci = crearPuntos(fp, fc, 0.32, true); escena.add(luci);

  return {
    calida, cielo, halos, luci, brillo, brumas,
    pr(v) { halos.material.uniforms.uPR.value = v; luci.material.uniforms.uPR.value = v; },
    animar(t, camara) {
      cielo.position.copy(camara.position);
      fondo.position.z = camara.position.z - 72; fondo2.position.z = camara.position.z - 46;
      cielo.material.uniforms.uT.value = t; agua.uniforms.uT.value = t;
      luci.material.uniforms.uT.value = t; halos.material.uniforms.uT.value = t;
      calida.intensity = 9 + Math.sin(t * 3.1) * 0.4 + Math.sin(t * 7.3) * 0.2;
    }
  };
}
