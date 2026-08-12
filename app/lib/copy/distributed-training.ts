/**
 * Stage 0 · Phase 2 — Distributed training. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: a model too big for one GPU is split across many — data, tensor and
 * pipeline parallelism — and ZeRO / FSDP shards the optimizer state, gradients
 * and parameters so no single GPU holds a full copy.
 */
import type { WsNodeCopy } from "./shared";

export interface DistributedTrainingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — data parallel
  n1slider: string;
  n1legend: string[]; //  [full model copy, batch shard]
  n1bus: string; //       "all-reduce ∇" diagram label
  // Node 2 — tensor & pipeline
  n2slider: string;
  n2tensorLabel: string;
  n2tensorSub: string;
  n2pipelineLabel: string;
  n2pipelineSub: string;
  n2allgather: string; // "all-gather" diagram label
  n2micro: string; //     "micro-batch" diagram label
  // Node 3 — ZeRO / FSDP
  n3stages: string[]; //  4 stage button labels
  n3slider: string;
  n3seg: string[]; //     [Params, Gradients, Optimizer state]
  n3capLabel: string; //  "80 GB GPU"
  n3fits: string;
  n3nofit: string;
  n3deeperTitle: string;
  n3deeperBody: string;
  // callouts
  calloutSyncLabel: string;
  calloutSyncTitle: string;
  calloutSyncBody: string;
  callout3dLabel: string;
  callout3dTitle: string;
  callout3dBody: string;
  // explain / bridge / nav
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  navPrev: string;
  navNext: string;
}

