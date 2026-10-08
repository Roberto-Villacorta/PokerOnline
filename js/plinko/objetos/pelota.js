class Pelota extends Obstaculo {
    constructor(x = 250, y = 30, vx = 0, vy = 1, radio = 6.5, rebote = 0.5, color = '#e53e3e', apuesta = 0) {
        super(x, y, radio, rebote, color);
        this.vx = vx;
        this.vy = vy;
        this.apuesta = apuesta;
    }

    actualizar() {
        this.vy += 0.28;
        this.vx *= 0.98;
        this.x += this.vx;
        this.y += this.vy;

        // Rebotes en los limites exteriores del canvas
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
            this.x = obstaculo.x + Math.cos(angulo) * (minDist + 0.5);
            this.y = obstaculo.y + Math.sin(angulo) * (minDist + 0.5);

            let rapidez = Math.hypot(this.vx, this.vy) * obstaculo.rebote;
            if (rapidez < 1.6) rapidez = 1.6;

            let impulsoLateral = (dx >= 0 ? 0.6 : -0.6);
            this.vx = Math.cos(angulo) * rapidez + impulsoLateral;
            this.vy = Math.sin(angulo) * rapidez;
            if (this.vy < 0) this.vy *= 0.4;
        }
    }
}