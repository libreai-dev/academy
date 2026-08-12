/**
 * Stage 0 · 2.5·4 — Matrix optimizers. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: newer optimizers (Lion, Adafactor, Muon) cut the per-weight memory
 * that AdamW spends on its state — and some converge faster on big weight
 * matrices — but you trade that memory against stability and tuning effort.
 * Builds on /stage/0/optimizers (what an optimizer is); does not re-teach it.
 */
import type { WsNodeCopy } from "./shared";

export interface MatrixOptimizersLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  /** Optimizer button labels, shared by nodes 2 and 3 (proper nouns). */
  optNames: string[];
  // Node 1 — AdamW's memory tax
  n1slider: string; //     "MODEL SIZE"
  n1rowLabels: string[]; // [Weights, Gradients, Master copy, Momentum (m), Variance (v)]
  n1taxLabel: string; //   bracket under the two green rows
  // Node 2 — cheaper state
  n2suffix: string; //     "B/wt"
  n2savedLabel: string; // "saved"
  // Node 3 — the trade-off
  n3xLabel: string; //     "training steps →"
  n3yLabel: string; //     "loss ↓"
  n3targetLabel: string; //"target loss"
  n3adamwLabel: string; // "AdamW · baseline"
  /** Stability words, index-aligned to OPTS order (adamw, lion, adafactor, muon). */
  n3stabWords: string[];
  // "Go deeper" collapsed blocks (expert math, out of the main flow)
  deeper1Title: string;
  deeper1Body: string;
  deeper2Title: string;
  deeper2Body: string;
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

