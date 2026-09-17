/**
 * Motor de Evaluación de Manos de Texas Hold'em
 * Soporta evaluación de las mejores 5 cartas de 7 posibles (2 de mano + 5 comunitarias)
 * Jerarquía reglamentaria oficial con desempates por Kickers y cálculo de Botes Secundarios (Side Pots).
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};
const RANK_NAMES = {
    '2': 'Doses', '3': 'Treses', '4': 'Cuatros', '5': 'Cincos', '6': 'Seises', '7': 'Sietes', '8': 'Ochos', '9': 'Nueves',
    'T': 'Dieces', 'J': 'Jotas', 'Q': 'Damas', 'K': 'Reyes', 'A': 'Ases'
};
const RANK_SINGULAR = {
    '2': 'Dos', '3': 'Tres', '4': 'Cuatro', '5': 'Cinco', '6': 'Seis', '7': 'Siete', '8': 'Ocho', '9': 'Nueve',
    'T': 'Diez', 'J': 'Jota', 'Q': 'Dama', 'K': 'Rey', 'A': 'As'
};

const HAND_TYPES = {
    ROYAL_FLUSH: 9,
    STRAIGHT_FLUSH: 8,
    FOUR_OF_A_KIND: 7,
    FULL_HOUSE: 6,
    FLUSH: 5,
    STRAIGHT: 4,
    THREE_OF_A_KIND: 3,
    TWO_PAIR: 2,
    ONE_PAIR: 1,
    HIGH_CARD: 0
};

const HAND_TYPE_NAMES = {
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
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit, value: RANK_VALUES[rank] });
        }
    }
    return deck;
}

/**
 * Mezcla la baraja usando el algoritmo Fisher-Yates
 */
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Genera todas las combinaciones de k elementos tomados de un array
 */
function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const head = arr[0];
    const tail = arr.slice(1);
    const withHead = combinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = combinations(tail, k);
    return [...withHead, ...withoutHead];
}

/**
 * Evalúa exactamente 5 cartas y devuelve un objeto con puntuación numérica y descripción
 */
