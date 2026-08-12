/**
 * Stage 0 · Phase 3 — Reasoning tokens (the "think" block). Interface + EN/ES
 * copy for the article, isolated from every other lesson so edits here never
 * touch theirs.
 *
 * ONE idea: special `<think>` / `</think>` delimiters let a model write a hidden
 * scratchpad before its final answer — spending extra compute to reason, all
 * still through the ordinary next-token loop from the autoregressive lesson.
 * Language-neutral symbols (the tags, ids, the algebra lines) live in
 * app/lib/reasoning-tokens.ts; every natural-language string lives here.
 */
import type { WsNodeCopy } from "./shared";

export interface ReasoningTokensLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // shared example
  promptLabel: string; //   "PROMPT"
  promptText: string; //    the riddle, in one line

  // Node 1 — the think block
  n1reasonOn: string; //    "Reasoning ON"
  n1reasonOff: string; //   "Reasoning OFF"
  n1viewRaw: string; //     "Raw generation"
  n1viewUser: string; //    "What the user sees"
  n1scratchpadLabel: string; // "SCRATCHPAD · hidden from the user"
  n1hiddenFmt: string; //   "{n} reasoning tokens — hidden"
  n1answerLabel: string; // "ANSWER"
  n1thinkTag: string; //    "worked out — correct"
  n1blurtTag: string; //    "intuitive — but wrong"
  n1specialFmt: string; //  "special token · id {id}"

  // Node 2 — why it helps
  n2slider: string; //      "THINKING BUDGET"
  n2stepWord: string; //    "steps"
  n2unlockedLabel: string; //"REASONING IT'S ALLOWED TO DO"
  n2passesLabel: string; // "FORWARD PASSES · compute spent"
  n2passesWord: string; //  "forward passes"
  n2verdictRight: string; //"worked it out"
  n2verdictWrong: string; //"guessed"
  n2illustrative: string; //caption: illustrative

  // Node 3 — still autoregression
  n3contextLabel: string; //"THE GENERATED STREAM"
  n3newest: string; //      "just generated"
  n3feedback: string; //    "appended → whole context fed back in"
  n3specialLegend: string; //"dashed = special vocabulary token · same tape, its own id"
  n3idWord: string; //      "id"

  // shared
  deeperLabel: string;
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

/* ============================================================ ENGLISH ======= */

