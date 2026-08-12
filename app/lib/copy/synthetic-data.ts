/**
 * Stage 0 · 4.1 — Synthetic data. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: strong models generate and grade their own training data — evolving
 * harder instructions, writing step-by-step reasoning traces, and keeping only
 * the samples that pass a verifier (rejection sampling). Builds on 4.4
 * (supervised fine-tuning): SFT needs instruction→answer pairs; don't re-teach
 * what SFT is — this is where those pairs come from.
 */
import type { WsNodeCopy } from "./shared";

export interface SyntheticDataLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — evolve the instruction
  n1ops: string[]; //     operator button labels (index-aligned to OP_KEYS)
  n1seedLabel: string; // "SEED"
  n1seed: string; //      the short seed prompt drawn in the tree
  n1harderTag: string; // "HARDER" chip on the selected branch
  // Node 2 — reasoning trace
  n2nodeTitles: string[]; // [Prompt, Step 1, Step 2, Step 3, Answer]
  n2snippets: string[]; //  the short math shown in each chain box
  n2answerOnly: string; //  label on the dashed gap at step 0
  n2traceTag: string; //    "one training example" tag when the trace solidifies
  // Node 3 — verify & keep
  n3verifiers: string[]; // toggle button labels (index-aligned to VERIFIER_ORDER)
  n3gateNames: string[]; // short gate labels drawn in the funnel
  n3genLabel: string; //   "GENERATED"
  n3keptLabel: string; //  "KEPT"
  n3dropWord: string; //   "dropped"
  n3toSet: string; //      "→ SFT training set"
  n3skipped: string; //    "off" (an inactive gate)
  n3reasons: string[]; //  per-gate reject reason (index-aligned to VERIFIER_ORDER)
  // shared
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const syntheticDataEN: SyntheticDataLesson = {
  crumb: "STAGE 0 · SYNTHETIC DATA",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Data the model makes for itself",
  lede: "Where do millions of training examples come from? Increasingly, the model writes them itself — inventing harder questions, working out full solutions, and keeping only the answers that pass a check.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Evolve the instruction", "Write the reasoning", "Verify & keep"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Make the question harder",
      intro: "Fine-tuning needs millions of instruction→answer pairs, and humans can't write them all. So a strong model rewrites a plain seed prompt into harder, richer variants — a trick called *Evol-Instruct*.",
      bullets: [
        "**Start from a seed prompt** — a basic task, the kind that's easy to collect but too easy to teach much.",
        "**An operator rewrites it** — add constraints, go deeper, make it concrete, or demand step-by-step work.",
        "**One seed becomes many** — each rewrite is a new, harder example the model then answers itself.",
        "**Harder questions teach more** than a pile of easy ones — this is where generated data beats plain scraping.",
      ],
      cardLabel: "SEED → EVOLVED VARIANTS",
      aria: "A mutation tree: one seed prompt branching into four harder rewritten variants.",
      steps: 4,
      captions: [
        "Add constraints — the same task, but with rules that test more skill.",
        "Go deeper — now it has to reason about its own answer, not just produce one.",
        "Make concrete — a vague task becomes a specific, checkable one.",
        "Demand steps — force an explicit, trainable reasoning trace.",
      ],
      hint: "Pick an operator — the seed splits into a harder version you can read below.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Add constraints → “Reverse a string in O(n) time and in place, with no built-in reverse and full Unicode support.” More rules, more skill tested.",
        "Go deeper → “Reverse a string, then explain why your method is correct for multi-byte characters.” Now it must reason, not just code.",
        "Make concrete → “Reverse the exact string ‘niño 🚀’ and show the precise output.” A vague task becomes a checkable one.",
        "Demand steps → “Reverse a string. Think step by step and justify each line.” Forces an explicit reasoning trace to train on.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Write out the reasoning, not just the answer",
      intro: "A right answer isn't enough to train on — the model should learn *how* to get there. So the generator writes the full step-by-step solution, and that whole trace becomes the training target.",
      bullets: [
        "**Answer-only teaches the what, not the how.** The model just learns to emit a result it can't reliably reproduce.",
        "**A reasoning trace shows every step** — the intermediate work that leads to the answer.",
        "**Training on the trace teaches the procedure**, so the model can redo it on problems it hasn't seen.",
        "**Scroll to build the trace** one line at a time, then watch it become a single training example.",
      ],
      cardLabel: "PROMPT → REASONING TRACE → ANSWER",
      aria: "A vertical chain growing from a prompt through reasoning steps to a checked answer.",
      steps: 5,
      captions: [
        "Answer-only: the model sees just the question and the final answer — it never learns how to reach it.",
        "Step 1 — subtract 6 from both sides: 2x = 14. The first move is now explicit.",
        "Step 2 — divide both sides by 2: x = 7. Each line follows from the last.",
        "Step 3 — check it: 2·7 + 6 = 20. ✓ The trace verifies its own answer.",
        "The whole trace is one training example — now the model learns the procedure, not just the result.",
      ],
      hint: "Step through — each move reveals one line of the worked solution.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Generate a lot, keep only what passes",
      intro: "Generation is cheap and often wrong, so the model makes many attempts and a verifier throws out the bad ones. Only the samples that pass become training data — this filtering is called *rejection sampling*.",
      bullets: [
        "**Every candidate runs a gauntlet** of automatic checks before it's allowed into the dataset.",
        "**Format check** — is the output shaped right: valid JSON, all the required fields, not cut off?",
        "**Unit tests / execution** — for code and math, actually run it: does it produce the correct result?",
        "**LLM judge** — a strong model scores quality and cuts the low ones. Only the survivors are kept.",
      ],
      cardLabel: "REJECTION-SAMPLING FUNNEL",
      aria: "A funnel: twelve generated candidates narrowing through three verifier gates to the kept few.",
      steps: 1,
      captions: ["Turn verifiers on and off — each gate drops the candidates that fail it, and only the survivors are kept."],
      hint: "Toggle the three verifiers — watch the funnel narrow as each one rejects more.",
      readoutTitle: "",
      rows: [],
      sliderNote: "All three verifiers are on — the realistic setup. Only 5 of 12 candidates survive. Turn one off to let more junk through.",
      optionNotes: [
        "Format check — rejects anything malformed: wrong JSON, missing fields, truncated output. The cheapest filter, so it runs first.",
        "Unit tests — actually run the code or math against known cases. Verifiable correctness, no opinion needed.",
        "LLM judge — a strong model rates quality 0–10 and cuts anything under 7. Catches what tests can't: clarity, helpfulness, safety.",
      ],
    },
  ],
  n1ops: ["Add constraints", "Go deeper", "Make concrete", "Demand steps"],
  n1seedLabel: "SEED",
  n1seed: "Reverse a string.",
  n1harderTag: "HARDER",
  n2nodeTitles: ["Prompt", "Step 1", "Step 2", "Step 3", "Answer"],
  n2snippets: ["Solve 2x + 6 = 20", "2x = 14", "x = 7", "2·7 + 6 = 20 ✓", "x = 7"],
  n2answerOnly: "answer only",
  n2traceTag: "one training example",
  n3verifiers: ["Format check", "Unit tests", "LLM judge ≥7"],
  n3gateNames: ["FORMAT", "TESTS", "JUDGE ≥7"],
  n3genLabel: "GENERATED",
  n3keptLabel: "KEPT",
  n3dropWord: "dropped",
  n3toSet: "→ SFT training set",
  n3skipped: "off",
  n3reasons: ["bad format", "failed tests", "low score"],
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "If a model generates its own training data, how does that make it any smarter than it already is — isn't it just echoing itself?",
  explainA: "Because the hard part isn't *generating*, it's *selecting*. The model can spit out many attempts cheaply, but a verifier — unit tests, a judge, a format check — keeps only the ones that are actually correct. Filtering to the verified minority distills a cleaner, harder dataset than the model reliably produces on its own, and **evolving the instructions** pushes the questions past the easy seed set. It isn't echoing — it's being pulled up by its own best, checked work (and often by a *stronger* teacher model). Generation is easy; **verification is where the signal comes from**.",
  bridgeLabel: "NEXT: REWARD MODELING",
  bridgeBody: "A verifier gives a clean yes/no, but most answers aren't right-or-wrong — one is just *better* than another. Next, **the reward model**: how a network learns human preference from A-vs-B choices, so it can score answers no rule could check.",
  prevLesson: "Back: supervised fine-tuning",
  nextLesson: "Continue to reward modeling",
};

