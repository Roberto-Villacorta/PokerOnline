let helper = new HelperBolas();

function lanzarPelota(posX, apuesta = 0) {
    helper.addBola(posX, apuesta);
}

function cambiarNivel(nivel = 1) {
    helper.setNivel(nivel);
}

function setup(ancho = 500, alto = 500) {
    createCanvas(ancho, alto);
    helper.setNivel(1);
}

function draw() {
    background(245);
    helper.drawObstaculos();
    helper.drawMultiplicadores();
    helper.drawBolas();
    helper.update();
}

// Deshabilitado el lanzamiento al hacer clic en el canvas
function mousePressed() {
}