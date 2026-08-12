/**
 * Stage 0 · 2.5.4 — The optimizer (AdamW). Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 * All user-facing text lives here, both languages, full parity.
 *
 * One idea: AdamW gives each weight its own smart step using momentum and
 * variance, and a warmup-then-decay schedule paces the whole run. Builds on
 * Backpropagation (which produced the gradient and took one step at a single
 * learning rate) — this lesson shows how a real optimizer sizes that step.
 */
import type { WsNodeCopy } from "./shared";

export interface OptimizersLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — SGD vs Adam on a loss surface
  n1opts: string[]; //     [Plain SGD, Adam]
  n1startLabel: string; // "start"
  n1minLabel: string; //   "lowest loss"
  n1axisX: string; //      "flat direction →"
  n1axisY: string; //      "steep →"
  n1low: string; //        legend: low loss
  n1high: string; //       legend: high loss
  n1sgdName: string; //    path label
  n1adamName: string; //   path label
  n1settled: string; //    status when it reached the bottom
  n1descending: string; // status when it's still going
  // callout
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;

  // Node 2 — per-weight step sizes
  n2opts: string[]; //     [Raw step (SGD), Adam-scaled]
  n2steadyLabel: string; //"steady weight"
  n2noisyLabel: string; // "noisy weight"
  n2gradLabel: string; //  "recent gradients"
  n2stepLabel: string; //  "step taken"
  // deeper
  deeperTitle: string;
  deeperBody: string;

  // Node 3 — the schedule
  n3warmupSlider: string; //"WARMUP LENGTH"
  n3shapes: string[]; //   [Cosine decay, WSD]
  n3axisX: string; //      "training progress →"
  n3axisY: string; //      "learning rate"
  n3peakLabel: string; //  "peak"
  n3warmupZone: string; // "warmup"

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

