/**
 * Stage 0 · 4.3 — Parameter-efficient fine-tuning (LoRA / QLoRA / DoRA).
 * Interface + EN/ES copy, isolated from every other lesson so edits here never
 * touch theirs. Builds on Supervised fine-tuning (4.x): same goal — specialise a
 * model — but instead of moving every weight, freeze them and train a tiny add-on.
 */
import type { WsNodeCopy } from "./shared";

/** One variant comparison card (Node 3). */
export interface PeftVariant {
  key: string;
  name: string;
  changes: string;
  cost: string;
  payoff: string;
}

export interface ParameterEfficientFinetuningLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — freeze + inject
  n1slider: string;
  n1adapterFmt: string; //   "+{n} params"
  n1capLo: string; //        capacity note at small rank
  n1capHi: string; //        capacity note at large rank
  n1frozenTag: string; //    diagram: "frozen"
  n1trainTag: string; //     diagram: "trainable"
  n1wCaption: string; //     diagram: under W block
  n1adapterCaption: string;//diagram: under adapter
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 2 — the memory win
  n2seg: string[]; //        [16-bit base · LoRA, 4-bit base · QLoRA]
  n2fullLabel: string; //    "Full fine-tune"
  n2adapterLabel: string; // "Adapter run"
  n2baseLegend: string; //   "frozen base"
  n2adapterLegend: string; //"adapter + optimizer"
  n2gpuLine: string; //      "24 GB GPU"
  n2offChart: string; //     "off the chart"
  n2fits: string; //         "fits ✓"
  n2nofit: string; //        "needs more ✕"

  // Node 3 — variants
  n3seg: string[]; //        [QLoRA, DoRA]
  n3changesLabel: string;
  n3costLabel: string;
  n3payoffLabel: string;
  n3variants: PeftVariant[];
  // QLoRA mini-diagram
  n3q16: string;
  n3q4: string;
  n3qCaption: string;
  // DoRA mini-diagram
  n3formula: string;
  n3dMag: string;
  n3dDir: string;
  n3dTrained: string;
  n3dLora: string;
  n3deeperTitle: string;
  n3deeperBody: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const parameterEfficientFinetuningEN: ParameterEfficientFinetuningLesson = {
  crumb: "STAGE 0 · 4.3 · PARAMETER-EFFICIENT FINE-TUNING",
  eyebrow: "STAGE 0 · 4.3 · 3 NODES",
  title: "Parameter-efficient fine-tuning",
  lede: "Full fine-tuning rewrites every weight — billions of them — and needs a room full of GPUs. LoRA freezes the model and trains a tiny add-on instead, so you can specialise a huge model on a single card. Here's how it works, and its two upgrades.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Freeze + inject", "The memory win", "QLoRA & DoRA"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Freeze the giant, train a tiny detour",
      intro: "You just saw supervised fine-tuning nudge a model toward good answers. Doing that to every weight needs a datacenter — LoRA gets the same effect by freezing the model and training a small add-on beside it.",
      bullets: [
        "**Freeze the base.** The billions of pretrained weights `W` don't move at all during training — they become read-only.",
        "**Inject a detour.** Alongside `W`, add two small matrices `A` and `B`. Their product `B·A` is the *change* to `W` — and it's the only thing that learns.",
        "**Low rank = few numbers.** `A` and `B` meet at a tiny inner size `r` (the rank), so together they hold `r·(d+k)` values instead of `d·k`.",
        "**Rank is the capacity dial.** A bigger `r` can express a richer update but costs more to train. Drag it below and watch the adapter grow.",
      ],
      cardLabel: "FROZEN W + LOW-RANK ADAPTER B·A",
      aria: "A frozen weight matrix W with a small trainable low-rank adapter A times B added alongside; their outputs sum.",
      steps: 1,
      captions: ["The frozen matrix W and the trainable adapter B·A run in parallel on the same input; their outputs add up."],
      hint: "Drag the rank — the adapter A·B grows thicker and holds more numbers, but W never moves.",
      readoutTitle: "ADAPTER_COST",
      rows: ["RANK", "TRAINABLE", "OF LAYER"],
      readoutNote: "What the adapter costs for one 4096×4096 layer: its rank, how many numbers it trains, and that as a share of the layer's 16.8M full weights.",
      sliderNote: "Rank r sets the adapter's capacity: B·A can only express a change of rank ≤ r. Small r means few parameters; large r moves closer to a full update.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Why it fits on one GPU",
      intro: "Training memory isn't mostly the weights — it's the gradient and optimizer state kept for every weight you train. Freeze almost everything and that cost collapses.",
      bullets: [
        "**Full fine-tuning is ~16 bytes per weight.** The weight, its gradient, and the optimizer's two running averages — for all 7B parameters. About 112 GB.",
        "**LoRA trains ~0.1% of them.** The frozen base only needs its 2-byte weights (~14 GB); gradient and optimizer exist just for the tiny adapter.",
        "**QLoRA squeezes the frozen base to 4-bit** — about 3.5 GB instead of 14 — because a frozen weight is only ever *read*, so lower precision barely hurts.",
        "**The result:** a 7B model you couldn't full-fine-tune on any single GPU now trains on one 24 GB card.",
      ],
      cardLabel: "TRAINING MEMORY · 7B MODEL",
      aria: "A bar chart comparing full fine-tuning memory against a LoRA adapter run, with a 24 GB GPU line.",
      steps: 1,
      captions: ["Full fine-tuning towers past any single GPU; the adapter run sits comfortably under the 24 GB line."],
      hint: "Flip the frozen base to 4-bit (QLoRA) — the adapter run's memory drops again, with room to spare.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["FULL FT", "LoRA", "QLoRA"],
      optionNotes: [
        "16-bit base — LoRA keeps the frozen weights in bf16: about 14 GB of read-only base, plus a tiny trainable adapter.",
        "4-bit base (QLoRA) — the frozen weights are quantized to 4-bit NF4, dropping the base to about 3.5 GB. It's only read, so the quality loss is negligible.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Two upgrades: QLoRA and DoRA",
      intro: "Plain LoRA has two well-known refinements — one shrinks the frozen base further, the other closes the small quality gap back to full fine-tuning.",
      bullets: [
        "**QLoRA — quantize the frozen base.** Store the read-only weights in 4-bit, so even a 70B model's base fits in memory. The adapter still trains in full precision.",
        "**DoRA — split size from direction.** Every weight is a length (its *magnitude*) times a unit *direction*. DoRA trains the magnitude directly and lets LoRA steer only the direction.",
        "**Why DoRA helps.** Full fine-tuning changes size and direction differently; giving them separate dials matches that, so quality lands closer to full FT at the same rank.",
        "**They stack.** QDoRA = a 4-bit base *and* the magnitude/direction split.",
      ],
      cardLabel: "QLoRA vs DoRA",
      aria: "Two cards: QLoRA compressing a weight from 16-bit to 4-bit, and DoRA splitting a weight into magnitude and direction.",
      steps: 1,
      captions: ["Two refinements on plain LoRA — one for memory, one for quality."],
      hint: "Tap a variant to see what it changes, what it costs, and what you get.",
      readoutTitle: "VARIANT",
      rows: [],
      optionNotes: [
        "QLoRA — the same LoRA adapters, but the frozen base is 4-bit. A pure memory win; quality tracks 16-bit LoRA closely. This is what puts 70B fine-tuning on a single 48 GB GPU.",
        "DoRA — decompose each weight into magnitude + direction, LoRA the direction, and train the magnitude on its own. A little more compute, but noticeably better quality than LoRA at low rank.",
      ],
    },
  ],
  n1slider: "RANK r",
  n1adapterFmt: "params",
  n1capLo: "Small rank: barely any parameters, but the adapter can only make a coarse change.",
  n1capHi: "Large rank: many more parameters, and the adapter can express a much richer update.",
  n1frozenTag: "frozen ❄",
  n1trainTag: "trainable",
  n1wCaption: "the pretrained weights — never updated",
  n1adapterCaption: "the only thing that learns",
  n1deeperTitle: "The LoRA update, precisely",
  n1deeperBody: "For a layer `h = W·x` with `x` in `d` dims and `h` in `k` dims, LoRA replaces the weight change `ΔW` with a product `ΔW = (α/r)·B·A`, where `A` is `r×d` and `B` is `k×r`. `A` starts from small random values and `B` starts at zero — so `ΔW` is zero at step one and training begins exactly at the base model. Because the useful update during fine-tuning has a low *intrinsic rank* (it lives in a few directions), a small `r` recovers most of the quality. Only `A` and `B` receive gradients and optimizer state; `W` is never differentiated. `α` is a fixed scale that keeps the update's size stable as you change `r`.",

  n2seg: ["16-bit base · LoRA", "4-bit base · QLoRA"],
  n2fullLabel: "Full fine-tune",
  n2adapterLabel: "Adapter run",
  n2baseLegend: "frozen base",
  n2adapterLegend: "adapter + optimizer",
  n2gpuLine: "24 GB GPU",
  n2offChart: "off the chart",
  n2fits: "fits ✓",
  n2nofit: "needs more ✕",

  n3seg: ["QLoRA", "DoRA"],
  n3changesLabel: "CHANGES",
  n3costLabel: "COST",
  n3payoffLabel: "PAYOFF",
  n3variants: [
    {
      key: "qlora",
      name: "QLoRA",
      changes: "Frozen base → 4-bit (NF4)",
      cost: "De-quantize on the fly during the forward pass",
      payoff: "70B fine-tuning on one 48 GB GPU",
    },
    {
      key: "dora",
      name: "DoRA",
      changes: "Split each weight into magnitude + direction",
      cost: "A little more compute per step",
      payoff: "Closer to full fine-tuning at the same rank",
    },
  ],
  n3q16: "16-bit weight",
  n3q4: "4-bit weight",
  n3qCaption: "4× smaller · read-only, so precision barely matters",
  n3formula: "W = m · (V / |V|)",
  n3dMag: "magnitude m",
  n3dDir: "direction V",
  n3dTrained: "trained directly",
  n3dLora: "LoRA steers this",

  n3deeperTitle: "How DoRA splits a weight",
  n3deeperBody: "DoRA writes each weight column as `W = m · (V / |V|)`: a trainable scalar length `m` (the *magnitude*) times a unit vector (the *direction*). The frozen base supplies the starting direction; LoRA's `B·A` nudges that direction, which is then re-normalised back to unit length, and `m` is learned separately. Splitting the two lets the model rescale a weight without rotating it (and vice-versa) — which is closer to how full fine-tuning actually moves weights, so DoRA matches full-FT quality more closely than LoRA at the same rank.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "LoRA trains far fewer parameters than full fine-tuning. Why does that make the memory saving so much bigger than the parameter saving alone?",
  explainA: "Because the weights themselves are the small part of the bill. For every parameter you *train*, the optimizer also stores a gradient and — for Adam — two running averages: roughly **16 bytes per trainable weight** versus 2 bytes for a frozen one. Freezing 99.9% of the model means all of that gradient and optimizer state disappears for those weights; you keep only their read-only values. So a ~0.1% cut in trainable parameters becomes an ~8× cut in memory. QLoRA pushes further by storing the frozen base in 4-bit — a weight that's only ever read doesn't need full precision — which is how a 70B model fine-tunes on a single GPU.",
  bridgeLabel: "NEXT: 4.4 · PPO",
  bridgeBody: "You can now cheaply specialise a model on example answers. But some things are easier to *reward* than to demonstrate. Next, **PPO** — training a model from a reward signal instead of labeled targets.",
  prevLesson: "Back: matrix optimizers",
  nextLesson: "Continue to 4.4",
};

