/**
 * Stage 0 · Phase 0 — The autoregressive loop. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * ONE idea: the chosen token is appended to the text and fed back in; the model
 * predicts again; repeat until a special end token — that loop writes the whole
 * sentence.
 */
import type { WsNodeCopy } from "./shared";

/** One token in the demo sentence / prompt (piece text + illustrative id). */
export interface LoopToken {
  piece: string;
  id: number;
  /** The end-of-sequence token that stops the loop. */
  eos?: boolean;
}

export interface AutoregressiveLoopLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  /** The sentence the model writes, token by token (last token is EOS). */
  seqTokens: LoopToken[];
  /** The prompt the model reads all at once (node 3). */
  promptTokens: LoopToken[];

  // node 1 — the loop
  n1play: string;
  n1pause: string;
  n1step: string;
  n1reset: string;
  n1contextLabel: string;
  n1contextEmpty: string;
  n1contextCount: string; // "{n} tokens so far"
  n1modelLabel: string;
  n1nextLabel: string;
  n1feedback: string;
  n1doneNext: string;
  n1tapeLabel: string;

  // node 2 — when it stops
  n2emitOn: string;
  n2emitOff: string;
  n2stopCap: string;
  n2eosLabel: string;
  n2ramble: string[];
  n2wall: string;

  // node 3 — why it is sequential
  n3play: string;
  n3step: string;
  n3reset: string;
  n3promptLane: string;
  n3answerLane: string;
  n3parallelTag: string;
  n3serialTag: string;

  deeperTitle: string;
  deeperBody: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  navPrev: string;
  nextLesson: string;
  reveal: string;
  hide: string;
}

const seqEN: LoopToken[] = [
  { piece: "The", id: 791 },
  { piece: "cat", id: 9059 },
  { piece: "sat", id: 7731 },
  { piece: "on", id: 389 },
  { piece: "the", id: 279 },
  { piece: "mat", id: 5634 },
  { piece: ".", id: 13 },
  { piece: "<eos>", id: 100257, eos: true },
];

const promptEN: LoopToken[] = [
  { piece: "Finish", id: 66021 },
  { piece: "the", id: 279 },
  { piece: "sentence", id: 11914 },
  { piece: ":", id: 25 },
];

const seqES: LoopToken[] = [
  { piece: "El", id: 1425 },
  { piece: "gato", id: 78393 },
  { piece: "se", id: 325 },
  { piece: "sentó", id: 74123 },
  { piece: "en", id: 665 },
  { piece: "el", id: 658 },
  { piece: "tapete", id: 91002 },
  { piece: ".", id: 13 },
  { piece: "<eos>", id: 100257, eos: true },
];

const promptES: LoopToken[] = [
  { piece: "Completa", id: 84120 },
  { piece: "la", id: 1502 },
  { piece: "frase", id: 24551 },
  { piece: ":", id: 25 },
];

