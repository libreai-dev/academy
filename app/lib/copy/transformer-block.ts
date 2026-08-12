/**
 * Stage 0 · Reference 2 — The transformer block. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * ONE idea: a block lets every token look at the others (attention), then think
 * per-token (a small network), with a shortcut that keeps the signal — and
 * stacking these blocks is how the model predicts the next token. This is the
 * plain "what a block does" overview; RoPE / FlashAttention / MoE are later.
 */
import type { WsNodeCopy } from "./shared";

export interface TransformerBlockLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 · attention
  n1tokens: string[];
  n1queryLabel: string;
  /** Note template; {q} = the clicked word, {k} = the word it looks at most. */
  n1noteTemplate: string;
  n1lookLabel: string; // small "looking" tag over the clicked chip
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 2 · the parts of a block
  n2parts: string[];
  n2inLabel: string;
  n2outLabel: string;
  n2mixLabel: string;
  n2thinkLabel: string;
  n2shortcutLabel: string;
  n2addLabel: string;

  // Node 3 · stack → next token
  n3depthLabel: string;
  n3candidates: string[];
  /** Note template; {n} = block count, {word} = top guess, {p} = its percent. */
  n3noteTemplate: string;
  n3towerLabel: string; // "× N blocks" caption beside the tower
  n3inLabel: string;
  n3predictLabel: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLabel: string;
  nextLesson: string;
}

export const transformerBlockEN: TransformerBlockLesson = {
  crumb: "STAGE 0 · REFERENCE 2 · THE TRANSFORMER BLOCK",
  eyebrow: "STAGE 0 · REFERENCE 2 · 3 NODES",
  title: "The transformer block",
  lede: "A transformer is the same small block stacked over and over. One block lets every token look at the others, then think on its own — and a shortcut keeps the signal clean. Play with the three parts, then stack them into a next-word guess.",
  pipelineLabel: "THE 3 IDEAS",
  pipeline: ["Attention, in plain words", "The parts of a block", "Stack them → next token"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Attention, in plain words",
      intro: "A word's meaning depends on the words around it. Attention lets every token look back at the others and pull in what it needs.",
      bullets: [
        "**A token is a word-chunk** the model works with — here, whole words. Each one starts out knowing only itself.",
        "**Attention is a weighted look.** Click a word and the links show which earlier words it pays attention to — a thicker link means more.",
        "**This is how *it* finds its meaning.** Click *it* — most of its attention lands on *cat*, so the model knows what *it* refers to.",
        "**Every token looks at once, in parallel** — not left-to-right, one word at a time. That parallel look is what made transformers fast to train.",
      ],
      cardLabel: "ATTENTION — WHO LOOKS AT WHOM",
      aria: "A row of words with links from the clicked word down to the earlier words it attends to.",
      steps: 1,
      captions: ["Each word looks back at the earlier words and pulls in the meaning it needs."],
      hint: "Click a word to see what it looks at — try *it*.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The parts of a block",
      intro: "A transformer block is two small steps with a safety rope. Look around, think, keep a copy — the same three parts, over and over.",
      bullets: [
        "**1 · Attention (mix).** Each token looks around and blends in meaning from the others — the step you just played with. It's the only part where tokens talk to each other.",
        "**2 · Mini-network (think).** A tiny network then reshapes each token on its own — the same recipe applied at every position, no looking around.",
        "**3 · Residual (shortcut).** A bypass adds each token's earlier value back after each step, so nothing important gets lost.",
        "**That's the whole block.** No other moving parts here — just mix, think, and keep a copy.",
      ],
      cardLabel: "ONE BLOCK — THREE PARTS",
      aria: "A schematic of one transformer block: attention, a per-token network, and residual shortcuts.",
      steps: 3,
      captions: [
        "Mix: attention blends meaning in from the other tokens.",
        "Think: a small network reshapes each token on its own.",
        "Shortcut: the earlier value is added back, so nothing is lost.",
      ],
      hint: "Step through the three parts — watch which piece lights up.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Mix — the token gathers meaning from the other tokens (attention). The only step where positions share information.",
        "Think — a small per-token network reshapes each token by itself. Same weights at every position; no looking around.",
        "Shortcut — the input is added back after each step (a residual). It keeps the signal strong through a deep stack of blocks.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Stack them → next token",
      intro: "One block looks and thinks once. Stack many and the guess sharpens layer by layer — then the last position predicts the next token.",
      bullets: [
        "**Blocks stack in a tower.** The output of one block is the input to the next — dozens deep in a real model.",
        "**Each block is another look-and-think pass.** Meaning gets sharper as the tokens rise through the stack.",
        "**The top predicts the next token.** The final token's numbers become a score over the whole vocabulary — the model's guess.",
        "**More blocks, sharper guess.** Slide the depth up and watch the top candidate pull ahead of the pack.",
      ],
      cardLabel: "STACK OF BLOCKS → NEXT TOKEN",
      aria: "A tower of transformer blocks feeding a bar chart of next-word probabilities.",
      steps: 1,
      captions: ["Tokens rise through the stack of blocks; the top block predicts the next word."],
      hint: "Drag the depth — the more blocks, the more the model commits to one word.",
      readoutTitle: "",
      rows: [],
    },
  ],
  n1tokens: ["The", "cat", "drank", "the", "milk", "because", "it", "was", "full"],
  n1queryLabel: "WHO IS LOOKING?",
  n1noteTemplate: "**{q}** looks most at **{k}** — that link is how attention carries meaning between words.",
  n1lookLabel: "looking",
  n1deeperTitle: "Go deeper — where the weights come from",
  n1deeperBody:
    "The link strengths here are illustrative. In a real model each token makes a query and every other token a key; their match scores go through a softmax (so the weights are positive and sum to 1), and those weights blend the tokens' values. A block runs many of these attention patterns — heads — at once, each learning a different job.",
  n2parts: ["Mix · attention", "Think · mini-net", "Shortcut · residual"],
  n2inLabel: "tokens in",
  n2outLabel: "tokens out",
  n2mixLabel: "ATTENTION",
  n2thinkLabel: "MINI-NETWORK",
  n2shortcutLabel: "shortcut",
  n2addLabel: "add",
  n3depthLabel: "BLOCKS (DEPTH)",
  n3candidates: ["full", "hungry", "asleep", "happy", "gone"],
  n3noteTemplate: "**{n} blocks** → the top guess is **{word}** at **{p}%**. More blocks, more commitment.",
  n3towerLabel: "blocks",
  n3inLabel: "tokens",
  n3predictLabel: "NEXT-TOKEN GUESS",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Inside one transformer block, what do the two main steps do — and why the shortcut?",
  explainA:
    "**Attention** lets every token look at the others and mix in the meaning it needs — the only step where tokens share information. The **mini-network** then reshapes each token on its own, the same way at every position. The **residual shortcut** adds each token's earlier value back after both steps, so the signal survives a deep stack. Repeat the block dozens of times and the last token's numbers become the model's next-token guess.",
  bridgeLabel: "NEXT: CHOOSING THE NEXT TOKEN",
  bridgeBody:
    "The top block hands you a score for every possible next token. Next, **choosing the next token**: how those raw scores become one actual word — greedy picks, temperature, and sampling.",
  prevLabel: "Back to embeddings",
  nextLesson: "Continue: choosing the next token",
};

