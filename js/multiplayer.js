/**
 * Módulo de Red Multijugador Punto a Punto (P2P con PeerJS / WebRTC) en Castellano
 * Permite partidas en tiempo real entre personas reales sin servidores de pago.
 */

class GestorMultijugador {
    constructor(devolucionesLlamada) {
        this.devolucionesLlamada = devolucionesLlamada || {};
        this.callbacks = this.devolucionesLlamada; // Alias
        this.par = null;
        this.idPar = null;
        this.peerId = null;
        this.esAnfitrion = false;
        this.isHost = false;
        this.codigoSala = null;
        this.roomCode = null;
        this.conexiones = new Map();
        this.connections = this.conexiones;
        this.conexionAnfitrion = null;
        this.hostConn = null;
        this.miInfoJugador = { id: null, nombre: 'Jugador', avatar: 'navy' };
        this.myPlayerInfo = this.miInfoJugador;
        this.jugadoresConectados = [];
        this.connectedPlayers = this.jugadoresConectados;
    }

    /**
     * Genera un identificador de sala corto
     */
    static generarIdSala() {
        const numero = Math.floor(1000 + Math.random() * 9000);
        return `PKR-${numero}`;
    }
    static generateRoomId() { return GestorMultijugador.generarIdSala(); }

    /**
     * Inicializa PeerJS con servidores públicos STUN
     */
    iniciarPar(idPersonalizado = null) {
        return new Promise((resolver, rechazar) => {
            if (typeof Peer === 'undefined') {
                return rechazar(new Error('La librería PeerJS no está disponible.'));
            }

            try {
                this.par = new Peer(idPersonalizado, {
                    debug: 1,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });
                this.peer = this.par;

                this.par.on('open', (id) => {
                    this.idPar = id;
                    this.peerId = id;
                    this.miInfoJugador.id = id;
                    resolver(id);
                });

                this.par.on('error', (error) => {
                    console.error('Error de conexión P2P:', error);
                    if (this.devolucionesLlamada.onError) this.devolucionesLlamada.onError(error);
                });
            } catch (e) {
                rechazar(e);
            }
        });
    }
    initPeer(customId) { return this.iniciarPar(customId); }

    /**
     * Crea una sala nueva donde este jugador actúa como Anfitrión
     */
    async crearSala(codigoSala, infoAnfitrion) {
        this.esAnfitrion = true;
        this.isHost = true;
        this.codigoSala = (codigoSala || GestorMultijugador.generarIdSala()).toUpperCase().trim();
        this.roomCode = this.codigoSala;
        this.miInfoJugador = { ...this.miInfoJugador, ...infoAnfitrion, esAnfitrion: true };
        this.myPlayerInfo = this.miInfoJugador;

        const idParAnfitrion = `poker-room-${this.codigoSala.toLowerCase()}`;
        await this.iniciarPar(idParAnfitrion);

        const primerJugador = {
            peerId: this.idPar,
            id: this.idPar,
            nombre: this.miInfoJugador.nombre || this.miInfoJugador.name,
            name: this.miInfoJugador.nombre || this.miInfoJugador.name,
            avatar: this.miInfoJugador.avatar,
            esAnfitrion: true,
            isHost: true,
            fichas: infoAnfitrion.fichasIniciales || infoAnfitrion.initialChips || 1000,
            chips: infoAnfitrion.fichasIniciales || infoAnfitrion.initialChips || 1000,
            asiento: 0,
            seat: 0
        };

        this.jugadoresConectados = [primerJugador];
        this.connectedPlayers = this.jugadoresConectados;

        this.par.on('connection', (conexion) => {
            this.gestionarConexionEntrante(conexion);
        });

        return {
            codigoSala: this.codigoSala,
            roomCode: this.codigoSala,
            idPar: this.idPar,
            peerId: this.idPar,
            urlCompartir: `${window.location.origin}${window.location.pathname}?sala=${this.codigoSala}`
        };
    }
    createRoom(roomCode, hostPlayerInfo) { return this.crearSala(roomCode, hostPlayerInfo); }

    /**
     * Procesa una conexión entrante desde otro cliente
     */
    gestionarConexionEntrante(conexion) {
        conexion.on('open', () => {
            this.conexiones.set(conexion.peer, conexion);

            conexion.on('data', (datos) => {
                this.gestionarDatosDeCliente(conexion.peer, datos);
            });

            conexion.on('close', () => {
                this.gestionarDesconexionCliente(conexion.peer);
            });
        });
    }

