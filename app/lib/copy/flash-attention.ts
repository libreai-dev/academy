/**
 * Stage 0 · 2·A — FlashAttention. Interface + EN/ES copy, isolated from every
 * other lesson so edits here never touch theirs.
 *
 * One idea: attention never has to store the giant N×N score grid. FlashAttention
 * streams the work in tiles through fast on-chip memory (same answer, far less
 * memory); GQA/MQA shrink memory further by sharing keys and values across query
 * heads. Builds on "How attention works" (the query·key score grid) — it does
 * NOT re-teach Q/K/V.
 */
import type { WsNodeCopy } from "./shared";

export interface FlashAttentionLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the memory wall
  n1slider: string;
  n1gridLabel: string; //  diagram caption over the square
  n1axisLabel: string; //  "N tokens"
  n1gpuLabel: string; //   "GPU memory · 80 GB"
  n1overflow: string; //   "won't fit"
  // Node 2 — tiling
  n2slider: string;
  n2naiveLabel: string;
  n2flashLabel: string;
  n2tilesWord: string; //  "tiles"
  n2sramLabel: string; //  "in SRAM now"
  n2outLabel: string; //   "running output"
  n2deeperTitle: string;
  n2deeperBody: string;
  // Node 3 — sharing keys and values
  n3seg: string[]; //      [MHA, GQA, MQA]
  n3queryLabel: string; // "8 query heads"
  n3kvLabel: string; //    "key/value heads"
  n3shareWord: string; //  "share" (drawn between rows)
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