export const autoregressiveLoopEN: AutoregressiveLoopLesson = {
  crumb: "STAGE 0 · PHASE 0 · THE AUTOREGRESSIVE LOOP",
  eyebrow: "STAGE 0 · PHASE 0 · 3 NODES",
  title: "The autoregressive loop",
  lede: "You watched the model pick one next token. But one token isn't a sentence. This is the loop that turns a single prediction into a whole paragraph — and it's a loop you already know.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The loop", "When it stops", "Why it's one at a time"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Predict, append, feed back, repeat",
      intro: "Generation is a loop. The model predicts one token, that token is added to the text, and the whole thing is fed back in to predict the next one.",
      bullets: [
        "**It's a `while` loop you already know** — roughly `text += predict(text)`, run again and again.",
        "**Predict → append → feed back.** Each new token becomes part of the input for the next prediction.",
        "**One token per lap.** A whole sentence is just this loop running a few dozen times.",
        "**Press Step** to run one lap, or **Play** to watch the sentence build itself.",
      ],
      cardLabel: "THE GENERATION LOOP",
      aria: "A cycle diagram — context feeds a model, the model predicts the next token, the token is appended and fed back — above a growing token tape.",
      steps: 1,
      captions: ["The model reads everything so far and adds exactly one token, then goes around again."],
      hint: "Step through the loop — each lap the model reads the text so far and appends one more token.",
      readoutTitle: "GENERATION",
      rows: ["LAP", "PREDICTED", "TOKEN ID"],
      readoutNote: "One lap of the loop: how many tokens are written so far, the token just predicted, and its id in the vocabulary.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "When does it stop?",
      intro: "The loop needs a stop condition. Models have a special token — the end-of-sequence (EOS) token — and when the model picks it, generation ends.",
      bullets: [
        "**EOS is just another token in the vocabulary.** The model learns to emit it when the thought is complete.",
        "**The loop is `while (next != EOS)`.** Pick EOS and the condition breaks — the answer is done.",
        "**No stop token → it never stops.** Without EOS the loop runs until a hard length limit cuts it off mid-ramble.",
      ],
      cardLabel: "THE STOP CONDITION",
      aria: "A token tape that either ends cleanly at an end-of-sequence token, or runs on until a forced length-limit wall.",
      steps: 1,
      captions: ["Emit the end token and the loop halts; suppress it and the model runs to its length limit."],
      hint: "Turn the end token off — with nothing to stop it, the model rambles until a fixed length wall.",
      readoutTitle: "STOP",
      rows: ["STATE", "REASON"],
      optionNotes: [
        "The model emits <eos> after the final period, the while-condition breaks, and generation stops cleanly.",
        "With no end token the loop can't stop itself — it keeps predicting until a fixed max-length wall forces a cut.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Why it's one token at a time",
      intro: "Because each token is fed back in, token N can't be computed until tokens 1…N-1 exist. Writing is strictly sequential.",
      bullets: [
        "**Reading is parallel; writing is serial.** The model reads your whole prompt in one pass, but writes its answer one token at a time.",
        "**Every token depends on all the ones before it.** You can't skip ahead — token 5 needs token 4, which needs token 3.",
        "**That's why longer answers take longer.** More tokens means more laps of the loop, one after another.",
      ],
      cardLabel: "PARALLEL READ vs SERIAL WRITE",
      aria: "Two lanes — the prompt read all at once in parallel, and the answer written one token at a time, each new token depending on every token before it.",
      steps: 1,
      captions: ["The prompt is read in a single parallel pass; the answer is written serially, each token depending on all before it."],
      hint: "Step the answer forward — watch each new token reach back to every token before it.",
      readoutTitle: "SEQUENCE",
      rows: ["WRITTEN", "DEPENDS ON"],
    },
  ],

  seqTokens: seqEN,
  promptTokens: promptEN,

  n1play: "▶ Play",
  n1pause: "❚❚ Pause",
  n1step: "Step +1",
  n1reset: "Reset",
  n1contextLabel: "CONTEXT",
  n1contextEmpty: "your prompt",
  n1contextCount: "{n} tokens so far",
  n1modelLabel: "MODEL",
  n1nextLabel: "NEXT TOKEN",
  n1feedback: "append + feed back in",
  n1doneNext: "— EOS · loop ends",
  n1tapeLabel: "THE SENTENCE SO FAR",

  n2emitOn: "End token: ON",
  n2emitOff: "End token: OFF",
  n2stopCap: "STOP · loop ends",
  n2eosLabel: "end token",
  n2ramble: ["and", "it", "sat", "and", "sat", "and", "…"],
  n2wall: "MAX LENGTH · forced cut",

  n3play: "▶ Play",
  n3step: "Step +1",
  n3reset: "Reset",
  n3promptLane: "PROMPT · read together",
  n3answerLane: "ANSWER · one at a time",
  n3parallelTag: "one parallel pass",
  n3serialTag: "depends on every token before it",

  deeperTitle: "Go deeper: prefill vs decode",
  deeperBody: "Engineers split the loop into two phases. **Prefill** reads the whole prompt in one parallel pass and caches the model's internal work for every prompt token. **Decode** is the loop you played — one token per pass, each pass reusing that cache so it doesn't re-read the whole history from scratch. It's the same loop; prefill is just the fast, parallel warm-up before the serial writing begins.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Your prompt is 100 tokens and the answer is 100 tokens. Reading the prompt feels instant, but the answer streams in slowly. Why?",
  explainA: "Because reading and writing work differently. The model reads all 100 prompt tokens **in parallel** in a single pass. But it **writes** the answer with the loop: each token is appended and fed back in, so token 2 can't start until token 1 exists. 100 output tokens means 100 sequential laps of the loop — that's the delay you watch stream across the screen.",
  bridgeLabel: "NEXT: HOW MODELS LEARN",
  bridgeBody: "You've watched a trained model write. But where do the weights that make each prediction come from? Next, **how models learn** — turning a giant pile of text into the numbers that power the loop.",
  navPrev: "Back: choosing the next token",
  nextLesson: "Continue: how models learn",
  reveal: "Reveal answer",
  hide: "Hide answer",
};

