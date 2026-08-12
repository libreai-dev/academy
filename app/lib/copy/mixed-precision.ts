/**
 * Stage 0 · 2.5 — Mixed-precision training. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * Builds on Backpropagation (gradients flow backward through the network). One
 * idea: train in low-precision numbers (BF16/FP8) for speed and memory, and use
 * a full-precision master copy plus loss scaling so the tiniest gradients don't
 * round away to zero.
 */
import type { WsNodeCopy } from "./shared";

export interface MixedPrecisionLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — number formats
  n1legendSign: string; //   "sign"
  n1legendExp: string; //    "exponent → range"
  n1legendMant: string; //   "mantissa → precision"
  n1bitsWord: string; //     "bits"
  n1byteWord: string; //     "byte"
  n1bytesWord: string; //    "bytes"

  // Node 2 — loss scaling
  n2slider: string; //       "LOSS SCALE  S = 2^k"
  n2rawHead: string; //      "raw gradient"
  n2scaledHead: string; //   "× S, stored in FP16"
  n2floorNote: string; //    "FP16 floor ≈ 6e-8 — below this rounds to 0"
  n2kept: string; //         "survives"
  n2lost: string; //         "→ 0  lost"
  n2summaryFmt: string; //   "kept" (used as: "kept 3 / 5")
  calloutMasterLabel: string;
  calloutMasterTitle: string;
  calloutMasterBody: string;
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 1 deeper
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 3 — memory budget
  n3precision: string[]; //  ["FP32", "BF16"]
  n3checkpointLabel: string; // "GRADIENT CHECKPOINTING"
  n3on: string;
  n3off: string;
  n3microSlider: string; //  "MICRO-BATCH"
  n3accumSlider: string; //  "ACCUMULATION STEPS"
  n3segStates: string; //    "model states"
  n3segAct: string; //       "activations"
  n3capacityLabel: string; //"H100 · 80 GB"
  n3fit: string; //          "FITS"
  n3oom: string; //          "OUT OF MEMORY"
  n3effBatchFmt: string; //  "effective batch"
  n3ckptNote: string; //     note shown when checkpointing is toggled
  n3batchNote: string; //    note shown when a batch slider moves
  n3deeperTitle: string;
  n3deeperBody: string;

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

