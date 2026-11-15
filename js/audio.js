// Sonidos sintetizados con Web Audio (sin archivos)
let ctx = null, master = null, mudo = false, grilloT = null;

export function iniciarAudio() {
  if (ctx) { ctx.resume(); return ctx; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    grilloT = setInterval(grillo, 2600);
  } catch (e) { ctx = null; }
  return ctx;
}
export const contexto = () => ctx;

function tono(f, t0, dur, tipo = 'sine', vol = 0.2, fin = null) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t0);
  if (fin) o.frequency.exponentialRampToValueAtTime(fin, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
function ruido(t0, dur, vol = 0.2, frec = 900, q = 0.8, tipo = 'bandpass') {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = tipo; f.frequency.value = frec; f.Q.value = q; g.gain.value = vol;
  s.connect(f).connect(g).connect(master); s.start(t0);
}
function grillo() {
  if (!ctx || mudo || Math.random() < 0.3) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) tono(4300 + Math.random() * 300, t + i * 0.07, 0.04, 'sine', 0.012);
}
const T = () => (ctx ? ctx.currentTime : 0);
const N = { C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G4: 392, A4: 440, B4: 493.9, G5: 784, A5: 880, C6: 1046.5 };

export const audio = {
  setMudo(m) { mudo = m; if (master) master.gain.value = m ? 0 : 0.55; },
  get mudo() { return mudo; },
  clic() { tono(880, T(), 0.08, 'triangle', 0.08); },
  asoma() { tono(620, T(), 0.12, 'sine', 0.06, 900); },
  atrapa(n = 1) { const t = T(), b = 660 * Math.pow(1.06, n); tono(b, t, 0.16, 'triangle', 0.16); tono(b * 1.5, t + 0.06, 0.22, 'sine', 0.12); },
  huye() { tono(500, T(), 0.2, 'sine', 0.06, 260); },
  chime() { const t = T(); [N.E5, N.G5, N.C6].forEach((f, i) => tono(f, t + i * 0.07, 0.4, 'sine', 0.1)); },
  luz() { tono(1200 + Math.random() * 400, T(), 0.18, 'sine', 0.07); },
  golpe() { ruido(T(), 0.25, 0.5, 220, 0.7, 'lowpass'); tono(140, T(), 0.25, 'sine', 0.25, 60); },
  bueno(c = 1) { const t = T(), f = 700 * Math.pow(1.05, Math.min(c, 12)); tono(f, t, 0.12, 'triangle', 0.13); tono(f * 2, t + 0.04, 0.12, 'sine', 0.06); },
  mal() { const t = T(); tono(220, t, 0.25, 'square', 0.06, 140); ruido(t, 0.15, 0.2, 400); },
  capa() { const t = T(); [N.C5, N.E5, N.G5].forEach((f, i) => tono(f, t + i * 0.05, 0.3, 'triangle', 0.1)); },
  puff() { ruido(T(), 0.18, 0.12, 1800, 0.5, 'highpass'); },
  reaviva() { tono(300, T(), 0.3, 'sawtooth', 0.04, 600); },
  exito() { const t = T(); [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tono(f, t + i * 0.1, 0.5, 'triangle', 0.12)); },
  foto() { const t = T(); ruido(t, 0.08, 0.3, 3000, 1, 'highpass'); [N.G5, N.C6].forEach((f, i) => tono(f, t + 0.1 + i * 0.12, 0.6, 'sine', 0.1)); },
  cumple() {
    // "Cumpleaños feliz" (melodía tradicional)
    const m = [['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2.5]];
    let t = T() + 0.3; const b = 0.34;
    for (const [n, d] of m) { tono(N[n], t, d * b * 0.95, 'triangle', 0.13); tono(N[n] * 2, t, d * b * 0.6, 'sine', 0.035); t += d * b; }
  }
};
