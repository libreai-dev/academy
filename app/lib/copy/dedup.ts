/**
 * Stage 0 · Phase 0.3 — Multi-stage deduplication. Interface + EN/ES copy for
 * the article, isolated from every other lesson.
 */
import type { WsNodeCopy } from "./shared";

/** Phase 0.3 — Multi-stage deduplication (6 nodes). Reuses the WsNodeCopy shape. */
export interface DedupLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the memorization trap
  n1presets: string[]; //     Raw / Conservative / Aggressive
  n1strength: string; //      "DEDUP STRENGTH"
  n1minWords: string; //      "MIN WORD LENGTH"
  // Node 2 — exact dedup
  n2modes: string[]; //       [Full document SHA-256, Paragraph suffix array]
  n2strip: string; //         "Strip cookie & privacy disclaimers"
  // Node 3 — MinHash
  n3shingle: string; //       "SHINGLE LENGTH (N-GRAMS)"
  n3perms: string; //         "HASH PERMUTATIONS"
  n3docA: string; //          label above sample doc A
  n3docB: string; //          label above sample doc B
  // Node 4 — LSH S-curve
  n4bands: string; //         "BANDS (b)"
  n4rows: string; //          "ROWS PER BAND (r)"
  n4predict: string; //       predict-checkpoint question
  n4axisX: string; //         "Jaccard similarity (s)"
  n4axisY: string; //         "P(candidate pair)"
  n4mathTitle: string; //     "Go deeper: the S-curve equation"
  n4mathBody: string; //      collapsed math block (the equation + how b, r move it)
  // Node 5 — SemDeDup
  n5radius: string; //        "CLUSTER RADIUS"
  n5eps: string; //           "EPSILON (COSINE DISTANCE)"
  // Node 6 — the funnel
  n6toggles: string[]; //     [Stage 1 exact, Stage 2 fuzzy, Stage 3 semantic]
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const dedupEN: DedupLesson = {
      crumb: "STAGE 0 · PHASE 0.3 · MULTI-STAGE DEDUPLICATION",
      eyebrow: "STAGE 0 · PHASE 0.3 · 5 NODES",
      title: "Multi-stage deduplication",
      lede: "The open web repeats itself constantly — the same article on 50 sites, the same license header in a million repos. Feed those repeats to a model and it memorises them word-for-word instead of learning. This is the 3-stage funnel that strips redundancy without comparing every pair of documents — one step at a time, with the trade-offs you can play with.",
      pipelineLabel: "THE 5 STEPS",
      pipeline: ["Why repeats hurt", "Exact dedup", "Near-duplicates", "Semantic dedup", "The funnel"],
      nodes: [
        {
          eyebrow: "NODE 01 / 05",
          title: "Why repeated text destroys capacity",
          intro: "See a sentence 100 times in training and a model stops *learning* it and starts *memorising* it — prompt the opening words and it recites the rest verbatim. Deduplication is an information-density dial.",
          bullets: [
            "**Repeats over-index the weights.** Attention locks onto the exact token sequence, so the model regurgitates instead of reasoning — a privacy and copyright risk.",
            "**Removing duplicate bytes buys diversity.** In a fixed compute budget, every dropped repeat makes room for a *new* fact, code pattern, or argument.",
            "**The {ring} green gate drops copies before the weights.** Unique docs pass; byte-for-byte copies are filtered out up front.",
            "**Too aggressive and you clip *useful* repetition** — idioms, math identities, core syntax. The dial has a sweet spot.",
          ],
          cardLabel: "MEMORIZATION RISK · DEDUP GATE",
          aria: "A stream of documents flowing toward a model's weight matrix, with a green gate dropping duplicate copies.",
          steps: 2,
          captions: [
            "Duplicate documents (red) pour into the weight matrix; the connections stiffen into memorised, rigid paths.",
            "The green dedup gate drops the copies before they land — the weights relax into a balanced, general graph.",
          ],
          hint: "Drag DEDUP STRENGTH up — verbatim memorization falls below the 0.1% target and GPU hours drop, but push past ~90 and unique docs start to go.",
          readoutTitle: "MEMORIZATION_AUDIT",
          rows: ["DOCS KEPT", "VERBATIM", "COMPUTE SAVED", "UNIQUE"],
          readoutNote: "The audit of your cut: documents surviving, verbatim memorization rate (target < 0.1%), GPU hours saved, and how much unique text you preserved.",
          sliderNote: "Dedup strength is how hard you prune repeats. Raise it and memorization falls and compute is freed — until it starts eating genuinely unique documents. Min word length spares short unique lines from being over-matched.",
        },
        {
          eyebrow: "NODE 02 / 05",
          title: "Stage 1 — exact line & document dedup",
          intro: "The cheapest layer catches byte-identical text. No AI needed: if two documents hash to the same value, one is a copy. Two techniques run at different levels.",
          bullets: [
            "**Document hashing** drops a whole file in O(1): compute a SHA-256, check a hash table or [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), skip on a hit.",
            "**Suffix-array span trimming** slices *shared paragraphs* — cookie banners, license headers, nav menus — out of otherwise-unique files, keeping the real body.",
            "**This runs on cheap CPUs in sub-millisecond time** — the fast path that clears the bulk before any expensive stage.",
          ],
          cardLabel: "EXACT DEDUP ENGINE",
          aria: "A document stream splitting into a hash-lookup path and a suffix-array span-trimming path.",
          steps: 2,
          captions: [
            "Path A hashes the whole document and checks the lookup table; a match drops the entire file in under 1 ms.",
            "Path B runs a suffix array over the text and slices out a shared 60-word boilerplate span, keeping the unique body.",
          ],
          hint: "Switch to the suffix array and strip disclaimers — files are preserved, but thousands of boilerplate spans get trimmed from inside them.",
          readoutTitle: "EXACT_DEDUPE_READOUT",
          rows: ["FILES DROPPED", "SPANS TRIMMED", "YIELD"],
          readoutNote: "What this stage did to 10,000 raw pages: whole files dropped, boilerplate spans sliced out, and clean text retained.",
          optionNotes: [
            "Full-document SHA-256 — hash the whole file, drop it if the hash was seen. Fastest, but only catches byte-identical duplicates.",
            "Paragraph suffix array — index the text and find shared spans within files. Slower, but trims boilerplate that whole-file hashing misses.",
          ],
        },
        {
          eyebrow: "NODE 03 / 05",
          title: "Stage 2 — catching near-duplicates",
          intro: "Exact hashing breaks on the real web: the same article on 50 sites has different sidebars and dates, so every SHA-256 differs. MinHash estimates how *similar* two documents are — this runs a real estimator on two samples.",
          bullets: [
            "**Shingling** breaks each doc into overlapping N-word sets, so word order and phrasing are captured, not just the bag of words.",
            "**A MinHash signature** applies many hash functions and keeps each one's minimum — compressing a whole document to ~128 integers.",
            "**Matching signature cells estimate [Jaccard similarity](https://en.wikipedia.org/wiki/Jaccard_index).** The two samples share their body but differ in chrome — the estimate should land near the true value.",
          ],
          cardLabel: "SHINGLE → SIGNATURE · REAL MINHASH",
          aria: "Two near-duplicate articles shingled and hashed into signature vectors, with matching cells highlighted.",
          steps: 2,
          captions: [
            "Both syndications are cut into overlapping N-word shingles — the body shingles are shared, the sidebar shingles are not.",
            "Each shingle set is MinHashed into a signature; the green cells are positions where the two signatures agree.",
          ],
          hint: "Raise the permutations — the estimated Jaccard tightens toward the true value, at the cost of a bigger signature.",
          readoutTitle: "MINHASH_METRICS",
          rows: ["TRUE J", "EST J", "SIGNATURE", "NEAR-DUPS"],
          readoutNote: "The real estimator's output for the two samples: exact Jaccard, MinHash estimate, signature size in bytes, and the near-duplicates this config would flag corpus-wide.",
          sliderNote: "Longer shingles catch closer matches; more permutations make the estimate tighter — at a bigger signature. Watch EST J track TRUE J.",
          optionNotes: [],
        },
        {
          eyebrow: "NODE 04 / 05",
          title: "Stage 3 — catching reworded copies",
          intro: "Hashing and MinHash only see surface words. They miss *semantic* redundancy: ten summaries of the same event, worded differently. SemDeDup runs on embeddings — but only after the cheap stages shield it.",
          bullets: [
            "**Exact + fuzzy are compute shields.** They strip 35–40% of the stream on cheap CPUs *before* a single expensive GPU embedding is generated.",
            "**Embed, then K-means cluster** the survivors into semantic neighbourhoods — all the coverage of one event lands together.",
            "**Prune within a cluster by distance.** Points sitting right on top of each other add zero new signal; the long-tail uniques between clusters are always kept.",
          ],
          cardLabel: "EMBEDDING CLUSTER MAP",
          aria: "A 2D map of embedding vectors in clusters, with redundant near-centroid points pruned away.",
          steps: 2,
          captions: [
            "Embeddings land in dense concept clusters — plus a scatter of unique long-tail points between them.",
            "Within each cluster, near-identical points are pruned; the distinct boundary points and every long-tail unique survive.",
          ],
          hint: "Raise EPSILON to prune more aggressively inside clusters — watch redundancy fall while concept diversity holds at ~100%.",
          readoutTitle: "SEMANTIC_DEDUPE_METRICS",
          rows: ["CLUSTERED", "REDUNDANCY", "DIVERSITY", "STATUS"],
          readoutNote: "The prune on the embedding field: vectors clustered (post CPU-shield), semantic redundancy removed, concept diversity retained, and whether any unique concept was lost.",
          sliderNote: "Epsilon is the prune radius around each cluster centre; radius scales it. Bigger drops more near-centre redundancy — the rim of distinct perspectives stays.",
          optionNotes: [],
        },
        {
          eyebrow: "NODE 05 / 05",
          title: "The funnel — yield vs. diversity",
          intro: "Dedup is a balancing act: strip too little and the model memorises; strip too much and you lose useful repetition. A staged funnel gets the density up while keeping enough volume.",
          bullets: [
            "**Each stage removes its slice at its own cost** — exact (fast CPU), fuzzy LSH (fast hash), semantic (GPU vectors).",
            "**Order matters:** cheap stages first, so the expensive GPU pass only sees what survived.",
            "**Aim for density, not maximum removal** — a pristine, high-reasoning-density corpus that still retains at least half its tokens.",
          ],
          cardLabel: "3-STAGE DEDUP FUNNEL",
          aria: "A three-tier funnel shrinking the dataset volume while a knowledge-density gauge rises.",
          steps: 1,
          captions: ["The raw dataset shrinks stage by stage while its knowledge-density gauge climbs into the green."],
          hint: "Toggle the three stages — each removes its slice; all three together hit high density while still retaining over half the volume.",
          readoutTitle: "FINAL_PIPELINE_SUMMARY",
          rows: ["INPUT", "OUTPUT", "DENSITY", "TIME"],
          readoutNote: "The whole funnel on 1 PB of raw crawl: input volume, output yield, knowledge-density score (0–100), and total cluster run time.",
          optionNotes: [
            "Stage 1 · Exact — drops ~15% of raw boilerplate and byte-identical files. Ultra-fast CPU.",
            "Stage 2 · Fuzzy LSH — drops ~20% of near-duplicate sites via MinHash + LSH. Fast hashing.",
            "Stage 3 · SemDeDup — drops ~10% of conceptual overlap via GPU embeddings. The costly polish.",
          ],
        },
      ],
      n1presets: ["Raw unfiltered crawl", "Conservative dedupe", "Aggressive dedupe"],
      n1strength: "DEDUP STRENGTH",
      n1minWords: "MIN WORD LENGTH",
      n2modes: ["Full document SHA-256", "Paragraph suffix array"],
      n2strip: "Strip cookie & privacy disclaimers",
      n3shingle: "SHINGLE LENGTH (N-GRAMS)",
      n3perms: "HASH PERMUTATIONS",
      n3docA: "DOC A · syndication #1",
      n3docB: "DOC B · syndication #2",
      n4bands: "BANDS (b)",
      n4rows: "ROWS PER BAND (r)",
      n4predict: "Predict: raise rows-per-band (r) from 4 to 8 — does the step move left or right?",
      n4axisX: "Jaccard similarity (s)",
      n4axisY: "P(candidate pair)",
      n4mathTitle: "Go deeper: the S-curve equation",
      n4mathBody: "A pair with Jaccard similarity `s` becomes a candidate when it collides in *at least one* band. Each band of `r` rows matches with probability `sʳ`, so across `b` bands the chance of no collision is `(1 − sʳ)ᵇ` — and the candidate probability is `P = 1 − (1 − sʳ)ᵇ`. The step sits near `(1/b)^(1/r)`: more **bands** slide it left (higher recall, more candidates), more **rows** steepen it (sharper cut-off, fewer false positives).",
      n5radius: "CLUSTER RADIUS",
      n5eps: "EPSILON (COSINE DISTANCE)",
      n6toggles: ["Stage 1 · Exact", "Stage 2 · Fuzzy", "Stage 3 · Semantic"],
      explainLabel: "EXPLAIN IT BACK",
      explainQ: "You could just compute MinHash between every pair of documents to find all the near-duplicates. Why do frontier pipelines add exact hashing and LSH around it instead?",
      explainA: "Because pairwise MinHash is still O(N²) — trillions of comparisons on a petabyte corpus, which is years of compute. Exact hashing is the cheap first pass: it removes byte-identical files in O(1) so the fuzzy stage sees far fewer documents. LSH is what makes the fuzzy stage itself sub-linear: instead of comparing every pair, it buckets documents that already collide and only checks bucket-mates, turning O(N²) into roughly O(N). And semantic dedup runs last, on GPUs, only on what survived — because embedding billions of pages is the most expensive step, so the cheap stages shield it. The funnel isn't three ways to do the same thing; it's cheap-and-broad first, expensive-and-precise last.",
      bridgeLabel: "NEXT: 0.5 · DATA RECIPE & SYNTHETIC EXPANSION",
      bridgeBody: "The stream is now stripped of exact, near, and semantic redundancy — a pristine, high-density corpus. Next, **data recipe & synthetic expansion**: domain mixtures get weighted, and frontier models rewrite the remaining text into high-density educational material.",
      prevLesson: "Back to 0.1b",
      nextLesson: "Continue to 0.5",
    };