export const matrixOptimizersEN: MatrixOptimizersLesson = {
  crumb: "STAGE 0 · 2.5·4 · MATRIX OPTIMIZERS",
  eyebrow: "STAGE 0 · 2.5·4 · 3 NODES",
  title: "Optimizers that fit",
  lede: "AdamW is the default optimizer, and it works — but it quietly stores two extra numbers for every weight in the model. Newer optimizers keep less, freeing GPU memory and sometimes converging faster. Here's the trade-off, one knob at a time.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["AdamW's tax", "Cheaper state", "The trade-off"],
  optNames: ["AdamW", "Lion", "Adafactor", "Muon"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "AdamW's memory tax",
      intro: "You met the optimizer in [Optimizers](/stage/0/optimizers) — the rule that nudges each weight downhill. AdamW is the default, and to do its job it keeps two running numbers per weight.",
      bullets: [
        "**Momentum (`m`)** — a running average of the gradient, so updates keep their direction instead of jittering.",
        "**Variance (`v`)** — a running average of the gradient's *size*, used to give each weight its own step size.",
        "**Those two numbers are the {ring} green rows** — 8 of the 16 bytes per weight. The optimizer's state is *half* your memory — as big as the fp32 master copy, the weights, and the gradients combined.",
        "**Scale it up:** a 70B model spends about 560 GB just on `m` and `v` — before a single activation.",
      ],
      cardLabel: "MEMORY PER WEIGHT · ADAMW",
      aria: "A stacked bar of the five things AdamW stores per weight; momentum and variance are highlighted green.",
      steps: 1,
      captions: ["Every weight carries five numbers in training; AdamW's own two (m and v) are the green pair."],
      hint: "Drag the model size — the two green rows are the optimizer's own, and they grow right along with it.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["TOTAL", "OPT STATE", "SHARE"],
      readoutNote: "Training memory for weights, gradients and optimizer state at this model size. Optimizer state is momentum + variance.",
      sliderNote: "Momentum + variance are stored per weight, so the optimizer's bill scales one-to-one with model size — and it's the biggest single slice.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Cheaper state",
      intro: "The newer optimizers ask a simple question: do we really need two full numbers per weight? Each keeps less — and the memory you save is real VRAM back.",
      bullets: [
        "**Lion** keeps *one* number — momentum only. It updates using just the *sign* of it, so the variance term (and its 4 bytes) disappears.",
        "**Adafactor** keeps *almost none* — instead of storing the full variance grid for a weight matrix, it stores one number per row and one per column and reconstructs the rest.",
        "**Muon** keeps momentum only, but adds a cheap *orthogonalize* step that rescales the whole 2D weight-matrix update at once — the trick behind its speed.",
      ],
      cardLabel: "OPTIMIZER STATE · BYTES PER WEIGHT",
      aria: "Horizontal bars comparing optimizer-state bytes per weight for AdamW, Lion, Adafactor and Muon.",
      steps: 1,
      captions: ["Optimizer-state memory per weight — AdamW's 8 bytes next to the leaner alternatives."],
      hint: "Tap an optimizer — its bar is the state it keeps per weight; AdamW stays as the reference.",
      readoutTitle: "STATE_COST",
      rows: ["PER WEIGHT", "vs ADAMW", "AT 70B"],
      readoutNote: "Optimizer-state bytes per weight, how much that saves against AdamW, and the total optimizer memory it would cost on a 70B model.",
      optionNotes: [
        "AdamW — momentum + variance, 8 bytes per weight. The baseline: expensive, but forgiving to tune.",
        "Lion — momentum only, and it uses just its sign. Half the state, ~4 bytes per weight.",
        "Adafactor — factors the variance into per-row and per-column sums, so state is almost free — near 0 bytes per weight.",
        "Muon — momentum only on the big 2D matrices, ~4 bytes per weight, plus a cheap reshaping step.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The trade-off",
      intro: "Saving memory isn't free. The variance term AdamW pays for is also what makes it stable — so cheaper state usually means more careful tuning, and sometimes different convergence.",
      bullets: [
        "**Muon can converge faster** — its orthogonalize step makes better use of each big-matrix update, reaching a target loss in fewer steps.",
        "**Lion and Adafactor need care** — with the variance gone or approximated, they want a smaller learning rate and warm-up, or training can wobble.",
        "**AdamW is the safe default** — you compare everything to it, and reach for the leaner ones when memory is the binding constraint.",
      ],
      cardLabel: "STEPS TO REACH A TARGET LOSS",
      aria: "Two loss-versus-steps curves — the selected optimizer in green against AdamW in grey — with a target-loss line.",
      steps: 1,
      captions: ["Loss falling as training runs; where each curve crosses the target line is how many steps it took."],
      hint: "Tap an optimizer — green is it, grey is AdamW. The dotted line is the target loss; the crossings are the step counts.",
      readoutTitle: "TRADE_OFF",
      rows: ["STEPS", "vs ADAMW", "STABILITY"],
      readoutNote: "Illustrative steps to reach the target loss, the change against AdamW, and how touchy the optimizer is to tune.",
      optionNotes: [
        "AdamW — the baseline curve. Rock-solid convergence, no special tuning; you just pay for it in memory.",
        "Lion — similar step count, but touchy: it needs a smaller learning rate and weight decay or it diverges.",
        "Adafactor — a touch slower and needs warm-up and scaling care, but the memory saving is dramatic.",
        "Muon — reaches the target in noticeably fewer steps on the big matrices, which is why speed-runs use it.",
      ],
    },
  ],
  n1slider: "MODEL SIZE",
  n1rowLabels: ["Weights", "Gradients", "Master copy", "Momentum (m)", "Variance (v)"],
  n1taxLabel: "AdamW's tax · m + v",
  n2suffix: "B/wt",
  n2savedLabel: "saved",
  n3xLabel: "training steps →",
  n3yLabel: "loss ↓",
  n3targetLabel: "target loss",
  n3adamwLabel: "AdamW · baseline",
  n3stabWords: ["rock-solid", "touchy", "needs care", "solid"],
  deeper1Title: "How Adafactor makes state almost free",
  deeper1Body: "A weight matrix of shape `n × m` needs `n × m` variance numbers if you store one per weight — that's the whole grid. Adafactor never stores the grid. It keeps only a row vector (`n` numbers) and a column vector (`m` numbers), and reconstructs each cell's variance as the outer product of the two, normalised. For a 4096 × 4096 layer that's ~8,000 numbers instead of ~16,000,000 — a >1000× cut. The approximation is good because gradient-variance grids are close to rank-1 in practice; the cost is a little extra noise, which is why Adafactor wants warm-up.",
  deeper2Title: "Lion's sign update and Muon's orthogonalization",
  deeper2Body: "**Lion** drops the variance entirely: it updates each weight by `−lr · sign(momentum)`. Every step is ±lr, so the update size no longer adapts per weight — that's what saves the memory and what makes the learning rate touchy (too big and every weight overshoots by the same amount). **Muon** takes the momentum update for a 2D weight matrix and *orthogonalizes* it — roughly, it runs a few cheap matrix multiplies (a Newton–Schulz iteration) to push the update's singular values toward 1. That spreads the update evenly across directions instead of letting a few dominate, which is why it makes better progress per step on the big matrices.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Adafactor saves almost all of AdamW's optimizer memory. So why is AdamW still the default for most training runs?",
  explainA: "Because the memory AdamW spends buys stability. Its per-weight **variance** term gives every weight its own step size, which makes it forgiving — it *just works* across models and learning rates with little tuning. The cheaper optimizers trade some of that safety for VRAM: Adafactor approximates the variance, Lion drops it entirely, so they want a smaller learning rate and warm-up or training wobbles. You reach for them when memory is the binding constraint — a very large model, or a smaller GPU — not because they're strictly better. **Muon** is the interesting middle: it keeps only momentum on the big weight matrices and can converge faster, which is why it shows up in training speed-runs.",
  bridgeLabel: "NEXT: PARAMETER-EFFICIENT FINE-TUNING",
  bridgeBody: "You've made the optimizer cheaper. The other way to cut training memory is to stop training most of the weights at all — **freeze the model and learn a tiny add-on**. Next: parameter-efficient fine-tuning (LoRA).",
  prevLesson: "Back to distributed training",
  nextLesson: "Continue to fine-tuning",
};

