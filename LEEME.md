# Feliz cumpleaños, Ana

Juego web de cumpleaños para el celular. Se juega en un bosque de noche con luciérnagas y un erizo pigmeo, y no hay que instalar nada.

## Retos
1. **El bosque**: hay que tocar al erizo cuando se asoma entre los arbustos, antes de que se enrolle. Al terminar se desbloquea la foto 1.
2. **La bolita**: el erizo va enrollado y se guía inclinando el celular, o manteniendo presionado el lado izquierdo o derecho de la pantalla. Hay que esquivar troncos y piedras. Al chocar, vuelve al último farol. Al terminar se desbloquea la foto 2.
3. **La lluvia de golosinas**: se mueve el plato para atrapar golosinas, y cada una suma una capa al pastel. Las piedras grises restan 3 segundos. Si no se logra a tiempo, se puede reintentar. Al terminar se desbloquea la foto 3.
4. **Las velas**: se sopla al micrófono para apagar las 32 velas. Si se sopla demasiado fuerte, algunas se vuelven a encender. También hay un botón para soplar sin micrófono.
5. **Carta final**: lleva las 3 fotos, el mensaje y la firma, y se puede descargar como imagen PNG.

## Qué se edita (config.js)
- `nombre`, `edad` (cantidad de velas) y `firma`.
- `fotos`: cada foto con su texto (están en la carpeta `img`).
- `mensaje`: los párrafos de la carta.
- `retos`: la dificultad de cada reto.

## Probarlo
- En el computador: ejecuta `python3 -m http.server` dentro de esta carpeta y abre `http://localhost:8000`.
- En el celular: necesita HTTPS, por el giroscopio y el micrófono. Sirve GitHub Pages, igual que los otros demos.
- Atajos: `?fase=1` a `?fase=4` salta a un reto, y `?rapido=1` acorta todos los retos.

## Créditos técnicos
three.js 0.160 (MIT). Fuentes Fredoka, Nunito y Caveat (Google Fonts, OFL). Los sonidos se sintetizan en el navegador. "Cumpleaños feliz" es una melodía tradicional.

## Recorridos por el bosque
Entre cada reto el erizo camina por el sendero con cámara lateral: toca las luces que flotan y lee los letreros.
En `config.js`: `retos.segundosRecorrido` y `recorrido.letreros` (2 frases por recorrido).

## El sueño
El juego empieza con el erizo dormido en su camita diciendo la frase de `sueno.frase`, y termina cuando despierta con `sueno.despertar` (en `config.js`).