export const reasoningTokensEN: ReasoningTokensLesson = {
  crumb: "STAGE 0 · REASONING TOKENS",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Reasoning tokens",
  lede: "A \"reasoning\" model doesn't have a second brain. It just writes a hidden scratchpad before its answer — bracketed by two special tokens — spending extra compute to think out loud where you can't see it. Under the hood it's the same next-token loop.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The think block", "Why it helps", "Still autoregression"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The think block",
      intro: "Reasoning is switched on by two ordinary tokens. `<think>` opens a scratchpad region; `</think>` closes it. Everything between them is the model's private working — generated first, then hidden from you.",
      bullets: [
        "**`<think>` and `</think>` are special tokens** — single entries in the vocabulary, each with its own id, exactly like a word-piece. They just *delimit* a region.",
        "**The scratchpad comes first, the answer comes last.** The model fills the region with working, emits `</think>`, then writes the reply the user actually reads.",
        "**A parser hides the scratchpad.** The app shows you everything *after* `</think>` and drops the rest — so the reasoning is there, but off-screen.",
        "**Turn reasoning off and the model blurts.** On this classic riddle the fast, intuitive answer is wrong; the scratchpad is what gets it right.",
      ],
      cardLabel: "GENERATED STREAM · THINK BLOCK",
      aria: "A vertical stream: the prompt, a <think> delimiter, a hidden scratchpad of working, a </think> delimiter, and the final answer.",
      steps: 1,
      captions: ["Flip reasoning on and off, and switch between the raw stream and what the user is shown."],
      hint: "Toggle Reasoning, then flip the view — the scratchpad is generated either way, the user just never sees it.",
      readoutTitle: "THINK_BLOCK",
      rows: ["STATE"],
      optionNotes: [
        "Reasoning ON — the model opens a `<think>` block, works through the algebra, closes it, then answers. The intuitive trap is avoided.",
        "Reasoning OFF — no scratchpad. The model answers in one shot and falls for the obvious-but-wrong number.",
        "Raw generation — the actual token stream the model produced, scratchpad and all.",
        "What the user sees — the app strips everything up to `</think>`; only the final answer survives.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Why more tokens buy better answers",
      intro: "Every token the model generates is one forward pass — one full sweep through the network. A blurted answer gets one sweep to decide. Letting it write a scratchpad first buys many more sweeps *before* it commits.",
      bullets: [
        "**Compute is spent per token, not per question.** More generated tokens = more forward passes = more thinking before the answer.",
        "**This is \"test-time compute\":** you pay for quality at answer-time, not by making the model bigger.",
        "**Give it a budget of reasoning steps below.** Each step is a few more scratchpad tokens — more compute, more of the derivation done.",
        "**There's a threshold, then diminishing returns.** Too few steps and it can't finish the algebra; past enough, extra tokens mostly waste time.",
      ],
      cardLabel: "THINKING BUDGET → COMPUTE → ANSWER",
      aria: "A budget of reasoning steps unlocking lines of working, a compute meter of forward passes, and the resulting answer.",
      steps: 1,
      captions: ["Raise the thinking budget and watch the derivation fill in, the compute meter climb, and the answer flip."],
      hint: "Drag the budget from 0 — the answer stays wrong until the model has enough steps to finish the algebra.",
      readoutTitle: "COMPUTE",
      rows: ["BUDGET", "PASSES", "ANSWER"],
      readoutNote: "The compute you bought: reasoning steps allowed, the forward passes that costs, and the answer it produces. Numbers are illustrative.",
      sliderNote: "Budget 0 = blurt: one forward pass, the intuitive wrong answer. Each step adds scratchpad tokens — more passes, more of the working done.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "It's still just the loop",
      intro: "Nothing new happens mechanically. `<think>` is generated the same way as any word: predict the next token, append it, feed the whole context back in — the loop from the autoregressive lesson. The tags are just tokens the model learned to emit.",
      bullets: [
        "**Same append-and-feed-back loop.** Each new token — delimiters included — joins the context and the model predicts again.",
        "**Special tokens ride the same tape.** `<think>`, `</think>` and the end token `<eos>` are vocabulary entries with ids, sitting between ordinary tokens.",
        "**The model isn't in a \"reasoning mode.\"** It generated a `<think>` token because training taught it to; the only extra machinery is the parser that hides the region.",
        "**Step through the stream** — watch each token get appended and fed back, delimiters and answer alike.",
      ],
      cardLabel: "ONE TOKEN AT A TIME",
      aria: "A token tape revealed one token at a time — special delimiter tokens shown with their ids alongside ordinary tokens.",
      steps: 7,
      captions: [
        "The model predicts `<think>` — a special token, id and all — and appends it.",
        "It appends `2x`; the whole context so far is fed back in to predict the next token.",
        "`=` — another ordinary token, same loop.",
        "`0.10` — the scratchpad is filling, one forward pass per token.",
        "It predicts `</think>`, closing the hidden region.",
        "Now the visible answer: `$0.05`.",
        "`<eos>` — the special end token stops the loop, exactly as before.",
      ],
      hint: "Step through — the dashed tokens are special vocabulary entries, but they're generated by the same loop as the rest.",
      readoutTitle: "STREAM",
      rows: ["TOKEN", "ID"],
    },
  ],

  promptLabel: "PROMPT",
  promptText: "A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much is the ball?",

  n1reasonOn: "Reasoning ON",
  n1reasonOff: "Reasoning OFF",
  n1viewRaw: "Raw generation",
  n1viewUser: "What the user sees",
  n1scratchpadLabel: "SCRATCHPAD · hidden from the user",
  n1hiddenFmt: "{n} reasoning steps — hidden",
  n1answerLabel: "ANSWER",
  n1thinkTag: "worked out — correct",
  n1blurtTag: "intuitive — but wrong",
  n1specialFmt: "special token · id {id}",

  n2slider: "THINKING BUDGET",
  n2stepWord: "steps",
  n2unlockedLabel: "REASONING IT'S ALLOWED TO DO",
  n2passesLabel: "FORWARD PASSES · compute spent",
  n2passesWord: "forward passes",
  n2verdictRight: "worked it out",
  n2verdictWrong: "guessed",
  n2illustrative: "Illustrative: real accuracy rises with more thinking, then plateaus.",

  n3contextLabel: "THE GENERATED STREAM",
  n3newest: "just generated",
  n3feedback: "appended → whole context fed back in",
  n3specialLegend: "dashed = special vocabulary token · same tape, its own id",
  n3idWord: "id",

  deeperLabel: "GO DEEPER",
  deeperTitle: "Is every reasoning token really a full forward pass?",
  deeperBody: "Yes — generating N tokens means N forward passes, one per token. But they aren't N *independent* passes over the whole sequence. Each pass only computes the new token's attention against a cache of the earlier tokens' keys and values (the KV cache), so the per-token cost is roughly linear in the context length, not quadratic. That's why a long scratchpad is affordable: the model reuses everything it already computed and only pays for the one new token each step. \"Test-time compute\" scaling studies (e.g. letting a model sample and rank many reasoning chains, or simply think longer) show accuracy climbing with the number of reasoning tokens spent — up to a point, then flattening — which is exactly the threshold-then-plateau you drove with the budget slider.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A reasoning model and a plain model run the exact same next-token loop. So what actually makes the reasoning one \"think\"?",
  explainA: "Nothing in the mechanism changes — both predict one token at a time, append it, and feed the context back in. The difference is *what* the reasoning model was trained to generate: before answering, it emits a `<think>` token and produces a scratchpad of working, then a `</think>` token, then the reply. Those extra scratchpad tokens are the whole trick — each one is another forward pass, another chunk of compute spent *before* it commits to an answer, so it can work through a problem instead of blurting the first thing. A parser hides everything up to `</think>`, so you only see the polished answer. \"Reasoning\" is just the model spending more tokens — and therefore more compute — in a region you don't read.",
  bridgeLabel: "NEXT: TOOL CALLING",
  bridgeBody: "The scratchpad lets a model think — but it still can't *do* anything outside its own text. Next, **tool calling**: how the same token stream can emit a structured request the runtime executes — a search, a calculation, an API call — and feed the result back into the loop.",
  prevLesson: "Back: constrained decoding",
  nextLesson: "Continue to tool calling",
};

