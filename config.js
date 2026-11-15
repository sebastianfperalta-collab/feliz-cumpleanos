/*
  CONFIGURACIÓN · El erizo de Ana
  ───────────────────────────────
  Cambia los textos entre comillas y guarda. No borres las comas.
*/
window.DEMO_CONFIG = {

  nombre: "Ana",
  edad: 32,              // número de velas del pastel
  firma: "Sebastián",

  // Fotos que se desbloquean al terminar los retos 1, 2 y 3 (carpeta img)
  fotos: [
    { src: "img/ana1.jpg", texto: "Esa sonrisa ilumina más que todas las luces juntas." },
    { src: "img/ana2.jpg", texto: "Entre flores, que es donde mejor te queda." },
    { src: "img/ana3.jpg", texto: "Paciencia, manos y mucho corazón." }
  ],

  // Carta final (cada línea es un párrafo). Puedes agregar un recuerdo que compartan.
  mensaje: [
    "Ana:",
    "Hoy cumples 32 años y quise regalarte algo distinto: un pedacito de bosque hecho a mano, con un erizo que te acompaña y unas velas que solo tú podías apagar.",
    "Gracias por tu sonrisa, por tu forma de mirar el mundo con curiosidad y por hacer que los días sencillos se sientan especiales. Las personas como tú dejan luz por donde pasan, como esas luciérnagas que encontraste en el camino.",
    "Te deseo un año lleno de calma, de proyectos que te ilusionen, de risas largas y de gente que te quiera bonito. Que cada reto que llegue lo superes como superaste estos: con paciencia y a tu manera.",
    "Feliz cumpleaños. Que este nuevo año sea tan bonito como tú."
  ],

  // ── DIFICULTAD ──────────────────────────────────────
  retos: {
    erizosMeta: 8,          // reto 1: veces que hay que atrapar al erizo
    largoSendero: 64,       // reto 2: metros que rueda la bolita
    golosinasMeta: 20,      // reto 3: golosinas para armar el pastel
    segundosGolosinas: 45,  // reto 3: tiempo disponible
    segundosRecorrido: 26   // duración de cada recorrido por el bosque
  },

  // Recorridos por el bosque entre retos (3). Cada uno lleva 2 letreros con frases tuyas.
  recorrido: {
    nombres: ["Camino de las luciérnagas", "Bosque de los hongos", "Hacia el claro del pastel"],
    letreros: [
      ["Sigue las luces: el bosque te conoce", "Cada paso suma una sonrisa"],
      ["Los hongos brillan para darte la bienvenida", "Lo bueno llega caminando despacio"],
      ["Ya huele a pastel...", "El claro está al final del sendero"]
    ]
  }
};
