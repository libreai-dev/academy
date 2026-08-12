/**
 * Stage 0 · Serving (Expert) — KV-cache systems. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 * ALL user-facing text (including the labels painted into the d3 diagrams) lives
 * in this module.
 *
 * One idea: a serving engine manages the KV cache like an operating system
 * manages memory — PagedAttention stores it in fixed pages to kill
 * fragmentation, and RadixAttention reuses a shared prefix across requests.
 * Builds on the KV-cache lesson (the cache already exists, one entry per past
 * token); does NOT re-teach what a key/value is or why decode is memory-bound.
 */
import type { WsNodeCopy } from "./shared";

export interface KvCacheSystemsLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — fragmentation
  n1reserveLabel: string; //  slider
  n1free: string; //          toggle: "Free R2"
  n1freeNote: string; //      note shown once R2 is freed
  n1legUsed: string; //       diagram legend
  n1legReserved: string;
  n1legFree: string;
  n1freedTag: string; //      "freed"
  n1deeperTitle: string;
  n1deeperBody: string;

  // Node 2 — PagedAttention
  n2slider: string; //        "ACTIVE REQUESTS"
  n2contigLabel: string; //   diagram: "CONTIGUOUS (naive)"
  n2pagedLabel: string; //    diagram: "PAGED (block table)"
  n2legRequest: string; //    diagram legend: colour = one request
  n2legReserved: string; //   diagram legend: dashed = reserved, empty
  n2rejected: string; //      diagram tag: "✕ rejected"
  n2callLabel: string;
  n2callTitle: string;
  n2callBody: string;
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 — RadixAttention
  n3slider: string; //        "REQUESTS SHARING THE PROMPT"
  n3share: string; //         toggle base label
  n3sharedLabel: string; //   diagram title when sharing on
  n3separateLabel: string; // diagram title when sharing off
  n3prefixTag: string; //     "shared prefix — cached once"
  n3legPrefix: string; //     legend
  n3legUnique: string;
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