export const optimizersEN: OptimizersLesson = {
  crumb: "STAGE 0 · 2.5.4 · THE OPTIMIZER",
  eyebrow: "STAGE 0 · 2.5.4 · 3 NODES",
  title: "The optimizer: AdamW",
  lede: "Backprop hands you a gradient — the downhill direction for every weight. The optimizer decides how big a step to take in that direction. This is AdamW, the optimizer almost every large model is trained with: it gives each weight its own step size, and a schedule paces the whole run.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Momentum smooths the descent", "Per-weight step sizes", "The learning-rate schedule"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Plain steps, or smart steps?",
      intro: "You already saw a model roll downhill with one step size. Watch what happens on a stretched-out valley when SGD races Adam — same start, same 16 steps.",
      bullets: [
        "**SGD takes the raw gradient step.** In a narrow valley the step must stay small or it {ring} bounces off the steep walls — so it crawls along the flat floor.",
        "**Adam adds momentum.** It averages recent gradients, so it builds speed *down* the valley instead of zig-zagging across it.",
        "**Same step budget, different progress.** After 16 steps Adam is at the bottom; SGD is still working its way there.",
      ],
      cardLabel: "SGD vs ADAM · SAME LOSS SURFACE",
      aria: "A loss-surface contour map with two descent paths: SGD zig-zagging across the valley and Adam heading straight to the minimum.",
      steps: 1,
      captions: ["Two optimizers descend the same valley from the same start — SGD in red, Adam in green."],
      hint: "Flip between the two — SGD bounces across the steep walls; Adam glides down the middle.",
      readoutTitle: "AFTER 16 STEPS",
      rows: ["OPTIMIZER", "DIST TO MIN", "STATUS"],
      readoutNote: "How close each optimizer got to the lowest-loss point in the same number of steps.",
      optionNotes: [
        "Plain SGD — step = learning rate × gradient, nothing else. Simple, but one step size has to serve every weight, so it stalls in stretched valleys.",
        "Adam — averages recent gradients (momentum) and scales each weight on its own. It heads straight for the bottom.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Every weight gets its own step size",
      intro: "Here's the trick that makes Adam adaptive. It watches how big and how jumpy each weight's gradients have been, and shrinks the step for the noisy ones.",
      bullets: [
        "**One global step size is unfair.** A weight with huge, jerky gradients and a weight with tiny, steady ones can't share the same step.",
        "**Adam divides each weight's step by its own recent gradient size** — the *root-mean-square*, a plain average of how large the gradients have been. Big, noisy gradients → smaller, safer step.",
        "**The result: every weight moves at a sane, similar pace.** {ring} Flip to Adam and both weights take a controlled step, whatever their raw gradient.",
      ],
      cardLabel: "RAW STEP vs ADAM-SCALED STEP",
      aria: "Two weights — a steady one and a noisy one — showing raw step sizes versus Adam-scaled step sizes.",
      steps: 1,
      captions: ["A steady weight and a noisy weight, and the step each one actually takes."],
      hint: "Switch RAW to Adam-scaled — the noisy weight's giant step shrinks to match the steady one.",
      readoutTitle: "STEP SIZE",
      rows: [],
      optionNotes: [
        "Raw step (SGD) — the step is just learning-rate × gradient, so the noisy weight lurches while the steady one barely moves.",
        "Adam-scaled — each step is divided by that weight's own recent gradient size, so both land on a similar, controlled step.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Pacing the whole run: the schedule",
      intro: "The learning rate isn't one fixed number — it changes over training. Almost every run warms it up, holds it high, then decays it toward zero.",
      bullets: [
        "**Warm up first.** Start the rate near zero and ramp it up over the first few thousand steps, so early wild gradients don't blow up the weights.",
        "**Then decay.** Lower the rate as training goes on, so the model settles into a good minimum instead of {ring} bouncing around it.",
        "**Two common shapes.** *Cosine* glides smoothly down to a floor; *WSD* holds the peak flat, then drops fast at the very end.",
      ],
      cardLabel: "LEARNING RATE OVER TRAINING",
      aria: "A curve of learning rate versus training progress: a short warmup ramp, then a decay to a floor.",
      steps: 1,
      captions: ["The learning rate over a full training run — warm up, then decay."],
      hint: "Drag the warmup and switch the decay shape — see how the curve paces the run.",
      readoutTitle: "SCHEDULE",
      rows: ["WARMUP", "PEAK LR", "DECAYS TO"],
      readoutNote: "A typical 100k-step run: how long the warmup lasts, the peak rate, and where the rate ends up.",
      optionNotes: [
        "Cosine decay — after warmup, the rate follows a smooth half-cosine down to a small floor. The most common choice.",
        "WSD (warmup-stable-decay) — hold the peak rate flat for most of the run, then decay sharply at the end. Lets you stop early or extend without redoing the schedule.",
      ],
      sliderNote: "Warmup ramps the rate from zero up to the peak. Too short and early gradients destabilize the weights; a few percent of the run is typical.",
    },
  ],
  n1opts: ["Plain SGD", "Adam"],
  n1startLabel: "start",
  n1minLabel: "lowest loss",
  n1axisX: "flat weight →",
  n1axisY: "steep weight →",
  n1low: "low loss",
  n1high: "high loss",
  n1sgdName: "SGD",
  n1adamName: "Adam",
  n1settled: "at the minimum",
  n1descending: "still descending",
  calloutLabel: "GOOD TO KNOW · THE NAME",
  calloutTitle: "Why “AdamW”",
  calloutBody: "Adam = **Ada**ptive **M**oment estimation — it tracks the running *moments* (averages) of each weight's gradient. The **W** adds *weight decay*: a gentle pull of every weight toward zero on each step, which curbs overfitting. AdamW is the default optimizer for training large language models.",
  n2opts: ["Raw step (SGD)", "Adam-scaled"],
  n2steadyLabel: "steady weight",
  n2noisyLabel: "noisy weight",
  n2gradLabel: "recent gradients",
  n2stepLabel: "step taken",
  deeperTitle: "The Adam update, in one line",
  deeperBody: "For each weight, Adam keeps two running averages: **m**, the mean gradient (momentum), and **v**, the mean *squared* gradient (the noise/size). The step is `θ ← θ − lr · m / (√v + ε)`. Dividing by `√v` is the per-weight scaling — a weight with large `v` gets a proportionally smaller step. **AdamW** adds one more term, `− lr · λ · θ`: the weight decay that gently pulls each weight toward zero.",
  n3warmupSlider: "WARMUP LENGTH",
  n3shapes: ["Cosine decay", "WSD"],
  n3axisX: "training progress →",
  n3axisY: "learning rate",
  n3peakLabel: "peak",
  n3warmupZone: "warmup",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Backprop already gives the exact downhill direction for every weight. So why isn't a single, fixed learning rate enough?",
  explainA: "Because one number can't fit every weight or every moment. Weights differ: some have large, noisy gradients and some tiny, steady ones, so a step size that's safe for one wastes the other — **Adam** fixes this by scaling each weight's step by its own recent gradient size, and smooths the path with momentum. Training also has phases: at the start the gradients are wild, so you **warm up** from a near-zero rate; near the end you **decay** the rate so the model settles into a good minimum instead of orbiting it. **AdamW** — adaptive per-weight steps, plus a warmup-then-decay schedule, plus a little weight decay — is why large models train stably at all.",
  bridgeLabel: "NEXT: SUPERVISED FINE-TUNING",
  bridgeBody: "You can now train a model end to end: data → tokens → transformer → loss → backprop → **optimizer**. Next we stop building the base model and start shaping it — **supervised fine-tuning**, where a pretrained model learns to follow instructions from example answers.",
  prevLesson: "Back: backpropagation",
  nextLesson: "Continue to fine-tuning",
};