/* ============================================================ ESPAÑOL ======= */

export const matrixOptimizersES: MatrixOptimizersLesson = {
  crumb: "ETAPA 0 · 2.5·4 · OPTIMIZADORES DE MATRICES",
  eyebrow: "ETAPA 0 · 2.5·4 · 3 NODOS",
  title: "Optimizadores que caben",
  lede: "AdamW es el optimizador por defecto, y funciona — pero guarda en silencio dos números extra por cada peso del modelo. Los optimizadores nuevos guardan menos, liberan memoria de GPU y a veces convergen más rápido. Aquí está el equilibrio, una perilla a la vez.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El impuesto de AdamW", "Estado más barato", "El equilibrio"],
  optNames: ["AdamW", "Lion", "Adafactor", "Muon"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El impuesto de memoria de AdamW",
      intro: "Conociste el optimizador en [Optimizadores](/stage/0/optimizers) — la regla que empuja cada peso cuesta abajo. AdamW es el predeterminado, y para hacer su trabajo guarda dos números continuos por peso.",
      bullets: [
        "**Momento (`m`)** — un promedio móvil del gradiente, para que las actualizaciones mantengan su dirección en vez de temblar.",
        "**Varianza (`v`)** — un promedio móvil del *tamaño* del gradiente, usado para dar a cada peso su propio tamaño de paso.",
        "**Esos dos números son las filas verdes {ring}** — 8 de los 16 bytes por peso. El estado del optimizador es la *mitad* de tu memoria — tan grande como la copia maestra fp32, los pesos y los gradientes juntos.",
        "**Escálalo:** un modelo de 70B gasta unos 560 GB solo en `m` y `v` — antes de una sola activación.",
      ],
      cardLabel: "MEMORIA POR PESO · ADAMW",
      aria: "Una barra apilada de las cinco cosas que AdamW guarda por peso; momento y varianza resaltados en verde.",
      steps: 1,
      captions: ["Cada peso carga cinco números al entrenar; los dos propios de AdamW (m y v) son el par verde."],
      hint: "Arrastra el tamaño del modelo — las dos filas verdes son las del optimizador, y crecen junto con él.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["TOTAL", "ESTADO OPT", "PORCIÓN"],
      readoutNote: "Memoria de entrenamiento para pesos, gradientes y estado del optimizador en este tamaño de modelo. El estado del optimizador es momento + varianza.",
      sliderNote: "Momento + varianza se guardan por peso, así que la factura del optimizador escala uno a uno con el tamaño del modelo — y es la rebanada más grande.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Estado más barato",
      intro: "Los optimizadores nuevos hacen una pregunta simple: ¿de verdad necesitamos dos números completos por peso? Cada uno guarda menos — y la memoria que ahorras es VRAM de vuelta.",
      bullets: [
        "**Lion** guarda *un* número — solo el momento. Actualiza usando apenas su *signo*, así que el término de varianza (y sus 4 bytes) desaparece.",
        "**Adafactor** guarda *casi nada* — en lugar de la rejilla completa de varianza de una matriz de pesos, guarda un número por fila y uno por columna y reconstruye el resto.",
        "**Muon** guarda solo el momento, pero añade un paso barato de *ortogonalización* que reescala de golpe toda la actualización de la matriz 2D — el truco detrás de su velocidad.",
      ],
      cardLabel: "ESTADO DEL OPTIMIZADOR · BYTES POR PESO",
      aria: "Barras horizontales que comparan los bytes de estado por peso de AdamW, Lion, Adafactor y Muon.",
      steps: 1,
      captions: ["Memoria de estado del optimizador por peso — los 8 bytes de AdamW junto a las alternativas más ligeras."],
      hint: "Toca un optimizador — su barra es el estado que guarda por peso; AdamW queda como referencia.",
      readoutTitle: "STATE_COST",
      rows: ["POR PESO", "vs ADAMW", "EN 70B"],
      readoutNote: "Bytes de estado del optimizador por peso, cuánto ahorra frente a AdamW, y la memoria total de optimizador que costaría en un modelo de 70B.",
      optionNotes: [
        "AdamW — momento + varianza, 8 bytes por peso. La base: cara, pero indulgente de ajustar.",
        "Lion — solo momento, y usa apenas su signo. La mitad del estado, ~4 bytes por peso.",
        "Adafactor — factoriza la varianza en sumas por fila y por columna, así que el estado es casi gratis — cerca de 0 bytes por peso.",
        "Muon — solo momento en las grandes matrices 2D, ~4 bytes por peso, más un paso barato de reescalado.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "El equilibrio",
      intro: "Ahorrar memoria no es gratis. El término de varianza que AdamW paga es también lo que lo hace estable — así que estado más barato suele significar más ajuste cuidadoso, y a veces convergencia distinta.",
      bullets: [
        "**Muon puede converger más rápido** — su paso de ortogonalización aprovecha mejor cada actualización de matriz grande, y alcanza la pérdida objetivo en menos pasos.",
        "**Lion y Adafactor necesitan cuidado** — sin la varianza o con ella aproximada, quieren una tasa de aprendizaje menor y calentamiento, o el entrenamiento tiembla.",
        "**AdamW es el predeterminado seguro** — comparas todo con él, y recurres a los ligeros cuando la memoria es la restricción que aprieta.",
      ],
      cardLabel: "PASOS PARA ALCANZAR UNA PÉRDIDA OBJETIVO",
      aria: "Dos curvas de pérdida contra pasos — el optimizador elegido en verde frente a AdamW en gris — con una línea de pérdida objetivo.",
      steps: 1,
      captions: ["La pérdida cae mientras corre el entrenamiento; donde cada curva cruza la línea objetivo es cuántos pasos tomó."],
      hint: "Toca un optimizador — verde es él, gris es AdamW. La línea punteada es la pérdida objetivo; los cruces son los pasos.",
      readoutTitle: "TRADE_OFF",
      rows: ["PASOS", "vs ADAMW", "ESTABILIDAD"],
      readoutNote: "Pasos ilustrativos para alcanzar la pérdida objetivo, el cambio frente a AdamW, y cuán delicado es de ajustar el optimizador.",
      optionNotes: [
        "AdamW — la curva base. Convergencia sólida como roca, sin ajuste especial; solo la pagas en memoria.",
        "Lion — pasos parecidos, pero delicado: necesita menor tasa de aprendizaje y weight decay o diverge.",
        "Adafactor — un poco más lento y necesita calentamiento y cuidado de escalado, pero el ahorro de memoria es enorme.",
        "Muon — alcanza el objetivo en bastantes menos pasos en las matrices grandes, por eso lo usan los speed-runs.",
      ],
    },
  ],
  n1slider: "TAMAÑO DEL MODELO",
  n1rowLabels: ["Pesos", "Gradientes", "Copia maestra", "Momento (m)", "Varianza (v)"],
  n1taxLabel: "El impuesto de AdamW · m + v",
  n2suffix: "B/peso",
  n2savedLabel: "ahorra",
  n3xLabel: "pasos de entrenamiento →",
  n3yLabel: "pérdida ↓",
  n3targetLabel: "pérdida objetivo",
  n3adamwLabel: "AdamW · base",
  n3stabWords: ["sólido como roca", "delicado", "requiere cuidado", "sólido"],
  deeper1Title: "Cómo Adafactor hace el estado casi gratis",
  deeper1Body: "Una matriz de pesos de forma `n × m` necesita `n × m` números de varianza si guardas uno por peso — toda la rejilla. Adafactor nunca guarda la rejilla. Solo conserva un vector fila (`n` números) y un vector columna (`m` números), y reconstruye la varianza de cada celda como el producto externo de ambos, normalizado. Para una capa de 4096 × 4096 son ~8,000 números en vez de ~16,000,000 — un recorte de >1000×. La aproximación funciona porque las rejillas de varianza del gradiente son casi de rango 1 en la práctica; el costo es un poco de ruido extra, por eso Adafactor quiere calentamiento.",
  deeper2Title: "El paso por signo de Lion y la ortogonalización de Muon",
  deeper2Body: "**Lion** descarta la varianza por completo: actualiza cada peso con `−lr · sign(momento)`. Cada paso es ±lr, así que el tamaño de la actualización ya no se adapta por peso — eso ahorra la memoria y hace delicada la tasa de aprendizaje (muy grande y todos los pesos se pasan por igual). **Muon** toma la actualización de momento de una matriz de pesos 2D y la *ortogonaliza* — a grandes rasgos, corre unas pocas multiplicaciones de matriz baratas (una iteración de Newton–Schulz) para empujar los valores singulares de la actualización hacia 1. Eso reparte la actualización de forma pareja entre direcciones en vez de dejar que unas pocas dominen, por eso avanza más por paso en las matrices grandes.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Adafactor ahorra casi toda la memoria de optimizador de AdamW. Entonces, ¿por qué AdamW sigue siendo el predeterminado en casi todos los entrenamientos?",
  explainA: "Porque la memoria que gasta AdamW compra estabilidad. Su término de **varianza** por peso le da a cada peso su propio tamaño de paso, lo que lo hace indulgente — *funciona sin más* en distintos modelos y tasas de aprendizaje con poco ajuste. Los optimizadores más baratos cambian parte de esa seguridad por VRAM: Adafactor aproxima la varianza, Lion la descarta, así que quieren una tasa de aprendizaje menor y calentamiento o el entrenamiento tiembla. Recurres a ellos cuando la memoria es la restricción que aprieta — un modelo muy grande, o una GPU más pequeña — no porque sean estrictamente mejores. **Muon** es el punto medio interesante: guarda solo el momento en las grandes matrices de pesos y puede converger más rápido, por eso aparece en los speed-runs de entrenamiento.",
  bridgeLabel: "SIGUIENTE: AFINADO EFICIENTE EN PARÁMETROS",
  bridgeBody: "Ya hiciste más barato el optimizador. La otra forma de recortar memoria de entrenamiento es dejar de entrenar casi todos los pesos — **congelar el modelo y aprender un pequeño añadido**. Sigue: afinado eficiente en parámetros (LoRA).",
  prevLesson: "Volver a entrenamiento distribuido",
  nextLesson: "Continuar al afinado",
};
