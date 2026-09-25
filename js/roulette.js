/**
 * CLUB DE CASINO - MÓDULO DE RULETA EUROPEA (37 NÚMEROS: 0-36)
 * Totalmente encapsulado y adaptado a la arquitectura y diseño de la web.
 * Soporta apuestas internas (pleno, caballo, calle, cuadro, seisena)
 * y externas (columnas, docenas, rojo/negro, par/impar, falta/pasa).
 */

(function () {
    'use strict';

    // Constantes del cilindro europeo
    const NUMEROS_ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const NUMEROS_CILINDRO_AC = [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];
    const NUMEROS_ORDEN_RUEDA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

    // Estado del juego
    let saldoBanca = 1000;
    let apuestaActual = 0;
    let valorFicha = 5;
    let ultimaApuestaFicha = 5;
    let listaApuestas = [];
    let numerosApostados = [];
    let apuestasRondaAnterior = [];
    let girando = false;
    let inicializado = false;

    // Referencias DOM
    let contenedorEtapa = null;
    let elementoRueda = null;
    let pistaBola = null;
    let estiloAnimacionActivo = null;

    // Elementos HUD de la barra inferior
    let displayBanca = null;
    let displayApuesta = null;
    let textoTurno = null;
    let botonGirar = null;
    let botonLimpiar = null;
    let botonDoblar = null;

    /**
     * Inicialización del módulo
     */
    function inicializar() {
        if (inicializado) return;

        const contenedorJuego = document.getElementById('rouletteGameContainer');
        if (!contenedorJuego) return;

        displayBanca = document.getElementById('rouletteBankDisplay');
        displayApuesta = document.getElementById('rouletteBetDisplay');
        textoTurno = document.getElementById('rouletteTurnText');
        botonGirar = document.getElementById('btnRouletteSpin');
        botonLimpiar = document.getElementById('btnRouletteClear');
        botonDoblar = document.getElementById('btnRouletteDouble');

        // Construir estructura del tapete
        contenedorEtapa = document.createElement('div');
        contenedorEtapa.className = 'roulette-stage';
        contenedorJuego.appendChild(contenedorEtapa);

        construirRueda();
        construirTablero();
        vincularControlesAccion();
        actualizarHUD();

        elementoRueda = contenedorEtapa.querySelector('.wheel');
        pistaBola = contenedorEtapa.querySelector('.ballTrack');

        inicializado = true;
    }

    /**
     * Construcción de la rueda física con sus 37 sectores
     */
    function construirRueda() {
        const ruedaWrapper = document.createElement('div');
        ruedaWrapper.className = 'roulette-wheel-wrapper';

        const wheel = document.createElement('div');
        wheel.className = 'wheel';

        const outerRim = document.createElement('div');
        outerRim.className = 'outerRim';
        wheel.appendChild(outerRim);

        for (let i = 0; i < NUMEROS_ORDEN_RUEDA.length; i++) {
            const numero = NUMEROS_ORDEN_RUEDA[i];
            const a = i + 1;
            const spanClass = (numero < 10) ? 'single' : 'double';

            const sect = document.createElement('div');
            sect.id = 'sect' + a;
            sect.className = 'sect';

            const span = document.createElement('span');
            span.className = spanClass;
            span.innerText = numero;
            sect.appendChild(span);

            const block = document.createElement('div');
            block.className = 'block';
            sect.appendChild(block);

            wheel.appendChild(sect);
        }

        const pocketsRim = document.createElement('div');
        pocketsRim.className = 'pocketsRim';
        wheel.appendChild(pocketsRim);

        const ballTrack = document.createElement('div');
        ballTrack.className = 'ballTrack';
        const ball = document.createElement('div');
        ball.className = 'ball';
        ballTrack.appendChild(ball);
        wheel.appendChild(ballTrack);

        const pockets = document.createElement('div');
        pockets.className = 'pockets';
        wheel.appendChild(pockets);

        const cone = document.createElement('div');
        cone.className = 'cone';
        wheel.appendChild(cone);

        const turret = document.createElement('div');
        turret.className = 'turret';
        wheel.appendChild(turret);

        const turretHandle = document.createElement('div');
        turretHandle.className = 'turretHandle';

        const thendOne = document.createElement('div');
        thendOne.className = 'thendOne';
        turretHandle.appendChild(thendOne);

        const thendTwo = document.createElement('div');
        thendTwo.className = 'thendTwo';
        turretHandle.appendChild(thendTwo);

        wheel.appendChild(turretHandle);
        ruedaWrapper.appendChild(wheel);
        contenedorEtapa.appendChild(ruedaWrapper);
    }

    /**
     * Construcción del paño de apuestas con zonas interactivas
     */
    function construirTablero() {
        const boardWrapper = document.createElement('div');
        boardWrapper.className = 'roulette-board-wrapper';

        const bettingBoard = document.createElement('div');
        bettingBoard.id = 'betting_board';

        // 1. Líneas de apuesta múltiple (Splits, Streets, Seisenas, Cuadros)
        const wl = document.createElement('div');
        wl.className = 'winning_lines';

        // Calles dobles (seisenas)
        const wlttbTop = document.createElement('div');
        wlttbTop.id = 'wlttb_top';
        wlttbTop.className = 'wlttb';
        for (let i = 0; i < 11; i++) {
            const j = i;
            const ttbbetblock = document.createElement('div');
            ttbbetblock.className = 'ttbbetblock';
            const numA = (1 + (3 * j));
            const numB = (2 + (3 * j));
            const numC = (3 + (3 * j));
            const numD = (4 + (3 * j));
            const numE = (5 + (3 * j));
            const numF = (6 + (3 * j));
            const num = `${numA}, ${numB}, ${numC}, ${numD}, ${numE}, ${numF}`;
            const objType = 'double_street';

            ttbbetblock.addEventListener('click', (e) => manejarClickCasilla(e, ttbbetblock, num, objType, 5));
            ttbbetblock.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                retirarApuesta(ttbbetblock, num, objType, 5);
            });
            wlttbTop.appendChild(ttbbetblock);
        }
        wl.appendChild(wlttbTop);

        // Calles simples y caballos horizontales
        for (let c = 1; c < 4; c++) {
            const d = c;
            const wlttb = document.createElement('div');
            wlttb.id = 'wlttb_' + c;
            wlttb.className = 'wlttb';

            for (let i = 0; i < 12; i++) {
                const j = i;
                const ttbbetblock = document.createElement('div');
                ttbbetblock.className = 'ttbbetblock';

                let num = '';
                if (d === 1 || d === 2) {
                    const numA = ((2 - (d - 1)) + (3 * j));
                    const numB = ((3 - (d - 1)) + (3 * j));
                    num = `${numA}, ${numB}`;
                } else {
                    const numA = (1 + (3 * j));
                    const numB = (2 + (3 * j));
                    const numC = (3 + (3 * j));
                    num = `${numA}, ${numB}, ${numC}`;
                }
                const objType = (d === 3) ? 'street' : 'split';
                const odd = (d === 3) ? 11 : 17;

                ttbbetblock.addEventListener('click', (e) => manejarClickCasilla(e, ttbbetblock, num, objType, odd));
                ttbbetblock.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    retirarApuesta(ttbbetblock, num, objType, odd);
                });
                wlttb.appendChild(ttbbetblock);
            }
            wl.appendChild(wlttb);
        }

        // Caballos verticales entre columnas
        for (let c = 1; c < 12; c++) {
            const d = c;
            const wlrtl = document.createElement('div');
            wlrtl.id = 'wlrtl_' + c;
            wlrtl.className = 'wlrtl';

            for (let i = 1; i < 4; i++) {
                const j = i;
                const rtlbb = document.createElement('div');
                rtlbb.className = 'rtlbb' + i;
                const numA = (3 + (3 * (d - 1))) - (j - 1);
                const numB = (6 + (3 * (d - 1))) - (j - 1);
                const num = `${numA}, ${numB}`;

                rtlbb.addEventListener('click', (e) => manejarClickCasilla(e, rtlbb, num, 'split', 17));
                rtlbb.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    retirarApuesta(rtlbb, num, 'split', 17);
                });
                wlrtl.appendChild(rtlbb);
            }
            wl.appendChild(wlrtl);
        }

        // Cuadros (Corners)
        for (let c = 1; c < 3; c++) {
            const wlcb = document.createElement('div');
            wlcb.id = 'wlcb_' + c;
            wlcb.className = 'wlcb';

            for (let i = 1; i < 12; i++) {
                const count = (c === 1) ? i : i + 11;
                const cbbb = document.createElement('div');
                cbbb.id = 'cbbb_' + count;
                cbbb.className = 'cbbb';

                const numA = 2;
                const numB = 3;
                const numC = 5;
                const numD = 6;
                const num = (count >= 1 && count < 12)
                    ? `${numA + ((count - 1) * 3)}, ${numB + ((count - 1) * 3)}, ${numC + ((count - 1) * 3)}, ${numD + ((count - 1) * 3)}`
                    : `${(numA - 1) + ((count - 12) * 3)}, ${(numB - 1) + ((count - 12) * 3)}, ${(numC - 1) + ((count - 12) * 3)}, ${(numD - 1) + ((count - 12) * 3)}`;
                const objType = 'corner_bet';

                cbbb.addEventListener('click', (e) => manejarClickCasilla(e, cbbb, num, objType, 8));
                cbbb.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    retirarApuesta(cbbb, num, objType, 8);
                });
                wlcb.appendChild(cbbb);
            }
            wl.appendChild(wlcb);
        }
        bettingBoard.appendChild(wl);

        // 2. Apuestas Falta (1-18) y Pasa (19-36)
        const bbtop = document.createElement('div');
        bbtop.className = 'bbtop';
        const bbtopBlocks = ['1 a 18', '19 a 36'];
        for (let i = 0; i < bbtopBlocks.length; i++) {
            const f = i;
            const bbtoptwo = document.createElement('div');
            bbtoptwo.className = 'bbtoptwo';
            const num = (f === 0)
                ? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18'
                : '19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36';
            const objType = (f === 0) ? 'outside_low' : 'outside_high';

            bbtoptwo.addEventListener('click', (e) => manejarClickCasilla(e, bbtoptwo, num, objType, 1));
            bbtoptwo.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                retirarApuesta(bbtoptwo, num, objType, 1);
            });
            bbtoptwo.innerText = bbtopBlocks[i];
            bbtop.appendChild(bbtoptwo);
        }
        bettingBoard.appendChild(bbtop);

        // 3. Tablero numérico (Cero + Números 1 al 36 + Columnas 2 a 1)
        const numberBoard = document.createElement('div');
        numberBoard.className = 'number_board';

        // Cero
        const zero = document.createElement('div');
        zero.className = 'number_0';
        zero.addEventListener('click', (e) => manejarClickCasilla(e, zero, '0', 'zero', 35));
        zero.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            retirarApuesta(zero, '0', 'zero', 35);
        });
        const nbnz = document.createElement('div');
        nbnz.className = 'nbn';
        nbnz.innerText = '0';
        zero.appendChild(nbnz);
        numberBoard.appendChild(zero);

        // Números 1 a 36 organizados por filas tradicionales
        const numberBlocks = [
            3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, '2 a 1',
            2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, '2 a 1',
            1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, '2 a 1'
        ];

        for (let i = 0; i < numberBlocks.length; i++) {
            const a = i;
            const val = numberBlocks[i];
            const nbClass = (val === '2 a 1') ? 'tt1_block' : 'number_block';
            const colourClass = NUMEROS_ROJOS.includes(val) ? ' redNum' : ((nbClass === 'number_block') ? ' blackNum' : '');

            const numberBlock = document.createElement('div');
            numberBlock.className = nbClass + colourClass;

            let num = '';
            let tipoApuesta = '';
            let pago = 0;

            if (val !== '2 a 1') {
                num = '' + val;
                tipoApuesta = 'inside_whole';
                pago = 35;
            } else {
                tipoApuesta = 'outside_column';
                pago = 2;
                num = (a === 12)
                    ? '3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36'
                    : ((a === 25)
                        ? '2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35'
                        : '1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34');
            }

            numberBlock.addEventListener('click', (e) => manejarClickCasilla(e, numberBlock, num, tipoApuesta, pago));
            numberBlock.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                retirarApuesta(numberBlock, num, tipoApuesta, pago);
            });

            const nbn = document.createElement('div');
            nbn.className = 'nbn';
            nbn.innerText = val;
            numberBlock.appendChild(nbn);
            numberBoard.appendChild(numberBlock);
        }
        bettingBoard.appendChild(numberBoard);

        // 4. Docenas (1ª 12, 2ª 12, 3ª 12)
        const bo3Board = document.createElement('div');
        bo3Board.className = 'bo3_board';
        const bo3Blocks = ['1ª DOCENA (1-12)', '2ª DOCENA (13-24)', '3ª DOCENA (25-36)'];
        for (let i = 0; i < bo3Blocks.length; i++) {
            const b = i;
            const bo3Block = document.createElement('div');
            bo3Block.className = 'bo3_block';
            const num = (b === 0)
                ? '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12'
                : ((b === 1)
                    ? '13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24'
                    : '25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36');

            bo3Block.addEventListener('click', (e) => manejarClickCasilla(e, bo3Block, num, 'outside_dozen', 2));
            bo3Block.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                retirarApuesta(bo3Block, num, 'outside_dozen', 2);
            });
            bo3Block.innerText = bo3Blocks[i];
            bo3Board.appendChild(bo3Block);
        }
        bettingBoard.appendChild(bo3Board);

        // 5. Suertes Sencillas (PAR, ROJO, NEGRO, IMPAR)
        const otoBoard = document.createElement('div');
        otoBoard.className = 'oto_board';
        const otoBlocks = ['PAR', 'ROJO', 'NEGRO', 'IMPAR'];
        for (let i = 0; i < otoBlocks.length; i++) {
            const d = i;
            const colourClass = (otoBlocks[i] === 'ROJO') ? ' redNum' : ((otoBlocks[i] === 'NEGRO') ? ' blackNum' : '');
            const otoBlock = document.createElement('div');
            otoBlock.className = 'oto_block' + colourClass;

            const num = (d === 0)
                ? '2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36'
                : ((d === 1)
                    ? '1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36'
                    : ((d === 2)
                        ? '2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35'
                        : '1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35'));

            otoBlock.addEventListener('click', (e) => manejarClickCasilla(e, otoBlock, num, 'outside_oerb', 1));
            otoBlock.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                retirarApuesta(otoBlock, num, 'outside_oerb', 1);
            });
            otoBlock.innerText = otoBlocks[i];
            otoBoard.appendChild(otoBlock);
        }
        bettingBoard.appendChild(otoBoard);

        // 6. Tira de Historial de Números
        const pnBlock = document.createElement('div');
        pnBlock.className = 'pnBlock';
        const pnContent = document.createElement('div');
        pnContent.id = 'pnContent';
        pnContent.addEventListener('wheel', (e) => {
            e.preventDefault();
            pnContent.scrollLeft += e.deltaY;
        });
        pnBlock.appendChild(pnContent);
        bettingBoard.appendChild(pnBlock);

        // Ayuda informativa al pie del tapete
        const boardHint = document.createElement('div');
        boardHint.className = 'roulette-board-hint';
        boardHint.innerText = 'Clic izquierdo para apostar • Clic derecho para retirar ficha';

        boardWrapper.appendChild(bettingBoard);
        boardWrapper.appendChild(boardHint);
        contenedorEtapa.appendChild(boardWrapper);
    }

    /**
     * Gestión de clics sobre las casillas
     */
    function manejarClickCasilla(e, elemento, numeros, tipo, pago) {
        if (girando) return;
        if (e.shiftKey) {
            retirarApuesta(elemento, numeros, tipo, pago);
        } else {
            colocarApuesta(elemento, numeros, tipo, pago);
        }
    }

    /**
     * Coloca o añade una ficha a la casilla
     */
    function colocarApuesta(elemento, numeros, tipo, pago) {
        if (girando) return;

        ultimaApuestaFicha = valorFicha;
        const montoApostar = Math.min(valorFicha, saldoBanca);
        if (montoApostar <= 0) {
            if (textoTurno) textoTurno.textContent = 'Saldo insuficiente para apostar';
            return;
        }

        reproducirSonidoFichas();

        saldoBanca -= montoApostar;
        apuestaActual += montoApostar;
        actualizarHUD();

        // Si ya existe esta apuesta en la misma casilla, sumamos importe
        for (let i = 0; i < listaApuestas.length; i++) {
            if (listaApuestas[i].numbers === numeros && listaApuestas[i].type === tipo) {
                listaApuestas[i].amt += montoApostar;
                actualizarVisualFicha(elemento, listaApuestas[i].amt);
                return;
            }
        }

        // Si es una nueva apuesta
        listaApuestas.push({
            amt: montoApostar,
            type: tipo,
            odds: pago,
            numbers: numeros,
            element: elemento
        });

        const arrNums = numeros.split(',').map(n => parseInt(n.trim(), 10));
        for (let i = 0; i < arrNums.length; i++) {
            if (!numerosApostados.includes(arrNums[i])) {
                numerosApostados.push(arrNums[i]);
            }
        }

        actualizarVisualFicha(elemento, montoApostar);
    }

    /**
     * Retira fichas de una casilla
     */
    function retirarApuesta(elemento, numeros, tipo, pago) {
        if (girando || apuestaActual === 0) return;

        for (let i = 0; i < listaApuestas.length; i++) {
            if (listaApuestas[i].numbers === numeros && listaApuestas[i].type === tipo) {
                const montoRetirar = Math.min(listaApuestas[i].amt, valorFicha || listaApuestas[i].amt);
                listaApuestas[i].amt -= montoRetirar;
                saldoBanca += montoRetirar;
                apuestaActual -= montoRetirar;

                reproducirSonidoFichas();

                if (listaApuestas[i].amt <= 0) {
                    const chipEl = elemento.querySelector('.chip');
                    if (chipEl) chipEl.remove();
                    listaApuestas.splice(i, 1);
                } else {
                    actualizarVisualFicha(elemento, listaApuestas[i].amt);
                }

                recalcularNumerosApostados();
                actualizarHUD();
                return;
            }
        }
    }

    /**
     * Actualiza o crea la ficha visual sobre una casilla
     */
    function actualizarVisualFicha(elemento, cantidad) {
        let chip = elemento.querySelector('.chip');
        const color = (cantidad < 5) ? 'red' : ((cantidad < 10) ? 'blue' : ((cantidad < 100) ? 'orange' : 'gold'));

        if (!chip) {
            chip = document.createElement('div');
            chip.className = 'chip ' + color;
            const span = document.createElement('span');
            span.className = 'chipSpan';
            span.innerText = cantidad;
            chip.appendChild(span);
            elemento.appendChild(chip);
        } else {
            chip.className = 'chip ' + color;
            const span = chip.querySelector('.chipSpan');
            if (span) span.innerText = cantidad;
        }
    }

    function recalcularNumerosApostados() {
        numerosApostados = [];
        for (let i = 0; i < listaApuestas.length; i++) {
            const arr = listaApuestas[i].numbers.split(',').map(n => parseInt(n.trim(), 10));
            for (let j = 0; j < arr.length; j++) {
                if (!numerosApostados.includes(arr[j])) {
                    numerosApostados.push(arr[j]);
                }
            }
        }
    }

    /**
     * Limpia todas las apuestas activas devolviendo el saldo
     */
    function limpiarApuestas() {
        if (girando || apuestaActual === 0) return;

        saldoBanca += apuestaActual;
        apuestaActual = 0;
        listaApuestas = [];
        numerosApostados = [];

        removerTodasLasFichas();
        actualizarHUD();
        reproducirSonidoFichas();
    }

    /**
     * Dobla las apuestas existentes en mesa o realiza la apuesta anterior con el doble de lo apostado
     */
    function doblarApuestas() {
        if (girando) return;

        // Caso 1: Hay apuestas activas en el tapete -> doblar lo que hay actualmente en mesa
        if (apuestaActual > 0) {
            if (saldoBanca < apuestaActual) {
                if (textoTurno) textoTurno.textContent = 'Saldo insuficiente para doblar';
                return;
            }

            saldoBanca -= apuestaActual;
            apuestaActual *= 2;

            for (let i = 0; i < listaApuestas.length; i++) {
                listaApuestas[i].amt *= 2;
                actualizarVisualFicha(listaApuestas[i].element, listaApuestas[i].amt);
            }

            reproducirSonidoFichas();
            actualizarHUD();
            return;
        }

        // Caso 2: El tapete está vacío pero hay una apuesta anterior -> realizar la anterior con el doble
        if (apuestasRondaAnterior.length > 0) {
            const montoRequerido = apuestasRondaAnterior.reduce((sum, a) => sum + (a.amt * 2), 0);
            if (saldoBanca < montoRequerido) {
                if (textoTurno) textoTurno.textContent = 'Saldo insuficiente para doblar la apuesta anterior';
                return;
            }

            saldoBanca -= montoRequerido;
            apuestaActual = montoRequerido;
            listaApuestas = [];

            for (let i = 0; i < apuestasRondaAnterior.length; i++) {
                const anterior = apuestasRondaAnterior[i];
                const dobleMonto = anterior.amt * 2;
                listaApuestas.push({
                    amt: dobleMonto,
                    type: anterior.type,
                    odds: anterior.odds,
                    numbers: anterior.numbers,
                    element: anterior.element
                });
                actualizarVisualFicha(anterior.element, dobleMonto);
            }

            recalcularNumerosApostados();
            reproducirSonidoFichas();
            actualizarHUD();
            if (textoTurno) {
                textoTurno.textContent = `Apuesta anterior doblada ($${apuestaActual.toLocaleString('es-ES')}). Pulsa GIRAR o (G).`;
            }
            return;
        }

        if (textoTurno) textoTurno.textContent = 'No hay apuesta previa para doblar';
    }

    /**
     * Quita las fichas DOM del paño
     */
    function removerTodasLasFichas() {
        if (!contenedorEtapa) return;
        const fichas = contenedorEtapa.querySelectorAll('.chip');
        fichas.forEach(f => f.remove());
    }

    /**
     * Lanzamiento y giro de la ruleta
     */
    function girarRuleta() {
        if (girando) return;
        if (apuestaActual <= 0) {
            if (textoTurno) textoTurno.textContent = 'Realiza al menos una apuesta para girar';
            return;
        }

        // Guardar copia de las apuestas de esta ronda para permitir doblar la anterior en la siguiente
        apuestasRondaAnterior = listaApuestas.map(apuesta => ({
            amt: apuesta.amt,
            type: apuesta.type,
            odds: apuesta.odds,
            numbers: apuesta.numbers,
            element: apuesta.element
        }));

        girando = true;
        if (botonGirar) botonGirar.disabled = true;
        if (botonLimpiar) botonLimpiar.disabled = true;
        if (botonDoblar) botonDoblar.disabled = true;
        if (textoTurno) textoTurno.textContent = '¡No va más! La bola está girando...';

        const spinGanador = Math.floor(Math.random() * 37);
        animarCilindro(spinGanador);

        setTimeout(() => {
            procesarResultado(spinGanador);
        }, 10000);
    }

    /**
     * Animación física de desaceleración y parada de bola
     */
    function animarCilindro(spinGanador) {
        let grados = 362;
        for (let i = 0; i < NUMEROS_CILINDRO_AC.length; i++) {
            if (NUMEROS_CILINDRO_AC[i] === spinGanador) {
                grados = (i * 9.73) + 362;
                break;
            }
        }

        if (elementoRueda) elementoRueda.style.animation = 'wheelRotate 5s linear infinite';
        if (pistaBola) pistaBola.style.animation = 'ballRotate 1s linear infinite';

        setTimeout(() => {
            if (pistaBola) pistaBola.style.animation = 'ballRotate 2s linear infinite';
            if (estiloAnimacionActivo) estiloAnimacionActivo.remove();

            estiloAnimacionActivo = document.createElement('style');
            estiloAnimacionActivo.type = 'text/css';
            estiloAnimacionActivo.innerText = `@keyframes ballStop { from { transform: rotate(0deg); } to { transform: rotate(-${grados}deg); } }`;
            document.head.appendChild(estiloAnimacionActivo);
        }, 2000);

        setTimeout(() => {
            if (pistaBola) pistaBola.style.animation = 'ballStop 3s linear';
        }, 6000);

        setTimeout(() => {
            if (pistaBola) pistaBola.style.transform = `rotate(-${grados}deg)`;
        }, 9000);

        setTimeout(() => {
            if (elementoRueda) elementoRueda.style.animation = '';
            if (estiloAnimacionActivo) {
                estiloAnimacionActivo.remove();
                estiloAnimacionActivo = null;
            }
        }, 10000);
    }

    /**
     * Cálculo de premios y pagos tras el giro
     */
    function procesarResultado(spinGanador) {
        let totalGanado = 0;
        let totalApostado = apuestaActual;

        if (numerosApostados.includes(spinGanador)) {
            for (let i = 0; i < listaApuestas.length; i++) {
                const arr = listaApuestas[i].numbers.split(',').map(n => parseInt(n.trim(), 10));
                if (arr.includes(spinGanador)) {
                    const beneficio = listaApuestas[i].odds * listaApuestas[i].amt;
                    totalGanado += beneficio;
                    saldoBanca += (beneficio + listaApuestas[i].amt);
                }
            }
        }

        const colorTexto = NUMEROS_ROJOS.includes(spinGanador) ? 'ROJO' : ((spinGanador === 0) ? 'VERDE' : 'NEGRO');

        if (totalGanado > 0) {
            mostrarNotificacionVictoria(spinGanador, totalGanado, totalApostado, colorTexto);
            if (window.EfectosAudio && typeof window.EfectosAudio.reproducirVictoria === 'function') {
                window.EfectosAudio.reproducirVictoria();
            }
        } else {
            if (textoTurno) textoTurno.textContent = `Ha salido el ${spinGanador} (${colorTexto}). Suerte en la próxima.`;
        }

        // Añadir a la tira de historial
        agregarNumeroAHistorial(spinGanador);

        apuestaActual = 0;
        listaApuestas = [];
        numerosApostados = [];
        girando = false;

        removerTodasLasFichas();
        actualizarHUD();

        if (saldoBanca <= 0 && apuestaActual <= 0) {
            mostrarBancarrota();
        }
    }

    /**
     * Muestra banner/notificación visual de premio
     */
    function mostrarNotificacionVictoria(spinGanador, ganancia, totalApuesta, colorTexto) {
        const notifExistente = document.getElementById('notification');
        if (notifExistente) notifExistente.remove();

        const notif = document.createElement('div');
        notif.id = 'notification';

        notif.innerHTML = `
            <div class="nSpan">
                <span class="nsnumber">${spinGanador}</span>
                <span>¡NÚMERO GANADOR (${colorTexto})!</span>
                <div class="nsWin">
                    <div class="nsWinBlock">Apuesta: $${totalApuesta.toLocaleString('es-ES')}</div>
                    <div class="nsWinBlock">Ganancia: +$${ganancia.toLocaleString('es-ES')}</div>
                    <div class="nsWinBlock" style="color: #34d399;">Cobro total: $${(ganancia + totalApuesta).toLocaleString('es-ES')}</div>
                </div>
            </div>
        `;

        const viewport = document.getElementById('rouletteViewport');
        if (viewport) viewport.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 400);
        }, 3600);
    }

    /**
     * Maneja el estado de bancarrota
     */
    function mostrarBancarrota() {
        const notifExistente = document.getElementById('notification');
        if (notifExistente) notifExistente.remove();

        const notif = document.createElement('div');
        notif.id = 'notification';

        notif.innerHTML = `
            <div class="nSpan">
                <span class="nsnumber" style="color: #ef4444 !important;">BANCARROTA</span>
                <span>Te has quedado sin fichas en la mesa</span>
                <button class="nBtn" id="btnRouletteReload">RECARGAR $1,000</button>
            </div>
        `;

        const viewport = document.getElementById('rouletteViewport');
        if (viewport) viewport.appendChild(notif);

        const btnRecargar = document.getElementById('btnRouletteReload');
        if (btnRecargar) {
            btnRecargar.addEventListener('click', () => {
                saldoBanca = 1000;
                actualizarHUD();
                notif.remove();
            });
        }
    }

    /**
     * Añade el resultado al historial de la ruleta
     */
    function agregarNumeroAHistorial(numero) {
        const pnContent = document.getElementById('pnContent');
        if (!pnContent) return;

        const claseColor = NUMEROS_ROJOS.includes(numero) ? 'pnRed' : ((numero === 0) ? 'pnGreen' : 'pnBlack');
        const pill = document.createElement('span');
        pill.className = claseColor;
        pill.innerText = numero;

        pnContent.appendChild(pill);
        pnContent.scrollLeft = pnContent.scrollWidth;
    }

    /**
     * Vinculación de los botones de la barra inferior
     */
    function vincularControlesAccion() {
        if (botonGirar) {
            botonGirar.addEventListener('click', girarRuleta);
        }
        if (botonLimpiar) {
            botonLimpiar.addEventListener('click', limpiarApuestas);
        }
        if (botonDoblar) {
            botonDoblar.addEventListener('click', doblarApuestas);
        }

        // Selector de valor de fichas en barra inferior
        const botonesFicha = document.querySelectorAll('.btn-roulette-chip');
        botonesFicha.forEach(btn => {
            btn.addEventListener('click', () => {
                botonesFicha.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                valorFicha = parseInt(btn.dataset.val, 10) || 5;
            });
        });
    }

    /**
     * Refresca las etiquetas de saldo y botones
     */
    function actualizarHUD() {
        if (displayBanca) displayBanca.textContent = `$${saldoBanca.toLocaleString('es-ES')}`;
        if (displayApuesta) displayApuesta.textContent = `$${apuestaActual.toLocaleString('es-ES')}`;

        if (!girando) {
            if (botonGirar) botonGirar.disabled = (apuestaActual === 0);
            if (botonLimpiar) botonLimpiar.disabled = (apuestaActual === 0);

            // Control del botón Doblar
            if (botonDoblar) {
                if (apuestaActual > 0) {
                    botonDoblar.disabled = (saldoBanca < apuestaActual);
                } else if (apuestasRondaAnterior.length > 0) {
                    const montoRequerido = apuestasRondaAnterior.reduce((sum, a) => sum + (a.amt * 2), 0);
                    botonDoblar.disabled = (saldoBanca < montoRequerido);
                } else {
                    botonDoblar.disabled = true;
                }
            }

            if (textoTurno && apuestaActual > 0) {
                textoTurno.textContent = `Apuesta total: $${apuestaActual.toLocaleString('es-ES')}. Pulsa GIRAR o (G).`;
            } else if (textoTurno && apuestaActual === 0) {
                if (apuestasRondaAnterior.length > 0) {
                    textoTurno.textContent = 'Coloca apuestas o pulsa DOBLAR (D) para repetir x2 la anterior';
                } else {
                    textoTurno.textContent = 'Coloca tus apuestas sobre el tapete y gira';
                }
            }
        }
    }

    function reproducirSonidoFichas() {
        if (window.EfectosAudio && typeof window.EfectosAudio.reproducirTintineoFichas === 'function') {
            window.EfectosAudio.reproducirTintineoFichas(1);
        }
    }

    /**
     * Apertura y cambio al modo Ruleta
     */
    function abrirModoRuleta() {
        inicializar();

        // Ocultar modales y vistas existentes
        const modalSeleccion = document.getElementById('gameSelectModal');
        const modalLobby = document.getElementById('lobbyModal');
        const vistaPoker = document.getElementById('pokerViewport');
        const vistaBlackjack = document.getElementById('blackjackViewport');
        const barraPoker = document.getElementById('pokerActionBar');
        const barraBlackjack = document.getElementById('blackjackActionBar');

        if (modalSeleccion) modalSeleccion.style.display = 'none';
        if (modalLobby) modalLobby.style.display = 'none';
        if (vistaPoker) vistaPoker.style.display = 'none';
        if (vistaBlackjack) vistaBlackjack.style.display = 'none';
        if (barraPoker) barraPoker.style.display = 'none';
        if (barraBlackjack) barraBlackjack.style.display = 'none';

        // Mostrar vista y barra de ruleta
        const vistaRuleta = document.getElementById('rouletteViewport');
        const barraRuleta = document.getElementById('rouletteActionBar');
        if (vistaRuleta) vistaRuleta.style.display = 'flex';
        if (barraRuleta) barraRuleta.style.display = 'flex';

        window.__MODO_JUEGO_ACTIVO__ = 'RULETA';
        actualizarHUD();
    }

    /**
     * Cierre de la vista de ruleta cuando se pasa a otro juego o menú
     */
    function cerrarModoRuleta() {
        const vistaRuleta = document.getElementById('rouletteViewport');
        const barraRuleta = document.getElementById('rouletteActionBar');
        if (vistaRuleta) vistaRuleta.style.display = 'none';
        if (barraRuleta) barraRuleta.style.display = 'none';

        const notifExistente = document.getElementById('notification');
        if (notifExistente) notifExistente.remove();

        if (window.__MODO_JUEGO_ACTIVO__ === 'RULETA') {
            window.__MODO_JUEGO_ACTIVO__ = null;
        }
    }

    // Escuchar eventos globales de selección de juego
    document.addEventListener('DOMContentLoaded', () => {
        // Inicialización automática en roulette.html
        if (document.getElementById('rouletteGameContainer')) {
            abrirModoRuleta();
        }

        const btnSelectRoulette = document.getElementById('btnSelectRoulette');
        const cardSelectRoulette = document.getElementById('cardSelectRoulette');

        if (btnSelectRoulette) {
            btnSelectRoulette.addEventListener('click', abrirModoRuleta);
        }
        if (cardSelectRoulette) {
            cardSelectRoulette.addEventListener('click', (e) => {
                if (e.target !== btnSelectRoulette) abrirModoRuleta();
            });
        }

        // Si se pulsa volver a selección o los otros juegos, ocultar ruleta
        const btnSelectGame = document.getElementById('btnSelectGame');
        const brandLogo = document.getElementById('brandLogo');
        const btnBackToGameSelect = document.getElementById('btnBackToGameSelect');
        const btnSelectPoker = document.getElementById('btnSelectPoker');
        const cardSelectPoker = document.getElementById('cardSelectPoker');
        const btnSelectBlackjack = document.getElementById('btnSelectBlackjack');
        const cardSelectBlackjack = document.getElementById('cardSelectBlackjack');

        [btnSelectGame, brandLogo, btnBackToGameSelect, btnSelectPoker, cardSelectPoker, btnSelectBlackjack, cardSelectBlackjack].forEach(el => {
            if (el) {
                el.addEventListener('click', () => {
                    cerrarModoRuleta();
                });
            }
        });

        // Atajos de teclado para la ruleta (G / Espacio para girar, Supr/Backspace para limpiar)
        document.addEventListener('keydown', (e) => {
            if (window.__MODO_JUEGO_ACTIVO__ !== 'RULETA') return;
            const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            const tecla = e.key.toLowerCase();
            if (tecla === 'g' || e.code === 'Space') {
                e.preventDefault();
                girarRuleta();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                limpiarApuestas();
            } else if (tecla === 'd') {
                doblarApuestas();
            }
        });
    });

    // Exponer API global
    window.ControladorRuleta = {
        iniciar: inicializar,
        abrir: abrirModoRuleta,
        girar: girarRuleta,
        limpiar: limpiarApuestas,
        doblar: doblarApuestas
    };

})();
