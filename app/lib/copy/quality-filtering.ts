/**
 * Stage 0 · Phase 0.3 — Quality filtering. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 * All user-facing text for the lesson lives in this module.
 */
import type { WsNodeCopy } from "./shared";

export interface QualityFilteringLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — the extracted page
  n1archetypes: string[]; //   3 page-type buttons
  n1kindLabels: string[]; //   5, aligned to BLOCK_KINDS
  n1proseTag: string; //       "worth training on"
  // node 2 — the rules
  n2rules: string[]; //        4 toggle labels, aligned to RULES
  n2docs: { label: string; sample: string }[]; // 6, aligned to DOCS
  n2kept: string;
  n2dropped: string;
  n2caughtBy: string;
  // node 3 — the funnel
  n3slider: string;
  n3stageLabels: string[]; //  5 short band labels
  n3dropLabels: string[]; //   4 dropped-category labels
  n3keptLabel: string;
  n3rawWord: string;
  n3unit: string;
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const qualityFilteringEN: QualityFilteringLesson = {
  crumb: "STAGE 0 · PHASE 0.3 · QUALITY FILTERING",
  eyebrow: "STAGE 0 · PHASE 0.3 · 3 NODES",
  title: "Throwing out the junk",
  lede: "Most of the crawled web is junk — nav bars, ads, boilerplate, spam, gibberish. Before any of it reaches training, a handful of cheap rules read each document and throw most of it away. Play with the rules and watch the pile shrink.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Why filter", "The rules", "The funnel"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Most of a page isn't worth learning from",
      intro:
        "Even after you strip a page down to text, most of what's left is nav labels, ad copy and boilerplate. The prose a model should learn from is a thin slice — and how thin depends on the page.",
      bullets: [
        "**The {ring} green block is prose** — real sentences worth training on. Everything else is filler.",
        "**A news article is mostly readable;** a forum thread is noisier; an SEO landing page is almost all keyword spam.",
        "**Keep the filler and you teach the model to write filler** — menus, ads, 'accept cookies'.",
      ],
      cardLabel: "ONE EXTRACTED PAGE · SIZED BY TEXT",
      aria: "A stacked document showing how much of a page is prose versus nav, ads and boilerplate.",
      steps: 1,
      captions: ["Pick a page type — the green slice is the prose actually worth keeping."],
      hint: "Switch the page type — the SEO landing page is almost all junk, with one real sentence.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "News article — a real story wrapped in menus, an ad and a cookie banner. Most of the text is usable.",
        "Forum thread — a helpful answer buried in quotes, signatures and off-topic replies.",
        "SEO landing page — written for search engines, not people. One real sentence in a wall of keywords.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Four cheap rules do most of the work",
      intro:
        "You can't have a human read trillions of documents. Instead a handful of dumb, fast rules score each one — no model needed — and drop anything that looks like junk.",
      bullets: [
        "**Symbol-to-word ratio** — lots of `|`, `>`, `$` and few words? Probably a menu or code dump.",
        "**Repeated phrases** — the same line over and over is spam or boilerplate.",
        "**Average word length** — random hashes and gibberish have freakishly long 'words'; real prose sits near 5 letters.",
        "**Stop-word density** — real sentences are full of *the*, *and*, *of*. Keyword spam has almost none.",
      ],
      cardLabel: "DOCUMENT FILTER · KEPT vs DROPPED",
      aria: "A grid of six sample documents, each marked kept or dropped with the rule that caught it.",
      steps: 1,
      captions: ["Every rule is on. Each document is kept (green) or dropped (red) with the rule that caught it."],
      hint: "Turn a rule off — the document(s) that rule was holding back slip back into the corpus. The tag list needs stop-word density.",
      readoutTitle: "FILTER_TALLY",
      rows: ["KEPT", "DROPPED"],
      readoutNote: "How many of the 6 sample documents survive the rules you have switched on.",
      sliderNote:
        "All four rules are on by default, so 5 of the 6 samples drop. Switch one off to see exactly what that rule was holding back.",
      optionNotes: [
        "Symbol-to-word ratio — flags text that's mostly punctuation and symbols: nav bars, menus, ASCII art, raw code.",
        "Repeated phrases — flags a document where one phrase repeats far too often: SEO spam and footer boilerplate.",
        "Average word length — flags text whose words are far too long on average: hashes, base64, random gibberish.",
        "Stop-word density — flags text with almost no *the/and/of*: keyword lists and tag soup that isn't real prose.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The pile shrinks fast",
      intro:
        "Stack the filters and the corpus collapses. Most of what gets crawled never makes it into training — and the stricter you filter, the smaller and cleaner the pile.",
      bullets: [
        "**Each filter drops a chunk** — language, symbols, repetition, gibberish — one after another.",
        "**Strict filtering keeps less but cleaner text.** Lenient keeps more, junk and all.",
        "**Real pipelines keep only a small fraction** of the raw crawl. These numbers are illustrative, but the shape is real.",
      ],
      cardLabel: "QUALITY FUNNEL · RAW → KEPT",
      aria: "A funnel narrowing from the raw crawl down to the kept fraction as filters apply.",
      steps: 1,
      captions: ["Drag strictness — the funnel narrows as each filter drops more."],
      hint: "Drag strictness from lenient to strict — watch the kept slice shrink.",
      readoutTitle: "",
      rows: [],
      sliderNote:
        "Strictness raises every threshold at once. Higher = a smaller, cleaner corpus; lower = more text but more junk.",
    },
  ],
  n1archetypes: ["News article", "Forum thread", "SEO landing page"],
  n1kindLabels: ["prose", "nav & menus", "ads", "boilerplate", "keyword spam"],
  n1proseTag: "worth training on",
  n2rules: ["Symbol ratio", "Repeated phrases", "Avg word length", "Stop-word density"],
  n2docs: [
    { label: "News paragraph", sample: "The council voted on Tuesday to…" },
    { label: "Nav menu", sample: "Home | About | Login | Cart |…" },
    { label: "SEO spam", sample: "cheap flights cheap flights buy…" },
    { label: "Gibberish", sample: "x7f2a9 qppwlk zzn8b4 k93lm…" },
    { label: "Tag list", sample: "shoes sneakers footwear gym…" },
    { label: "Symbol soup", sample: ">>> $$$ !!! ### @@@ >>>…" },
  ],
  n2kept: "KEPT",
  n2dropped: "DROPPED",
  n2caughtBy: "caught by",
  n3slider: "FILTER STRICTNESS",
  n3stageLabels: ["Raw crawl", "Language", "Symbols", "Repetition", "Kept"],
  n3dropLabels: ["non-text & other languages", "symbols & formatting", "repeated & spam", "gibberish & low-quality"],
  n3keptLabel: "kept",
  n3rawWord: "raw tokens",
  n3unit: "T",
  explainLabel: "EXPLAIN IT BACK",
  explainQ:
    "These are dumb rules — no AI, just counting symbols and stop-words. Why not use a smart model to judge quality instead?",
  explainA:
    "Because you're filtering *trillions* of documents, and a model that reads each one would cost more than the training it's feeding. Cheap heuristics run for almost nothing and catch the obvious junk — menus, spam, gibberish — which is most of it. Smarter model-based quality scoring exists too, but it runs *after* these rules have already thrown out the easy 90%. Filter cheap first, filter smart later.",
  bridgeLabel: "NEXT: THE TOKEN DICTIONARY",
  bridgeBody:
    "The pile is smaller and cleaner — but a model still can't read letters. Next, **the token dictionary**: how clean text becomes the fixed vocabulary of tokens a model actually trains on.",
  prevLesson: "Web-scale ingestion",
  nextLesson: "The token dictionary",
};

