/**
 * Stage 0 · 2·B — The feed-forward network. Interface + EN/ES copy, isolated
 * from every other lesson so edits here never touch theirs.
 *
 * One idea: after attention, each token passes through a small 2-layer network
 * that EXPANDS then COMPRESSES — and that is where a model's factual memory
 * lives. Builds on the transformer-block lesson (the block = attention + this).
 */
import type { WsNodeCopy } from "./shared";

export interface FeedForwardLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — expand
  n1slider: string; //      "EXPANSION FACTOR"
  n1inputLabel: string; //  "token vector"
  n1hiddenLabel: string; // "hidden layer"
  n1dimsWord: string; //    "dims"
  n1upLabel: string; //     "up-projection"
  n1paramsWord: string; //  "params / layer"
  // Node 2 — activate
  n2inputs: string[]; //    example input button labels
  n2inputWord: string; //   "input"
  n2unitsLabel: string; //  "sampled hidden units"
  n2firesFmt: string; //    "{n} of {total} units firing" pieces → we template inline
  n2ofWord: string; //      "of"
  n2firingWord: string; //  "units firing"
  // Node 3 — compress
  n3toggle: string; //      "Residual"
  n3inLabel: string; //     "token in"
  n3editLabel: string; //   "feed-forward edit"
  n3editTag: string; //     "16k → 4k dims"
  n3outOn: string; //       "token out = in + edit"
  n3outOff: string; //      "token out = edit (in lost)"
  n3lostLabel: string; //   "discarded"
  // callout
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;
  // deeper
  deeperTitle: string;
  deeperBody: string;
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

const nodesEN: WsNodeCopy[] = [
  {
    eyebrow: "NODE 01 / 03",
    title: "Widen the vector",
    intro:
      "Attention just mixed information between tokens. Now each token goes solo — and the first thing this little network does is make it much bigger.",
    bullets: [
      "**A token is a vector** — a list of numbers (about 4,096 of them) holding its meaning so far.",
      "**The up-projection widens it** — multiply by a big matrix and 4,096 numbers become ~16,000. More dimensions = more room to compute.",
      "**This is where the weights are.** Roughly two-thirds of an LLM's parameters live in these feed-forward layers, not in attention.",
      "**Each token is processed on its own** — attention already shared context, so this stage just expands one position at a time.",
    ],
    cardLabel: "THE UP-PROJECTION",
    aria: "A narrow token vector expanding through a matrix into a much wider hidden layer.",
    steps: 1,
    captions: ["A token vector fans out into a much wider hidden layer."],
    hint: "Drag the expansion factor — watch the hidden layer and the parameter count grow.",
    readoutTitle: "CAPACITY",
    rows: ["HIDDEN", "PARAMS"],
    optionNotes: [
      "Real models expand about 4×. Wider gives the layer more room to store patterns — and costs more parameters and compute.",
    ],
    sliderNote:
      "The expansion factor is how much wider the hidden layer is than the token vector. Around 4× is standard; more capacity, more weights.",
  },
  {
    eyebrow: "NODE 02 / 03",
    title: "Fire the gate",
    intro:
      "A wide layer of numbers does nothing until you decide which parts matter. An activation acts as a gate — it opens some units and shuts the rest.",
    bullets: [
      "**The gate is a switch per unit** — for each of the thousands of hidden units it decides pass, block, or somewhere in between.",
      "**Modern LLMs use a SwiGLU [gate](https://en.wikipedia.org/wiki/Activation_function):** one copy of the vector carries values, a second copy becomes a gate value that scales it up or down.",
      "**This is what makes the layer nonlinear** — without a gate, two matrix multiplies collapse into one and the model could only draw straight lines.",
      "**Different inputs open different units** — that is the layer choosing which stored patterns to fire.",
    ],
    cardLabel: "WHICH UNITS FIRE",
    aria: "A grid of hidden units; a distinct cluster lights up green for the chosen input.",
    steps: 3,
    captions: [
      "Each cell is one sampled hidden unit; green means it fired for this input.",
      "Switch inputs and a different cluster lights up.",
      "The gate picks which stored patterns respond.",
    ],
    hint: "Switch the input token — a different cluster of units lights up (green = firing).",
    readoutTitle: "GATE",
    rows: ["INPUT", "FIRING"],
    optionNotes: [
      "“Paris” opens a cluster that seems to store geography and place facts. (Illustrative — real units aren't this tidy.)",
      "“def foo()” opens a different set — units that respond to code and syntax light up instead.",
      "“delighted” fires yet another cluster — units tuned to sentiment and tone.",
    ],
  },
  {
    eyebrow: "NODE 03 / 03",
    title: "Compress, then add it back",
    intro:
      "The wide, gated vector gets squeezed back to normal width — then added onto the vector that came in. The block edits the token; it never rewrites it.",
    bullets: [
      "**The down-projection shrinks it back** — ~16,000 numbers collapse to 4,096, the original width.",
      "**What fired writes the answer.** The units that opened contribute their stored values — this is why feed-forward layers behave like memory: keys detect, values write.",
      "**A [residual](https://en.wikipedia.org/wiki/Residual_neural_network) adds it back** — output = input + edit. Turn it off and the token's meaning-so-far is lost.",
      "**Then the next block repeats** — dozens of expand → gate → compress edits stack into the final prediction.",
    ],
    cardLabel: "DOWN-PROJECTION + RESIDUAL",
    aria: "The feed-forward edit added onto the incoming token vector via a residual connection.",
    steps: 1,
    captions: ["The edit is compressed back to width, then added onto the token."],
    hint: "Toggle the residual — off, the edit replaces the token; on, it adds to it.",
    readoutTitle: "RESIDUAL",
    rows: ["OUTPUT"],
    optionNotes: [
      "Residual ON — output = input + edit. The token keeps its meaning-so-far and the layer just adds its contribution.",
      "Residual OFF — output = edit only. The incoming vector is thrown away, and deep stacks like this barely train (the signal fades).",
    ],
    sliderNote: "Residual ON — output = input + edit. The token keeps everything it arrived with, plus this layer's edit.",
  },
];

