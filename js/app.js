/**
 * CLUB DE PÓQUER - LÓGICA PRINCIPAL DE LA APLICACIÓN EN CASTELLANO
 * Gestiona el flujo de juego de Texas Hold'em, interfaz de usuario,
 * modo multijugador online P2P y modo mesa local.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================
    const estadoJuego = {
        modo: 'ANFITRION_ONLINE', // 'ANFITRION_ONLINE', 'CLIENTE_ONLINE', 'MESA_LOCAL'
        codigoSala: null,
        jugadores: [],            // Lista de jugadores en la mesa
        miIdJugador: null,
        miAsiento: 0,
        asientoRepartidor: 0,
        asientoTurnoActual: 0,
        fase: 'ESPERANDO',        // 'ESPERANDO', 'PREFLOP', 'FLOP', 'TURN', 'RIVER', 'CONFRONTACION'
        baraja: [],
        cartasComunitarias: [],
        bote: 0,
        apuestaActual: 0,         // Apuesta más alta de la ronda actual
        subidaMinima: 20,
        ciegaPequena: 10,
        ciegaGrande: 20,
        fichasIniciales: 1000,
        cartasOcultas: false,
        misCartasMano: [],
        asientoUltimoAgresor: null,
        jugadoresQueHanActuado: new Set()
    };

    // Alias para compatibilidad
    const gameState = estadoJuego;

    let gestorRed = null;

    // ==========================================
    // ELEMENTOS DEL DOM
    // ==========================================
    const INTERFAZ = {
        // Encabezado
        insigniaSala: document.getElementById('roomBadge'),
        etiquetaCodigoSala: document.getElementById('roomCodeDisplay'),
        botonSonido: document.getElementById('btnSound'),
        iconoSonidoActivado: document.getElementById('soundIconOn'),
        iconoSonidoDesactivado: document.getElementById('soundIconOff'),
        botonReglas: document.getElementById('btnRules'),
        botonAlternarChat: document.getElementById('btnToggleChat'),
        insigniaChatNoLeido: document.getElementById('unreadChatBadge'),
        botonSalir: document.getElementById('btnLeave'),
        
        // Mesa y zona de juego
        cantidadBote: document.getElementById('potAmount'),
        cartasComunitarias: document.getElementById('communityCards'),
        cartelEstadoRonda: document.getElementById('roundStatusBanner'),
        cartelGanadorShowdown: document.getElementById('showdownBanner'),
        nombreGanadorShowdown: document.getElementById('showdownWinnerName'),
        jugadaGanadorShowdown: document.getElementById('showdownHandName'),
        boteGanadoShowdown: document.getElementById('showdownPotWon'),
        contenedorAsientos: document.getElementById('seatsContainer'),
        
        // Controles de acción
        valorAsesorMano: document.getElementById('handAdvisorVal'),
        botonPrivacidad: document.getElementById('btnTogglePrivacy'),
        textoPrivacidad: document.getElementById('privacyText'),
        botonNoIr: document.getElementById('btnFold'),
        botonPasarIgualar: document.getElementById('btnCheckCall'),
        etiquetaPasarIgualar: document.getElementById('checkCallLabel'),
        subetiquetaPasarIgualar: document.getElementById('checkCallSub'),
        botonSubir: document.getElementById('btnRaise'),
        etiquetaCantidadSubida: document.getElementById('raiseAmountLabel'),
        deslizadorSubida: document.getElementById('raiseSlider'),
        botonPreajusteMin: document.getElementById('btnPresetMin'),
        botonPreajuste2BB: document.getElementById('btnPreset2BB'),
        botonPreajusteMedioBote: document.getElementById('btnPresetHalfPot'),
        botonPreajusteBote: document.getElementById('btnPresetPot'),
        botonPreajusteTodo: document.getElementById('btnPresetAllIn'),

        // Conversación
        panelChat: document.getElementById('chatDrawer'),
        botonCerrarChat: document.getElementById('btnCloseChat'),
        mensajesChat: document.getElementById('chatMessages'),
        formularioChat: document.getElementById('chatForm'),
        campoTextoChat: document.getElementById('chatInput'),

        // Modales y Selección de Juego
        modalSeleccionJuego: document.getElementById('gameSelectModal'),
        botonSeleccionarPoker: document.getElementById('btnSelectPoker'),
        botonSeleccionarBlackjack: document.getElementById('btnSelectBlackjack'),
        tarjetaSeleccionarPoker: document.getElementById('cardSelectPoker'),
        tarjetaSeleccionarBlackjack: document.getElementById('cardSelectBlackjack'),
        botonSeleccionarJuegoBarra: document.getElementById('btnSelectGame'),
        logotipoMarca: document.getElementById('brandLogo'),
        botonVolverSeleccionJuego: document.getElementById('btnBackToGameSelect'),

        // Vistas de Juego
        vistaPoker: document.getElementById('pokerViewport'),
        vistaBlackjack: document.getElementById('blackjackViewport'),
        barraAccionesPoker: document.getElementById('pokerActionBar'),
        barraAccionesBlackjack: document.getElementById('blackjackActionBar'),

        // Acciones Blackjack
        btnBjHit: document.getElementById('btnBjHit'),
        btnBjStand: document.getElementById('btnBjStand'),
        btnBjNewGame: document.getElementById('btnBjNewGame'),

        // Ventanas modales
        modalLobby: document.getElementById('lobbyModal'),
        pestanaCrear: document.getElementById('tabCreate'),
        pestanaUnirse: document.getElementById('tabJoin'),
        pestanaLocal: document.getElementById('tabLocal'),
        campoNombreJugador: document.getElementById('playerNameInput'),
        selectorAvatar: document.getElementById('avatarSelector'),
        opcionesCrearSala: document.getElementById('createRoomOptions'),
        opcionesUnirseSala: document.getElementById('joinRoomOptions'),
        opcionesMesaLocal: document.getElementById('localTableOptions'),
        selectorFichasIniciales: document.getElementById('initialChipsSelect'),
        selectorCiegas: document.getElementById('blindsSelect'),
        campoCodigoSala: document.getElementById('roomCodeInput'),
        selectorJugadoresLocales: document.getElementById('localPlayersCount'),
        botonIniciarJuego: document.getElementById('btnStartGame'),
        modalReglas: document.getElementById('rulesModal'),
        botonCerrarReglas: document.getElementById('btnCloseRules'),
        contenedorAvisos: document.getElementById('toastContainer')
    };

    // ==========================================
    // NOTIFICACIONES EN PANTALLA (AVISOS TOAST)
    // ==========================================
    function mostrarAviso(mensaje, duracion = 3000) {
        const elementoAviso = document.createElement('div');
        elementoAviso.className = 'toast';
        elementoAviso.textContent = mensaje;
        INTERFAZ.contenedorAvisos.appendChild(elementoAviso);
        setTimeout(() => {
            elementoAviso.style.opacity = '0';
            elementoAviso.style.transition = 'opacity 0.4s';
            setTimeout(() => elementoAviso.remove(), 400);
        }, duracion);
    }
    const showToast = mostrarAviso;

    // ==========================================
    // PALETA Y MONOGRAMAS DE JUGADORES
    // ==========================================
    const PALETA_ASIENTOS = {
        'navy': { bg: '#26384a', color: '#e8edf3' },
        'moss': { bg: '#273d2f', color: '#e2eee6' },
        'wine': { bg: '#4d242c', color: '#fae8eb' },
        'amber': { bg: '#4b3924', color: '#faeee0' },
        'slate': { bg: '#2d333b', color: '#e6ebf1' },
        'copper': { bg: '#3d2c29', color: '#f5eae8' }
    };
    const CLAVES_PALETA = ['navy', 'moss', 'wine', 'amber', 'slate', 'copper'];

    function obtenerIniciales(nombre) {
        if (!nombre) return 'J';
        const partes = nombre.trim().split(/\s+/);
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nombre.substring(0, 2).toUpperCase();
    }
    const getInitials = obtenerIniciales;

    // ==========================================
    // SELECCIÓN DE JUEGO Y GESTIÓN DEL LOBBY
    // ==========================================
    let modoJuegoActual = 'NINGUNO'; // 'POKER', 'BLACKJACK'
    let pestanaSeleccionada = 'crear';
    let avatarSeleccionado = 'navy';

    function mostrarSeleccionJuego() {
        if (INTERFAZ.modalSeleccionJuego) {
            INTERFAZ.modalSeleccionJuego.style.display = 'flex';
            if (INTERFAZ.modalLobby) INTERFAZ.modalLobby.style.display = 'none';
        } else {
            window.location.href = 'index.html';
        }
    }

    function abrirModoPoker() {
        modoJuegoActual = 'POKER';
        if (INTERFAZ.modalSeleccionJuego) INTERFAZ.modalSeleccionJuego.style.display = 'none';
        if (INTERFAZ.modalLobby) INTERFAZ.modalLobby.style.display = 'flex';
        if (INTERFAZ.vistaPoker) INTERFAZ.vistaPoker.style.display = 'flex';
        if (INTERFAZ.vistaBlackjack) INTERFAZ.vistaBlackjack.style.display = 'none';
        if (INTERFAZ.barraAccionesPoker) INTERFAZ.barraAccionesPoker.style.display = 'flex';
        if (INTERFAZ.barraAccionesBlackjack) INTERFAZ.barraAccionesBlackjack.style.display = 'none';
    }

    function abrirModoBlackjack() {
        modoJuegoActual = 'BLACKJACK';
        if (INTERFAZ.modalSeleccionJuego) INTERFAZ.modalSeleccionJuego.style.display = 'none';
        if (INTERFAZ.modalLobby) INTERFAZ.modalLobby.style.display = 'none';
        if (INTERFAZ.vistaPoker) INTERFAZ.vistaPoker.style.display = 'none';
        if (INTERFAZ.vistaBlackjack) INTERFAZ.vistaBlackjack.style.display = 'flex';
        if (INTERFAZ.barraAccionesPoker) INTERFAZ.barraAccionesPoker.style.display = 'none';
        if (INTERFAZ.barraAccionesBlackjack) INTERFAZ.barraAccionesBlackjack.style.display = 'flex';

        if (window.ControladorBlackjack) {
            window.ControladorBlackjack.iniciar();
            window.ControladorBlackjack.nuevaMano();
        }
    }

    if (INTERFAZ.botonSeleccionarPoker) {
        INTERFAZ.botonSeleccionarPoker.addEventListener('click', abrirModoPoker);
    }
    if (INTERFAZ.tarjetaSeleccionarPoker) {
        INTERFAZ.tarjetaSeleccionarPoker.addEventListener('click', (e) => {
            if (e.target !== INTERFAZ.botonSeleccionarPoker) abrirModoPoker();
        });
    }

    if (INTERFAZ.botonSeleccionarBlackjack) {
        INTERFAZ.botonSeleccionarBlackjack.addEventListener('click', abrirModoBlackjack);
    }
    if (INTERFAZ.tarjetaSeleccionarBlackjack) {
        INTERFAZ.tarjetaSeleccionarBlackjack.addEventListener('click', (e) => {
            if (e.target !== INTERFAZ.botonSeleccionarBlackjack) abrirModoBlackjack();
        });
    }

    if (INTERFAZ.botonSeleccionarJuegoBarra) {
        INTERFAZ.botonSeleccionarJuegoBarra.addEventListener('click', mostrarSeleccionJuego);
    }
    if (INTERFAZ.logotipoMarca) {
        INTERFAZ.logotipoMarca.addEventListener('click', mostrarSeleccionJuego);
    }
    if (INTERFAZ.botonVolverSeleccionJuego) {
        INTERFAZ.botonVolverSeleccionJuego.addEventListener('click', mostrarSeleccionJuego);
    }
    if (INTERFAZ.botonSalir) {
        INTERFAZ.botonSalir.addEventListener('click', () => {
            if (confirm('¿Deseas salir al menú principal de juegos?')) {
                window.location.href = 'index.html';
            }
        });
    }

    const parametrosUrl = new URLSearchParams(window.location.search);
    const parametroSala = parametrosUrl.get('sala') || parametrosUrl.get('room');
    if (!INTERFAZ.modalSeleccionJuego) {
        // Ejecución en página independiente poker.html
        abrirModoPoker();
        if (parametroSala) {
            cambiarPestanaLobby('unirse');
            if (INTERFAZ.campoCodigoSala) INTERFAZ.campoCodigoSala.value = parametroSala.toUpperCase();
        }
    } else if (parametroSala) {
        abrirModoPoker();
        cambiarPestanaLobby('unirse');
        INTERFAZ.campoCodigoSala.value = parametroSala.toUpperCase();
    } else {
        mostrarSeleccionJuego();
    }

    INTERFAZ.pestanaCrear.addEventListener('click', () => cambiarPestanaLobby('crear'));
    INTERFAZ.pestanaUnirse.addEventListener('click', () => cambiarPestanaLobby('unirse'));
    INTERFAZ.pestanaLocal.addEventListener('click', () => cambiarPestanaLobby('local'));

    function cambiarPestanaLobby(pestana) {
        pestanaSeleccionada = pestana;
        [INTERFAZ.pestanaCrear, INTERFAZ.pestanaUnirse, INTERFAZ.pestanaLocal].forEach(b => b.classList.remove('active'));
        INTERFAZ.opcionesCrearSala.style.display = 'none';
        INTERFAZ.opcionesUnirseSala.style.display = 'none';
        INTERFAZ.opcionesMesaLocal.style.display = 'none';

        if (pestana === 'crear') {
            INTERFAZ.pestanaCrear.classList.add('active');
            INTERFAZ.opcionesCrearSala.style.display = 'block';
            INTERFAZ.botonIniciarJuego.textContent = 'CREAR MESA';
        } else if (pestana === 'unirse') {
            INTERFAZ.pestanaUnirse.classList.add('active');
            INTERFAZ.opcionesUnirseSala.style.display = 'block';
            INTERFAZ.botonIniciarJuego.textContent = 'UNIRSE A LA MESA';
        } else if (pestana === 'local') {
            INTERFAZ.pestanaLocal.classList.add('active');
            INTERFAZ.opcionesMesaLocal.style.display = 'block';
            INTERFAZ.botonIniciarJuego.textContent = 'INICIAR MESA LOCAL';
        }
    }

    // Selector de insignia de asiento
    INTERFAZ.selectorAvatar.addEventListener('click', (evento) => {
        const opcion = evento.target.closest('.avatar-option');
        if (opcion) {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            opcion.classList.add('selected');
            avatarSeleccionado = opcion.dataset.avatar || 'navy';
        }
    });

    // Botón de inicio del juego
    INTERFAZ.botonIniciarJuego.addEventListener('click', async () => {
        const nombreJugador = INTERFAZ.campoNombreJugador.value.trim() || 'Jugador 1';
        const fichasIniciales = parseInt(INTERFAZ.selectorFichasIniciales.value, 10) || 1000;
        const [ciegaP, ciegaG] = (INTERFAZ.selectorCiegas.value || '10/20').split('/').map(Number);

        estadoJuego.fichasIniciales = fichasIniciales;
        estadoJuego.ciegaPequena = ciegaP;
        estadoJuego.ciegaGrande = ciegaG;
        estadoJuego.subidaMinima = ciegaG;

        if (pestanaSeleccionada === 'crear') {
            await iniciarAnfitrionOnline(nombreJugador, avatarSeleccionado, fichasIniciales);
        } else if (pestanaSeleccionada === 'unirse') {
            const codigo = INTERFAZ.campoCodigoSala.value.trim();
            if (!codigo) {
                mostrarAviso('Introduce un código de sala válido.');
                return;
            }
            await iniciarClienteOnline(codigo, nombreJugador, avatarSeleccionado, fichasIniciales);
        } else if (pestanaSeleccionada === 'local') {
            const cantidad = parseInt(INTERFAZ.selectorJugadoresLocales.value, 10) || 2;
            iniciarMesaLocal(cantidad, nombreJugador, avatarSeleccionado, fichasIniciales);
        }
    });

    // ==========================================
    // MODOS DE JUEGO
    // ==========================================

    // 1. ANFITRIÓN EN LÍNEA
    async function iniciarAnfitrionOnline(nombre, avatar, fichas) {
        INTERFAZ.botonIniciarJuego.disabled = true;
        INTERFAZ.botonIniciarJuego.textContent = 'Creando mesa...';

        gestorRed = new GestorMultijugador({
            onPlayerJoined: (jugador) => {
                const existe = estadoJuego.jugadores.some(j => (j.id && j.id === jugador.id) || (j.peerId && j.peerId === jugador.peerId));
                if (!existe) {
                    estadoJuego.jugadores.push({
                        id: jugador.id || jugador.peerId,
                        peerId: jugador.peerId || jugador.id,
                        nombre: jugador.nombre || jugador.name,
                        name: jugador.nombre || jugador.name,
                        avatar: jugador.avatar || 'moss',
                        fichas: jugador.fichas || jugador.chips || estadoJuego.fichasIniciales,
                        chips: jugador.fichas || jugador.chips || estadoJuego.fichasIniciales,
                        asiento: jugador.asiento ?? jugador.seat,
                        seat: jugador.asiento ?? jugador.seat,
                        cartasMano: [],
                        holeCards: [],
                        apuestaRondaActual: 0,
                        currentRoundBet: 0,
                        apuestaTotal: 0,
                        totalBet: 0,
                        retirado: false,
                        folded: false,
                        estaTodoDentro: false,
                        isAllIn: false,
                        esAnfitrion: false,
                        isHost: false
                    });
                }
                mostrarAviso(`${jugador.nombre || jugador.name} se ha sentado en la mesa`);
                agregarMensajeChat('Mesa', `${jugador.nombre || jugador.name} se ha incorporado.`);
                window.EfectosAudio.reproducirRepartoCarta();
                dibujarMesa();
                transmitirEstado();
                comprobarAutoInicioMano();
            },
            onPlayerLeft: (jugador) => {
                const idx = estadoJuego.jugadores.findIndex(j => (j.id && (j.id === jugador.id || j.id === jugador.peerId)) || (j.peerId && (j.peerId === jugador.id || j.peerId === jugador.peerId)));
                if (idx !== -1) {
                    estadoJuego.jugadores.splice(idx, 1);
                }
                mostrarAviso(`${jugador.nombre || jugador.name} ha dejado su asiento`);
                agregarMensajeChat('Mesa', `${jugador.nombre || jugador.name} ha salido.`);
                dibujarMesa();
                transmitirEstado();
            },
            onPlayerAction: (idPar, cargaAccion) => {
                gestionarAccionJugadorRemoto(idPar, cargaAccion);
            },
            onChatMessage: (mensaje) => {
                agregarMensajeChat(mensaje.senderName, mensaje.text);
            },
            onError: (error) => {
                mostrarAviso('Error de conexión: ' + error.message);
                INTERFAZ.botonIniciarJuego.disabled = false;
                INTERFAZ.botonIniciarJuego.textContent = 'CREAR MESA';
            }
        });

        try {
            const codigoGenerado = GestorMultijugador.generarIdSala();
            const infoSala = await gestorRed.crearSala(codigoGenerado, {
                nombre,
                avatar,
                fichasIniciales: fichas
            });

            estadoJuego.modo = 'ANFITRION_ONLINE';
            estadoJuego.codigoSala = infoSala.codigoSala;
            estadoJuego.miIdJugador = infoSala.idPar;
            estadoJuego.miAsiento = 0;

            estadoJuego.jugadores = [{
                id: infoSala.idPar,
                peerId: infoSala.idPar,
                nombre: nombre,
                name: nombre,
                avatar: avatar,
                fichas: fichas,
                chips: fichas,
                asiento: 0,
                seat: 0,
                cartasMano: [],
                holeCards: [],
                apuestaRondaActual: 0,
                currentRoundBet: 0,
                apuestaTotal: 0,
                totalBet: 0,
                retirado: false,
                folded: false,
                estaTodoDentro: false,
                isAllIn: false,
                esAnfitrion: true,
                isHost: true
            }];

            configurarInterfazSala(infoSala.codigoSala);
            INTERFAZ.modalLobby.style.display = 'none';
            dibujarMesa();
            mostrarAviso(`Mesa ${infoSala.codigoSala} lista.`);
            agregarMensajeChat('Mesa', `Mesa creada. Código: ${infoSala.codigoSala}. Esperando jugadores.`);
        } catch (err) {
            console.error(err);
            mostrarAviso('No se pudo crear la sala. Revisa tu conexión.');
            INTERFAZ.botonIniciarJuego.disabled = false;
            INTERFAZ.botonIniciarJuego.textContent = 'CREAR MESA';
        }
    }

    // 2. CLIENTE EN LÍNEA
    async function iniciarClienteOnline(codigoSala, nombre, avatar, fichas) {
        INTERFAZ.botonIniciarJuego.disabled = true;
        INTERFAZ.botonIniciarJuego.textContent = 'Conectando a la mesa...';

        gestorRed = new GestorMultijugador({
            onGameStateUpdate: (estadoServidor) => {
                aplicarEstadoServidor(estadoServidor);
            },
            onPrivateCards: (cartas) => {
                estadoJuego.misCartasMano = cartas;
                const yo = estadoJuego.jugadores.find(j => j.id === estadoJuego.miIdJugador);
                if (yo) {
                    yo.cartasMano = cartas;
                    yo.holeCards = cartas;
                }
                window.EfectosAudio.reproducirRepartoCarta();
                dibujarMesa();
                actualizarControles();
            },
            onChatMessage: (msg) => {
                agregarMensajeChat(msg.senderName, msg.text);
            },
            onRoundWinners: (cargaGanadores) => {
                mostrarGanadoresConfrontacion(cargaGanadores);
            },
            onDisconnected: (razon) => {
                mostrarAviso(razon);
            },
            onError: (err) => {
                mostrarAviso('Error: ' + err.message);
                INTERFAZ.botonIniciarJuego.disabled = false;
                INTERFAZ.botonIniciarJuego.textContent = 'UNIRSE A LA MESA';
            }
        });

        try {
            const resultadoUnion = await gestorRed.unirseASala(codigoSala, {
                nombre,
                avatar,
                fichasIniciales: fichas
            });

            estadoJuego.modo = 'CLIENTE_ONLINE';
            estadoJuego.codigoSala = resultadoUnion.roomCode;
            estadoJuego.miIdJugador = resultadoUnion.myId;
            estadoJuego.miAsiento = resultadoUnion.mySeat;

            if (resultadoUnion.players && Array.isArray(resultadoUnion.players)) {
                estadoJuego.jugadores = resultadoUnion.players.map(sp => ({
                    ...sp,
                    id: sp.id || sp.peerId,
                    peerId: sp.peerId || sp.id,
                    nombre: sp.nombre || sp.name,
                    name: sp.nombre || sp.name,
                    avatar: sp.avatar || 'navy',
                    fichas: sp.fichas || sp.chips,
                    chips: sp.fichas || sp.chips,
                    asiento: sp.asiento ?? sp.seat,
                    seat: sp.asiento ?? sp.seat,
                    cartasMano: [],
                    holeCards: [],
                    apuestaRondaActual: sp.apuestaRondaActual || sp.currentRoundBet || 0,
                    currentRoundBet: sp.apuestaRondaActual || sp.currentRoundBet || 0,
                    apuestaTotal: sp.apuestaTotal || sp.totalBet || 0,
                    totalBet: sp.apuestaTotal || sp.totalBet || 0,
                    retirado: sp.retirado || sp.folded || false,
                    folded: sp.retirado || sp.folded || false,
                    estaTodoDentro: sp.estaTodoDentro || sp.isAllIn || false,
                    isAllIn: sp.estaTodoDentro || sp.isAllIn || false
                }));
            }

            configurarInterfazSala(resultadoUnion.roomCode);
            INTERFAZ.modalLobby.style.display = 'none';
            dibujarMesa();
            mostrarAviso(`Conectado a la mesa ${resultadoUnion.roomCode}.`);
            agregarMensajeChat('Mesa', `Te has incorporado como ${nombre}.`);
        } catch (err) {
            console.error(err);
            mostrarAviso(err.message || 'Error al conectar con la mesa.');
            INTERFAZ.botonIniciarJuego.disabled = false;
            INTERFAZ.botonIniciarJuego.textContent = 'UNIRSE A LA MESA';
        }
    }

    // 3. MESA LOCAL (PASE Y JUEGUE)
    function iniciarMesaLocal(cantidadJugadores, nombreAnfitrion, avatarAnfitrion, fichas) {
        estadoJuego.modo = 'MESA_LOCAL';
        estadoJuego.codigoSala = 'MESA-LOCAL';
        estadoJuego.miAsiento = 0;

        estadoJuego.jugadores = [];

        for (let i = 0; i < cantidadJugadores; i++) {
            const clavePaleta = CLAVES_PALETA[i % CLAVES_PALETA.length];
            estadoJuego.jugadores.push({
                id: `jugador-local-${i}`,
                nombre: i === 0 ? nombreAnfitrion : `Jugador ${i + 1}`,
                name: i === 0 ? nombreAnfitrion : `Jugador ${i + 1}`,
                avatar: i === 0 ? avatarAnfitrion : clavePaleta,
                fichas: fichas,
                chips: fichas,
                asiento: i,
                seat: i,
                cartasMano: [],
                holeCards: [],
                apuestaRondaActual: 0,
                currentRoundBet: 0,
                apuestaTotal: 0,
                totalBet: 0,
                retirado: false,
                folded: false,
                estaTodoDentro: false,
                isAllIn: false,
                esAnfitrion: i === 0,
                isHost: i === 0
            });
        }

        estadoJuego.miIdJugador = estadoJuego.jugadores[0].id;

        INTERFAZ.insigniaSala.style.display = 'flex';
        INTERFAZ.etiquetaCodigoSala.textContent = 'LOCAL';
        INTERFAZ.modalLobby.style.display = 'none';

        dibujarMesa();
        mostrarAviso('Mesa local lista. Usa "Ocultar cartas" para pasarte el turno.');
        agregarMensajeChat('Mesa', 'Mesa local iniciada. Repartiendo cartas...');

        setTimeout(() => {
            iniciarNuevaMano();
        }, 1200);
    }

    function configurarInterfazSala(codigo) {
        INTERFAZ.insigniaSala.style.display = 'flex';
        INTERFAZ.etiquetaCodigoSala.textContent = codigo;

        INTERFAZ.insigniaSala.addEventListener('click', () => {
            const url = `${window.location.origin}${window.location.pathname}?sala=${codigo}`;
            navigator.clipboard.writeText(url).then(() => {
                mostrarAviso('Enlace copiado al portapapeles.');
            }).catch(() => {
                mostrarAviso(`Código de mesa: ${codigo}`);
            });
        });
    }

    // ==========================================
    // MOTOR DE JUEGO
    // ==========================================

    function comprobarAutoInicioMano() {
        if (estadoJuego.modo === 'CLIENTE_ONLINE') return;
        if (estadoJuego.jugadores.length >= 2 && estadoJuego.fase === 'ESPERANDO') {
            setTimeout(() => {
                if (estadoJuego.fase === 'ESPERANDO') {
                    iniciarNuevaMano();
                }
            }, 1500);
        }
    }

    function iniciarNuevaMano() {
        const jugadoresActivos = estadoJuego.jugadores.filter(j => (j.fichas || j.chips) > 0);
        if (jugadoresActivos.length < 2) {
            INTERFAZ.cartelEstadoRonda.textContent = 'Esperando al menos a 2 jugadores con fichas...';
            estadoJuego.fase = 'ESPERANDO';
            dibujarMesa();
            transmitirEstado();
            return;
        }

        estadoJuego.asientoRepartidor = obtenerSiguienteAsientoActivo(estadoJuego.asientoRepartidor);
        estadoJuego.baraja = window.MotorPoker.barajar(window.MotorPoker.crearBaraja());
        estadoJuego.cartasComunitarias = [];
        estadoJuego.bote = 0;
        estadoJuego.apuestaActual = 0;
        estadoJuego.asientoUltimoAgresor = null;
        estadoJuego.jugadoresQueHanActuado.clear();
        estadoJuego.fase = 'PREFLOP';

        estadoJuego.jugadores.forEach(j => {
            j.cartasMano = [];
            j.holeCards = [];
            j.apuestaRondaActual = 0;
            j.currentRoundBet = 0;
            j.apuestaTotal = 0;
            j.totalBet = 0;
            j.retirado = (j.fichas || j.chips) <= 0;
            j.folded = j.retirado;
            j.estaTodoDentro = false;
            j.isAllIn = false;
            j.ultimaAccion = null;
            j.lastAction = null;
        });

        // Repartir 2 cartas privadas a cada jugador activo
        estadoJuego.jugadores.forEach(j => {
            if (!j.retirado) {
                const c1 = estadoJuego.baraja.pop();
                const c2 = estadoJuego.baraja.pop();
                j.cartasMano = [c1, c2];
                j.holeCards = j.cartasMano;
            }
        });

        // Cobro de Ciegas
        const asientoSB = jugadoresActivos.length === 2 ? estadoJuego.asientoRepartidor : obtenerSiguienteAsientoActivo(estadoJuego.asientoRepartidor);
        const asientoBB = obtenerSiguienteAsientoActivo(asientoSB);

        const jugadorSB = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === asientoSB);
        const jugadorBB = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === asientoBB);

        // Ciega Pequeña
        const fichasSB = jugadorSB.fichas || jugadorSB.chips;
        const montoSB = Math.min(fichasSB, estadoJuego.ciegaPequena);
        jugadorSB.fichas -= montoSB;
        jugadorSB.chips = jugadorSB.fichas;
        jugadorSB.apuestaRondaActual = montoSB;
        jugadorSB.currentRoundBet = montoSB;
        jugadorSB.apuestaTotal = montoSB;
        jugadorSB.totalBet = montoSB;
        estadoJuego.bote += montoSB;
        jugadorSB.ultimaAccion = `C. PEQUEÑA $${montoSB}`;
        jugadorSB.lastAction = jugadorSB.ultimaAccion;

        // Ciega Grande
        const fichasBB = jugadorBB.fichas || jugadorBB.chips;
        const montoBB = Math.min(fichasBB, estadoJuego.ciegaGrande);
        jugadorBB.fichas -= montoBB;
        jugadorBB.chips = jugadorBB.fichas;
        jugadorBB.apuestaRondaActual = montoBB;
        jugadorBB.currentRoundBet = montoBB;
        jugadorBB.apuestaTotal = montoBB;
        jugadorBB.totalBet = montoBB;
        estadoJuego.bote += montoBB;
        jugadorBB.ultimaAccion = `C. GRANDE $${montoBB}`;
        jugadorBB.lastAction = jugadorBB.ultimaAccion;

        estadoJuego.apuestaActual = estadoJuego.ciegaGrande;
        estadoJuego.subidaMinima = estadoJuego.ciegaGrande;
        estadoJuego.asientoTurnoActual = obtenerSiguienteAsientoActivo(asientoBB);

        window.EfectosAudio.reproducirRepartoCarta();
        window.EfectosAudio.reproducirTintineoFichas(3);

        const nombreSB = jugadorSB.nombre || jugadorSB.name;
        const nombreBB = jugadorBB.nombre || jugadorBB.name;
        INTERFAZ.cartelEstadoRonda.textContent = `Mano en juego: Cartas privadas | Ciega Pequeña: ${nombreSB} | Ciega Grande: ${nombreBB}`;

        if (estadoJuego.modo === 'ANFITRION_ONLINE' && gestorRed) {
            estadoJuego.jugadores.forEach(j => {
                if (j.id === estadoJuego.miIdJugador) {
                    estadoJuego.misCartasMano = j.cartasMano;
                } else {
                    gestorRed.enviarAPar(j.peerId, {
                        type: 'PRIVATE_CARDS',
                        payload: { cards: j.cartasMano }
                    });
                }
            });
        } else if (estadoJuego.modo === 'MESA_LOCAL') {
            estadoJuego.misCartasMano = estadoJuego.jugadores[estadoJuego.asientoTurnoActual].cartasMano;
        }

        dibujarMesa();
        actualizarControles();
        transmitirEstado();
    }

    function obtenerSiguienteAsientoActivo(asientoActual) {
        let siguiente = (asientoActual + 1) % 6;
        for (let i = 0; i < 6; i++) {
            const j = estadoJuego.jugadores.find(p => (p.asiento ?? p.seat) === siguiente && !p.retirado && (p.fichas || p.chips) > 0);
            if (j) return siguiente;
            siguiente = (siguiente + 1) % 6;
        }
        return asientoActual;
    }

    function obtenerJugadoresEnMano() {
        return estadoJuego.jugadores.filter(j => !j.retirado && !j.folded);
    }

    function obtenerJugadoresElegiblesParaActuar() {
        return estadoJuego.jugadores.filter(j => !j.retirado && !j.folded && !j.estaTodoDentro && !j.isAllIn && (j.fichas || j.chips) > 0);
    }

    // ==========================================
    // PROCESAMIENTO DE ACCIONES
    // ==========================================

    function gestionarAccionJugador(asiento, accion, cantidadSubida = 0) {
        if (estadoJuego.fase === 'CONFRONTACION' || estadoJuego.fase === 'ESPERANDO') return;

        const jugador = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === asiento);
        if (!jugador || jugador.retirado || jugador.estaTodoDentro) return;

        const diferenciaIgualar = estadoJuego.apuestaActual - (jugador.apuestaRondaActual || jugador.currentRoundBet || 0);
        const nombreJ = jugador.nombre || jugador.name;

        if (accion === 'FOLD' || accion === 'NO_IR') {
            jugador.retirado = true;
            jugador.folded = true;
            jugador.ultimaAccion = 'NO VA';
            jugador.lastAction = 'NO VA';
            window.EfectosAudio.reproducirRetirada();
            mostrarAviso(`${nombreJ} no va.`);
        } else if (accion === 'CHECK' || accion === 'PASAR') {
            jugador.ultimaAccion = 'PASA';
            jugador.lastAction = 'PASA';
            window.EfectosAudio.reproducirToquePaso();
            mostrarAviso(`${nombreJ} pasa.`);
        } else if (accion === 'CALL' || accion === 'IGUALAR') {
            const fichasDisponibles = jugador.fichas || jugador.chips;
            const montoPagar = Math.min(diferenciaIgualar, fichasDisponibles);
            jugador.fichas -= montoPagar;
            jugador.chips = jugador.fichas;
            jugador.apuestaRondaActual = (jugador.apuestaRondaActual || 0) + montoPagar;
            jugador.currentRoundBet = jugador.apuestaRondaActual;
            jugador.apuestaTotal = (jugador.apuestaTotal || 0) + montoPagar;
            jugador.totalBet = jugador.apuestaTotal;
            estadoJuego.bote += montoPagar;

            if (jugador.fichas === 0) {
                jugador.estaTodoDentro = true;
                jugador.isAllIn = true;
            }

            jugador.ultimaAccion = jugador.estaTodoDentro ? 'TODO DENTRO' : `IGUALA $${montoPagar}`;
            jugador.lastAction = jugador.ultimaAccion;
            window.EfectosAudio.reproducirTintineoFichas(2);
            mostrarAviso(`${nombreJ} iguala $${montoPagar}.`);
        } else if (accion === 'RAISE' || accion === 'SUBIR') {
            const apuestaTotalRonda = cantidadSubida;
            const fichasAdicionales = apuestaTotalRonda - (jugador.apuestaRondaActual || 0);
            const apuestaReal = Math.min(fichasAdicionales, jugador.fichas || jugador.chips);

            jugador.fichas -= apuestaReal;
            jugador.chips = jugador.fichas;
            jugador.apuestaRondaActual = (jugador.apuestaRondaActual || 0) + apuestaReal;
            jugador.currentRoundBet = jugador.apuestaRondaActual;
            jugador.apuestaTotal = (jugador.apuestaTotal || 0) + apuestaReal;
            jugador.totalBet = jugador.apuestaTotal;
            estadoJuego.bote += apuestaReal;

            const incrementoSubida = jugador.apuestaRondaActual - estadoJuego.apuestaActual;
            if (incrementoSubida > estadoJuego.subidaMinima) {
                estadoJuego.subidaMinima = incrementoSubida;
            }
            estadoJuego.apuestaActual = jugador.apuestaRondaActual;
            estadoJuego.asientoUltimoAgresor = asiento;

            estadoJuego.jugadoresQueHanActuado.clear();

            if (jugador.fichas === 0) {
                jugador.estaTodoDentro = true;
                jugador.isAllIn = true;
            }

            jugador.ultimaAccion = jugador.estaTodoDentro ? 'TODO DENTRO' : `SUBE A $${jugador.apuestaRondaActual}`;
            jugador.lastAction = jugador.ultimaAccion;

            if (jugador.estaTodoDentro) {
                window.EfectosAudio.reproducirTodoDentro();
            } else {
                window.EfectosAudio.reproducirTintineoFichas(4);
            }
            mostrarAviso(`${nombreJ} sube a $${jugador.apuestaRondaActual}.`);
        }

        estadoJuego.jugadoresQueHanActuado.add(asiento);

        const jugadoresRestantes = obtenerJugadoresEnMano();
        if (jugadoresRestantes.length === 1) {
            gestionarGanadorPorRetirada(jugadoresRestantes[0]);
            return;
        }

        if (estaRondaApuestasCompleta()) {
            avanzarFase();
        } else {
            estadoJuego.asientoTurnoActual = obtenerSiguienteAsientoTurno(asiento);
            dibujarMesa();
            actualizarControles();
            transmitirEstado();
        }
    }

    function estaRondaApuestasCompleta() {
        const elegibles = obtenerJugadoresElegiblesParaActuar();
        if (elegibles.length <= 1) {
            const todosIgualados = elegibles.every(j => (j.apuestaRondaActual || 0) === estadoJuego.apuestaActual);
            if (todosIgualados && estadoJuego.jugadoresQueHanActuado.size >= elegibles.length) {
                return true;
            }
        }

        const todosHanActuado = elegibles.every(j => estadoJuego.jugadoresQueHanActuado.has(j.asiento ?? j.seat));
        const todasApuestasIgualadas = elegibles.every(j => (j.apuestaRondaActual || 0) === estadoJuego.apuestaActual);

        return todosHanActuado && todasApuestasIgualadas;
    }

    function obtenerSiguienteAsientoTurno(desdeAsiento) {
        let siguiente = (desdeAsiento + 1) % 6;
        for (let i = 0; i < 6; i++) {
            const j = estadoJuego.jugadores.find(p => (p.asiento ?? p.seat) === siguiente && !p.retirado && !p.estaTodoDentro && (p.fichas || p.chips) > 0);
            if (j) return siguiente;
            siguiente = (siguiente + 1) % 6;
        }
        return desdeAsiento;
    }

    // ==========================================
    // FASES COMUNITARIAS
    // ==========================================

    function avanzarFase() {
        estadoJuego.jugadores.forEach(j => {
            j.apuestaRondaActual = 0;
            j.currentRoundBet = 0;
            j.ultimaAccion = null;
            j.lastAction = null;
        });
        estadoJuego.apuestaActual = 0;
        estadoJuego.subidaMinima = estadoJuego.ciegaGrande;
        estadoJuego.jugadoresQueHanActuado.clear();
        estadoJuego.asientoUltimoAgresor = null;

        estadoJuego.asientoTurnoActual = obtenerSiguienteAsientoTurno(estadoJuego.asientoRepartidor);

        if (estadoJuego.fase === 'PREFLOP') {
            estadoJuego.fase = 'FLOP';
            estadoJuego.baraja.pop(); // Carta quemada
            estadoJuego.cartasComunitarias = [estadoJuego.baraja.pop(), estadoJuego.baraja.pop(), estadoJuego.baraja.pop()];
            window.EfectosAudio.reproducirRepartoCarta();
            INTERFAZ.cartelEstadoRonda.textContent = 'Fase: El Flop (primeras 3 comunitarias)';
        } else if (estadoJuego.fase === 'FLOP') {
            estadoJuego.fase = 'TURN';
            estadoJuego.baraja.pop(); // Carta quemada
            estadoJuego.cartasComunitarias.push(estadoJuego.baraja.pop());
            window.EfectosAudio.reproducirRepartoCarta();
            INTERFAZ.cartelEstadoRonda.textContent = 'Fase: El Turn (4ª carta comunitaria)';
        } else if (estadoJuego.fase === 'TURN') {
            estadoJuego.fase = 'RIVER';
            estadoJuego.baraja.pop(); // Carta quemada
            estadoJuego.cartasComunitarias.push(estadoJuego.baraja.pop());
            window.EfectosAudio.reproducirRepartoCarta();
            INTERFAZ.cartelEstadoRonda.textContent = 'Fase: El River (5ª carta final)';
        } else if (estadoJuego.fase === 'RIVER') {
            ejecutarConfrontacion();
            return;
        }

        const elegibles = obtenerJugadoresElegiblesParaActuar();
        if (elegibles.length <= 1) {
            dibujarMesa();
            transmitirEstado();
            setTimeout(() => avanzarFase(), 1600);
            return;
        }

        dibujarMesa();
        actualizarControles();
        transmitirEstado();
    }

    function gestionarGanadorPorRetirada(ganador) {
        ganador.fichas = (ganador.fichas || ganador.chips || 0) + estadoJuego.bote;
        ganador.chips = ganador.fichas;
        window.EfectosAudio.reproducirFanfarriaVictoria();

        const carga = {
            winnerName: ganador.nombre || ganador.name,
            handDesc: 'Todos los rivales se retiraron',
            potWon: estadoJuego.bote
        };

        mostrarGanadoresConfrontacion(carga);

        if (estadoJuego.modo === 'ANFITRION_ONLINE' && gestorRed) {
            gestorRed.emitirATodos({
                type: 'ROUND_WINNERS',
                payload: carga
            });
        }

        estadoJuego.fase = 'CONFRONTACION';
        dibujarMesa();
        transmitirEstado();

        setTimeout(() => {
            INTERFAZ.cartelGanadorShowdown.style.display = 'none';
            iniciarNuevaMano();
        }, 4000);
    }

    function ejecutarConfrontacion() {
        estadoJuego.fase = 'CONFRONTACION';

        const resultado = window.MotorPoker.resolverConfrontacion(estadoJuego.jugadores, estadoJuego.cartasComunitarias);

        Object.entries(resultado.pagos || resultado.payouts).forEach(([idJugador, monto]) => {
            const j = estadoJuego.jugadores.find(pl => pl.id === idJugador);
            if (j) {
                j.fichas = (j.fichas || j.chips || 0) + monto;
                j.chips = j.fichas;
            }
        });

        const cartasReveladas = {};
        estadoJuego.jugadores.forEach(j => {
            if (!j.retirado) cartasReveladas[j.id] = j.cartasMano;
        });

        const ganadoresPrimerBote = resultado.resultadosBote?.[0]?.ganadores || resultado.potResults?.[0]?.winners || [];
        const nombresGanador = ganadoresPrimerBote.map(g => g.nombre || g.name).join(' y ');
        const jugadaGanadora = ganadoresPrimerBote[0]?.jugada || ganadoresPrimerBote[0]?.hand || '';

        const carga = {
            winnerName: nombresGanador,
            handDesc: jugadaGanadora,
            potWon: estadoJuego.bote,
            revealedCards: cartasReveladas,
            payouts: resultado.pagos || resultado.payouts
        };

        window.EfectosAudio.reproducirFanfarriaVictoria();
        mostrarGanadoresConfrontacion(carga);

        if (estadoJuego.modo === 'ANFITRION_ONLINE' && gestorRed) {
            gestorRed.emitirATodos({
                type: 'ROUND_WINNERS',
                payload: carga
            });
        }

        dibujarMesa();
        transmitirEstado();

        setTimeout(() => {
            INTERFAZ.cartelGanadorShowdown.style.display = 'none';
            iniciarNuevaMano();
        }, 5000);
    }

    function mostrarGanadoresConfrontacion(carga) {
        INTERFAZ.nombreGanadorShowdown.textContent = carga.winnerName;
        INTERFAZ.jugadaGanadorShowdown.textContent = carga.handDesc;
        INTERFAZ.boteGanadoShowdown.textContent = `+$${carga.potWon}`;
        INTERFAZ.cartelGanadorShowdown.style.display = 'block';

        if (carga.revealedCards) {
            Object.entries(carga.revealedCards).forEach(([id, cartas]) => {
                const j = estadoJuego.jugadores.find(pl => pl.id === id);
                if (j) {
                    j.cartasMano = cartas;
                    j.holeCards = cartas;
                }
            });
            dibujarMesa();
        }
    }

    // ==========================================
    // SINCRONIZACIÓN DE RED
    // ==========================================

    function gestionarAccionJugadorRemoto(idPar, carga) {
        const jugador = estadoJuego.jugadores.find(j => j.id === idPar);
        if (!jugador || (jugador.asiento ?? jugador.seat) !== estadoJuego.asientoTurnoActual) return;

        gestionarAccionJugador(jugador.asiento ?? jugador.seat, carga.action || carga.tipoAccion, carga.amount || carga.cantidad);
    }

    function transmitirEstado() {
        if (estadoJuego.modo !== 'ANFITRION_ONLINE' || !gestorRed) return;

        const jugadoresPublicos = estadoJuego.jugadores.map(j => ({
            id: j.id,
            name: j.nombre || j.name,
            avatar: j.avatar,
            chips: j.fichas || j.chips,
            seat: j.asiento ?? j.seat,
            currentRoundBet: j.apuestaRondaActual || j.currentRoundBet,
            totalBet: j.apuestaTotal || j.totalBet,
            folded: j.retirado || j.folded,
            isAllIn: j.estaTodoDentro || j.isAllIn,
            lastAction: j.ultimaAccion || j.lastAction,
            hasCards: (j.cartasMano && j.cartasMano.length > 0) || (j.holeCards && j.holeCards.length > 0),
            holeCards: (estadoJuego.fase === 'CONFRONTACION' && !j.retirado) ? j.cartasMano : null
        }));

        gestorRed.emitirATodos({
            type: 'GAME_STATE_UPDATE',
            payload: {
                players: jugadoresPublicos,
                communityCards: estadoJuego.cartasComunitarias,
                pot: estadoJuego.bote,
                currentBet: estadoJuego.apuestaActual,
                minRaise: estadoJuego.subidaMinima,
                stage: estadoJuego.fase,
                dealerSeat: estadoJuego.asientoRepartidor,
                currentTurnSeat: estadoJuego.asientoTurnoActual
            }
        });
    }

    function aplicarEstadoServidor(estado) {
        estadoJuego.cartasComunitarias = estado.communityCards;
        estadoJuego.bote = estado.pot;
        estadoJuego.apuestaActual = estado.currentBet;
        estadoJuego.subidaMinima = estado.minRaise;
        estadoJuego.fase = estado.stage;
        estadoJuego.asientoRepartidor = estado.dealerSeat;
        estadoJuego.asientoTurnoActual = estado.currentTurnSeat;

        estadoJuego.jugadores = estado.players.map(sp => {
            const existente = estadoJuego.jugadores.find(ej => ej.id === sp.id);
            return {
                ...sp,
                nombre: sp.name,
                fichas: sp.chips,
                asiento: sp.seat,
                apuestaRondaActual: sp.currentRoundBet,
                apuestaTotal: sp.totalBet,
                retirado: sp.folded,
                estaTodoDentro: sp.isAllIn,
                ultimaAccion: sp.lastAction,
                cartasMano: (sp.id === estadoJuego.miIdJugador && estadoJuego.misCartasMano.length > 0)
                    ? estadoJuego.misCartasMano
                    : (sp.holeCards || (existente ? existente.cartasMano : []))
            };
        });

        dibujarMesa();
        actualizarControles();
    }

    // ==========================================
    // DIBUJO DE LA MESA
    // ==========================================

    function dibujarMesa() {
        INTERFAZ.cantidadBote.textContent = `$${estadoJuego.bote.toLocaleString()}`;

        // 5 cartas comunitarias
        for (let i = 0; i < 5; i++) {
            const ranura = document.getElementById(`slot-${i}`);
            ranura.innerHTML = '';
            const carta = estadoJuego.cartasComunitarias[i];
            if (carta) {
                ranura.appendChild(crearElementoCarta(carta));
            }
        }

        // 6 Asientos
        for (let indiceAsiento = 0; indiceAsiento < 6; indiceAsiento++) {
            const elementoAsiento = document.getElementById(`seat-${indiceAsiento}`);
            elementoAsiento.innerHTML = '';

            const jugador = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === indiceAsiento);
            elementoAsiento.className = `player-seat seat-${indiceAsiento}`;

            if (!jugador) {
                const botonVacio = document.createElement('div');
                botonVacio.className = 'empty-seat-btn';
                botonVacio.innerHTML = `<span>+</span> <span>Asiento ${indiceAsiento + 1}</span>`;
                elementoAsiento.appendChild(botonVacio);
                continue;
            }

            const estaRetirado = jugador.retirado || jugador.folded;
            if (estaRetirado) elementoAsiento.classList.add('folded');

            const esSuTurno = (jugador.asiento ?? jugador.seat) === estadoJuego.asientoTurnoActual &&
                              estadoJuego.fase !== 'ESPERANDO' && estadoJuego.fase !== 'CONFRONTACION';
            if (esSuTurno) elementoAsiento.classList.add('active-turn');

            const cajaJugador = document.createElement('div');
            cajaJugador.className = 'player-box';

            const contenedorAvatar = document.createElement('div');
            contenedorAvatar.className = 'player-avatar-wrap';

            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            const iniciales = obtenerIniciales(jugador.nombre || jugador.name);
            const estilo = PALETA_ASIENTOS[jugador.avatar] || PALETA_ASIENTOS[CLAVES_PALETA[indiceAsiento % CLAVES_PALETA.length]] || { bg: '#26384a', color: '#e8edf3' };
            avatar.style.background = estilo.bg;
            avatar.style.color = estilo.color;
            avatar.textContent = iniciales;
            contenedorAvatar.appendChild(avatar);

            if ((jugador.asiento ?? jugador.seat) === estadoJuego.asientoRepartidor) {
                const botonD = document.createElement('div');
                botonD.className = 'dealer-button';
                botonD.textContent = 'D';
                botonD.title = 'Repartidor (Mano)';
                contenedorAvatar.appendChild(botonD);
            }
            cajaJugador.appendChild(contenedorAvatar);

            const info = document.createElement('div');
            info.className = 'player-info';

            const nombreElem = document.createElement('div');
            nombreElem.className = 'player-name';
            const nombreMostrar = jugador.nombre || jugador.name;
            nombreElem.textContent = nombreMostrar + (jugador.id === estadoJuego.miIdJugador ? ' (Tú)' : '');
            info.appendChild(nombreElem);

            const fichasElem = document.createElement('div');
            fichasElem.className = 'player-chips';
            const cantidadFichas = jugador.fichas ?? jugador.chips ?? 0;
            fichasElem.innerHTML = `<span class="pot-chip-disc" style="width: 9px; height: 9px;"></span> <span>$${cantidadFichas.toLocaleString()}</span>`;
            info.appendChild(fichasElem);

            cajaJugador.appendChild(info);

            const ultimaAccionTexto = jugador.ultimaAccion || jugador.lastAction;
            if (ultimaAccionTexto) {
                const insigniaAccion = document.createElement('div');
                insigniaAccion.className = 'player-action-badge';
                if (ultimaAccionTexto.includes('NO VA') || ultimaAccionTexto.includes('FOLD')) insigniaAccion.classList.add('fold');
                else if (ultimaAccionTexto.includes('PASA') || ultimaAccionTexto.includes('CHECK')) insigniaAccion.classList.add('check');
                else if (ultimaAccionTexto.includes('IGUALA') || ultimaAccionTexto.includes('CALL')) insigniaAccion.classList.add('call');
                else if (ultimaAccionTexto.includes('SUBE') || ultimaAccionTexto.includes('RAISE')) insigniaAccion.classList.add('raise');
                else if (ultimaAccionTexto.includes('TODO') || ultimaAccionTexto.includes('ALL-IN')) insigniaAccion.classList.add('allin');

                insigniaAccion.textContent = ultimaAccionTexto;
                insigniaAccion.style.display = 'block';
                cajaJugador.appendChild(insigniaAccion);
            }

            elementoAsiento.appendChild(cajaJugador);

            // Cartas de mano
            const contenedorCartas = document.createElement('div');
            contenedorCartas.className = 'player-cards';

            const esMiTurnoLocal = (estadoJuego.modo === 'MESA_LOCAL' && (jugador.asiento ?? jugador.seat) === estadoJuego.asientoTurnoActual);
            const esMiManoPropia = (jugador.id === estadoJuego.miIdJugador) || esMiTurnoLocal;

            const cartasManoJugador = jugador.cartasMano || jugador.holeCards;

            if (cartasManoJugador && cartasManoJugador.length === 2 && !estaRetirado) {
                if (esMiManoPropia && !estadoJuego.cartasOcultas) {
                    contenedorCartas.appendChild(crearElementoCarta(cartasManoJugador[0]));
                    contenedorCartas.appendChild(crearElementoCarta(cartasManoJugador[1]));
                } else if (estadoJuego.fase === 'CONFRONTACION') {
                    contenedorCartas.appendChild(crearElementoCarta(cartasManoJugador[0]));
                    contenedorCartas.appendChild(crearElementoCarta(cartasManoJugador[1]));
                } else {
                    contenedorCartas.appendChild(crearElementoReversoCarta());
                    contenedorCartas.appendChild(crearElementoReversoCarta());
                }
            } else if (!estaRetirado && jugador.hasCards) {
                contenedorCartas.appendChild(crearElementoReversoCarta());
                contenedorCartas.appendChild(crearElementoReversoCarta());
            }

            elementoAsiento.appendChild(contenedorCartas);

            // Apuesta en mesa
            const apuestaRonda = jugador.apuestaRondaActual ?? jugador.currentRoundBet ?? 0;
            if (apuestaRonda > 0) {
                const elementoApuesta = document.createElement('div');
                elementoApuesta.className = 'seat-bet';
                elementoApuesta.style.display = 'flex';
                elementoApuesta.innerHTML = `<span class="pot-chip-disc" style="width: 8px; height: 8px;"></span> <span>$${apuestaRonda}</span>`;
                elementoAsiento.appendChild(elementoApuesta);
            }
        }

        actualizarAsesorMano();
    }
    const renderTable = dibujarMesa;

    function crearElementoCarta(carta) {
        const div = document.createElement('div');
        const mapaPalos = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
        const palo = carta.palo || carta.suit;
        const rango = carta.rango || carta.rank;
        const clasePalo = mapaPalos[palo] || 'spades';
        div.className = `poker-card ${clasePalo}`;

        div.innerHTML = `
            <div class="card-top">
                <span class="card-rank">${rango}</span>
                <span class="card-suit">${palo}</span>
            </div>
            <div class="card-center-suit">${palo}</div>
            <div class="card-bottom">
                <span class="card-rank">${rango}</span>
                <span class="card-suit">${palo}</span>
            </div>
        `;
        return div;
    }

    function crearElementoReversoCarta() {
        const div = document.createElement('div');
        div.className = 'poker-card back';
        return div;
    }

    function actualizarAsesorMano() {
        let cartas = [];
        if (estadoJuego.modo === 'MESA_LOCAL') {
            const activo = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === estadoJuego.asientoTurnoActual);
            if (activo) cartas = activo.cartasMano || activo.holeCards;
        } else {
            cartas = estadoJuego.misCartasMano;
        }

        if (cartas && cartas.length === 2 && !estadoJuego.cartasOcultas) {
            const evaluacion = window.MotorPoker.evaluarMano(cartas, estadoJuego.cartasComunitarias);
            INTERFAZ.valorAsesorMano.textContent = evaluacion.desc || evaluacion.nombreTipo || evaluacion.typeName;
        } else if (estadoJuego.cartasOcultas) {
            INTERFAZ.valorAsesorMano.textContent = 'Cartas ocultas';
        } else {
            INTERFAZ.valorAsesorMano.textContent = 'Esperando mano...';
        }
    }

    // ==========================================
    // CONTROLES DE ACCIÓN
    // ==========================================

    function actualizarControles() {
        const jugadorActivo = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === estadoJuego.asientoTurnoActual);
        const esMiTurno = (estadoJuego.modo === 'MESA_LOCAL') ||
                         (jugadorActivo && jugadorActivo.id === estadoJuego.miIdJugador);

        if (!esMiTurno || !jugadorActivo || jugadorActivo.retirado || jugadorActivo.estaTodoDentro || estadoJuego.fase === 'CONFRONTACION' || estadoJuego.fase === 'ESPERANDO') {
            INTERFAZ.botonNoIr.disabled = true;
            INTERFAZ.botonPasarIgualar.disabled = true;
            INTERFAZ.botonSubir.disabled = true;
            INTERFAZ.deslizadorSubida.disabled = true;
            return;
        }

        window.EfectosAudio.reproducirAlertaTurno();

        INTERFAZ.botonNoIr.disabled = false;
        INTERFAZ.botonPasarIgualar.disabled = false;
        INTERFAZ.botonSubir.disabled = false;
        INTERFAZ.deslizadorSubida.disabled = false;

        const apuestaJugador = jugadorActivo.apuestaRondaActual || jugadorActivo.currentRoundBet || 0;
        const diferencia = estadoJuego.apuestaActual - apuestaJugador;

        if (diferencia <= 0) {
            INTERFAZ.etiquetaPasarIgualar.textContent = 'PASAR';
            INTERFAZ.subetiquetaPasarIgualar.textContent = 'Paso';
            INTERFAZ.botonPasarIgualar.className = 'btn-action btn-check';
        } else {
            const fichasJ = jugadorActivo.fichas ?? jugadorActivo.chips ?? 0;
            const montoPagar = Math.min(diferencia, fichasJ);
            INTERFAZ.etiquetaPasarIgualar.textContent = 'IGUALAR';
            INTERFAZ.subetiquetaPasarIgualar.textContent = `Pagar $${montoPagar}`;
            INTERFAZ.botonPasarIgualar.className = 'btn-action btn-call';
        }

        const subidaMinimaTotal = estadoJuego.apuestaActual + estadoJuego.subidaMinima;
        const fichasTotal = (jugadorActivo.fichas ?? jugadorActivo.chips ?? 0) + apuestaJugador;

        if (fichasTotal <= estadoJuego.apuestaActual) {
            INTERFAZ.botonSubir.disabled = true;
            INTERFAZ.deslizadorSubida.disabled = true;
        } else {
            INTERFAZ.deslizadorSubida.min = Math.min(subidaMinimaTotal, fichasTotal);
            INTERFAZ.deslizadorSubida.max = fichasTotal;
            INTERFAZ.deslizadorSubida.value = Math.min(subidaMinimaTotal, fichasTotal);
            actualizarEtiquetaSubida();
        }
    }
    const updateControls = actualizarControles;

    function actualizarEtiquetaSubida() {
        const valor = parseInt(INTERFAZ.deslizadorSubida.value, 10);
        INTERFAZ.etiquetaCantidadSubida.textContent = `$${valor}`;
    }

    INTERFAZ.deslizadorSubida.addEventListener('input', actualizarEtiquetaSubida);

    INTERFAZ.botonPreajusteMin.addEventListener('click', () => {
        INTERFAZ.deslizadorSubida.value = INTERFAZ.deslizadorSubida.min;
        actualizarEtiquetaSubida();
    });

    INTERFAZ.botonPreajuste2BB.addEventListener('click', () => {
        const val = Math.min(estadoJuego.ciegaGrande * 2.5, INTERFAZ.deslizadorSubida.max);
        INTERFAZ.deslizadorSubida.value = Math.max(val, INTERFAZ.deslizadorSubida.min);
        actualizarEtiquetaSubida();
    });

    INTERFAZ.botonPreajusteMedioBote.addEventListener('click', () => {
        const medioBote = Math.floor(estadoJuego.bote / 2);
        const val = Math.min(estadoJuego.apuestaActual + medioBote, INTERFAZ.deslizadorSubida.max);
        INTERFAZ.deslizadorSubida.value = Math.max(val, INTERFAZ.deslizadorSubida.min);
        actualizarEtiquetaSubida();
    });

    INTERFAZ.botonPreajusteBote.addEventListener('click', () => {
        const val = Math.min(estadoJuego.apuestaActual + estadoJuego.bote, INTERFAZ.deslizadorSubida.max);
        INTERFAZ.deslizadorSubida.value = Math.max(val, INTERFAZ.deslizadorSubida.min);
        actualizarEtiquetaSubida();
    });

    INTERFAZ.botonPreajusteTodo.addEventListener('click', () => {
        INTERFAZ.deslizadorSubida.value = INTERFAZ.deslizadorSubida.max;
        actualizarEtiquetaSubida();
    });

    INTERFAZ.botonNoIr.addEventListener('click', () => ejecutarAccionActual('FOLD'));

    INTERFAZ.botonPasarIgualar.addEventListener('click', () => {
        const jugadorActivo = estadoJuego.jugadores.find(j => (j.asiento ?? j.seat) === estadoJuego.asientoTurnoActual);
        if (!jugadorActivo) return;
        const diff = estadoJuego.apuestaActual - (jugadorActivo.apuestaRondaActual || jugadorActivo.currentRoundBet || 0);
        if (diff <= 0) {
            ejecutarAccionActual('CHECK');
        } else {
            ejecutarAccionActual('CALL');
        }
    });

    INTERFAZ.botonSubir.addEventListener('click', () => {
        const cantidad = parseInt(INTERFAZ.deslizadorSubida.value, 10);
        ejecutarAccionActual('RAISE', cantidad);
    });

    function ejecutarAccionActual(accion, cantidad = 0) {
        if (estadoJuego.modo === 'CLIENTE_ONLINE' && gestorRed) {
            gestorRed.enviarAccion(accion, cantidad);
            INTERFAZ.botonNoIr.disabled = true;
            INTERFAZ.botonPasarIgualar.disabled = true;
            INTERFAZ.botonSubir.disabled = true;
        } else {
            gestionarAccionJugador(estadoJuego.asientoTurnoActual, accion, cantidad);
        }
    }

    // Botón de Privacidad
    INTERFAZ.botonPrivacidad.addEventListener('click', () => {
        estadoJuego.cartasOcultas = !estadoJuego.cartasOcultas;
        if (INTERFAZ.textoPrivacidad) {
            INTERFAZ.textoPrivacidad.textContent = estadoJuego.cartasOcultas ? 'Mostrar cartas' : 'Ocultar cartas';
        }
        dibujarMesa();
    });

    // ==========================================
    // CONVERSACIÓN Y REACCIONES
    // ==========================================

    INTERFAZ.botonAlternarChat.addEventListener('click', () => {
        INTERFAZ.panelChat.classList.toggle('open');
        INTERFAZ.insigniaChatNoLeido.style.display = 'none';
    });

    INTERFAZ.botonCerrarChat.addEventListener('click', () => {
        INTERFAZ.panelChat.classList.remove('open');
    });

    INTERFAZ.formularioChat.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const texto = INTERFAZ.campoTextoChat.value.trim();
        if (!texto) return;

        if (gestorRed) {
            gestorRed.enviarChat(texto);
        } else {
            const jugadorActivo = estadoJuego.jugadores[estadoJuego.asientoTurnoActual] || estadoJuego.jugadores[0];
            agregarMensajeChat(jugadorActivo.nombre || jugadorActivo.name, texto);
        }
        INTERFAZ.campoTextoChat.value = '';
    });

    document.querySelectorAll('.quick-reaction-btn').forEach(boton => {
        boton.addEventListener('click', () => {
            const texto = boton.dataset.text;
            if (gestorRed) {
                gestorRed.enviarChat(texto);
            } else {
                const jugadorActivo = estadoJuego.jugadores[estadoJuego.asientoTurnoActual] || estadoJuego.jugadores[0];
                agregarMensajeChat(jugadorActivo.nombre || jugadorActivo.name, texto);
            }
        });
    });

    function agregarMensajeChat(remitente, texto) {
        const burbuja = document.createElement('div');
        burbuja.className = 'chat-bubble';
        burbuja.innerHTML = `
            <div class="sender">${remitente}</div>
            <div>${escaparHTML(texto)}</div>
        `;
        INTERFAZ.mensajesChat.appendChild(burbuja);
        INTERFAZ.mensajesChat.scrollTop = INTERFAZ.mensajesChat.scrollHeight;

        if (!INTERFAZ.panelChat.classList.contains('open')) {
            INTERFAZ.insigniaChatNoLeido.style.display = 'inline-block';
        }
    }

    function escaparHTML(cadena) {
        return cadena.replace(/[&<>'"]/g, 
            caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter] || caracter)
        );
    }

    // ==========================================
    // SONIDO Y MODALES AUXILIARES
    // ==========================================

    INTERFAZ.botonSonido.addEventListener('click', () => {
        const estaMudo = window.EfectosAudio.conmutarSilencio();
        if (INTERFAZ.iconoSonidoActivado && INTERFAZ.iconoSonidoDesactivado) {
            INTERFAZ.iconoSonidoActivado.style.display = estaMudo ? 'none' : 'block';
            INTERFAZ.iconoSonidoDesactivado.style.display = estaMudo ? 'block' : 'none';
        }
        mostrarAviso(estaMudo ? 'Sonido silenciado' : 'Sonido activado');
    });

    INTERFAZ.botonReglas.addEventListener('click', () => {
        INTERFAZ.modalReglas.style.display = 'flex';
    });

    INTERFAZ.botonCerrarReglas.addEventListener('click', () => {
        INTERFAZ.modalReglas.style.display = 'none';
    });

    INTERFAZ.botonSalir.addEventListener('click', () => {
        if (confirm('¿Seguro que deseas salir de la mesa actual?')) {
            if (gestorRed) gestorRed.destruir();
            window.location.href = window.location.pathname;
        }
    });

    // Atajos de teclado para Blackjack (C: Ir / V: Plantarse / Espacio: Nueva Mano)
    document.addEventListener('keydown', (e) => {
        if (modoJuegoActual !== 'BLACKJACK') return;
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        const tecla = e.key.toLowerCase();
        if (tecla === 'c') {
            window.ControladorBlackjack.pedirCarta();
        } else if (tecla === 'v') {
            window.ControladorBlackjack.plantarse();
        } else if (e.code === 'Space' || tecla === ' ' || tecla === 'n') {
            e.preventDefault();
            window.ControladorBlackjack.nuevaMano();
        }
    });
});
