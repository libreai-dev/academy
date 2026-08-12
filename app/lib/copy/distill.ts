/**
 * Stage 0 · Phase 4.2 — Model distillation. Interface + EN/ES copy for the
 * article, isolated from every other lesson.
 */
import type { WsNodeCopy } from "./shared";

export interface DistillLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — fit the student
  n1presets: string[]; //   Edge 1B / Laptop 3B / Enterprise 8B
  n1params: string; //      "STUDENT PARAMETERS (B)"
  n1bits: string; //        "WEIGHT PRECISION (bits)"
  n1teacherLabel: string; // teacher bar label
  n1studentLabel: string; // student bar label
  n1budgetLabel: string; //  the VRAM-budget guide line
  n1overLabel: string; //    "OVER BUDGET" warning
  n1overNote: string; //     note when the student overflows the budget
  // Node 2 — soft targets
  n2slider: string; //      "SOFTMAX TEMPERATURE (T)"
  n2hardLabel: string; //   hard-label bar label
  n2softLabel: string; //   soft-target bar label
  n2promptLabel: string; // the prompt shown above the bars
  n2mathTitle: string;
  n2mathBody: string;
  // Node 3 — behavioral cloning
  n3modes: string[]; //     Raw completion / Chain-of-thought
  n3volume: string; //      "SYNTHETIC TOKENS (B)"
  n3rawLabel: string; //    raw-completion panel label
  n3cotLabel: string; //    reasoning-trace panel label
  // Node 4 — on/off policy
  n4toggleOn: string; //    on-policy toggle label
  n4rollout: string; //     "ROLLOUT LENGTH (tokens)"
  n4offPath: string; //     off-policy path label
  n4onPath: string; //      on-policy path label
  n4correct: string; //     "corrected" annotation
  n4diverge: string; //     "compounding error" annotation
  // Node 5 — deployment
  n5hw: string[]; //        On-device / Cloud T4 / CPU gateway
  n5hwLabel: string; //     hardware dropdown label
  n5volume: string; //      "DAILY QUERIES"
  n5cloudLabel: string; //  centralized-API bar label
  n5edgeLabel: string; //   distilled bar label
  // Node 6 — the reasoning floor
  n6slider: string; //      "STUDENT SIZE (B)"
  n6floorLabel: string; //  reasoning-floor region label
  n6sweetLabel: string; //  sweet-spot marker label
  n6axisX: string; //       "student parameters"
  n6axisY: string; //       "reasoning capacity"
  n6teacherLabel: string; // teacher ceiling line label
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ------------------------------------------------------------------ EN ---- */