export const autoregressiveLoopES: AutoregressiveLoopLesson = {
  crumb: "ETAPA 0 · FASE 0 · EL BUCLE AUTORREGRESIVO",
  eyebrow: "ETAPA 0 · FASE 0 · 3 NODOS",
  title: "El bucle autorregresivo",
  lede: "Viste al modelo elegir un token siguiente. Pero un token no es una frase. Este es el bucle que convierte una sola predicción en un párrafo entero — y es un bucle que ya conoces.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El bucle", "Cuándo se detiene", "Por qué de a un token"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Predecir, agregar, realimentar, repetir",
      intro: "Generar es un bucle. El modelo predice un token, ese token se agrega al texto, y todo se realimenta para predecir el siguiente.",
      bullets: [
        "**Es un bucle `while` que ya conoces** — más o menos `texto += predecir(texto)`, una y otra vez.",
        "**Predecir → agregar → realimentar.** Cada token nuevo pasa a ser parte de la entrada para la próxima predicción.",
        "**Un token por vuelta.** Una frase entera es solo este bucle corriendo unas cuantas docenas de veces.",
        "**Pulsa Paso** para dar una vuelta, o **Play** para ver la frase construirse sola.",
      ],
      cardLabel: "EL BUCLE DE GENERACIÓN",
      aria: "Un diagrama de ciclo — el contexto alimenta a un modelo, el modelo predice el token siguiente, el token se agrega y se realimenta — sobre una cinta de tokens que crece.",
      steps: 1,
      captions: ["El modelo lee todo lo escrito hasta ahora y agrega exactamente un token, y vuelve a empezar."],
      hint: "Avanza por el bucle — en cada vuelta el modelo lee el texto hasta ahora y agrega un token más.",
      readoutTitle: "GENERACIÓN",
      rows: ["VUELTA", "PREDICHO", "ID DE TOKEN"],
      readoutNote: "Una vuelta del bucle: cuántos tokens llevas escritos, el token recién predicho y su id en el vocabulario.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "¿Cuándo se detiene?",
      intro: "El bucle necesita una condición de parada. Los modelos tienen un token especial — el token de fin de secuencia (EOS) — y cuando el modelo lo elige, la generación termina.",
      bullets: [
        "**EOS es solo otro token del vocabulario.** El modelo aprende a emitirlo cuando la idea está completa.",
        "**El bucle es `while (siguiente != EOS)`.** Elige EOS y la condición se rompe — la respuesta está lista.",
        "**Sin token de parada → nunca se detiene.** Sin EOS el bucle corre hasta que un límite de longitud lo corta a medias.",
      ],
      cardLabel: "LA CONDICIÓN DE PARADA",
      aria: "Una cinta de tokens que termina limpiamente en un token de fin de secuencia, o sigue hasta un muro forzado de límite de longitud.",
      steps: 1,
      captions: ["Emite el token de fin y el bucle se detiene; suprímelo y el modelo corre hasta su límite de longitud."],
      hint: "Apaga el token de fin — sin nada que lo detenga, el modelo divaga hasta un muro fijo de longitud.",
      readoutTitle: "PARADA",
      rows: ["ESTADO", "MOTIVO"],
      optionNotes: [
        "El modelo emite <eos> tras el punto final, la condición del while se rompe y la generación se detiene limpiamente.",
        "Sin token de fin el bucle no puede detenerse solo — sigue prediciendo hasta que un muro fijo de longitud máxima fuerza el corte.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Por qué es de a un token",
      intro: "Como cada token se realimenta, el token N no se puede calcular hasta que existan los tokens 1…N-1. Escribir es estrictamente secuencial.",
      bullets: [
        "**Leer es paralelo; escribir es en serie.** El modelo lee todo tu prompt de una pasada, pero escribe su respuesta de a un token.",
        "**Cada token depende de todos los anteriores.** No puedes saltarte pasos — el token 5 necesita el 4, que necesita el 3.",
        "**Por eso las respuestas largas tardan más.** Más tokens significa más vueltas del bucle, una tras otra.",
      ],
      cardLabel: "LECTURA PARALELA vs ESCRITURA EN SERIE",
      aria: "Dos carriles — el prompt leído de una sola pasada en paralelo, y la respuesta escrita de a un token, cada token nuevo dependiendo de todos los anteriores.",
      steps: 1,
      captions: ["El prompt se lee en una sola pasada paralela; la respuesta se escribe en serie, cada token dependiendo de todos los anteriores."],
      hint: "Avanza la respuesta — mira cómo cada token nuevo se conecta con todos los tokens anteriores.",
      readoutTitle: "SECUENCIA",
      rows: ["ESCRITO", "DEPENDE DE"],
    },
  ],

  seqTokens: seqES,
  promptTokens: promptES,

  n1play: "▶ Play",
  n1pause: "❚❚ Pausa",
  n1step: "Paso +1",
  n1reset: "Reiniciar",
  n1contextLabel: "CONTEXTO",
  n1contextEmpty: "tu prompt",
  n1contextCount: "{n} tokens hasta ahora",
  n1modelLabel: "MODELO",
  n1nextLabel: "TOKEN SIGUIENTE",
  n1feedback: "agregar + realimentar",
  n1doneNext: "— EOS · fin del bucle",
  n1tapeLabel: "LA FRASE HASTA AHORA",

  n2emitOn: "Token de fin: SÍ",
  n2emitOff: "Token de fin: NO",
  n2stopCap: "STOP · fin del bucle",
  n2eosLabel: "token de fin",
  n2ramble: ["y", "se", "sentó", "y", "sentó", "y", "…"],
  n2wall: "LONGITUD MÁX · corte forzado",

  n3play: "▶ Play",
  n3step: "Paso +1",
  n3reset: "Reiniciar",
  n3promptLane: "PROMPT · leído junto",
  n3answerLane: "RESPUESTA · de a uno",
  n3parallelTag: "una pasada en paralelo",
  n3serialTag: "depende de todos los tokens anteriores",

  deeperTitle: "Más a fondo: prefill vs decode",
  deeperBody: "Los ingenieros dividen el bucle en dos fases. El **prefill** lee todo el prompt en una pasada paralela y cachea el trabajo interno del modelo para cada token del prompt. El **decode** es el bucle que jugaste — un token por pasada, reusando ese caché para no releer toda la historia desde cero. Es el mismo bucle; el prefill es solo el calentamiento rápido y paralelo antes de que empiece la escritura en serie.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Tu prompt tiene 100 tokens y la respuesta tiene 100 tokens. Leer el prompt parece instantáneo, pero la respuesta llega despacio. ¿Por qué?",
  explainA: "Porque leer y escribir funcionan distinto. El modelo lee los 100 tokens del prompt **en paralelo** en una sola pasada. Pero **escribe** la respuesta con el bucle: cada token se agrega y se realimenta, así que el token 2 no puede empezar hasta que exista el token 1. 100 tokens de salida son 100 vueltas secuenciales del bucle — ese es el retraso que ves aparecer en pantalla.",
  bridgeLabel: "SIGUIENTE: CÓMO APRENDEN LOS MODELOS",
  bridgeBody: "Viste escribir a un modelo ya entrenado. ¿Pero de dónde salen los pesos que hacen cada predicción? Sigue **cómo aprenden los modelos** — convertir una pila gigante de texto en los números que mueven el bucle.",
  navPrev: "Atrás: elegir el token siguiente",
  nextLesson: "Continuar: cómo aprenden los modelos",
  reveal: "Ver respuesta",
  hide: "Ocultar respuesta",
};