export const distributedTrainingEN: DistributedTrainingLesson = {
  crumb: "STAGE 0 · DISTRIBUTED TRAINING",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Distributed training",
  lede: "A frontier model is far too big for one GPU. This is how labs split the model — and the batch — across hundreds of chips, so a 7.5-billion-parameter model that needs 120 GB trains on 80 GB cards. Play with each split and watch the memory per GPU fall.",
  pipelineLabel: "THE 3 SPLITS",
  pipeline: ["Data parallel", "Tensor & pipeline", "ZeRO / FSDP sharding"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Copy the model, split the batch",
      intro: "The simplest split: put a full copy of the model on every GPU, feed each a different slice of the batch, then average their gradients so all copies stay identical.",
      bullets: [
        "**Every GPU holds the whole model** — same weights, same optimizer state, just different data.",
        "**Each GPU trains on its own batch shard,** runs the forward and backward pass you met in *How models learn*, and gets its own gradients.",
        "**An all-reduce averages the gradients** across GPUs — one network step that keeps every copy in sync. (`all-reduce` = each GPU sends its gradients and gets back the sum.)",
        "**Throughput scales, memory doesn't.** N GPUs train ~N× faster, but each still needs room for the entire model — so data-parallel alone can't train a model bigger than one card.",
      ],
      cardLabel: "DATA-PARALLEL GPU GRID",
      aria: "A grid of GPUs, each holding a full copy of the model and a different batch shard, joined by an all-reduce bus.",
      steps: 1,
      captions: ["A full model on every GPU; each takes a different batch shard, then all-reduce syncs the gradients."],
      hint: "Add GPUs — throughput climbs, but the memory per GPU stays pinned to one full copy.",
      readoutTitle: "DATA_PARALLEL",
      rows: ["GPUS", "GLOBAL BATCH", "THROUGHPUT", "MODEL / GPU"],
      readoutNote: "More replicas process more samples per step at higher throughput — but each GPU still stores one entire model.",
      sliderNote: "Each replica is a full copy of the model. Adding replicas speeds up training but never shrinks the per-GPU model — that's the wall the next two splits break.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Split one model across GPUs",
      intro: "When the model itself won't fit on a card, you cut it up. There are two ways, and a real run uses both at once.",
      bullets: [
        "**Tensor parallel slices each layer.** One layer's weight matrix is cut into vertical strips, one per GPU; each does part of the matrix multiply, then an *all-gather* stitches the pieces back.",
        "**Pipeline parallel slices the stack.** Consecutive layers become stages — GPU 1 holds layers 1–4, GPU 2 holds 5–8 — and activations flow forward like an assembly line.",
        "**Pipelines have a bubble.** While the first stage works, later stages sit idle; splitting the batch into *micro-batches* keeps them fed and shrinks the gap.",
        "**Both shrink the per-GPU model.** Tensor parallel needs the fastest links (heavy chatter inside every layer); pipeline parallel is cheaper to communicate but harder to keep busy.",
      ],
      cardLabel: "TENSOR vs PIPELINE",
      aria: "Two panels: tensor parallel slicing one layer across GPUs, and pipeline parallel splitting the layer stack into stages.",
      steps: 1,
      captions: ["Left: one layer split across GPUs. Right: the layer stack split into stages."],
      hint: "Raise the degree — tensor parallel cuts each layer into more strips; pipeline parallel cuts the stack into more stages.",
      readoutTitle: "MODEL_SPLIT",
      rows: ["DEGREE", "TENSOR", "PIPELINE", "MODEL / GPU"],
      readoutNote: "With degree N, tensor parallel puts 1/N of each layer on a GPU and pipeline parallel puts 1/N of the layers — either way, each GPU holds a fraction of the model.",
      sliderNote: "Degree = how many GPUs share the model. A higher degree means a smaller slice per GPU — and more communication to stitch the pieces back together.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Shard what each GPU stores",
      intro: "Data parallel wastes memory: every GPU keeps an identical copy of the params, gradients and optimizer state. ZeRO — and PyTorch's FSDP — stops the duplication, sharding those three across GPUs and gathering each piece only when it's needed.",
      bullets: [
        "**Training memory is three things** (from *How models learn*): the parameters, their gradients, and the optimizer state. With mixed-precision Adam that's about **16 bytes per parameter** — 2 + 2 + 12.",
        "**ZeRO-1 shards the optimizer state,** the biggest chunk (12 of the 16 bytes). Each GPU keeps only 1/N of it.",
        "**ZeRO-2 also shards the gradients; ZeRO-3 (FSDP) shards the parameters too** — so no GPU holds a full copy of anything.",
        "**Same maths as data parallel, a fraction of the memory.** A 7.5B model needs 120 GB replicated; sharded across 8 GPUs, ZeRO-3 drops it to 15 GB — it fits an 80 GB card with room to spare.",
      ],
      cardLabel: "MEMORY PER GPU",
      aria: "A stacked memory bar — parameters, gradients, optimizer state — shrinking below the 80 GB GPU line as sharding increases.",
      steps: 1,
      captions: ["The per-GPU memory bar shrinks as ZeRO shards more of it across the GPUs."],
      hint: "Step up the ZeRO stage and add GPUs — watch the bar drop under the 80 GB line.",
      readoutTitle: "MEMORY_PER_GPU",
      rows: ["STAGE", "SHARDED OVER", "MODEL / GPU", "FITS 80 GB?"],
      readoutNote: "The 7.5B-parameter model needs 120 GB replicated. Each stage shards more of that across the GPUs; the bar and this number are the memory one GPU must hold.",
      optionNotes: [
        "Replicated (DDP) — plain data parallel. Every GPU stores all 120 GB: params, gradients and optimizer state in full. Nothing is sharded.",
        "ZeRO-1 — shard the optimizer state (12 of the 16 bytes/param) across the GPUs. Params and gradients are still full on each.",
        "ZeRO-2 — also shard the gradients. Only the parameters stay fully replicated on every GPU.",
        "ZeRO-3 / FSDP — shard the parameters too. Each GPU holds 1/N of everything and gathers the rest just-in-time during the forward and backward pass.",
      ],
    },
  ],
  n1slider: "GPUS (replicas)",
  n1legend: ["full model copy", "batch shard"],
  n1bus: "all-reduce ∇",
  n2slider: "DEGREE (GPUs per group)",
  n2tensorLabel: "TENSOR PARALLEL",
  n2tensorSub: "one layer, split across GPUs",
  n2pipelineLabel: "PIPELINE PARALLEL",
  n2pipelineSub: "the stack, split into stages",
  n2allgather: "all-gather",
  n2micro: "micro-batch",
  n3stages: ["Replicated (DDP)", "ZeRO-1", "ZeRO-2", "ZeRO-3 / FSDP"],
  n3slider: "SHARDED OVER (GPUs)",
  n3seg: ["Params", "Gradients", "Optimizer state"],
  n3capLabel: "80 GB GPU",
  n3fits: "fits ✓",
  n3nofit: "doesn't fit ✕",
  n3deeperTitle: "The 16 bytes per parameter",
  n3deeperBody:
    "Mixed-precision Adam stores, for every single parameter: a 16-bit weight (2 bytes) and its 16-bit gradient (2 bytes), plus the optimizer's own bookkeeping — an fp32 master copy of the weight (4), the fp32 momentum (4) and the fp32 variance (4). That's 2 + 2 + 12 = 16 bytes per parameter, so a 7.5B model needs 7.5e9 × 16 ≈ 120 GB before a single activation. ZeRO-3 divides all 16 by the number of GPUs N; ZeRO-2 divides the 14 (grads + optimizer); ZeRO-1 divides only the 12 (optimizer state). Activations are extra memory, handled separately with activation checkpointing.",
  calloutSyncLabel: "GOOD TO KNOW · THE SYNC",
  calloutSyncTitle: "all-reduce over NCCL",
  calloutSyncBody:
    "Averaging the gradients is a collective operation — NVIDIA's NCCL library runs it over fast GPU-to-GPU links (NVLink inside a node, InfiniBand between nodes). It's the main communication cost of data-parallel training, and why network bandwidth matters as much as raw compute.",
  callout3dLabel: "GOOD TO KNOW · 3D PARALLELISM",
  callout3dTitle: "Real runs combine all three",
  callout3dBody:
    "A production run stacks the splits: tensor parallel inside a node (over fast NVLink), pipeline parallel across nodes, and data parallel with ZeRO on top. Splitting along all three axes at once is called 3D parallelism — it's how trillion-parameter models fit on thousands of GPUs.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Data-parallel training puts a full copy of the model on every GPU. Why does that stop you from training a really big model — and what does ZeRO-3 change?",
  explainA:
    "Because \"a full copy\" means every GPU must hold the entire model plus its gradients and optimizer state — about 16 bytes per parameter, or 120 GB for a 7.5B model. If that doesn't fit one card, adding more cards doesn't help: each new GPU needs the same 120 GB. ZeRO-3 (FSDP) breaks the duplication by sharding the parameters, gradients and optimizer state across the GPUs, so each holds only 1/N and gathers the rest just in time. The compute is the same as data parallel; the memory per GPU drops by N — which is what lets a 120 GB model train on 80 GB cards.",
  bridgeLabel: "NEXT: MATRIX OPTIMIZERS",
  bridgeBody:
    "You've split the model across the cluster. Next: the optimizer that spends all that memory — from **AdamW to Muon**, the newer optimizers that update weights as whole matrices, not loose numbers, and train large models faster for the same compute.",
  navPrev: "Mixed-precision training",
  navNext: "Matrix optimizers",
};