export const distillEN: DistillLesson = {
  crumb: "STAGE 0 · PHASE 4.2 · MODEL DISTILLATION",
  eyebrow: "STAGE 0 · PHASE 4.2 · 6 NODES",
  title: "Model distillation",
  lede: "A 70-billion-parameter model reasons beautifully and costs a fortune to run. Distillation is how a small model learns from a giant — keeping most of the smarts at a fraction of the memory, latency, and power — so intelligence can run on a laptop, a phone, or a cheap server.",
  pipelineLabel: "THE 6 STEPS",
  pipeline: ["The size bottleneck", "Soft targets", "Behavioral cloning", "On- vs off-policy", "Edge deployment", "The reasoning floor"],
  nodes: [
    {
      eyebrow: "NODE 01 / 06",
      title: "Why a giant can't live on your device",
      intro: "A frontier teacher has tens of billions of parameters. In 16-bit precision each one is 2 bytes, so a 70B model needs ~140 GB of memory just to hold its weights — more than a phone or a single GPU has. Distillation moves that intelligence into a student small enough to fit.",
      bullets: [
        "**Distillation is model compression.** A compact *student* (1–8B) is trained to copy a massive *teacher* (70B+), keeping up to ~90% of its quality for a fraction of the cost.",
        "**The student learns from the teacher, not raw text.** It trains on the teacher's refined outputs instead of rediscovering language from noisy web data — the next five nodes are *how*.",
        "**Two levers shrink the footprint** — fewer parameters, and fewer {ring} bits per parameter (quantization). Both save memory; both cost a little quality.",
        "**Three targets to try** — scroll or tap them, then tune the sliders to fit an 8 GB edge budget.",
      ],
      cardLabel: "MEMORY FOOTPRINT · TEACHER vs STUDENT",
      aria: "Two bars comparing the teacher model's memory footprint against the student you are sizing, with an 8 GB budget line.",
      steps: 1,
      captions: ["The teacher's memory footprint beside the student you're sizing — the whole point of distillation is the gap between them."],
      hint: "Size the student and its precision — keep it under the 8 GB line while holding retention above 82%.",
      readoutTitle: "COMPRESSION_METRICS",
      rows: ["TEACHER", "STUDENT", "VRAM / BUDGET", "RETENTION"],
      readoutNote: "Your student sized against a 70B teacher: memory footprint versus the 8 GB budget, and how much of the teacher's benchmark quality it keeps.",
      optionNotes: [
        "Edge mobile — a 1B student at 8-bit fits in ~1 GB, but 1B is near the floor: it keeps only ~60% of the teacher. Great for simple on-device tasks.",
        "Laptop local — a 3B student at 8-bit is the sweet spot: ~3 GB and ~84% retention, runs comfortably on consumer hardware.",
        "Enterprise API — an 8B student at 4-bit fits in ~4 GB and keeps ~90%. The most capable option that still fits the edge budget.",
      ],
      sliderNote: "Footprint = parameters × bytes-per-parameter, plus ~15% for the KV cache. Fewer bits shrinks memory fast; below 8-bit the quality tax starts to bite.",
    },
    {
      eyebrow: "NODE 02 / 06",
      title: "The teacher's whole answer, not just the winner",
      intro: "Train on human text and the label is one-hot: one word is 100% right, every other word is 0%. But the teacher's softmax has an opinion about *all* of them — and that shape is worth more than the single winner.",
      bullets: [
        "**Soft targets carry \"dark knowledge.\"** For \"the animal crossed the ___\", the teacher knows *road* is close to *street* while *apple* is absurd — structure a one-hot label throws away.",
        "**Temperature T softens the distribution.** T = 1 is spiky; raising T magnifies the {ring} runner-up tokens, so the student sees the whole similarity structure per step, not just the top pick.",
        "**Richer signal, faster learning.** Every token teaches the student about the *entire* vocabulary at once — far more gradient than a single right answer. The formula's in *Go deeper*.",
      ],
      cardLabel: "TEACHER DISTRIBUTION vs TEMPERATURE",
      aria: "A bar chart of the teacher's probability over candidate words, sharpening or flattening as temperature changes.",
      steps: 1,
      captions: ["The teacher's probability over candidate next-words — sharp at T = 1, flattening to reveal the dark knowledge as you warm it up."],
      hint: "Warm the temperature from 1 toward 10 — watch the runner-up words rise from slivers into a real signal while the winner stays the winner.",
      readoutTitle: "SOFT_TARGET_READOUT",
      rows: ["TEMPERATURE", "TOP-1 PROB", "DARK KNOWLEDGE", "ENTROPY"],
      readoutNote: "The teacher's softened answer: the top word's probability, how much mass sits on the runner-ups (the transferable signal), and the distribution's entropy in bits.",
      sliderNote: "T is a single knob that flattens the softmax. Higher T reveals more of the teacher's secondary structure — but push it too far and everything blurs toward uniform.",
    },
    {
      eyebrow: "NODE 03 / 06",
      title: "When you can't see the logits, copy the behavior",
      intro: "Matching soft targets needs the teacher's full vocabulary distribution — impossible across a closed API or a different tokenizer. So most small models learn a cheaper way: the teacher just *writes answers*, and the student imitates them.",
      bullets: [
        "**Sequence-level distillation is plain fine-tuning** on the teacher's generated text — the recipe behind Microsoft's [Phi](https://arxiv.org/abs/2306.11644) and many on-device models.",
        "**Reasoning traces are the secret ingredient.** Ask the teacher to show its work in a {ring} `<thought>` scratchpad and the student learns the *steps*, not just the final answer.",
        "**More generations, better student** — but the jump from raw answers to traced reasoning matters more than sheer volume.",
      ],
      cardLabel: "TEACHER COMPLETION → STUDENT SFT",
      aria: "A bare teacher answer beside the same answer with a step-by-step reasoning trace the student imitates.",
      steps: 2,
      captions: [
        "A bare completion — the teacher gives only the final answer, so the student can copy the answer but not the method.",
        "The same answer with a reasoning trace — now the student imitates the steps that got there.",
      ],
      hint: "Switch Raw completion vs Chain-of-thought, and size the run — watch the traced reasoning lift the student's benchmark far more than volume alone.",
      readoutTitle: "CLONING_SUMMARY",
      rows: ["GENERATED", "TRACES", "STUDENT SCORE", "GEN TIME"],
      readoutNote: "The generation run: how many synthetic tokens the teacher wrote, whether they carry reasoning traces, and the student's resulting benchmark.",
      optionNotes: [
        "Raw completion — the teacher emits only the answer. Cheap to imitate, but the student never sees the reasoning, so hard problems stay out of reach.",
        "Chain-of-thought — the teacher shows its steps in a scratchpad. The student learns the method, and its benchmark jumps for the same token budget.",
      ],
    },
    {
      eyebrow: "NODE 04 / 06",
      title: "The mistake that snowballs",
      intro: "Cloning static text is off-policy: the student only ever reads the teacher's perfect trajectories. But at inference it walks its own path — and one early slip drops it into a state it never trained on, where the next error is even likelier.",
      bullets: [
        "**Off-policy suffers exposure bias.** Independent per-token slips compound, so a long generation drifts far off distribution — this is where hallucinations come from.",
        "**On-policy distillation closes the loop.** The student generates its own rollout, the teacher scores {ring} that exact trajectory, and the student learns to recover from its own mistakes.",
        "**Error stays bounded with length.** Because the teacher corrects the student *on its own path*, a longer sequence no longer means a runaway error rate.",
      ],
      cardLabel: "OFF-POLICY DRIFT vs ON-POLICY CORRECTION",
      aria: "Two trajectories from a prompt: an off-policy path drifting into an error zone, and an on-policy path pulled back on track by teacher feedback.",
      steps: 1,
      captions: ["The same rollout two ways: left to itself it drifts into the error zone; with on-policy feedback the teacher pulls it back onto the reference path."],
      hint: "Turn on on-policy feedback and stretch the rollout — off-policy error climbs with length, on-policy stays flat and low.",
      readoutTitle: "TRAJECTORY_AUDIT",
      rows: ["MODE", "EXPOSURE BIAS", "COMPOUND ERROR", "vs OFF-POLICY"],
      readoutNote: "The end-of-sequence error rate for the chosen mode, next to the off-policy rate at the same rollout length — the gap is what on-policy feedback buys.",
      optionNotes: [
        "Off-policy — the student reads static teacher text and never sees its own mistakes. Early slips compound; the longer the rollout, the worse the drift.",
        "On-policy — the student generates, the teacher grades its actual trajectory, and it learns to recover. Error stays low even on long sequences.",
      ],
    },
    {
      eyebrow: "NODE 05 / 06",
      title: "Where the small model actually earns its keep",
      intro: "A distilled student is the reason intelligence can run cheaply and privately. The same 3B model deploys three very different ways — and the right one depends on what you're optimizing for.",
      bullets: [
        "**On-device** — the model runs on the user's own phone or laptop. Zero API cost, zero network latency, and data that {ring} never leaves the device.",
        "**Cloud GPU** — a single mid-range GPU self-hosts the model for a centralized API, cutting per-call cost versus a frontier provider by an order of magnitude.",
        "**Domain-specialized** — distill a 70B generalist into a 2–3B model that does one job (SQL, triage) as well as the giant, on hardware that costs almost nothing.",
      ],
      cardLabel: "DEPLOYMENT ECONOMICS",
      aria: "Bars comparing a centralized frontier API against a self-hosted distilled model across cost and latency.",
      steps: 1,
      captions: ["A frontier API call beside a self-hosted distilled model — same task, an order-of-magnitude gap in cost and latency."],
      hint: "Pick a deployment target and set the daily volume — check the monthly cost stays under the $500 budget while serving every request.",
      readoutTitle: "DEPLOYMENT_READOUT",
      rows: ["THROUGHPUT", "MONTHLY COST", "LATENCY / QUERY", "STATUS"],
      readoutNote: "The chosen target's decode throughput, monthly infra cost against a $500 budget, and per-query latency for the daily volume you set.",
      optionNotes: [
        "On-device — runs on each user's phone or laptop. $0 infra, full privacy, modest per-device speed. Ideal for personal assistants that must work offline.",
        "Cloud T4 GPU — one mid-range GPU self-hosts a centralized API. High throughput and low latency; the workhorse for a real product at ~$380/month.",
        "CPU edge gateway — a cheap on-prem box. Lowest cost after on-device, but limited throughput — fine for low-volume internal tools.",
      ],
    },
    {
      eyebrow: "NODE 06 / 06",
      title: "What a small model can't fake",
      intro: "Distillation isn't magic. A student copies the teacher's *style* — tone, formatting, transition phrases — long before it earns the teacher's *reasoning*. Shrink too far and you hit limits no amount of synthetic data can fix.",
      bullets: [
        "**Style mimicry flatters shallow tests.** A tiny model sounds like the teacher, so quick evals look great while multi-step logic quietly stays fragile.",
        "**Hallucinations amplify.** With too little capacity to hold deep world knowledge, the student memorizes the teacher's errors and can't self-correct.",
        "**There's a hard reasoning floor.** Below ~2B parameters, complex multi-step logic hits a ceiling regardless of data. The {ring} sweet spot is 3–8B: the most intelligence per byte.",
      ],
      cardLabel: "REASONING CAPACITY vs STUDENT SIZE",
      aria: "A curve of reasoning capacity against student size, flattening into a reasoning-floor region below 2B and marking a 3–8B sweet spot.",
      steps: 1,
      captions: ["Reasoning capacity as a function of size — flat and fragile below the 2B floor, climbing through the 3–8B sweet spot toward the teacher's ceiling."],
      hint: "Slide the student size — stay above the 2B floor and inside the 100 ms latency ceiling to land in the green sweet spot.",
      readoutTitle: "CAPACITY_LIMITS",
      rows: ["SIZE", "REASONING", "LATENCY", "HALLUCINATION"],
      readoutNote: "The selected student's reasoning capacity relative to the 2B floor, its latency against a 100 ms ceiling, and its inherited-hallucination rate.",
      sliderNote: "Reasoning follows an S-curve in size: nearly flat below ~2B, steep through 3–8B, then diminishing. Pick the smallest model that clears the floor for your task.",
    },
  ],
  n1presets: ["Edge mobile 1B", "Laptop local 3B", "Enterprise 8B"],
  n1params: "STUDENT PARAMETERS (B)",
  n1bits: "WEIGHT PRECISION (bits)",
  n1teacherLabel: "TEACHER · 70B",
  n1studentLabel: "STUDENT · yours",
  n1budgetLabel: "8 GB EDGE BUDGET",
  n1overLabel: "OVER BUDGET",
  n1overNote: "Over the 8 GB budget: this student won't load on the target device. Drop a size tier, or quantize to fewer bits — 8-bit halves the footprint of 16-bit, 4-bit halves it again.",
  n2slider: "SOFTMAX TEMPERATURE (T)",
  n2hardLabel: "HARD LABEL",
  n2softLabel: "SOFT TARGET",
  n2promptLabel: 'PROMPT:  "The animal crossed the ___"',
  n2mathTitle: "Go deeper: temperature & the T² rescale",
  n2mathBody: "The teacher's logits `zᵢ` become probabilities with a temperature-scaled softmax: `pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)`. At `T = 1` this is the normal softmax; raising `T` flattens it, lifting the runner-up tokens. The student is trained to match this softened distribution by minimizing the KL divergence `D_KL(teacher ∥ student)`. One subtlety: dividing logits by `T` shrinks the gradients by `1 / T²`, so the distillation loss is multiplied by `T²` to keep it balanced against the ordinary hard-label loss.",
  n3modes: ["Raw completion", "Chain-of-thought"],
  n3volume: "SYNTHETIC TOKENS (B)",
  n3rawLabel: "RAW COMPLETION",
  n3cotLabel: "REASONING TRACE · <thought>",
  n4toggleOn: "On-policy teacher feedback",
  n4rollout: "ROLLOUT LENGTH (tokens)",
  n4offPath: "OFF-POLICY",
  n4onPath: "ON-POLICY",
  n4correct: "corrected",
  n4diverge: "compounding error",
  n5hw: ["On-device", "Cloud T4 GPU", "CPU edge gateway"],
  n5hwLabel: "DEPLOYMENT TARGET",
  n5volume: "DAILY QUERIES",
  n5cloudLabel: "FRONTIER API · per call",
  n5edgeLabel: "DISTILLED · self-hosted",
  n6slider: "STUDENT SIZE (B)",
  n6floorLabel: "REASONING FLOOR",
  n6sweetLabel: "SWEET SPOT 3–8B",
  n6axisX: "student parameters (B)",
  n6axisY: "reasoning capacity",
  n6teacherLabel: "TEACHER CEILING",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A 3B student trained on a teacher's answers scores well on quick evals but falls apart on hard multi-step problems. Given the same teacher and the same 3B student, what's the single most effective change to close that gap — and what can it *not* fix?",
  explainA: "Switch from raw answers to **chain-of-thought traces**, and from **off-policy to on-policy** distillation. Traces teach the student the *steps*, not just the final answer, and on-policy feedback lets the teacher correct the student on its own trajectory — killing the exposure bias that makes long reasoning chains drift. What neither can fix is **capacity**: below the ~2B reasoning floor, no amount of data or clever training buys multi-step logic the parameters can't hold. Distillation moves intelligence into a smaller box; it can't make the box bigger than the reasoning it's asked to store.",
  bridgeLabel: "NEXT: 4.3 · DIRECT PREFERENCE OPTIMIZATION",
  bridgeBody: "Your student is small, fast, and mostly matches the teacher. Next, **DPO & GRPO alignment**: how a distilled model is tuned to human and algorithmic preferences with reference-free reward signals — turning a capable imitator into a model people actually want to talk to.",
  prevLesson: "Back to 0.5",
  nextLesson: "4.3 coming soon",
};