export const kvCacheSystemsEN: KvCacheSystemsLesson = {
  crumb: "STAGE 0 · SERVING · KV-CACHE SYSTEMS",
  eyebrow: "STAGE 0 · SERVING · 3 NODES",
  title: "Managing the KV cache",
  lede: "You already know the KV cache — every token a model generates stores its keys and values so the next one is cheap. But that cache is enormous and grows unpredictably. This is how a serving engine manages it the way an operating system manages memory: fixed pages to stop waste, and shared prefixes to reuse work across requests.",
  pipelineLabel: "THE 3 IDEAS",
  pipeline: ["The fragmentation problem", "PagedAttention", "RadixAttention"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Why the cache wastes most of its memory",
      intro: "A request's cache grows one token at a time, and you can't know in advance how long it will get. The naive fix — reserve the maximum up front — leaves most of the memory empty and unusable.",
      bullets: [
        "**The KV cache is per-request and variable-length.** A reply might be 20 tokens or 2,000, and you don't know which when it starts.",
        "**Naive serving reserves one contiguous slab** sized to the maximum length. A short answer leaves most of its slab empty — that reserved-but-unused space is *internal fragmentation*.",
        "**Finished requests leave holes.** The free space is real, but scattered into gaps too small for the next request — *external fragmentation*.",
        "**The result: often under 40% of the cache holds real tokens.** The rest is reserved-empty or stranded in gaps.",
      ],
      cardLabel: "GPU KV-CACHE · 32 BLOCKS",
      aria: "A memory strip where each request reserves a contiguous slab, most of it left empty.",
      steps: 1,
      captions: ["Each request reserves a full slab; the green blocks are the tokens it actually holds."],
      hint: "Raise the reserved length and watch utilisation collapse — then free R2 to strand its blocks in a gap.",
      readoutTitle: "CACHE_UTILISATION",
      rows: ["IN USE", "RESERVED · EMPTY", "LARGEST GAP"],
      readoutNote: "How full the cache really is: blocks holding tokens, blocks reserved but empty, and the biggest single free run a new request could use.",
      sliderNote: "Each request reserves its maximum length up front. The taller the reservation, the more sits empty — real tokens fill only a fraction.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "PagedAttention — cache in fixed pages",
      intro: "Operating systems beat fragmentation decades ago with virtual memory: chop memory into fixed pages and let a page table scatter them anywhere. PagedAttention does exactly this to the KV cache.",
      bullets: [
        "**Split the cache into fixed-size pages** — a handful of tokens each. A request grows one page at a time, only when it needs it. No giant reservation.",
        "**A block table maps a request's tokens to physical pages**, which can sit *anywhere* in memory instead of one contiguous run. That's the page table from virtual memory.",
        "**Waste drops to at most one partial page per request** — a few percent, versus more than half.",
        "**Any free page fits any request**, so external fragmentation disappears — the requests the naive strip rejected now all fit.",
      ],
      cardLabel: "CONTIGUOUS vs PAGED · SAME REQUESTS",
      aria: "Two memory strips: contiguous reservation that rejects requests, and paged allocation that fits all of them.",
      steps: 1,
      captions: ["The same requests, laid out two ways: reserved contiguous slabs above, fixed pages below."],
      hint: "Add requests — the contiguous strip fills up and starts rejecting; the paged strip keeps packing them in.",
      readoutTitle: "PACKING",
      rows: ["CONTIGUOUS", "PAGED", "NAIVE REJECTS"],
      readoutNote: "Real utilisation each way — tokens held divided by blocks locked up — and how many active requests the naive strip had to reject.",
      sliderNote: "Each request reserves 6 blocks contiguously in the naive strip, but only needs a page or two. Paging hands out just the pages it actually uses.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "RadixAttention — reuse a shared prefix",
      intro: "Many requests start with the *same* tokens — a long system prompt, a few-shot example, a chat history everyone shares. Caching that prefix once, for all of them, is RadixAttention.",
      bullets: [
        "**A shared prefix has identical keys and values for every request** — so its cache blocks are identical too. Storing them per-request is pure duplication.",
        "**Keep every cached prefix in a radix tree** — a prefix tree where a shared beginning is a single branch. A new request that matches it reuses those blocks instead of recomputing them.",
        "**Only the unique suffix costs new memory** — and new compute. The shared trunk is a cache *hit*: nothing recomputed, nothing extra stored.",
        "**Turn sharing off and every request re-stores the whole prefix** — the grey blocks repeat once per request, down the page.",
      ],
      cardLabel: "SHARED PREFIX · ONE COPY OR MANY",
      aria: "Requests sharing a prefix, drawn as separate repeated chains, or as a merged tree with one shared trunk.",
      steps: 1,
      captions: ["Grey is the shared prefix; green is each request's unique part."],
      hint: "Turn prefix sharing on — the repeated grey prefixes collapse into a single shared trunk.",
      readoutTitle: "PREFIX_CACHE",
      rows: ["BLOCKS STORED", "vs NO SHARING", "SAVED"],
      readoutNote: "Cache blocks stored with sharing versus storing each request's prefix separately, and the memory that saves.",
      optionNotes: [
        "Sharing off — every request stores its own copy of the shared prefix. The grey blocks repeat once per request.",
        "Sharing on (RadixAttention) — the shared prefix is stored once as a trunk; each request only adds its unique suffix.",
      ],
    },
  ],
  n1reserveLabel: "RESERVED LENGTH / REQUEST",
  n1free: "Free R2",
  n1freeNote: "R2 finished and freed its slab. Those blocks are free now — but they're a separate gap. A longer request needs one contiguous run and can't stitch two gaps together.",
  n1legUsed: "in use",
  n1legReserved: "reserved",
  n1legFree: "free",
  n1freedTag: "freed",
  n1deeperTitle: "Internal vs external fragmentation",
  n1deeperBody: "Two different wastes. Internal fragmentation is space reserved inside a request's own slab that never gets used — you booked 2,048 token-slots and the answer was 200. External fragmentation is free space that exists but is broken into runs too small to satisfy the next contiguous request. Classic operating systems hit exactly this with contiguous allocation; the fix there — and here — is to stop requiring one big contiguous block.",
  n2slider: "ACTIVE REQUESTS",
  n2contigLabel: "CONTIGUOUS · naive",
  n2pagedLabel: "PAGED · block table",
  n2legRequest: "colour = one request",
  n2legReserved: "dashed = reserved, empty",
  n2rejected: "rejected",
  n2callLabel: "OS ANALOGY · VIRTUAL MEMORY",
  n2callTitle: "A page table for the KV cache",
  n2callBody: "In an OS, your program sees one smooth address space while the page table quietly maps it to scattered physical pages. PagedAttention gives each request that same illusion — logically contiguous tokens, physically scattered pages — which is where the name (and the [vLLM](https://github.com/vllm-project/vllm) engine that introduced it) comes from.",
  n2deeperTitle: "Page size, and copy-on-write",
  n2deeperBody: "Page size trades two wastes off: bigger pages mean fewer block-table entries but more leftover at the end of the last page; vLLM defaults to 16 tokens per page. Because pages are shared by reference, two requests can point at the same physical page until one diverges — copy-on-write, again borrowed from operating systems. That makes parallel sampling (several completions of one prompt) nearly free in memory until the completions actually split.",
  n3slider: "REQUESTS SHARING THE PROMPT",
  n3share: "Prefix sharing",
  n3sharedLabel: "RADIX TREE · one shared trunk",
  n3separateLabel: "SEPARATE · prefix repeated",
  n3prefixTag: "shared prefix — cached once",
  n3legPrefix: "shared prefix",
  n3legUnique: "unique suffix",
  n3deeperTitle: "The radix tree, and eviction",
  n3deeperBody: "A radix tree is a compressed prefix tree: each edge is a run of tokens, and any path from the root is a cached sequence. A new request walks the tree matching its tokens; the matched part is a cache hit, so it only computes from the first mismatch onward. When memory runs low the engine evicts least-recently-used leaves first, so a hot prefix (a popular system prompt) stays resident. SGLang calls this RadixAttention; vLLM exposes the same idea as automatic prefix caching.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "PagedAttention and RadixAttention both borrow an idea from operating systems. What does each one solve, and how do they differ?",
  explainA: "**PagedAttention** attacks *fragmentation inside one engine's memory*: instead of reserving a big contiguous slab per request, it stores the KV cache in fixed pages a request grows into on demand, with a block table mapping logical tokens to scattered physical pages — exactly like virtual memory. Waste falls from over half to a few percent, and no request is rejected for lack of a contiguous run. **RadixAttention** attacks *duplication across requests*: when many requests share a prefix — a system prompt, a few-shot preamble, a chat history — it stores that prefix once in a radix tree and every matching request reuses those blocks, a cache hit with no recompute and no extra storage. One packs a single cache tightly; the other shares work between caches. Together they're why a modern serving engine fits far more concurrent requests on the same GPU.",
  bridgeLabel: "NEXT: QUANTIZATION",
  bridgeBody: "Paging and prefix-sharing squeeze more requests into the cache — but every number in it still takes real bytes. Next, **quantization**: shrinking the weights and the cache from 16 bits down to 8 or 4, and what that costs in accuracy.",
  prevLesson: "Back: verifiable rewards",
  nextLesson: "Continue to quantization",
};