    gestionarDatosDeCliente(idPar, datos) {
        if (!datos || !datos.type) return;

        switch (datos.type) {
            case 'JOIN_REQUEST':
                this.procesarPeticionUnion(idPar, datos.payload);
                break;
            case 'PLAYER_ACTION':
                if (this.devolucionesLlamada.onPlayerAction) {
                    this.devolucionesLlamada.onPlayerAction(idPar, datos.payload);
                }
                break;
            case 'CHAT_MESSAGE':
                this.emitirATodos({
                    type: 'CHAT_BROADCAST',
                    payload: {
                        senderId: idPar,
                        senderName: datos.payload.senderName,
                        text: datos.payload.text,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                });
                break;
        }
    }

    procesarPeticionUnion(idPar, carga) {
        const conexion = this.conexiones.get(idPar);
        if (!conexion) return;

        if (this.jugadoresConectados.length >= 6) {
            conexion.send({
                type: 'JOIN_REJECTED',
                payload: { reason: 'La mesa está completa (máximo 6 jugadores).' }
            });
            return;
        }

        const asientosOcupados = this.jugadoresConectados.map(j => j.asiento);
        let asientoDisponible = 0;
        for (let s = 0; s < 6; s++) {
            if (!asientosOcupados.includes(s)) {
                asientoDisponible = s;
                break;
            }
        }

        const nuevoJugador = {
            peerId: idPar,
            id: idPar,
            nombre: carga.nombre || carga.name || `Jugador ${this.jugadoresConectados.length + 1}`,
            name: carga.nombre || carga.name || `Jugador ${this.jugadoresConectados.length + 1}`,
            avatar: carga.avatar || 'navy',
            esAnfitrion: false,
            isHost: false,
            fichas: carga.fichasIniciales || carga.initialChips || 1000,
            chips: carga.fichasIniciales || carga.initialChips || 1000,
            asiento: asientoDisponible,
            seat: asientoDisponible
        };

        this.jugadoresConectados.push(nuevoJugador);
        this.connectedPlayers = this.jugadoresConectados;

        conexion.send({
            type: 'JOIN_ACCEPTED',
            payload: {
                mySeat: asientoDisponible,
                myId: idPar,
                roomCode: this.codigoSala,
                players: this.jugadoresConectados
            }
        });

        this.emitirATodos({
            type: 'PLAYER_JOINED',
            payload: {
                player: nuevoJugador,
                players: this.jugadoresConectados
            }
        });

        if (this.devolucionesLlamada.onPlayerJoined) {
            this.devolucionesLlamada.onPlayerJoined(nuevoJugador);
        }
    }

    gestionarDesconexionCliente(idPar) {
        const indice = this.jugadoresConectados.findIndex(j => j.peerId === idPar);
        if (indice !== -1) {
            const desconectado = this.jugadoresConectados[indice];
            this.jugadoresConectados.splice(indice, 1);
            this.connectedPlayers = this.jugadoresConectados;
            this.conexiones.delete(idPar);

            this.emitirATodos({
                type: 'PLAYER_LEFT',
                payload: {
                    peerId: idPar,
                    name: desconectado.nombre || desconectado.name,
                    players: this.jugadoresConectados
                }
            });

            if (this.devolucionesLlamada.onPlayerLeft) {
                this.devolucionesLlamada.onPlayerLeft(desconectado);
            }
        }
    }

    /**
     * Unirse a una sala remota
     */
    async unirseASala(codigoSala, infoCliente) {
        this.esAnfitrion = false;
        this.isHost = false;
        this.codigoSala = codigoSala.toUpperCase().trim();
        this.roomCode = this.codigoSala;
        this.miInfoJugador = { ...this.miInfoJugador, ...infoCliente };
        this.myPlayerInfo = this.miInfoJugador;

        await this.iniciarPar();

        const idParAnfitrion = `poker-room-${this.codigoSala.toLowerCase()}`;
        return new Promise((resolver, rechazar) => {
            const conexion = this.par.connect(idParAnfitrion, { reliable: true });
            this.conexionAnfitrion = conexion;
            this.hostConn = conexion;

            const temporizador = setTimeout(() => {
                rechazar(new Error('Tiempo de espera agotado. Verifica el código de mesa y que el anfitrión esté dentro.'));
            }, 10000);

            conexion.on('open', () => {
                clearTimeout(temporizador);
                conexion.send({
                    type: 'JOIN_REQUEST',
                    payload: {
                        nombre: this.miInfoJugador.nombre || this.miInfoJugador.name,
                        avatar: this.miInfoJugador.avatar,
                        fichasIniciales: this.miInfoJugador.fichasIniciales || this.miInfoJugador.initialChips || 1000
                    }
                });
            });

            conexion.on('data', (datos) => {
                if (datos.type === 'JOIN_ACCEPTED') {
                    this.miInfoJugador.id = datos.payload.myId;
                    this.miInfoJugador.asiento = datos.payload.mySeat;
                    this.miInfoJugador.seat = datos.payload.mySeat;
                    this.jugadoresConectados = datos.payload.players;
                    this.connectedPlayers = this.jugadoresConectados;
                    resolver(datos.payload);
                } else if (datos.type === 'JOIN_REJECTED') {
                    rechazar(new Error(datos.payload.reason || 'No se pudo unir a la mesa.'));
                } else {
                    this.gestionarDatosDeAnfitrion(datos);
                }
            });

            conexion.on('close', () => {
                if (this.devolucionesLlamada.onDisconnected) {
                    this.devolucionesLlamada.onDisconnected('La conexión con la mesa ha finalizado.');
                }
            });

            conexion.on('error', (err) => {
                clearTimeout(temporizador);
                rechazar(err);
            });
        });
    }
    joinRoom(roomCode, clientInfo) { return this.unirseASala(roomCode, clientInfo); }

    gestionarDatosDeAnfitrion(datos) {
        if (!datos || !datos.type) return;

        switch (datos.type) {
            case 'GAME_STATE_UPDATE':
                if (this.devolucionesLlamada.onGameStateUpdate) {
                    this.devolucionesLlamada.onGameStateUpdate(datos.payload);
                }
                break;
            case 'PLAYER_JOINED':
                this.jugadoresConectados = datos.payload.players;
                this.connectedPlayers = this.jugadoresConectados;
                if (this.devolucionesLlamada.onPlayerJoined) {
                    this.devolucionesLlamada.onPlayerJoined(datos.payload.player);
                }
                break;
            case 'PLAYER_LEFT':
                this.jugadoresConectados = datos.payload.players;
                this.connectedPlayers = this.jugadoresConectados;
                if (this.devolucionesLlamada.onPlayerLeft) {
                    this.devolucionesLlamada.onPlayerLeft(datos.payload);
                }
                break;
            case 'PRIVATE_CARDS':
                if (this.devolucionesLlamada.onPrivateCards) {
                    this.devolucionesLlamada.onPrivateCards(datos.payload.cards);
                }
                break;
            case 'CHAT_BROADCAST':
                if (this.devolucionesLlamada.onChatMessage) {
                    this.devolucionesLlamada.onChatMessage(datos.payload);
                }
                break;
            case 'ROUND_WINNERS':
                if (this.devolucionesLlamada.onRoundWinners) {
                    this.devolucionesLlamada.onRoundWinners(datos.payload);
                }
                break;
        }
    }

    enviarAccion(tipoAccion, cantidad = 0) {
        const carga = {
            action: tipoAccion,
            tipoAccion: tipoAccion,
            amount: cantidad,
            cantidad: cantidad,
            playerId: this.miInfoJugador.id
        };

        if (this.esAnfitrion) {
            if (this.devolucionesLlamada.onPlayerAction) {
                this.devolucionesLlamada.onPlayerAction(this.idPar, carga);
            }
        } else if (this.conexionAnfitrion && this.conexionAnfitrion.open) {
            this.conexionAnfitrion.send({
                type: 'PLAYER_ACTION',
                payload: carga
            });
        }
    }
    sendAction(action, amount) { this.enviarAccion(action, amount); }

    enviarChat(texto) {
        if (!texto || !texto.trim()) return;

        const carga = {
            senderName: this.miInfoJugador.nombre || this.miInfoJugador.name,
            text: texto.trim()
        };

        if (this.esAnfitrion) {
            this.emitirATodos({
                type: 'CHAT_BROADCAST',
                payload: {
                    senderId: this.idPar,
                    senderName: carga.senderName,
                    text: carga.text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            });
        } else if (this.conexionAnfitrion && this.conexionAnfitrion.open) {
            this.conexionAnfitrion.send({
                type: 'CHAT_MESSAGE',
                payload: carga
            });
        }
    }
    sendChat(text) { this.enviarChat(text); }

    enviarAPar(idPar, mensaje) {
        if (idPar === this.idPar) {
            this.gestionarDatosDeAnfitrion(mensaje);
            return;
        }
        const conn = this.conexiones.get(idPar);
        if (conn && conn.open) {
            conn.send(mensaje);
        }
    }
    sendToPeer(peerId, msg) { this.enviarAPar(peerId, msg); }

    emitirATodos(mensaje) {
        if (!this.esAnfitrion) return;
        this.gestionarDatosDeAnfitrion(mensaje);
        this.conexiones.forEach(conn => {
            if (conn.open) conn.send(mensaje);
        });
    }
    broadcast(msg) { this.emitirATodos(msg); }

    destruir() {
        if (this.conexionAnfitrion) this.conexionAnfitrion.close();
        this.conexiones.forEach(conn => conn.close());
        this.conexiones.clear();
        if (this.par) this.par.destroy();
    }
    destroy() { this.destruir(); }
}

window.GestorMultijugador = GestorMultijugador;
window.MultiplayerManager = GestorMultijugador;