export const feedForwardEN: FeedForwardLesson = {
  crumb: "STAGE 0 · 2·B · FEED-FORWARD NETWORK",
  eyebrow: "STAGE 0 · 2·B · 3 NODES",
  title: "The feed-forward network",
  lede:
    "Every transformer block is two halves: attention, then a small 2-layer network run on each token. That second half expands the vector, fires a gate, and compresses it back — and it's where most of a model's facts are stored. Play with the width and the gate to see how.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Widen the vector", "Fire the gate", "Compress + add back"],
  nodes: nodesEN,
  n1slider: "EXPANSION FACTOR",
  n1inputLabel: "token vector",
  n1hiddenLabel: "hidden layer",
  n1dimsWord: "dims",
  n1upLabel: "up-projection",
  n1paramsWord: "params / layer",
  n2inputs: ["Paris", "def foo()", "delighted"],
  n2inputWord: "input",
  n2unitsLabel: "sampled hidden units",
  n2firesFmt: "",
  n2ofWord: "of",
  n2firingWord: "units firing",
  n3toggle: "Residual",
  n3inLabel: "token in",
  n3editLabel: "feed-forward edit",
  n3editTag: "16k → 4k dims",
  n3outOn: "token out = in + edit",
  n3outOff: "token out = edit (in lost)",
  n3lostLabel: "discarded",
  calloutLabel: "GOOD TO KNOW · KEY-VALUE MEMORY",
  calloutTitle: "Feed-forward layers store facts",
  calloutBody:
    "Research found these layers act like a key-value memory: rows of the up-projection are keys that detect an input pattern, and columns of the down-projection are the values written back. It's why editing a single fact in a model (methods like ROME/MEMIT) targets these exact weights — the facts really do live here.",
  deeperTitle: "The math, briefly",
  deeperBody:
    "The classic layer is FFN(x) = W_down · GELU(W_up · x). The SwiGLU variant in modern LLMs uses two up-matrices and a gate: FFN(x) = W_down · ( SiLU(W_gate · x) ⊙ (W_up · x) ), where ⊙ is element-wise multiply. The hidden width d_ff is about 4× the model width d_model (SwiGLU shrinks it to ~⅔ of that to keep the parameter count equal). The whole thing sits inside a residual: the block returns x + FFN(x), which is what lets dozens of layers stack without the signal vanishing.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ:
    "Attention and the feed-forward network sit in every block. If attention moves information between tokens, what is the feed-forward network for — and why is that where most of the weights are?",
  explainA:
    "Attention decides what to look at; the feed-forward network decides what to do with it. Each token is expanded into a wide space, a gate fires the units whose stored patterns match, and a down-projection writes their values back onto the token. That store-and-retrieve is why the layer holds most of a model's facts — and why roughly two-thirds of its parameters live here, not in attention. A residual keeps the original meaning while the layer adds its edit, and the next block does it all again.",
  bridgeLabel: "NEXT: SAMPLING STRATEGIES",
  bridgeBody:
    "After the last block, the token vector becomes a list of scores over the whole vocabulary. Next, **sampling** — how the model turns those scores into one actual next word, and why temperature makes it bold or careful.",
  prevLesson: "Back: attention",
  nextLesson: "Continue: Sampling strategies",
};