/* ------------------------------------------------------------------ ES ---- */

export const distillES: DistillLesson = {
  crumb: "ETAPA 0 · FASE 4.2 · DESTILACIÓN DE MODELOS",
  eyebrow: "ETAPA 0 · FASE 4.2 · 6 NODOS",
  title: "Destilación de modelos",
  lede: "Un modelo de 70 mil millones de parámetros razona de maravilla y cuesta una fortuna ejecutar. La destilación es cómo un modelo pequeño aprende de uno gigante — conservando casi toda la inteligencia con una fracción de la memoria, la latencia y la energía — para que la inteligencia corra en un portátil, un teléfono o un servidor barato.",
  pipelineLabel: "LOS 6 PASOS",
  pipeline: ["El cuello de botella", "Objetivos suaves", "Clonar la conducta", "On- vs off-policy", "Despliegue en el borde", "El suelo de razonamiento"],
  nodes: [
    {
      eyebrow: "NODO 01 / 06",
      title: "Por qué un gigante no cabe en tu dispositivo",
      intro: "Un profesor de frontera tiene decenas de miles de millones de parámetros. En precisión de 16 bits cada uno ocupa 2 bytes, así que un modelo de 70B necesita ~140 GB de memoria solo para guardar sus pesos — más de lo que tiene un teléfono o una sola GPU. La destilación traslada esa inteligencia a un estudiante lo bastante pequeño para caber.",
      bullets: [
        "**La destilación es compresión de modelos.** Un *estudiante* compacto (1–8B) se entrena para copiar a un *profesor* enorme (70B+), conservando hasta ~90% de su calidad por una fracción del coste.",
        "**El estudiante aprende del profesor, no del texto crudo.** Se entrena con las salidas refinadas del profesor en vez de redescubrir el lenguaje desde datos web ruidosos — los cinco nodos siguientes son el *cómo*.",
        "**Dos palancas reducen la huella** — menos parámetros y menos {ring} bits por parámetro (cuantización). Ambas ahorran memoria; ambas cuestan un poco de calidad.",
        "**Tres objetivos para probar** — deslízalos o tócalos, luego ajusta los controles para caber en un presupuesto de 8 GB.",
      ],
      cardLabel: "HUELLA DE MEMORIA · PROFESOR vs ESTUDIANTE",
      aria: "Dos barras que comparan la huella de memoria del profesor con el estudiante que dimensionas, con una línea de presupuesto de 8 GB.",
      steps: 1,
      captions: ["La huella de memoria del profesor junto al estudiante que dimensionas — el sentido de la destilación es la distancia entre ambos."],
      hint: "Dimensiona el estudiante y su precisión — mantenlo bajo la línea de 8 GB conservando una retención por encima del 82%.",
      readoutTitle: "METRICAS_COMPRESION",
      rows: ["PROFESOR", "ESTUDIANTE", "VRAM / TOPE", "RETENCIÓN"],
      readoutNote: "Tu estudiante frente a un profesor de 70B: la huella de memoria contra el tope de 8 GB, y cuánta de la calidad del profesor conserva.",
      optionNotes: [
        "Móvil de borde — un estudiante de 1B a 8 bits cabe en ~1 GB, pero 1B roza el suelo: conserva solo ~60% del profesor. Bien para tareas simples en el dispositivo.",
        "Portátil local — un estudiante de 3B a 8 bits es el punto ideal: ~3 GB y ~84% de retención, corre cómodo en hardware de consumo.",
        "API empresarial — un estudiante de 8B a 4 bits cabe en ~4 GB y conserva ~90%. La opción más capaz que aún cabe en el presupuesto del borde.",
      ],
      sliderNote: "Huella = parámetros × bytes por parámetro, más ~15% para la caché KV. Menos bits reduce la memoria rápido; por debajo de 8 bits empieza a pesar el coste de calidad.",
    },
    {
      eyebrow: "NODO 02 / 06",
      title: "La respuesta entera del profesor, no solo la ganadora",
      intro: "Al entrenar con texto humano la etiqueta es one-hot: una palabra es 100% correcta y todas las demás 0%. Pero el softmax del profesor tiene una opinión sobre *todas* — y esa forma vale más que la única ganadora.",
      bullets: [
        "**Los objetivos suaves llevan \"conocimiento oscuro\".** Para \"el animal cruzó la ___\", el profesor sabe que *carretera* está cerca de *calle* mientras que *manzana* es absurdo — estructura que una etiqueta one-hot tira a la basura.",
        "**La temperatura T suaviza la distribución.** T = 1 es puntiaguda; subir T magnifica los tokens {ring} secundarios, así el estudiante ve toda la estructura de similitud por paso, no solo la mejor opción.",
        "**Señal más rica, aprendizaje más rápido.** Cada token le enseña al estudiante sobre *todo* el vocabulario a la vez — mucho más gradiente que una sola respuesta correcta. La fórmula está en *Más a fondo*.",
      ],
      cardLabel: "DISTRIBUCIÓN DEL PROFESOR vs TEMPERATURA",
      aria: "Un gráfico de barras con la probabilidad del profesor sobre palabras candidatas, que se afila o se aplana según la temperatura.",
      steps: 1,
      captions: ["La probabilidad del profesor sobre las siguientes palabras candidatas — afilada en T = 1, aplanándose para revelar el conocimiento oscuro al calentarla."],
      hint: "Calienta la temperatura de 1 hacia 10 — mira cómo las palabras secundarias crecen de rendijas a una señal real mientras la ganadora sigue ganando.",
      readoutTitle: "OBJETIVO_SUAVE",
      rows: ["TEMPERATURA", "PROB TOP-1", "CONOC. OSCURO", "ENTROPÍA"],
      readoutNote: "La respuesta suavizada del profesor: la probabilidad de la palabra top, cuánta masa queda en las secundarias (la señal transferible) y la entropía de la distribución en bits.",
      sliderNote: "T es una sola perilla que aplana el softmax. Más T revela más de la estructura secundaria del profesor — pero llevada muy lejos todo se difumina hacia lo uniforme.",
    },
    {
      eyebrow: "NODO 03 / 06",
      title: "Si no ves los logits, copia la conducta",
      intro: "Igualar objetivos suaves exige la distribución completa del vocabulario del profesor — imposible a través de una API cerrada o un tokenizador distinto. Así que la mayoría de los modelos pequeños aprenden por la vía barata: el profesor simplemente *escribe respuestas* y el estudiante las imita.",
      bullets: [
        "**La destilación a nivel de secuencia es fine-tuning normal** sobre el texto generado por el profesor — la receta detrás de [Phi](https://arxiv.org/abs/2306.11644) de Microsoft y de muchos modelos en el dispositivo.",
        "**Las trazas de razonamiento son el ingrediente secreto.** Pídele al profesor que muestre su trabajo en un borrador {ring} `<thought>` y el estudiante aprende los *pasos*, no solo la respuesta final.",
        "**Más generaciones, mejor estudiante** — pero el salto de respuestas crudas a razonamiento con trazas importa más que el mero volumen.",
      ],
      cardLabel: "RESPUESTA DEL PROFESOR → SFT DEL ESTUDIANTE",
      aria: "Una respuesta escueta del profesor junto a la misma respuesta con una traza de razonamiento paso a paso que el estudiante imita.",
      steps: 2,
      captions: [
        "Una respuesta escueta — el profesor da solo el resultado final, así que el estudiante copia la respuesta pero no el método.",
        "La misma respuesta con una traza de razonamiento — ahora el estudiante imita los pasos que llevaron a ella.",
      ],
      hint: "Cambia entre Respuesta cruda y Cadena de pensamiento, y dimensiona la tirada — mira cómo el razonamiento con trazas eleva el resultado del estudiante mucho más que el volumen solo.",
      readoutTitle: "RESUMEN_CLONADO",
      rows: ["GENERADO", "TRAZAS", "SCORE ESTUD.", "TIEMPO GEN."],
      readoutNote: "La tirada de generación: cuántos tokens sintéticos escribió el profesor, si llevan trazas de razonamiento, y el resultado del estudiante en el benchmark.",
      optionNotes: [
        "Respuesta cruda — el profesor emite solo el resultado. Barato de imitar, pero el estudiante nunca ve el razonamiento, así que los problemas difíciles quedan fuera de alcance.",
        "Cadena de pensamiento — el profesor muestra sus pasos en un borrador. El estudiante aprende el método y su benchmark salta con el mismo presupuesto de tokens.",
      ],
    },
    {
      eyebrow: "NODO 04 / 06",
      title: "El error que hace bola de nieve",
      intro: "Clonar texto estático es off-policy: el estudiante solo lee las trayectorias perfectas del profesor. Pero al inferir recorre su propio camino — y un resbalón temprano lo mete en un estado que nunca entrenó, donde el siguiente error es aún más probable.",
      bullets: [
        "**Off-policy sufre sesgo de exposición.** Los resbalones independientes por token se acumulan, así que una generación larga se aleja mucho de la distribución — de aquí salen las alucinaciones.",
        "**La destilación on-policy cierra el bucle.** El estudiante genera su propia tirada, el profesor puntúa {ring} esa trayectoria exacta, y el estudiante aprende a recuperarse de sus propios errores.",
        "**El error queda acotado con la longitud.** Como el profesor corrige al estudiante *en su propio camino*, una secuencia más larga ya no significa un error desbocado.",
      ],
      cardLabel: "DERIVA OFF-POLICY vs CORRECCIÓN ON-POLICY",
      aria: "Dos trayectorias desde un prompt: un camino off-policy que se desvía a una zona de error, y un camino on-policy devuelto a la vía por la retroalimentación del profesor.",
      steps: 1,
      captions: ["La misma tirada de dos formas: a su aire se desvía a la zona de error; con retroalimentación on-policy el profesor la devuelve al camino de referencia."],
      hint: "Activa la retroalimentación on-policy y estira la tirada — el error off-policy sube con la longitud, el on-policy se queda plano y bajo.",
      readoutTitle: "AUDITORIA_TRAYECTORIA",
      rows: ["MODO", "SESGO EXPOS.", "ERROR ACUM.", "vs OFF-POLICY"],
      readoutNote: "La tasa de error al final de la secuencia para el modo elegido, junto a la tasa off-policy a la misma longitud — la brecha es lo que compra la retroalimentación on-policy.",
      optionNotes: [
        "Off-policy — el estudiante lee texto estático del profesor y nunca ve sus propios errores. Los resbalones tempranos se acumulan; cuanto más larga la tirada, peor la deriva.",
        "On-policy — el estudiante genera, el profesor califica su trayectoria real, y aprende a recuperarse. El error se mantiene bajo incluso en secuencias largas.",
      ],
    },
    {
      eyebrow: "NODO 05 / 06",
      title: "Donde el modelo pequeño de verdad vale la pena",
      intro: "Un estudiante destilado es la razón de que la inteligencia pueda correr barata y privada. El mismo modelo de 3B se despliega de tres formas muy distintas — y la correcta depende de qué estés optimizando.",
      bullets: [
        "**En el dispositivo** — el modelo corre en el propio teléfono o portátil del usuario. Cero coste de API, cero latencia de red y datos que {ring} nunca salen del dispositivo.",
        "**GPU en la nube** — una sola GPU de gama media auto-aloja el modelo para una API centralizada, recortando el coste por llamada frente a un proveedor de frontera en un orden de magnitud.",
        "**Especializado por dominio** — destila un generalista de 70B en un modelo de 2–3B que hace un solo trabajo (SQL, triaje) tan bien como el gigante, en hardware que cuesta casi nada.",
      ],
      cardLabel: "ECONOMÍA DEL DESPLIEGUE",
      aria: "Barras que comparan una API de frontera centralizada con un modelo destilado auto-alojado en coste y latencia.",
      steps: 1,
      captions: ["Una llamada a una API de frontera junto a un modelo destilado auto-alojado — misma tarea, una brecha de un orden de magnitud en coste y latencia."],
      hint: "Elige un objetivo de despliegue y fija el volumen diario — comprueba que el coste mensual se queda bajo el presupuesto de $500 sirviendo cada petición.",
      readoutTitle: "LECTURA_DESPLIEGUE",
      rows: ["RENDIMIENTO", "COSTE MENSUAL", "LATENCIA / CONS.", "ESTADO"],
      readoutNote: "El rendimiento de decodificación del objetivo elegido, el coste mensual de infraestructura contra un presupuesto de $500, y la latencia por consulta para el volumen diario que fijes.",
      optionNotes: [
        "En el dispositivo — corre en el teléfono o portátil de cada usuario. $0 de infraestructura, privacidad total, velocidad modesta por dispositivo. Ideal para asistentes personales que deben funcionar sin conexión.",
        "GPU T4 en la nube — una GPU de gama media auto-aloja una API centralizada. Alto rendimiento y baja latencia; el caballo de batalla de un producto real por ~$380/mes.",
        "Pasarela CPU de borde — una caja on-prem barata. El menor coste después del dispositivo, pero rendimiento limitado — bien para herramientas internas de bajo volumen.",
      ],
    },
    {
      eyebrow: "NODO 06 / 06",
      title: "Lo que un modelo pequeño no puede fingir",
      intro: "La destilación no es magia. Un estudiante copia el *estilo* del profesor — tono, formato, frases de transición — mucho antes de ganarse su *razonamiento*. Encoge demasiado y chocas con límites que ningún dato sintético arregla.",
      bullets: [
        "**La imitación de estilo halaga a los tests superficiales.** Un modelo diminuto suena como el profesor, así que las evaluaciones rápidas se ven geniales mientras la lógica de varios pasos sigue frágil por debajo.",
        "**Las alucinaciones se amplifican.** Con muy poca capacidad para sostener conocimiento profundo del mundo, el estudiante memoriza los errores del profesor y no puede autocorregirse.",
        "**Hay un suelo de razonamiento duro.** Por debajo de ~2B parámetros, la lógica compleja de varios pasos choca con un techo sin importar los datos. El {ring} punto ideal es 3–8B: la mayor inteligencia por byte.",
      ],
      cardLabel: "CAPACIDAD DE RAZONAMIENTO vs TAMAÑO",
      aria: "Una curva de capacidad de razonamiento frente al tamaño del estudiante, que se aplana en una región de suelo por debajo de 2B y marca un punto ideal de 3–8B.",
      steps: 1,
      captions: ["La capacidad de razonamiento en función del tamaño — plana y frágil bajo el suelo de 2B, subiendo por el punto ideal de 3–8B hacia el techo del profesor."],
      hint: "Desliza el tamaño del estudiante — mantente por encima del suelo de 2B y dentro del techo de 100 ms de latencia para caer en el punto verde.",
      readoutTitle: "LIMITES_CAPACIDAD",
      rows: ["TAMAÑO", "RAZONAMIENTO", "LATENCIA", "ALUCINACIÓN"],
      readoutNote: "La capacidad de razonamiento del estudiante elegido frente al suelo de 2B, su latencia contra un techo de 100 ms, y su tasa de alucinación heredada.",
      sliderNote: "El razonamiento sigue una curva en S con el tamaño: casi plana bajo ~2B, empinada por 3–8B, luego con rendimientos decrecientes. Elige el modelo más pequeño que supere el suelo para tu tarea.",
    },
  ],
  n1presets: ["Móvil borde 1B", "Portátil local 3B", "Empresarial 8B"],
  n1params: "PARÁMETROS DEL ESTUDIANTE (B)",
  n1bits: "PRECISIÓN DE PESOS (bits)",
  n1teacherLabel: "PROFESOR · 70B",
  n1studentLabel: "ESTUDIANTE · tuyo",
  n1budgetLabel: "TOPE DE BORDE 8 GB",
  n1overLabel: "FUERA DE PRESUPUESTO",
  n1overNote: "Por encima del tope de 8 GB: este estudiante no cargará en el dispositivo objetivo. Baja un nivel de tamaño, o cuantiza a menos bits — 8 bits reduce a la mitad la huella de 16 bits, y 4 bits la reduce otra vez.",
  n2slider: "TEMPERATURA DEL SOFTMAX (T)",
  n2hardLabel: "ETIQUETA DURA",
  n2softLabel: "OBJETIVO SUAVE",
  n2promptLabel: 'PROMPT:  "El animal cruzó la ___"',
  n2mathTitle: "Más a fondo: la temperatura y el reescalado T²",
  n2mathBody: "Los logits del profesor `zᵢ` se vuelven probabilidades con un softmax escalado por temperatura: `pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)`. En `T = 1` es el softmax normal; subir `T` lo aplana, elevando los tokens secundarios. El estudiante se entrena para igualar esta distribución suavizada minimizando la divergencia KL `D_KL(profesor ∥ estudiante)`. Un detalle: dividir los logits por `T` encoge los gradientes en `1 / T²`, así que la pérdida de destilación se multiplica por `T²` para mantenerla equilibrada frente a la pérdida ordinaria de etiqueta dura.",
  n3modes: ["Respuesta cruda", "Cadena de pensamiento"],
  n3volume: "TOKENS SINTÉTICOS (B)",
  n3rawLabel: "RESPUESTA CRUDA",
  n3cotLabel: "TRAZA DE RAZONAMIENTO · <thought>",
  n4toggleOn: "Retroalimentación on-policy del profesor",
  n4rollout: "LONGITUD DE TIRADA (tokens)",
  n4offPath: "OFF-POLICY",
  n4onPath: "ON-POLICY",
  n4correct: "corregido",
  n4diverge: "error acumulándose",
  n5hw: ["En el dispositivo", "GPU T4 nube", "Pasarela CPU"],
  n5hwLabel: "OBJETIVO DE DESPLIEGUE",
  n5volume: "CONSULTAS DIARIAS",
  n5cloudLabel: "API FRONTERA · por llamada",
  n5edgeLabel: "DESTILADO · auto-alojado",
  n6slider: "TAMAÑO DEL ESTUDIANTE (B)",
  n6floorLabel: "SUELO DE RAZONAMIENTO",
  n6sweetLabel: "PUNTO IDEAL 3–8B",
  n6axisX: "parámetros del estudiante (B)",
  n6axisY: "capacidad de razonamiento",
  n6teacherLabel: "TECHO DEL PROFESOR",
  explainLabel: "EXPLÍCALO TÚ",
  explainQ: "Un estudiante de 3B entrenado con las respuestas de un profesor puntúa bien en evaluaciones rápidas pero se desmorona en problemas difíciles de varios pasos. Con el mismo profesor y el mismo estudiante de 3B, ¿cuál es el cambio más efectivo para cerrar esa brecha — y qué *no* puede arreglar?",
  explainA: "Pasar de respuestas crudas a **trazas de cadena de pensamiento**, y de **off-policy a on-policy**. Las trazas le enseñan al estudiante los *pasos*, no solo la respuesta final, y la retroalimentación on-policy deja que el profesor corrija al estudiante en su propia trayectoria — matando el sesgo de exposición que desvía las cadenas largas de razonamiento. Lo que ninguno arregla es la **capacidad**: por debajo del suelo de ~2B, ningún dato ni entrenamiento astuto compra la lógica de varios pasos que los parámetros no pueden sostener. La destilación traslada inteligencia a una caja más pequeña; no puede hacer la caja más grande que el razonamiento que se le pide guardar.",
  bridgeLabel: "SIGUIENTE: 4.3 · OPTIMIZACIÓN DIRECTA DE PREFERENCIAS",
  bridgeBody: "Tu estudiante es pequeño, rápido y casi iguala al profesor. Ahora, **alineación DPO y GRPO**: cómo un modelo destilado se ajusta a preferencias humanas y algorítmicas con señales de recompensa sin referencia — convirtiendo a un imitador capaz en un modelo con el que la gente de verdad quiere hablar.",
  prevLesson: "Volver a 0.5",
  nextLesson: "4.3 próximamente",
};
