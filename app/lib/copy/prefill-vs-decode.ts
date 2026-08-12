/**
 * Stage 0 · Serving — Prefill vs decode. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs. ALL
 * user-facing text (including diagram labels) lives in this module.
 */
import type { WsNodeCopy } from "./shared";

/** Text labels painted into node 1's d3 diagram. */
export interface PvdDiagram1 {
  tokens: string; //   "prompt tokens" (count prefix)
  memory: string; //   "context memory"
  memorySub: string; // "built in 1 pass"
  step: string; //     "1 parallel step"
}
/** Text labels painted into node 2's d3 diagram. */
export interface PvdDiagram2 {
  promptMemo: string; // "prompt · already in memory"
  out: string; //       "output tokens"
  steps: string; //     "sequential steps"
  reads: string; //     "each step re-reads the prompt + every earlier token …"
}
/** Text labels painted into node 3's d3 diagram. */
export interface PvdDiagram3 {
  prefill: string;
  decode: string;
  firstToken: string;
  onePass: string;
  oneAtATime: string;
  time: string; // "time →"
}

export interface PrefillVsDecodeLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node controls
  n1slider: string;
  n1diagram: PvdDiagram1;
  n2slider: string;
  n2diagram: PvdDiagram2;
  n3promptSlider: string;
  n3answerSlider: string;
  n3diagram: PvdDiagram3;
  // wrap-up
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevRoadmap: string;
  nextLesson: string;
}

export const prefillVsDecodeEN: PrefillVsDecodeLesson = {
  crumb: "STAGE 0 · SERVING · PREFILL VS DECODE",
  eyebrow: "STAGE 0 · SERVING · 3 NODES",
  title: "Prefill vs decode",
  lede: "Ask a model a question and the answer doesn't arrive all at once — it types itself out. That's because serving happens in two phases: a fast pass that reads your whole prompt, then a slow one that writes the answer one token at a time.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Prefill", "Decode", "The timeline"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Prefill reads the whole prompt at once",
      intro: "When you hit enter, the model reads every token in your prompt together — in a single parallel pass, not word by word.",
      bullets: [
        "**One pass, all tokens.** Prefill processes the whole prompt at the same time, like reading a full page at a glance.",
        "**It builds a working memory** of the prompt that every later step reuses — nothing gets read from scratch again.",
        "**More prompt barely costs more time.** Double the prompt and prefill is still one pass, so it stays fast.",
      ],
      cardLabel: "PREFILL · ONE PARALLEL PASS",
      aria: "A grid of prompt tokens all processed together in one step, feeding a context-memory box.",
      steps: 1,
      captions: ["The whole prompt is read in a single parallel pass."],
      hint: "Drag the prompt length — the grid grows, but it's still one pass.",
      readoutTitle: "PREFILL",
      rows: ["TOKENS", "PASSES"],
      sliderNote: "Drag prompt length. The grid grows, but the model still reads it all in one parallel pass — prefill stays fast.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Decode writes one token at a time",
      intro: "With the prompt in memory, the answer comes out one token per step — each step writes a single token, then feeds it back in to write the next.",
      bullets: [
        "**One token per step.** The model can't write the whole answer at once; each token depends on the one before it.",
        "**Every step re-reads everything so far** — the prompt plus all tokens written up to now — then adds exactly one more.",
        "**N output tokens means N steps**, run strictly one after another. This is the part that can't go in parallel.",
      ],
      cardLabel: "DECODE · ONE TOKEN PER STEP",
      aria: "Output tokens appearing one at a time, each its own numbered step.",
      steps: 1,
      captions: ["Tokens are produced one at a time, each a separate step."],
      hint: "Drag the answer length — watch the tokens drip out one by one.",
      readoutTitle: "DECODE",
      rows: ["TOKENS", "STEPS"],
      sliderNote: "Drag answer length. Each token is its own step, so the passes stack up one after another — this is why longer answers take longer.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Why long answers take a while",
      intro: "Put both phases on a clock: a quick prefill burst, then a steady decode drip. The drip is almost always the slow part.",
      bullets: [
        "**Prefill is a short burst** — one fast pass, even for a long prompt.",
        "**Decode is a long drip** — one token every ~20 ms, stacked over hundreds of tokens.",
        "**Answer length drives the wait, not prompt length.** A longer prompt barely moves the total; a longer answer dominates it.",
        "**First token vs full answer are different** — the first word can appear fast while the rest keeps streaming.",
      ],
      cardLabel: "SERVING TIMELINE · PREFILL + DECODE",
      aria: "A time axis with a short prefill block then many decode ticks.",
      steps: 1,
      captions: ["A quick prefill burst, then a long decode drip."],
      hint: "Drag both lengths — the prompt slider barely moves the total; the answer slider drives it.",
      readoutTitle: "LATENCY",
      rows: ["FIRST TOKEN", "DECODE", "TOTAL", "DECODE %"],
      readoutNote: "Time to the first token vs the full answer. Decode almost always dominates — which is why streaming answers feel like they type at you.",
      sliderNote: "A long prompt barely moves the total; a long answer drives it. Decode is the slow part.",
    },
  ],
  n1slider: "PROMPT LENGTH",
  n1diagram: { tokens: "prompt tokens", memory: "context memory", memorySub: "built in 1 pass", step: "1 parallel step" },
  n2slider: "ANSWER LENGTH",
  n2diagram: {
    promptMemo: "prompt · already in memory",
    out: "output tokens",
    steps: "sequential steps",
    reads: "each step re-reads the prompt + every earlier token, then writes one more",
  },
  n3promptSlider: "PROMPT LENGTH",
  n3answerSlider: "ANSWER LENGTH",
  n3diagram: { prefill: "prefill", decode: "decode", firstToken: "first token", onePass: "1 pass", oneAtATime: "1 at a time", time: "time →" },
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "You send a short prompt and get back a long, detailed answer — and it streams out slowly. Where does the time actually go?",
  explainA: "Almost all of it goes to **decode**. Reading your prompt is one fast parallel pass — **prefill** — so it barely matters how long the prompt is. But the answer is written one token at a time, each token its own step that waits on the one before it. A few hundred output tokens at ~20 ms each adds up to seconds. That's why the wait tracks the *answer* length, not the prompt — and why the words appear to type themselves out.",
  bridgeLabel: "THAT'S STAGE 0",
  bridgeBody: "You've now followed a model from raw web text all the way to a streaming answer — **built, trained, aligned, and served**. Head back to the roadmap to pick your next stage.",
  prevRoadmap: "Previous: alignment",
  nextLesson: "Back to the roadmap",
};