/* ============================================================ SPANISH ======= */

export const reasoningTokensES: ReasoningTokensLesson = {
  crumb: "ETAPA 0 · TOKENS DE RAZONAMIENTO",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Tokens de razonamiento",
  lede: "Un modelo \"que razona\" no tiene un segundo cerebro. Solo escribe un borrador oculto antes de su respuesta — entre dos tokens especiales — gastando cómputo extra para pensar en voz alta donde no lo ves. Por dentro es el mismo bucle de token a token.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El bloque de pensar", "Por qué ayuda", "Sigue siendo el bucle"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El bloque de pensar",
      intro: "El razonamiento se enciende con dos tokens comunes. `<think>` abre una región de borrador; `</think>` la cierra. Todo lo que va en medio es el trabajo privado del modelo — se genera primero y se te oculta.",
      bullets: [
        "**`<think>` y `</think>` son tokens especiales** — entradas únicas del vocabulario, cada una con su id, igual que un trozo de palabra. Solo *delimitan* una región.",
        "**El borrador va primero, la respuesta al final.** El modelo llena la región con su trabajo, emite `</think>`, y luego escribe la respuesta que el usuario de verdad lee.",
        "**Un parser oculta el borrador.** La app te muestra todo lo que va *después* de `</think>` y descarta el resto — el razonamiento está ahí, pero fuera de pantalla.",
        "**Apaga el razonamiento y el modelo suelta lo primero.** En este acertijo clásico la respuesta rápida e intuitiva está mal; el borrador es lo que la corrige.",
      ],
      cardLabel: "FLUJO GENERADO · BLOQUE DE PENSAR",
      aria: "Un flujo vertical: el prompt, un delimitador <think>, un borrador oculto de trabajo, un delimitador </think> y la respuesta final.",
      steps: 1,
      captions: ["Enciende y apaga el razonamiento, y alterna entre el flujo crudo y lo que se le muestra al usuario."],
      hint: "Alterna Razonamiento, luego cambia la vista — el borrador se genera igual, el usuario solo nunca lo ve.",
      readoutTitle: "THINK_BLOCK",
      rows: ["ESTADO"],
      optionNotes: [
        "Razonamiento ON — el modelo abre un bloque `<think>`, resuelve el álgebra, lo cierra y responde. Evita la trampa intuitiva.",
        "Razonamiento OFF — sin borrador. El modelo responde de una y cae en el número obvio pero incorrecto.",
        "Generación cruda — el flujo real de tokens que produjo el modelo, borrador incluido.",
        "Lo que ve el usuario — la app quita todo hasta `</think>`; solo sobrevive la respuesta final.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Por qué más tokens compran mejores respuestas",
      intro: "Cada token que genera el modelo es una pasada hacia adelante — un barrido completo por la red. Una respuesta soltada tiene un solo barrido para decidir. Dejar que escriba un borrador primero compra muchos más barridos *antes* de comprometerse.",
      bullets: [
        "**El cómputo se gasta por token, no por pregunta.** Más tokens generados = más pasadas = más pensamiento antes de la respuesta.",
        "**Esto es \"cómputo en tiempo de respuesta\":** pagas por calidad al responder, no agrandando el modelo.",
        "**Dale abajo un presupuesto de pasos de razonamiento.** Cada paso son unos tokens más de borrador — más cómputo, más de la deducción hecha.",
        "**Hay un umbral y luego rendimientos decrecientes.** Con muy pocos pasos no termina el álgebra; pasado lo justo, los tokens extra casi solo gastan tiempo.",
      ],
      cardLabel: "PRESUPUESTO → CÓMPUTO → RESPUESTA",
      aria: "Un presupuesto de pasos de razonamiento que desbloquea líneas de trabajo, un medidor de cómputo de pasadas hacia adelante y la respuesta resultante.",
      steps: 1,
      captions: ["Sube el presupuesto y mira cómo se llena la deducción, sube el medidor de cómputo y cambia la respuesta."],
      hint: "Arrastra el presupuesto desde 0 — la respuesta sigue mal hasta que el modelo tiene pasos suficientes para terminar el álgebra.",
      readoutTitle: "COMPUTE",
      rows: ["PRESUPUESTO", "PASADAS", "RESPUESTA"],
      readoutNote: "El cómputo que compraste: pasos de razonamiento permitidos, las pasadas que eso cuesta y la respuesta que produce. Los números son ilustrativos.",
      sliderNote: "Presupuesto 0 = soltar: una pasada, la respuesta intuitiva incorrecta. Cada paso añade tokens de borrador — más pasadas, más del trabajo hecho.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Sigue siendo solo el bucle",
      intro: "Mecánicamente no pasa nada nuevo. `<think>` se genera igual que cualquier palabra: predice el siguiente token, lo añade, vuelve a meter todo el contexto — el bucle de la lección autorregresiva. Las etiquetas son solo tokens que el modelo aprendió a emitir.",
      bullets: [
        "**El mismo bucle de añadir y realimentar.** Cada token nuevo — delimitadores incluidos — se une al contexto y el modelo vuelve a predecir.",
        "**Los tokens especiales van en la misma cinta.** `<think>`, `</think>` y el token de fin `<eos>` son entradas del vocabulario con id, entre tokens comunes.",
        "**El modelo no está en un \"modo razonamiento\".** Generó un token `<think>` porque el entrenamiento se lo enseñó; la única maquinaria extra es el parser que oculta la región.",
        "**Avanza por el flujo** — mira cada token añadirse y realimentarse, delimitadores y respuesta por igual.",
      ],
      cardLabel: "UN TOKEN A LA VEZ",
      aria: "Una cinta de tokens revelada de a un token — los tokens delimitadores especiales se muestran con su id junto a los tokens comunes.",
      steps: 7,
      captions: [
        "El modelo predice `<think>` — un token especial, con id y todo — y lo añade.",
        "Añade `2x`; todo el contexto hasta ahora se realimenta para predecir el siguiente token.",
        "`=` — otro token común, el mismo bucle.",
        "`0.10` — el borrador se llena, una pasada por token.",
        "Predice `</think>`, cerrando la región oculta.",
        "Ahora la respuesta visible: `$0.05`.",
        "`<eos>` — el token especial de fin detiene el bucle, igual que antes.",
      ],
      hint: "Avanza — los tokens con contorno son entradas especiales del vocabulario, pero se generan con el mismo bucle que el resto.",
      readoutTitle: "STREAM",
      rows: ["TOKEN", "ID"],
    },
  ],

  promptLabel: "PROMPT",
  promptText: "Un bate y una pelota cuestan $1.10 juntos. El bate cuesta $1.00 más que la pelota. ¿Cuánto cuesta la pelota?",

  n1reasonOn: "Razonamiento ON",
  n1reasonOff: "Razonamiento OFF",
  n1viewRaw: "Generación cruda",
  n1viewUser: "Lo que ve el usuario",
  n1scratchpadLabel: "BORRADOR · oculto al usuario",
  n1hiddenFmt: "{n} pasos de razonamiento — ocultos",
  n1answerLabel: "RESPUESTA",
  n1thinkTag: "razonado — correcto",
  n1blurtTag: "intuitivo — pero incorrecto",
  n1specialFmt: "token especial · id {id}",

  n2slider: "PRESUPUESTO DE PENSAR",
  n2stepWord: "pasos",
  n2unlockedLabel: "RAZONAMIENTO QUE SE LE PERMITE",
  n2passesLabel: "PASADAS · cómputo gastado",
  n2passesWord: "pasadas",
  n2verdictRight: "lo resolvió",
  n2verdictWrong: "adivinó",
  n2illustrative: "Ilustrativo: la precisión real sube con más pensamiento y luego se estanca.",

  n3contextLabel: "EL FLUJO GENERADO",
  n3newest: "recién generado",
  n3feedback: "añadido → todo el contexto se realimenta",
  n3specialLegend: "contorno = token especial del vocabulario · misma cinta, su propio id",
  n3idWord: "id",

  deeperLabel: "PROFUNDIZA",
  deeperTitle: "¿De verdad cada token de razonamiento es una pasada completa?",
  deeperBody: "Sí — generar N tokens implica N pasadas hacia adelante, una por token. Pero no son N pasadas *independientes* sobre toda la secuencia. Cada pasada solo calcula la atención del token nuevo contra una caché de las claves y valores de los tokens anteriores (la caché KV), así que el costo por token es más o menos lineal en el largo del contexto, no cuadrático. Por eso un borrador largo es asequible: el modelo reutiliza todo lo ya calculado y solo paga por el token nuevo en cada paso. Los estudios de \"cómputo en tiempo de respuesta\" (por ejemplo, dejar que el modelo genere y ordene muchas cadenas de razonamiento, o simplemente pensar más tiempo) muestran la precisión subiendo con el número de tokens de razonamiento gastados — hasta cierto punto, y luego se aplana — que es exactamente el umbral-y-meseta que moviste con el control de presupuesto.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo que razona y un modelo normal corren el mismísimo bucle de token a token. Entonces, ¿qué hace de verdad que el que razona \"piense\"?",
  explainA: "Nada del mecanismo cambia — ambos predicen un token a la vez, lo añaden y realimentan el contexto. La diferencia es *qué* fue entrenado a generar el modelo que razona: antes de responder, emite un token `<think>` y produce un borrador de trabajo, luego un token `</think>`, y luego la respuesta. Esos tokens extra de borrador son todo el truco — cada uno es otra pasada hacia adelante, otro trozo de cómputo gastado *antes* de comprometerse con una respuesta, así puede resolver un problema en vez de soltar lo primero. Un parser oculta todo hasta `</think>`, así que solo ves la respuesta pulida. \"Razonar\" es solo el modelo gastando más tokens — y por tanto más cómputo — en una región que no lees.",
  bridgeLabel: "SIGUIENTE: LLAMADA A HERRAMIENTAS",
  bridgeBody: "El borrador deja al modelo pensar — pero aún no puede *hacer* nada fuera de su propio texto. Sigue la **llamada a herramientas**: cómo el mismo flujo de tokens puede emitir una petición estructurada que el runtime ejecuta — una búsqueda, un cálculo, una llamada a una API — y realimentar el resultado al bucle.",
  prevLesson: "Atrás: decodificación restringida",
  nextLesson: "Continuar a herramientas",
};
