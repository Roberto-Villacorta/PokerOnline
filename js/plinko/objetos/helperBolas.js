class HelperBolas {
    constructor() {
        this.bolas = [];
        this.obstaculos = [];
        this.nivelActual = 1;

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

        this.setNivel(1);
    }

    setNivel(nivel = 1) {
        if (!this.configNiveles[nivel]) nivel = 1;
        this.nivelActual = Number(nivel);
        let cfg = this.configNiveles[this.nivelActual];

        this.filas = cfg.filas;
        this.multiplicadores = [...cfg.multiplicadores];
        this.bolas = [];

        let anchoCanvas = (typeof width !== 'undefined') ? width : 500;

        // El ancho de cada casilla divide equitativamente el 100% del canvas
        this.slotWidth = anchoCanvas / this.multiplicadores.length;
        this.pasoY = 345 / this.filas;
        this.inicioY = 55;

        // Limites diagonales del embudo
        this.topMinX = anchoCanvas / 2 - this.slotWidth * 0.95;
        this.topMaxX = anchoCanvas / 2 + this.slotWidth * 0.95;
        this.totalH = (this.filas - 1) * this.pasoY;

        this.crearPiramide();
    }

    crearPiramide() {
        this.obstaculos = [];
        let anchoCanvas = (typeof width !== 'undefined') ? width : 500;

        for (let i = 0; i < this.filas; i++) {
            let nObstaculos = i + 1;
            let anchoFila = i * this.slotWidth;
            let inicioX = (anchoCanvas - anchoFila) / 2;

            for (let j = 0; j < nObstaculos; j++) {
                let posX = inicioX + j * this.slotWidth;
                let posY = this.inicioY + i * this.pasoY;
                this.addObstaculo(posX, posY);
            }
        }
    }

    addBola(posX, apuesta = 0) {
        let anchoCanvas = (typeof width !== 'undefined') ? width : 500;
        if (posX === undefined || posX < this.topMinX || posX > this.topMaxX) {
            posX = anchoCanvas / 2 + (Math.random() - 0.5) * 4;
        }
        this.bolas.push(new Pelota(posX, 25, (Math.random() - 0.5) * 0.3, 1.0, 6.5, 0.5, '#e53e3e', apuesta));
    }

    addObstaculo(posX, posY) {
        this.obstaculos.push(new Obstaculo(posX, posY, 5, 0.5, '#64748b'));
    }

    drawBolas() {
        this.bolas.forEach(bola => {
            bola.dibujar();
        });
    }

    drawObstaculos() {
        if (typeof width === 'undefined' || typeof height === 'undefined') return;

        // Dibujar lineas diagonales guia del embudo exterior
        stroke('#cbd5e1');
        strokeWeight(2);
        line(this.topMinX, this.inicioY - 18, 0, height - 42);
        line(this.topMaxX, this.inicioY - 18, width, height - 42);
        noStroke();

        // Dibujar obstaculos (clavijas)
        this.obstaculos.forEach(obstaculo => {
            obstaculo.dibujar();
        });
    }

    drawMultiplicadores() {
        if (typeof width === 'undefined' || typeof height === 'undefined') return;

        let n = this.multiplicadores.length;
        let tamTexto = n >= 13 ? 9 : (n >= 11 ? 10 : 11);
        let posY = height - 38;
        let altoCasilla = 32;

        textAlign(CENTER, CENTER);
        textSize(tamTexto);

        // Separadores verticales tipo Plinko real alineados con los obstaculos de la ultima fila
        stroke('#94a3b8');
        strokeWeight(1.5);
        for (let i = 0; i <= n; i++) {
            let sepX = i * this.slotWidth;
            line(sepX, height - 44, sepX, height - 4);
        }
        noStroke();

        // Casillas de multiplicadores que llenan el 100% del canvas
        for (let i = 0; i < n; i++) {
            let mult = this.multiplicadores[i];
            let posX = i * this.slotWidth;

            // Paleta de colores segun el valor
            if (mult >= 4) fill(220, 50, 50);
            else if (mult >= 1.5) fill(230, 130, 30);
            else if (mult >= 0.8) fill(210, 180, 40);
            else fill(59, 130, 246);

            stroke(255);
            strokeWeight(1);
            rect(posX + 1.5, posY, this.slotWidth - 3, altoCasilla, 4);

            noStroke();
            fill(255);
            text(mult + 'x', posX + this.slotWidth / 2, posY + altoCasilla / 2 + 1);
        }
    }

    update() {
        if (typeof height === 'undefined' || typeof width === 'undefined') return;

        for (let i = this.bolas.length - 1; i >= 0; i--) {
            let bola = this.bolas[i];
            bola.actualizar();

            // Guiar la bola con las paredes diagonales del embudo
            if (bola.y >= this.inicioY - 10) {
                let t = Math.max(0, Math.min(1, (bola.y - this.inicioY) / this.totalH));
                let paredIzq = this.topMinX + t * (0 - this.topMinX);
                let paredDer = this.topMaxX + t * (width - this.topMaxX);

                if (bola.x - bola.radio < paredIzq) {
                    bola.x = paredIzq + bola.radio;
                    bola.vx = Math.abs(bola.vx) * bola.rebote + 0.3;
                } else if (bola.x + bola.radio > paredDer) {
                    bola.x = paredDer - bola.radio;
                    bola.vx = -Math.abs(bola.vx) * bola.rebote - 0.3;
                }
            }

            // Colisiones con cada obstaculo
            for (let obs of this.obstaculos) {
                bola.comprobarColision(obs);
            }

            // Deteccion al llegar a las casillas inferiores
            if (bola.y >= height - 42) {
                let indice = Math.floor(bola.x / this.slotWidth);
                indice = Math.max(0, Math.min(this.multiplicadores.length - 1, indice));
                let mult = this.multiplicadores[indice];
                let ganancia = Number((bola.apuesta * mult).toFixed(2));

                if (typeof window.resolverApuesta === 'function') {
                    window.resolverApuesta(ganancia, mult, bola.apuesta);
                }

                this.bolas.splice(i, 1);
            }
        }
    }
}