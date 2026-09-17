/**
 * Módulo de Red Multijugador Peer-to-Peer (WebRTC con PeerJS)
 * Permite partidas en tiempo real entre personas reales sin necesidad de un backend dedicado.
 * Compatible con despliegue en Vercel, Netlify o cualquier servidor estático.
 */

class MultiplayerManager {
    constructor(gameCallbacks) {
        this.callbacks = gameCallbacks || {};
        this.peer = null;
        this.peerId = null;
        this.isHost = false;
        this.roomCode = null;
        this.connections = new Map(); // peerId -> DataConnection (para Host)
        this.hostConn = null; // DataConnection con el host (para Clientes)
        this.myPlayerInfo = { id: null, name: 'Jugador', avatar: 'navy' };
        this.connectedPlayers = []; // Lista de jugadores en la sala
    }

    /**
     * Genera un identificador de sala corto y fácil de compartir
     */
    static generateRoomId() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `PKR-${num}`;
    }

    /**
     * Inicializa PeerJS con servidores STUN públicos y servidor de señalización de PeerJS
     */
    initPeer(customId = null) {
        return new Promise((resolve, reject) => {
            if (typeof Peer === 'undefined') {
                return reject(new Error('La librería PeerJS no está cargada.'));
            }

            try {
                this.peer = new Peer(customId, {
                    debug: 1,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });

                this.peer.on('open', (id) => {
                    this.peerId = id;
                    this.myPlayerInfo.id = id;
                    resolve(id);
                });

                this.peer.on('error', (err) => {
                    console.error('Error de PeerJS:', err);
                    if (this.callbacks.onError) this.callbacks.onError(err);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Crea una nueva sala de Poker en la que este jugador actúa como Anfitrión (Host)
     */
    async createRoom(roomCode, hostPlayerInfo) {
        this.isHost = true;
        this.roomCode = (roomCode || MultiplayerManager.generateRoomId()).toUpperCase().trim();
        this.myPlayerInfo = { ...this.myPlayerInfo, ...hostPlayerInfo, isHost: true };

        const hostPeerId = `poker-room-${this.roomCode.toLowerCase()}`;
        await this.initPeer(hostPeerId);

        // El host añade su propio jugador a la lista
        this.connectedPlayers = [{
            peerId: this.peerId,
            id: this.peerId,
            name: this.myPlayerInfo.name,
            avatar: this.myPlayerInfo.avatar,
            isHost: true,
            chips: hostPlayerInfo.initialChips || 1000,
            seat: 0
        }];

        // Escuchar conexiones de clientes entrantes
        this.peer.on('connection', (conn) => {
            this.handleIncomingConnection(conn);
        });

        return {
            roomCode: this.roomCode,
            peerId: this.peerId,
            shareUrl: `${window.location.origin}${window.location.pathname}?sala=${this.roomCode}`
        };
    }

    /**
     * Maneja un nuevo cliente que se conecta al Host
     */
    handleIncomingConnection(conn) {
        conn.on('open', () => {
            this.connections.set(conn.peer, conn);

            conn.on('data', (data) => {
                this.handleDataFromClient(conn.peer, data);
            });

            conn.on('close', () => {
                this.handleClientDisconnect(conn.peer);
            });
        });
    }

    /**
     * El anfitrión procesa mensajes recibidos de los clientes
     */
    handleDataFromClient(peerId, data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'JOIN_REQUEST':
                this.processJoinRequest(peerId, data.payload);
                break;
            case 'PLAYER_ACTION':
                if (this.callbacks.onPlayerAction) {
                    this.callbacks.onPlayerAction(peerId, data.payload);
                }
                break;
            case 'CHAT_MESSAGE':
                this.broadcast({
                    type: 'CHAT_BROADCAST',
                    payload: {
                        senderId: peerId,
                        senderName: data.payload.senderName,
                        text: data.payload.text,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                });
                break;
        }
    }

    /**
     * El anfitrión valida y asigna asiento a un nuevo jugador
     */
    processJoinRequest(peerId, payload) {
        const conn = this.connections.get(peerId);
        if (!conn) return;

        if (this.connectedPlayers.length >= 6) {
            conn.send({
                type: 'JOIN_REJECTED',
                payload: { reason: 'La mesa está completa (máximo 6 jugadores).' }
            });
            return;
        }

        // Asignar primer asiento disponible
        const occupiedSeats = this.connectedPlayers.map(p => p.seat);
        let availableSeat = 0;
        for (let s = 0; s < 6; s++) {
            if (!occupiedSeats.includes(s)) {
                availableSeat = s;
                break;
            }
        }

        const newPlayer = {
            peerId,
            id: peerId,
            name: payload.name || `Jugador ${this.connectedPlayers.length + 1}`,
            avatar: payload.avatar || 'navy',
            isHost: false,
            chips: payload.initialChips || 1000,
            seat: availableSeat
        };

        this.connectedPlayers.push(newPlayer);

        // Aceptar al jugador y enviarle el estado actual
        conn.send({
            type: 'JOIN_ACCEPTED',
            payload: {
                mySeat: availableSeat,
                myId: peerId,
                roomCode: this.roomCode,
                players: this.connectedPlayers
            }
        });

        // Notificar a todos los demás jugadores
        this.broadcast({
            type: 'PLAYER_JOINED',
            payload: {
                player: newPlayer,
                players: this.connectedPlayers
            }
        });

        if (this.callbacks.onPlayerJoined) {
            this.callbacks.onPlayerJoined(newPlayer);
        }
    }

    /**
     * Maneja la desconexión de un jugador
     */
    handleClientDisconnect(peerId) {
        const index = this.connectedPlayers.findIndex(p => p.peerId === peerId);
        if (index !== -1) {
            const disconnected = this.connectedPlayers[index];
            this.connectedPlayers.splice(index, 1);
            this.connections.delete(peerId);

            this.broadcast({
                type: 'PLAYER_LEFT',
                payload: {
                    peerId,
                    name: disconnected.name,
                    players: this.connectedPlayers
                }
            });

            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(disconnected);
            }
        }
    }

    /**
     * Unirse a una sala existente como Cliente
     */
    async joinRoom(roomCode, clientPlayerInfo) {
        this.isHost = false;
        this.roomCode = roomCode.toUpperCase().trim();
        this.myPlayerInfo = { ...this.myPlayerInfo, ...clientPlayerInfo };

        await this.initPeer();

        const hostPeerId = `poker-room-${this.roomCode.toLowerCase()}`;
        return new Promise((resolve, reject) => {
            const conn = this.peer.connect(hostPeerId, { reliable: true });
            this.hostConn = conn;

            const timeout = setTimeout(() => {
                reject(new Error('Tiempo de espera agotado al conectar con la sala. Verifica que el código sea correcto y el anfitrión esté dentro.'));
            }, 10000);

            conn.on('open', () => {
                clearTimeout(timeout);
                // Solicitar unirse a la partida
                conn.send({
                    type: 'JOIN_REQUEST',
                    payload: {
                        name: this.myPlayerInfo.name,
                        avatar: this.myPlayerInfo.avatar,
                        initialChips: this.myPlayerInfo.initialChips || 1000
                    }
                });
            });

            conn.on('data', (data) => {
                if (data.type === 'JOIN_ACCEPTED') {
                    this.myPlayerInfo.id = data.payload.myId;
                    this.myPlayerInfo.seat = data.payload.mySeat;
                    this.connectedPlayers = data.payload.players;
                    resolve(data.payload);
                } else if (data.type === 'JOIN_REJECTED') {
                    reject(new Error(data.payload.reason || 'No fue posible unirse a la sala.'));
                } else {
                    this.handleDataFromHost(data);
                }
            });

            conn.on('close', () => {
                if (this.callbacks.onDisconnected) {
                    this.callbacks.onDisconnected('La conexión con la sala se ha cerrado.');
                }
            });

            conn.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    /**
     * Procesa datos recibidos del Anfitrión (ejecutado en clientes)
     */
    handleDataFromHost(data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'GAME_STATE_UPDATE':
                if (this.callbacks.onGameStateUpdate) {
                    this.callbacks.onGameStateUpdate(data.payload);
                }
                break;
            case 'PLAYER_JOINED':
                this.connectedPlayers = data.payload.players;
                if (this.callbacks.onPlayerJoined) {
                    this.callbacks.onPlayerJoined(data.payload.player);
                }
                break;
            case 'PLAYER_LEFT':
                this.connectedPlayers = data.payload.players;
                if (this.callbacks.onPlayerLeft) {
                    this.callbacks.onPlayerLeft(data.payload);
                }
                break;
            case 'PRIVATE_CARDS':
                if (this.callbacks.onPrivateCards) {
                    this.callbacks.onPrivateCards(data.payload.cards);
                }
                break;
            case 'CHAT_BROADCAST':
                if (this.callbacks.onChatMessage) {
                    this.callbacks.onChatMessage(data.payload);
                }
                break;
            case 'ROUND_WINNERS':
                if (this.callbacks.onRoundWinners) {
                    this.callbacks.onRoundWinners(data.payload);
                }
                break;
        }
    }

    /**
     * Enviar acción del jugador (Fold, Check, Call, Raise)
     */
    sendAction(actionType, amount = 0) {
        const payload = {
            action: actionType,
            amount: amount,
            playerId: this.myPlayerInfo.id
        };

        if (this.isHost) {
            if (this.callbacks.onPlayerAction) {
                this.callbacks.onPlayerAction(this.peerId, payload);
            }
        } else if (this.hostConn && this.hostConn.open) {
            this.hostConn.send({
                type: 'PLAYER_ACTION',
                payload
            });
        }
    }

    /**
     * Enviar mensaje de chat
     */
    sendChat(text) {
        if (!text || !text.trim()) return;

        const payload = {
            senderName: this.myPlayerInfo.name,
            text: text.trim()
        };

        if (this.isHost) {
            this.broadcast({
                type: 'CHAT_BROADCAST',
                payload: {
                    senderId: this.peerId,
                    senderName: this.myPlayerInfo.name,
                    text: text.trim(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            });
        } else if (this.hostConn && this.hostConn.open) {
            this.hostConn.send({
                type: 'CHAT_MESSAGE',
                payload
            });
        }
    }

    /**
     * El anfitrión envía datos confidenciales (como sus 2 cartas de mano) a un cliente específico
     */
    sendToPeer(peerId, message) {
        if (peerId === this.peerId) {
            // Es el propio host
            this.handleDataFromHost(message);
            return;
        }
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            conn.send(message);
        }
    }

    /**
     * El anfitrión emite un mensaje a todos los jugadores conectados
     */
    broadcast(message) {
        if (!this.isHost) return;

        // Auto-notificar al anfitrión
        this.handleDataFromHost(message);

        // Enviar a todos los clientes conectados
        this.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(message);
            }
        });
    }

    /**
     * Cierra todas las conexiones
     */
    destroy() {
        if (this.hostConn) {
            this.hostConn.close();
        }
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        if (this.peer) {
            this.peer.destroy();
        }
    }
}

// Exportar globalmente
window.MultiplayerManager = MultiplayerManager;
