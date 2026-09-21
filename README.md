# Poker Club — Texas Hold'em en Línea

Una mesa de Poker Texas Hold'em (No-Limit) pensada para jugar directamente entre personas a través del navegador, sin registros obligatorios, sin bots y sin necesidad de instalar nada.

El proyecto está diseñado como una aplicación web estática optimizada para desplegarse de forma gratuita e inmediata en Vercel, aprovechando WebRTC (PeerJS) para conectar a los jugadores entre sí en tiempo real.

---

## Modos de Juego

### 1. Mesa en Línea (Multijugador P2P)
- Un jugador abre la web, elige entre **Póquer** o **Blackjack** en la pantalla inicial, pulsa en **Crear Sala** y elige las fichas iniciales y ciegas.
- La aplicación genera un código de mesa numérico (por ejemplo, `4821`) y un enlace directo.
- Al compartir ese enlace con amigos, estos entran desde su ordenador o móvil, eligen su nombre o iniciales y toman asiento.
- **Privacidad de mano**: cada jugador recibe exclusivamente sus dos cartas privadas en su dispositivo; las cartas comunitarias (Flop, Turn, River) y las apuestas se sincronizan de forma pública en la mesa.

### 2. Mesa Local (Pase y Juegue)
- Pensada para jugar entre 2 y 6 amigos compartiendo la misma pantalla (portátil, ordenador de clase o tablet).
- Cada jugador dispone del botón **Ocultar cartas** para consultar su mano en privado y ceder el turno al siguiente jugador con total discreción.

---

## Aspectos Técnicos

- **Motor de Reglas Texas Hold'em**: evaluación reglamentaria de 7 cartas ($C(7, 5)$) que contempla todas las jugadas oficiales (Escalera Real, Escalera de Color, Póker, Full House, Color, Escalera con As alto o bajo, Trío, Doble Pareja, Pareja y Carta Alta). Resuelve desempates por cartas de apoyo (*kickers*), botes secundarios (*side pots*) por situaciones de All-In y botes divididos (*split pots*).
- **Sonido Sintetizado con Web Audio API**: todos los efectos de mesa (deslizamiento de cartas, toque de fichas de arcilla, pasar en el paño y avisos de turno) se generan mediante síntesis de ondas directamente en el navegador, evitando llamadas a archivos externos que puedan causar demoras o errores 404.
- **Diseño Sobrio y Clásico**: estética inspirada en paño de casino tradicional, cuero oscuro acolchado, cartas satinadas de tono hueso y tipografía serif editorial, prescindiendo de estridencias visuales o figuras artificiales.
- **Comunicación en Mesa**: sistema de conversación discreto con expresiones habituales de mesa real (*All-in*, *Buen farol*, *Buena suerte*, *Bien jugado*, *Paso*).

---

## Cómo Desplegar en Vercel

Al tratarse de una arquitectura cliente basada en WebRTC, no se requiere ningún servidor de base de datos ni backend de pago.

### Opción A: A través de GitHub (Recomendado)
1. Haz un fork o sube este repositorio a tu cuenta de GitHub:
   ```bash
   git remote add origin https://github.com/Roberto-Villacorta/PokerOnline.git
   git branch -M main
   git push -u origin main
   ```
2. Inicia sesión en [Vercel](https://vercel.com/) con tu cuenta de GitHub.
3. Haz clic en **Add New...** > **Project** y selecciona el repositorio **PokerOnline**.
4. Haz clic en **Deploy**. El archivo `vercel.json` ya incluye las cabeceras de caché estática y seguridad necesarias, por lo que el despliegue tardará apenas unos segundos.

### Opción B: Usando la interfaz de comandos (Vercel CLI)
Desde la raíz del proyecto, ejecuta en la terminal:
```bash
vercel
```
Sigue las indicaciones del asistente para asociarlo a tu cuenta y el sitio quedará publicado al instante con una URL pública accesible desde cualquier dispositivo.

---

## Ejecución Local para Desarrollo

Si deseas probar o modificar el código localmente, puedes servir los archivos con cualquier servidor HTTP estático, por ejemplo con Python:

```bash
python -m http.server 3000
```

Y abrir en tu navegador `http://localhost:3000`.