/* ============================================================ SPANISH ======= */

export const kvCacheSystemsES: KvCacheSystemsLesson = {
  crumb: "ETAPA 0 · SERVIR · SISTEMAS DE CACHÉ KV",
  eyebrow: "ETAPA 0 · SERVIR · 3 NODOS",
  title: "Gestionar la caché KV",
  lede: "Ya conoces la caché KV — cada token que genera un modelo guarda sus claves y valores para que el siguiente sea barato. Pero esa caché es enorme y crece de forma impredecible. Así la gestiona un motor de servicio como un sistema operativo gestiona la memoria: páginas fijas para frenar el desperdicio, y prefijos compartidos para reutilizar trabajo entre peticiones.",
  pipelineLabel: "LAS 3 IDEAS",
  pipeline: ["El problema de fragmentación", "PagedAttention", "RadixAttention"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Por qué la caché desperdicia casi toda su memoria",
      intro: "La caché de una petición crece token a token, y no puedes saber de antemano cuánto llegará a crecer. El arreglo ingenuo — reservar el máximo por adelantado — deja casi toda la memoria vacía e inutilizable.",
      bullets: [
        "**La caché KV es por petición y de largo variable.** Una respuesta puede ser de 20 tokens o de 2.000, y no sabes cuál cuando empieza.",
        "**El servicio ingenuo reserva un bloque contiguo** del tamaño del largo máximo. Una respuesta corta deja casi todo ese bloque vacío — ese espacio reservado pero sin usar es *fragmentación interna*.",
        "**Las peticiones que terminan dejan huecos.** El espacio libre es real, pero disperso en huecos demasiado pequeños para la siguiente petición — *fragmentación externa*.",
        "**El resultado: a menudo menos del 40% de la caché guarda tokens reales.** El resto está reservado-vacío o varado en huecos.",
      ],
      cardLabel: "CACHÉ KV EN GPU · 32 BLOQUES",
      aria: "Una tira de memoria donde cada petición reserva un bloque contiguo, la mayor parte vacío.",
      steps: 1,
      captions: ["Cada petición reserva un bloque completo; los bloques verdes son los tokens que de verdad guarda."],
      hint: "Sube el largo reservado y mira caer la utilización — luego libera R2 para varar sus bloques en un hueco.",
      readoutTitle: "CACHE_UTILISATION",
      rows: ["EN USO", "RESERVADO · VACÍO", "MAYOR HUECO"],
      readoutNote: "Qué tan llena está la caché de verdad: bloques con tokens, bloques reservados pero vacíos, y el mayor tramo libre que una petición nueva podría usar.",
      sliderNote: "Cada petición reserva su largo máximo por adelantado. Cuanto más alta la reserva, más queda vacío — los tokens reales llenan solo una fracción.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "PagedAttention — la caché en páginas fijas",
      intro: "Los sistemas operativos vencieron la fragmentación hace décadas con la memoria virtual: parte la memoria en páginas fijas y deja que una tabla de páginas las disperse por donde sea. PagedAttention hace justo esto con la caché KV.",
      bullets: [
        "**Parte la caché en páginas de tamaño fijo** — unos pocos tokens cada una. Una petición crece una página a la vez, solo cuando la necesita. Sin reserva gigante.",
        "**Una tabla de bloques mapea los tokens de una petición a páginas físicas**, que pueden estar *en cualquier lugar* de la memoria en vez de un tramo contiguo. Esa es la tabla de páginas de la memoria virtual.",
        "**El desperdicio baja a como mucho una página parcial por petición** — un pequeño porcentaje, frente a más de la mitad.",
        "**Cualquier página libre sirve para cualquier petición**, así que la fragmentación externa desaparece — las peticiones que la tira ingenua rechazaba ahora caben todas.",
      ],
      cardLabel: "CONTIGUO vs PÁGINAS · MISMAS PETICIONES",
      aria: "Dos tiras de memoria: la reserva contigua que rechaza peticiones, y las páginas que las acomodan todas.",
      steps: 1,
      captions: ["Las mismas peticiones, dispuestas de dos formas: bloques contiguos reservados arriba, páginas fijas abajo."],
      hint: "Añade peticiones — la tira contigua se llena y empieza a rechazar; la tira paginada las sigue acomodando.",
      readoutTitle: "PACKING",
      rows: ["CONTIGUO", "PÁGINAS", "RECHAZOS"],
      readoutNote: "La utilización real de cada forma — tokens guardados dividido entre bloques inmovilizados — y cuántas peticiones activas tuvo que rechazar la tira ingenua.",
      sliderNote: "Cada petición reserva 6 bloques contiguos en la tira ingenua, pero solo necesita una página o dos. Las páginas entregan solo las que de verdad usa.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "RadixAttention — reutilizar un prefijo compartido",
      intro: "Muchas peticiones empiezan con los *mismos* tokens — un prompt de sistema largo, un ejemplo few-shot, un historial de chat que todos comparten. Cachear ese prefijo una sola vez, para todas, es RadixAttention.",
      bullets: [
        "**Un prefijo compartido tiene claves y valores idénticos para cada petición** — así que sus bloques de caché también son idénticos. Guardarlos por petición es pura duplicación.",
        "**Guarda cada prefijo cacheado en un árbol radix** — un árbol de prefijos donde un comienzo compartido es una sola rama. Una petición nueva que lo empareja reutiliza esos bloques en vez de recalcularlos.",
        "**Solo el sufijo único cuesta memoria nueva** — y cómputo nuevo. El tronco compartido es un *acierto* de caché: nada se recalcula, nada extra se guarda.",
        "**Apaga el compartir y cada petición vuelve a guardar todo el prefijo** — los bloques grises se repiten una vez por petición, hacia abajo.",
      ],
      cardLabel: "PREFIJO COMPARTIDO · UNA COPIA O MUCHAS",
      aria: "Peticiones que comparten un prefijo, dibujadas como cadenas repetidas separadas, o como un árbol con un tronco compartido.",
      steps: 1,
      captions: ["El gris es el prefijo compartido; el verde es la parte única de cada petición."],
      hint: "Enciende el compartir de prefijos — los prefijos grises repetidos se colapsan en un solo tronco compartido.",
      readoutTitle: "PREFIX_CACHE",
      rows: ["BLOQUES GUARDADOS", "vs SIN COMPARTIR", "AHORRADO"],
      readoutNote: "Bloques de caché guardados al compartir frente a guardar el prefijo de cada petición por separado, y la memoria que eso ahorra.",
      optionNotes: [
        "Compartir apagado — cada petición guarda su propia copia del prefijo compartido. Los bloques grises se repiten una vez por petición.",
        "Compartir encendido (RadixAttention) — el prefijo compartido se guarda una vez como tronco; cada petición solo añade su sufijo único.",
      ],
    },
  ],
  n1reserveLabel: "LARGO RESERVADO / PETICIÓN",
  n1free: "Liberar R2",
  n1freeNote: "R2 terminó y liberó su bloque. Esos bloques ahora están libres — pero son un hueco aparte. Una petición más larga necesita un tramo contiguo y no puede coser dos huecos.",
  n1legUsed: "en uso",
  n1legReserved: "reservado",
  n1legFree: "libre",
  n1freedTag: "liberado",
  n1deeperTitle: "Fragmentación interna vs externa",
  n1deeperBody: "Dos desperdicios distintos. La fragmentación interna es espacio reservado dentro del propio bloque de una petición que nunca se usa — reservaste 2.048 espacios de token y la respuesta fue 200. La fragmentación externa es espacio libre que existe pero está roto en tramos demasiado pequeños para la siguiente petición contigua. Los sistemas operativos clásicos chocaban justo con esto en la asignación contigua; el arreglo allí — y aquí — es dejar de exigir un gran bloque contiguo.",
  n2slider: "PETICIONES ACTIVAS",
  n2contigLabel: "CONTIGUO · ingenuo",
  n2pagedLabel: "PÁGINAS · tabla de bloques",
  n2legRequest: "color = una petición",
  n2legReserved: "punteado = reservado, vacío",
  n2rejected: "rechazada",
  n2callLabel: "ANALOGÍA SO · MEMORIA VIRTUAL",
  n2callTitle: "Una tabla de páginas para la caché KV",
  n2callBody: "En un SO, tu programa ve un espacio de direcciones liso mientras la tabla de páginas lo mapea sin ruido a páginas físicas dispersas. PagedAttention le da a cada petición esa misma ilusión — tokens lógicamente contiguos, páginas físicamente dispersas — de donde viene el nombre (y el motor [vLLM](https://github.com/vllm-project/vllm) que lo introdujo).",
  n2deeperTitle: "Tamaño de página y copy-on-write",
  n2deeperBody: "El tamaño de página equilibra dos desperdicios: páginas grandes dan menos entradas en la tabla de bloques pero más sobrante al final de la última página; vLLM usa 16 tokens por página por defecto. Como las páginas se comparten por referencia, dos peticiones pueden apuntar a la misma página física hasta que una diverge — copy-on-write, otra vez tomado de los sistemas operativos. Eso hace que el muestreo paralelo (varias respuestas de un mismo prompt) sea casi gratis en memoria hasta que las respuestas de verdad se separan.",
  n3slider: "PETICIONES QUE COMPARTEN EL PROMPT",
  n3share: "Compartir prefijo",
  n3sharedLabel: "ÁRBOL RADIX · un tronco compartido",
  n3separateLabel: "SEPARADO · prefijo repetido",
  n3prefixTag: "prefijo compartido — cacheado una vez",
  n3legPrefix: "prefijo compartido",
  n3legUnique: "sufijo único",
  n3deeperTitle: "El árbol radix y el desalojo",
  n3deeperBody: "Un árbol radix es un árbol de prefijos comprimido: cada arista es un tramo de tokens, y cualquier camino desde la raíz es una secuencia cacheada. Una petición nueva recorre el árbol emparejando sus tokens; la parte emparejada es un acierto de caché, así que solo computa desde el primer desajuste en adelante. Cuando la memoria escasea el motor desaloja primero las hojas menos usadas recientemente, para que un prefijo popular (un prompt de sistema común) siga residente. SGLang lo llama RadixAttention; vLLM expone la misma idea como cacheo automático de prefijos.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "PagedAttention y RadixAttention toman prestada una idea de los sistemas operativos. ¿Qué resuelve cada uno y en qué se diferencian?",
  explainA: "**PagedAttention** ataca la *fragmentación dentro de la memoria de un motor*: en vez de reservar un gran bloque contiguo por petición, guarda la caché KV en páginas fijas que la petición va tomando bajo demanda, con una tabla de bloques que mapea tokens lógicos a páginas físicas dispersas — igual que la memoria virtual. El desperdicio cae de más de la mitad a unos pocos por ciento, y ninguna petición se rechaza por falta de un tramo contiguo. **RadixAttention** ataca la *duplicación entre peticiones*: cuando muchas comparten un prefijo — un prompt de sistema, un preámbulo few-shot, un historial de chat — guarda ese prefijo una vez en un árbol radix y cada petición que lo empareja reutiliza esos bloques, un acierto de caché sin recálculo ni almacenamiento extra. Uno empaqueta una sola caché con firmeza; el otro comparte trabajo entre cachés. Juntos son por qué un motor de servicio moderno acomoda muchas más peticiones concurrentes en la misma GPU.",
  bridgeLabel: "SIGUIENTE: CUANTIZACIÓN",
  bridgeBody: "Las páginas y el compartir prefijos meten más peticiones en la caché — pero cada número dentro sigue ocupando bytes reales. Sigue la **cuantización**: encoger los pesos y la caché de 16 bits a 8 o 4, y lo que eso cuesta en precisión.",
  prevLesson: "Atrás: recompensas verificables",
  nextLesson: "Continuar a cuantización",
};
