/**
 * Sintetizador de Efectos de Sonido de Casino en Castellano (Web Audio API)
 * Totalmente autónomo sin dependencias externas.
 */

class EfectosSonido {
    constructor() {
        this.contexto = null;
        this.estaSilenciado = false;
        this.iniciarEnPrimeraInteraccion();
    }

    iniciar() {
        if (!this.contexto) {
            const ContextoAudio = window.AudioContext || window.webkitAudioContext;
            if (ContextoAudio) {
                this.contexto = new ContextoAudio();
            }
        }
        if (this.contexto && this.contexto.state === 'suspended') {
            this.contexto.resume();
        }
    }

    iniciarEnPrimeraInteraccion() {
        const desbloquear = () => {
            this.iniciar();
            document.removeEventListener('click', desbloquear);
            document.removeEventListener('keydown', desbloquear);
            document.removeEventListener('touchstart', desbloquear);
        };
        document.addEventListener('click', desbloquear, { once: true });
        document.addEventListener('keydown', desbloquear, { once: true });
        document.addEventListener('touchstart', desbloquear, { once: true });
    }

    conmutarSilencio() {
        this.estaSilenciado = !this.estaSilenciado;
        return this.estaSilenciado;
    }

    // Alias compatibilidad
    toggleMute() {
        return this.conmutarSilencio();
    }

    /**
     * Sonido al repartir o deslizar una carta sobre el tapete
     */
    reproducirRepartoCarta() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const tamanoBuffer = this.contexto.sampleRate * 0.08;
        const buffer = this.contexto.createBuffer(1, tamanoBuffer, this.contexto.sampleRate);
        const datos = buffer.getChannelData(0);
        for (let i = 0; i < tamanoBuffer; i++) {
            datos[i] = Math.random() * 2 - 1;
        }

        const ruido = this.contexto.createBufferSource();
        ruido.buffer = buffer;

        const filtro = this.contexto.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = 1400;
        filtro.Q.value = 2.5;

        const ganancia = this.contexto.createGain();
        const ahora = this.contexto.currentTime;
        ganancia.gain.setValueAtTime(0.01, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.2, ahora + 0.015);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.075);

        ruido.connect(filtro);
        filtro.connect(ganancia);
        ganancia.connect(this.contexto.destination);

        ruido.start(ahora);
    }
    playCardDeal() { this.reproducirRepartoCarta(); }

    /**
     * Sonido de fichas cerámicas de poker
     */
    reproducirTintineoFichas(cantidad = 2) {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const ahora = this.contexto.currentTime;

        for (let i = 0; i < cantidad; i++) {
            const osc = this.contexto.createOscillator();
            const ganancia = this.contexto.createGain();

            const frec = 1800 + Math.random() * 900;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frec, ahora + i * 0.045);
            osc.frequency.exponentialRampToValueAtTime(800, ahora + i * 0.045 + 0.035);

            ganancia.gain.setValueAtTime(0.01, ahora + i * 0.045);
            ganancia.gain.exponentialRampToValueAtTime(0.22, ahora + i * 0.045 + 0.005);
            ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + i * 0.045 + 0.04);

            osc.connect(ganancia);
            ganancia.connect(this.contexto.destination);

            osc.start(ahora + i * 0.045);
            osc.stop(ahora + i * 0.045 + 0.045);
        }
    }
    playChipClink(count) { this.reproducirTintineoFichas(count); }

    /**
     * Sonido de "Pasar" (toque en el tapete)
     */
    reproducirToquePaso() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const ahora = this.contexto.currentTime;
        [0, 0.11].forEach(retraso => {
            const osc = this.contexto.createOscillator();
            const ganancia = this.contexto.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, ahora + retraso);
            osc.frequency.exponentialRampToValueAtTime(60, ahora + retraso + 0.05);

            ganancia.gain.setValueAtTime(0.35, ahora + retraso);
            ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + retraso + 0.05);

            osc.connect(ganancia);
            ganancia.connect(this.contexto.destination);

            osc.start(ahora + retraso);
            osc.stop(ahora + retraso + 0.055);
        });
    }
    playCheckTap() { this.reproducirToquePaso(); }

    /**
     * Sonido de retirarse (fold)
     */
    reproducirRetirada() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const ahora = this.contexto.currentTime;
        const osc = this.contexto.createOscillator();
        const ganancia = this.contexto.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, ahora);
        osc.frequency.exponentialRampToValueAtTime(80, ahora + 0.12);

        ganancia.gain.setValueAtTime(0.12, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.12);

        osc.connect(ganancia);
        ganancia.connect(this.contexto.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.13);
    }
    playFold() { this.reproducirRetirada(); }

    /**
     * Sonido de aviso de turno
     */
    reproducirAlertaTurno() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const ahora = this.contexto.currentTime;
        const osc = this.contexto.createOscillator();
        const ganancia = this.contexto.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ahora); // Re 5
        osc.frequency.setValueAtTime(880, ahora + 0.08); // La 5

        ganancia.gain.setValueAtTime(0.18, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.22);

        osc.connect(ganancia);
        ganancia.connect(this.contexto.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.23);
    }
    playTurnAlert() { this.reproducirAlertaTurno(); }

    /**
     * Tensión de ir con todo (All-in)
     */
    reproducirTodoDentro() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const ahora = this.contexto.currentTime;
        const osc = this.contexto.createOscillator();
        const ganancia = this.contexto.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ahora);
        osc.frequency.linearRampToValueAtTime(520, ahora + 0.25);

        ganancia.gain.setValueAtTime(0.25, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);

        osc.connect(ganancia);
        ganancia.connect(this.contexto.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.36);
    }
    playAllIn() { this.reproducirTodoDentro(); }

    /**
     * Fanfarria de bote ganado
     */
    reproducirFanfarriaVictoria() {
        if (this.estaSilenciado) return;
        this.iniciar();
        if (!this.contexto) return;

        const notas = [440, 554.37, 659.25, 880];
        const ahora = this.contexto.currentTime;

        notas.forEach((nota, i) => {
            const osc = this.contexto.createOscillator();
            const ganancia = this.contexto.createGain();

            osc.type = 'triangle';
            osc.frequency.value = nota;

            const inicio = ahora + i * 0.09;
            const duracion = i === notas.length - 1 ? 0.45 : 0.18;

            ganancia.gain.setValueAtTime(0.2, inicio);
            ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);

            osc.connect(ganancia);
            ganancia.connect(this.contexto.destination);

            osc.start(inicio);
            osc.stop(inicio + duracion + 0.02);
        });

        setTimeout(() => this.reproducirTintineoFichas(5), 380);
    }
    playWinFanfare() { this.reproducirFanfarriaVictoria(); }
}

// Instancia global en castellano y alias
window.EfectosAudio = new EfectosSonido();
window.AudioFX = window.EfectosAudio;
window.SoundFX = EfectosSonido;
