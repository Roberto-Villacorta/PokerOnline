# ♠ POKER ROYALE - Texas Hold'em Online Multijugador

Aplicación web de **Poker Texas Hold'em No-Limit 100% multijugador exclusivo para personas reales** (sin bots), con gráficos de casino de lujo, motor oficial de evaluación de manos, chat en vivo y sonido sintetizado mediante Web Audio API.

Listo para ser desplegado en **Vercel** en 1 minuto sin servidores dedicados ni bases de datos de pago.

---

## 🚀 Cómo Desplegar en Vercel

### Opción 1: Despliegue Directo con GitHub (Recomendado)
1. Sube esta carpeta a un repositorio en tu cuenta de [GitHub](https://github.com/):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Poker Royale"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
2. Entra en [vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..."** > **"Project"**.
4. Selecciona tu repositorio de Poker e impórtalo.
5. Haz clic en **"Deploy"** (no requiere configurar variables de entorno ni comandos de build, ya está todo preconfigurado en `vercel.json`).
6. ¡Listo! Vercel te proporcionará una URL pública como `https://tu-poker.vercel.app`.

### Opción 2: Despliegue con Vercel CLI
Si tienes la herramienta de comandos de Vercel instalada:
```bash
vercel
```
Sigue las indicaciones de pantalla y el proyecto quedará publicado al instante.

---

## 🎮 Modos de Juego

### 1. Sala Online Multijugador (P2P con WebRTC)
- Un jugador pulsa **"Crear Sala"**, elige la cantidad de fichas y ciegas.
- Se genera un código único (ej. `PKR-4821`) y un enlace directo para compartir.
- Los amigos abren el enlace desde su teléfono móvil u ordenador, eligen su nombre/avatar y se sientan en la mesa.
- **Privacidad Total**: Las cartas privadas de cada jugador se envían de forma encriptada y exclusiva a su pantalla.

### 2. Mesa Local (Pase y Juegue / Misma Pantalla)
- Ideal para jugar con amigos físicamente juntos en una misma tablet, portátil o PC de clase.
- Permite de 2 a 6 jugadores humanos.
- Cuenta con el botón **"Ocultar Cartas"** para que cada jugador pueda mirar su mano y pasar el dispositivo al siguiente sin que nadie más la vea.

---

## 🃏 Características Técnicas

- **Evaluador Oficial Texas Hold'em**: Soporta combinaciones de 7 cartas con evaluación de Escalera Real, Escalera de Color, Póker, Full House, Color, Escalera (con As alto y bajo A-2-3-4-5), Trío, Doble Pareja, Pareja y Carta Alta, con desempates por *kickers* y reparto de botes divididos (*split pots*).
- **Web Audio API**: Efectos de sonido puros (reparto de cartas, tintineo de fichas, pasar en la mesa, alerta de turno y fanfarria de victoria) generados matemáticamente sin depender de archivos de audio externos.
- **Chat en Vivo**: Mensajes y reacciones rápidas para interactuar con los rivales.
- **Asistente de Mano en Tiempo Real**: Te indica la jugada que tienes conformada en cada fase de la ronda.
- **Diseño Responsive de Casino**: Adaptado para jugar horizontal y verticalmente en smartphones, tablets y pantallas de sobremesa.
