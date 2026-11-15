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
    { src: "img/ana1.jpg", texto: "Ana, feliz cumple!!! 🎂 Que este año tenga la misma luz de ese día, con esa sonrisa que contagia y mucha energía para todo lo que venga. Un abrazo grande 🥳" },
    { src: "img/ana2.jpg", texto: "Ana, feliz cumple!!! 🌸 Te deseo un día lleno de risas, comida rica y gente linda, y un año que florezca con planes que te emocionen y momentos memorables. Un abrazo grande 🥳" },
    { src: "img/ana3.jpg", texto: "Paciencia, manos y mucho corazón." }
  ],

  // Carta final (cada línea es un párrafo). Puedes agregar un recuerdo que compartan.
  mensaje: [
    "Ana, feliz cumple!!! 🎉",
    "Hoy te mereces un día lleno de risas, buena comida y gente que te quiere, de esos que uno recuerda con cariño mucho después.",
    "Que este nuevo año te regale proyectos que te entusiasmen, buenos planes y razones de sobra para sonreír.",
    "Un abrazo enorme y a disfrutarlo"
  ],

  // ── DIFICULTAD ──────────────────────────────────────
  retos: {
    erizosMeta: 8,          // reto 1: veces que hay que atrapar al erizo
    largoSendero: 64,       // reto 2: metros que rueda la bolita
    golosinasMeta: 20,      // reto 3: golosinas para armar el pastel
    segundosGolosinas: 45,  // reto 3: tiempo disponible
    segundosRecorrido: 14   // duración del recorrido por el bosque
  },

  // Recorrido por el bosque (uno, entre el reto 1 y el 2). Usa los 2 letreros de la primera línea.
  recorrido: {
    nombres: ["Camino de las luciérnagas", "Bosque de los hongos", "Hacia el claro del pastel"],
    letreros: [
      ["Sigue las luces: el bosque te conoce", "Cada paso suma una sonrisa"],
      ["Los hongos brillan para darte la bienvenida", "Lo bueno llega caminando despacio"],
      ["Ya huele a pastel...", "El claro está al final del sendero"]
    ]
  },

  // Todo el juego es un sueño del erizo: la frase al dormirse y la del despertar
  sueno: {
    frase: "Soy un pastelito horneado de canela...",
    despertar: "¿Fue un sueño? Feliz cumpleaños, pastelito de canela 🎂"
  }
};
