/**
 * Motor de Evaluación de Manos de Texas Hold'em en Castellano
 * Soporta evaluación de las mejores 5 cartas de 7 posibles (2 de mano + 5 comunitarias)
 * Jerarquía reglamentaria oficial con desempates por cartas de apoyo (kickers) y cálculo de botes secundarios.
 */

const PALOS = ['♠', '♥', '♦', '♣'];
const NOMBRES_PALOS = { '♠': 'picas', '♥': 'corazones', '♦': 'diamantes', '♣': 'treboles' };
const RANGOS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const VALORES_NUMERICOS = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const RANGOS_PLURAL = {
    '2': 'Doses', '3': 'Treses', '4': 'Cuatros', '5': 'Cincos', '6': 'Seises', '7': 'Sietes', '8': 'Ochos', '9': 'Nueves',
    'T': 'Dieces', 'J': 'Jotas', 'Q': 'Damas', 'K': 'Reyes', 'A': 'Ases'
};

const RANGOS_SINGULAR = {
    '2': 'Dos', '3': 'Tres', '4': 'Cuatro', '5': 'Cinco', '6': 'Seis', '7': 'Siete', '8': 'Ocho', '9': 'Nueve',
    'T': 'Diez', 'J': 'Jota', 'Q': 'Dama', 'K': 'Rey', 'A': 'As'
};

const TIPOS_JUGADA = {
    ESCALERA_REAL: 9,
    ESCALERA_COLOR: 8,
    POKER: 7,
    FULL: 6,
    COLOR: 5,
    ESCALERA: 4,
    TRIO: 3,
    DOBLE_PAREJA: 2,
    PAREJA: 1,
    CARTA_ALTA: 0
};

const NOMBRES_TIPOS_JUGADA = {
    9: 'Escalera Real',
    8: 'Escalera de Color',
    7: 'Póker',
    6: 'Full',
    5: 'Color',
    4: 'Escalera',
    3: 'Trío',
    2: 'Doble Pareja',
    1: 'Pareja',
    0: 'Carta Alta'
};

/**
 * Crea una baraja completa de 52 cartas
 */
function crearBaraja() {
    const baraja = [];
    for (const palo of PALOS) {
        for (const rango of RANGOS) {
            baraja.push({ 
                palo: palo, 
                rango: rango, 
                valor: VALORES_NUMERICOS[rango],
                // Compatibilidad
                suit: palo,
                rank: rango,
                value: VALORES_NUMERICOS[rango]
            });
        }
    }
    return baraja;
}

/**
 * Baraja las cartas usando el algoritmo Fisher-Yates
 */
function barajar(cartas) {
    const cartasBarajadas = [...cartas];
    for (let i = cartasBarajadas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartasBarajadas[i], cartasBarajadas[j]] = [cartasBarajadas[j], cartasBarajadas[i]];
    }
    return cartasBarajadas;
}

/**
 * Genera todas las combinaciones de k elementos
 */
function combinaciones(arreglo, k) {
    if (k === 0) return [[]];
    if (arreglo.length === 0) return [];
    const cabeza = arreglo[0];
    const cola = arreglo.slice(1);
    const conCabeza = combinaciones(cola, k - 1).map(c => [cabeza, ...c]);
    const sinCabeza = combinaciones(cola, k);
    return [...conCabeza, ...sinCabeza];
}

/**
 * Evalúa exactamente 5 cartas y devuelve una puntuación numérica y su descripción
 */