const nodesES: WsNodeCopy[] = [
  {
    eyebrow: "NODO 01 / 03",
    title: "Ensancha el vector",
    intro:
      "La atención acaba de mezclar información entre tokens. Ahora cada token va por su cuenta — y lo primero que hace esta pequeña red es agrandarlo mucho.",
    bullets: [
      "**Un token es un vector** — una lista de números (unos 4.096) que guarda su significado hasta ahora.",
      "**La proyección de subida lo ensancha** — multiplica por una matriz grande y 4.096 números pasan a ~16.000. Más dimensiones = más espacio para computar.",
      "**Aquí están los pesos.** Cerca de dos tercios de los parámetros de un LLM viven en estas capas feed-forward, no en la atención.",
      "**Cada token se procesa por separado** — la atención ya compartió el contexto, así que esta etapa solo expande una posición a la vez.",
    ],
    cardLabel: "LA PROYECCIÓN DE SUBIDA",
    aria: "Un vector de token estrecho que se expande por una matriz hacia una capa oculta mucho más ancha.",
    steps: 1,
    captions: ["Un vector de token se abre hacia una capa oculta mucho más ancha."],
    hint: "Arrastra el factor de expansión — mira crecer la capa oculta y el número de parámetros.",
    readoutTitle: "CAPACIDAD",
    rows: ["OCULTA", "PARÁMS"],
    optionNotes: [
      "Los modelos reales expanden unas 4×. Más ancho da más espacio para guardar patrones — y cuesta más parámetros y cómputo.",
    ],
    sliderNote:
      "El factor de expansión es cuánto más ancha es la capa oculta que el vector de token. Unas 4× es lo estándar; más capacidad, más pesos.",
  },
  {
    eyebrow: "NODO 02 / 03",
    title: "Activa el portón",
    intro:
      "Una capa ancha de números no hace nada hasta que decides qué partes importan. Una activación actúa como un portón — abre algunas unidades y cierra el resto.",
    bullets: [
      "**El portón es un interruptor por unidad** — para cada una de las miles de unidades ocultas decide pasar, bloquear, o algo intermedio.",
      "**Los LLM modernos usan un [portón](https://es.wikipedia.org/wiki/Funci%C3%B3n_de_activaci%C3%B3n) SwiGLU:** una copia del vector lleva los valores, y una segunda copia se vuelve un valor de portón que lo escala hacia arriba o hacia abajo.",
      "**Esto es lo que hace la capa no lineal** — sin portón, dos multiplicaciones de matrices se colapsan en una y el modelo solo podría trazar líneas rectas.",
      "**Entradas distintas abren unidades distintas** — así elige la capa qué patrones guardados encender.",
    ],
    cardLabel: "QUÉ UNIDADES SE ENCIENDEN",
    aria: "Una cuadrícula de unidades ocultas; un grupo distinto se ilumina en verde para la entrada elegida.",
    steps: 3,
    captions: [
      "Cada celda es una unidad oculta muestreada; verde = se encendió para esta entrada.",
      "Cambia de entrada y se ilumina otro grupo.",
      "El portón elige qué patrones guardados responden.",
    ],
    hint: "Cambia el token de entrada — se ilumina otro grupo de unidades (verde = encendida).",
    readoutTitle: "PORTÓN",
    rows: ["ENTRADA", "ENCENDIDAS"],
    optionNotes: [
      "“Paris” abre un grupo que parece guardar hechos de geografía y lugares. (Ilustrativo — las unidades reales no son tan ordenadas.)",
      "“def foo()” abre otro conjunto — se encienden unidades que responden a código y sintaxis.",
      "“delighted” enciende un grupo más — unidades afinadas al sentimiento y el tono.",
    ],
  },
  {
    eyebrow: "NODO 03 / 03",
    title: "Comprime y súmalo de vuelta",
    intro:
      "El vector ancho y filtrado se comprime de nuevo al ancho normal — y luego se suma sobre el vector que entró. El bloque edita el token; nunca lo reescribe.",
    bullets: [
      "**La proyección de bajada lo encoge** — ~16.000 números se colapsan a 4.096, el ancho original.",
      "**Lo que se encendió escribe la respuesta.** Las unidades que se abrieron aportan sus valores guardados — por eso las capas feed-forward se comportan como memoria: las claves detectan, los valores escriben.",
      "**Una conexión [residual](https://es.wikipedia.org/wiki/Red_neuronal_residual) lo suma** — salida = entrada + edición. Apágala y se pierde el significado que traía el token.",
      "**Luego el siguiente bloque repite** — decenas de ediciones expandir → filtrar → comprimir se apilan hasta la predicción final.",
    ],
    cardLabel: "PROYECCIÓN DE BAJADA + RESIDUAL",
    aria: "La edición feed-forward sumada al vector de token entrante mediante una conexión residual.",
    steps: 1,
    captions: ["La edición se comprime al ancho normal y se suma sobre el token."],
    hint: "Alterna el residual — apagado, la edición reemplaza el token; encendido, se le suma.",
    readoutTitle: "RESIDUAL",
    rows: ["SALIDA"],
    optionNotes: [
      "Residual ENCENDIDO — salida = entrada + edición. El token conserva su significado hasta ahora y la capa solo suma su aporte.",
      "Residual APAGADO — salida = solo la edición. El vector entrante se descarta, y pilas profundas como esta apenas se entrenan (la señal se desvanece).",
    ],
    sliderNote: "Residual ENCENDIDO — salida = entrada + edición. El token conserva todo lo que traía, más la edición de esta capa.",
  },
];