export const dedupES: DedupLesson = {
      crumb: "ETAPA 0 · FASE 0.3 · DEDUPLICACIÓN MULTIETAPA",
      eyebrow: "ETAPA 0 · FASE 0.3 · 5 NODOS",
      title: "Deduplicación multietapa",
      lede: "La web abierta se repite sin parar — el mismo artículo en 50 sitios, la misma cabecera de licencia en un millón de repos. Dale esas repeticiones a un modelo y las memoriza palabra por palabra en vez de aprender. Este es el embudo de 3 etapas que quita la redundancia sin comparar cada par de documentos — paso a paso, con los balances que puedes explorar.",
      pipelineLabel: "LOS 5 PASOS",
      pipeline: ["Por qué duele repetir", "Dedup exacta", "Cuasi-duplicados", "Dedup semántica", "El embudo"],
      nodes: [
        {
          eyebrow: "NODO 01 / 05",
          title: "Por qué el texto repetido destruye capacidad",
          intro: "Si una frase aparece 100 veces en el entrenamiento, el modelo deja de *aprenderla* y empieza a *memorizarla* — dale las primeras palabras y recita el resto textual. La deduplicación es un dial de densidad de información.",
          bullets: [
            "**Las repeticiones sobreindexan los pesos.** La atención se fija en la secuencia exacta de tokens, así que el modelo regurgita en vez de razonar — un riesgo de privacidad y de copyright.",
            "**Quitar bytes duplicados compra diversidad.** En un presupuesto fijo de cómputo, cada repetición eliminada deja sitio para un dato, patrón de código o argumento *nuevo*.",
            "**El portón verde {ring} descarta las copias antes de los pesos.** Los documentos únicos pasan; las copias byte a byte se filtran de entrada.",
            "**Demasiado agresivo y recortas repetición *útil*** — modismos, identidades matemáticas, sintaxis básica. El dial tiene un punto óptimo.",
          ],
          cardLabel: "RIESGO DE MEMORIA · PORTÓN DEDUP",
          aria: "Un flujo de documentos hacia la matriz de pesos de un modelo, con un portón verde que descarta las copias duplicadas.",
          steps: 2,
          captions: [
            "Los documentos duplicados (rojo) entran en la matriz de pesos; las conexiones se endurecen en rutas rígidas memorizadas.",
            "El portón verde de dedup descarta las copias antes de que lleguen — los pesos se relajan en un grafo general equilibrado.",
          ],
          hint: "Sube FUERZA DEDUP — la memorización textual baja del objetivo de 0.1% y las horas de GPU caen, pero pasa de ~90 y empiezan a irse documentos únicos.",
          readoutTitle: "AUDITORÍA_MEMORIA",
          rows: ["DOCS QUEDAN", "TEXTUAL", "CÓMPUTO AHORR.", "ÚNICOS"],
          readoutNote: "La auditoría de tu corte: documentos que sobreviven, tasa de memorización textual (objetivo < 0.1%), horas de GPU ahorradas y cuánto texto único preservaste.",
          sliderNote: "La fuerza de dedup es cuánto podas las repeticiones. Súbela y la memorización cae y se libera cómputo — hasta que empieza a comerse documentos de verdad únicos. La longitud mínima de palabra evita que líneas únicas cortas se emparejen de más.",
        },
        {
          eyebrow: "NODO 02 / 05",
          title: "Etapa 1 — dedup exacta de líneas y documentos",
          intro: "La capa más barata caza texto idéntico byte a byte. Sin IA: si dos documentos tienen el mismo hash, uno es copia. Corren dos técnicas a distinto nivel.",
          bullets: [
            "**El hash de documento** descarta un archivo entero en O(1): calcula un SHA-256, míralo en una tabla o [filtro de Bloom](https://es.wikipedia.org/wiki/Filtro_de_Bloom), y sáltalo si ya está.",
            "**El recorte de tramos con suffix array** corta *párrafos compartidos* — banners de cookies, cabeceras de licencia, menús — de archivos por lo demás únicos, conservando el cuerpo real.",
            "**Esto corre en CPU baratas en tiempo sub-milisegundo** — la vía rápida que despeja el grueso antes de cualquier etapa cara.",
          ],
          cardLabel: "MOTOR DE DEDUP EXACTA",
          aria: "Un flujo de documentos que se divide en una vía de búsqueda por hash y una de recorte de tramos con suffix array.",
          steps: 2,
          captions: [
            "La vía A hashea el documento entero y lo busca en la tabla; una coincidencia descarta el archivo en menos de 1 ms.",
            "La vía B corre un suffix array sobre el texto y corta un tramo de 60 palabras de plantilla, conservando el cuerpo único.",
          ],
          hint: "Cambia al suffix array y quita los avisos — los archivos se conservan, pero se recortan miles de tramos de plantilla de su interior.",
          readoutTitle: "LECTURA_DEDUP_EXACTA",
          rows: ["ARCHIVOS FUERA", "TRAMOS CORT.", "RENDIM."],
          readoutNote: "Lo que hizo esta etapa a 10.000 páginas crudas: archivos enteros descartados, tramos de plantilla cortados y texto limpio retenido.",
          optionNotes: [
            "SHA-256 de documento completo — hashea el archivo entero y lo descarta si ya se vio. El más rápido, pero solo caza duplicados idénticos byte a byte.",
            "Suffix array de párrafos — indexa el texto y encuentra tramos compartidos dentro de archivos. Más lento, pero recorta la plantilla que el hash completo no ve.",
          ],
        },
        {
          eyebrow: "NODO 03 / 05",
          title: "Etapa 2 — cazar cuasi-duplicados",
          intro: "El hash exacto falla en la web real: el mismo artículo en 50 sitios tiene barras laterales y fechas distintas, así que cada SHA-256 difiere. MinHash estima cuán *parecidos* son dos documentos — aquí corre un estimador real sobre dos muestras.",
          bullets: [
            "**El shingling** parte cada documento en conjuntos solapados de N palabras, capturando el orden y la redacción, no solo la bolsa de palabras.",
            "**Una firma MinHash** aplica muchas funciones hash y guarda el mínimo de cada una — comprimiendo un documento entero a ~128 enteros.",
            "**Las celdas que coinciden estiman la [similitud de Jaccard](https://es.wikipedia.org/wiki/%C3%8Dndice_Jaccard).** Las dos muestras comparten el cuerpo pero difieren en el marco — la estimación debería caer cerca del valor real.",
          ],
          cardLabel: "SHINGLE → FIRMA · MINHASH REAL",
          aria: "Dos artículos casi duplicados divididos en shingles y hasheados en vectores de firma, con las celdas coincidentes resaltadas.",
          steps: 2,
          captions: [
            "Ambas sindicaciones se cortan en shingles solapados de N palabras — los del cuerpo se comparten, los de la barra lateral no.",
            "Cada conjunto de shingles se convierte en una firma MinHash; las celdas verdes son posiciones donde las dos firmas coinciden.",
          ],
          hint: "Sube las permutaciones — la Jaccard estimada se ajusta hacia el valor real, a costa de una firma más grande.",
          readoutTitle: "MÉTRICAS_MINHASH",
          rows: ["J REAL", "J EST", "FIRMA", "CUASI-DUPS"],
          readoutNote: "La salida del estimador real para las dos muestras: Jaccard exacta, estimación MinHash, tamaño de firma en bytes y los cuasi-duplicados que esta configuración marcaría en todo el corpus.",
          sliderNote: "Shingles más largos captan coincidencias más cercanas; más permutaciones ajustan la estimación — a costa de una firma mayor. Mira cómo J EST sigue a J REAL.",
          optionNotes: [],
        },
        {
          eyebrow: "NODO 04 / 05",
          title: "Etapa 3 — cazar copias reescritas",
          intro: "El hash y MinHash solo ven palabras de superficie. Se pierden la redundancia *semántica*: diez resúmenes del mismo evento, redactados distinto. SemDeDup corre sobre embeddings — pero solo tras el escudo de las etapas baratas.",
          bullets: [
            "**Exacta + difusa son escudos de cómputo.** Quitan el 35–40% del flujo en CPU baratas *antes* de generar un solo embedding caro de GPU.",
            "**Embebe y luego agrupa con K-means** a los supervivientes en vecindarios semánticos — toda la cobertura de un evento cae junta.",
            "**Poda dentro de un grupo por distancia.** Los puntos amontonados uno sobre otro no aportan señal nueva; los únicos de cola larga entre grupos siempre se conservan.",
          ],
          cardLabel: "MAPA DE GRUPOS DE EMBEDDINGS",
          aria: "Un mapa 2D de vectores de embedding en grupos, con los puntos redundantes cerca del centroide podados.",
          steps: 2,
          captions: [
            "Los embeddings caen en grupos densos de concepto — más una dispersión de puntos únicos de cola larga entre ellos.",
            "Dentro de cada grupo, los puntos casi idénticos se podan; los puntos de frontera distintos y cada único de cola larga sobreviven.",
          ],
          hint: "Sube EPSILON para podar más agresivo dentro de los grupos — mira caer la redundancia mientras la diversidad de concepto se mantiene en ~100%.",
          readoutTitle: "MÉTRICAS_DEDUP_SEMÁNTICA",
          rows: ["AGRUPADOS", "REDUNDANCIA", "DIVERSIDAD", "ESTADO"],
          readoutNote: "La poda sobre el campo de embeddings: vectores agrupados (tras el escudo de CPU), redundancia semántica quitada, diversidad de concepto retenida y si se perdió algún concepto único.",
          sliderNote: "Epsilon es el radio de poda alrededor del centro de cada grupo; el radio lo escala. Más grande quita más redundancia cerca del centro — el borde de perspectivas distintas se queda.",
          optionNotes: [],
        },
        {
          eyebrow: "NODO 05 / 05",
          title: "El embudo — rendimiento vs. diversidad",
          intro: "La dedup es un equilibrio: quita muy poco y el modelo memoriza; quita demasiado y pierdes repetición útil. Un embudo por etapas sube la densidad conservando volumen suficiente.",
          bullets: [
            "**Cada etapa quita su porción a su propio costo** — exacta (CPU rápida), LSH difusa (hash rápido), semántica (vectores de GPU).",
            "**El orden importa:** las etapas baratas primero, para que la pasada cara de GPU solo vea lo que sobrevivió.",
            "**Apunta a densidad, no a máxima remoción** — un corpus prístino de alta densidad de razonamiento que aún retiene al menos la mitad de sus tokens.",
          ],
          cardLabel: "EMBUDO DEDUP DE 3 ETAPAS",
          aria: "Un embudo de tres niveles que encoge el volumen del conjunto mientras sube un indicador de densidad de conocimiento.",
          steps: 1,
          captions: ["El conjunto crudo se encoge etapa a etapa mientras su indicador de densidad de conocimiento sube hacia el verde."],
          hint: "Alterna las tres etapas — cada una quita su porción; las tres juntas alcanzan alta densidad reteniendo aún más de la mitad del volumen.",
          readoutTitle: "RESUMEN_FINAL_PIPELINE",
          rows: ["ENTRADA", "SALIDA", "DENSIDAD", "TIEMPO"],
          readoutNote: "El embudo completo sobre 1 PB de crawl crudo: volumen de entrada, rendimiento de salida, puntaje de densidad de conocimiento (0–100) y tiempo total de cómputo.",
          optionNotes: [
            "Etapa 1 · Exacta — quita ~15% de plantilla cruda y archivos idénticos byte a byte. CPU ultrarrápida.",
            "Etapa 2 · LSH difusa — quita ~20% de sitios casi duplicados vía MinHash + LSH. Hashing rápido.",
            "Etapa 3 · SemDeDup — quita ~10% de solape conceptual vía embeddings de GPU. El pulido costoso.",
          ],
        },
      ],
      n1presets: ["Crawl crudo sin filtrar", "Dedup conservadora", "Dedup agresiva"],
      n1strength: "FUERZA DEDUP",
      n1minWords: "LONGITUD MÍN. PALABRA",
      n2modes: ["SHA-256 de documento", "Suffix array de párrafo"],
      n2strip: "Quitar avisos de cookies y privacidad",
      n3shingle: "LONGITUD SHINGLE (N-GRAMAS)",
      n3perms: "PERMUTACIONES HASH",
      n3docA: "DOC A · sindicación #1",
      n3docB: "DOC B · sindicación #2",
      n4bands: "BANDAS (b)",
      n4rows: "FILAS POR BANDA (r)",
      n4predict: "Predice: sube las filas por banda (r) de 4 a 8 — ¿el escalón se mueve a la izquierda o a la derecha?",
      n4axisX: "Similitud de Jaccard (s)",
      n4axisY: "P(par candidato)",
      n4mathTitle: "Ir más a fondo: la ecuación de la curva-S",
      n4mathBody: "Un par con similitud de Jaccard `s` se vuelve candidato cuando colisiona en *al menos una* banda. Cada banda de `r` filas coincide con probabilidad `sʳ`, así que en `b` bandas la probabilidad de no colisionar es `(1 − sʳ)ᵇ` — y la probabilidad de ser candidato es `P = 1 − (1 − sʳ)ᵇ`. El escalón cae cerca de `(1/b)^(1/r)`: más **bandas** lo deslizan a la izquierda (más recall, más candidatos), más **filas** lo empinan (corte más nítido, menos falsos positivos).",
      n5radius: "RADIO DE GRUPO",
      n5eps: "EPSILON (DISTANCIA COSENO)",
      n6toggles: ["Etapa 1 · Exacta", "Etapa 2 · Difusa", "Etapa 3 · Semántica"],
      explainLabel: "EXPLÍCALO CON TUS PALABRAS",
      explainQ: "Podrías simplemente calcular MinHash entre cada par de documentos para hallar todos los cuasi-duplicados. ¿Por qué los pipelines punteros añaden hashing exacto y LSH alrededor?",
      explainA: "Porque MinHash por pares sigue siendo O(N²) — billones de comparaciones en un corpus de un petabyte, que son años de cómputo. El hashing exacto es la primera pasada barata: quita los archivos idénticos byte a byte en O(1) para que la etapa difusa vea muchos menos documentos. LSH es lo que hace sub-lineal a la propia etapa difusa: en vez de comparar cada par, agrupa en cubetas los documentos que ya colisionan y solo comprueba compañeros de cubeta, convirtiendo O(N²) en casi O(N). Y la dedup semántica corre al final, en GPU, solo sobre lo que sobrevivió — porque embeber miles de millones de páginas es el paso más caro, así que las etapas baratas lo escudan. El embudo no son tres formas de hacer lo mismo; es barato-y-amplio primero, caro-y-preciso al final.",
      bridgeLabel: "SIGUIENTE: 0.5 · RECETA DE DATOS Y EXPANSIÓN SINTÉTICA",
      bridgeBody: "El flujo ya está libre de redundancia exacta, cercana y semántica — un corpus prístino de alta densidad. Sigue la **receta de datos y expansión sintética**: se ponderan las mezclas por dominio y modelos punteros reescriben el texto restante en material educativo de alta densidad.",
      prevLesson: "Volver a 0.1b",
      nextLesson: "Continuar a 0.5",
    };
