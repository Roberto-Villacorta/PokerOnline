/**
 * CLUB DE CASINO - MÓDULO INDEPENDIENTE DE BLACKJACK 21
 * Incluye motor de cartas, cálculo de As dinámico (1 u 11),
 * pagos especiales para Blackjack (3:2 frente a 1:1 normal) y sistema de apuestas.
 */

class CartaBJ {
    constructor(valor_real, valor, palo) {
        this.valor_real = valor_real; // 1 - 13
        this.valor = valor;           // 1 - 10
        this.palo = palo;             // 'P', 'C', 'D', 'T'
    }

    toString() {
        return `${this.valor_real}${this.palo}`;
    }

    getSimboloPalo() {
        const mapa = { 'P': '♠', 'C': '♥', 'D': '♦', 'T': '♣' };
        return mapa[this.palo] || this.palo;
    }

    getNombreRango() {
        if (this.valor_real === 1) return 'A';
        if (this.valor_real === 11) return 'J';
        if (this.valor_real === 12) return 'Q';
        if (this.valor_real === 13) return 'K';
        return this.valor_real.toString();
    }

    getClasePalo() {
        const mapa = { 'P': 'spades', 'C': 'hearts', 'D': 'diamonds', 'T': 'clubs' };
        return mapa[this.palo] || 'spades';
    }
}

class MotorBlackjack {
    constructor() {
        this.palos = ["P", "C", "D", "T"];
        this.cartas = [];
        this.cartas_jugador = [];
        this.cartas_crupier = [];
        this.indice_carta = 0;
        this.fichas = 1000;
        this.apuestaSeleccionada = 50;
        this.apuestaActual = 50;
        this.juegoActivo = false;
    }