export const feedForwardES: FeedForwardLesson = {
  crumb: "ETAPA 0 · 2·B · RED FEED-FORWARD",
  eyebrow: "ETAPA 0 · 2·B · 3 NODOS",
  title: "La red feed-forward",
  lede:
    "Cada bloque transformer son dos mitades: atención, y luego una pequeña red de 2 capas que corre sobre cada token. Esa segunda mitad expande el vector, activa un portón y lo comprime de nuevo — y es donde se guardan casi todos los hechos de un modelo. Juega con el ancho y el portón para verlo.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Ensancha el vector", "Activa el portón", "Comprime + suma"],
  nodes: nodesES,
  n1slider: "FACTOR DE EXPANSIÓN",
  n1inputLabel: "vector de token",
  n1hiddenLabel: "capa oculta",
  n1dimsWord: "dims",
  n1upLabel: "proyección de subida",
  n1paramsWord: "paráms / capa",
  n2inputs: ["Paris", "def foo()", "delighted"],
  n2inputWord: "entrada",
  n2unitsLabel: "unidades ocultas muestreadas",
  n2firesFmt: "",
  n2ofWord: "de",
  n2firingWord: "unidades encendidas",
  n3toggle: "Residual",
  n3inLabel: "token entra",
  n3editLabel: "edición feed-forward",
  n3editTag: "16k → 4k dims",
  n3outOn: "token sale = entra + edición",
  n3outOff: "token sale = edición (se pierde la entrada)",
  n3lostLabel: "descartado",
  calloutLabel: "PARA SABER · MEMORIA CLAVE-VALOR",
  calloutTitle: "Las capas feed-forward guardan hechos",
  calloutBody:
    "La investigación halló que estas capas actúan como una memoria clave-valor: las filas de la proyección de subida son claves que detectan un patrón de entrada, y las columnas de la proyección de bajada son los valores que se escriben de vuelta. Por eso editar un solo hecho en un modelo (métodos como ROME/MEMIT) apunta justo a estos pesos — los hechos de verdad viven aquí.",
  deeperTitle: "La matemática, en breve",
  deeperBody:
    "La capa clásica es FFN(x) = W_down · GELU(W_up · x). La variante SwiGLU de los LLM modernos usa dos matrices de subida y un portón: FFN(x) = W_down · ( SiLU(W_gate · x) ⊙ (W_up · x) ), donde ⊙ es la multiplicación elemento a elemento. El ancho oculto d_ff es unas 4× el ancho del modelo d_model (SwiGLU lo reduce a ~⅔ de eso para mantener igual el conteo de parámetros). Todo va dentro de un residual: el bloque devuelve x + FFN(x), lo que permite apilar decenas de capas sin que la señal se desvanezca.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ:
    "La atención y la red feed-forward están en cada bloque. Si la atención mueve información entre tokens, ¿para qué sirve la red feed-forward — y por qué ahí está la mayoría de los pesos?",
  explainA:
    "La atención decide qué mirar; la red feed-forward decide qué hacer con ello. Cada token se expande a un espacio ancho, un portón enciende las unidades cuyos patrones guardados coinciden, y una proyección de bajada escribe sus valores de vuelta sobre el token. Ese guardar-y-recuperar es por qué la capa tiene la mayoría de los hechos de un modelo — y por qué cerca de dos tercios de sus parámetros viven aquí, no en la atención. Un residual conserva el significado original mientras la capa suma su edición, y el siguiente bloque lo hace todo de nuevo.",
  bridgeLabel: "SIGUIENTE: ESTRATEGIAS DE MUESTREO",
  bridgeBody:
    "Tras el último bloque, el vector del token se vuelve una lista de puntajes sobre todo el vocabulario. Sigue el **muestreo** — cómo el modelo convierte esos puntajes en una palabra siguiente real, y por qué la temperatura lo vuelve atrevido o cauto.",
  prevLesson: "Volver: atención",
  nextLesson: "Continuar: Estrategias de muestreo",
};