/* ============================================================ SPANISH ======= */

export const syntheticDataES: SyntheticDataLesson = {
  crumb: "ETAPA 0 · DATOS SINTÉTICOS",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Datos que el modelo se crea a sí mismo",
  lede: "¿De dónde salen millones de ejemplos de entrenamiento? Cada vez más, el modelo los escribe él mismo — inventando preguntas más difíciles, resolviéndolas paso a paso y quedándose solo con las respuestas que pasan un control.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Evolucionar la consigna", "Escribir el razonamiento", "Verificar y conservar"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Hacer la pregunta más difícil",
      intro: "El fine-tuning necesita millones de pares consigna→respuesta, y los humanos no pueden escribirlos todos. Así que un modelo fuerte reescribe una consigna semilla simple en variantes más difíciles y ricas — un truco llamado *Evol-Instruct*.",
      bullets: [
        "**Parte de una consigna semilla** — una tarea básica, fácil de reunir pero demasiado simple para enseñar mucho.",
        "**Un operador la reescribe** — añade restricciones, profundiza, la hace concreta o exige trabajo paso a paso.",
        "**Una semilla se vuelve muchas** — cada reescritura es un ejemplo nuevo y más difícil que el modelo luego responde solo.",
        "**Las preguntas difíciles enseñan más** que un montón de fáciles — aquí los datos generados le ganan al raspado simple.",
      ],
      cardLabel: "SEMILLA → VARIANTES EVOLUCIONADAS",
      aria: "Un árbol de mutación: una consigna semilla que se ramifica en cuatro variantes reescritas más difíciles.",
      steps: 4,
      captions: [
        "Añadir restricciones — la misma tarea, pero con reglas que exigen más habilidad.",
        "Profundizar — ahora tiene que razonar sobre su propia respuesta, no solo producirla.",
        "Hacer concreta — una tarea vaga se vuelve específica y verificable.",
        "Exigir pasos — fuerza una traza de razonamiento explícita y entrenable.",
      ],
      hint: "Elige un operador — la semilla se parte en una versión más difícil que puedes leer abajo.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Añadir restricciones → “Invierte una cadena en tiempo O(n) y en el sitio, sin usar reverse integrado y con soporte Unicode completo.” Más reglas, más habilidad puesta a prueba.",
        "Profundizar → “Invierte una cadena y luego explica por qué tu método es correcto para caracteres multibyte.” Ahora debe razonar, no solo programar.",
        "Hacer concreta → “Invierte la cadena exacta ‘niño 🚀’ y muestra la salida precisa.” Una tarea vaga se vuelve verificable.",
        "Exigir pasos → “Invierte una cadena. Piensa paso a paso y justifica cada línea.” Fuerza una traza de razonamiento para entrenar.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Escribe el razonamiento, no solo la respuesta",
      intro: "Una respuesta correcta no basta para entrenar — el modelo debe aprender *cómo* se llega a ella. Así que el generador escribe la solución completa paso a paso, y esa traza entera se vuelve el objetivo de entrenamiento.",
      bullets: [
        "**Solo-la-respuesta enseña el qué, no el cómo.** El modelo solo aprende a soltar un resultado que no puede reproducir con fiabilidad.",
        "**Una traza de razonamiento muestra cada paso** — el trabajo intermedio que lleva a la respuesta.",
        "**Entrenar con la traza enseña el procedimiento**, así el modelo puede repetirlo en problemas que no ha visto.",
        "**Avanza para construir la traza** línea por línea, y luego mírala convertirse en un solo ejemplo de entrenamiento.",
      ],
      cardLabel: "CONSIGNA → TRAZA DE RAZONAMIENTO → RESPUESTA",
      aria: "Una cadena vertical que crece desde una consigna, por pasos de razonamiento, hasta una respuesta verificada.",
      steps: 5,
      captions: [
        "Solo-la-respuesta: el modelo ve solo la pregunta y la respuesta final — nunca aprende cómo llegar.",
        "Paso 1 — resta 6 en ambos lados: 2x = 14. El primer movimiento ya es explícito.",
        "Paso 2 — divide entre 2 ambos lados: x = 7. Cada línea se sigue de la anterior.",
        "Paso 3 — comprueba: 2·7 + 6 = 20. ✓ La traza verifica su propia respuesta.",
        "La traza entera es un solo ejemplo de entrenamiento — ahora el modelo aprende el procedimiento, no solo el resultado.",
      ],
      hint: "Avanza paso a paso — cada movimiento revela una línea de la solución resuelta.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Genera mucho, conserva solo lo que pasa",
      intro: "Generar es barato y a menudo sale mal, así que el modelo hace muchos intentos y un verificador tira los malos. Solo las muestras que pasan se vuelven datos de entrenamiento — ese filtrado se llama *muestreo por rechazo*.",
      bullets: [
        "**Cada candidato corre una carrera de obstáculos** de controles automáticos antes de entrar al conjunto de datos.",
        "**Control de formato** — ¿tiene la forma correcta: JSON válido, todos los campos, sin cortarse?",
        "**Pruebas / ejecución** — para código y matemáticas, ejecútalo de verdad: ¿da el resultado correcto?",
        "**Juez LLM** — un modelo fuerte puntúa la calidad y corta las bajas. Solo se conservan los sobrevivientes.",
      ],
      cardLabel: "EMBUDO DE MUESTREO POR RECHAZO",
      aria: "Un embudo: doce candidatos generados que se estrechan por tres puertas de verificación hasta los pocos conservados.",
      steps: 1,
      captions: ["Enciende y apaga los verificadores — cada puerta descarta los candidatos que fallan, y solo se conservan los sobrevivientes."],
      hint: "Alterna los tres verificadores — mira el embudo estrecharse a medida que cada uno rechaza más.",
      readoutTitle: "",
      rows: [],
      sliderNote: "Los tres verificadores están encendidos — el montaje realista. Solo 5 de 12 candidatos sobreviven. Apaga uno para dejar pasar más basura.",
      optionNotes: [
        "Control de formato — rechaza lo malformado: JSON incorrecto, campos faltantes, salida cortada. El filtro más barato, por eso va primero.",
        "Pruebas — ejecuta de verdad el código o la matemática contra casos conocidos. Corrección verificable, sin opiniones.",
        "Juez LLM — un modelo fuerte puntúa la calidad de 0 a 10 y corta lo que baja de 7. Detecta lo que las pruebas no: claridad, utilidad, seguridad.",
      ],
    },
  ],
  n1ops: ["Añadir restricciones", "Profundizar", "Hacer concreta", "Exigir pasos"],
  n1seedLabel: "SEMILLA",
  n1seed: "Invierte una cadena.",
  n1harderTag: "MÁS DIFÍCIL",
  n2nodeTitles: ["Consigna", "Paso 1", "Paso 2", "Paso 3", "Respuesta"],
  n2snippets: ["Resuelve 2x + 6 = 20", "2x = 14", "x = 7", "2·7 + 6 = 20 ✓", "x = 7"],
  n2answerOnly: "solo la respuesta",
  n2traceTag: "un ejemplo de entrenamiento",
  n3verifiers: ["Formato", "Pruebas", "Juez LLM ≥7"],
  n3gateNames: ["FORMATO", "PRUEBAS", "JUEZ ≥7"],
  n3genLabel: "GENERADOS",
  n3keptLabel: "CONSERVADOS",
  n3dropWord: "descartados",
  n3toSet: "→ conjunto de entrenamiento",
  n3skipped: "off",
  n3reasons: ["mal formato", "fallan pruebas", "puntaje bajo"],
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Si un modelo genera sus propios datos de entrenamiento, ¿cómo lo hace eso más listo de lo que ya es — no es solo repetirse a sí mismo?",
  explainA: "Porque lo difícil no es *generar*, es *seleccionar*. El modelo puede soltar muchos intentos barato, pero un verificador — pruebas, un juez, un control de formato — conserva solo los que de verdad son correctos. Filtrar a esa minoría verificada destila un conjunto más limpio y difícil del que el modelo produce con fiabilidad por sí solo, y **evolucionar las consignas** empuja las preguntas más allá del set semilla fácil. No se repite — lo levanta su propio mejor trabajo, ya comprobado (y a menudo un modelo *maestro* más fuerte). Generar es fácil; **la verificación es de donde sale la señal**.",
  bridgeLabel: "SIGUIENTE: MODELO DE RECOMPENSA",
  bridgeBody: "Un verificador da un sí/no limpio, pero la mayoría de las respuestas no son correctas-o-incorrectas — una es simplemente *mejor* que otra. Sigue **el modelo de recompensa**: cómo una red aprende la preferencia humana a partir de elecciones A-vs-B, para puntuar respuestas que ninguna regla podría comprobar.",
  prevLesson: "Atrás: fine-tuning supervisado",
  nextLesson: "Continuar al modelo de recompensa",
};
