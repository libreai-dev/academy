/**
 * Stage 0 · Choosing the next token. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: the model's final hidden state becomes a raw score for every token
 * in the dictionary (a logit); softmax turns those scores into probabilities;
 * then one token is chosen — greedily or by sampling.
 */
import type { WsNodeCopy } from "./shared";

export interface NextTokenLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — prompt toggle + diagram labels
  n1prompts: string[]; // button labels (also the shown prompt text)
  tokens: string[][]; // candidate token strings, per prompt, index-aligned to LOGITS
  n1hiddenLabel: string; // "hidden state"
  n1unembedLabel: string; // "× unembedding"
  n1logitsTitle: string; // "raw score per token (logit)"
  // node 2 — softmax
  n2sumTitle: string; // "probabilities · sum = 100%"
  n2leadPrefix: string; // "Now leading:"
  n2deeperTitle: string;
  n2deeperBody: string;
  // node 3 — picking
  n3greedy: string;
  n3sample: string;
  n3roll: string;
  n3probsTitle: string; // "probabilities · one gets chosen"
  chosenLabel: string; // diagram marker on the picked bar
  // outro
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevRoadmap: string;
  nextLesson: string;
}

export const nextTokenEN: NextTokenLesson = {
  crumb: "STAGE 0 · CHOOSING THE NEXT TOKEN",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Choosing the next token",
  lede: "A transformer's very last step turns one hidden state into a single next word. Watch the model score every token in its dictionary, squash the scores into probabilities, and pick one — with every knob live to play with.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Hidden state → scores", "Scores → probabilities", "Picking one"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "From hidden state to scores",
      intro: "After the last transformer block, the model holds one vector — the hidden state. The final step scores every token in the dictionary against it.",
      bullets: [
        "**The hidden state is a list of numbers** — the model's compressed guess about what comes next, one vector for the current position.",
        "**Unembedding scores every token.** That vector is compared against each of the ~200k tokens in the dictionary, giving each a raw score called a **logit**.",
        "**Logits can be any size, positive or negative.** Higher means 'more likely next' — but they are *not* probabilities yet.",
        "**Context sets the scores.** Switch the prompt and the same machine produces a completely different ranking.",
      ],
      cardLabel: "HIDDEN STATE → LOGITS",
      aria: "A flow from the hidden state through unembedding to a raw score for each candidate token.",
      steps: 1,
      captions: ["The hidden state is scored against every token; each bar is a raw logit."],
      hint: "Switch the prompt — the scores re-rank around a different winner.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "\"The capital of France is …\" — the model scores 'Paris' far above the rest, because that continuation fits everything it has read.",
        "\"The sky is …\" — a new context, new scores: 'blue' now leads, and the France answers score near nothing.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Softmax turns scores into probabilities",
      intro: "Raw scores are awkward — some negative, no ceiling, they don't add up to anything. Softmax turns them into clean probabilities.",
      bullets: [
        "**Softmax in one line:** raise `e` to each score, then divide by the total — so every value is positive and they all add up to 100%.",
        "**Bigger gaps win bigger.** Because of the exponential, a score that's a little higher grabs a lot more probability.",
        "**Nudge the top scores** and watch the bars trade probability in real time.",
      ],
      cardLabel: "SOFTMAX · PROBABILITIES",
      aria: "A probability bar chart over the candidate tokens that always sums to 100%.",
      steps: 1,
      captions: ["Softmax maps the raw scores onto probabilities that sum to 100%."],
      hint: "Drag a slider — raise 'France' above 'Paris' and the favourite flips.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Picking one: greedy or sample",
      intro: "Now a single token has to come out. There are two ways to choose from the probabilities.",
      bullets: [
        "**Greedy** takes the single highest-probability token, every time — repeatable, but flat and predictable.",
        "**Sampling** rolls a weighted die: each token's chance of being picked *is* its probability — more surprise, more variety.",
        "**Same distribution, different pick.** Greedy always lands on the favourite; sampling can land anywhere the probabilities allow.",
      ],
      cardLabel: "GREEDY vs SAMPLE",
      aria: "A probability bar chart with the chosen token highlighted.",
      steps: 1,
      captions: ["The chosen token is highlighted; greedy takes the top, sampling rolls the dice."],
      hint: "Flip to Sample and roll a few times — the pick jumps around by probability.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Greedy — always take the top bar. Deterministic: the same prompt gives the same word every time.",
        "Sampling — draw a token at random, weighted by its probability. Roll again for a different pick; a lower bar can still win.",
      ],
    },
  ],
  n1prompts: ["The capital of France is …", "The sky is …"],
  tokens: [
    ["Paris", "Lyon", "France", "the", "a", "London"],
    ["blue", "clear", "grey", "the", "a", "falling"],
  ],
  n1hiddenLabel: "hidden state (a vector)",
  n1unembedLabel: "× unembedding →",
  n1logitsTitle: "raw score per token · logit",
  n2sumTitle: "probabilities · sum = 100%",
  n2leadPrefix: "Now leading:",
  n2deeperTitle: "The softmax formula",
  n2deeperBody: "For scores z₁…zₙ, the probability of token i is p(i) = exp(zᵢ) / Σⱼ exp(zⱼ). Exponentiating makes every value positive; dividing by the sum makes them add to 1. Later lessons add a *temperature* T that divides each score first (zᵢ ⁄ T) — high T flattens the bars toward a coin-flip, low T sharpens them toward greedy.",
  n3greedy: "GREEDY",
  n3sample: "SAMPLE",
  n3roll: "🎲 Roll the dice",
  n3probsTitle: "probabilities · one gets chosen",
  chosenLabel: "◀ chosen",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Two runs of the same model on the same prompt can return different words. How, if the maths is fixed?",
  explainA: "The scores and the probabilities *are* fixed — but the final step doesn't have to take the top one. With **sampling**, the model rolls a weighted die over the probabilities, so a lower-ranked token can win. **Greedy** decoding removes that randomness and always takes the favourite. Same logits, same softmax — different pick.",
  bridgeLabel: "NEXT · THE AUTOREGRESSIVE LOOP",
  bridgeBody: "One token is out. Now the model glues it onto the end of the prompt and runs the whole thing again — and again. Token by token, **that loop is how a whole sentence appears**. Next: the autoregressive loop.",
  prevRoadmap: "Back to the transformer block",
  nextLesson: "Continue to the loop",
};

