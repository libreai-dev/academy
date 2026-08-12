/**
 * Stage 0 · Serving — The KV cache. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs. ALL
 * user-facing text (including diagram labels) lives in this module.
 *
 * Builds on "Prefill vs decode": decode writes one token per step, and each
 * step re-reads the prompt plus every earlier token. This lesson shows the
 * mechanism that makes that re-reading cheap — the key/value (KV) cache — and
 * why it turns generation into a memory-bound problem, not a compute-bound one.
 */
import type { WsNodeCopy } from "./shared";

/** Text labels painted into node 1's staircase diagram. */
export interface KvDiagram1 {
  step: string; //     "decode step →"
  redone: string; //   "redone every step"
  newest: string; //   "the one new token"
  total: string; //    "≈ N² ⁄ 2 passes" (headline)
}
/** Text labels painted into node 2's compare diagram. */
export interface KvDiagram2 {
  without: string; //  "without cache"
  withCache: string; // "with cache"
  saved: string; //    "work saved"
  step: string; //     "decode step →"
}
/** Text labels painted into node 3's VRAM grid. */
export interface KvDiagram3 {
  vram: string; //     "GPU memory · 80 GB"
  weights: string; //  "weights"
  cache: string; //    "KV cache"
  free: string; //     "free"
  overflow: string; // "OUT OF MEMORY"
}

