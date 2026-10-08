class MontecarloPlinko {
    constructor(nivel = 1, ancho = 500, alto = 500) {
        this.width = ancho;
        this.height = alto;
        this.inicioY = 55;

        // Configuracion matematica con ajuste al 100% del canvas y ROI entre -1% y -5%
        this.configNiveles = {
            1: {
                nombre: "Nivel 1 - Bajo",
                filas: 8,
                multiplicadores: [3.7, 1.6, 0.8, 0.5, 0.3, 0.5, 0.8, 1.6, 3.7]
            },
            2: {
                nombre: "Nivel 2 - Medio",
                filas: 10,
                multiplicadores: [4.8, 1.9, 1.0, 0.5, 0.4, 0.2, 0.4, 0.5, 1.0, 1.9, 4.8]
            },
            3: {
                nombre: "Nivel 3 - Alto",
                filas: 12,
                multiplicadores: [6.0, 2.6, 1.4, 0.7, 0.4, 0.2, 0.2, 0.2, 0.4, 0.7, 1.4, 2.6, 6.0]
            }
        };

        this.setNivel(nivel);
    }

    setNivel(nivel = 1) {
        if (!this.configNiveles[nivel]) nivel = 1;
        this.nivel = Number(nivel);
        let cfg = this.configNiveles[this.nivel];
        this.filas = cfg.filas;
        this.multiplicadores = [...cfg.multiplicadores];

        this.slotWidth = this.width / this.multiplicadores.length;
        this.pasoY = 345 / this.filas;

        this.topMinX = this.width / 2 - this.slotWidth * 0.95;
        this.topMaxX = this.width / 2 + this.slotWidth * 0.95;
        this.totalH = (this.filas - 1) * this.pasoY;

        this.crearObstaculos();
    }

    crearObstaculos() {
        this.obstaculos = [];
        for (let i = 0; i < this.filas; i++) {
            let nObstaculos = i + 1;
            let anchoFila = i * this.slotWidth;
            let inicioX = (this.width - anchoFila) / 2;

            for (let j = 0; j < nObstaculos; j++) {
                this.obstaculos.push({
                    x: inicioX + j * this.slotWidth,
                    y: this.inicioY + i * this.pasoY,
                    radio: 5,
                    rebote: 0.5
                });
            }
        }
    }

    simularPelota(apuesta = 1) {
        let x = (this.width / 2) + (Math.random() - 0.5) * 4.0;
        let y = 25.0;
        let vx = (Math.random() - 0.5) * 0.3;
        let vy = 1.0;

        const radio = 6.5;
        const reboteBola = 0.5;
        const limiteY = this.height - 42;
        const maxPasos = 2500;
        let pasos = 0;

        while (y < limiteY && pasos < maxPasos) {
            pasos++;
            vy += 0.28;
            vx *= 0.98;
            x += vx;
            y += vy;

            // Limites exteriores del canvas
            if (x - radio < 0) {
                x = radio;
                vx = Math.abs(vx) * reboteBola;
            } else if (x + radio > this.width) {
                x = this.width - radio;
                vx = -Math.abs(vx) * reboteBola;
            }

            // Paredes diagonales del embudo
            if (y >= this.inicioY - 10) {
                let t = Math.max(0, Math.min(1, (y - this.inicioY) / this.totalH));
                let paredIzq = this.topMinX + t * (0 - this.topMinX);
                let paredDer = this.topMaxX + t * (this.width - this.topMaxX);

                if (x - radio < paredIzq) {
                    x = paredIzq + radio;
                    vx = Math.abs(vx) * reboteBola + 0.3;
                } else if (x + radio > paredDer) {
                    x = paredDer - radio;
                    vx = -Math.abs(vx) * reboteBola - 0.3;
                }
            }

            // Colisiones con obstaculos
            for (let i = 0; i < this.obstaculos.length; i++) {
                let obs = this.obstaculos[i];
                let dx = x - obs.x;
                let dy = y - obs.y;
                let dist = Math.hypot(dx, dy);
                let minDist = radio + obs.radio;

                if (dist < minDist && dist > 0) {
                    let angulo = Math.atan2(dy, dx);
                    x = obs.x + Math.cos(angulo) * (minDist + 0.5);
                    y = obs.y + Math.sin(angulo) * (minDist + 0.5);

                    let rapidez = Math.hypot(vx, vy) * obs.rebote;
                    if (rapidez < 1.6) rapidez = 1.6;

                    let impulsoLateral = (dx >= 0 ? 0.6 : -0.6);
                    vx = Math.cos(angulo) * rapidez + impulsoLateral;
                    vy = Math.sin(angulo) * rapidez;
                    if (vy < 0) vy *= 0.4;
                }
            }
        }

        let indice = Math.floor(x / this.slotWidth);
        indice = Math.max(0, Math.min(this.multiplicadores.length - 1, indice));

        let mult = this.multiplicadores[indice];
        return {
            indice: indice,
            multiplicador: mult,
            premio: apuesta * mult
        };
    }

    ejecutar(numPelotas = 20000, apuestaPorPelota = 1, nivel = null) {
        if (nivel !== null) {
            this.setNivel(nivel);
        }

        let totalApostado = numPelotas * apuestaPorPelota;
        let totalRetornado = 0;
        let frecuencias = new Array(this.multiplicadores.length).fill(0);

        for (let i = 0; i < numPelotas; i++) {
            let res = this.simularPelota(apuestaPorPelota);
            frecuencias[res.indice]++;
            totalRetornado += res.premio;
        }

        let beneficioNeto = totalRetornado - totalApostado;
        let ev = totalRetornado / totalApostado;
        let rtp = ev * 100;
        let roi = (beneficioNeto / totalApostado) * 100;

        let desglose = this.multiplicadores.map((mult, idx) => {
            let caidas = frecuencias[idx];
            let probabilidad = (caidas / numPelotas) * 100;
            let aporteEV = (probabilidad / 100) * mult;
            return {
                Casilla: idx + 1,
                Multiplicador: mult + "x",
                Bolas: caidas,
                Probabilidad: probabilidad.toFixed(2) + "%",
                Aporte_EV: aporteEV.toFixed(4)
            };
        });

        console.log("=== SIMULACION MONTE CARLO - PLINKO (" + this.configNiveles[this.nivel].nombre + ") ===");
        if (typeof console.table === "function") {
            console.table(desglose);
        }

        console.log("--- RESUMEN FINANCIERO ---");
        console.log("Total pelotas: " + numPelotas);
        console.log("Apuesta por pelota: " + apuestaPorPelota.toFixed(2));
        console.log("Total apostado: " + totalApostado.toFixed(2));
        console.log("Total retornado: " + totalRetornado.toFixed(2));
        console.log("Beneficio neto: " + beneficioNeto.toFixed(2));
        console.log("Valor Esperado (EV): " + ev.toFixed(4));
        console.log("RTP: " + rtp.toFixed(2) + "%");
        console.log("ROI: " + roi.toFixed(2) + "%");

        return {
            nivel: this.nivel,
            filas: this.filas,
            totalPelotas: numPelotas,
            totalApostado: totalApostado,
            totalRetornado: totalRetornado,
            beneficioNeto: beneficioNeto,
            ev: ev,
            rtp: rtp,
            roi: roi,
            frecuencias: frecuencias,
            multiplicadores: this.multiplicadores
        };
    }
}

// Ejecucion por defecto en consola
let simulador = new MontecarloPlinko(1);
let resultado = simulador.ejecutar(20000, 1);