export const mixedPrecisionEN: MixedPrecisionLesson = {
  crumb: "STAGE 0 · 2.5 · MIXED-PRECISION TRAINING",
  eyebrow: "STAGE 0 · 2.5 · 3 NODES",
  title: "Mixed-precision training",
  lede: "Backprop gives you the gradients — now you have to store and multiply billions of them, fast, on a fixed slab of GPU memory. The trick: do the math in tiny low-precision numbers for speed, and keep a full-precision safety copy so the smallest gradients don't quietly vanish.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Bits: range vs precision", "Rescuing tiny gradients", "Fitting it in memory"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Range versus precision, in bits",
      intro: "Every number a GPU stores is a fixed row of bits split into three fields. How you split them decides what the number can do — and mixed precision is all about picking the cheapest split that still works.",
      bullets: [
        "**Three fields:** a **sign** bit, some **exponent** bits, and some **mantissa** bits. Exponent sets the *range* — how big or small before the number breaks. Mantissa sets the *precision* — how finely you can tell nearby values apart.",
        "**FP32** — 8 exponent, 23 mantissa bits, 4 bytes. The full-precision baseline everything is measured against.",
        "**BF16 keeps all 8 exponent bits** — the exact same range as FP32 — and just drops the mantissa to 7. Half the memory, double the speed, and the range that keeps gradients safe. This is why it's the training default.",
        "**FP8** (the E4M3 shape) squeezes into 1 byte: 4 exponent, 3 mantissa bits. Fastest of all, but so coarse it only works with careful scaling.",
      ],
      cardLabel: "BIT LAYOUT · SIGN / EXPONENT / MANTISSA",
      aria: "The bit layouts of FP32, BF16 and FP8 stacked, each split into sign, exponent and mantissa fields.",
      steps: 1,
      captions: ["Pick a format and inspect how its 8, 16 or 32 bits divide into range and precision."],
      hint: "Switch formats — notice BF16 and FP32 have the same exponent width, so the same range; only the mantissa shrinks.",
      readoutTitle: "FORMAT_SPEC",
      rows: ["BYTES", "MAX RANGE", "PRECISION", "SPEED"],
      readoutNote: "What this split buys: bytes per number, the largest value it can hold, its significant digits, and its relative tensor-core throughput.",
      optionNotes: [
        "FP32 — 1 sign · 8 exponent · 23 mantissa. Full precision, 4 bytes, the reference. Too slow and too big to train the whole model in.",
        "BF16 — 1 sign · 8 exponent · 7 mantissa. Same range as FP32, half the size, ~2× the speed. The modern default because its wide exponent keeps gradients from underflowing.",
        "FP8 (E4M3) — 1 sign · 4 exponent · 3 mantissa. One byte, ~4× the speed, but its narrow range and coarse steps demand per-tensor scaling to stay accurate.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Rescuing the tiny gradients",
      intro: "Low precision has a floor: any value smaller than its smallest representable number rounds to exactly zero. Real gradients are often that small — so two tricks keep them alive.",
      bullets: [
        "**Underflow kills learning.** A gradient that rounds to 0 stops updating its weight entirely — the signal is simply gone.",
        "**Loss scaling** multiplies the loss by a big constant S *before* backprop. By the chain rule every gradient is scaled by S too, lifting the tiny ones over the floor; you divide them back by S before the update. Same math — but they survived the trip.",
        "**A master copy in FP32.** The optimizer keeps one full-precision copy of the weights and applies each tiny update to *it*, so small changes accumulate instead of rounding away in BF16.",
        "**BF16 mostly skips loss scaling.** Its wide exponent has so much range that gradients rarely underflow — scaling is really a rescue for the narrow-range formats, FP16 and FP8.",
      ],
      cardLabel: "GRADIENT SURVIVAL · FP16 FLOOR",
      aria: "A list of gradient magnitudes showing which survive the FP16 floor after loss scaling.",
      steps: 1,
      captions: ["Raise the loss scale and watch tiny gradients lift over the FP16 floor instead of rounding to zero."],
      hint: "Drag the loss scale up — at S = 1 the smallest gradients are already gone; each doubling rescues more of them.",
      readoutTitle: "GRADIENT_SURVIVAL",
      rows: ["LOSS SCALE", "KEPT", "SMALLEST ALIVE"],
      readoutNote: "The effect of your scale: the constant S, how many of the five sample gradients clear the FP16 floor, and the smallest one still non-zero.",
      sliderNote: "S multiplies every gradient before it's stored in FP16, and the update divides it back out. At S = 1 (no scaling) the smallest gradients underflow to zero.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Making it fit in one GPU",
      intro: "Precision is only half the battle — you still have to fit weights, gradients, optimizer state and activations inside fixed VRAM. Here's the memory budget you actually tune.",
      bullets: [
        "**Model states are roughly fixed** at ~16 bytes per parameter: weights + gradients + Adam's two moments. Mixed precision barely moves this — smaller weights, but an extra FP32 master copy, and Adam's moments stay FP32.",
        "**Activations are the variable cost** — everything the forward pass saves to reuse in backprop. This is what actually explodes with batch size and context length.",
        "**Gradient checkpointing** stores only a few activations and *recomputes* the rest during backprop: about 30% more compute for a big memory cut.",
        "**Gradient accumulation** runs several small micro-batches and sums their gradients before one update — a large *effective* batch at a small micro-batch's memory footprint.",
      ],
      cardLabel: "MEMORY BUDGET · ONE 80GB GPU",
      aria: "A stacked memory bar of model states plus activations against an 80 GB GPU capacity line.",
      steps: 1,
      captions: ["Tune precision, checkpointing and batch, and watch the memory bar cross — or clear — the 80 GB line."],
      hint: "Push micro-batch up until it overflows, then turn checkpointing on — watch the activation slab shrink back under the line.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["MODEL STATES", "ACTIVATIONS", "TOTAL / 80GB", "EFF. BATCH"],
      readoutNote: "Where the memory goes for a 1.5B-param model: the fixed model states, the tunable activations, the total against 80 GB, and the effective batch you get.",
      optionNotes: [
        "FP32 activations — full precision means the activation slab is twice the size. Combined with a big batch, this is what tips you over the line.",
        "BF16 activations — half the size of FP32 and the same range. The everyday default for the forward/backward pass.",
      ],
    },
  ],

  n1legendSign: "sign",
  n1legendExp: "exponent → range",
  n1legendMant: "mantissa → precision",
  n1bitsWord: "bits",
  n1byteWord: "byte",
  n1bytesWord: "bytes",

  n2slider: "LOSS SCALE  S",
  n2rawHead: "gradient",
  n2scaledHead: "× S → FP16",
  n2floorNote: "FP16 floor ≈ 6e-8 · smaller → 0",
  n2kept: "survives",
  n2lost: "→ 0  lost",
  n2summaryFmt: "kept",
  calloutMasterLabel: "GOOD TO KNOW · THE MASTER COPY",
  calloutMasterTitle: "Why keep an FP32 copy at all?",
  calloutMasterBody: "A BF16 weight of 1.0 can't even represent 1.0 + 0.0001 — the update is smaller than its precision, so it rounds away and the weight never moves. The FP32 master copy has the precision to hold that tiny change, so thousands of small updates accumulate into real progress. Forward and backward run in BF16 for speed; the update lands in FP32.",
  n2deeperTitle: "The chain-rule trick, and dynamic loss scaling",
  n2deeperBody: "Scaling the loss by S scales every gradient by S, because `∂(S·L)/∂w = S · ∂L/∂w` — the constant factors straight through backprop. So a single multiply at the top rescues every gradient at once, and dividing by S before the optimizer step leaves the actual update unchanged. In practice S is picked *dynamically*: the trainer starts high, and whenever a gradient overflows to infinity or NaN it halves S and skips that step; after many clean steps it doubles S back up. The scale hunts for the largest value that doesn't overflow.",

  n1deeperTitle: "FP8 has two shapes: E4M3 and E5M2",
  n1deeperBody: "FP8 isn't one format. **E4M3** (4 exponent, 3 mantissa) favours precision and is used for weights and activations; **E5M2** (5 exponent, 2 mantissa) favours range and is used for gradients, which span more decades. Because either shape's range is tiny, FP8 training keeps a per-tensor scaling factor — essentially loss scaling applied to every tensor — so each block of numbers sits in the sweet spot of the format before it's cast down.",

  n3precision: ["FP32", "BF16"],
  n3checkpointLabel: "GRADIENT CHECKPOINTING",
  n3on: "ON",
  n3off: "OFF",
  n3microSlider: "MICRO-BATCH",
  n3accumSlider: "ACCUMULATION STEPS",
  n3segStates: "model states",
  n3segAct: "activations",
  n3capacityLabel: "H100 · 80 GB",
  n3fit: "FITS",
  n3oom: "OUT OF MEMORY",
  n3effBatchFmt: "effective batch",
  n3ckptNote: "Checkpointing recomputes activations in the backward pass instead of storing them — the activation slab shrinks about 5×, at the cost of extra compute.",
  n3batchNote: "Only the micro-batch drives activation memory. Raise accumulation to grow the effective batch while the memory footprint stays flat.",
  n3deeperTitle: "Gradient clipping — the stability guardrail",
  n3deeperBody: "One more lever rides along with mixed precision, though it saves stability rather than memory: **gradient clipping**. Before the update, you measure the gradient's global norm (its overall size across all weights); if it exceeds a threshold, you scale the whole thing down to that threshold. One freak batch can otherwise produce a giant gradient that blows the weights apart — the dreaded loss spike. Clipping caps the step size so a single bad batch can't wreck a run. Checkpointing's memory win, by the way, is not linear: storing √L of the L layers' activations and recomputing the rest turns O(L) activation memory into about O(√L).",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "BF16 and FP16 are both 16-bit. Why did BF16 become the default for training, even though FP16 keeps more precision?",
  explainA: "Because BF16 spends its bits on *range*, not precision. It keeps all 8 of FP32's exponent bits, so it holds the same enormous span of magnitudes — which means tiny gradients almost never underflow to zero, and you can usually train without any loss scaling at all. FP16 has only 5 exponent bits, so its range is narrow; small gradients fall off the bottom and vanish unless you carefully scale the loss to lift them back up. BF16 simply trades away mantissa precision that training tolerates well, in exchange for robustness you'd otherwise have to engineer. Same 16 bits, far less babysitting.",
  bridgeLabel: "NEXT: 2.6 · DISTRIBUTED TRAINING",
  bridgeBody: "Even at BF16, one GPU can't hold a real model — the optimizer states alone overflow 80 GB. Next, **distributed training**: splitting the weights, gradients and optimizer state across many GPUs so the model that doesn't fit anywhere fits everywhere.",
  prevLesson: "Back: test-time search",
  nextLesson: "Continue to 2.6",
};