function evaluate5Cards(cards) {
    // Ordenar de mayor a menor valor
    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const values = sorted.map(c => c.value);
    const suits = sorted.map(c => c.suit);

    // Comprobar Color
    const isFlush = suits.every(s => s === suits[0]);

    // Comprobar Escalera (teniendo en cuenta As bajo: A-2-3-4-5)
    let isStraight = false;
    let straightHigh = 0;

    const uniqueVals = [...new Set(values)];
    if (uniqueVals.length === 5) {
        if (values[0] - values[4] === 4) {
            isStraight = true;
            straightHigh = values[0];
        } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
            // Escalera baja (Wheel: A-2-3-4-5)
            isStraight = true;
            straightHigh = 5; // El As cuenta como 1, por lo que la carta más alta es 5
        }
    }

    // Frecuencias de valores
    const counts = {};
    for (const v of values) {
        counts[v] = (counts[v] || 0) + 1;
    }

    const countPairs = Object.entries(counts).map(([v, count]) => ({
        val: Number(v),
        count
    })).sort((a, b) => b.count - a.count || b.val - a.val);

    // 1. Escalera Real o de Color
    if (isFlush && isStraight) {
        if (straightHigh === 14) {
            return {
                type: HAND_TYPES.ROYAL_FLUSH,
                typeName: HAND_TYPE_NAMES[HAND_TYPES.ROYAL_FLUSH],
                score: [HAND_TYPES.ROYAL_FLUSH, 14],
                cards: sorted,
                desc: 'Escalera Real'
            };
        }
        return {
            type: HAND_TYPES.STRAIGHT_FLUSH,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.STRAIGHT_FLUSH],
            score: [HAND_TYPES.STRAIGHT_FLUSH, straightHigh],
            cards: sorted,
            desc: `Escalera de Color al ${RANK_SINGULAR[RANKS[straightHigh - 2]]}`
        };
    }

    // 2. Póker (Four of a Kind)
    if (countPairs[0].count === 4) {
        const quadVal = countPairs[0].val;
        const kicker = countPairs[1].val;
        return {
            type: HAND_TYPES.FOUR_OF_A_KIND,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.FOUR_OF_A_KIND],
            score: [HAND_TYPES.FOUR_OF_A_KIND, quadVal, kicker],
            cards: sorted,
            desc: `Póker de ${RANK_NAMES[RANKS[quadVal - 2]]}`
        };
    }

    // 3. Full (Full House)
    if (countPairs[0].count === 3 && countPairs[1].count === 2) {
        const trioVal = countPairs[0].val;
        const pairVal = countPairs[1].val;
        return {
            type: HAND_TYPES.FULL_HOUSE,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.FULL_HOUSE],
            score: [HAND_TYPES.FULL_HOUSE, trioVal, pairVal],
            cards: sorted,
            desc: `Full de ${RANK_NAMES[RANKS[trioVal - 2]]} y ${RANK_NAMES[RANKS[pairVal - 2]]}`
        };
    }

    // 4. Color (Flush)
    if (isFlush) {
        return {
            type: HAND_TYPES.FLUSH,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.FLUSH],
            score: [HAND_TYPES.FLUSH, ...values],
            cards: sorted,
            desc: `Color al ${RANK_SINGULAR[RANKS[values[0] - 2]]}`
        };
    }

    // 5. Escalera (Straight)
    if (isStraight) {
        return {
            type: HAND_TYPES.STRAIGHT,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.STRAIGHT],
            score: [HAND_TYPES.STRAIGHT, straightHigh],
            cards: sorted,
            desc: `Escalera al ${RANK_SINGULAR[RANKS[straightHigh - 2]]}`
        };
    }

    // 6. Trío (Three of a Kind)
    if (countPairs[0].count === 3) {
        const trioVal = countPairs[0].val;
        const kickers = [countPairs[1].val, countPairs[2].val].sort((a, b) => b - a);
        return {
            type: HAND_TYPES.THREE_OF_A_KIND,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.THREE_OF_A_KIND],
            score: [HAND_TYPES.THREE_OF_A_KIND, trioVal, ...kickers],
            cards: sorted,
            desc: `Trío de ${RANK_NAMES[RANKS[trioVal - 2]]}`
        };
    }

    // 7. Doble Pareja (Two Pair)
    if (countPairs[0].count === 2 && countPairs[1].count === 2) {
        const highPair = Math.max(countPairs[0].val, countPairs[1].val);
        const lowPair = Math.min(countPairs[0].val, countPairs[1].val);
        const kicker = countPairs[2].val;
        return {
            type: HAND_TYPES.TWO_PAIR,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.TWO_PAIR],
            score: [HAND_TYPES.TWO_PAIR, highPair, lowPair, kicker],
            cards: sorted,
            desc: `Doble Pareja de ${RANK_NAMES[RANKS[highPair - 2]]} y ${RANK_NAMES[RANKS[lowPair - 2]]}`
        };
    }

    // 8. Pareja (One Pair)
    if (countPairs[0].count === 2) {
        const pairVal = countPairs[0].val;
        const kickers = [countPairs[1].val, countPairs[2].val, countPairs[3].val].sort((a, b) => b - a);
        return {
            type: HAND_TYPES.ONE_PAIR,
            typeName: HAND_TYPE_NAMES[HAND_TYPES.ONE_PAIR],
            score: [HAND_TYPES.ONE_PAIR, pairVal, ...kickers],
            cards: sorted,
            desc: `Pareja de ${RANK_NAMES[RANKS[pairVal - 2]]}`
        };
    }

    // 9. Carta Alta (High Card)
    return {
        type: HAND_TYPES.HIGH_CARD,
        typeName: HAND_TYPE_NAMES[HAND_TYPES.HIGH_CARD],
        score: [HAND_TYPES.HIGH_CARD, ...values],
        cards: sorted,
        desc: `Carta Alta ${RANK_SINGULAR[RANKS[values[0] - 2]]}`
    };
}

/**
 * Compara dos puntuaciones de manos (arrays de enteros)
 * Devuelve > 0 si scoreA > scoreB, < 0 si scoreA < scoreB, 0 si empatan exactamente
 */
function compareScores(scoreA, scoreB) {
    const len = Math.max(scoreA.length, scoreB.length);
    for (let i = 0; i < len; i++) {
        const a = scoreA[i] || 0;
        const b = scoreB[i] || 0;
        if (a !== b) return a - b;
    }
    return 0;
}

/**
 * Evalúa las mejores 5 cartas de un conjunto de hasta 7 cartas (2 mano + 0-5 comunitarias)
 */