function evaluar5Cartas(cartas) {
    const ordenadas = [...cartas].sort((a, b) => (b.valor || b.value) - (a.valor || a.value));
    const valores = ordenadas.map(c => c.valor || c.value);
    const palos = ordenadas.map(c => c.palo || c.suit);

    const esMismoPalo = palos.every(p => p === palos[0]);

    let esEscalera = false;
    let cartaAltaEscalera = 0;

    const valoresUnicos = [...new Set(valores)];
    if (valoresUnicos.length === 5) {
        if (valores[0] - valores[4] === 4) {
            esEscalera = true;
            cartaAltaEscalera = valores[0];
        } else if (valores[0] === 14 && valores[1] === 5 && valores[2] === 4 && valores[3] === 3 && valores[4] === 2) {
            // Escalera con As bajo (A-2-3-4-5)
            esEscalera = true;
            cartaAltaEscalera = 5;
        }
    }

    const conteoValores = {};
    for (const v of valores) {
        conteoValores[v] = (conteoValores[v] || 0) + 1;
    }

    const parejasConteo = Object.entries(conteoValores).map(([v, cantidad]) => ({
        valor: Number(v),
        cantidad
    })).sort((a, b) => b.cantidad - a.cantidad || b.valor - a.valor);

    // 1. Escalera Real o de Color
    if (esMismoPalo && esEscalera) {
        if (cartaAltaEscalera === 14) {
            return {
                tipo: TIPOS_JUGADA.ESCALERA_REAL,
                nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.ESCALERA_REAL],
                puntuacion: [TIPOS_JUGADA.ESCALERA_REAL, 14],
                cartas: ordenadas,
                desc: 'Escalera Real de Color'
            };
        }
        return {
            tipo: TIPOS_JUGADA.ESCALERA_COLOR,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.ESCALERA_COLOR],
            puntuacion: [TIPOS_JUGADA.ESCALERA_COLOR, cartaAltaEscalera],
            cartas: ordenadas,
            desc: `Escalera de Color al ${RANGOS_SINGULAR[RANGOS[cartaAltaEscalera - 2]]}`
        };
    }

    // 2. Póker
    if (parejasConteo[0].cantidad === 4) {
        const valorPoker = parejasConteo[0].valor;
        const cartaApoyo = parejasConteo[1].valor;
        return {
            tipo: TIPOS_JUGADA.POKER,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.POKER],
            puntuacion: [TIPOS_JUGADA.POKER, valorPoker, cartaApoyo],
            cartas: ordenadas,
            desc: `Póker de ${RANGOS_PLURAL[RANGOS[valorPoker - 2]]}`
        };
    }

    // 3. Full
    if (parejasConteo[0].cantidad === 3 && parejasConteo[1].cantidad === 2) {
        const valorTrio = parejasConteo[0].valor;
        const valorPareja = parejasConteo[1].valor;
        return {
            tipo: TIPOS_JUGADA.FULL,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.FULL],
            puntuacion: [TIPOS_JUGADA.FULL, valorTrio, valorPareja],
            cartas: ordenadas,
            desc: `Full de ${RANGOS_PLURAL[RANGOS[valorTrio - 2]]} y ${RANGOS_PLURAL[RANGOS[valorPareja - 2]]}`
        };
    }

    // 4. Color
    if (esMismoPalo) {
        return {
            tipo: TIPOS_JUGADA.COLOR,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.COLOR],
            puntuacion: [TIPOS_JUGADA.COLOR, ...valores],
            cartas: ordenadas,
            desc: `Color al ${RANGOS_SINGULAR[RANGOS[valores[0] - 2]]}`
        };
    }

    // 5. Escalera
    if (esEscalera) {
        return {
            tipo: TIPOS_JUGADA.ESCALERA,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.ESCALERA],
            puntuacion: [TIPOS_JUGADA.ESCALERA, cartaAltaEscalera],
            cartas: ordenadas,
            desc: `Escalera al ${RANGOS_SINGULAR[RANGOS[cartaAltaEscalera - 2]]}`
        };
    }

    // 6. Trío
    if (parejasConteo[0].cantidad === 3) {
        const valorTrio = parejasConteo[0].valor;
        const cartasApoyo = [parejasConteo[1].valor, parejasConteo[2].valor].sort((a, b) => b - a);
        return {
            tipo: TIPOS_JUGADA.TRIO,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.TRIO],
            puntuacion: [TIPOS_JUGADA.TRIO, valorTrio, ...cartasApoyo],
            cartas: ordenadas,
            desc: `Trío de ${RANGOS_PLURAL[RANGOS[valorTrio - 2]]}`
        };
    }

    // 7. Doble Pareja
    if (parejasConteo[0].cantidad === 2 && parejasConteo[1].cantidad === 2) {
        const parejaAlta = Math.max(parejasConteo[0].valor, parejasConteo[1].valor);
        const parejaBaja = Math.min(parejasConteo[0].valor, parejasConteo[1].valor);
        const cartaApoyo = parejasConteo[2].valor;
        return {
            tipo: TIPOS_JUGADA.DOBLE_PAREJA,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.DOBLE_PAREJA],
            puntuacion: [TIPOS_JUGADA.DOBLE_PAREJA, parejaAlta, parejaBaja, cartaApoyo],
            cartas: ordenadas,
            desc: `Doble Pareja de ${RANGOS_PLURAL[RANGOS[parejaAlta - 2]]} y ${RANGOS_PLURAL[RANGOS[parejaBaja - 2]]}`
        };
    }

    // 8. Pareja
    if (parejasConteo[0].cantidad === 2) {
        const valorPareja = parejasConteo[0].valor;
        const cartasApoyo = [parejasConteo[1].valor, parejasConteo[2].valor, parejasConteo[3].valor].sort((a, b) => b - a);
        return {
            tipo: TIPOS_JUGADA.PAREJA,
            nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.PAREJA],
            puntuacion: [TIPOS_JUGADA.PAREJA, valorPareja, ...cartasApoyo],
            cartas: ordenadas,
            desc: `Pareja de ${RANGOS_PLURAL[RANGOS[valorPareja - 2]]}`
        };
    }

    // 9. Carta Alta
    return {
        tipo: TIPOS_JUGADA.CARTA_ALTA,
        nombreTipo: NOMBRES_TIPOS_JUGADA[TIPOS_JUGADA.CARTA_ALTA],
        puntuacion: [TIPOS_JUGADA.CARTA_ALTA, ...valores],
        cartas: ordenadas,
        desc: `Carta Alta ${RANGOS_SINGULAR[RANGOS[valores[0] - 2]]}`
    };
}