export const nextTokenES: NextTokenLesson = {
  crumb: "ETAPA 0 · ELEGIR EL SIGUIENTE TOKEN",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Elegir el siguiente token",
  lede: "El último paso de un transformer convierte un estado oculto en una sola palabra siguiente. Mira cómo el modelo puntúa cada token de su diccionario, aplasta las puntuaciones en probabilidades y elige una — con cada control en vivo para que juegues.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Estado oculto → puntuaciones", "Puntuaciones → probabilidades", "Elegir uno"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Del estado oculto a las puntuaciones",
      intro: "Tras el último bloque del transformer, el modelo guarda un vector — el estado oculto. El paso final puntúa cada token del diccionario contra él.",
      bullets: [
        "**El estado oculto es una lista de números** — la conjetura comprimida del modelo sobre lo que sigue, un vector para la posición actual.",
        "**El unembedding puntúa cada token.** Ese vector se compara contra cada uno de los ~200k tokens del diccionario, dando a cada uno una puntuación cruda llamada **logit**.",
        "**Los logits pueden ser de cualquier tamaño, positivos o negativos.** Más alto significa 'más probable' — pero *todavía no* son probabilidades.",
        "**El contexto fija las puntuaciones.** Cambia el prompt y la misma máquina produce un ranking completamente distinto.",
      ],
      cardLabel: "ESTADO OCULTO → LOGITS",
      aria: "Un flujo desde el estado oculto por el unembedding hasta una puntuación cruda para cada token candidato.",
      steps: 1,
      captions: ["El estado oculto se puntúa contra cada token; cada barra es un logit crudo."],
      hint: "Cambia el prompt — las puntuaciones se reordenan en torno a otro ganador.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "\"La capital de Francia es …\" — el modelo puntúa 'París' muy por encima del resto, porque esa continuación encaja con todo lo que ha leído.",
        "\"El cielo es …\" — nuevo contexto, nuevas puntuaciones: ahora lidera 'azul', y las respuestas de Francia puntúan casi en nada.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Softmax convierte puntuaciones en probabilidades",
      intro: "Las puntuaciones crudas son incómodas — algunas negativas, sin techo, no suman a nada. Softmax las convierte en probabilidades limpias.",
      bullets: [
        "**Softmax en una línea:** eleva `e` a cada puntuación y luego divide por el total — así todo valor es positivo y entre todos suman 100%.",
        "**Las brechas grandes ganan más.** Por lo exponencial, una puntuación un poco más alta se lleva mucha más probabilidad.",
        "**Ajusta las puntuaciones altas** y mira cómo las barras intercambian probabilidad en tiempo real.",
      ],
      cardLabel: "SOFTMAX · PROBABILIDADES",
      aria: "Un gráfico de barras de probabilidad sobre los tokens candidatos que siempre suma 100%.",
      steps: 1,
      captions: ["Softmax mapea las puntuaciones crudas a probabilidades que suman 100%."],
      hint: "Arrastra un control — sube 'Francia' por encima de 'París' y el favorito cambia.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Elegir uno: greedy o muestreo",
      intro: "Ahora tiene que salir un solo token. Hay dos formas de elegir entre las probabilidades.",
      bullets: [
        "**Greedy** toma siempre el token de mayor probabilidad — repetible, pero plano y predecible.",
        "**Muestreo** tira un dado con pesos: la probabilidad de cada token *es* su probabilidad — más sorpresa, más variedad.",
        "**Misma distribución, distinta elección.** Greedy siempre cae en el favorito; el muestreo puede caer donde las probabilidades lo permitan.",
      ],
      cardLabel: "GREEDY vs MUESTREO",
      aria: "Un gráfico de barras de probabilidad con el token elegido resaltado.",
      steps: 1,
      captions: ["El token elegido se resalta; greedy toma el más alto, el muestreo tira el dado."],
      hint: "Cambia a Muestreo y tira varias veces — la elección salta según la probabilidad.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Greedy — toma siempre la barra más alta. Determinista: el mismo prompt da la misma palabra cada vez.",
        "Muestreo — saca un token al azar, ponderado por su probabilidad. Vuelve a tirar para otra elección; una barra más baja aún puede ganar.",
      ],
    },
  ],
  n1prompts: ["La capital de Francia es …", "El cielo es …"],
  tokens: [
    ["París", "Lyon", "Francia", "el", "un", "Londres"],
    ["azul", "despejado", "gris", "el", "un", "cayendo"],
  ],
  n1hiddenLabel: "estado oculto (un vector)",
  n1unembedLabel: "× unembedding →",
  n1logitsTitle: "puntuación cruda por token · logit",
  n2sumTitle: "probabilidades · suma = 100%",
  n2leadPrefix: "Ahora lidera:",
  n2deeperTitle: "La fórmula de softmax",
  n2deeperBody: "Para puntuaciones z₁…zₙ, la probabilidad del token i es p(i) = exp(zᵢ) / Σⱼ exp(zⱼ). Exponenciar hace positivo cada valor; dividir por la suma hace que sumen 1. Lecciones posteriores añaden una *temperatura* T que divide primero cada puntuación (zᵢ ⁄ T) — una T alta aplana las barras hacia el azar puro, una T baja las afila hacia greedy.",
  n3greedy: "GREEDY",
  n3sample: "MUESTREO",
  n3roll: "🎲 Tirar el dado",
  n3probsTitle: "probabilidades · se elige una",
  chosenLabel: "◀ elegido",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Dos ejecuciones del mismo modelo con el mismo prompt pueden devolver palabras distintas. ¿Cómo, si las matemáticas están fijas?",
  explainA: "Las puntuaciones y las probabilidades *sí* están fijas — pero el paso final no tiene que tomar la más alta. Con **muestreo**, el modelo tira un dado con pesos sobre las probabilidades, así un token peor situado puede ganar. La decodificación **greedy** quita ese azar y toma siempre el favorito. Mismos logits, mismo softmax — distinta elección.",
  bridgeLabel: "SIGUIENTE · EL BUCLE AUTORREGRESIVO",
  bridgeBody: "Ya salió un token. Ahora el modelo lo pega al final del prompt y corre todo otra vez — y otra. Token a token, **ese bucle es como aparece una frase entera**. Sigue: el bucle autorregresivo.",
  prevRoadmap: "Volver al bloque transformer",
  nextLesson: "Continuar al bucle",
};