export const transformerBlockES: TransformerBlockLesson = {
  crumb: "ETAPA 0 · REFERENCIA 2 · EL BLOQUE TRANSFORMER",
  eyebrow: "ETAPA 0 · REFERENCIA 2 · 3 NODOS",
  title: "El bloque transformer",
  lede: "Un transformer es el mismo bloque pequeño apilado una y otra vez. Un bloque deja que cada token mire a los demás y luego piense por su cuenta — y un atajo mantiene la señal limpia. Juega con las tres partes y luego apílalas hasta una predicción de la siguiente palabra.",
  pipelineLabel: "LAS 3 IDEAS",
  pipeline: ["La atención, en simple", "Las partes de un bloque", "Apílalos → siguiente token"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "La atención, en simple",
      intro: "El significado de una palabra depende de las de alrededor. La atención deja que cada token mire hacia atrás a los demás y tome lo que necesita.",
      bullets: [
        "**Un token es un trozo de palabra** con el que trabaja el modelo — aquí, palabras enteras. Cada uno arranca sabiendo solo de sí mismo.",
        "**La atención es una mirada ponderada.** Haz clic en una palabra y los enlaces muestran a qué palabras anteriores presta atención — un enlace más grueso significa más.",
        "**Así encuentra *él* su significado.** Haz clic en *él* — casi toda su atención cae en *gato*, así que el modelo sabe a qué se refiere *él*.",
        "**Cada token mira a la vez, en paralelo** — no de izquierda a derecha, palabra por palabra. Esa mirada paralela es lo que hizo rápidos de entrenar a los transformers.",
      ],
      cardLabel: "ATENCIÓN — QUIÉN MIRA A QUIÉN",
      aria: "Una fila de palabras con enlaces desde la palabra pulsada hacia las palabras anteriores que atiende.",
      steps: 1,
      captions: ["Cada palabra mira hacia atrás a las anteriores y toma el significado que necesita."],
      hint: "Haz clic en una palabra para ver a qué mira — prueba *él*.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Las partes de un bloque",
      intro: "Un bloque transformer son dos pasos pequeños con una cuerda de seguridad. Mirar alrededor, pensar, guardar una copia — las mismas tres partes, una y otra vez.",
      bullets: [
        "**1 · Atención (mezclar).** Cada token mira alrededor y mezcla significado de los demás — el paso con el que acabas de jugar. Es la única parte donde los tokens se hablan entre sí.",
        "**2 · Mini-red (pensar).** Luego una red diminuta reforma cada token por su cuenta — la misma receta aplicada en cada posición, sin mirar alrededor.",
        "**3 · Residual (atajo).** Un desvío vuelve a sumar el valor previo de cada token tras cada paso, para que no se pierda nada importante.",
        "**Ese es el bloque entero.** No hay más piezas móviles aquí — solo mezclar, pensar y guardar una copia.",
      ],
      cardLabel: "UN BLOQUE — TRES PARTES",
      aria: "Un esquema de un bloque transformer: atención, una red por token y atajos residuales.",
      steps: 3,
      captions: [
        "Mezclar: la atención integra significado de los otros tokens.",
        "Pensar: una red pequeña reforma cada token por su cuenta.",
        "Atajo: se vuelve a sumar el valor previo, para que no se pierda nada.",
      ],
      hint: "Recorre las tres partes — mira qué pieza se enciende.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Mezclar — el token reúne significado de los otros tokens (atención). El único paso donde las posiciones comparten información.",
        "Pensar — una pequeña red por token reforma cada token por sí solo. Los mismos pesos en cada posición; sin mirar alrededor.",
        "Atajo — la entrada se vuelve a sumar tras cada paso (un residual). Mantiene fuerte la señal a través de una pila profunda de bloques.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Apílalos → siguiente token",
      intro: "Un bloque mira y piensa una vez. Apila muchos y la predicción se afina capa a capa — luego la última posición predice el siguiente token.",
      bullets: [
        "**Los bloques se apilan en una torre.** La salida de un bloque es la entrada del siguiente — decenas de profundidad en un modelo real.",
        "**Cada bloque es otra pasada de mirar-y-pensar.** El significado se afina mientras los tokens suben por la pila.",
        "**La cima predice el siguiente token.** Los números del último token se vuelven una puntuación sobre todo el vocabulario — la predicción del modelo.",
        "**Más bloques, predicción más nítida.** Sube la profundidad y mira cómo el candidato líder se despega del resto.",
      ],
      cardLabel: "PILA DE BLOQUES → SIGUIENTE TOKEN",
      aria: "Una torre de bloques transformer que alimenta un gráfico de barras de probabilidades de la siguiente palabra.",
      steps: 1,
      captions: ["Los tokens suben por la pila de bloques; el bloque de arriba predice la siguiente palabra."],
      hint: "Arrastra la profundidad — cuantos más bloques, más se compromete el modelo con una palabra.",
      readoutTitle: "",
      rows: [],
    },
  ],
  n1tokens: ["El", "gato", "bebió", "la", "leche", "porque", "él", "estaba", "lleno"],
  n1queryLabel: "¿QUIÉN MIRA?",
  n1noteTemplate: "**{q}** mira sobre todo a **{k}** — ese enlace es cómo la atención lleva significado entre palabras.",
  n1lookLabel: "mira",
  n1deeperTitle: "Para profundizar — de dónde salen los pesos",
  n1deeperBody:
    "Las fuerzas de los enlaces aquí son ilustrativas. En un modelo real cada token hace una consulta (query) y cada otro token una clave (key); sus puntajes de coincidencia pasan por un softmax (así los pesos son positivos y suman 1), y esos pesos mezclan los valores de los tokens. Un bloque corre muchos de estos patrones de atención — cabezas — a la vez, cada uno aprendiendo un trabajo distinto.",
  n2parts: ["Mezclar · atención", "Pensar · mini-red", "Atajo · residual"],
  n2inLabel: "tokens entran",
  n2outLabel: "tokens salen",
  n2mixLabel: "ATENCIÓN",
  n2thinkLabel: "MINI-RED",
  n2shortcutLabel: "atajo",
  n2addLabel: "sumar",
  n3depthLabel: "BLOQUES (PROFUNDIDAD)",
  n3candidates: ["lleno", "hambriento", "dormido", "feliz", "ido"],
  n3noteTemplate: "**{n} bloques** → la mejor predicción es **{word}** con **{p}%**. Más bloques, más compromiso.",
  n3towerLabel: "bloques",
  n3inLabel: "tokens",
  n3predictLabel: "PREDICCIÓN DEL SIGUIENTE TOKEN",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Dentro de un bloque transformer, ¿qué hacen los dos pasos principales — y para qué el atajo?",
  explainA:
    "La **atención** deja que cada token mire a los demás y mezcle el significado que necesita — el único paso donde los tokens comparten información. La **mini-red** luego reforma cada token por su cuenta, igual en cada posición. El **atajo residual** vuelve a sumar el valor previo de cada token tras ambos pasos, para que la señal sobreviva una pila profunda. Repite el bloque decenas de veces y los números del último token se vuelven la predicción del siguiente token.",
  bridgeLabel: "SIGUIENTE: ELEGIR EL SIGUIENTE TOKEN",
  bridgeBody:
    "El bloque de arriba te entrega una puntuación para cada posible siguiente token. Sigue **elegir el siguiente token**: cómo esas puntuaciones crudas se vuelven una palabra concreta — elección voraz, temperatura y muestreo.",
  prevLabel: "Volver a embeddings",
  nextLesson: "Continuar: elegir el siguiente token",
};