    generarBaraja() {
        this.cartas = [];
        for (const palo of this.palos) {
            for (let j = 1; j <= 13; j++) {
                if (j > 10) {
                    this.cartas.push(new CartaBJ(j, 10, palo));
                } else {
                    this.cartas.push(new CartaBJ(j, j, palo));
                }
            }
        }
        // Mezcla aleatoria Fisher-Yates
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const k = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[k]] = [this.cartas[k], this.cartas[i]];
        }
        this.indice_carta = 0;
    }

    pedirCarta(jugador = true) {
        if (this.indice_carta >= this.cartas.length) {
            this.generarBaraja();
        }
        const carta = this.cartas[this.indice_carta];
        this.indice_carta++;
        if (jugador) {
            this.cartas_jugador.push(carta);
        } else {
            this.cartas_crupier.push(carta);
        }
        return carta;
    }

    /**
     * Calcula los puntos de una mano.
     * Ajusta el As automáticamente como 11 u 1 según no sobrepase 21.
     */
    calcularPuntos(mano) {
        let total = 0;
        let ases = 0;

        for (const c of mano) {
            if (c.valor_real === 1) {
                ases++;
                total += 11;
            } else {
                total += c.valor;
            }
        }

        // Si el total sobrepasa 21, convertimos Ases de 11 a 1 (-10 por cada As)
        while (total > 21 && ases > 0) {
            total -= 10;
            ases--;
        }

        return total;
    }

    esBlackjackNatural(mano) {
        return mano.length === 2 && this.calcularPuntos(mano) === 21;
    }

    iniciarPartida(montoApuesta = null) {
        if (montoApuesta) {
            this.apuestaSeleccionada = montoApuesta;
        }

        if (this.fichas < 10) {
            this.fichas = 1000; // Recarga de fichas si se queda a cero
        }

        this.apuestaActual = Math.min(this.apuestaSeleccionada, this.fichas);
        this.fichas -= this.apuestaActual;

        this.generarBaraja();
        this.cartas_jugador = [];
        this.cartas_crupier = [];
        this.juegoActivo = true;

        // Repartimos 2 cartas al jugador y 1 al crupier
        this.pedirCarta(true);
        this.pedirCarta(true);
        this.pedirCarta(false);

        // Si el jugador consigue Blackjack natural de inicio
        if (this.esBlackjackNatural(this.cartas_jugador)) {
            return true;
        }

        return null;
    }

    evaluarResultado() {
        const puntosUser = this.calcularPuntos(this.cartas_jugador);
        const puntosCrupier = this.calcularPuntos(this.cartas_crupier);
        const esBJUser = this.esBlackjackNatural(this.cartas_jugador);
        const esBJCrupier = this.esBlackjackNatural(this.cartas_crupier);

        let mensaje = "";
        let tipo = ""; // 'blackjack', 'victoria', 'derrota', 'empate'
        let gananciaNeta = 0;

        if (puntosUser > 21) {
            mensaje = "Has perdido: Te has pasado de 21 puntos";
            tipo = "derrota";
            gananciaNeta = -this.apuestaActual;
        } else if (esBJUser && !esBJCrupier) {
            // PAGO BLACKJACK 3:2 (1.5x de la apuesta de beneficio)
            const gananciaBJ = Math.floor(this.apuestaActual * 1.5);
            const cobroTotal = this.apuestaActual + gananciaBJ;
            this.fichas += cobroTotal;
            gananciaNeta = gananciaBJ;
            mensaje = `BLACKJACK - Paga 3:2 (+$${gananciaBJ})`;
            tipo = "blackjack";
        } else if (puntosCrupier > 21) {
            const cobroTotal = this.apuestaActual * 2;
            this.fichas += cobroTotal;
            gananciaNeta = this.apuestaActual;
            mensaje = `Has ganado: El crupier se ha pasado (+$${this.apuestaActual})`;
            tipo = "victoria";
        } else if (puntosCrupier > puntosUser) {
            mensaje = "Ha ganado el crupier";
            tipo = "derrota";
            gananciaNeta = -this.apuestaActual;
        } else if (puntosCrupier === puntosUser) {
            this.fichas += this.apuestaActual;
            mensaje = `Empate: Se devuelven las apuestas ($${this.apuestaActual})`;
            tipo = "empate";
            gananciaNeta = 0;
        } else {
            const cobroTotal = this.apuestaActual * 2;
            this.fichas += cobroTotal;
            gananciaNeta = this.apuestaActual;
            mensaje = `Has ganado (+$${this.apuestaActual})`;
            tipo = "victoria";
        }

        return {
            puntosUser,
            puntosCrupier,
            mensaje,
            tipo,
            gananciaNeta,
            fichas: this.fichas
        };
    }

    plantarse() {
        this.juegoActivo = false;

        // Crupier roba hasta tener al menos 17 puntos
        while (this.calcularPuntos(this.cartas_crupier) < 17) {
            this.pedirCarta(false);
        }

        return this.evaluarResultado();
    }
}

// Instancia global del motor de Blackjack
window.motorBJ = new MotorBlackjack();