export const prefillVsDecodeES: PrefillVsDecodeLesson = {
  crumb: "ETAPA 0 · SERVICIO · PREFILL VS DECODE",
  eyebrow: "ETAPA 0 · SERVICIO · 3 NODOS",
  title: "Prefill vs decode",
  lede: "Hazle una pregunta a un modelo y la respuesta no llega de golpe — se va escribiendo sola. Es porque servir ocurre en dos fases: un pase rápido que lee todo tu prompt, y luego uno lento que escribe la respuesta token por token.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Prefill", "Decode", "La línea de tiempo"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Prefill lee todo el prompt de una vez",
      intro: "Cuando pulsas enter, el modelo lee todos los tokens de tu prompt juntos — en un solo pase paralelo, no palabra por palabra.",
      bullets: [
        "**Un pase, todos los tokens.** Prefill procesa el prompt entero al mismo tiempo, como leer una página completa de un vistazo.",
        "**Construye una memoria de trabajo** del prompt que reutiliza cada paso posterior — nada se vuelve a leer desde cero.",
        "**Más prompt casi no cuesta más tiempo.** Duplica el prompt y prefill sigue siendo un pase, así que se mantiene rápido.",
      ],
      cardLabel: "PREFILL · UN PASE PARALELO",
      aria: "Una cuadrícula de tokens del prompt procesados juntos en un paso, que alimenta una caja de memoria de contexto.",
      steps: 1,
      captions: ["Todo el prompt se lee en un único pase paralelo."],
      hint: "Arrastra la longitud del prompt — la cuadrícula crece, pero sigue siendo un pase.",
      readoutTitle: "PREFILL",
      rows: ["TOKENS", "PASES"],
      sliderNote: "Arrastra la longitud del prompt. La cuadrícula crece, pero el modelo lo lee todo en un pase paralelo — prefill se mantiene rápido.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Decode escribe un token a la vez",
      intro: "Con el prompt en memoria, la respuesta sale un token por paso — cada paso escribe un solo token y lo reintroduce para escribir el siguiente.",
      bullets: [
        "**Un token por paso.** El modelo no puede escribir toda la respuesta de golpe; cada token depende del anterior.",
        "**Cada paso vuelve a leer todo lo anterior** — el prompt más todos los tokens escritos hasta ahora — y añade exactamente uno más.",
        "**N tokens de salida significan N pasos**, ejecutados estrictamente uno tras otro. Esta es la parte que no puede ir en paralelo.",
      ],
      cardLabel: "DECODE · UN TOKEN POR PASO",
      aria: "Tokens de salida que aparecen uno a la vez, cada uno su propio paso numerado.",
      steps: 1,
      captions: ["Los tokens se producen uno a la vez, cada uno un paso aparte."],
      hint: "Arrastra la longitud de la respuesta — mira los tokens salir de a uno.",
      readoutTitle: "DECODE",
      rows: ["TOKENS", "PASOS"],
      sliderNote: "Arrastra la longitud de la respuesta. Cada token es su propio paso, así que los pases se apilan uno tras otro — por eso las respuestas largas tardan más.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Por qué las respuestas largas tardan",
      intro: "Pon ambas fases en un reloj: una ráfaga rápida de prefill, y luego un goteo constante de decode. El goteo casi siempre es la parte lenta.",
      bullets: [
        "**Prefill es una ráfaga corta** — un pase rápido, incluso para un prompt largo.",
        "**Decode es un goteo largo** — un token cada ~20 ms, apilado sobre cientos de tokens.",
        "**La longitud de la respuesta manda la espera, no la del prompt.** Un prompt más largo casi no mueve el total; una respuesta más larga lo domina.",
        "**El primer token y la respuesta completa son distintos** — la primera palabra puede aparecer rápido mientras el resto sigue fluyendo.",
      ],
      cardLabel: "LÍNEA DE TIEMPO · PREFILL + DECODE",
      aria: "Un eje de tiempo con un bloque corto de prefill y luego muchas marcas de decode.",
      steps: 1,
      captions: ["Una ráfaga rápida de prefill, y luego un goteo largo de decode."],
      hint: "Arrastra ambas longitudes — el prompt casi no mueve el total; la respuesta sí lo manda.",
      readoutTitle: "LATENCIA",
      rows: ["PRIMER TOKEN", "DECODE", "TOTAL", "DECODE %"],
      readoutNote: "El tiempo hasta el primer token frente a la respuesta completa. Decode casi siempre domina — por eso las respuestas parecen escribirse solas.",
      sliderNote: "Un prompt largo casi no mueve el total; una respuesta larga sí lo manda. Decode es la parte lenta.",
    },
  ],
  n1slider: "LONGITUD DEL PROMPT",
  n1diagram: { tokens: "tokens de prompt", memory: "memoria de contexto", memorySub: "construida en 1 pase", step: "1 paso paralelo" },
  n2slider: "LONGITUD DE LA RESPUESTA",
  n2diagram: {
    promptMemo: "prompt · ya en memoria",
    out: "tokens de salida",
    steps: "pasos secuenciales",
    reads: "cada paso vuelve a leer el prompt + cada token anterior, y escribe uno más",
  },
  n3promptSlider: "LONGITUD DEL PROMPT",
  n3answerSlider: "LONGITUD DE LA RESPUESTA",
  n3diagram: { prefill: "prefill", decode: "decode", firstToken: "primer token", onePass: "1 pase", oneAtATime: "1 a la vez", time: "tiempo →" },
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Envías un prompt corto y recibes una respuesta larga y detallada — y sale despacio. ¿A dónde se va realmente el tiempo?",
  explainA: "Casi todo se va a **decode**. Leer tu prompt es un pase paralelo rápido — **prefill** — así que apenas importa cuán largo sea el prompt. Pero la respuesta se escribe token por token, cada token su propio paso que espera al anterior. Unos cientos de tokens de salida a ~20 ms cada uno suman segundos. Por eso la espera sigue la longitud de la *respuesta*, no la del prompt — y por eso las palabras parecen escribirse solas.",
  bridgeLabel: "ESO ES LA ETAPA 0",
  bridgeBody: "Ya seguiste un modelo desde texto web crudo hasta una respuesta que fluye — **construido, entrenado, alineado y servido**. Vuelve a la ruta para elegir tu próxima etapa.",
  prevRoadmap: "Anterior: alineación",
  nextLesson: "Volver a la ruta",
};