export const flashAttentionEN: FlashAttentionLesson = {
  crumb: "STAGE 0 · 2·A · FLASHATTENTION",
  eyebrow: "STAGE 0 · 2·A · 3 NODES",
  title: "FlashAttention",
  lede: "In How attention works you built the query·key score grid — one score for every pair of tokens. That grid is the problem: it grows with the square of the sequence. FlashAttention gets the exact same answer without ever storing it whole.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The memory wall", "Stream it in tiles", "Share the keys & values"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The wall: an N×N grid for N tokens",
      intro: "Attention scores every token against every other token. That's an N×N grid — and doubling the sequence quadruples it. This is the memory wall long context runs into.",
      bullets: [
        "**One score per pair.** N tokens means N×N scores — the grid you built in the attention lesson, now drawn to scale.",
        "**It grows quadratically.** 2× the tokens is 4× the grid. The bar is the bytes to hold it for *one head* in fp16 (2 bytes each).",
        "**Past a point it {ring} won't fit.** At long context the grid alone blows past a whole GPU's memory — and that's before you count the dozens of heads and layers.",
        "**This is the intermediate, not the model.** The scores are thrown away after each step; storing them all at once is pure waste.",
      ],
      cardLabel: "N×N SCORE GRID · MEMORY vs SEQUENCE",
      aria: "A square score grid beside a memory bar that grows past the GPU limit as the sequence lengthens.",
      steps: 1,
      captions: ["Slide the sequence length and watch the grid get denser and the memory bar shoot up."],
      hint: "Drag the sequence length — the bar grows quadratically, and many heads and layers push it past a whole GPU.",
      readoutTitle: "SCORE_MATRIX",
      rows: ["SEQUENCE", "CELLS", "MEMORY", "GPU"],
      readoutNote: "The full N×N score grid for one attention head in fp16, against one H100's 80 GB of memory.",
      sliderNote: "Every token attends to every token, so the grid is N×N. The bytes to store it grow with the square of the sequence — the core scaling problem.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Never build the whole grid — stream it in tiles",
      intro: "FlashAttention computes the same attention, but block by block. It slides small tiles of the grid through the GPU's tiny fast memory (SRAM), keeping only a running summary — so the full N×N grid is never stored.",
      bullets: [
        "**Left: naive.** The whole grid sits in slow GPU memory (HBM) at once — O(N²) bytes.",
        "**Right: FlashAttention.** Only one tile is live at a time, plus a running summary per row. Memory is O(N) — flat, no matter how long the sequence.",
        "**SRAM is fast but tiny** (megabytes). A tile fits; the full grid never could — so streaming tiles is also *faster*, not just smaller.",
        "**The answer is identical.** A running-max trick keeps the softmax exact as each tile arrives — same numbers, a fraction of the memory.",
      ],
      cardLabel: "NAIVE vs FLASHATTENTION · SAME 32k SEQUENCE",
      aria: "Two score grids side by side: the naive grid fully resident, the FlashAttention grid processed one tile at a time.",
      steps: 1,
      captions: ["Pick a block size and compare: the naive grid is fully resident; FlashAttention holds one tile."],
      hint: "Change the block size — more tiles or fewer, but FlashAttention's memory stays a sliver of the naive bar.",
      readoutTitle: "TILING",
      rows: ["BLOCK", "TILES", "NAIVE", "FLASH"],
      readoutNote: "Peak memory for one head over a 32k sequence: the whole grid (naive) versus one live tile plus running row summaries (FlashAttention).",
      sliderNote: "The block size sets how big each tile is. Bigger tiles mean fewer passes but more SRAM per tile; either way the whole grid is never resident.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Let query heads share the keys and values",
      intro: "There's a second memory cost when a model answers: the KV cache — the keys and values of every past token, kept so they aren't recomputed. Giving every query head its own K/V is expensive, so heads share them.",
      bullets: [
        "**MHA — one K/V set per head.** The classic design: 8 query heads, 8 key/value heads. Biggest cache.",
        "**GQA — heads share in groups.** Several query heads read one shared K/V. Here 8 query heads share 2 sets — a 4× smaller cache, almost no quality loss.",
        "**MQA — one K/V for all.** Every query head reads a single K/V set: 8× smaller cache, the leanest option.",
        "**The bar is the KV cache** for a 32k chat across 32 layers. Sharing is why long-context models stay affordable to run.",
      ],
      cardLabel: "KV SHARING · QUERY HEADS → K/V HEADS",
      aria: "Eight query heads wired to a shrinking number of shared key/value heads, with the KV-cache memory bar.",
      steps: 1,
      captions: ["Switch MHA / GQA / MQA and watch the query heads collapse onto fewer shared key/value heads."],
      hint: "Cycle MHA → GQA → MQA — the wiring collapses onto fewer K/V heads and the cache bar shrinks 4× then 8×.",
      readoutTitle: "KV_CACHE",
      rows: ["SCHEME", "Q HEADS", "K/V HEADS", "CACHE"],
      readoutNote: "The key/value cache held during generation — 32 layers, 32k tokens, fp16 — as query heads share fewer K/V heads.",
      optionNotes: [
        "MHA (multi-head attention) — every query head has its own key/value head. Full quality, biggest KV cache.",
        "GQA (grouped-query attention) — query heads share K/V in small groups. About 4× less cache here, with essentially no quality loss. The modern default.",
        "MQA (multi-query attention) — all query heads share one K/V set. The smallest cache and fastest decode, with a slight quality trade-off.",
      ],
    },
  ],
  n1slider: "SEQUENCE LENGTH",
  n1gridLabel: "N × N scores",
  n1axisLabel: "N tokens",
  n1gpuLabel: "GPU · 80 GB",
  n1overflow: "won't fit",
  n2slider: "BLOCK SIZE",
  n2naiveLabel: "Naive · whole grid in HBM",
  n2flashLabel: "FlashAttention · one tile in SRAM",
  n2tilesWord: "tiles",
  n2sramLabel: "in SRAM",
  n2outLabel: "running output",
  n2deeperTitle: "The trick that keeps softmax exact",
  n2deeperBody:
    "Softmax normally needs the whole row of scores at once — you subtract the row max, exponentiate, then divide by the row sum. FlashAttention never has the whole row. Instead it carries two running numbers per output row: the max seen so far `m` and the running sum `l`. When a new tile arrives with a larger max, it **rescales** the accumulated output by `exp(m_old − m_new)` before adding the tile's contribution. Algebraically this is identical to computing the softmax over the full row — so the output matches naive attention bit-for-bit, while only one tile is ever in memory.",
  n3seg: ["MHA", "GQA", "MQA"],
  n3queryLabel: "query heads",
  n3kvLabel: "key/value heads",
  n3shareWord: "share",
  n3deeperTitle: "The causal mask — half the grid is free",
  n3deeperBody:
    "A language model only lets a token attend to earlier tokens, never future ones. That's the causal mask: the score grid is lower-triangular, so the upper half is discarded. FlashAttention uses this directly — any tile that sits entirely above the diagonal is *skipped*, saving roughly half the score work outright. Sharing K/V (this node) and skipping masked tiles (the mask) are independent wins that stack.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "FlashAttention still computes a score for every pair of tokens. So how does it avoid the N×N memory blow-up?",
  explainA: "It never *stores* the whole grid at once. It walks the grid in small tiles through the GPU's fast on-chip memory, and instead of keeping every score it keeps a running summary per output row — a running max and running sum. A rescaling step makes the softmax come out exactly right as each tile arrives, so the final answer is identical to naive attention. Peak memory drops from O(N²) to O(N), and because the tiles live in fast SRAM it's faster too. **GQA/MQA** attack a different memory cost — the KV cache during generation — by letting several query heads share one set of keys and values, shrinking that cache 4× to 8× with little or no quality loss.",
  bridgeLabel: "NEXT: MIXTURE OF EXPERTS",
  bridgeBody: "Attention now scales to long context without the memory wall. Next, **Mixture of Experts**: the other half of a big model — routing each token to just a few expert sub-networks, so the model can be huge while only a slice of it runs per token.",
  prevLesson: "Back: long context",
  nextLesson: "Continue to Mixture of Experts",
};

