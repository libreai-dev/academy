/**
 * Stage 0 · How models learn. Interface + EN/ES copy for the article, isolated
 * from every other lesson so edits here never touch theirs. All user-facing
 * text for the lesson lives in this module (both languages, full parity).
 */
import type { WsNodeCopy } from "./shared";

export interface HowModelsLearnLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — guess → loss
  n1context: string; //     the sentence with a blank
  n1candidates: string[]; // candidate next words, index-aligned to N1_PROBS
  n1axisLabel: string; //   y-axis: the model's guess
  n1trueTag: string; //     tag over the chosen bar
  n1lossTag: string; //     what the big number means
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 2 — nudge the weights
  n2stepLabel: string;
  n2resetLabel: string;
  n2rateLabel: string;
  n2rateNotes: string[]; // [too small, good, too big]
  n2xLabel: string; //     x-axis: one weight
  n2lossLabel: string; //  y-axis: loss
  n2minTag: string; //     tag at the valley bottom
  n2youTag: string; //     tag on the ball
  n2stepsWord: string; //  "steps" count label
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 — repeat at scale
  n3slider: string;
  n3xLabel: string; //     x-axis: text seen
  n3lossLabel: string; //  y-axis: loss
  n3tokensWord: string; // "tokens seen"
  n3nowTag: string; //     tag on the moving point
  n3earlyNote: string;
  n3lateNote: string;

  // callout
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const howModelsLearnEN: HowModelsLearnLesson = {
  crumb: "STAGE 0 · HOW MODELS LEARN",
  eyebrow: "STAGE 0 · HOW MODELS LEARN · 3 NODES",
  title: "How models learn",
  lede: "Training sounds mysterious, but it's one tiny loop run at absurd scale: guess the next token, measure how wrong the guess was, nudge the weights to be a little less wrong. Play with each part of the loop below.",
  pipelineLabel: "THE LOOP",
  pipeline: ["Guess → loss", "Nudge the weights", "Repeat at scale"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Guess the next token, measure the miss",
      intro:
        "A language model never really 'knows' the next word — it hands every candidate a probability. Training compares that guess to the token that actually came next. (A token is a word or word-piece.)",
      bullets: [
        "**The model outputs a probability for every possible next token** — below are its guesses for `The cat sat on the ___`.",
        "**Loss is just surprise.** Take the probability it gave the *real* next word and compute `-log(p)`: low if it was confident and right, high if it got blindsided.",
        "**That one number is the whole training signal** — called *cross-entropy*, a single score for how wrong each guess was.",
        "**Confident and right → near-zero loss. Confident and wrong → huge loss.**",
      ],
      cardLabel: "NEXT-TOKEN GUESS · PICK THE REAL WORD",
      aria: "A bar chart of the model's probability for each candidate next word, with the chosen real word highlighted and its loss shown.",
      steps: 5,
      captions: [
        "The model's guesses for the blank, tallest first.",
        "Pick a rarer real word and the surprise — the loss — climbs.",
        "Middling guess, middling loss.",
        "The model didn't expect this: a big loss.",
        "Almost impossible to the model: a huge loss.",
      ],
      hint: "Pick the real next word — the rarer your pick, the more 'surprised' the model is, and the higher the loss.",
      readoutTitle: "LOSS",
      rows: ["PROB", "LOSS"],
      optionNotes: [
        "The model basically expected this. Almost no surprise, so the loss is tiny.",
        "A fair guess. A little surprise, so a small loss.",
        "The model only half-expected it. Middling surprise, middling loss.",
        "The model didn't see this coming. Big surprise, big loss.",
        "The model thought this was nearly impossible. Huge surprise, huge loss.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Nudge the weights downhill",
      intro:
        "One number told us how wrong the guess was. Now we change the model to be a little less wrong — by rolling its weights downhill on the loss.",
      bullets: [
        "**Picture the loss as a valley** and one weight as your left-right position. Lower is better.",
        "**The gradient is just the slope** under your feet. It points uphill, so you step the opposite way.",
        "**Each step: `weight ← weight − rate × slope`.** The *learning rate* is how big a step you take.",
        "**Too small and you crawl; too big and you overshoot the valley** and bounce out.",
      ],
      cardLabel: "GRADIENT DESCENT · ONE WEIGHT",
      aria: "A loss valley over one weight with a ball that steps downhill toward the lowest point.",
      steps: 1,
      captions: ["One weight, one valley — step downhill toward the lowest loss."],
      hint: "Press step to roll downhill. Nudge the learning rate — too big and the ball leaps past the bottom.",
      readoutTitle: "DESCENT",
      rows: ["LOSS", "STEPS"],
      optionNotes: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Repeat a few billion times",
      intro:
        "One guess barely moves the model. Do it across trillions of tokens and the loss slides down a long, curved hill — fast at first, then a slow crawl.",
      bullets: [
        "**Every step is the same loop:** guess a token, measure the loss, nudge the weights.",
        "**Loss falls fast early, then slowly.** The easy patterns — spelling, grammar — are learned first; the subtle ones take far more text.",
        "**More text seen → lower loss.** This steady curve is why runs last weeks over trillions of tokens.",
        "**It never reaches zero** — language is genuinely unpredictable, so some surprise always remains.",
      ],
      cardLabel: "TRAINING LOSS · OVER THE WHOLE RUN",
      aria: "A training loss curve falling as the model reads more text, steep at first then flattening.",
      steps: 1,
      captions: ["Loss over the whole run — drag to see it fall as more text is read."],
      hint: "Drag to train — watch the loss fall as the model reads more text.",
      readoutTitle: "TRAINING",
      rows: ["LOSS", "TOKENS"],
      optionNotes: [],
    },
  ],

  n1context: "The cat sat on the ___",
  n1candidates: ["mat", "bed", "chair", "table", "moon"],
  n1axisLabel: "the model's guess (probability)",
  n1trueTag: "real next token",
  n1lossTag: "loss = surprise = −log(p)",
  n1deeperTitle: "The math: cross-entropy",
  n1deeperBody:
    "For one prediction, loss = `-log p(real token)`. Over a batch you average it. A brand-new model spreads probability evenly across its whole vocabulary, so `p ≈ 1/vocab` and loss `≈ log(vocab)` — about 10.8 for a 50,000-token vocabulary. Training's whole job is to push that number down.",

  n2stepLabel: "Take a step",
  n2resetLabel: "Reset",
  n2rateLabel: "LEARNING RATE",
  n2rateNotes: [
    "Tiny steps: safe, but it will take forever to reach the bottom.",
    "A good rate: each step moves smoothly toward the lowest loss.",
    "Too big: the step overshoots the valley — it bounces and struggles to settle. Push the rate to the very top and the loss truly diverges.",
  ],
  n2xLabel: "one weight →",
  n2lossLabel: "loss",
  n2minTag: "lowest loss",
  n2youTag: "you",
  n2stepsWord: "steps",
  n2deeperTitle: "The math: gradient descent",
  n2deeperBody:
    "The slope is the derivative `dL/dw`. The update is `w ← w − η·dL/dw`, where `η` (eta) is the learning rate. A real model does this for *billions* of weights at once — one slope per weight, all computed together by backpropagation.",

  n3slider: "TEXT SEEN",
  n3xLabel: "text seen →",
  n3lossLabel: "loss",
  n3tokensWord: "tokens seen",
  n3nowTag: "now",
  n3earlyNote:
    "Early on, the model is grabbing the easy wins — letters, common words — so the loss drops steeply.",
  n3lateNote:
    "Later the curve flattens: it's chasing subtle patterns now, and each bit of progress costs far more text.",

  calloutLabel: "GOOD TO KNOW · THE STARTING LOSS",
  calloutTitle: "A fresh model is just a coin-flip",
  calloutBody:
    "Before training, every weight is random, so the model spreads its bet evenly over the whole vocabulary — the loss sits near log(vocab), about 10.8. It hasn't learned that `the` is common or that `qx` never appears. Every point the curve drops is a pattern squeezed out of prediction errors, never a rule written by hand.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "In one sentence, what is 'training' a language model?",
  explainA:
    "It's a loop. The model **guesses** the next token as a probability; **loss** measures how surprised it was by the real token (`-log p`); then every weight is **nudged** a tiny step downhill to make that guess a little less wrong. Repeat across trillions of tokens and the loss slides down — fast at first, then slowly — until the model has quietly absorbed the patterns of language. No rule was written by hand; the whole skill is squeezed out of prediction errors.",
  bridgeLabel: "NEXT: BASE vs ASSISTANT",
  bridgeBody:
    "This loop gives you a **base model** — a raw next-token predictor that will happily continue any text. Next: how that raw predictor is turned into a helpful **assistant** that answers you instead of just autocompleting.",
  prevLesson: "Autoregressive loop",
  nextLesson: "Continue to base vs assistant",
};

