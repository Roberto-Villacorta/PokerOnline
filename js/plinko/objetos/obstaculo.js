class Obstaculo {
    constructor(x, y, radio = 10, rebote = 0.5, color = 150) {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.rebote = rebote;
        this.color = color;
    }

    dibujar() {
        fill(this.color);
        noStroke();
        circle(this.x, this.y, this.radio * 2);
    }
}