/**
 * Compara dos puntuaciones numéricas
 */
function compararPuntuaciones(puntuacionA, puntuacionB) {
    const longitud = Math.max(puntuacionA.length, puntuacionB.length);
    for (let i = 0; i < longitud; i++) {
        const a = puntuacionA[i] || 0;
        const b = puntuacionB[i] || 0;
        if (a !== b) return a - b;
    }
    return 0;
}

/**
 * Evalúa las mejores 5 cartas de un conjunto de hasta 7 cartas
 */
function evaluarMano(cartasMano, cartasComunitarias = []) {
    const totalCartas = [...cartasMano, ...cartasComunitarias];
    if (totalCartas.length < 5) {
        if (cartasMano.length === 2 && (cartasMano[0].rango || cartasMano[0].rank) === (cartasMano[1].rango || cartasMano[1].rank)) {
            const rango = cartasMano[0].rango || cartasMano[0].rank;
            const valor = cartasMano[0].valor || cartasMano[0].value;
            return {
                tipo: TIPOS_JUGADA.PAREJA,
                nombreTipo: 'Pareja de Mano',
                desc: `Pareja de ${RANGOS_PLURAL[rango]}`,
                puntuacion: [TIPOS_JUGADA.PAREJA, valor, valor]
            };
        }
        if (cartasMano.length === 2) {
            const val0 = cartasMano[0].valor || cartasMano[0].value;
            const val1 = cartasMano[1].valor || cartasMano[1].value;
            const alto = Math.max(val0, val1);
            return {
                tipo: TIPOS_JUGADA.CARTA_ALTA,
                nombreTipo: 'Carta Alta',
                desc: `Carta Alta ${RANGOS_SINGULAR[RANGOS[alto - 2]]}`,
                puntuacion: [TIPOS_JUGADA.CARTA_ALTA, alto]
            };
        }
        return { tipo: -1, nombreTipo: 'Esperando cartas', desc: '', puntuacion: [-1] };
    }

    const todasLas5 = combinaciones(totalCartas, 5);
    let mejorJugada = null;

    for (const combo of todasLas5) {
        const resultado = evaluar5Cartas(combo);
        if (!mejorJugada || compararPuntuaciones(resultado.puntuacion, mejorJugada.puntuacion) > 0) {
            mejorJugada = resultado;
        }
    }

    return mejorJugada;
}

/**
 * Resuelve la confrontación final de manos
 */
