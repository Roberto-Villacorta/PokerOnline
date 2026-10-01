class HelperBolas {
    constructor(){
        this.bolas = []
        this.obstaculos = []
        this.multiplicadores = [10, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 10]
    }
    addBola(posX, apuesta = 0) {
        this.bolas.push(new Pelota(posX, 40, (Math.random() - 0.5) * 1.5, 0, 8, 0.6, 'crimson', apuesta))
    }
    addObstaculo(posX, posY){
        this.obstaculos.push(new Obstaculo(posX, posY, 6, 0.6, 60))
    }
    drawBolas(){
        this.bolas.forEach(bola => {
            bola.dibujar()
        })
    }
    drawObstaculos(){
        this.obstaculos.forEach(obstaculo => {
            obstaculo.dibujar()
        })
    }
    drawMultiplicadores(){
        if (typeof width === 'undefined' || typeof height === 'undefined') return;
        let n = this.multiplicadores.length;
        let ancho = width / n;
        textAlign(CENTER, CENTER);
        textSize(11);
        for (let i = 0; i < n; i++) {
            let mult = this.multiplicadores[i];
            if (mult >= 3) fill(220, 70, 70);
            else if (mult >= 1) fill(230, 160, 40);
            else fill(90, 150, 220);
            stroke(255);
            strokeWeight(1);
            rect(i * ancho + 1, height - 35, ancho - 2, 30, 4);
            noStroke();
            fill(255);
            text(mult + 'x', i * ancho + ancho / 2, height - 20);
        }
    }
    update(){
        if (typeof height === 'undefined') return;
        for (let i = this.bolas.length - 1; i >= 0; i--) {
            let bola = this.bolas[i];
            bola.actualizar();

            // Comprobar colisión con cada obstáculo
            for (let obs of this.obstaculos) {
                bola.comprobarColision(obs);
            }

            // Cuando la bola llega a la zona inferior de multiplicadores
            if (bola.y >= height - 35) {
                let n = this.multiplicadores.length;
                let ancho = width / n;
                let indice = Math.floor(bola.x / ancho);
                indice = Math.max(0, Math.min(n - 1, indice));
                let mult = this.multiplicadores[indice];
                let ganancia = Number((bola.apuesta * mult).toFixed(2));

                if (typeof window.resolverApuesta === 'function') {
                    window.resolverApuesta(ganancia, mult, bola.apuesta);
                }

                // Eliminar bola que ya cayó
                this.bolas.splice(i, 1);
            }
        }
    }
}