export const distributedTrainingES: DistributedTrainingLesson = {
  crumb: "ETAPA 0 · ENTRENAMIENTO DISTRIBUIDO",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Entrenamiento distribuido",
  lede: "Un modelo de frontera es demasiado grande para una sola GPU. Así dividen los laboratorios el modelo — y el lote — entre cientos de chips, para que un modelo de 7500 millones de parámetros que necesita 120 GB entrene en tarjetas de 80 GB. Juega con cada división y observa cómo cae la memoria por GPU.",
  pipelineLabel: "LAS 3 DIVISIONES",
  pipeline: ["Paralelismo de datos", "Tensor y pipeline", "Fragmentado ZeRO / FSDP"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Copia el modelo, divide el lote",
      intro: "La división más simple: pon una copia completa del modelo en cada GPU, dale a cada una una porción distinta del lote y luego promedia sus gradientes para que todas las copias sigan idénticas.",
      bullets: [
        "**Cada GPU tiene el modelo entero** — mismos pesos, mismo estado del optimizador, solo datos distintos.",
        "**Cada GPU entrena con su propia porción del lote,** hace la pasada hacia adelante y hacia atrás que viste en *Cómo aprenden los modelos*, y obtiene sus propios gradientes.",
        "**Un all-reduce promedia los gradientes** entre las GPU — un paso de red que mantiene toda copia en sincronía. (`all-reduce` = cada GPU envía sus gradientes y recibe de vuelta la suma.)",
        "**El rendimiento escala, la memoria no.** N GPU entrenan ~N× más rápido, pero cada una aún necesita espacio para el modelo entero — así que el paralelismo de datos por sí solo no puede entrenar un modelo más grande que una tarjeta.",
      ],
      cardLabel: "REJILLA DE GPU · PARALELISMO DE DATOS",
      aria: "Una rejilla de GPU, cada una con una copia completa del modelo y una porción distinta del lote, unidas por un bus all-reduce.",
      steps: 1,
      captions: ["Un modelo completo en cada GPU; cada una toma una porción distinta del lote, y luego all-reduce sincroniza los gradientes."],
      hint: "Añade GPU — el rendimiento sube, pero la memoria por GPU queda fija en una copia completa.",
      readoutTitle: "DATA_PARALLEL",
      rows: ["GPUS", "LOTE GLOBAL", "RENDIMIENTO", "MODELO / GPU"],
      readoutNote: "Más réplicas procesan más muestras por paso a mayor rendimiento — pero cada GPU sigue guardando un modelo entero.",
      sliderNote: "Cada réplica es una copia completa del modelo. Añadir réplicas acelera el entrenamiento pero nunca reduce el modelo por GPU — ese es el muro que rompen las dos divisiones siguientes.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Divide un modelo entre GPU",
      intro: "Cuando el modelo mismo no cabe en una tarjeta, lo cortas. Hay dos formas, y una corrida real usa ambas a la vez.",
      bullets: [
        "**El paralelismo de tensor corta cada capa.** La matriz de pesos de una capa se parte en tiras verticales, una por GPU; cada una hace parte de la multiplicación de matrices, y luego un *all-gather* vuelve a unir las piezas.",
        "**El paralelismo de pipeline corta la pila.** Capas consecutivas se vuelven etapas — la GPU 1 tiene las capas 1–4, la GPU 2 las 5–8 — y las activaciones fluyen hacia adelante como una línea de montaje.",
        "**Los pipelines tienen una burbuja.** Mientras la primera etapa trabaja, las siguientes están ociosas; partir el lote en *micro-lotes* las mantiene ocupadas y encoge el hueco.",
        "**Ambos reducen el modelo por GPU.** El paralelismo de tensor necesita los enlaces más rápidos (mucha charla dentro de cada capa); el de pipeline es más barato de comunicar pero más difícil de mantener ocupado.",
      ],
      cardLabel: "TENSOR vs PIPELINE",
      aria: "Dos paneles: paralelismo de tensor cortando una capa entre GPU, y paralelismo de pipeline dividiendo la pila de capas en etapas.",
      steps: 1,
      captions: ["Izquierda: una capa dividida entre GPU. Derecha: la pila de capas dividida en etapas."],
      hint: "Sube el grado — el tensor corta cada capa en más tiras; el pipeline corta la pila en más etapas.",
      readoutTitle: "MODEL_SPLIT",
      rows: ["GRADO", "TENSOR", "PIPELINE", "MODELO / GPU"],
      readoutNote: "Con grado N, el paralelismo de tensor pone 1/N de cada capa en una GPU y el de pipeline pone 1/N de las capas — de cualquier forma, cada GPU tiene una fracción del modelo.",
      sliderNote: "Grado = cuántas GPU comparten el modelo. Un grado más alto significa una porción más pequeña por GPU — y más comunicación para volver a unir las piezas.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Fragmenta lo que guarda cada GPU",
      intro: "El paralelismo de datos desperdicia memoria: cada GPU guarda una copia idéntica de los parámetros, los gradientes y el estado del optimizador. ZeRO — y FSDP de PyTorch — corta la duplicación, fragmentando esos tres entre las GPU y reuniendo cada pieza solo cuando hace falta.",
      bullets: [
        "**La memoria de entrenamiento son tres cosas** (de *Cómo aprenden los modelos*): los parámetros, sus gradientes y el estado del optimizador. Con Adam en precisión mixta son unos **16 bytes por parámetro** — 2 + 2 + 12.",
        "**ZeRO-1 fragmenta el estado del optimizador,** el trozo más grande (12 de los 16 bytes). Cada GPU guarda solo 1/N de él.",
        "**ZeRO-2 también fragmenta los gradientes; ZeRO-3 (FSDP) fragmenta los parámetros además** — así ninguna GPU tiene una copia completa de nada.",
        "**La misma matemática que el paralelismo de datos, una fracción de la memoria.** Un modelo de 7.5B necesita 120 GB replicado; fragmentado entre 8 GPU, ZeRO-3 lo baja a 15 GB — cabe en una tarjeta de 80 GB con espacio de sobra.",
      ],
      cardLabel: "MEMORIA POR GPU",
      aria: "Una barra de memoria apilada — parámetros, gradientes, estado del optimizador — que se encoge por debajo de la línea de la GPU de 80 GB conforme aumenta el fragmentado.",
      steps: 1,
      captions: ["La barra de memoria por GPU se encoge conforme ZeRO fragmenta más de ella entre las GPU."],
      hint: "Sube la etapa de ZeRO y añade GPU — mira caer la barra bajo la línea de 80 GB.",
      readoutTitle: "MEMORY_PER_GPU",
      rows: ["ETAPA", "FRAGMENTADO EN", "MODELO / GPU", "¿CABE EN 80 GB?"],
      readoutNote: "El modelo de 7.5B parámetros necesita 120 GB replicado. Cada etapa fragmenta más de eso entre las GPU; la barra y este número son la memoria que una GPU debe guardar.",
      optionNotes: [
        "Replicado (DDP) — paralelismo de datos puro. Cada GPU guarda los 120 GB completos: parámetros, gradientes y estado del optimizador enteros. Nada fragmentado.",
        "ZeRO-1 — fragmenta el estado del optimizador (12 de los 16 bytes/param) entre las GPU. Los parámetros y gradientes siguen enteros en cada una.",
        "ZeRO-2 — fragmenta también los gradientes. Solo los parámetros quedan replicados enteros en cada GPU.",
        "ZeRO-3 / FSDP — fragmenta también los parámetros. Cada GPU tiene 1/N de todo y reúne el resto justo a tiempo durante la pasada hacia adelante y hacia atrás.",
      ],
    },
  ],
  n1slider: "GPUS (réplicas)",
  n1legend: ["copia completa del modelo", "porción del lote"],
  n1bus: "all-reduce ∇",
  n2slider: "GRADO (GPU por grupo)",
  n2tensorLabel: "PARALELISMO DE TENSOR",
  n2tensorSub: "una capa, dividida entre GPU",
  n2pipelineLabel: "PARALELISMO DE PIPELINE",
  n2pipelineSub: "la pila, dividida en etapas",
  n2allgather: "all-gather",
  n2micro: "micro-lote",
  n3stages: ["Replicado (DDP)", "ZeRO-1", "ZeRO-2", "ZeRO-3 / FSDP"],
  n3slider: "FRAGMENTADO EN (GPU)",
  n3seg: ["Parámetros", "Gradientes", "Estado del optimizador"],
  n3capLabel: "GPU de 80 GB",
  n3fits: "cabe ✓",
  n3nofit: "no cabe ✕",
  n3deeperTitle: "Los 16 bytes por parámetro",
  n3deeperBody:
    "Adam en precisión mixta guarda, por cada parámetro: un peso de 16 bits (2 bytes) y su gradiente de 16 bits (2 bytes), más la contabilidad propia del optimizador — una copia maestra fp32 del peso (4), el momento fp32 (4) y la varianza fp32 (4). Son 2 + 2 + 12 = 16 bytes por parámetro, así que un modelo de 7.5B necesita 7.5e9 × 16 ≈ 120 GB antes de una sola activación. ZeRO-3 divide los 16 entre el número de GPU N; ZeRO-2 divide los 14 (gradientes + optimizador); ZeRO-1 divide solo los 12 (estado del optimizador). Las activaciones son memoria extra, gestionada aparte con checkpointing de activaciones.",
  calloutSyncLabel: "PARA SABER · LA SINCRONÍA",
  calloutSyncTitle: "all-reduce sobre NCCL",
  calloutSyncBody:
    "Promediar los gradientes es una operación colectiva — la librería NCCL de NVIDIA la ejecuta sobre enlaces rápidos GPU-a-GPU (NVLink dentro de un nodo, InfiniBand entre nodos). Es el principal costo de comunicación del paralelismo de datos, y por eso el ancho de banda de red importa tanto como el cómputo puro.",
  callout3dLabel: "PARA SABER · PARALELISMO 3D",
  callout3dTitle: "Las corridas reales combinan las tres",
  callout3dBody:
    "Una corrida de producción apila las divisiones: paralelismo de tensor dentro de un nodo (sobre NVLink rápido), de pipeline entre nodos, y de datos con ZeRO por encima. Dividir a lo largo de los tres ejes a la vez se llama paralelismo 3D — así caben los modelos de billones de parámetros en miles de GPU.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "El entrenamiento con paralelismo de datos pone una copia completa del modelo en cada GPU. ¿Por qué eso te impide entrenar un modelo realmente grande — y qué cambia ZeRO-3?",
  explainA:
    "Porque \"una copia completa\" significa que cada GPU debe tener el modelo entero más sus gradientes y estado del optimizador — unos 16 bytes por parámetro, o 120 GB para un modelo de 7.5B. Si eso no cabe en una tarjeta, añadir más tarjetas no ayuda: cada GPU nueva necesita los mismos 120 GB. ZeRO-3 (FSDP) rompe la duplicación fragmentando los parámetros, los gradientes y el estado del optimizador entre las GPU, así cada una tiene solo 1/N y reúne el resto justo a tiempo. El cómputo es el mismo que el paralelismo de datos; la memoria por GPU cae por N — que es lo que deja entrenar un modelo de 120 GB en tarjetas de 80 GB.",
  bridgeLabel: "SIGUIENTE: OPTIMIZADORES MATRICIALES",
  bridgeBody:
    "Ya dividiste el modelo por todo el clúster. Sigue: el optimizador que gasta toda esa memoria — de **AdamW a Muon**, los optimizadores más nuevos que actualizan los pesos como matrices enteras, no como números sueltos, y entrenan modelos grandes más rápido con el mismo cómputo.",
  navPrev: "Entrenamiento en precisión mixta",
  navNext: "Optimizadores matriciales",
};