export const qualityFilteringES: QualityFilteringLesson = {
  crumb: "ETAPA 0 · FASE 0.3 · FILTRADO DE CALIDAD",
  eyebrow: "ETAPA 0 · FASE 0.3 · 3 NODOS",
  title: "Tirar la basura",
  lede: "Casi toda la web rastreada es basura — barras de navegación, anuncios, plantillas, spam, galimatías. Antes de que nada llegue al entrenamiento, un puñado de reglas baratas lee cada documento y tira la mayor parte. Juega con las reglas y mira encogerse el montón.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Por qué filtrar", "Las reglas", "El embudo"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Casi nada de una página vale la pena aprender",
      intro:
        "Incluso tras reducir una página a texto, casi todo lo que queda son etiquetas de menú, texto de anuncios y plantilla. La prosa de la que un modelo debería aprender es una rebanada delgada — y qué tan delgada depende de la página.",
      bullets: [
        "**El bloque verde {ring} es prosa** — frases reales que vale la pena entrenar. Todo lo demás es relleno.",
        "**Un artículo de noticias es casi legible;** un hilo de foro es más ruidoso; una landing de SEO es casi todo spam de keywords.",
        "**Conserva el relleno y le enseñas al modelo a escribir relleno** — menús, anuncios, 'aceptar cookies'.",
      ],
      cardLabel: "UNA PÁGINA EXTRAÍDA · DIMENSIONADA POR TEXTO",
      aria: "Un documento apilado que muestra cuánto de una página es prosa frente a nav, anuncios y plantilla.",
      steps: 1,
      captions: ["Elige un tipo de página — la rebanada verde es la prosa que de verdad vale la pena conservar."],
      hint: "Cambia el tipo de página — la landing de SEO es casi toda basura, con una sola frase real.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Artículo de noticias — una historia real envuelta en menús, un anuncio y un aviso de cookies. Casi todo el texto es usable.",
        "Hilo de foro — una respuesta útil sepultada entre citas, firmas y respuestas fuera de tema.",
        "Landing de SEO — escrita para buscadores, no para personas. Una frase real en un muro de keywords.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Cuatro reglas baratas hacen casi todo el trabajo",
      intro:
        "No puedes poner a un humano a leer billones de documentos. En su lugar, un puñado de reglas tontas y rápidas puntúan cada uno — sin modelo — y descartan lo que parece basura.",
      bullets: [
        "**Proporción símbolo-palabra** — ¿muchos `|`, `>`, `$` y pocas palabras? Probablemente un menú o un volcado de código.",
        "**Frases repetidas** — la misma línea una y otra vez es spam o plantilla.",
        "**Longitud media de palabra** — los hashes y el galimatías tienen 'palabras' larguísimas; la prosa real ronda las 5 letras.",
        "**Densidad de palabras vacías** — las frases reales están llenas de *el*, *y*, *de*. El spam de keywords casi no tiene.",
      ],
      cardLabel: "FILTRO DE DOCUMENTOS · CONSERVADO vs DESCARTADO",
      aria: "Una cuadrícula de seis documentos de muestra, cada uno marcado como conservado o descartado con la regla que lo atrapó.",
      steps: 1,
      captions: ["Todas las reglas están activas. Cada documento se conserva (verde) o se descarta (rojo) con la regla que lo atrapó."],
      hint: "Apaga una regla — el/los documento(s) que esa regla contenía se cuelan de vuelta al corpus. La lista de etiquetas necesita la densidad de palabras vacías.",
      readoutTitle: "FILTER_TALLY",
      rows: ["CONSERVADOS", "DESCARTADOS"],
      readoutNote: "Cuántos de los 6 documentos de muestra sobreviven a las reglas que tienes activadas.",
      sliderNote:
        "Las cuatro reglas están activas por defecto, así que caen 5 de las 6 muestras. Apaga una para ver exactamente qué estaba conteniendo esa regla.",
      optionNotes: [
        "Proporción símbolo-palabra — marca texto que es sobre todo puntuación y símbolos: barras de nav, menús, arte ASCII, código crudo.",
        "Frases repetidas — marca un documento donde una frase se repite demasiado: spam de SEO y plantilla de pie de página.",
        "Longitud media de palabra — marca texto cuyas palabras son demasiado largas de media: hashes, base64, galimatías aleatorio.",
        "Densidad de palabras vacías — marca texto casi sin *el/y/de*: listas de keywords y sopa de etiquetas que no es prosa real.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "El montón se encoge rápido",
      intro:
        "Apila los filtros y el corpus se desploma. Casi nada de lo que se rastrea llega al entrenamiento — y cuanto más estricto filtras, más pequeño y limpio queda el montón.",
      bullets: [
        "**Cada filtro tira un trozo** — idioma, símbolos, repetición, galimatías — uno tras otro.",
        "**Filtrar estricto conserva menos pero texto más limpio.** Ser laxo conserva más, con basura y todo.",
        "**Los pipelines reales conservan solo una fracción pequeña** del rastreo crudo. Estos números son ilustrativos, pero la forma es real.",
      ],
      cardLabel: "EMBUDO DE CALIDAD · CRUDO → CONSERVADO",
      aria: "Un embudo que se estrecha desde el rastreo crudo hasta la fracción conservada a medida que se aplican los filtros.",
      steps: 1,
      captions: ["Arrastra la exigencia — el embudo se estrecha a medida que cada filtro tira más."],
      hint: "Arrastra la exigencia de laxo a estricto — mira encogerse la rebanada conservada.",
      readoutTitle: "",
      rows: [],
      sliderNote:
        "La exigencia sube todos los umbrales a la vez. Más alto = un corpus más pequeño y limpio; más bajo = más texto pero más basura.",
    },
  ],
  n1archetypes: ["Artículo de noticias", "Hilo de foro", "Landing de SEO"],
  n1kindLabels: ["prosa", "nav y menús", "anuncios", "plantilla", "spam de keywords"],
  n1proseTag: "vale la pena entrenar",
  n2rules: ["Prop. símbolos", "Frases repetidas", "Long. de palabra", "Palabras vacías"],
  n2docs: [
    { label: "Párrafo de noticia", sample: "El concejo votó el martes por…" },
    { label: "Menú de nav", sample: "Inicio | Nosotros | Entrar |…" },
    { label: "Spam de SEO", sample: "vuelos baratos vuelos baratos…" },
    { label: "Galimatías", sample: "x7f2a9 qppwlk zzn8b4 k93lm…" },
    { label: "Lista de tags", sample: "zapatos tenis calzado gym…" },
    { label: "Sopa de símbolos", sample: ">>> $$$ !!! ### @@@ >>>…" },
  ],
  n2kept: "OK",
  n2dropped: "FUERA",
  n2caughtBy: "por",
  n3slider: "EXIGENCIA DEL FILTRO",
  n3stageLabels: ["Rastreo", "Idioma", "Símbolos", "Repetición", "Conservado"],
  n3dropLabels: ["no-texto y otros idiomas", "símbolos y formato", "repetido y spam", "galimatías y baja calidad"],
  n3keptLabel: "conservado",
  n3rawWord: "tokens crudos",
  n3unit: "T",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ:
    "Estas son reglas tontas — nada de IA, solo contar símbolos y palabras vacías. ¿Por qué no usar un modelo listo para juzgar la calidad?",
  explainA:
    "Porque estás filtrando *billones* de documentos, y un modelo que lea cada uno costaría más que el entrenamiento que alimenta. Las heurísticas baratas corren por casi nada y atrapan la basura obvia — menús, spam, galimatías — que es la mayoría. También existe la puntuación de calidad basada en modelos, pero corre *después* de que estas reglas ya tiraron el 90% fácil. Filtra barato primero, filtra listo después.",
  bridgeLabel: "SIGUIENTE: EL DICCIONARIO DE TOKENS",
  bridgeBody:
    "El montón es más pequeño y limpio — pero un modelo aún no sabe leer letras. Sigue **el diccionario de tokens**: cómo el texto limpio se convierte en el vocabulario fijo de tokens con el que un modelo de verdad entrena.",
  prevLesson: "Ingesta a escala web",
  nextLesson: "El diccionario de tokens",
};
