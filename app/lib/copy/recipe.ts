/**
 * Stage 0 · Phase 0.5 — Data recipe & synthetic expansion. Interface + EN/ES
 * copy for the article, isolated from every other lesson.
 */
import type { WsNodeCopy } from "./shared";


export interface RecipeLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the domain mixer
  n1presets: string[]; //   Raw / Balanced / Reasoner / Extreme STEM
  n1domains: string[]; //   Web / Code / Math / Books (slider labels)
  n1natural: string; //     "NATURAL WEB" bar label
  n1yours: string; //       "YOUR RECIPE" bar label
  n1driftWarn: string; //   drift frame label
  n1driftNote: string; //   note shown when the mix drifts
  // Node 2 — temperature sampling
  n2slider: string; //      "DOMAIN TEMPERATURE (τ)"
  n2natLabel: string; //    natural-freq bar label
  n2adjLabel: string; //    sampled-prob bar label
  n2mathTitle: string;
  n2mathBody: string;
  // Node 3 — the epoch cliff
  n3slider: string; //      "EPOCH CAP"
  n3budget: string; //      "TOKEN BUDGET (T)"
  n3safe: string; //        safe-cap line label
  n3cliff: string; //       memorization-zone label
  n3axisX: string; //       "epochs"
  n3axisY: string; //       "validation loss"
  // Node 4 — synthetic expansion
  n4modes: string[]; //     Paraphrase / Full textbook rewrite
  n4seedVol: string; //     "SEED TOKENS (B)"
  n4factor: string; //      "EXPANSION FACTOR"
  n4seedLabel: string; //   uncurated-seed panel label
  n4outLabel: string; //    generated-textbook panel label
  // Node 5 — the 3-gate audit
  n5gates: string[]; //     Execute / Judge / Decontaminate
  n5docLabels: string[]; // Clean / Buggy / Leak
  n5buffer: string; //      "CLEAN BUFFER"
  n5drop: string; //        "DROPPED"
  // Node 6 — the final recipe
  n6streams: string[]; //   Web / Code / Math / Synthetic / Books
  n6rawLabel: string; //    raw-web bar label
  n6finalLabel: string; //  frontier-recipe bar label
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const recipeEN: RecipeLesson = {
  crumb: "STAGE 0 · PHASE 0.5 · DATA RECIPE & SYNTHETIC EXPANSION",
  eyebrow: "STAGE 0 · PHASE 0.5 · 6 NODES",
  title: "Data recipe & synthetic expansion",
  lede: "A clean corpus still isn't a training set. This is how a lab decides how much of each kind of text a model sees — upsampling code and math, capping repetition, and manufacturing dense synthetic text when the good stuff runs out.",
  pipelineLabel: "THE 6 STEPS",
  pipeline: ["Why the web mix fails", "Temperature sampling", "The epoch cliff", "Synthetic textbooks", "Verifying synthetic", "Locking the recipe"],
  nodes: [
    {
      eyebrow: "NODE 01 / 06",
      title: "Why the natural web mix fails",
      intro: "The raw web is about 82% general chatter and almost no code or math. Train on it as-is and most of the model's capacity learns to autocomplete blog posts — so labs deliberately rewrite the mix.",
      bullets: [
        "**A data recipe is the exact % of tokens** from each domain a model sees — not the web's natural proportions, but a blend tuned for reasoning per compute dollar.",
        "**Density buys reasoning.** Code and maths are under 5% of the web but carry most of the multi-step logic signal, so labs {ring} upsample them hard.",
        "**But you can't starve general web text.** Drop it below ~15% and language itself degrades — idioms, world knowledge, fluency. Web text is the regularizer that keeps the model writing like a human.",
        "**Four presets to try** — scroll or tap them, then fine-tune the sliders.",
      ],
      cardLabel: "DOMAIN MIX · NATURAL vs YOUR RECIPE",
      aria: "Two stacked bars comparing the natural web domain mix against the target recipe you are building.",
      steps: 1,
      captions: ["The natural web mix beside the recipe you're building — reasoning density on one side, language health on the other."],
      hint: "Drag the four shares (they renormalise to 100%) or scroll the presets — push code + maths past 80% and linguistic drift trips.",
      readoutTitle: "RECIPE_METRICS",
      rows: ["REASONING", "LANGUAGE PPL", "MAX EPOCHS", "STATUS"],
      readoutNote: "Your mix scored: reasoning density (higher is better), held-out language perplexity (~11 is healthy, rises as web starves), and the safe epoch ceiling before scarce domains repeat too hard.",
      sliderNote: "Each share is a slice of the token budget; they renormalise to 100%. Web text is your language regularizer — keep it above ~15% or fluency degrades.",
      optionNotes: [
        "Raw unfiltered crawl — the web's natural proportions. Fluent, but almost no reasoning signal — the baseline everyone upsamples away from.",
        "Balanced recipe — a Llama-3-style blend: web trimmed to ~20%, code, maths and books lifted. High reasoning, language still healthy.",
        "Reasoner recipe — a DeepSeek-style push with even more code and maths. Sharp reasoning, but web is getting thin.",
        "Extreme STEM — code and maths crowd out everything. Reasoning peaks, but language drifts and the model forgets how to write a sentence.",
      ],
    },
    {
      eyebrow: "NODE 02 / 06",
      title: "One knob that reshapes the mix",
      intro: "You've set target percentages — but the data loader draws from huge per-domain buckets in real time. A single parameter, domain temperature τ, bends the natural frequencies toward your target.",
      bullets: [
        "**τ = 1 samples the web as-is** — general text drowns everything, about 80% of every batch.",
        "**Lower τ flattens the distribution** toward uniform, so rare buckets like {ring} maths and code get drawn far more often than their natural share.",
        "**It's the opposite of inference temperature.** There, higher = more random output; here, lower τ = more balanced domains. The formula's in *Go deeper*.",
      ],
      cardLabel: "SAMPLED PROBABILITY vs TEMPERATURE",
      aria: "Grouped bars showing each domain's natural token frequency versus the probability it is sampled at after temperature scaling.",
      steps: 1,
      captions: ["Each domain's natural frequency beside the probability it's actually sampled at, as you cool the temperature."],
      hint: "Cool τ from 1.0 toward 0.1 — watch code and maths climb from a sliver to a real share while web shrinks.",
      readoutTitle: "SAMPLING_ENGINE",
      rows: ["TEMPERATURE", "CODE  p→q", "MATH  p→q", "WEB  p→q"],
      readoutNote: "How temperature reweights the draw: each domain's natural frequency (p) and the probability it's sampled at (q). Lower τ lifts the rare, high-value domains.",
      sliderNote: "τ is a single dial from natural (1.0) to uniform (→0). Lower it to boost scarce domains; too low and web text — your fluency source — gets under-sampled.",
    },
    {
      eyebrow: "NODE 03 / 06",
      title: "How often can you reuse a token?",
      intro: "Upsample maths hard enough and you exhaust the unique maths tokens before the compute budget is spent — so the loader repeats them. A little repetition helps; too much memorises.",
      bullets: [
        "**One dense token beats one noisy token** — a LaTeX proof teaches more per pass than a promo blurb, so reusing it up to ~2× is a net win.",
        "**Past ~2–3 reuses the curve turns.** The model starts memorising the exact text instead of the pattern; {ring} validation loss (its score on fresh, unseen text) spikes and training gets unstable.",
        "**Labs set a hard epoch cap** (≈1.5–2×). When a scarce human domain hits it, you either stop upsampling — or manufacture more, which is the next node.",
      ],
      cardLabel: "VALIDATION LOSS vs EPOCHS",
      aria: "A validation-loss curve that descends smoothly, then spikes upward once training passes a safe epoch cap.",
      steps: 1,
      captions: ["Validation loss as the scarce domain is reused — a smooth descent, then a memorization spike once you pass the safe cap."],
      hint: "Slide the epoch cap — keep it at or below 2× and the curve stays in the green; push toward 4× and it spikes into memorization.",
      readoutTitle: "REPETITION_AUDIT",
      rows: ["EPOCH CAP", "STABILITY", "TOKEN DEFICIT", "ACTION"],
      readoutNote: "Your cap, evaluated on the scarce code domain: whether training stays stable, how many unique tokens you're still short of the budget, and what that shortfall forces.",
      sliderNote: "The epoch cap is the most times any one token may be reused. Below ~2× it sharpens dense domains; above it the model memorises and validation loss climbs.",
    },
    {
      eyebrow: "NODE 04 / 06",
      title: "Manufacturing more high-density text",
      intro: "When the human supply of dense text runs dry and epoch caps block more reuse, labs make more — a frontier model rewrites messy web pages into clean, textbook-style prose.",
      bullets: [
        "**Pick a messy seed** — a rambling blog post that contains real knowledge but reads like a forum comment.",
        "**A teacher model rewrites it** into a structured chapter: definitions, worked steps, exercises, clean code. Microsoft's [Phi](https://arxiv.org/abs/2306.11644) and Hugging Face's [Cosmopedia](https://huggingface.co/blog/cosmopedia) did exactly this.",
        "**One seed becomes many dense tokens** — the same facts at far higher {ring} educational density, for a teacher-API cost you can budget.",
      ],
      cardLabel: "WEB SEED → TEACHER MODEL → TEXTBOOK",
      aria: "A messy web seed beside the clean textbook chapter a teacher model generates from it.",
      steps: 1,
      captions: ["The uncurated seed on the left; the generated textbook chapter on the right — same topic, rebuilt for density."],
      hint: "Switch Paraphrase vs Full textbook rewrite, and size the run — keep the teacher-API cost under the $100k budget.",
      readoutTitle: "GENERATION_YIELD",
      rows: ["SEED IN", "SYNTHETIC OUT", "DENSITY", "COST"],
      readoutNote: "The generation run: seed tokens in, synthetic tokens out, the educational-density score of the output, and the teacher-API bill against a $100k budget.",
      optionNotes: [
        "Simple paraphrase — reword the seed. Cheap, but it inherits the seed's gaps and adds little density.",
        "Full textbook rewrite — restructure into a self-contained chapter with definitions, steps and exercises. Higher density: the Phi approach.",
      ],
    },
    {
      eyebrow: "NODE 05 / 06",
      title: "Synthetic text is guilty until verified",
      intro: "A teacher model also hallucinates, reasons in circles, and can accidentally reproduce a benchmark question. Pour that into pre-training and you poison the student — so every synthetic doc runs a gauntlet.",
      bullets: [
        "**Gate 1 · Execute it.** Any code or maths must actually run — Python execution, unit tests, a [SymPy](https://www.sympy.org) solver. Broken snippets drop.",
        "**Gate 2 · Judge it.** A cheap classifier ([LLM-as-judge](https://arxiv.org/abs/2306.05685)) scores clarity and depth; low-density filler drops.",
        "**Gate 3 · Decontaminate it.** An n-gram scan against {ring} GSM8K, HumanEval and MMLU drops anything that leaked a test question — the difference between a real score and a fraud.",
      ],
      cardLabel: "SYNTHETIC AUDIT · 3 GATES",
      aria: "Synthetic documents passing through execute, judge, and decontaminate gates into a clean buffer, with failures dropping out.",
      steps: 3,
      captions: [
        "A clean, verified chapter runs the gauntlet — it passes all three gates and lands in the buffer.",
        "A snippet with a syntax error hits gate 1, throws on execution, and drops.",
        "A doc that reproduced a benchmark question is caught by the n-gram scan at gate 3.",
      ],
      hint: "Scroll through the three synthetic docs, or toggle the gates off — watch a broken snippet or a leaked benchmark slip into the clean buffer.",
      readoutTitle: "AUDIT_SUMMARY",
      rows: ["EVALUATED", "EXEC-DROPPED", "CONTAM-DROPPED", "CLEAN YIELD"],
      readoutNote: "The audit over 50B synthetic tokens: how much each gate dropped and the clean share that reaches pre-training. Any surviving benchmark leak is a hard fail.",
      optionNotes: [
        "Clean chapter — a verified textbook section. It runs, scores well, and matches no benchmark, so it sails into the buffer.",
        "Buggy code — a snippet with a syntax error. Gate 1 executes it, it throws, and it's dropped before it can teach the model wrong code.",
        "Benchmark leak — the teacher reproduced a GSM8K problem verbatim. Gate 3's n-gram scan catches it; letting it through would inflate every eval.",
      ],
    },
    {
      eyebrow: "NODE 06 / 06",
      title: "Locking the recipe",
      intro: "Real and synthetic streams are clean, deduplicated, and verified. The last step blends all five into one multi-trillion-token schedule the trainer reads start to finish.",
      bullets: [
        "**Five streams, one budget.** Web, code, maths, synthetic textbooks, and books / Q&A — each a fixed slice of a ~15-trillion-token schedule.",
        "**Synthetic now stands beside human data** — verified dense text earns a real share, not a footnote.",
        "**This is the hand-off to Phase 0.6:** the {ring} locked mix goes to pre-tokenization and binary serialization — the `.bin`/`.idx` files the GPUs stream.",
      ],
      cardLabel: "FINAL RECIPE · RAW WEB vs FRONTIER",
      aria: "Two stacked bars comparing the free raw-web mix against the final five-stream frontier recipe.",
      steps: 1,
      captions: ["What you'd get free from the raw web beside the recipe you engineered — same token budget, very different model."],
      hint: "Set the five shares (they renormalise to 100%) — aim for an estimated benchmark above 88 while keeping web as the language anchor.",
      readoutTitle: "MASTER_RECIPE",
      rows: ["TOTAL", "EST. BENCHMARK", "EFFICIENCY", "STATUS"],
      readoutNote: "Your locked mix mapped onto 15 trillion tokens: the estimated benchmark score, compute efficiency (reasoning per FLOP), and whether it's cleared for training.",
      sliderNote: "Each slider is a stream's share of the 15T-token budget; they renormalise to 100%. Synthetic and code/maths lift the benchmark; web keeps the language grounded.",
    },
  ],
  n1presets: ["Raw crawl", "Balanced", "Reasoner", "Extreme STEM"],
  n1domains: ["Web", "Code", "Maths", "Books"],
  n1natural: "NATURAL WEB",
  n1yours: "YOUR RECIPE",
  n1driftWarn: "LINGUISTIC DRIFT · web text starved",
  n1driftNote: "Linguistic drift: general web text is too thin to hold language together. Reasoning may look high, but fluency, idioms and world knowledge are degrading — lift web back above ~15%.",
  n2slider: "DOMAIN TEMPERATURE (τ)",
  n2natLabel: "NATURAL  pᵢ",
  n2adjLabel: "SAMPLED  qᵢ",
  n2mathTitle: "Go deeper: the sampling formula",
  n2mathBody: "Let `pᵢ` be domain *i*'s natural share. Under temperature `τ`, the sampled probability is `qᵢ = pᵢ^τ / Σⱼ pⱼ^τ`. At `τ = 1` this is just `pᵢ` — sample the web as it is. As `τ → 0` every `pᵢ^τ → 1`, so `qᵢ →` uniform, and a rare domain like maths gets the same weight as web. Frontier recipes sit around `τ ≈ 0.3–0.7`.",
  n3slider: "EPOCH CAP (max reuse)",
  n3budget: "TOKEN BUDGET (T)",
  n3safe: "SAFE CAP ≤ 2×",
  n3cliff: "MEMORIZATION",
  n3axisX: "epochs (token reuse)",
  n3axisY: "validation loss",
  n4modes: ["Simple paraphrase", "Full textbook rewrite"],
  n4seedVol: "SEED TOKENS (B)",
  n4factor: "EXPANSION FACTOR",
  n4seedLabel: "UNCURATED WEB SEED",
  n4outLabel: "SYNTHETIC TEXTBOOK · generated",
  n5gates: ["Execute code & maths", "Quality judge", "Benchmark scan"],
  n5docLabels: ["Clean chapter", "Buggy code", "Benchmark leak"],
  n5buffer: "CLEAN BUFFER",
  n5drop: "DROPPED",
  n6streams: ["Web", "Code", "Maths", "Synthetic", "Books"],
  n6rawLabel: "RAW WEB · free",
  n6finalLabel: "FRONTIER RECIPE",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A lab already has far more than 15 trillion real web tokens. Why spend part of a fixed compute budget generating synthetic textbooks instead of just training on more of the web it already has?",
  explainA: "Because not all tokens teach equally. Raw-web tokens are mostly low-density chatter a model barely learns from, and the genuinely dense human text — code, proofs, textbooks — runs out long before the budget does. Synthetic expansion spends compute to convert cheap, messy knowledge into dense, verified, textbook-grade tokens — buying reasoning signal per training step that the raw web simply doesn't contain. It's the same logic as the whole recipe: past a point you're not paying for *more* tokens, you're paying for the *right* tokens.",
  bridgeLabel: "NEXT: 0.6 · BIN-PACKING & SERIALIZATION",
  bridgeBody: "The recipe is locked — a 15-trillion-token mix of real and synthetic text. Next, **bin-packing & binary serialization**: how those tokens are pre-tokenized once, stitched with EOS markers, packed into zero-waste batches, and memory-mapped into the `.bin`/`.idx` files the GPUs stream during training.",
  prevLesson: "Back to 0.4",
  nextLesson: "0.6 coming soon",
};

