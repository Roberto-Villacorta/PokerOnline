let helper = new HelperBolas()

// Crea una pirámide centrada en el lienzo
function crearPiramide(filas = 9) {
    helper.obstaculos = []
    let espaciado = 45
    let inicioY = 100
    for (let i = 0; i < filas; i++) {
        let nObstaculos = i + 1
        let anchoFila = (nObstaculos - 1) * espaciado
        let inicioX = (width - anchoFila) / 2
        for (let j = 0; j < nObstaculos; j++) {
            helper.addObstaculo(inicioX + j * espaciado, inicioY + i * espaciado)
        }
    }
}

function lanzarPelota(posX, apuesta = 0) {
    helper.addBola(posX, apuesta)
}

function setup() {
    createCanvas(500, 560)
    crearPiramide(9)
}

function draw() {
    background(245)
    helper.drawObstaculos()
    helper.drawMultiplicadores()
    helper.drawBolas()
    helper.update()
}

// Clic en el canvas para soltar bola gratis de prueba
function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height - 40) {
        lanzarPelota(mouseX, 0)
    }
}