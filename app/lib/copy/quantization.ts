/**
 * Stage 0 · 3 (Expert) — Quantization. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: store each weight in 4/3/2 bits instead of 16 so a model shrinks to
 * run on smaller hardware — and careful post-training methods (GPTQ, AWQ, GGUF)
 * keep the quality loss small. Builds on prefill-vs-decode (decode is limited by
 * how fast weights stream out of memory, so smaller weights decode faster).
 */
import type { WsNodeCopy } from "./shared";

export interface QuantizationLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — bits per weight
  n1widths: string[]; //     [FP16, INT8, INT4, INT3, INT2]
  n1levelsLabel: string; //  "levels"
  n1distLabel: string; //    "weight distribution"
  n1contLabel: string; //    "≈ continuous"
  n1gapLabel: string; //     "max rounding gap"
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 2 — post-training methods
  n2methods: string[]; //    [GPTQ, AWQ, GGUF]
  n2naiveLabel: string; //   "Round to nearest (naive)"
  n2smartLabel: string; //   "Calibrated"
  n2avgLabel: string; //     "avg error"
  n2salientLabel: string; // "salient weight"
  n2storedLabel: string; //  "stored value"
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 — the trade-off
  n3widths: string[]; //     same width labels as n1widths
  n3sizeLabel: string; //    "MODEL SIZE"
  n3speedLabel: string; //   "DECODE SPEED"
  n3qualityLabel: string; // "QUALITY KEPT"
  n3fitsLabel: string; //    "fits on"

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const quantizationEN: QuantizationLesson = {
  crumb: "STAGE 0 · 3 · QUANTIZATION",
  eyebrow: "STAGE 0 · EXPERT · 3 NODES",
  title: "Quantization",
  lede: "A trained model is a giant pile of numbers. Store each number in fewer bits and the whole model shrinks — from a data-centre GPU down to your laptop. This is how far you can push it before the answers start to suffer, and the tricks that hold quality steady.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Bits per weight", "Post-training methods", "The trade-off"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "How many bits is one weight?",
      intro: "A weight is just a number. FP16 spends 16 bits on each one — 65,536 possible values. Quantizing means storing it in fewer bits, so it can only land on a few coarse steps.",
      bullets: [
        "**Fewer bits = fewer levels.** 4-bit gives 16 values, 3-bit gives 8, 2-bit gives just 4. Every real weight snaps to the nearest one.",
        "**That snap is rounding error.** With 16 levels the steps are tiny; with 4 levels they're wide, so each weight is stored further from its true value.",
        "**Fewer bits = smaller model.** Our 7B model is 14 GB in FP16, 3.5 GB in 4-bit, 1.75 GB in 2-bit — the same weights, packed tighter.",
        "**The whole game is picking the fewest bits the model still tolerates** — usually 4.",
      ],
      cardLabel: "WEIGHTS SNAPPED TO A FEW LEVELS",
      aria: "A bell-curve distribution of weight values overlaid with the discrete levels each weight must snap to.",
      steps: 1,
      captions: ["Pick a bit-width and watch the smooth spread of weights get forced onto a handful of steps."],
      hint: "Cycle FP16 → INT2 — at 16 and 8 bits the levels look continuous; at 4, 3 and 2 bits the chunky steps appear.",
      readoutTitle: "WEIGHT_STORE",
      rows: ["BITS/WEIGHT", "LEVELS", "MODEL SIZE", "MAX ERROR"],
      readoutNote: "What one weight costs to store, how many distinct values it can take, the resulting 7B model size, and the worst-case rounding gap.",
      optionNotes: [
        "FP16 — the baseline. 16 bits, 65,536 levels: effectively continuous, 14 GB, no meaningful rounding.",
        "INT8 — 8 bits, 256 levels. Still smooth to the eye; the model halves to 7 GB with almost no quality cost.",
        "INT4 — 4 bits, 16 levels. The steps are now visible, but the model is a quarter of the size and quality barely moves. The popular choice.",
        "INT3 — 3 bits, 8 levels. Coarse. Smaller still, but you start to feel it without a careful method.",
        "INT2 — 2 bits, 4 levels. Tiny and fast, but each weight is so far from its true value that quality usually falls off a cliff.",
      ],
      sliderNote: "",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "You don't just round — you calibrate",
      intro: "Rounding every weight to its nearest level is the naive way, and it wrecks a handful of important weights. Real methods use a small calibration set to spot those weights and protect them.",
      bullets: [
        "**A few weights carry most of the signal.** Rounding them the same as the rest is where naive quantization loses quality.",
        "**Calibration finds them.** You run a little sample text through the model, see which weights swing the output most, and keep those near-exact — the rest round as usual.",
        "**Same size, far less damage.** The panels below show identical weights rounded naively (left) vs calibrated (right); watch the {ring} salient weight's error shrink.",
        "**GPTQ and AWQ are the calibration methods; GGUF is a mixed-bit packaging format.** The first two protect what matters; GGUF is the container that stores the weights, often at mixed bit-widths.",
      ],
      cardLabel: "NAIVE ROUNDING vs CALIBRATED",
      aria: "Two panels of the same weights: naive rounding leaves a large error on the salient weight; calibration keeps it small.",
      steps: 1,
      captions: ["The same trained weights, quantized to 4-bit two ways — naive on the left, calibrated on the right."],
      hint: "Switch method — GPTQ, AWQ and GGUF all protect the salient weight; only the mechanism differs.",
      readoutTitle: "CALIBRATION",
      rows: ["METHOD", "AVG ERROR", "SALIENT"],
      readoutNote: "",
      optionNotes: [
        "GPTQ — rounds the weights one at a time and nudges the not-yet-rounded ones to cancel each rounding error as it goes. Accurate, needs a short calibration pass.",
        "AWQ — 'activation-aware': it scales up the important weight channels before rounding so they land on finer steps, then scales back. Fast, and strong at 4-bit.",
        "GGUF — the llama.cpp packaging format. It mixes bit-widths across the model — sensitive layers kept higher-bit — so one file runs anywhere, CPU included.",
      ],
      sliderNote: "",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Smaller, faster — for a small quality cost",
      intro: "Quantization buys three things at once. Two get better as you drop bits; one slowly gets worse. The sweet spot is where the first two win big and the third barely moves.",
      bullets: [
        "**Size shrinks in proportion.** Halve the bits, halve the gigabytes — that's what lets a 14 GB model fit a laptop.",
        "**Decode gets faster.** From the prefill-vs-decode lesson: generating each token is limited by reading weights out of memory. Smaller weights = less to read = more tokens per second.",
        "**Quality holds, then cracks.** With a good method, 8-bit and 4-bit keep ~99%+ of the original quality; 3-bit dips; 2-bit usually falls off a cliff.",
        "**So 4-bit is the default** — a quarter the size, several times faster, quality you can barely measure the loss of.",
      ],
      cardLabel: "SIZE ↓ · SPEED ↑ · QUALITY ~",
      aria: "Three bars — model size, decode speed, and quality kept — as the bit-width drops from FP16 to 2-bit.",
      steps: 1,
      captions: ["Drop the bit-width and watch size fall, speed rise, and quality hold — until 2-bit, where it breaks."],
      hint: "Cycle the widths — 4-bit is the knee of the curve: big wins on size and speed, tiny quality cost.",
      readoutTitle: "TRADE_OFF",
      rows: ["SIZE", "SPEED", "QUALITY", "FITS ON"],
      readoutNote: "The three things quantization trades at this bit-width, and the hardware a 7B model now fits on. Speed and quality figures are illustrative.",
      optionNotes: [
        "FP16 — full quality, but 14 GB and the slowest decode. The reference everything else is measured against.",
        "INT8 — half the size, nearly double the decode speed, quality indistinguishable from FP16.",
        "INT4 — the knee of the curve: a quarter of the size, ~3× faster decode, ~99% of the quality kept.",
        "INT3 — smaller and faster again, but quality has started to slip — worth it only when memory is very tight.",
        "INT2 — the smallest and fastest, but quality usually collapses. Only viable with the most careful methods, if at all.",
      ],
      sliderNote: "",
    },
  ],
  n1widths: ["FP16", "INT8", "INT4", "INT3", "INT2"],
  n1levelsLabel: "levels",
  n1distLabel: "weight distribution",
  n1contLabel: "≈ continuous",
  n1gapLabel: "max rounding gap",
  n1deeperTitle: "The actual mapping",
  n1deeperBody:
    "Symmetric uniform quantization stores each weight as an integer q, and reconstructs it as w ≈ q × scale, where scale = max(|w|) / (2^(b−1) − 1). So a b-bit signed weight has 2^b−1 levels spread evenly across [−max, +max]. The rounding error per weight is at most half a step, scale / 2 — which is why doubling the number of levels (one more bit) halves the error. Real kernels quantize in small groups (say 128 weights share one scale) so a few outliers don't stretch the whole range.",

  n2methods: ["GPTQ", "AWQ", "GGUF"],
  n2naiveLabel: "ROUND TO NEAREST · naive",
  n2smartLabel: "CALIBRATED",
  n2avgLabel: "avg error",
  n2salientLabel: "salient",
  n2storedLabel: "stored",
  n2deeperTitle: "Why protecting a few weights works",
  n2deeperBody:
    "The error a quantized layer adds to the output is roughly the sum over weights of (rounding error) × (how much that weight moves the activation). A tiny fraction of weights — often ~1% — dominate that sum. GPTQ minimises it directly: it rounds weights in order and solves for a small correction to the remaining weights so the layer's output stays close (a second-order, Hessian-based update). AWQ instead rescales the salient channels up before rounding so they use finer steps, then folds the inverse scale into the next layer — cheaper, no per-weight solve. GGUF is orthogonal: it's a container that lets different tensors carry different bit-widths (Q4_K_M, Q6_K, …) so the sensitive ones stay higher-precision.",

  n3widths: ["FP16", "INT8", "INT4", "INT3", "INT2"],
  n3sizeLabel: "MODEL SIZE",
  n3speedLabel: "DECODE SPEED",
  n3qualityLabel: "QUALITY KEPT",
  n3fitsLabel: "fits on",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "4-bit weights round every number to one of just 16 values. Why doesn't that obviously ruin the model?",
  explainA: "Because the model was never relying on the exact value of each weight — it's the *pattern* across billions of them that matters, and rounding adds only a tiny, roughly-random nudge to each. Averaged over a whole layer those nudges mostly cancel. The real danger is the small fraction of **salient** weights that swing the output a lot; round those carelessly and quality drops. That's what **GPTQ**, **AWQ** and **GGUF** are for — a quick calibration pass finds those weights and keeps them near-exact while the rest round to 4-bit. The result: a quarter of the size, a few times faster to decode, and quality you can barely measure the loss of. Push to 2-bit, though, and even careful methods usually can't save it.",
  bridgeLabel: "NEXT: SPECULATIVE DECODING",
  bridgeBody: "Quantization made each weight cheaper to read. Next, **speculative decoding** makes each *token* cheaper to produce — a small draft model guesses several tokens ahead and the big model checks them all at once, for a free speed-up.",
  prevLesson: "Back: KV cache & systems",
  nextLesson: "Continue to speculative decoding",
};

