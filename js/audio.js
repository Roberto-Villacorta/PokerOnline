/**
 * Sintetizador de Efectos de Sonido de Casino con Web Audio API
 * No depende de archivos de audio externos, garantizando funcionamiento 100% autónomo y sin latencia.
 */

class SoundFX {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initOnFirstInteraction();
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initOnFirstInteraction() {
        const unlock = () => {
            this.init();
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Sonido al repartir o deslizar una carta sobre el tapete
     */
    playCardDeal() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 2.5;

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    /**
     * Sonido de fichas de cerámica chocando
     */
    playChipClink(count = 2) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const freq = 1800 + Math.random() * 900;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.045);
            osc.frequency.exponentialRampToValueAtTime(800, now + i * 0.045 + 0.035);

            gain.gain.setValueAtTime(0.01, now + i * 0.045);
            gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.045 + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.045);
            osc.stop(now + i * 0.045 + 0.045);
        }
    }

    /**
     * Sonido de "Pasar" (doble toque en la mesa)
     */
    playCheckTap() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [0, 0.11].forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now + delay);
            osc.frequency.exponentialRampToValueAtTime(60, now + delay + 0.05);

            gain.gain.setValueAtTime(0.35, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.055);
        });
    }

    /**
     * Sonido de "No ir / Fold" (descarte rápido de carta)
     */
    playFold() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * Sonido de alerta de turno
     */
    playTurnAlert() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
    }

    /**
     * Sonido de All-in / Tensión
     */
    playAllIn() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(520, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    /**
     * Fanfarria de victoria / recaudación de bote
     */
    playWinFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio
        const now = this.ctx.currentTime;

        notes.forEach((note, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note;

            const startTime = now + i * 0.09;
            const duration = i === notes.length - 1 ? 0.45 : 0.18;

            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
        });

        // Cascada de fichas después de la fanfarria
        setTimeout(() => this.playChipClink(5), 380);
    }
}

// Instancia global
window.AudioFX = new SoundFX();