export interface KvCacheLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1
  n1slider: string;
  n1tokensWord: string; //  "tokens"
  n1diagram: KvDiagram1;
  // node 2
  n2cacheOn: string;
  n2cacheOff: string;
  n2diagram: KvDiagram2;
  // node 3
  n3slider: string;
  n3diagram: KvDiagram3;
  n3okLabel: string;
  n3overflowLabel: string;
  // go-deeper
  deeperTitle: string;
  deeperBody: string;
  // wrap-up
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const kvCacheEN: KvCacheLesson = {
  crumb: "STAGE 0 · SERVING · THE KV CACHE",
  eyebrow: "STAGE 0 · SERVING · 3 NODES",
  title: "The KV cache",
  lede: "You saw that decode writes one token at a time, re-reading everything so far at every step. Doing that from scratch would be hopeless. The fix is a cache — the model files away each token's notes once, so every new token stays cheap. That one trick is why generation is limited by memory, not compute.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Without a cache", "With the cache", "What it costs"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Without a cache, every step redoes the whole history",
      intro: "To decide the next token, the model looks back at every earlier token. It does that through two vectors it makes for each one — a key and a value, its saved notes about that token. Naively, it would rebuild those notes for all of them, every single step.",
      bullets: [
        "**Each token becomes a key and a value** — a small pair of vectors the model reads back when it looks at the past.",
        "**No cache means redo everything.** To write token N, a naive model recomputes the key and value for all N tokens — even the ones that never changed.",
        "**Work per step grows with position.** Step 1 does 1 unit of work; step 100 does 100. The staircase is the waste.",
        "**Over a whole answer it's quadratic** — total work grows with the *square* of the length, so long answers become impossibly slow.",
      ],
      cardLabel: "WORK PER STEP · NO CACHE",
      aria: "A rising staircase of bars: the work to write each token grows with its position.",
      steps: 1,
      captions: ["Each bar is one decode step; taller means more tokens recomputed from scratch."],
      hint: "Drag the answer length — the staircase (and the wasted work) grows with the square of it.",
      readoutTitle: "NAIVE_WORK",
      rows: ["PER STEP", "TOTAL", "WASTED"],
      readoutNote: "Work if the model rebuilt every token's key and value each step: the last step's cost, the whole-answer total, and how much of it was pure repetition.",
      sliderNote: "Longer answers don't just cost more — they cost more per token too, because each new step redoes all the tokens before it.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "With the cache, you compute only the new token",
      intro: "The keys and values for past tokens never change — so compute them once and keep them. Each new step only makes the notes for the single new token, then reads the rest straight from the cache.",
      bullets: [
        "**Store each token's key and value once.** After a token is processed, its notes are filed away and never rebuilt.",
        "**Every step does the same tiny amount of work** — one new token, no matter how long the history is. The staircase collapses to a flat line.",
        "**Same answer, a fraction of the work.** The green area is everything the cache saved versus the naive path.",
        "**This is on by default everywhere.** Every model you've used generates this way — it's what makes streaming feel instant.",
      ],
      cardLabel: "WORK PER STEP · CACHE ON vs OFF",
      aria: "A comparison of per-step work: a rising staircase without the cache, a flat line with it.",
      steps: 1,
      captions: ["Flip the cache and watch the staircase of work collapse into a flat line."],
      hint: "Turn the cache on — the per-step work drops from a rising staircase to one flat unit.",
      readoutTitle: "CACHE_EFFECT",
      rows: ["WITHOUT", "WITH", "SPEEDUP"],
      readoutNote: "Total work over the same answer, cache off vs on — and how many times less work the cache does.",
      optionNotes: [
        "Cache off — the naive path: every step rebuilds the key and value for all the tokens before it. This is the wasteful baseline.",
        "Cache on — the real path: past keys and values are read from memory, so each step only computes the one new token. The work per step is flat.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The cache grows — and eats memory",
      intro: "Nothing is free. Every token you keep adds its key and value to the cache, which lives in the GPU's memory right next to the weights. The longer the context, the more it eats — until there's no room left.",
      bullets: [
        "**The cache grows with context length.** Each token adds a fixed slice, so the cache size is just tokens × a per-token cost.",
        "**It shares the GPU with the weights.** Weights take a fixed block; the cache fills whatever is left.",
        "**Run out of room and generation stops** — this is the real ceiling on context length, and why long chats get cut off.",
        "**So decode is memory-bound, not compute-bound.** The cache is cheap to *read*; the hard limit is fitting it in memory.",
      ],
      cardLabel: "GPU MEMORY · WEIGHTS + KV CACHE",
      aria: "A grid of GPU memory cells: weights fill a fixed block, the KV cache grows to fill the rest.",
      steps: 1,
      captions: ["Drag the context and watch the green cache eat into the free memory."],
      hint: "Drag the context length — the cache grows until it overflows the GPU's memory.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["KV CACHE", "OF VRAM", "STATUS"],
      readoutNote: "How much of the 80 GB GPU the cache is eating, and whether the model still fits. Per-token cost is illustrative for a modern model.",
      sliderNote: "Every token in the context permanently costs its slice of memory — so context length is capped by GB, not by speed.",
    },
  ],
  n1slider: "ANSWER LENGTH",
  n1tokensWord: "tokens",
  n1diagram: {
    step: "decode step →",
    redone: "recomputed every step",
    newest: "the one new token",
    total: "wasted passes",
  },
  n2cacheOn: "CACHE ON",
  n2cacheOff: "CACHE OFF",
  n2diagram: {
    without: "without cache",
    withCache: "with cache",
    saved: "work saved",
    step: "decode step →",
  },
  n3slider: "CONTEXT LENGTH",
  n3diagram: {
    vram: "GPU memory · 80 GB",
    weights: "weights",
    cache: "KV cache",
    free: "free",
    overflow: "OUT OF MEMORY",
  },
  n3okLabel: "FITS",
  n3overflowLabel: "OVERFLOW",
  deeperTitle: "Go deeper: where the K and V come from",
  deeperBody:
    "Inside attention, each token is turned into three vectors — a query, a key, and a value (Q, K, V). To produce the next token, the newest token's query is compared against the keys of every earlier token to decide what to pay attention to, then the matching values are mixed in. The queries are only ever needed for the current step, but the keys and values of the past are needed again and again — so those are exactly what gets cached. The per-token memory cost is roughly 2 (K and V) × layers × key/value size × 2 bytes; multiply by every token in the context and you get the numbers in the last node.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A model has plenty of compute left, but a long chat suddenly refuses to continue. Why — and what actually ran out?",
  explainA: "What ran out is **memory, not compute**. During decode the model caches each token's **key and value** so it never recomputes the history — that's what keeps every new token cheap and makes streaming feel instant. But that cache lives in GPU memory beside the weights, and it grows with every token in the context. Eventually weights + cache fill the GPU and there's no room to add another token, so generation stops. The cache is cheap to *read* but expensive to *store* — which is why generation is limited by how much fits in memory, not by how fast the chip can compute.",
  bridgeLabel: "THAT'S THE SERVING PICTURE",
  bridgeBody: "Prefill reads your prompt in one pass, decode writes the answer one token at a time, and the **KV cache** is what keeps that drip fast — right up until it runs out of memory. From here, the roadmap branches into the systems tricks that stretch that memory further.",
  prevLesson: "Previous: preference optimization",
  nextLesson: "Back to the roadmap",
};

/* ============================================================ SPANISH ======= */