function evaluateHand(holeCards, communityCards = []) {
    const totalCards = [...holeCards, ...communityCards];
    if (totalCards.length < 5) {
        // Evaluación preliminar para pre-flop o flop con menos de 5 cartas
        if (holeCards.length === 2 && holeCards[0].rank === holeCards[1].rank) {
            return {
                type: HAND_TYPES.ONE_PAIR,
                typeName: 'Pareja de Mano',
                desc: `Pareja de ${RANK_NAMES[holeCards[0].rank]}`,
                score: [HAND_TYPES.ONE_PAIR, holeCards[0].value, holeCards[0].value]
            };
        }
        if (holeCards.length === 2) {
            const high = Math.max(holeCards[0].value, holeCards[1].value);
            return {
                type: HAND_TYPES.HIGH_CARD,
                typeName: 'Carta Alta',
                desc: `Carta Alta ${RANK_SINGULAR[RANKS[high - 2]]}`,
                score: [HAND_TYPES.HIGH_CARD, high]
            };
        }
        return { type: -1, typeName: 'Esperando cartas', desc: '', score: [-1] };
    }

    // Generar todas las combinaciones de 5 cartas
    const all5Combos = combinations(totalCards, 5);
    let bestHand = null;

    for (const combo of all5Combos) {
        const evalResult = evaluate5Cards(combo);
        if (!bestHand || compareScores(evalResult.score, bestHand.score) > 0) {
            bestHand = evalResult;
        }
    }

    return bestHand;
}

/**
 * Determina los ganadores de una mano entre los jugadores activos en Showdown,
 * teniendo en cuenta botes principales y secundarios (*side pots*).
 * 
 * players: Array de { id, name, holeCards, totalBet, folded, ... }
 * communityCards: Array de 5 cartas comunitarias
 */
function resolveShowdown(players, communityCards) {
    const activePlayers = players.filter(p => !p.folded);
    
    // Evaluar la mejor mano para cada jugador activo
    activePlayers.forEach(p => {
        p.evaluatedHand = evaluateHand(p.holeCards, communityCards);
    });

    // Calcular botes (Main pot + Side pots) según las apuestas acumuladas
    const betLevels = [...new Set(players.map(p => p.totalBet))]
        .filter(b => b > 0)
        .sort((a, b) => a - b);

    const pots = [];
    let previousLevel = 0;

    for (const level of betLevels) {
        const contribution = level - previousLevel;
        let potAmount = 0;
        const eligiblePlayers = [];

        for (const p of players) {
            if (p.totalBet >= level) {
                potAmount += contribution;
            } else if (p.totalBet > previousLevel) {
                potAmount += (p.totalBet - previousLevel);
            }

            if (!p.folded && p.totalBet >= level) {
                eligiblePlayers.push(p);
            }
        }

        if (potAmount > 0 && eligiblePlayers.length > 0) {
            pots.push({
                amount: potAmount,
                eligible: eligiblePlayers
            });
        }
        previousLevel = level;
    }

    // Si no se han formado botes por niveles (ej. apuestas igualadas simples), crear un bote único
    if (pots.length === 0) {
        const totalChips = players.reduce((sum, p) => sum + (p.totalBet || 0), 0);
        pots.push({
            amount: totalChips,
            eligible: activePlayers
        });
    }

    // Repartir cada bote entre el/los jugador(es) elegible(s) con la mejor mano
    const payouts = {};
    players.forEach(p => { payouts[p.id] = 0; });

    const potResults = [];

    pots.forEach((pot, index) => {
        let bestScore = null;
        let winners = [];

        for (const player of pot.eligible) {
            if (!bestScore) {
                bestScore = player.evaluatedHand.score;
                winners = [player];
            } else {
                const cmp = compareScores(player.evaluatedHand.score, bestScore);
                if (cmp > 0) {
                    bestScore = player.evaluatedHand.score;
                    winners = [player];
                } else if (cmp === 0) {
                    winners.push(player);
                }
            }
        }

        // Reparto equitativo entre ganadores del bote
        const share = Math.floor(pot.amount / winners.length);
        const remainder = pot.amount % winners.length;

        winners.forEach((w, i) => {
            const wonAmount = share + (i === 0 ? remainder : 0);
            payouts[w.id] += wonAmount;
        });

        potResults.push({
            potIndex: index,
            amount: pot.amount,
            winners: winners.map(w => ({
                id: w.id,
                name: w.name,
                hand: w.evaluatedHand.desc,
                typeName: w.evaluatedHand.typeName
            }))
        });
    });

    return {
        payouts,
        potResults,
        activePlayers: activePlayers.map(p => ({
            id: p.id,
            name: p.name,
            hand: p.evaluatedHand.desc,
            typeName: p.evaluatedHand.typeName,
            best5Cards: p.evaluatedHand.cards
        }))
    };
}

// Exportar funciones para uso en el navegador y módulos
if (typeof window !== 'undefined') {
    window.PokerEngine = {
        SUITS,
        SUIT_NAMES,
        RANKS,
        RANK_VALUES,
        RANK_NAMES,
        HAND_TYPES,
        HAND_TYPE_NAMES,
        createDeck,
        shuffleDeck,
        evaluate5Cards,
        evaluateHand,
        compareScores,
        resolveShowdown
    };
}