/* ============================================================ SPANISH ======= */

export const parameterEfficientFinetuningES: ParameterEfficientFinetuningLesson = {
  crumb: "ETAPA 0 · 4.3 · AJUSTE FINO EFICIENTE EN PARÁMETROS",
  eyebrow: "ETAPA 0 · 4.3 · 3 NODOS",
  title: "Ajuste fino eficiente en parámetros",
  lede: "El ajuste fino completo reescribe cada peso — miles de millones — y necesita una sala llena de GPU. LoRA congela el modelo y entrena en su lugar un pequeño complemento, así puedes especializar un modelo enorme en una sola tarjeta. Aquí ves cómo funciona, y sus dos mejoras.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Congelar + inyectar", "El ahorro de memoria", "QLoRA y DoRA"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Congela al gigante, entrena un desvío diminuto",
      intro: "Acabas de ver el ajuste fino supervisado empujar un modelo hacia buenas respuestas. Hacerlo con cada peso necesita un centro de datos — LoRA logra el mismo efecto congelando el modelo y entrenando un pequeño complemento a su lado.",
      bullets: [
        "**Congela la base.** Los miles de millones de pesos preentrenados `W` no se mueven durante el entrenamiento — quedan de solo lectura.",
        "**Inyecta un desvío.** Junto a `W`, añade dos matrices pequeñas `A` y `B`. Su producto `B·A` es el *cambio* de `W` — y es lo único que aprende.",
        "**Rango bajo = pocos números.** `A` y `B` se encuentran en un tamaño interior diminuto `r` (el rango), así que juntas guardan `r·(d+k)` valores en vez de `d·k`.",
        "**El rango es el dial de capacidad.** Un `r` mayor puede expresar una actualización más rica pero cuesta más entrenar. Arrástralo abajo y mira crecer el adaptador.",
      ],
      cardLabel: "W CONGELADA + ADAPTADOR DE RANGO BAJO B·A",
      aria: "Una matriz de pesos W congelada con un pequeño adaptador entrenable de rango bajo A por B añadido al lado; sus salidas se suman.",
      steps: 1,
      captions: ["La matriz congelada W y el adaptador entrenable B·A corren en paralelo sobre la misma entrada; sus salidas se suman."],
      hint: "Arrastra el rango — el adaptador A·B se hace más grueso y guarda más números, pero `W` nunca se mueve.",
      readoutTitle: "ADAPTER_COST",
      rows: ["RANGO", "ENTRENABLES", "DE LA CAPA"],
      readoutNote: "Lo que cuesta el adaptador para una capa de 4096×4096: su rango, cuántos números entrena y eso como fracción de los 16.8M pesos completos de la capa.",
      sliderNote: "El rango r fija la capacidad del adaptador: `B·A` solo puede expresar un cambio de rango ≤ r. Un r pequeño son pocos parámetros; un r grande se acerca a una actualización completa.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Por qué cabe en una sola GPU",
      intro: "La memoria de entrenamiento no es sobre todo los pesos — es el gradiente y el estado del optimizador que se guarda por cada peso que entrenas. Congela casi todo y ese costo se desploma.",
      bullets: [
        "**El ajuste fino completo son ~16 bytes por peso.** El peso, su gradiente y los dos promedios móviles del optimizador — para los 7B de parámetros. Unos 112 GB.",
        "**LoRA entrena ~0.1% de ellos.** La base congelada solo necesita sus pesos de 2 bytes (~14 GB); gradiente y optimizador existen solo para el adaptador diminuto.",
        "**QLoRA comprime la base congelada a 4-bit** — unos 3.5 GB en vez de 14 — porque un peso congelado solo se *lee*, así que la precisión baja apenas afecta.",
        "**El resultado:** un modelo de 7B que no podías ajustar por completo en ninguna GPU ahora entrena en una tarjeta de 24 GB.",
      ],
      cardLabel: "MEMORIA DE ENTRENAMIENTO · MODELO 7B",
      aria: "Un gráfico de barras que compara la memoria del ajuste fino completo con una corrida con adaptador LoRA, con una línea de GPU de 24 GB.",
      steps: 1,
      captions: ["El ajuste fino completo se dispara más allá de cualquier GPU; la corrida con adaptador queda cómoda bajo la línea de 24 GB."],
      hint: "Cambia la base congelada a 4-bit (QLoRA) — la memoria de la corrida con adaptador baja de nuevo, con espacio de sobra.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["FULL FT", "LoRA", "QLoRA"],
      optionNotes: [
        "Base 16-bit — LoRA mantiene los pesos congelados en bf16: unos 14 GB de base de solo lectura, más un adaptador entrenable diminuto.",
        "Base 4-bit (QLoRA) — los pesos congelados se cuantizan a 4-bit NF4, bajando la base a unos 3.5 GB. Solo se leen, así que la pérdida de calidad es insignificante.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Dos mejoras: QLoRA y DoRA",
      intro: "El LoRA simple tiene dos refinamientos conocidos — uno encoge aún más la base congelada, el otro cierra la pequeña brecha de calidad hasta el ajuste fino completo.",
      bullets: [
        "**QLoRA — cuantiza la base congelada.** Guarda los pesos de solo lectura en 4-bit, así hasta la base de un modelo de 70B cabe en memoria. El adaptador aún entrena en precisión completa.",
        "**DoRA — separa tamaño de dirección.** Cada peso es una longitud (su *magnitud*) por una *dirección* unitaria. DoRA entrena la magnitud directamente y deja que LoRA guíe solo la dirección.",
        "**Por qué ayuda DoRA.** El ajuste fino completo cambia tamaño y dirección de forma distinta; darles diales separados imita eso, así la calidad se acerca al ajuste completo con el mismo rango.",
        "**Se combinan.** QDoRA = base de 4-bit *y* la separación magnitud/dirección.",
      ],
      cardLabel: "QLoRA vs DoRA",
      aria: "Dos tarjetas: QLoRA comprimiendo un peso de 16-bit a 4-bit, y DoRA separando un peso en magnitud y dirección.",
      steps: 1,
      captions: ["Dos refinamientos sobre el LoRA simple — uno para memoria, otro para calidad."],
      hint: "Toca una variante para ver qué cambia, qué cuesta y qué obtienes.",
      readoutTitle: "VARIANT",
      rows: [],
      optionNotes: [
        "QLoRA — los mismos adaptadores LoRA, pero la base congelada es de 4-bit. Un ahorro puro de memoria; la calidad sigue de cerca al LoRA de 16-bit. Esto es lo que pone el ajuste de 70B en una sola GPU de 48 GB.",
        "DoRA — descompone cada peso en magnitud + dirección, aplica LoRA a la dirección y entrena la magnitud por su cuenta. Un poco más de cómputo, pero calidad notablemente mejor que LoRA con rango bajo.",
      ],
    },
  ],
  n1slider: "RANGO r",
  n1adapterFmt: "parámetros",
  n1capLo: "Rango pequeño: casi ningún parámetro, pero el adaptador solo puede hacer un cambio tosco.",
  n1capHi: "Rango grande: muchos más parámetros, y el adaptador puede expresar una actualización mucho más rica.",
  n1frozenTag: "congelada ❄",
  n1trainTag: "entrenable",
  n1wCaption: "los pesos preentrenados — nunca se actualizan",
  n1adapterCaption: "lo único que aprende",
  n1deeperTitle: "La actualización LoRA, con precisión",
  n1deeperBody: "Para una capa `h = W·x` con `x` en `d` dimensiones y `h` en `k` dimensiones, LoRA reemplaza el cambio de peso `ΔW` por un producto `ΔW = (α/r)·B·A`, donde `A` es `r×d` y `B` es `k×r`. `A` parte de valores aleatorios pequeños y `B` parte de cero — así `ΔW` es cero en el primer paso y el entrenamiento comienza exactamente en el modelo base. Como la actualización útil durante el ajuste fino tiene un *rango intrínseco* bajo (vive en unas pocas direcciones), un `r` pequeño recupera casi toda la calidad. Solo `A` y `B` reciben gradientes y estado del optimizador; `W` nunca se deriva. `α` es una escala fija que mantiene estable el tamaño de la actualización al cambiar `r`.",

  n2seg: ["Base 16-bit · LoRA", "Base 4-bit · QLoRA"],
  n2fullLabel: "Ajuste completo",
  n2adapterLabel: "Corrida adaptador",
  n2baseLegend: "base congelada",
  n2adapterLegend: "adaptador + optimizador",
  n2gpuLine: "GPU de 24 GB",
  n2offChart: "fuera del gráfico",
  n2fits: "cabe ✓",
  n2nofit: "no alcanza ✕",

  n3seg: ["QLoRA", "DoRA"],
  n3changesLabel: "CAMBIA",
  n3costLabel: "COSTO",
  n3payoffLabel: "GANANCIA",
  n3variants: [
    {
      key: "qlora",
      name: "QLoRA",
      changes: "Base congelada → 4-bit (NF4)",
      cost: "Descuantizar al vuelo en el paso hacia adelante",
      payoff: "Ajuste de 70B en una sola GPU de 48 GB",
    },
    {
      key: "dora",
      name: "DoRA",
      changes: "Separar cada peso en magnitud + dirección",
      cost: "Un poco más de cómputo por paso",
      payoff: "Más cerca del ajuste completo con el mismo rango",
    },
  ],
  n3q16: "peso 16-bit",
  n3q4: "peso 4-bit",
  n3qCaption: "4× más pequeño · de solo lectura, la precisión apenas importa",
  n3formula: "W = m · (V / |V|)",
  n3dMag: "magnitud m",
  n3dDir: "dirección V",
  n3dTrained: "entrenada directo",
  n3dLora: "LoRA guía esto",

  n3deeperTitle: "Cómo DoRA separa un peso",
  n3deeperBody: "DoRA escribe cada columna de peso como `W = m · (V / |V|)`: una longitud escalar entrenable `m` (la *magnitud*) por un vector unitario (la *dirección*). La base congelada aporta la dirección inicial; el `B·A` de LoRA empuja esa dirección, que luego se re-normaliza a longitud unitaria, y `m` se aprende por separado. Separar las dos permite al modelo reescalar un peso sin rotarlo (y viceversa) — que se parece más a cómo el ajuste fino completo mueve de verdad los pesos, así DoRA iguala la calidad del ajuste completo más de cerca que LoRA con el mismo rango.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "LoRA entrena muchísimos menos parámetros que el ajuste fino completo. ¿Por qué eso hace que el ahorro de memoria sea mucho mayor que el ahorro de parámetros por sí solo?",
  explainA: "Porque los pesos en sí son la parte pequeña de la cuenta. Por cada parámetro que *entrenas*, el optimizador también guarda un gradiente y — con Adam — dos promedios móviles: unos **16 bytes por peso entrenable** frente a 2 bytes por uno congelado. Congelar el 99.9% del modelo hace que todo ese gradiente y estado del optimizador desaparezca para esos pesos; solo conservas sus valores de solo lectura. Así un recorte de ~0.1% en parámetros entrenables se vuelve un recorte de ~8× en memoria. QLoRA va más lejos guardando la base congelada en 4-bit — un peso que solo se lee no necesita precisión completa — que es como un modelo de 70B se ajusta en una sola GPU.",
  bridgeLabel: "SIGUIENTE: 4.4 · PPO",
  bridgeBody: "Ya puedes especializar un modelo de forma barata con respuestas de ejemplo. Pero algunas cosas son más fáciles de *recompensar* que de demostrar. Sigue **PPO** — entrenar un modelo con una señal de recompensa en vez de objetivos etiquetados.",
  prevLesson: "Atrás: optimizadores matriciales",
  nextLesson: "Continuar a 4.4",
};