/* ============================================================ SPANISH ======= */

export const optimizersES: OptimizersLesson = {
  crumb: "ETAPA 0 · 2.5.4 · EL OPTIMIZADOR",
  eyebrow: "ETAPA 0 · 2.5.4 · 3 NODOS",
  title: "El optimizador: AdamW",
  lede: "Backprop te entrega un gradiente — la dirección cuesta abajo para cada peso. El optimizador decide qué tan grande es el paso en esa dirección. Este es AdamW, el optimizador con el que se entrena casi todo modelo grande: le da a cada peso su propio tamaño de paso, y un calendario marca el ritmo de todo el entrenamiento.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El momentum suaviza el descenso", "Un paso por peso", "El calendario de tasa de aprendizaje"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "¿Pasos simples o pasos listos?",
      intro: "Ya viste a un modelo rodar cuesta abajo con un solo tamaño de paso. Mira qué pasa en un valle alargado cuando SGD compite con Adam — mismo inicio, mismos 16 pasos.",
      bullets: [
        "**SGD toma el paso del gradiente en crudo.** En un valle estrecho el paso debe quedarse pequeño o {ring} rebota contra las paredes empinadas — así que se arrastra por el fondo plano.",
        "**Adam añade momentum.** Promedia los gradientes recientes, así toma velocidad *bajando* el valle en vez de zigzaguear a lo ancho.",
        "**Mismo presupuesto de pasos, distinto avance.** Tras 16 pasos Adam ya está en el fondo; SGD sigue en camino.",
      ],
      cardLabel: "SGD vs ADAM · MISMA SUPERFICIE DE PÉRDIDA",
      aria: "Un mapa de contorno de la superficie de pérdida con dos trayectorias de descenso: SGD zigzagueando por el valle y Adam yendo recto al mínimo.",
      steps: 1,
      captions: ["Dos optimizadores descienden el mismo valle desde el mismo inicio — SGD en rojo, Adam en verde."],
      hint: "Alterna entre los dos — SGD rebota por las paredes empinadas; Adam se desliza por el centro.",
      readoutTitle: "TRAS 16 PASOS",
      rows: ["OPTIMIZADOR", "DIST AL MÍN", "ESTADO"],
      readoutNote: "Qué tan cerca llegó cada optimizador del punto de menor pérdida en el mismo número de pasos.",
      optionNotes: [
        "SGD simple — paso = tasa de aprendizaje × gradiente, nada más. Sencillo, pero un solo tamaño de paso sirve a todos los pesos, así que se atasca en valles alargados.",
        "Adam — promedia los gradientes recientes (momentum) y escala cada peso por su cuenta. Va directo al fondo.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Cada peso recibe su propio tamaño de paso",
      intro: "Este es el truco que hace a Adam adaptativo. Observa qué tan grandes y qué tan bruscos han sido los gradientes de cada peso, y encoge el paso de los ruidosos.",
      bullets: [
        "**Un tamaño de paso global es injusto.** Un peso con gradientes enormes y bruscos y otro con gradientes diminutos y estables no pueden compartir el mismo paso.",
        "**Adam divide el paso de cada peso por su propio tamaño de gradiente reciente** — la *raíz cuadrática media*, un promedio simple de cuán grandes han sido los gradientes. Gradientes grandes y ruidosos → paso más pequeño y seguro.",
        "**El resultado: cada peso avanza a un ritmo sensato y parecido.** {ring} Pasa a Adam y ambos pesos dan un paso controlado, sea cual sea su gradiente en crudo.",
      ],
      cardLabel: "PASO EN CRUDO vs PASO ESCALADO POR ADAM",
      aria: "Dos pesos — uno estable y uno ruidoso — mostrando los tamaños de paso en crudo frente a los escalados por Adam.",
      steps: 1,
      captions: ["Un peso estable y un peso ruidoso, y el paso que da cada uno."],
      hint: "Cambia de CRUDO a escalado por Adam — el paso gigante del peso ruidoso se encoge hasta igualar al estable.",
      readoutTitle: "TAMAÑO DE PASO",
      rows: [],
      optionNotes: [
        "Paso en crudo (SGD) — el paso es solo tasa de aprendizaje × gradiente, así que el peso ruidoso da un tirón mientras el estable apenas se mueve.",
        "Escalado por Adam — cada paso se divide por el tamaño de gradiente reciente de ese peso, así ambos aterrizan en un paso parecido y controlado.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Marcar el ritmo: el calendario",
      intro: "La tasa de aprendizaje no es un número fijo — cambia a lo largo del entrenamiento. Casi todo entrenamiento la calienta, la mantiene alta y luego la baja hacia cero.",
      bullets: [
        "**Primero, calentar.** Arranca la tasa cerca de cero y súbela durante los primeros miles de pasos, para que los gradientes salvajes del inicio no revienten los pesos.",
        "**Luego, decaer.** Baja la tasa conforme avanza el entrenamiento, para que el modelo se asiente en un buen mínimo en vez de {ring} rebotar a su alrededor.",
        "**Dos formas comunes.** *Coseno* baja suave hasta un piso; *WSD* mantiene el pico plano y luego cae rápido al final.",
      ],
      cardLabel: "TASA DE APRENDIZAJE DURANTE EL ENTRENAMIENTO",
      aria: "Una curva de la tasa de aprendizaje frente al progreso del entrenamiento: una rampa corta de calentamiento y luego un decaimiento hasta un piso.",
      steps: 1,
      captions: ["La tasa de aprendizaje durante un entrenamiento completo — calentar y luego decaer."],
      hint: "Arrastra el calentamiento y cambia la forma del decaimiento — mira cómo la curva marca el ritmo.",
      readoutTitle: "CALENDARIO",
      rows: ["CALENTAMIENTO", "TASA PICO", "BAJA A"],
      readoutNote: "Un entrenamiento típico de 100k pasos: cuánto dura el calentamiento, la tasa pico y dónde termina la tasa.",
      optionNotes: [
        "Decaimiento coseno — tras el calentamiento, la tasa sigue un medio coseno suave hasta un piso pequeño. La opción más común.",
        "WSD (calentar-estable-decaer) — mantén la tasa pico plana casi todo el entrenamiento y luego decae de golpe al final. Permite parar antes o extender sin rehacer el calendario.",
      ],
      sliderNote: "El calentamiento sube la tasa desde cero hasta el pico. Muy corto y los gradientes del inicio desestabilizan los pesos; un pequeño porcentaje del entrenamiento es lo típico.",
    },
  ],
  n1opts: ["SGD simple", "Adam"],
  n1startLabel: "inicio",
  n1minLabel: "menor pérdida",
  n1axisX: "peso plano →",
  n1axisY: "peso empinado →",
  n1low: "pérdida baja",
  n1high: "pérdida alta",
  n1sgdName: "SGD",
  n1adamName: "Adam",
  n1settled: "en el mínimo",
  n1descending: "aún descendiendo",
  calloutLabel: "PARA SABER · EL NOMBRE",
  calloutTitle: "Por qué “AdamW”",
  calloutBody: "Adam = estimación **Ada**ptativa de **M**omentos — rastrea los *momentos* (promedios) del gradiente de cada peso. La **W** añade *weight decay* (decaimiento de pesos): un tirón suave de cada peso hacia cero en cada paso, que frena el sobreajuste. AdamW es el optimizador por defecto para entrenar grandes modelos de lenguaje.",
  n2opts: ["Paso en crudo (SGD)", "Escalado por Adam"],
  n2steadyLabel: "peso estable",
  n2noisyLabel: "peso ruidoso",
  n2gradLabel: "gradientes recientes",
  n2stepLabel: "paso dado",
  deeperTitle: "La actualización de Adam, en una línea",
  deeperBody: "Para cada peso, Adam guarda dos promedios: **m**, el gradiente medio (momentum), y **v**, el gradiente medio al *cuadrado* (el ruido/tamaño). El paso es `θ ← θ − lr · m / (√v + ε)`. Dividir por `√v` es el escalado por peso — un peso con `v` grande recibe un paso proporcionalmente menor. **AdamW** añade un término más, `− lr · λ · θ`: el weight decay que tira suavemente de cada peso hacia cero.",
  n3warmupSlider: "DURACIÓN DEL CALENTAMIENTO",
  n3shapes: ["Decaimiento coseno", "WSD"],
  n3axisX: "progreso del entrenamiento →",
  n3axisY: "tasa de aprendizaje",
  n3peakLabel: "pico",
  n3warmupZone: "calentar",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Backprop ya da la dirección exacta cuesta abajo para cada peso. Entonces, ¿por qué no basta con una tasa de aprendizaje única y fija?",
  explainA: "Porque un solo número no le sirve a cada peso ni a cada momento. Los pesos difieren: unos tienen gradientes grandes y ruidosos y otros diminutos y estables, así que un tamaño de paso seguro para uno desperdicia al otro — **Adam** lo arregla escalando el paso de cada peso por su propio tamaño de gradiente reciente, y suaviza el camino con momentum. El entrenamiento también tiene fases: al inicio los gradientes son salvajes, así que **calientas** desde una tasa casi cero; cerca del final **decaes** la tasa para que el modelo se asiente en un buen mínimo en vez de orbitar a su alrededor. **AdamW** — pasos adaptativos por peso, más un calendario de calentar-y-decaer, más un poco de weight decay — es la razón por la que los modelos grandes entrenan de forma estable.",
  bridgeLabel: "SIGUIENTE: AJUSTE FINO SUPERVISADO",
  bridgeBody: "Ya puedes entrenar un modelo de principio a fin: datos → tokens → transformer → pérdida → backprop → **optimizador**. Ahora dejamos de construir el modelo base y empezamos a moldearlo — el **ajuste fino supervisado**, donde un modelo preentrenado aprende a seguir instrucciones a partir de respuestas de ejemplo.",
  prevLesson: "Atrás: backpropagation",
  nextLesson: "Continuar al ajuste fino",
};