// Controlador UI de Blackjack
window.ControladorBlackjack = {
    enTurnoCrupier: false,

    iniciar() {
        this.vistas = {
            cartasJugador: document.getElementById('bjPlayerCards'),
            cartasCrupier: document.getElementById('bjDealerCards'),
            puntosJugador: document.getElementById('bjPlayerPoints'),
            puntosCrupier: document.getElementById('bjDealerPoints'),
            bannerResultado: document.getElementById('bjResultBanner'),
            mensajeResultado: document.getElementById('bjResultMessage'),
            textoTurno: document.getElementById('bjTurnText'),
            fichas: document.getElementById('bjBankrollDisplay'),
            apuesta: document.getElementById('bjCurrentBetDisplay'),
            btnHit: document.getElementById('btnBjHit'),
            btnStand: document.getElementById('btnBjStand'),
            btnNewGame: document.getElementById('btnBjNewGame')
        };

        this.vincularEventos();
    },

    vincularEventos() {
        if (this.vistas.btnHit) {
            this.vistas.btnHit.addEventListener('click', () => this.pedirCarta());
        }
        if (this.vistas.btnStand) {
            this.vistas.btnStand.addEventListener('click', () => this.plantarse());
        }
        if (this.vistas.btnNewGame) {
            this.vistas.btnNewGame.addEventListener('click', () => this.nuevaMano());
        }

        // Selección de fichas de apuesta
        document.querySelectorAll('.btn-bj-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.enTurnoCrupier) return;
                const monto = parseInt(e.currentTarget.dataset.amount, 10) || 50;
                window.motorBJ.apuestaSeleccionada = monto;
                document.querySelectorAll('.btn-bj-bet').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                if (window.EfectosAudio) window.EfectosAudio.reproducirTintineoFichas(1);
                this.actualizarUI();
            });
        });
    },

    async nuevaMano() {
        if (this.enTurnoCrupier) return;
        const tieneBJ = window.motorBJ.iniciarPartida();
        if (window.EfectosAudio) window.EfectosAudio.reproducirRepartoCarta();

        if (tieneBJ) {
            this.renderizar(false);
            await new Promise(res => setTimeout(res, 600));
            await this.ejecutarTurnoCrupier();
        } else {
            this.renderizar(false);
        }
    },

    async pedirCarta() {
        if (this.enTurnoCrupier || !window.motorBJ.juegoActivo) return;
        window.motorBJ.pedirCarta(true);
        if (window.EfectosAudio) window.EfectosAudio.reproducirRepartoCarta();

        const puntosUser = window.motorBJ.calcularPuntos(window.motorBJ.cartas_jugador);
        if (puntosUser >= 21) {
            this.renderizar(false);
            await new Promise(res => setTimeout(res, 500));
            await this.ejecutarTurnoCrupier();
        } else {
            this.renderizar(false);
        }
    },

    async plantarse() {
        if (this.enTurnoCrupier || !window.motorBJ.juegoActivo) return;
        await this.ejecutarTurnoCrupier();
    },

    async ejecutarTurnoCrupier() {
        const motor = window.motorBJ;
        motor.juegoActivo = false;
        this.enTurnoCrupier = true;

        if (this.vistas.btnHit) this.vistas.btnHit.disabled = true;
        if (this.vistas.btnStand) this.vistas.btnStand.disabled = true;
        if (this.vistas.btnNewGame) this.vistas.btnNewGame.disabled = true;

        if (this.vistas.textoTurno) {
            this.vistas.textoTurno.textContent = 'Turno del crupier: Jugando mano...';
        }

        // Revelar la primera carta del crupier y sus puntos iniciales
        this.renderizar(true, null);

        // Crupier roba hasta tener al menos 17 puntos
        // Espera de 500ms entre cada robo de carta
        while (motor.calcularPuntos(motor.cartas_crupier) < 17) {
            await new Promise(resolve => setTimeout(resolve, 500));
            motor.pedirCarta(false);
            if (window.EfectosAudio) window.EfectosAudio.reproducirRepartoCarta();
            this.renderizar(true, null);
        }

        // Breve pausa de 500ms tras el último robo para observar el tapete
        await new Promise(resolve => setTimeout(resolve, 500));

        const resultado = motor.evaluarResultado();
        this.enTurnoCrupier = false;
        this.renderizar(true, resultado);
    },

    renderizar(revelarCrupier = false, resultado = null) {
        const motor = window.motorBJ;
        const v = this.vistas;

        if (!v.cartasJugador || !v.cartasCrupier) return;

        // Renderizar Cartas Jugador
        v.cartasJugador.innerHTML = '';
        motor.cartas_jugador.forEach(carta => {
            v.cartasJugador.appendChild(this.crearElementoCarta(carta));
        });
        if (v.puntosJugador) {
            v.puntosJugador.textContent = `Puntos: ${motor.calcularPuntos(motor.cartas_jugador)}`;
        }

        // Renderizar Cartas Crupier y apilar si roba más de 2 cartas
        v.cartasCrupier.innerHTML = '';
        const crupierMasDeDos = motor.cartas_crupier.length > 2;
        if (crupierMasDeDos) {
            v.cartasCrupier.classList.add('stacked');
        } else {
            v.cartasCrupier.classList.remove('stacked');
        }

        motor.cartas_crupier.forEach((carta, index) => {
            const cartaEl = this.crearElementoCarta(carta);
            cartaEl.style.zIndex = index + 1;
            v.cartasCrupier.appendChild(cartaEl);
        });

        if (v.puntosCrupier) {
            if (revelarCrupier) {
                v.puntosCrupier.textContent = `Puntos: ${motor.calcularPuntos(motor.cartas_crupier)}`;
            } else {
                v.puntosCrupier.textContent = `Puntos: ${motor.calcularPuntos([motor.cartas_crupier[0]])}`;
            }
        }

        // Actualizar displays de Fichas y Apuestas
        if (v.fichas) v.fichas.textContent = `$${motor.fichas}`;
        if (v.apuesta) v.apuesta.textContent = `$${motor.apuestaActual}`;

        // Estado de botones e información de turno
        if (motor.juegoActivo) {
            if (v.btnHit) v.btnHit.disabled = false;
            if (v.btnStand) v.btnStand.disabled = false;
            if (v.btnNewGame) v.btnNewGame.disabled = false;
            if (v.textoTurno) v.textoTurno.textContent = 'Tu turno: Presiona IR (C) para pedir o PLANTARSE (V) para plantarse.';
            if (v.bannerResultado) v.bannerResultado.style.display = 'none';
        } else if (this.enTurnoCrupier) {
            if (v.btnHit) v.btnHit.disabled = true;
            if (v.btnStand) v.btnStand.disabled = true;
            if (v.btnNewGame) v.btnNewGame.disabled = true;
            if (v.textoTurno) v.textoTurno.textContent = 'Turno del crupier: Robando cartas...';
            if (v.bannerResultado) v.bannerResultado.style.display = 'none';
        } else {
            if (v.btnHit) v.btnHit.disabled = true;
            if (v.btnStand) v.btnStand.disabled = true;
            if (v.btnNewGame) v.btnNewGame.disabled = false;
            if (v.textoTurno) v.textoTurno.textContent = 'Mano finalizada. Selecciona tu apuesta y pulsa NUEVA MANO (Espacio).';

            if (resultado && v.bannerResultado && v.mensajeResultado) {
                v.mensajeResultado.textContent = resultado.mensaje;
                v.bannerResultado.style.display = 'block';

                if (resultado.tipo === 'blackjack') {
                    v.bannerResultado.className = 'bj-result-banner blackjack';
                    if (window.EfectosAudio) {
                        window.EfectosAudio.reproducirFanfarriaVictoria();
                        window.EfectosAudio.reproducirTintineoFichas(4);
                    }
                } else if (resultado.tipo === 'victoria') {
                    v.bannerResultado.className = 'bj-result-banner victoria';
                    if (window.EfectosAudio) {
                        window.EfectosAudio.reproducirFanfarriaVictoria();
                    }
                } else if (resultado.tipo === 'derrota') {
                    v.bannerResultado.className = 'bj-result-banner derrota';
                    if (window.EfectosAudio) {
                        window.EfectosAudio.reproducirRetirada();
                    }
                } else {
                    v.bannerResultado.className = 'bj-result-banner empate';
                }
            }
        }
    },

    actualizarUI() {
        const v = this.vistas;
        if (v.apuesta) v.apuesta.textContent = `$${window.motorBJ.apuestaSeleccionada}`;
    },

    crearElementoCarta(carta) {
        const div = document.createElement('div');
        const paloSimbolo = carta.getSimboloPalo();
        const rango = carta.getNombreRango();
        const clasePalo = carta.getClasePalo();

        div.className = `poker-card ${clasePalo}`;
        div.innerHTML = `
            <div class="card-top">
                <span class="card-rank">${rango}</span>
                <span class="card-suit">${paloSimbolo}</span>
            </div>
            <div class="card-center-suit">${paloSimbolo}</div>
            <div class="card-bottom">
                <span class="card-rank">${rango}</span>
                <span class="card-suit">${paloSimbolo}</span>
            </div>
        `;
        return div;
    }
};
