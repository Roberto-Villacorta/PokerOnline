/**
 * POKER ROYALE - LÓGICA PRINCIPAL DE LA APLICACIÓN
 * Gestiona el flujo de juego de Texas Hold'em, interfaz de usuario,
 * modo multijugador online P2P y modo mesa local.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================
    const gameState = {
        mode: 'ONLINE_HOST', // 'ONLINE_HOST', 'ONLINE_CLIENT', 'LOCAL_TABLE'
        roomCode: null,
        players: [],         // Array de jugadores en la mesa
        myPlayerId: null,
        mySeat: 0,
        dealerSeat: 0,
        currentTurnSeat: 0,
        stage: 'WAITING',    // 'WAITING', 'PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'
        deck: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,       // Apuesta más alta de la ronda actual
        minRaise: 20,
        smallBlind: 10,
        bigBlind: 20,
        initialChips: 3000,
        privacyHidden: false,
        myHoleCards: [],
        lastAggressorSeat: null,
        playersActedThisRound: new Set(),
        turnTimer: null
    };

    let multiplayer = null;

    // ==========================================
    // ELEMENTOS DEL DOM
    // ==========================================
    const UI = {
        // Encabezado
        roomBadge: document.getElementById('roomBadge'),
        roomCodeDisplay: document.getElementById('roomCodeDisplay'),
        btnSound: document.getElementById('btnSound'),
        soundIcon: document.getElementById('soundIcon'),
        btnRules: document.getElementById('btnRules'),
        btnToggleChat: document.getElementById('btnToggleChat'),
        unreadChatBadge: document.getElementById('unreadChatBadge'),
        btnLeave: document.getElementById('btnLeave'),
        
        // Mesa & Zona Comunitaria
        potAmount: document.getElementById('potAmount'),
        communityCards: document.getElementById('communityCards'),
        roundStatusBanner: document.getElementById('roundStatusBanner'),
        showdownBanner: document.getElementById('showdownBanner'),
        showdownWinnerName: document.getElementById('showdownWinnerName'),
        showdownHandName: document.getElementById('showdownHandName'),
        showdownPotWon: document.getElementById('showdownPotWon'),
        seatsContainer: document.getElementById('seatsContainer'),
        
        // Acciones y Asesor de Mano
        handAdvisorVal: document.getElementById('handAdvisorVal'),
        btnTogglePrivacy: document.getElementById('btnTogglePrivacy'),
        privacyIcon: document.getElementById('privacyIcon'),
        privacyText: document.getElementById('privacyText'),
        btnFold: document.getElementById('btnFold'),
        btnCheckCall: document.getElementById('btnCheckCall'),
        checkCallLabel: document.getElementById('checkCallLabel'),
        checkCallSub: document.getElementById('checkCallSub'),
        btnRaise: document.getElementById('btnRaise'),
        raiseAmountLabel: document.getElementById('raiseAmountLabel'),
        raiseSlider: document.getElementById('raiseSlider'),
        btnPresetMin: document.getElementById('btnPresetMin'),
        btnPreset2BB: document.getElementById('btnPreset2BB'),
        btnPresetHalfPot: document.getElementById('btnPresetHalfPot'),
        btnPresetPot: document.getElementById('btnPresetPot'),
        btnPresetAllIn: document.getElementById('btnPresetAllIn'),

        // Chat
        chatDrawer: document.getElementById('chatDrawer'),
        btnCloseChat: document.getElementById('btnCloseChat'),
        chatMessages: document.getElementById('chatMessages'),
        chatForm: document.getElementById('chatForm'),
        chatInput: document.getElementById('chatInput'),

        // Modales
        lobbyModal: document.getElementById('lobbyModal'),
        tabCreate: document.getElementById('tabCreate'),
        tabJoin: document.getElementById('tabJoin'),
        tabLocal: document.getElementById('tabLocal'),
        playerNameInput: document.getElementById('playerNameInput'),
        avatarSelector: document.getElementById('avatarSelector'),
        createRoomOptions: document.getElementById('createRoomOptions'),
        joinRoomOptions: document.getElementById('joinRoomOptions'),
        localTableOptions: document.getElementById('localTableOptions'),
        initialChipsSelect: document.getElementById('initialChipsSelect'),
        blindsSelect: document.getElementById('blindsSelect'),
        roomCodeInput: document.getElementById('roomCodeInput'),
        localPlayersCount: document.getElementById('localPlayersCount'),
        btnStartGame: document.getElementById('btnStartGame'),
        rulesModal: document.getElementById('rulesModal'),
        btnCloseRules: document.getElementById('btnCloseRules'),
        toastContainer: document.getElementById('toastContainer')
    };

    // ==========================================
    // NOTIFICACIONES TOAST
    // ==========================================
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        UI.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ==========================================
    // PALETA HUMANIZADA Y UTILIDADES DE AVATAR
    // ==========================================
    const AVATAR_PALETTE = {
        'navy': { bg: '#26384a', color: '#e8edf3' },
        'moss': { bg: '#273d2f', color: '#e2eee6' },
        'wine': { bg: '#4d242c', color: '#fae8eb' },
        'amber': { bg: '#4b3924', color: '#faeee0' },
        'slate': { bg: '#2d333b', color: '#e6ebf1' },
        'copper': { bg: '#3d2c29', color: '#f5eae8' }
    };
    const PALETTE_KEYS = ['navy', 'moss', 'wine', 'amber', 'slate', 'copper'];

    function getInitials(name) {
        if (!name) return 'J';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    // ==========================================
    // GESTIÓN DEL LOBBY Y PESTAÑAS
    // ==========================================
    let selectedTab = 'create';
    let selectedAvatar = 'navy';

    // Manejo de parámetros en la URL (ej. ?sala=PKR-1234)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('sala') || urlParams.get('room');
    if (roomParam) {
        setLobbyTab('join');
        UI.roomCodeInput.value = roomParam.toUpperCase();
    }

    UI.tabCreate.addEventListener('click', () => setLobbyTab('create'));
    UI.tabJoin.addEventListener('click', () => setLobbyTab('join'));
    UI.tabLocal.addEventListener('click', () => setLobbyTab('local'));

    function setLobbyTab(tab) {
        selectedTab = tab;
        [UI.tabCreate, UI.tabJoin, UI.tabLocal].forEach(b => b.classList.remove('active'));
        UI.createRoomOptions.style.display = 'none';
        UI.joinRoomOptions.style.display = 'none';
        UI.localTableOptions.style.display = 'none';

        if (tab === 'create') {
            UI.tabCreate.classList.add('active');
            UI.createRoomOptions.style.display = 'block';
            UI.btnStartGame.textContent = 'CREAR MESA ONLINE';
        } else if (tab === 'join') {
            UI.tabJoin.classList.add('active');
            UI.joinRoomOptions.style.display = 'block';
            UI.btnStartGame.textContent = 'UNIRSE A LA MESA';
        } else if (tab === 'local') {
            UI.tabLocal.classList.add('active');
            UI.localTableOptions.style.display = 'block';
            UI.btnStartGame.textContent = 'INICIAR MESA LOCAL';
        }
    }

    // Selector de insignias de asiento
    UI.avatarSelector.addEventListener('click', (e) => {
        const opt = e.target.closest('.avatar-option');
        if (opt) {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            opt.classList.add('selected');
            selectedAvatar = opt.dataset.avatar || 'navy';
        }
    });

    // Iniciar el juego desde el Lobby
    UI.btnStartGame.addEventListener('click', async () => {
        const playerName = UI.playerNameInput.value.trim() || 'Jugador 1';
        const initialChips = parseInt(UI.initialChipsSelect.value, 10) || 1000;
        const [sb, bb] = (UI.blindsSelect.value || '10/20').split('/').map(Number);

        gameState.initialChips = initialChips;
        gameState.smallBlind = sb;
        gameState.bigBlind = bb;
        gameState.minRaise = bb;

        if (selectedTab === 'create') {
            await startOnlineHost(playerName, selectedAvatar, initialChips);
        } else if (selectedTab === 'join') {
            const code = UI.roomCodeInput.value.trim();
            if (!code) {
                showToast('Introduce un código de sala válido.');
                return;
            }
            await startOnlineClient(code, playerName, selectedAvatar, initialChips);
        } else if (selectedTab === 'local') {
            const count = parseInt(UI.localPlayersCount.value, 10) || 2;
            startLocalTable(count, playerName, selectedAvatar, initialChips);
        }
    });

    // ==========================================
    // INICIALIZACIÓN DE MODOS DE JUEGO
    // ==========================================

    // 1. ANFITRIÓN ONLINE (P2P Host)
    async function startOnlineHost(name, avatar, chips) {
        UI.btnStartGame.disabled = true;
        UI.btnStartGame.textContent = 'Creando mesa...';

        multiplayer = new MultiplayerManager({
            onPlayerJoined: (player) => {
                showToast(`${player.name} se ha sentado en la mesa`);
                addChatMessage('Mesa', `${player.name} se ha incorporado.`);
                window.AudioFX.playCardDeal();
                renderTable();
                broadcastState();
                checkAutoStartHand();
            },
            onPlayerLeft: (player) => {
                showToast(`${player.name} ha dejado su asiento`);
                addChatMessage('Mesa', `${player.name} ha salido.`);
                renderTable();
                broadcastState();
            },
            onPlayerAction: (peerId, actionPayload) => {
                handleRemotePlayerAction(peerId, actionPayload);
            },
            onChatMessage: (msg) => {
                addChatMessage(msg.senderName, msg.text);
            },
            onError: (err) => {
                showToast('Error de conexión P2P: ' + err.message);
                UI.btnStartGame.disabled = false;
                UI.btnStartGame.textContent = 'CREAR MESA ONLINE';
            }
        });

        try {
            const roomCode = MultiplayerManager.generateRoomId();
            const roomInfo = await multiplayer.createRoom(roomCode, {
                name,
                avatar,
                initialChips: chips
            });

            gameState.mode = 'ONLINE_HOST';
            gameState.roomCode = roomInfo.roomCode;
            gameState.myPlayerId = roomInfo.peerId;
            gameState.mySeat = 0;

            gameState.players = [{
                id: roomInfo.peerId,
                peerId: roomInfo.peerId,
                name: name,
                avatar: avatar,
                chips: chips,
                seat: 0,
                holeCards: [],
                currentRoundBet: 0,
                totalBet: 0,
                folded: false,
                isAllIn: false,
                isHost: true
            }];

            setupRoomUI(roomInfo.roomCode);
            UI.lobbyModal.style.display = 'none';
            renderTable();
            showToast(`Mesa ${roomInfo.roomCode} lista.`);
            addChatMessage('Mesa', `Mesa creada. Código: ${roomInfo.roomCode}. Esperando jugadores.`);
        } catch (err) {
            console.error(err);
            showToast('No se pudo crear la sala. Revisa la conexión.');
            UI.btnStartGame.disabled = false;
            UI.btnStartGame.textContent = 'CREAR MESA';
        }
    }

    // 2. CLIENTE ONLINE (P2P Guest)
    async function startOnlineClient(roomCode, name, avatar, chips) {
        UI.btnStartGame.disabled = true;
        UI.btnStartGame.textContent = 'Conectando a la mesa...';

        multiplayer = new MultiplayerManager({
            onGameStateUpdate: (serverState) => {
                applyServerState(serverState);
            },
            onPrivateCards: (cards) => {
                gameState.myHoleCards = cards;
                const me = gameState.players.find(p => p.id === gameState.myPlayerId);
                if (me) me.holeCards = cards;
                window.AudioFX.playCardDeal();
                renderTable();
                updateControls();
            },
            onChatMessage: (msg) => {
                addChatMessage(msg.senderName, msg.text);
            },
            onRoundWinners: (winnersPayload) => {
                displayShowdownWinners(winnersPayload);
            },
            onDisconnected: (reason) => {
                showToast(reason);
            },
            onError: (err) => {
                showToast('Error: ' + err.message);
                UI.btnStartGame.disabled = false;
                UI.btnStartGame.textContent = 'UNIRSE A LA MESA';
            }
        });

        try {
            const joinResult = await multiplayer.joinRoom(roomCode, {
                name,
                avatar,
                initialChips: chips
            });

            gameState.mode = 'ONLINE_CLIENT';
            gameState.roomCode = joinResult.roomCode;
            gameState.myPlayerId = joinResult.myId;
            gameState.mySeat = joinResult.mySeat;

            setupRoomUI(joinResult.roomCode);
            UI.lobbyModal.style.display = 'none';
            showToast(`Conectado a la mesa ${joinResult.roomCode}.`);
            addChatMessage('Mesa', `Te has unido como ${name}.`);
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Error al conectar con la sala.');
            UI.btnStartGame.disabled = false;
            UI.btnStartGame.textContent = 'UNIRSE A LA MESA';
        }
    }

    // 3. MESA LOCAL (Pase y juegue / Misma pantalla)
    function startLocalTable(playerCount, hostName, hostAvatar, chips) {
        gameState.mode = 'LOCAL_TABLE';
        gameState.roomCode = 'MESA-LOCAL';
        gameState.mySeat = 0;

        gameState.players = [];

        for (let i = 0; i < playerCount; i++) {
            const paletteKey = PALETTE_KEYS[i % PALETTE_KEYS.length];
            gameState.players.push({
                id: `local-player-${i}`,
                name: i === 0 ? hostName : `Jugador ${i + 1}`,
                avatar: i === 0 ? hostAvatar : paletteKey,
                chips: chips,
                seat: i,
                holeCards: [],
                currentRoundBet: 0,
                totalBet: 0,
                folded: false,
                isAllIn: false,
                isHost: i === 0
            });
        }

        gameState.myPlayerId = gameState.players[0].id;

        UI.roomBadge.style.display = 'flex';
        UI.roomCodeDisplay.textContent = 'LOCAL';
        UI.lobbyModal.style.display = 'none';

        renderTable();
        showToast('Mesa local lista. Usa "Ocultar cartas" para pasarte el turno.');
        addChatMessage('Mesa', 'Mesa local iniciada. Repartiendo cartas...');

        setTimeout(() => {
            startNewHand();
        }, 1200);
    }

    function setupRoomUI(code) {
        UI.roomBadge.style.display = 'flex';
        UI.roomCodeDisplay.textContent = code;

        UI.roomBadge.addEventListener('click', () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?sala=${code}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('Enlace copiado al portapapeles.');
            }).catch(() => {
                showToast(`Código de mesa: ${code}`);
            });
        });
    }

    // ==========================================
    // MOTOR DE JUEGO DE TEXAS HOLD'EM (HOST & LOCAL)
    // ==========================================

    function checkAutoStartHand() {
        if (gameState.mode === 'ONLINE_CLIENT') return;
        // Si hay al menos 2 jugadores y estamos esperando, comenzar
        if (gameState.players.length >= 2 && gameState.stage === 'WAITING') {
            setTimeout(() => {
                if (gameState.stage === 'WAITING') {
                    startNewHand();
                }
            }, 1500);
        }
    }

    function startNewHand() {
        const activePlayers = gameState.players.filter(p => p.chips > 0);
        if (activePlayers.length < 2) {
            UI.roundStatusBanner.textContent = 'Esperando a que haya al menos 2 jugadores con fichas...';
            gameState.stage = 'WAITING';
            renderTable();
            broadcastState();
            return;
        }

        // Rotar dealer
        gameState.dealerSeat = getNextActiveSeat(gameState.dealerSeat);
        gameState.deck = window.PokerEngine.shuffleDeck(window.PokerEngine.createDeck());
        gameState.communityCards = [];
        gameState.pot = 0;
        gameState.currentBet = 0;
        gameState.lastAggressorSeat = null;
        gameState.playersActedThisRound.clear();
        gameState.stage = 'PREFLOP';

        // Resetear estados de cada jugador
        gameState.players.forEach(p => {
            p.holeCards = [];
            p.currentRoundBet = 0;
            p.totalBet = 0;
            p.folded = p.chips <= 0;
            p.isAllIn = false;
            p.lastAction = null;
        });

        // Repartir 2 cartas privadas a cada jugador activo
        gameState.players.forEach(p => {
            if (!p.folded) {
                p.holeCards = [gameState.deck.pop(), gameState.deck.pop()];
            }
        });

        // Cobro de Ciegas
        const sbSeat = activePlayers.length === 2 ? gameState.dealerSeat : getNextActiveSeat(gameState.dealerSeat);
        const bbSeat = getNextActiveSeat(sbSeat);

        const sbPlayer = gameState.players.find(p => p.seat === sbSeat);
        const bbPlayer = gameState.players.find(p => p.seat === bbSeat);

        // Cobrar SB
        const sbAmount = Math.min(sbPlayer.chips, gameState.smallBlind);
        sbPlayer.chips -= sbAmount;
        sbPlayer.currentRoundBet = sbAmount;
        sbPlayer.totalBet = sbAmount;
        gameState.pot += sbAmount;
        sbPlayer.lastAction = `SB $${sbAmount}`;

        // Cobrar BB
        const bbAmount = Math.min(bbPlayer.chips, gameState.bigBlind);
        bbPlayer.chips -= bbAmount;
        bbPlayer.currentRoundBet = bbAmount;
        bbPlayer.totalBet = bbAmount;
        gameState.pot += bbAmount;
        bbPlayer.lastAction = `BB $${bbAmount}`;

        gameState.currentBet = gameState.bigBlind;
        gameState.minRaise = gameState.bigBlind;

        // El primer turno pre-flop es el jugador a la izquierda de la BB (Under The Gun)
        gameState.currentTurnSeat = getNextActiveSeat(bbSeat);

        window.AudioFX.playCardDeal();
        window.AudioFX.playChipClink(3);

        UI.roundStatusBanner.textContent = 'Fase: Pre-Flop | Ciega Pequeña: ' + sbPlayer.name + ' | Ciega Grande: ' + bbPlayer.name;

        // Si es host online, enviar cartas privadas confidenciales a cada cliente
        if (gameState.mode === 'ONLINE_HOST' && multiplayer) {
            gameState.players.forEach(p => {
                if (p.id === gameState.myPlayerId) {
                    gameState.myHoleCards = p.holeCards;
                } else {
                    multiplayer.sendToPeer(p.peerId, {
                        type: 'PRIVATE_CARDS',
                        payload: { cards: p.holeCards }
                    });
                }
            });
        } else if (gameState.mode === 'LOCAL_TABLE') {
            gameState.myHoleCards = gameState.players[gameState.currentTurnSeat].holeCards;
        }

        renderTable();
        updateControls();
        broadcastState();
    }

    function getNextActiveSeat(currentSeat) {
        let next = (currentSeat + 1) % 6;
        for (let i = 0; i < 6; i++) {
            const player = gameState.players.find(p => p.seat === next && !p.folded && p.chips > 0);
            if (player) return next;
            next = (next + 1) % 6;
        }
        return currentSeat;
    }

    function getPlayersInHand() {
        return gameState.players.filter(p => !p.folded);
    }

    function getPlayersEligibleToAct() {
        return gameState.players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
    }

    // ==========================================
    // PROCESAMIENTO DE ACCIONES DE JUEGO
    // ==========================================

    function handlePlayerAction(seat, action, raiseAmount = 0) {
        if (gameState.stage === 'SHOWDOWN' || gameState.stage === 'WAITING') return;

        const player = gameState.players.find(p => p.seat === seat);
        if (!player || player.folded || player.isAllIn) return;

        const callDifference = gameState.currentBet - player.currentRoundBet;

        if (action === 'FOLD') {
            player.folded = true;
            player.lastAction = 'FOLD';
            window.AudioFX.playFold();
            showToast(`${player.name} no va.`);
        } else if (action === 'CHECK') {
            player.lastAction = 'CHECK';
            window.AudioFX.playCheckTap();
            showToast(`${player.name} pasa.`);
        } else if (action === 'CALL') {
            const amountToCall = Math.min(callDifference, player.chips);
            player.chips -= amountToCall;
            player.currentRoundBet += amountToCall;
            player.totalBet += amountToCall;
            gameState.pot += amountToCall;
            if (player.chips === 0) player.isAllIn = true;
            player.lastAction = player.isAllIn ? 'ALL-IN' : `CALL $${amountToCall}`;
            window.AudioFX.playChipClink(2);
            showToast(`${player.name} iguala $${amountToCall}.`);
        } else if (action === 'RAISE') {
            const totalRoundBet = raiseAmount;
            const additionalChips = totalRoundBet - player.currentRoundBet;
            const actualBet = Math.min(additionalChips, player.chips);

            player.chips -= actualBet;
            player.currentRoundBet += actualBet;
            player.totalBet += actualBet;
            gameState.pot += actualBet;

            const raiseDiff = player.currentRoundBet - gameState.currentBet;
            if (raiseDiff > gameState.minRaise) {
                gameState.minRaise = raiseDiff;
            }
            gameState.currentBet = player.currentRoundBet;
            gameState.lastAggressorSeat = seat;

            // Todos los demás deben volver a responder a la subida
            gameState.playersActedThisRound.clear();

            if (player.chips === 0) player.isAllIn = true;
            player.lastAction = player.isAllIn ? 'ALL-IN' : `SUBE A $${player.currentRoundBet}`;

            if (player.isAllIn) {
                window.AudioFX.playAllIn();
            } else {
                window.AudioFX.playChipClink(4);
            }
            showToast(`${player.name} sube a $${player.currentRoundBet}.`);
        }

        gameState.playersActedThisRound.add(seat);

        // Comprobar si solo queda un jugador activo (todos los demás se retiraron)
        const playersInHand = getPlayersInHand();
        if (playersInHand.length === 1) {
            handleSingleWinnerFold(playersInHand[0]);
            return;
        }

        // Comprobar si la ronda de apuestas ha concluido
        if (isBettingRoundComplete()) {
            advanceStage();
        } else {
            // Avanzar al siguiente jugador elegible
            gameState.currentTurnSeat = getNextTurnSeat(seat);
            renderTable();
            updateControls();
            broadcastState();
        }
    }

    function isBettingRoundComplete() {
        const eligible = getPlayersEligibleToAct();
        // Si nadie puede actuar o solo 1 puede actuar y ya igualó la apuesta
        if (eligible.length <= 1) {
            const allMatched = eligible.every(p => p.currentRoundBet === gameState.currentBet);
            if (allMatched && gameState.playersActedThisRound.size >= eligible.length) {
                return true;
            }
        }

        // Todos los que pueden actuar deben haber actuado y tener sus apuestas igualadas a la mayor
        const allActed = eligible.every(p => gameState.playersActedThisRound.has(p.seat));
        const allBetsMatched = eligible.every(p => p.currentRoundBet === gameState.currentBet);

        return allActed && allBetsMatched;
    }

    function getNextTurnSeat(fromSeat) {
        let next = (fromSeat + 1) % 6;
        for (let i = 0; i < 6; i++) {
            const p = gameState.players.find(pl => pl.seat === next && !pl.folded && !pl.isAllIn && pl.chips > 0);
            if (p) return next;
            next = (next + 1) % 6;
        }
        return fromSeat;
    }

    // ==========================================
    // TRANSICIÓN DE FASES (FLOP, TURN, RIVER, SHOWDOWN)
    // ==========================================

    function advanceStage() {
        // Resetear apuestas de la ronda
        gameState.players.forEach(p => {
            p.currentRoundBet = 0;
            p.lastAction = null;
        });
        gameState.currentBet = 0;
        gameState.minRaise = gameState.bigBlind;
        gameState.playersActedThisRound.clear();
        gameState.lastAggressorSeat = null;

        // Primer turno post-flop es la primera posición activa a la izquierda del Dealer
        gameState.currentTurnSeat = getNextTurnSeat(gameState.dealerSeat);

        if (gameState.stage === 'PREFLOP') {
            // Repartir FLOP (3 cartas)
            gameState.stage = 'FLOP';
            gameState.deck.pop(); // Carta quemada
            gameState.communityCards = [gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop()];
            window.AudioFX.playCardDeal();
            UI.roundStatusBanner.textContent = 'Fase: FLOP';
        } else if (gameState.stage === 'FLOP') {
            // Repartir TURN (1 carta)
            gameState.stage = 'TURN';
            gameState.deck.pop(); // Carta quemada
            gameState.communityCards.push(gameState.deck.pop());
            window.AudioFX.playCardDeal();
            UI.roundStatusBanner.textContent = 'Fase: TURN';
        } else if (gameState.stage === 'TURN') {
            // Repartir RIVER (1 carta)
            gameState.stage = 'RIVER';
            gameState.deck.pop(); // Carta quemada
            gameState.communityCards.push(gameState.deck.pop());
            window.AudioFX.playCardDeal();
            UI.roundStatusBanner.textContent = 'Fase: RIVER';
        } else if (gameState.stage === 'RIVER') {
            // SHOWDOWN
            executeShowdown();
            return;
        }

        // Si todos están All-in menos uno o ninguno puede apostar, saltar rápido a la siguiente fase
        const eligible = getPlayersEligibleToAct();
        if (eligible.length <= 1) {
            renderTable();
            broadcastState();
            setTimeout(() => advanceStage(), 1600);
            return;
        }

        renderTable();
        updateControls();
        broadcastState();
    }

    // Ganador directo cuando todos los demás jugadores hacen FOLD
    function handleSingleWinnerFold(winner) {
        winner.chips += gameState.pot;
        window.AudioFX.playWinFanfare();

        const payload = {
            winnerName: winner.name,
            handDesc: 'Todos los rivales se retiraron',
            potWon: gameState.pot
        };

        displayShowdownWinners(payload);

        if (gameState.mode === 'ONLINE_HOST' && multiplayer) {
            multiplayer.broadcast({
                type: 'ROUND_WINNERS',
                payload
            });
        }

        gameState.stage = 'SHOWDOWN';
        renderTable();
        broadcastState();

        setTimeout(() => {
            UI.showdownBanner.style.display = 'none';
            startNewHand();
        }, 4000);
    }

    // SHOWDOWN con evaluación de Texas Hold'em
    function executeShowdown() {
        gameState.stage = 'SHOWDOWN';

        const showdownResult = window.PokerEngine.resolveShowdown(gameState.players, gameState.communityCards);

        // Asignar los pagos a las fichas de los jugadores
        Object.entries(showdownResult.payouts).forEach(([playerId, amount]) => {
            const p = gameState.players.find(pl => pl.id === playerId);
            if (p) p.chips += amount;
        });

        // Revelar cartas de mano de todos los jugadores activos para el Showdown
        const revealedCards = {};
        gameState.players.forEach(p => {
            if (!p.folded) revealedCards[p.id] = p.holeCards;
        });

        // Obtener el ganador principal
        const mainPotWinners = showdownResult.potResults[0]?.winners || [];
        const winnerNames = mainPotWinners.map(w => w.name).join(' y ');
        const winnerHand = mainPotWinners[0]?.hand || '';

        const payload = {
            winnerName: winnerNames,
            handDesc: winnerHand,
            potWon: gameState.pot,
            revealedCards: revealedCards,
            payouts: showdownResult.payouts
        };

        window.AudioFX.playWinFanfare();
        displayShowdownWinners(payload);

        if (gameState.mode === 'ONLINE_HOST' && multiplayer) {
            multiplayer.broadcast({
                type: 'ROUND_WINNERS',
                payload
            });
        }

        renderTable();
        broadcastState();

        // Esperar 5 segundos para disfrutar de la victoria y comenzar la siguiente mano
        setTimeout(() => {
            UI.showdownBanner.style.display = 'none';
            startNewHand();
        }, 5000);
    }

    function displayShowdownWinners(payload) {
        UI.showdownWinnerName.textContent = payload.winnerName;
        UI.showdownHandName.textContent = payload.handDesc;
        UI.showdownPotWon.textContent = `+$${payload.potWon}`;
        UI.showdownBanner.style.display = 'block';

        if (payload.revealedCards) {
            Object.entries(payload.revealedCards).forEach(([id, cards]) => {
                const p = gameState.players.find(pl => pl.id === id);
                if (p) p.holeCards = cards;
            });
            renderTable();
        }
    }

    // ==========================================
    // GESTIÓN DE ACCIONES REMOTAS (HOST RECIBE ACCIÓN)
    // ==========================================

    function handleRemotePlayerAction(peerId, payload) {
        const player = gameState.players.find(p => p.id === peerId);
        if (!player || player.seat !== gameState.currentTurnSeat) return;

        handlePlayerAction(player.seat, payload.action, payload.amount);
    }

    function broadcastState() {
        if (gameState.mode !== 'ONLINE_HOST' || !multiplayer) return;

        const publicPlayers = gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            chips: p.chips,
            seat: p.seat,
            currentRoundBet: p.currentRoundBet,
            totalBet: p.totalBet,
            folded: p.folded,
            isAllIn: p.isAllIn,
            lastAction: p.lastAction,
            hasCards: p.holeCards && p.holeCards.length > 0,
            holeCards: (gameState.stage === 'SHOWDOWN' && !p.folded) ? p.holeCards : null
        }));

        multiplayer.broadcast({
            type: 'GAME_STATE_UPDATE',
            payload: {
                players: publicPlayers,
                communityCards: gameState.communityCards,
                pot: gameState.pot,
                currentBet: gameState.currentBet,
                minRaise: gameState.minRaise,
                stage: gameState.stage,
                dealerSeat: gameState.dealerSeat,
                currentTurnSeat: gameState.currentTurnSeat
            }
        });
    }

    function applyServerState(state) {
        gameState.communityCards = state.communityCards;
        gameState.pot = state.pot;
        gameState.currentBet = state.currentBet;
        gameState.minRaise = state.minRaise;
        gameState.stage = state.stage;
        gameState.dealerSeat = state.dealerSeat;
        gameState.currentTurnSeat = state.currentTurnSeat;

        // Actualizar jugadores
        gameState.players = state.players.map(sp => {
            const existing = gameState.players.find(ep => ep.id === sp.id);
            return {
                ...sp,
                holeCards: (sp.id === gameState.myPlayerId && gameState.myHoleCards.length > 0)
                    ? gameState.myHoleCards
                    : (sp.holeCards || (existing ? existing.holeCards : []))
            };
        });

        renderTable();
        updateControls();
    }

    // ==========================================
    // RENDERIZADO DE LA MESA Y CARTAS
    // ==========================================

    function renderTable() {
        // Actualizar Bote
        UI.potAmount.textContent = `$${gameState.pot.toLocaleString()}`;

        // Renderizar Cartas Comunitarias (5 ranuras)
        for (let i = 0; i < 5; i++) {
            const slot = document.getElementById(`slot-${i}`);
            slot.innerHTML = '';
            const card = gameState.communityCards[i];
            if (card) {
                slot.appendChild(createCardElement(card));
            }
        }

        // Renderizar los 6 Asientos
        for (let seatIdx = 0; seatIdx < 6; seatIdx++) {
            const seatElem = document.getElementById(`seat-${seatIdx}`);
            seatElem.innerHTML = '';

            const player = gameState.players.find(p => p.seat === seatIdx);
            seatElem.className = `player-seat seat-${seatIdx}`;

            if (!player) {
                // Asiento Vacío
                const emptyBtn = document.createElement('div');
                emptyBtn.className = 'empty-seat-btn';
                emptyBtn.innerHTML = `<span>+</span> <span>Asiento ${seatIdx + 1}</span>`;
                seatElem.appendChild(emptyBtn);
                continue;
            }

            if (player.folded) seatElem.classList.add('folded');
            if (player.seat === gameState.currentTurnSeat && gameState.stage !== 'WAITING' && gameState.stage !== 'SHOWDOWN') {
                seatElem.classList.add('active-turn');
            }

            // Contenedor del Jugador
            const playerBox = document.createElement('div');
            playerBox.className = 'player-box';

            // Avatar y Dealer Button
            const avatarWrap = document.createElement('div');
            avatarWrap.className = 'player-avatar-wrap';

            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            const initials = getInitials(player.name);
            const style = AVATAR_PALETTE[player.avatar] || AVATAR_PALETTE[PALETTE_KEYS[player.seat % PALETTE_KEYS.length]] || { bg: '#26384a', color: '#e8edf3' };
            avatar.style.background = style.bg;
            avatar.style.color = style.color;
            avatar.textContent = initials;
            avatarWrap.appendChild(avatar);

            if (player.seat === gameState.dealerSeat) {
                const dealerBtn = document.createElement('div');
                dealerBtn.className = 'dealer-button';
                dealerBtn.textContent = 'D';
                avatarWrap.appendChild(dealerBtn);
            }
            playerBox.appendChild(avatarWrap);

            // Información (Nombre y Fichas)
            const info = document.createElement('div');
            info.className = 'player-info';

            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.name + (player.id === gameState.myPlayerId ? ' (Tú)' : '');
            info.appendChild(name);

            const chips = document.createElement('div');
            chips.className = 'player-chips';
            chips.innerHTML = `<span class="pot-chip-disc" style="width: 9px; height: 9px;"></span> <span>$${player.chips.toLocaleString()}</span>`;
            info.appendChild(chips);

            playerBox.appendChild(info);

            // Badge de Acción si ha actuado
            if (player.lastAction) {
                const actionBadge = document.createElement('div');
                actionBadge.className = 'player-action-badge';
                if (player.lastAction.includes('FOLD')) actionBadge.classList.add('fold');
                else if (player.lastAction.includes('CHECK')) actionBadge.classList.add('check');
                else if (player.lastAction.includes('CALL')) actionBadge.classList.add('call');
                else if (player.lastAction.includes('SUBE') || player.lastAction.includes('RAISE')) actionBadge.classList.add('raise');
                else if (player.lastAction.includes('ALL-IN')) actionBadge.classList.add('allin');

                actionBadge.textContent = player.lastAction;
                actionBadge.style.display = 'block';
                playerBox.appendChild(actionBadge);
            }

            seatElem.appendChild(playerBox);

            // Cartas de Mano del Jugador
            const cardsWrap = document.createElement('div');
            cardsWrap.className = 'player-cards';

            const isCurrentMe = (player.id === gameState.myPlayerId) ||
                                (gameState.mode === 'LOCAL_TABLE' && player.seat === gameState.currentTurnSeat);

            if (player.holeCards && player.holeCards.length === 2 && !player.folded) {
                if (isCurrentMe && !gameState.privacyHidden) {
                    cardsWrap.appendChild(createCardElement(player.holeCards[0]));
                    cardsWrap.appendChild(createCardElement(player.holeCards[1]));
                } else if (gameState.stage === 'SHOWDOWN') {
                    cardsWrap.appendChild(createCardElement(player.holeCards[0]));
                    cardsWrap.appendChild(createCardElement(player.holeCards[1]));
                } else {
                    cardsWrap.appendChild(createCardBackElement());
                    cardsWrap.appendChild(createCardBackElement());
                }
            } else if (!player.folded && player.hasCards) {
                cardsWrap.appendChild(createCardBackElement());
                cardsWrap.appendChild(createCardBackElement());
            }

            seatElem.appendChild(cardsWrap);

            // Fichas apostadas en la ronda
            if (player.currentRoundBet > 0) {
                const betElem = document.createElement('div');
                betElem.className = 'seat-bet';
                betElem.style.display = 'flex';
                betElem.innerHTML = `<span class="pot-chip-disc" style="width: 8px; height: 8px;"></span> <span>$${player.currentRoundBet}</span>`;
                seatElem.appendChild(betElem);
            }
        }

        // Actualizar Asesor de Manos en vivo
        updateHandAdvisor();
    }

    function createCardElement(card) {
        const div = document.createElement('div');
        const suitMap = (window.PokerEngine && window.PokerEngine.SUIT_NAMES) || { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
        const suitName = suitMap[card.suit] || 'spades';
        div.className = `poker-card ${suitName}`;

        div.innerHTML = `
            <div class="card-top">
                <span class="card-rank">${card.rank}</span>
                <span class="card-suit">${card.suit}</span>
            </div>
            <div class="card-center-suit">${card.suit}</div>
            <div class="card-bottom">
                <span class="card-rank">${card.rank}</span>
                <span class="card-suit">${card.suit}</span>
            </div>
        `;
        return div;
    }

    function createCardBackElement() {
        const div = document.createElement('div');
        div.className = 'poker-card back';
        return div;
    }

    function updateHandAdvisor() {
        let holeCards = [];
        if (gameState.mode === 'LOCAL_TABLE') {
            const activeP = gameState.players.find(p => p.seat === gameState.currentTurnSeat);
            if (activeP) holeCards = activeP.holeCards;
        } else {
            holeCards = gameState.myHoleCards;
        }

        if (holeCards && holeCards.length === 2 && !gameState.privacyHidden) {
            const evaluated = window.PokerEngine.evaluateHand(holeCards, gameState.communityCards);
            UI.handAdvisorVal.textContent = evaluated.desc || evaluated.typeName;
        } else if (gameState.privacyHidden) {
            UI.handAdvisorVal.textContent = 'Cartas ocultas';
        } else {
            UI.handAdvisorVal.textContent = 'Esperando mano...';
        }
    }

    // ==========================================
    // ACTUALIZACIÓN DE CONTROLES DE APUESTA
    // ==========================================

    function updateControls() {
        const isMyTurn = (gameState.mode === 'LOCAL_TABLE') ||
                         (gameState.players[gameState.currentTurnSeat]?.id === gameState.myPlayerId);

        const activePlayer = gameState.players.find(p => p.seat === gameState.currentTurnSeat);

        if (!isMyTurn || !activePlayer || activePlayer.folded || activePlayer.isAllIn || gameState.stage === 'SHOWDOWN' || gameState.stage === 'WAITING') {
            UI.btnFold.disabled = true;
            UI.btnCheckCall.disabled = true;
            UI.btnRaise.disabled = true;
            UI.raiseSlider.disabled = true;
            return;
        }

        // Si es mi turno, emitir alerta sonora si no sonó ya
        window.AudioFX.playTurnAlert();

        UI.btnFold.disabled = false;
        UI.btnCheckCall.disabled = false;
        UI.btnRaise.disabled = false;
        UI.raiseSlider.disabled = false;

        const callDifference = gameState.currentBet - activePlayer.currentRoundBet;

        if (callDifference <= 0) {
            // Se puede PASAR (CHECK)
            UI.checkCallLabel.textContent = 'PASAR';
            UI.checkCallSub.textContent = 'Check';
            UI.btnCheckCall.className = 'btn-action btn-check';
        } else {
            // Se debe IGUALAR (CALL)
            const callAmount = Math.min(callDifference, activePlayer.chips);
            UI.checkCallLabel.textContent = 'IGUALAR';
            UI.checkCallSub.textContent = `$${callAmount}`;
            UI.btnCheckCall.className = 'btn-action btn-call';
        }

        // Configuración del Deslizador de Subida (Raise)
        const minRaiseTotal = gameState.currentBet + gameState.minRaise;
        const maxRaiseTotal = activePlayer.chips + activePlayer.currentRoundBet;

        if (maxRaiseTotal <= gameState.currentBet) {
            // Solo puede ir All-In
            UI.btnRaise.disabled = true;
            UI.raiseSlider.disabled = true;
        } else {
            UI.raiseSlider.min = Math.min(minRaiseTotal, maxRaiseTotal);
            UI.raiseSlider.max = maxRaiseTotal;
            UI.raiseSlider.value = Math.min(minRaiseTotal, maxRaiseTotal);
            updateRaiseLabel();
        }
    }

    function updateRaiseLabel() {
        const val = parseInt(UI.raiseSlider.value, 10);
        UI.raiseAmountLabel.textContent = `$${val}`;
    }

    UI.raiseSlider.addEventListener('input', updateRaiseLabel);

    // Presets rápidos de subida
    UI.btnPresetMin.addEventListener('click', () => {
        UI.raiseSlider.value = UI.raiseSlider.min;
        updateRaiseLabel();
    });

    UI.btnPreset2BB.addEventListener('click', () => {
        const val = Math.min(gameState.bigBlind * 2.5, UI.raiseSlider.max);
        UI.raiseSlider.value = Math.max(val, UI.raiseSlider.min);
        updateRaiseLabel();
    });

    UI.btnPresetHalfPot.addEventListener('click', () => {
        const halfPot = Math.floor(gameState.pot / 2);
        const val = Math.min(gameState.currentBet + halfPot, UI.raiseSlider.max);
        UI.raiseSlider.value = Math.max(val, UI.raiseSlider.min);
        updateRaiseLabel();
    });

    UI.btnPresetPot.addEventListener('click', () => {
        const val = Math.min(gameState.currentBet + gameState.pot, UI.raiseSlider.max);
        UI.raiseSlider.value = Math.max(val, UI.raiseSlider.min);
        updateRaiseLabel();
    });

    UI.btnPresetAllIn.addEventListener('click', () => {
        UI.raiseSlider.value = UI.raiseSlider.max;
        updateRaiseLabel();
    });

    // Enviar Acciones desde los botones de la interfaz
    UI.btnFold.addEventListener('click', () => executeCurrentAction('FOLD'));

    UI.btnCheckCall.addEventListener('click', () => {
        const activePlayer = gameState.players.find(p => p.seat === gameState.currentTurnSeat);
        if (!activePlayer) return;
        const diff = gameState.currentBet - activePlayer.currentRoundBet;
        if (diff <= 0) {
            executeCurrentAction('CHECK');
        } else {
            executeCurrentAction('CALL');
        }
    });

    UI.btnRaise.addEventListener('click', () => {
        const raiseVal = parseInt(UI.raiseSlider.value, 10);
        executeCurrentAction('RAISE', raiseVal);
    });

    function executeCurrentAction(action, amount = 0) {
        if (gameState.mode === 'ONLINE_CLIENT' && multiplayer) {
            multiplayer.sendAction(action, amount);
            UI.btnFold.disabled = true;
            UI.btnCheckCall.disabled = true;
            UI.btnRaise.disabled = true;
        } else {
            handlePlayerAction(gameState.currentTurnSeat, action, amount);
        }
    }

    // Botón de Privacidad (Ocultar/Mostrar mis cartas)
    UI.btnTogglePrivacy.addEventListener('click', () => {
        gameState.privacyHidden = !gameState.privacyHidden;
        const textElem = document.getElementById('privacyText');
        if (textElem) {
            textElem.textContent = gameState.privacyHidden ? 'Mostrar cartas' : 'Ocultar cartas';
        }
        renderTable();
    });

    // ==========================================
    // CHAT EN VIVO Y REACCIONES
    // ==========================================

    UI.btnToggleChat.addEventListener('click', () => {
        UI.chatDrawer.classList.toggle('open');
        UI.unreadChatBadge.style.display = 'none';
    });

    UI.btnCloseChat.addEventListener('click', () => {
        UI.chatDrawer.classList.remove('open');
    });

    UI.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = UI.chatInput.value.trim();
        if (!text) return;

        if (multiplayer) {
            multiplayer.sendChat(text);
        } else {
            const activePlayer = gameState.players[gameState.currentTurnSeat] || gameState.players[0];
            addChatMessage(activePlayer.name, text);
        }
        UI.chatInput.value = '';
    });

    // Reacciones rápidas de chat
    document.querySelectorAll('.quick-reaction-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            if (multiplayer) {
                multiplayer.sendChat(text);
            } else {
                const activePlayer = gameState.players[gameState.currentTurnSeat] || gameState.players[0];
                addChatMessage(activePlayer.name, text);
            }
        });
    });

    function addChatMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = `
            <div class="sender">${sender}</div>
            <div>${escapeHTML(text)}</div>
        `;
        UI.chatMessages.appendChild(bubble);
        UI.chatMessages.scrollTop = UI.chatMessages.scrollHeight;

        if (!UI.chatDrawer.classList.contains('open')) {
            UI.unreadChatBadge.style.display = 'inline-block';
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // ==========================================
    // BOTONES AUXILIARES Y REGLAS
    // ==========================================

    UI.btnSound.addEventListener('click', () => {
        const isMuted = window.AudioFX.toggleMute();
        const soundOn = document.getElementById('soundIconOn');
        const soundOff = document.getElementById('soundIconOff');
        if (soundOn && soundOff) {
            soundOn.style.display = isMuted ? 'none' : 'block';
            soundOff.style.display = isMuted ? 'block' : 'none';
        }
        showToast(isMuted ? 'Sonido silenciado' : 'Sonido activado');
    });

    UI.btnRules.addEventListener('click', () => {
        UI.rulesModal.style.display = 'flex';
    });

    UI.btnCloseRules.addEventListener('click', () => {
        UI.rulesModal.style.display = 'none';
    });

    UI.btnLeave.addEventListener('click', () => {
        if (confirm('¿Seguro que deseas salir de la mesa actual?')) {
            if (multiplayer) multiplayer.destroy();
            window.location.href = window.location.pathname;
        }
    });
});