/* ============================================================ SPANISH ======= */

export const quantizationES: QuantizationLesson = {
  crumb: "ETAPA 0 · 3 · CUANTIZACIÓN",
  eyebrow: "ETAPA 0 · EXPERTO · 3 NODOS",
  title: "Cuantización",
  lede: "Un modelo entrenado es un montón gigante de números. Guarda cada número en menos bits y todo el modelo se encoge — de una GPU de centro de datos a tu laptop. Esto es cuánto puedes exprimirlo antes de que las respuestas empeoren, y los trucos que mantienen la calidad firme.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Bits por peso", "Métodos post-entrenamiento", "El compromiso"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "¿Cuántos bits es un peso?",
      intro: "Un peso es solo un número. FP16 gasta 16 bits en cada uno — 65.536 valores posibles. Cuantizar es guardarlo en menos bits, así que solo puede caer en unos pocos escalones gruesos.",
      bullets: [
        "**Menos bits = menos niveles.** 4 bits dan 16 valores, 3 bits dan 8, 2 bits solo 4. Cada peso real se ajusta al más cercano.",
        "**Ese ajuste es error de redondeo.** Con 16 niveles los escalones son diminutos; con 4 son anchos, así que cada peso se guarda más lejos de su valor real.",
        "**Menos bits = modelo más chico.** Nuestro modelo de 7B pesa 14 GB en FP16, 3,5 GB en 4 bits, 1,75 GB en 2 bits — los mismos pesos, empacados más apretados.",
        "**Todo el juego es elegir los menos bits que el modelo aún tolera** — normalmente 4.",
      ],
      cardLabel: "PESOS AJUSTADOS A UNOS POCOS NIVELES",
      aria: "Una distribución en campana de valores de peso superpuesta con los niveles discretos a los que cada peso debe ajustarse.",
      steps: 1,
      captions: ["Elige un ancho de bits y mira cómo la dispersión suave de los pesos se fuerza sobre un puñado de escalones."],
      hint: "Recorre FP16 → INT2 — con 16 y 8 bits los niveles parecen continuos; con 4, 3 y 2 bits aparecen los escalones gruesos.",
      readoutTitle: "WEIGHT_STORE",
      rows: ["BITS/PESO", "NIVELES", "TAMAÑO", "ERROR MÁX"],
      readoutNote: "Lo que cuesta guardar un peso, cuántos valores distintos puede tomar, el tamaño resultante del modelo de 7B y el peor error de redondeo.",
      optionNotes: [
        "FP16 — la base. 16 bits, 65.536 niveles: prácticamente continuo, 14 GB, sin redondeo apreciable.",
        "INT8 — 8 bits, 256 niveles. Aún suave a la vista; el modelo se reduce a la mitad, 7 GB, casi sin costo de calidad.",
        "INT4 — 4 bits, 16 niveles. Ya se ven los escalones, pero el modelo pesa un cuarto y la calidad apenas se mueve. La opción popular.",
        "INT3 — 3 bits, 8 niveles. Grueso. Más chico todavía, pero se empieza a notar sin un método cuidadoso.",
        "INT2 — 2 bits, 4 niveles. Diminuto y rápido, pero cada peso queda tan lejos de su valor real que la calidad suele desplomarse.",
      ],
      sliderNote: "",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "No solo redondeas — calibras",
      intro: "Redondear cada peso a su nivel más cercano es la forma ingenua, y arruina un puñado de pesos importantes. Los métodos reales usan un pequeño conjunto de calibración para detectarlos y protegerlos.",
      bullets: [
        "**Unos pocos pesos cargan casi toda la señal.** Redondearlos igual que al resto es donde la cuantización ingenua pierde calidad.",
        "**La calibración los encuentra.** Pasas un texto de muestra por el modelo, ves qué pesos mueven más la salida, y los mantienes casi exactos — el resto redondea normal.",
        "**Mismo tamaño, mucho menos daño.** Los paneles de abajo muestran los mismos pesos redondeados de forma ingenua (izquierda) vs calibrada (derecha); mira encogerse el error del peso {ring} saliente.",
        "**GPTQ y AWQ son los métodos de calibración; GGUF es un formato de empaquetado de bits mixtos.** Los dos primeros protegen lo que importa; GGUF es el contenedor que guarda los pesos, a menudo con anchos de bits mixtos.",
      ],
      cardLabel: "REDONDEO INGENUO vs CALIBRADO",
      aria: "Dos paneles de los mismos pesos: el redondeo ingenuo deja un gran error en el peso saliente; la calibración lo mantiene pequeño.",
      steps: 1,
      captions: ["Los mismos pesos entrenados, cuantizados a 4 bits de dos formas — ingenuo a la izquierda, calibrado a la derecha."],
      hint: "Cambia de método — GPTQ, AWQ y GGUF protegen el peso saliente; solo cambia el mecanismo.",
      readoutTitle: "CALIBRATION",
      rows: ["MÉTODO", "ERROR MEDIO", "SALIENTE"],
      readoutNote: "",
      optionNotes: [
        "GPTQ — redondea los pesos uno por uno y ajusta los que faltan para cancelar cada error de redondeo sobre la marcha. Preciso, necesita una pasada corta de calibración.",
        "AWQ — 'consciente de activaciones': escala hacia arriba los canales de pesos importantes antes de redondear para que caigan en escalones más finos, y luego revierte la escala. Rápido y fuerte en 4 bits.",
        "GGUF — el formato de empaquetado de llama.cpp. Mezcla anchos de bits en el modelo — las capas sensibles quedan en más bits — así un solo archivo corre en cualquier lado, CPU incluida.",
      ],
      sliderNote: "",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Más chico, más rápido — por un costo pequeño de calidad",
      intro: "La cuantización compra tres cosas a la vez. Dos mejoran al bajar bits; una empeora despacio. El punto dulce es donde las dos primeras ganan mucho y la tercera apenas se mueve.",
      bullets: [
        "**El tamaño se encoge en proporción.** La mitad de bits, la mitad de gigabytes — eso es lo que hace que un modelo de 14 GB entre en una laptop.",
        "**El decode se acelera.** De la lección prefill-vs-decode: generar cada token está limitado por leer los pesos desde la memoria. Pesos más chicos = menos que leer = más tokens por segundo.",
        "**La calidad aguanta, y luego se quiebra.** Con un buen método, 8 y 4 bits conservan ~99%+ de la calidad original; 3 bits baja; 2 bits suele desplomarse.",
        "**Por eso 4 bits es lo predeterminado** — un cuarto del tamaño, varias veces más rápido, con una pérdida de calidad que apenas puedes medir.",
      ],
      cardLabel: "TAMAÑO ↓ · VELOCIDAD ↑ · CALIDAD ~",
      aria: "Tres barras — tamaño del modelo, velocidad de decode y calidad conservada — a medida que el ancho de bits baja de FP16 a 2 bits.",
      steps: 1,
      captions: ["Baja el ancho de bits y mira caer el tamaño, subir la velocidad y aguantar la calidad — hasta 2 bits, donde se rompe."],
      hint: "Recorre los anchos — 4 bits es la rodilla de la curva: gran ganancia en tamaño y velocidad, costo mínimo de calidad.",
      readoutTitle: "TRADE_OFF",
      rows: ["TAMAÑO", "VELOCIDAD", "CALIDAD", "ENTRA EN"],
      readoutNote: "Las tres cosas que la cuantización intercambia en este ancho de bits, y el hardware en el que ahora entra un modelo de 7B. Las cifras de velocidad y calidad son ilustrativas.",
      optionNotes: [
        "FP16 — calidad completa, pero 14 GB y el decode más lento. La referencia contra la que se mide todo lo demás.",
        "INT8 — la mitad del tamaño, casi el doble de velocidad de decode, calidad indistinguible de FP16.",
        "INT4 — la rodilla de la curva: un cuarto del tamaño, decode ~3× más rápido, ~99% de la calidad conservada.",
        "INT3 — más chico y rápido de nuevo, pero la calidad ya empezó a resbalar — vale la pena solo cuando la memoria está muy ajustada.",
        "INT2 — el más chico y rápido, pero la calidad suele colapsar. Solo viable con los métodos más cuidadosos, si acaso.",
      ],
      sliderNote: "",
    },
  ],
  n1widths: ["FP16", "INT8", "INT4", "INT3", "INT2"],
  n1levelsLabel: "niveles",
  n1distLabel: "distribución de pesos",
  n1contLabel: "≈ continuo",
  n1gapLabel: "salto máx de redondeo",
  n1deeperTitle: "El mapeo real",
  n1deeperBody:
    "La cuantización uniforme simétrica guarda cada peso como un entero q, y lo reconstruye como w ≈ q × escala, donde escala = max(|w|) / (2^(b−1) − 1). Así un peso con signo de b bits tiene 2^b−1 niveles repartidos por igual en [−max, +max]. El error de redondeo por peso es a lo sumo medio escalón, escala / 2 — por eso duplicar los niveles (un bit más) reduce el error a la mitad. Los kernels reales cuantizan en grupos pequeños (digamos 128 pesos comparten una escala) para que unos pocos valores extremos no estiren todo el rango.",

  n2methods: ["GPTQ", "AWQ", "GGUF"],
  n2naiveLabel: "REDONDEO AL MÁS CERCANO · ingenuo",
  n2smartLabel: "CALIBRADO",
  n2avgLabel: "error medio",
  n2salientLabel: "saliente",
  n2storedLabel: "guardado",
  n2deeperTitle: "Por qué proteger unos pocos pesos funciona",
  n2deeperBody:
    "El error que una capa cuantizada añade a la salida es aproximadamente la suma sobre los pesos de (error de redondeo) × (cuánto mueve ese peso la activación). Una fracción diminuta de pesos — a menudo ~1% — domina esa suma. GPTQ la minimiza directamente: redondea los pesos en orden y resuelve una pequeña corrección para los restantes de modo que la salida de la capa quede cerca (una actualización de segundo orden, basada en la Hessiana). AWQ, en cambio, reescala hacia arriba los canales salientes antes de redondear para que usen escalones más finos, y pliega la escala inversa en la siguiente capa — más barato, sin resolver peso por peso. GGUF es ortogonal: es un contenedor que deja que distintos tensores lleven distintos anchos de bits (Q4_K_M, Q6_K, …) para que los sensibles queden en más precisión.",

  n3widths: ["FP16", "INT8", "INT4", "INT3", "INT2"],
  n3sizeLabel: "TAMAÑO",
  n3speedLabel: "VELOCIDAD DECODE",
  n3qualityLabel: "CALIDAD",
  n3fitsLabel: "entra en",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Los pesos de 4 bits redondean cada número a solo uno de 16 valores. ¿Por qué eso no arruina el modelo de forma obvia?",
  explainA: "Porque el modelo nunca dependió del valor exacto de cada peso — lo que importa es el *patrón* a lo largo de miles de millones de ellos, y el redondeo solo añade un empujoncito diminuto y casi aleatorio a cada uno. Promediados sobre toda una capa, esos empujones se cancelan en su mayoría. El verdadero peligro es la pequeña fracción de pesos **salientes** que mueven mucho la salida; redondéalos sin cuidado y la calidad cae. Para eso están **GPTQ**, **AWQ** y **GGUF** — una pasada rápida de calibración encuentra esos pesos y los mantiene casi exactos mientras el resto redondea a 4 bits. El resultado: un cuarto del tamaño, unas cuantas veces más rápido para decodificar, y una pérdida de calidad que apenas puedes medir. Pero exprime a 2 bits y ni los métodos cuidadosos suelen salvarlo.",
  bridgeLabel: "SIGUIENTE: DECODIFICACIÓN ESPECULATIVA",
  bridgeBody: "La cuantización hizo más barato leer cada peso. Sigue la **decodificación especulativa**: hace más barato producir cada *token* — un modelo borrador pequeño adivina varios tokens por adelantado y el modelo grande los verifica todos de una vez, para una aceleración gratis.",
  prevLesson: "Atrás: caché KV y sistemas",
  nextLesson: "Continuar a decodificación especulativa",
};
