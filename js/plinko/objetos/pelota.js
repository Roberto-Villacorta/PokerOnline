class Pelota extends Obstaculo {
    constructor(x = 100, y = 100, vx = 0, vy = 0, radio = 8, rebote = 0.5, color = 'red', apuesta = 0) {
        super(x, y, radio, rebote, color);
        this.vx = vx;
        this.vy = vy;
        this.apuesta = apuesta;
    }

    actualizar() {
        this.vy += 0.2; 
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en paredes laterales
        if (typeof width !== 'undefined') {
            if (this.x - this.radio < 0) {
                this.x = this.radio;
                this.vx = Math.abs(this.vx) * this.rebote;
            } else if (this.x + this.radio > width) {
                this.x = width - this.radio;
                this.vx = -Math.abs(this.vx) * this.rebote;
            }
        }
    }

    comprobarColision(obstaculo) {
        let dx = this.x - obstaculo.x;
        let dy = this.y - obstaculo.y;
        let dist = Math.hypot(dx, dy);
        let minDist = this.radio + obstaculo.radio;

        if (dist < minDist && dist > 0) {
            let angulo = Math.atan2(dy, dx);
            // Reposicionar fuera del obstáculo
            this.x = obstaculo.x + Math.cos(angulo) * (minDist + 0.5);
            this.y = obstaculo.y + Math.sin(angulo) * (minDist + 0.5);

            // Calcular rebote con pequeña variación aleatoria
            let rapidez = Math.hypot(this.vx, this.vy) * obstaculo.rebote;
            rapidez = Math.max(rapidez, 1.8);
            let desvio = (Math.random() - 0.5) * 0.4;
            this.vx = Math.cos(angulo + desvio) * rapidez;
            this.vy = Math.sin(angulo + desvio) * rapidez;
            if (this.vy < 0) this.vy *= 0.6;
        }
    }
}