export const recipeES: RecipeLesson = {
  crumb: "ETAPA 0 · FASE 0.5 · RECETA DE DATOS Y EXPANSIÓN SINTÉTICA",
  eyebrow: "ETAPA 0 · FASE 0.5 · 6 NODOS",
  title: "Receta de datos y expansión sintética",
  lede: "Un corpus limpio todavía no es un conjunto de entrenamiento. Así decide un laboratorio cuánto de cada tipo de texto ve un modelo — sobremuestreando código y matemáticas, limitando la repetición y fabricando texto sintético denso cuando el bueno se acaba.",
  pipelineLabel: "LOS 6 PASOS",
  pipeline: ["Por qué falla la mezcla web", "Muestreo por temperatura", "El precipicio de épocas", "Libros de texto sintéticos", "Verificar lo sintético", "Fijar la receta"],
  nodes: [
    {
      eyebrow: "NODO 01 / 06",
      title: "Por qué falla la mezcla natural de la web",
      intro: "La web cruda es cerca del 82% de charla general y casi nada de código o matemáticas. Entrena con ella tal cual y la mayor parte de la capacidad del modelo aprende a autocompletar posts de blog — por eso los laboratorios reescriben la mezcla a propósito.",
      bullets: [
        "**Una receta de datos es el % exacto de tokens** de cada dominio que ve un modelo — no las proporciones naturales de la web, sino una mezcla ajustada para razonar por dólar de cómputo.",
        "**La densidad compra razonamiento.** Código y matemáticas son menos del 5% de la web pero cargan la mayor parte de la señal de lógica de varios pasos, así que los laboratorios los {ring} sobremuestrean con fuerza.",
        "**Pero no puedes matar de hambre al texto web general.** Bájalo del ~15% y el lenguaje mismo se degrada — modismos, conocimiento del mundo, fluidez. El texto web es el regularizador que mantiene al modelo escribiendo como un humano.",
        "**Cuatro presets para probar** — desplázate o tócalos, luego ajusta los deslizadores.",
      ],
      cardLabel: "MEZCLA DE DOMINIOS · NATURAL vs TU RECETA",
      aria: "Dos barras apiladas que comparan la mezcla natural de dominios de la web con la receta objetivo que estás construyendo.",
      steps: 1,
      captions: ["La mezcla natural de la web junto a la receta que construyes — densidad de razonamiento de un lado, salud del lenguaje del otro."],
      hint: "Arrastra las cuatro cuotas (se renormalizan a 100%) o desplaza los presets — sube código + matemáticas por encima del 80% y se dispara la deriva lingüística.",
      readoutTitle: "MÉTRICAS_RECETA",
      rows: ["RAZONAMIENTO", "PPL LENGUAJE", "ÉPOCAS MÁX", "ESTADO"],
      readoutNote: "Tu mezcla puntuada: densidad de razonamiento (más es mejor), perplejidad del lenguaje en validación (~11 es sano, sube cuando la web se adelgaza) y el techo seguro de épocas antes de que los dominios escasos se repitan demasiado.",
      sliderNote: "Cada cuota es una porción del presupuesto de tokens; se renormalizan a 100%. El texto web es tu regularizador del lenguaje — mantenlo por encima del ~15% o la fluidez se degrada.",
      optionNotes: [
        "Rastreo crudo sin filtrar — las proporciones naturales de la web. Fluido, pero casi sin señal de razonamiento — la base de la que todos se alejan sobremuestreando.",
        "Receta equilibrada — una mezcla estilo Llama-3: web recortada al ~20%, con más código, matemáticas y libros. Razonamiento alto, lenguaje aún sano.",
        "Receta razonadora — un empuje estilo DeepSeek con aún más código y matemáticas. Razonamiento afilado, pero la web se adelgaza.",
        "STEM extremo — código y matemáticas desplazan todo lo demás. El razonamiento llega al tope, pero el lenguaje deriva y el modelo olvida cómo escribir una frase.",
      ],
    },
    {
      eyebrow: "NODO 02 / 06",
      title: "Un solo mando que rehace la mezcla",
      intro: "Ya fijaste los porcentajes objetivo — pero el cargador de datos extrae de enormes cubos por dominio en tiempo real. Un único parámetro, la temperatura de dominio τ, dobla las frecuencias naturales hacia tu objetivo.",
      bullets: [
        "**τ = 1 muestrea la web tal cual** — el texto general ahoga todo lo demás, cerca del 80% de cada lote.",
        "**Bajar τ aplana la distribución** hacia lo uniforme, así que cubos raros como {ring} matemáticas y código se extraen mucho más que su cuota natural.",
        "**Es lo contrario de la temperatura de inferencia.** Allí, más alta = salida más aleatoria; aquí, τ más baja = dominios más equilibrados. La fórmula está en *Más a fondo*.",
      ],
      cardLabel: "PROBABILIDAD MUESTREADA vs TEMPERATURA",
      aria: "Barras agrupadas que muestran la frecuencia natural de tokens de cada dominio frente a la probabilidad con que se muestrea tras escalar la temperatura.",
      steps: 1,
      captions: ["La frecuencia natural de cada dominio junto a la probabilidad con que se muestrea de verdad, mientras enfrías la temperatura."],
      hint: "Enfría τ de 1.0 hacia 0.1 — mira cómo código y matemáticas suben de una astilla a una cuota real mientras la web se encoge.",
      readoutTitle: "MOTOR_MUESTREO",
      rows: ["TEMPERATURA", "CÓDIGO  p→q", "MATES  p→q", "WEB  p→q"],
      readoutNote: "Cómo la temperatura repondera la extracción: la frecuencia natural de cada dominio (p) y la probabilidad con que se muestrea (q). Una τ más baja levanta los dominios raros y valiosos.",
      sliderNote: "τ es un único mando de natural (1.0) a uniforme (→0). Bájalo para impulsar dominios escasos; demasiado bajo y el texto web — tu fuente de fluidez — queda submuestreado.",
    },
    {
      eyebrow: "NODO 03 / 06",
      title: "¿Cuántas veces puedes reusar un token?",
      intro: "Sobremuestrea matemáticas con suficiente fuerza y agotarás los tokens únicos de matemáticas antes de gastar el presupuesto de cómputo — así que el cargador los repite. Un poco de repetición ayuda; demasiada memoriza.",
      bullets: [
        "**Un token denso vale más que uno ruidoso** — una demostración en LaTeX enseña más por pasada que un anuncio, así que reusarla hasta ~2× es una ganancia neta.",
        "**Pasados ~2–3 reúsos la curva se voltea.** El modelo empieza a memorizar el texto exacto en vez del patrón; {ring} la pérdida de validación (su nota en texto nuevo) se dispara y el entrenamiento se vuelve inestable.",
        "**Los laboratorios fijan un tope duro de épocas** (≈1.5–2×). Cuando un dominio humano escaso lo alcanza, o dejas de sobremuestrear — o fabricas más, que es el siguiente nodo.",
      ],
      cardLabel: "PÉRDIDA DE VALIDACIÓN vs ÉPOCAS",
      aria: "Una curva de pérdida de validación que baja suavemente y luego se dispara al pasar un tope seguro de épocas.",
      steps: 1,
      captions: ["La pérdida de validación mientras el dominio escaso se reutiliza — un descenso suave y luego un pico de memorización al pasar el tope seguro."],
      hint: "Desliza el tope de épocas — mantenlo en 2× o menos y la curva se queda en verde; empújalo hacia 4× y se dispara hacia la memorización.",
      readoutTitle: "AUDITORÍA_REPETICIÓN",
      rows: ["TOPE ÉPOCAS", "ESTABILIDAD", "DÉFICIT TOKENS", "ACCIÓN"],
      readoutNote: "Tu tope, evaluado en el dominio escaso de código: si el entrenamiento sigue estable, cuántos tokens únicos te faltan aún para el presupuesto, y qué fuerza ese déficit.",
      sliderNote: "El tope de épocas es el máximo de veces que puede reusarse un token. Por debajo de ~2× afila los dominios densos; por encima el modelo memoriza y la pérdida de validación sube.",
    },
    {
      eyebrow: "NODO 04 / 06",
      title: "Fabricar más texto de alta densidad",
      intro: "Cuando la oferta humana de texto denso se seca y los topes de épocas bloquean más reutilización, los laboratorios hacen más — un modelo puntero reescribe páginas web desordenadas en prosa limpia de estilo libro de texto.",
      bullets: [
        "**Elige una semilla desordenada** — un post de blog divagante que contiene conocimiento real pero se lee como un comentario de foro.",
        "**Un modelo maestro lo reescribe** en un capítulo estructurado: definiciones, pasos resueltos, ejercicios, código limpio. [Phi](https://arxiv.org/abs/2306.11644) de Microsoft y [Cosmopedia](https://huggingface.co/blog/cosmopedia) de Hugging Face hicieron justo esto.",
        "**Una semilla se vuelve muchos tokens densos** — los mismos hechos con mucha mayor {ring} densidad educativa, por un costo de API del maestro que puedes presupuestar.",
      ],
      cardLabel: "SEMILLA WEB → MODELO MAESTRO → LIBRO DE TEXTO",
      aria: "Una semilla web desordenada junto al capítulo limpio de libro de texto que un modelo maestro genera a partir de ella.",
      steps: 1,
      captions: ["La semilla sin curar a la izquierda; el capítulo de libro de texto generado a la derecha — mismo tema, reconstruido para densidad."],
      hint: "Cambia entre Parafraseo y Reescritura completa, y dimensiona la corrida — mantén el costo de API del maestro bajo el presupuesto de $100k.",
      readoutTitle: "RENDIMIENTO_GENERACIÓN",
      rows: ["SEMILLA", "SINTÉTICO", "DENSIDAD", "COSTO"],
      readoutNote: "La corrida de generación: tokens semilla que entran, tokens sintéticos que salen, la puntuación de densidad educativa de la salida, y la factura de API del maestro frente a un presupuesto de $100k.",
      optionNotes: [
        "Parafraseo simple — reformular la semilla. Barato, pero hereda los huecos de la semilla y añade poca densidad.",
        "Reescritura completa — reestructurar en un capítulo autocontenido con definiciones, pasos y ejercicios. Mayor densidad: el enfoque de Phi.",
      ],
    },
    {
      eyebrow: "NODO 05 / 06",
      title: "Lo sintético es culpable hasta verificarse",
      intro: "Un modelo maestro también alucina, razona en círculos y puede reproducir sin querer una pregunta de benchmark. Vierte eso en el preentrenamiento y envenenas al estudiante — así que cada documento sintético pasa una prueba de fuego.",
      bullets: [
        "**Puerta 1 · Ejecutarlo.** Todo código o matemática debe correr de verdad — ejecución de Python, tests unitarios, un solucionador [SymPy](https://www.sympy.org). Los fragmentos rotos caen.",
        "**Puerta 2 · Juzgarlo.** Un clasificador barato ([LLM-como-juez](https://arxiv.org/abs/2306.05685)) puntúa claridad y profundidad; el relleno de baja densidad cae.",
        "**Puerta 3 · Descontaminarlo.** Un escaneo de n-gramas contra {ring} GSM8K, HumanEval y MMLU descarta lo que filtró una pregunta de test — la diferencia entre una puntuación real y un fraude.",
      ],
      cardLabel: "AUDITORÍA SINTÉTICA · 3 PUERTAS",
      aria: "Documentos sintéticos pasando por las puertas de ejecutar, juzgar y descontaminar hacia un búfer limpio, con los fallos cayendo fuera.",
      steps: 3,
      captions: [
        "Un capítulo limpio y verificado corre la prueba — pasa las tres puertas y aterriza en el búfer.",
        "Un fragmento con error de sintaxis choca con la puerta 1, lanza excepción al ejecutarse, y cae.",
        "Un documento que reprodujo una pregunta de benchmark es atrapado por el escaneo de n-gramas en la puerta 3.",
      ],
      hint: "Desplázate por los tres documentos sintéticos, o apaga las puertas — mira cómo un fragmento roto o un benchmark filtrado se cuela en el búfer limpio.",
      readoutTitle: "RESUMEN_AUDITORÍA",
      rows: ["EVALUADOS", "FUERA-EJEC", "FUERA-CONTAM", "RENDIM. LIMPIO"],
      readoutNote: "La auditoría sobre 50 mil millones de tokens sintéticos: cuánto descartó cada puerta y la cuota limpia que llega al preentrenamiento. Cualquier filtración de benchmark que sobreviva es un fallo grave.",
      optionNotes: [
        "Capítulo limpio — una sección de libro de texto verificada. Corre, puntúa bien y no coincide con ningún benchmark, así que entra al búfer.",
        "Código con bugs — un fragmento con error de sintaxis. La puerta 1 lo ejecuta, lanza excepción, y se descarta antes de enseñar código erróneo al modelo.",
        "Benchmark filtrado — el maestro reprodujo un problema de GSM8K textual. El escaneo de n-gramas de la puerta 3 lo atrapa; dejarlo pasar inflaría cada evaluación.",
      ],
    },
    {
      eyebrow: "NODO 06 / 06",
      title: "Fijar la receta",
      intro: "Los flujos reales y sintéticos están limpios, deduplicados y verificados. El último paso mezcla los cinco en un solo calendario de billones de tokens que el entrenador lee de principio a fin.",
      bullets: [
        "**Cinco flujos, un presupuesto.** Web, código, matemáticas, libros de texto sintéticos y libros / preguntas-respuestas — cada uno una porción fija de un calendario de ~15 billones de tokens.",
        "**Lo sintético ahora se codea con los datos humanos** — el texto denso verificado gana una cuota real, no una nota al pie.",
        "**Este es el relevo a la Fase 0.6:** la {ring} mezcla fijada pasa a la pre-tokenización y la serialización binaria — los archivos `.bin`/`.idx` que las GPUs transmiten.",
      ],
      cardLabel: "RECETA FINAL · WEB CRUDA vs FRONTERA",
      aria: "Dos barras apiladas que comparan la mezcla gratuita de web cruda con la receta final de frontera de cinco flujos.",
      steps: 1,
      captions: ["Lo que obtendrías gratis de la web cruda junto a la receta que diseñaste — mismo presupuesto de tokens, un modelo muy distinto."],
      hint: "Fija las cinco cuotas (se renormalizan a 100%) — apunta a un benchmark estimado sobre 88 manteniendo la web como ancla del lenguaje.",
      readoutTitle: "RECETA_MAESTRA",
      rows: ["TOTAL", "BENCHMARK EST.", "EFICIENCIA", "ESTADO"],
      readoutNote: "Tu mezcla fijada mapeada sobre 15 billones de tokens: la puntuación de benchmark estimada, la eficiencia de cómputo (razonamiento por FLOP) y si está aprobada para entrenar.",
      sliderNote: "Cada deslizador es la cuota de un flujo del presupuesto de 15 B de tokens; se renormalizan a 100%. Lo sintético y código/matemáticas suben el benchmark; la web mantiene el lenguaje anclado.",
    },
  ],
  n1presets: ["Rastreo crudo", "Equilibrada", "Razonadora", "STEM extremo"],
  n1domains: ["Web", "Código", "Mates", "Libros"],
  n1natural: "WEB NATURAL",
  n1yours: "TU RECETA",
  n1driftWarn: "DERIVA LINGÜÍSTICA · web famélica",
  n1driftNote: "Deriva lingüística: el texto web general es demasiado escaso para sostener el lenguaje. El razonamiento puede verse alto, pero la fluidez, los modismos y el conocimiento del mundo se degradan — sube la web por encima del ~15%.",
  n2slider: "TEMPERATURA DE DOMINIO (τ)",
  n2natLabel: "NATURAL  pᵢ",
  n2adjLabel: "MUESTREADO  qᵢ",
  n2mathTitle: "Más a fondo: la fórmula de muestreo",
  n2mathBody: "Sea `pᵢ` la cuota natural del dominio *i*. Bajo temperatura `τ`, la probabilidad muestreada es `qᵢ = pᵢ^τ / Σⱼ pⱼ^τ`. En `τ = 1` esto es solo `pᵢ` — muestrear la web tal cual. Cuando `τ → 0` cada `pᵢ^τ → 1`, así que `qᵢ →` uniforme, y un dominio raro como matemáticas recibe el mismo peso que la web. Las recetas de frontera rondan `τ ≈ 0.3–0.7`.",
  n3slider: "TOPE DE ÉPOCAS (reúso máx)",
  n3budget: "PRESUPUESTO TOKENS (T)",
  n3safe: "TOPE SEGURO ≤ 2×",
  n3cliff: "MEMORIZACIÓN",
  n3axisX: "épocas (reúso de tokens)",
  n3axisY: "pérdida de validación",
  n4modes: ["Parafraseo simple", "Reescritura completa"],
  n4seedVol: "TOKENS SEMILLA (B)",
  n4factor: "FACTOR DE EXPANSIÓN",
  n4seedLabel: "SEMILLA WEB SIN CURAR",
  n4outLabel: "LIBRO DE TEXTO SINTÉTICO · generado",
  n5gates: ["Ejecutar código y mates", "Juez de calidad", "Escaneo de benchmarks"],
  n5docLabels: ["Capítulo limpio", "Código con bugs", "Benchmark filtrado"],
  n5buffer: "BÚFER LIMPIO",
  n5drop: "DESCARTADO",
  n6streams: ["Web", "Código", "Mates", "Sintético", "Libros"],
  n6rawLabel: "WEB CRUDA · gratis",
  n6finalLabel: "RECETA DE FRONTERA",
  explainLabel: "EXPLÍCALO TÚ",
  explainQ: "Un laboratorio ya tiene muchos más de 15 billones de tokens web reales. ¿Por qué gastar parte de un presupuesto fijo de cómputo generando libros de texto sintéticos en vez de entrenar con más de la web que ya tiene?",
  explainA: "Porque no todos los tokens enseñan igual. Los tokens de web cruda son sobre todo charla de baja densidad de la que un modelo apenas aprende, y el texto humano genuinamente denso — código, demostraciones, libros de texto — se acaba mucho antes que el presupuesto. La expansión sintética gasta cómputo para convertir conocimiento barato y desordenado en tokens densos, verificados y de calidad de libro de texto — comprando señal de razonamiento por paso de entrenamiento que la web cruda simplemente no contiene. Es la misma lógica que toda la receta: pasado cierto punto no pagas por *más* tokens, pagas por los tokens *correctos*.",
  bridgeLabel: "SIGUIENTE: 0.6 · EMPAQUETADO Y SERIALIZACIÓN",
  bridgeBody: "La receta está fijada — una mezcla de 15 billones de tokens de texto real y sintético. Sigue el **empaquetado (bin-packing) y la serialización binaria**: cómo esos tokens se pre-tokenizan una vez, se cosen con marcadores EOS, se empacan en lotes sin desperdicio, y se mapean en memoria a los archivos `.bin`/`.idx` que las GPUs transmiten durante el entrenamiento.",
  prevLesson: "Volver a 0.4",
  nextLesson: "0.6 próximamente",
};