/* ============================================================ SPANISH ======= */

export const mixedPrecisionES: MixedPrecisionLesson = {
  crumb: "ETAPA 0 · 2.5 · ENTRENAMIENTO EN PRECISIÓN MIXTA",
  eyebrow: "ETAPA 0 · 2.5 · 3 NODOS",
  title: "Entrenamiento en precisión mixta",
  lede: "La retropropagación te da los gradientes — ahora hay que guardar y multiplicar miles de millones de ellos, rápido, en una losa fija de memoria de GPU. El truco: hacer las cuentas en números diminutos de baja precisión por velocidad, y conservar una copia de seguridad en precisión completa para que los gradientes más pequeños no se desvanezcan sin ruido.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Bits: rango vs precisión", "Rescatar gradientes diminutos", "Que quepa en memoria"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Rango contra precisión, en bits",
      intro: "Cada número que guarda una GPU es una fila fija de bits dividida en tres campos. Cómo los repartes decide qué puede hacer el número — y la precisión mixta consiste en elegir el reparto más barato que aún funcione.",
      bullets: [
        "**Tres campos:** un bit de **signo**, unos bits de **exponente** y unos bits de **mantisa**. El exponente fija el *rango* — qué tan grande o pequeño antes de romperse. La mantisa fija la *precisión* — con qué finura distingues valores cercanos.",
        "**FP32** — 8 bits de exponente, 23 de mantisa, 4 bytes. La base de precisión completa contra la que se mide todo.",
        "**BF16 conserva los 8 bits de exponente** — exactamente el mismo rango que FP32 — y solo baja la mantisa a 7. La mitad de memoria, el doble de velocidad, y el rango que mantiene a salvo a los gradientes. Por eso es el predeterminado para entrenar.",
        "**FP8** (la forma E4M3) se aprieta en 1 byte: 4 bits de exponente, 3 de mantisa. El más rápido, pero tan tosco que solo sirve con un escalado cuidadoso.",
      ],
      cardLabel: "DISPOSICIÓN DE BITS · SIGNO / EXPONENTE / MANTISA",
      aria: "Las disposiciones de bits de FP32, BF16 y FP8 apiladas, cada una dividida en campos de signo, exponente y mantisa.",
      steps: 1,
      captions: ["Elige un formato e inspecciona cómo se dividen sus 8, 16 o 32 bits entre rango y precisión."],
      hint: "Cambia de formato — nota que BF16 y FP32 tienen el mismo ancho de exponente, así que el mismo rango; solo encoge la mantisa.",
      readoutTitle: "FORMAT_SPEC",
      rows: ["BYTES", "RANGO MÁX", "PRECISIÓN", "VELOCIDAD"],
      readoutNote: "Lo que compra este reparto: bytes por número, el valor más grande que aguanta, sus dígitos significativos y su rendimiento relativo en los tensor cores.",
      optionNotes: [
        "FP32 — 1 signo · 8 exponente · 23 mantisa. Precisión completa, 4 bytes, la referencia. Demasiado lento y grande para entrenar el modelo entero en él.",
        "BF16 — 1 signo · 8 exponente · 7 mantisa. Mismo rango que FP32, la mitad de tamaño, ~2× la velocidad. El predeterminado moderno porque su exponente ancho evita que los gradientes hagan underflow.",
        "FP8 (E4M3) — 1 signo · 4 exponente · 3 mantisa. Un byte, ~4× la velocidad, pero su rango estrecho y pasos toscos exigen escalado por tensor para mantener la exactitud.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Rescatar los gradientes diminutos",
      intro: "La baja precisión tiene un piso: cualquier valor menor que su número representable más pequeño se redondea a cero exacto. Los gradientes reales suelen ser así de pequeños — así que dos trucos los mantienen vivos.",
      bullets: [
        "**El underflow mata el aprendizaje.** Un gradiente que se redondea a 0 deja de actualizar su peso por completo — la señal simplemente desaparece.",
        "**El escalado de la pérdida** multiplica la pérdida por una constante grande S *antes* de la retropropagación. Por la regla de la cadena cada gradiente también se escala por S, subiendo los diminutos por encima del piso; los divides de vuelta por S antes de la actualización. La misma cuenta — pero sobrevivieron el viaje.",
        "**Una copia maestra en FP32.** El optimizador conserva una copia de los pesos en precisión completa y aplica cada actualización diminuta sobre *ella*, así los cambios pequeños se acumulan en vez de redondearse en BF16.",
        "**BF16 casi siempre se salta el escalado.** Su exponente ancho tiene tanto rango que los gradientes rara vez hacen underflow — el escalado es en realidad un rescate para los formatos de rango estrecho, FP16 y FP8.",
      ],
      cardLabel: "SUPERVIVENCIA DEL GRADIENTE · PISO FP16",
      aria: "Una lista de magnitudes de gradiente que muestra cuáles sobreviven al piso de FP16 tras el escalado.",
      steps: 1,
      captions: ["Sube el escalado y mira los gradientes diminutos elevarse sobre el piso de FP16 en vez de redondearse a cero."],
      hint: "Arrastra el escalado hacia arriba — en S = 1 los gradientes más pequeños ya están perdidos; cada duplicación rescata más.",
      readoutTitle: "GRADIENT_SURVIVAL",
      rows: ["ESCALADO", "VIVOS", "MÁS PEQUEÑO VIVO"],
      readoutNote: "El efecto de tu escalado: la constante S, cuántos de los cinco gradientes de muestra superan el piso de FP16, y el más pequeño que sigue siendo distinto de cero.",
      sliderNote: "S multiplica cada gradiente antes de guardarlo en FP16, y la actualización lo vuelve a dividir. En S = 1 (sin escalado) los gradientes más pequeños hacen underflow a cero.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Que quepa en una sola GPU",
      intro: "La precisión es solo la mitad de la batalla — aún tienes que meter pesos, gradientes, estado del optimizador y activaciones en una VRAM fija. Este es el presupuesto de memoria que de verdad ajustas.",
      bullets: [
        "**El estado del modelo es casi fijo** en ~16 bytes por parámetro: pesos + gradientes + los dos momentos de Adam. La precisión mixta apenas lo mueve — pesos más pequeños, pero una copia maestra extra en FP32, y los momentos de Adam siguen en FP32.",
        "**Las activaciones son el costo variable** — todo lo que el paso hacia delante guarda para reutilizar en la retropropagación. Esto es lo que de verdad explota con el tamaño de lote y la longitud de contexto.",
        "**El checkpointing de gradientes** guarda solo unas pocas activaciones y *recalcula* el resto durante la retropropagación: como 30% más de cómputo por un gran recorte de memoria.",
        "**La acumulación de gradientes** corre varios micro-lotes pequeños y suma sus gradientes antes de una actualización — un lote *efectivo* grande con la memoria de un micro-lote pequeño.",
      ],
      cardLabel: "PRESUPUESTO DE MEMORIA · UNA GPU DE 80GB",
      aria: "Una barra de memoria apilada de estado del modelo más activaciones contra una línea de capacidad de GPU de 80 GB.",
      steps: 1,
      captions: ["Ajusta precisión, checkpointing y lote, y mira la barra de memoria cruzar — o librar — la línea de 80 GB."],
      hint: "Sube el micro-lote hasta que se desborde, luego activa el checkpointing — mira la losa de activaciones encogerse bajo la línea.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["ESTADO MODELO", "ACTIVACIONES", "TOTAL / 80GB", "LOTE EFECT."],
      readoutNote: "A dónde va la memoria de un modelo de 1.5B parámetros: el estado fijo del modelo, las activaciones ajustables, el total contra 80 GB y el lote efectivo que obtienes.",
      optionNotes: [
        "Activaciones FP32 — la precisión completa hace que la losa de activaciones sea el doble de grande. Junto con un lote grande, esto es lo que te pasa de la línea.",
        "Activaciones BF16 — la mitad del tamaño de FP32 y el mismo rango. El predeterminado diario para el paso hacia delante y atrás.",
      ],
    },
  ],

  n1legendSign: "signo",
  n1legendExp: "exponente → rango",
  n1legendMant: "mantisa → precisión",
  n1bitsWord: "bits",
  n1byteWord: "byte",
  n1bytesWord: "bytes",

  n2slider: "ESCALADO  S",
  n2rawHead: "gradiente",
  n2scaledHead: "× S → FP16",
  n2floorNote: "piso FP16 ≈ 6e-8 · menor → 0",
  n2kept: "sobrevive",
  n2lost: "→ 0  perdido",
  n2summaryFmt: "vivos",
  calloutMasterLabel: "PARA SABER · LA COPIA MAESTRA",
  calloutMasterTitle: "¿Para qué conservar una copia en FP32?",
  calloutMasterBody: "Un peso BF16 de 1.0 ni siquiera puede representar 1.0 + 0.0001 — la actualización es menor que su precisión, así que se redondea y el peso nunca se mueve. La copia maestra en FP32 sí tiene la precisión para retener ese cambio diminuto, así que miles de actualizaciones pequeñas se acumulan en progreso real. El paso hacia delante y atrás corren en BF16 por velocidad; la actualización aterriza en FP32.",
  n2deeperTitle: "El truco de la regla de la cadena y el escalado dinámico",
  n2deeperBody: "Escalar la pérdida por S escala cada gradiente por S, porque `∂(S·L)/∂w = S · ∂L/∂w` — los factores constantes pasan directo por la retropropagación. Así, una sola multiplicación arriba rescata todos los gradientes a la vez, y dividir por S antes del paso del optimizador deja la actualización real intacta. En la práctica S se elige de forma *dinámica*: el entrenador empieza alto, y cuando un gradiente se desborda a infinito o NaN reduce S a la mitad y salta ese paso; tras muchos pasos limpios vuelve a duplicar S. El escalado busca el valor más grande que no se desborde.",

  n1deeperTitle: "FP8 tiene dos formas: E4M3 y E5M2",
  n1deeperBody: "FP8 no es un solo formato. **E4M3** (4 exponente, 3 mantisa) favorece la precisión y se usa para pesos y activaciones; **E5M2** (5 exponente, 2 mantisa) favorece el rango y se usa para gradientes, que abarcan más décadas. Como el rango de cualquiera de las dos formas es diminuto, el entrenamiento en FP8 mantiene un factor de escala por tensor — en esencia escalado de pérdida aplicado a cada tensor — para que cada bloque de números caiga en el punto dulce del formato antes de convertirlo hacia abajo.",

  n3precision: ["FP32", "BF16"],
  n3checkpointLabel: "CHECKPOINTING DE GRADIENTES",
  n3on: "SÍ",
  n3off: "NO",
  n3microSlider: "MICRO-LOTE",
  n3accumSlider: "PASOS DE ACUMULACIÓN",
  n3segStates: "estado del modelo",
  n3segAct: "activaciones",
  n3capacityLabel: "H100 · 80 GB",
  n3fit: "CABE",
  n3oom: "SIN MEMORIA",
  n3effBatchFmt: "lote efectivo",
  n3ckptNote: "El checkpointing recalcula las activaciones en el paso hacia atrás en vez de guardarlas — la losa de activaciones se encoge unas 5×, a costa de más cómputo.",
  n3batchNote: "Solo el micro-lote impulsa la memoria de activaciones. Sube la acumulación para agrandar el lote efectivo mientras la huella de memoria se mantiene plana.",
  n3deeperTitle: "Recorte de gradientes — la barandilla de estabilidad",
  n3deeperBody: "Otra palanca viaja junto a la precisión mixta, aunque salva estabilidad y no memoria: el **recorte de gradientes**. Antes de la actualización mides la norma global del gradiente (su tamaño total en todos los pesos); si supera un umbral, escalas todo hacia abajo hasta ese umbral. Un lote extraño puede si no producir un gradiente gigante que hace estallar los pesos — el temido pico de pérdida. El recorte limita el tamaño del paso para que un solo mal lote no arruine el entrenamiento. El ahorro de memoria del checkpointing, por cierto, no es lineal: guardar √L de las activaciones de las L capas y recalcular el resto convierte la memoria de activaciones de O(L) en cerca de O(√L).",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "BF16 y FP16 son ambos de 16 bits. ¿Por qué BF16 se volvió el predeterminado para entrenar, aunque FP16 conserva más precisión?",
  explainA: "Porque BF16 gasta sus bits en *rango*, no en precisión. Conserva los 8 bits de exponente de FP32, así que abarca el mismo enorme rango de magnitudes — lo que significa que los gradientes diminutos casi nunca hacen underflow a cero, y por lo general puedes entrenar sin ningún escalado de pérdida. FP16 tiene solo 5 bits de exponente, así que su rango es estrecho; los gradientes pequeños se caen por abajo y desaparecen a menos que escales la pérdida con cuidado para volver a subirlos. BF16 simplemente cede la precisión de mantisa que el entrenamiento tolera bien, a cambio de una robustez que si no tendrías que fabricar. Los mismos 16 bits, mucho menos niñera.",
  bridgeLabel: "SIGUIENTE: 2.6 · ENTRENAMIENTO DISTRIBUIDO",
  bridgeBody: "Incluso en BF16, una sola GPU no puede sostener un modelo real — el estado del optimizador por sí solo desborda los 80 GB. Sigue el **entrenamiento distribuido**: repartir los pesos, los gradientes y el estado del optimizador entre muchas GPUs para que el modelo que no cabe en ningún lado quepa en todos.",
  prevLesson: "Atrás: búsqueda en inferencia",
  nextLesson: "Continuar a 2.6",
};