/* ============================================================ SPANISH ======= */

export const flashAttentionES: FlashAttentionLesson = {
  crumb: "ETAPA 0 · 2·A · FLASHATTENTION",
  eyebrow: "ETAPA 0 · 2·A · 3 NODOS",
  title: "FlashAttention",
  lede: "En Cómo funciona la atención construiste la rejilla de puntuaciones consulta·clave — una puntuación por cada par de tokens. Esa rejilla es el problema: crece con el cuadrado de la secuencia. FlashAttention obtiene exactamente la misma respuesta sin guardarla nunca entera.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El muro de memoria", "Fluir en bloques", "Compartir claves y valores"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El muro: una rejilla N×N para N tokens",
      intro: "La atención puntúa cada token contra cada otro token. Eso es una rejilla N×N — y duplicar la secuencia la cuadruplica. Este es el muro de memoria con el que choca el contexto largo.",
      bullets: [
        "**Una puntuación por par.** N tokens significa N×N puntuaciones — la rejilla que construiste en la lección de atención, ahora dibujada a escala.",
        "**Crece de forma cuadrática.** 2× tokens es 4× rejilla. La barra son los bytes para guardarla en *una cabeza* en fp16 (2 bytes cada uno).",
        "**Pasado un punto {ring} no cabe.** En contexto largo la rejilla sola supera la memoria de una GPU entera — y eso antes de contar las decenas de cabezas y capas.",
        "**Esto es el intermedio, no el modelo.** Las puntuaciones se descartan tras cada paso; guardarlas todas a la vez es puro desperdicio.",
      ],
      cardLabel: "REJILLA N×N · MEMORIA vs SECUENCIA",
      aria: "Una rejilla de puntuaciones cuadrada junto a una barra de memoria que supera el límite de la GPU al alargar la secuencia.",
      steps: 1,
      captions: ["Desliza el largo de secuencia y mira la rejilla densificarse y la barra de memoria dispararse."],
      hint: "Arrastra el largo de secuencia — la barra crece de forma cuadrática, y muchas cabezas y capas la empujan más allá de una GPU entera.",
      readoutTitle: "SCORE_MATRIX",
      rows: ["SECUENCIA", "CELDAS", "MEMORIA", "GPU"],
      readoutNote: "La rejilla completa de puntuaciones N×N para una cabeza de atención en fp16, frente a los 80 GB de memoria de una H100.",
      sliderNote: "Cada token atiende a cada token, así que la rejilla es N×N. Los bytes para guardarla crecen con el cuadrado de la secuencia — el problema de escala central.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "No construir la rejilla entera — fluirla en bloques",
      intro: "FlashAttention computa la misma atención, pero bloque a bloque. Desliza pequeños tiles de la rejilla por la memoria rápida y diminuta de la GPU (SRAM), guardando solo un resumen corriente — así la rejilla N×N completa nunca se almacena.",
      bullets: [
        "**Izquierda: naive.** Toda la rejilla está en la memoria lenta de la GPU (HBM) a la vez — O(N²) bytes.",
        "**Derecha: FlashAttention.** Solo un tile está vivo a la vez, más un resumen corriente por fila. La memoria es O(N) — plana, sin importar el largo.",
        "**La SRAM es rápida pero diminuta** (megabytes). Un tile cabe; la rejilla completa jamás — por eso fluir tiles también es *más rápido*, no solo más pequeño.",
        "**La respuesta es idéntica.** Un truco de máximo corriente mantiene el softmax exacto según llega cada tile — los mismos números, una fracción de la memoria.",
      ],
      cardLabel: "NAIVE vs FLASHATTENTION · MISMA SECUENCIA 32k",
      aria: "Dos rejillas de puntuaciones lado a lado: la naive completamente residente, la de FlashAttention procesada de a un tile.",
      steps: 1,
      captions: ["Elige un tamaño de bloque y compara: la rejilla naive está entera; FlashAttention sostiene un tile."],
      hint: "Cambia el tamaño de bloque — más tiles o menos, pero la memoria de FlashAttention sigue siendo una astilla de la barra naive.",
      readoutTitle: "TILING",
      rows: ["BLOQUE", "TILES", "NAIVE", "FLASH"],
      readoutNote: "Memoria pico para una cabeza sobre una secuencia de 32k: la rejilla entera (naive) frente a un tile vivo más los resúmenes de fila (FlashAttention).",
      sliderNote: "El tamaño de bloque fija cuán grande es cada tile. Tiles más grandes son menos pasadas pero más SRAM por tile; de cualquier modo la rejilla completa nunca reside.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Que las cabezas de consulta compartan claves y valores",
      intro: "Hay un segundo costo de memoria cuando el modelo responde: el KV cache — las claves y valores de cada token pasado, guardados para no recalcularlos. Darle a cada cabeza de consulta su propia K/V es caro, así que las cabezas las comparten.",
      bullets: [
        "**MHA — un set K/V por cabeza.** El diseño clásico: 8 cabezas de consulta, 8 cabezas de clave/valor. El cache más grande.",
        "**GQA — las cabezas comparten en grupos.** Varias cabezas de consulta leen una K/V compartida. Aquí 8 comparten 2 sets — un cache 4× menor, casi sin pérdida de calidad.",
        "**MQA — una K/V para todas.** Cada cabeza de consulta lee un único set K/V: cache 8× menor, la opción más liviana.",
        "**La barra es el KV cache** de un chat de 32k a lo largo de 32 capas. Compartir es por qué los modelos de contexto largo siguen siendo asequibles de ejecutar.",
      ],
      cardLabel: "COMPARTIR K/V · CABEZAS DE CONSULTA → CABEZAS K/V",
      aria: "Ocho cabezas de consulta conectadas a un número decreciente de cabezas clave/valor compartidas, con la barra de memoria del KV cache.",
      steps: 1,
      captions: ["Cambia MHA / GQA / MQA y mira las cabezas de consulta colapsar sobre menos cabezas K/V compartidas."],
      hint: "Cicla MHA → GQA → MQA — el cableado colapsa sobre menos cabezas K/V y la barra de cache se encoge 4× y luego 8×.",
      readoutTitle: "KV_CACHE",
      rows: ["ESQUEMA", "CAB. Q", "CAB. K/V", "CACHE"],
      readoutNote: "El cache de clave/valor sostenido durante la generación — 32 capas, 32k tokens, fp16 — a medida que las cabezas comparten menos K/V.",
      optionNotes: [
        "MHA (atención multi-cabeza) — cada cabeza de consulta tiene su propia cabeza clave/valor. Calidad plena, el KV cache más grande.",
        "GQA (atención de consulta agrupada) — las cabezas de consulta comparten K/V en grupos pequeños. Aquí unas 4× menos cache, sin apenas pérdida de calidad. El estándar moderno.",
        "MQA (atención multi-consulta) — todas las cabezas de consulta comparten un set K/V. El cache más pequeño y la decodificación más rápida, con un leve costo de calidad.",
      ],
    },
  ],
  n1slider: "LARGO DE SECUENCIA",
  n1gridLabel: "N × N puntuaciones",
  n1axisLabel: "N tokens",
  n1gpuLabel: "GPU · 80 GB",
  n1overflow: "no cabe",
  n2slider: "TAMAÑO DE BLOQUE",
  n2naiveLabel: "Naive · rejilla entera en HBM",
  n2flashLabel: "FlashAttention · un tile en SRAM",
  n2tilesWord: "tiles",
  n2sramLabel: "en SRAM",
  n2outLabel: "salida corriente",
  n2deeperTitle: "El truco que mantiene el softmax exacto",
  n2deeperBody:
    "El softmax normalmente necesita toda la fila de puntuaciones a la vez — restas el máximo de la fila, exponencias y divides por la suma de la fila. FlashAttention nunca tiene la fila entera. En su lugar lleva dos números corrientes por fila de salida: el máximo visto hasta ahora `m` y la suma corriente `l`. Cuando llega un tile nuevo con un máximo mayor, **reescala** la salida acumulada por `exp(m_viejo − m_nuevo)` antes de sumar la contribución del tile. Algebraicamente esto es idéntico a computar el softmax sobre la fila completa — así la salida coincide con la atención naive bit a bit, mientras solo un tile está en memoria a la vez.",
  n3seg: ["MHA", "GQA", "MQA"],
  n3queryLabel: "cabezas de consulta",
  n3kvLabel: "cabezas clave/valor",
  n3shareWord: "comparten",
  n3deeperTitle: "La máscara causal — media rejilla es gratis",
  n3deeperBody:
    "Un modelo de lenguaje solo deja que un token atienda a tokens anteriores, nunca futuros. Esa es la máscara causal: la rejilla de puntuaciones es triangular inferior, así que la mitad superior se descarta. FlashAttention lo aprovecha directamente — cualquier tile que quede entero por encima de la diagonal se *salta*, ahorrando de golpe cerca de la mitad del trabajo de puntuación. Compartir K/V (este nodo) y saltar tiles enmascarados (la máscara) son ganancias independientes que se suman.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "FlashAttention igual computa una puntuación por cada par de tokens. Entonces, ¿cómo evita el estallido de memoria N×N?",
  explainA: "Nunca *guarda* la rejilla entera a la vez. Recorre la rejilla en pequeños tiles por la memoria rápida en-chip de la GPU, y en vez de guardar cada puntuación guarda un resumen corriente por fila de salida — un máximo corriente y una suma corriente. Un paso de reescalado hace que el softmax salga exacto según llega cada tile, así la respuesta final es idéntica a la atención naive. La memoria pico baja de O(N²) a O(N), y como los tiles viven en la SRAM rápida también es más veloz. **GQA/MQA** atacan un costo de memoria distinto — el KV cache durante la generación — dejando que varias cabezas de consulta compartan un set de claves y valores, encogiendo ese cache de 4× a 8× con poca o ninguna pérdida de calidad.",
  bridgeLabel: "SIGUIENTE: MIXTURE OF EXPERTS",
  bridgeBody: "La atención ya escala a contexto largo sin el muro de memoria. Sigue **Mixture of Experts**: la otra mitad de un modelo grande — enrutar cada token a solo unas pocas sub-redes expertas, para que el modelo sea enorme mientras solo una porción corre por token.",
  prevLesson: "Atrás: contexto largo",
  nextLesson: "Continuar a Mixture of Experts",
};