function resolverConfrontacion(jugadores, cartasComunitarias) {
    const jugadoresActivos = jugadores.filter(j => !j.retirado && !j.folded);

    jugadoresActivos.forEach(j => {
        j.manoEvaluada = evaluarMano(j.cartasMano || j.holeCards, cartasComunitarias);
    });

    const nivelesApuesta = [...new Set(jugadores.map(j => j.apuestaTotal || j.totalBet || 0))]
        .filter(a => a > 0)
        .sort((a, b) => a - b);

    const botes = [];
    let nivelAnterior = 0;

    for (const nivel of nivelesApuesta) {
        const contribucion = nivel - nivelAnterior;
        let cantidadBote = 0;
        const jugadoresElegibles = [];

        for (const j of jugadores) {
            const apuesta = j.apuestaTotal || j.totalBet || 0;
            const estaRetirado = j.retirado || j.folded;

            if (apuesta >= nivel) {
                cantidadBote += contribucion;
            } else if (apuesta > nivelAnterior) {
                cantidadBote += (apuesta - nivelAnterior);
            }

            if (!estaRetirado && apuesta >= nivel) {
                jugadoresElegibles.push(j);
            }
        }

        if (cantidadBote > 0 && jugadoresElegibles.length > 0) {
            botes.push({
                cantidad: cantidadBote,
                elegibles: jugadoresElegibles
            });
        }
        nivelAnterior = nivel;
    }

    if (botes.length === 0) {
        const totalFichas = jugadores.reduce((suma, j) => suma + (j.apuestaTotal || j.totalBet || 0), 0);
        botes.push({
            cantidad: totalFichas,
            elegibles: jugadoresActivos
        });
    }

    const pagos = {};
    jugadores.forEach(j => { pagos[j.id] = 0; });
    const resultadosBote = [];

    botes.forEach((bote, indice) => {
        let mejorPuntuacion = null;
        let ganadores = [];

        for (const jugador of bote.elegibles) {
            const puntuacion = jugador.manoEvaluada.puntuacion;
            if (!mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                ganadores = [jugador];
            } else {
                const comparacion = compararPuntuaciones(puntuacion, mejorPuntuacion);
                if (comparacion > 0) {
                    mejorPuntuacion = puntuacion;
                    ganadores = [jugador];
                } else if (comparacion === 0) {
                    ganadores.push(jugador);
                }
            }
        }

        const parte = Math.floor(bote.cantidad / ganadores.length);
        const sobrante = bote.cantidad % ganadores.length;

        ganadores.forEach((g, i) => {
            const montoGanado = parte + (i === 0 ? sobrante : 0);
            pagos[g.id] += montoGanado;
        });

        resultadosBote.push({
            indiceBote: indice,
            cantidad: bote.cantidad,
            ganadores: ganadores.map(g => ({
                id: g.id,
                nombre: g.nombre || g.name,
                jugada: g.manoEvaluada.desc,
                nombreTipo: g.manoEvaluada.nombreTipo
            }))
        });
    });

    return {
        pagos,
        resultadosBote,
        payouts: pagos,
        potResults: resultadosBote,
        jugadoresActivos: jugadoresActivos.map(j => ({
            id: j.id,
            nombre: j.nombre || j.name,
            jugada: j.manoEvaluada.desc,
            nombreTipo: j.manoEvaluada.nombreTipo,
            mejores5Cartas: j.manoEvaluada.cartas
        }))
    };
}

// Exportación en español con alias de compatibilidad
if (typeof window !== 'undefined') {
    window.MotorPoker = {
        PALOS,
        NOMBRES_PALOS,
        RANGOS,
        VALORES_NUMERICOS,
        RANGOS_PLURAL,
        RANGOS_SINGULAR,
        TIPOS_JUGADA,
        NOMBRES_TIPOS_JUGADA,
        crearBaraja,
        barajar,
        combinaciones,
        evaluar5Cartas,
        compararPuntuaciones,
        evaluarMano,
        resolverConfrontacion,
        
        // Alias de compatibilidad
        SUITS: PALOS,
        SUIT_NAMES: NOMBRES_PALOS,
        RANKS: RANGOS,
        RANK_VALUES: VALORES_NUMERICOS,
        RANK_NAMES: RANGOS_PLURAL,
        RANK_SINGULAR: RANGOS_SINGULAR,
        HAND_TYPES: TIPOS_JUGADA,
        HAND_TYPE_NAMES: NOMBRES_TIPOS_JUGADA,
        createDeck: crearBaraja,
        shuffleDeck: barajar,
        evaluate5Cards: evaluar5Cartas,
        evaluateHand: evaluarMano,
        compareScores: compararPuntuaciones,
        resolveShowdown: resolverConfrontacion
    };
    window.PokerEngine = window.MotorPoker;
}