export const howModelsLearnES: HowModelsLearnLesson = {
  crumb: "ETAPA 0 · CÓMO APRENDEN LOS MODELOS",
  eyebrow: "ETAPA 0 · CÓMO APRENDEN LOS MODELOS · 3 NODOS",
  title: "Cómo aprenden los modelos",
  lede: "Entrenar suena a magia, pero es un bucle diminuto ejecutado a una escala absurda: adivina el siguiente token, mide cuánto se equivocó, ajusta los pesos para equivocarse un poco menos. Juega con cada parte del bucle abajo.",
  pipelineLabel: "EL BUCLE",
  pipeline: ["Adivinar → pérdida", "Ajustar los pesos", "Repetir a escala"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Adivina el siguiente token, mide el fallo",
      intro:
        "Un modelo de lenguaje nunca 'sabe' la siguiente palabra — le da a cada candidata una probabilidad. Entrenar compara esa apuesta con el token que de verdad vino después. (Un token es una palabra o un trozo de palabra.)",
      bullets: [
        "**El modelo da una probabilidad a cada posible siguiente token** — abajo, sus apuestas para `El gato se sentó en la ___`.",
        "**La pérdida es solo sorpresa.** Toma la probabilidad que le dio a la palabra *real* y calcula `-log(p)`: baja si estaba seguro y acertó, alta si lo pilló por sorpresa.",
        "**Ese único número es toda la señal de entrenamiento** — se llama *entropía cruzada*, una sola nota de cuán mal estuvo cada apuesta.",
        "**Seguro y acertado → pérdida casi cero. Seguro y equivocado → pérdida enorme.**",
      ],
      cardLabel: "APUESTA DEL SIGUIENTE TOKEN · ELIGE LA PALABRA REAL",
      aria: "Un gráfico de barras con la probabilidad del modelo para cada palabra candidata, con la palabra real elegida resaltada y su pérdida.",
      steps: 5,
      captions: [
        "Las apuestas del modelo para el hueco, de mayor a menor.",
        "Elige una palabra real más rara y la sorpresa — la pérdida — sube.",
        "Apuesta media, pérdida media.",
        "El modelo no esperaba esto: una pérdida grande.",
        "Casi imposible para el modelo: una pérdida enorme.",
      ],
      hint: "Elige la siguiente palabra real — cuanto más rara sea tu elección, más 'sorprendido' está el modelo y mayor es la pérdida.",
      readoutTitle: "LOSS",
      rows: ["PROB", "LOSS"],
      optionNotes: [
        "El modelo básicamente esperaba esto. Casi ninguna sorpresa, así que la pérdida es diminuta.",
        "Una apuesta razonable. Un poco de sorpresa, así que una pérdida pequeña.",
        "El modelo solo lo esperaba a medias. Sorpresa media, pérdida media.",
        "El modelo no lo vio venir. Gran sorpresa, gran pérdida.",
        "El modelo pensaba que era casi imposible. Sorpresa enorme, pérdida enorme.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Ajusta los pesos cuesta abajo",
      intro:
        "Un número nos dijo cuánto se equivocó la apuesta. Ahora cambiamos el modelo para equivocarse un poco menos — haciendo rodar sus pesos cuesta abajo sobre la pérdida.",
      bullets: [
        "**Imagina la pérdida como un valle** y un peso como tu posición izquierda-derecha. Más abajo es mejor.",
        "**El gradiente es solo la pendiente** bajo tus pies. Apunta cuesta arriba, así que das el paso al revés.",
        "**Cada paso: `peso ← peso − tasa × pendiente`.** La *tasa de aprendizaje* es cuán grande es el paso.",
        "**Demasiado pequeña y te arrastras; demasiado grande y te pasas del valle** y sales rebotando.",
      ],
      cardLabel: "DESCENSO POR GRADIENTE · UN PESO",
      aria: "Un valle de pérdida sobre un peso con una bola que baja a pasos hacia el punto más bajo.",
      steps: 1,
      captions: ["Un peso, un valle — baja a pasos hacia la pérdida más baja."],
      hint: "Pulsa paso para rodar cuesta abajo. Mueve la tasa de aprendizaje — muy grande y la bola salta más allá del fondo.",
      readoutTitle: "DESCENT",
      rows: ["LOSS", "STEPS"],
      optionNotes: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Repite unos cuantos miles de millones de veces",
      intro:
        "Una apuesta apenas mueve el modelo. Hazlo sobre billones de tokens y la pérdida se desliza por una larga colina curva — rápido al principio, luego un lento arrastre.",
      bullets: [
        "**Cada paso es el mismo bucle:** adivina un token, mide la pérdida, ajusta los pesos.",
        "**La pérdida cae rápido al principio, luego despacio.** Los patrones fáciles — ortografía, gramática — se aprenden primero; los sutiles piden mucho más texto.",
        "**Más texto visto → menor pérdida.** Esta curva constante es por qué los entrenamientos duran semanas sobre billones de tokens.",
        "**Nunca llega a cero** — el lenguaje es de verdad impredecible, así que siempre queda algo de sorpresa.",
      ],
      cardLabel: "PÉRDIDA DE ENTRENAMIENTO · TODO EL RECORRIDO",
      aria: "Una curva de pérdida de entrenamiento que cae al leer más texto, empinada al inicio y luego aplanándose.",
      steps: 1,
      captions: ["Pérdida a lo largo del recorrido — arrastra para verla caer con más texto."],
      hint: "Arrastra para entrenar — mira caer la pérdida a medida que el modelo lee más texto.",
      readoutTitle: "TRAINING",
      rows: ["LOSS", "TOKENS"],
      optionNotes: [],
    },
  ],

  n1context: "El gato se sentó en la ___",
  n1candidates: ["alfombra", "cama", "silla", "mesa", "luna"],
  n1axisLabel: "la apuesta del modelo (probabilidad)",
  n1trueTag: "siguiente token real",
  n1lossTag: "pérdida = sorpresa = −log(p)",
  n1deeperTitle: "La matemática: entropía cruzada",
  n1deeperBody:
    "Para una predicción, la pérdida = `-log p(token real)`. Sobre un lote se promedia. Un modelo recién nacido reparte la probabilidad por igual en todo su vocabulario, así que `p ≈ 1/vocab` y la pérdida `≈ log(vocab)` — unos 10.8 para un vocabulario de 50 000 tokens. Toda la tarea del entrenamiento es empujar ese número hacia abajo.",

  n2stepLabel: "Dar un paso",
  n2resetLabel: "Reiniciar",
  n2rateLabel: "TASA DE APRENDIZAJE",
  n2rateNotes: [
    "Pasos diminutos: seguros, pero tardará una eternidad en llegar al fondo.",
    "Una buena tasa: cada paso avanza con suavidad hacia la pérdida más baja.",
    "Demasiado grande: el paso se pasa del valle — rebota y le cuesta asentarse. Sube la tasa al tope y la pérdida de verdad se dispara.",
  ],
  n2xLabel: "un peso →",
  n2lossLabel: "pérdida",
  n2minTag: "pérdida más baja",
  n2youTag: "tú",
  n2stepsWord: "pasos",
  n2deeperTitle: "La matemática: descenso por gradiente",
  n2deeperBody:
    "La pendiente es la derivada `dL/dw`. La actualización es `w ← w − η·dL/dw`, donde `η` (eta) es la tasa de aprendizaje. Un modelo real hace esto para *miles de millones* de pesos a la vez — una pendiente por peso, todas calculadas juntas por retropropagación.",

  n3slider: "TEXTO VISTO",
  n3xLabel: "texto visto →",
  n3lossLabel: "pérdida",
  n3tokensWord: "tokens vistos",
  n3nowTag: "ahora",
  n3earlyNote:
    "Al principio, el modelo agarra las victorias fáciles — letras, palabras comunes — así que la pérdida cae en picado.",
  n3lateNote:
    "Después la curva se aplana: ahora persigue patrones sutiles, y cada avance cuesta mucho más texto.",

  calloutLabel: "PARA SABER · LA PÉRDIDA INICIAL",
  calloutTitle: "Un modelo recién nacido es puro azar",
  calloutBody:
    "Antes de entrenar, cada peso es aleatorio, así que el modelo reparte su apuesta por igual en todo el vocabulario — la pérdida ronda log(vocab), unos 10.8. Aún no ha aprendido que `el` es común ni que `qx` nunca aparece. Cada punto que baja la curva es un patrón exprimido de los errores de predicción, nunca una regla escrita a mano.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "En una frase, ¿qué es 'entrenar' un modelo de lenguaje?",
  explainA:
    "Es un bucle. El modelo **adivina** el siguiente token como una probabilidad; la **pérdida** mide cuánto lo sorprendió el token real (`-log p`); luego cada peso se **ajusta** un paso diminuto cuesta abajo para que esa apuesta se equivoque un poco menos. Repite sobre billones de tokens y la pérdida se desliza hacia abajo — rápido al principio, luego despacio — hasta que el modelo ha absorbido en silencio los patrones del lenguaje. Ninguna regla se escribió a mano; toda la habilidad se exprime de los errores de predicción.",
  bridgeLabel: "SIGUIENTE: BASE vs ASISTENTE",
  bridgeBody:
    "Este bucle te da un **modelo base** — un predictor de tokens en crudo que continuará con gusto cualquier texto. Luego: cómo ese predictor en crudo se convierte en un **asistente** útil que te responde en vez de solo autocompletar.",
  prevLesson: "Bucle autoregresivo",
  nextLesson: "Continuar a base vs asistente",
};