export const kvCacheES: KvCacheLesson = {
  crumb: "ETAPA 0 · SERVICIO · LA CACHÉ KV",
  eyebrow: "ETAPA 0 · SERVICIO · 3 NODOS",
  title: "La caché KV",
  lede: "Viste que decode escribe un token a la vez, releyendo todo lo anterior en cada paso. Hacerlo desde cero sería imposible. La solución es una caché — el modelo archiva las notas de cada token una sola vez, así cada token nuevo sigue siendo barato. Ese único truco es por qué la generación está limitada por la memoria, no por el cómputo.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Sin caché", "Con la caché", "Lo que cuesta"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Sin caché, cada paso rehace toda la historia",
      intro: "Para decidir el siguiente token, el modelo mira hacia atrás a cada token anterior. Lo hace con dos vectores que crea para cada uno — una clave (key) y un valor (value), sus notas guardadas sobre ese token. De forma ingenua, reconstruiría esas notas para todos, en cada paso.",
      bullets: [
        "**Cada token se vuelve una clave y un valor** — un pequeño par de vectores que el modelo relee cuando mira el pasado.",
        "**Sin caché hay que rehacerlo todo.** Para escribir el token N, un modelo ingenuo recalcula la clave y el valor de los N tokens — incluso los que nunca cambiaron.",
        "**El trabajo por paso crece con la posición.** El paso 1 hace 1 unidad; el paso 100 hace 100. La escalera es el desperdicio.",
        "**En toda una respuesta es cuadrático** — el trabajo total crece con el *cuadrado* del largo, así que las respuestas largas se vuelven imposiblemente lentas.",
      ],
      cardLabel: "TRABAJO POR PASO · SIN CACHÉ",
      aria: "Una escalera ascendente de barras: el trabajo para escribir cada token crece con su posición.",
      steps: 1,
      captions: ["Cada barra es un paso de decode; más alta significa más tokens recalculados desde cero."],
      hint: "Arrastra la longitud de la respuesta — la escalera (y el trabajo desperdiciado) crece con su cuadrado.",
      readoutTitle: "NAIVE_WORK",
      rows: ["POR PASO", "TOTAL", "DESPERDICIO"],
      readoutNote: "Trabajo si el modelo reconstruyera la clave y el valor de cada token en cada paso: el costo del último paso, el total de la respuesta y cuánto fue pura repetición.",
      sliderNote: "Las respuestas largas no solo cuestan más — cuestan más por token, porque cada paso nuevo rehace todos los tokens anteriores.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Con la caché, solo calculas el token nuevo",
      intro: "Las claves y los valores de los tokens pasados nunca cambian — así que calcúlalos una vez y guárdalos. Cada paso nuevo solo crea las notas del único token nuevo, y el resto lo lee directo de la caché.",
      bullets: [
        "**Guarda la clave y el valor de cada token una vez.** Tras procesar un token, sus notas quedan archivadas y no se reconstruyen.",
        "**Cada paso hace la misma pizca de trabajo** — un token nuevo, sin importar cuán larga sea la historia. La escalera se colapsa en una línea plana.",
        "**La misma respuesta, una fracción del trabajo.** El área verde es todo lo que la caché ahorró frente al camino ingenuo.",
        "**Está activada por defecto en todas partes.** Todo modelo que has usado genera así — es lo que hace que el streaming se sienta instantáneo.",
      ],
      cardLabel: "TRABAJO POR PASO · CACHÉ ON vs OFF",
      aria: "Una comparación del trabajo por paso: una escalera ascendente sin la caché, una línea plana con ella.",
      steps: 1,
      captions: ["Alterna la caché y mira la escalera de trabajo colapsar en una línea plana."],
      hint: "Enciende la caché — el trabajo por paso baja de una escalera ascendente a una unidad plana.",
      readoutTitle: "CACHE_EFFECT",
      rows: ["SIN", "CON", "ACELERACIÓN"],
      readoutNote: "Trabajo total sobre la misma respuesta, caché apagada vs encendida — y cuántas veces menos trabajo hace la caché.",
      optionNotes: [
        "Caché apagada — el camino ingenuo: cada paso reconstruye la clave y el valor de todos los tokens anteriores. Esta es la base derrochadora.",
        "Caché encendida — el camino real: las claves y valores pasados se leen de la memoria, así que cada paso solo calcula el único token nuevo. El trabajo por paso es plano.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "La caché crece — y se come la memoria",
      intro: "Nada es gratis. Cada token que conservas suma su clave y su valor a la caché, que vive en la memoria de la GPU justo al lado de los pesos. Cuanto más largo el contexto, más se come — hasta que no queda espacio.",
      bullets: [
        "**La caché crece con la longitud del contexto.** Cada token añade una porción fija, así que el tamaño de la caché es solo tokens × un costo por token.",
        "**Comparte la GPU con los pesos.** Los pesos ocupan un bloque fijo; la caché llena lo que quede.",
        "**Si se acaba el espacio, la generación se detiene** — este es el techo real de la longitud del contexto, y por qué las conversaciones largas se cortan.",
        "**Por eso decode está limitado por memoria, no por cómputo.** La caché es barata de *leer*; el límite duro es que quepa en memoria.",
      ],
      cardLabel: "MEMORIA GPU · PESOS + CACHÉ KV",
      aria: "Una cuadrícula de celdas de memoria GPU: los pesos llenan un bloque fijo, la caché KV crece para llenar el resto.",
      steps: 1,
      captions: ["Arrastra el contexto y mira la caché verde comerse la memoria libre."],
      hint: "Arrastra la longitud del contexto — la caché crece hasta desbordar la memoria de la GPU.",
      readoutTitle: "MEMORY_BUDGET",
      rows: ["CACHÉ KV", "DE VRAM", "ESTADO"],
      readoutNote: "Cuánto de la GPU de 80 GB se está comiendo la caché, y si el modelo todavía cabe. El costo por token es ilustrativo para un modelo moderno.",
      sliderNote: "Cada token del contexto cuesta permanentemente su porción de memoria — así que la longitud del contexto está limitada por GB, no por velocidad.",
    },
  ],
  n1slider: "LONGITUD DE LA RESPUESTA",
  n1tokensWord: "tokens",
  n1diagram: {
    step: "paso de decode →",
    redone: "recalculado en cada paso",
    newest: "el único token nuevo",
    total: "pases desperdiciados",
  },
  n2cacheOn: "CACHÉ ON",
  n2cacheOff: "CACHÉ OFF",
  n2diagram: {
    without: "sin caché",
    withCache: "con caché",
    saved: "trabajo ahorrado",
    step: "paso de decode →",
  },
  n3slider: "LONGITUD DEL CONTEXTO",
  n3diagram: {
    vram: "memoria GPU · 80 GB",
    weights: "pesos",
    cache: "caché KV",
    free: "libre",
    overflow: "SIN MEMORIA",
  },
  n3okLabel: "CABE",
  n3overflowLabel: "DESBORDE",
  deeperTitle: "Más a fondo: de dónde salen la K y la V",
  deeperBody:
    "Dentro de la atención, cada token se convierte en tres vectores — una consulta, una clave y un valor (Q, K, V). Para producir el siguiente token, la consulta del token más nuevo se compara con las claves de cada token anterior para decidir a qué prestar atención, y luego se mezclan los valores correspondientes. Las consultas solo se necesitan para el paso actual, pero las claves y los valores del pasado se necesitan una y otra vez — así que son exactamente lo que se guarda en caché. El costo de memoria por token es aproximadamente 2 (K y V) × capas × tamaño de clave/valor × 2 bytes; multiplícalo por cada token del contexto y obtienes los números del último nodo.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "A un modelo le sobra cómputo, pero una conversación larga de pronto se niega a continuar. ¿Por qué — y qué se agotó de verdad?",
  explainA: "Lo que se agotó es la **memoria, no el cómputo**. Durante decode el modelo guarda en caché la **clave y el valor** de cada token para no recalcular la historia — eso es lo que mantiene barato cada token nuevo y hace que el streaming se sienta instantáneo. Pero esa caché vive en la memoria de la GPU junto a los pesos, y crece con cada token del contexto. Al final pesos + caché llenan la GPU y no hay lugar para otro token, así que la generación se detiene. La caché es barata de *leer* pero cara de *guardar* — por eso la generación está limitada por cuánto cabe en memoria, no por lo rápido que calcula el chip.",
  bridgeLabel: "ESA ES LA FOTO DEL SERVICIO",
  bridgeBody: "Prefill lee tu prompt en un pase, decode escribe la respuesta token por token, y la **caché KV** es lo que mantiene rápido ese goteo — justo hasta que se queda sin memoria. Desde aquí, la ruta se ramifica hacia los trucos de sistemas que estiran esa memoria aún más.",
  prevLesson: "Anterior: optimización por preferencias",
  nextLesson: "Volver a la ruta",
};
