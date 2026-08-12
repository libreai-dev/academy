/**
 * Stage 0 · Phase 0.2 — Extraction & parsing. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 * All user-facing text for the lesson lives in this module.
 */
import type { WsNodeCopy } from "./shared";

/** One language-ID sample: a button label + the snippet the classifier reads. */
export interface LangSampleCopy {
  key: string;
  label: string;
  text: string;
}

export interface ExtractionParsingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — strip a page to the article
  n1toggle: string;
  n1on: string;
  n1off: string;
  n1blockLabels: string[]; // 10, aligned to PAGE_BLOCKS
  n1summaryOff: string;
  n1summaryOn: string;
  // node 2 — hard formats
  n2formats: string[]; //     4 buttons, aligned to FORMAT_KEYS
  n2rawLabel: string;
  n2mdLabel: string;
  n2techniques: string[]; //  4, aligned to FORMAT_KEYS
  n2output: string[][]; //    4 arrays of markdown lines
  n2deeperTitle: string;
  n2deeperBody: string;
  // node 3 — language ID
  n3samples: LangSampleCopy[]; // 4, aligned to LANG_SAMPLE_KEYS
  n3confLabel: string;
  n3taggedPrefix: string;
  n3uncertain: string;
  n3langNames: Record<string, string>;
  calloutFastLabel: string;
  calloutFastTitle: string;
  calloutFastBody: string;
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const extractionParsingEN: ExtractionParsingLesson = {
  crumb: "STAGE 0 · 0.2 · EXTRACTION & PARSING",
  eyebrow: "STAGE 0 · 0.2 · 3 NODES",
  title: "Pulling the text out",
  lede:
    "A crawled page is mostly wrapping — nav, ads, scripts, footers. Extraction pulls the clean article text out of that wrapping, turns PDFs and scans into markdown, and tags the language — all before a single token is made.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["What gets stripped", "Hard formats", "Language ID"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Stripping a page down to the article",
      intro:
        "You've seen the pile of pages get filtered. Now zoom into one page: even a good one is mostly boilerplate — nav, ads, headers, footers — wrapped around a thin slice of article.",
      bullets: [
        "**The {ring} green blocks are the article** — the headline and body text. That's all a model should learn from.",
        "**Everything else is boilerplate** — top nav, cookie banner, ads, related links, footer. It repeats on every page of the site.",
        "**Keep the boilerplate and the model learns to write it** — menus and 'accept cookies' instead of prose.",
      ],
      cardLabel: "ONE PAGE · BLOCK BY BLOCK",
      aria: "A web page drawn as a stack of blocks; extraction keeps the article body and strips the boilerplate.",
      steps: 1,
      captions: ["The raw page: the article body buried in nav, ads and boilerplate. Turn extraction on to pull it out."],
      hint: "Turn extraction on — the nav, ads and footer drop away and only the article is left.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "This is the whole page as crawled — the article is only a few of these blocks. Turn extraction on.",
        "Extraction kept the headline and body, and dropped every boilerplate block — nav, cookie banner, ads, related links, footer.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "When the page isn't clean HTML",
      intro:
        "Not every source is tidy HTML. PDFs, scans and images carry great text — but you can't just read it off. Layout detection and OCR recover it as clean markdown.",
      bullets: [
        "**Most pages are HTML** — a parser strips the tags, nav and ads and keeps the body. (That was the step just before.)",
        "**PDFs and scans are harder.** A two-column PDF scrambles if you read straight across; a scanned page has no text at all, just pixels.",
        "**The fix is layout + OCR** — find the columns and tables, read images into characters, and emit clean **markdown** with headings, tables and math preserved.",
      ],
      cardLabel: "THE FILE → MARKDOWN",
      aria: "A hard file format on top and the clean markdown the parser recovers from it below.",
      steps: 1,
      captions: ["Pick a format — the messy file on top becomes the clean markdown below."],
      hint: "Cycle the formats — a two-column PDF and a scan need real work; clean HTML barely any.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Clean HTML is the easy case — strip the tags and the article text is right there.",
        "A two-column PDF hides the reading order — read straight across and the sentences scramble. The parser detects the columns first.",
        "A scanned page is just an image — no text at all. OCR reads the pixels into characters before anything else can happen.",
        "Tables and equations carry meaning in their layout. The parser rebuilds them as markdown tables and math so the structure survives.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Which language is this?",
      intro:
        "Before anything gets mixed together, a fast classifier reads each document and tags its language — so the corpus can be balanced across languages on purpose, not left to whatever the web happened to have.",
      bullets: [
        "**A tiny classifier scores the text** across languages and picks the top one — in well under a millisecond per document.",
        "**Short or mixed text is hard.** A few words, or two languages at once, leave the scores split and low.",
        "**Tags let labs split the stream by language** and mix each one back in a chosen share.",
      ],
      cardLabel: "LANGUAGE CONFIDENCE",
      aria: "A set of confidence bars, one per candidate language, with the top-scoring language marked as the tag.",
      steps: 1,
      captions: ["The classifier scores the sample across languages; the top score wins — if it clears the bar."],
      hint: "Pick a sample — the mixed snippet keeps every score low and gets held back.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Clean English — the classifier is 98% sure. An easy, confident tag.",
        "Clean Spanish — 99% confident. Portuguese and Galician trail far behind.",
        "Chinese — high confidence from the characters alone, even in a short line.",
        "English and Spanish mixed in one snippet — the scores split, nothing clears the bar, so it's held back.",
      ],
    },
  ],
  n1toggle: "Extraction",
  n1on: "ON",
  n1off: "OFF",
  n1blockLabels: [
    "Top navigation",
    "Cookie banner",
    "Site header & logo",
    "Headline",
    "Byline · date",
    "Article paragraph",
    "Inline ad",
    "Article paragraph",
    "Related articles",
    "Footer links",
  ],
  n1summaryOff: "Raw page — 10 blocks, mostly boilerplate.",
  n1summaryOn: "Kept the article — 4 blocks · 6 stripped.",
  n2formats: ["Clean HTML", "Two-column PDF", "Scanned page", "Table & math"],
  n2rawLabel: "THE FILE",
  n2mdLabel: "MARKDOWN OUT",
  n2techniques: ["Strip tags & boilerplate", "Detect columns, fix order", "OCR — pixels to text", "Rebuild table + math"],
  n2output: [
    ["# Q3 earnings report", "Revenue grew 14% YoY,", "margins flat at 38%."],
    ["# Climate model results", "The 2020 baseline run", "shows +1.2°C by 2050."],
    ["# Field notes, 1974", "Sample B held steady", "across all three trials."],
    ["| Region | Sales |", "| ------ | ----- |", "| APAC   | 4.2M  |", "$E = mc^2$ · restored"],
  ],
  n2deeperTitle: "How a scan becomes markdown",
  n2deeperBody:
    "OCR (optical character recognition) reads the pixels of an image into characters. Layout models then find the columns, tables and headings so the reading order is right. Newer vision models skip the pipeline entirely: they read the whole page image and emit markdown directly — headings, tables and equations included.",
  n3samples: [
    { key: "en", label: "English", text: "The council met on Tuesday." },
    { key: "es", label: "Español", text: "El concejo se reunió el martes." },
    { key: "zh", label: "中文", text: "理事会周二开会。" },
    { key: "mixed", label: "Mixed", text: "Hello, ¿cómo estás? Let's go." },
  ],
  n3confLabel: "LANGUAGE CONFIDENCE",
  n3taggedPrefix: "tagged:",
  n3uncertain: "uncertain — held back",
  n3langNames: {
    en: "English",
    es: "Spanish",
    zh: "Chinese",
    de: "German",
    nl: "Dutch",
    fr: "French",
    pt: "Portuguese",
    gl: "Galician",
    it: "Italian",
    ja: "Japanese",
    ko: "Korean",
    un: "Other",
  },
  calloutFastLabel: "GOOD TO KNOW · LANGUAGE ID",
  calloutFastTitle: "Fast enough to run on everything",
  calloutFastBody:
    "A language classifier like fastText tags a document in under a millisecond — so it can run on every one of trillions of pages. The tags then let a lab split the stream by language and mix each one back in the proportions it wants, instead of whatever the crawl happened to contain.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ:
    "Filtering already dropped the junk pages. Why still run extraction on the pages you keep — why not just train on the raw HTML?",
  explainA:
    "Because even a good page is mostly boilerplate — nav bars, ads, cookie banners and footers wrapped around a thin slice of article. Train on the raw HTML and the model learns to emit that wrapping instead of prose. Extraction isolates the main text, converts hard formats — two-column PDFs, scanned images, tables and math — into clean **markdown**, and tags each document's language so the corpus can be balanced on purpose. Clean text in, clean text out.",
  bridgeLabel: "NEXT: CLASSIFIER SCORING",
  bridgeBody:
    "The text is clean, structured and tagged by language — but *clean* isn't the same as *good*. Next, **a model that grades the web**: a small classifier scores every page from 0 to 1 and keeps only the high scorers.",
  prevLesson: "Throwing out the junk",
  nextLesson: "A model that grades the web",
};

export const extractionParsingES: ExtractionParsingLesson = {
  crumb: "ETAPA 0 · 0.2 · EXTRACCIÓN Y PARSEO",
  eyebrow: "ETAPA 0 · 0.2 · 3 NODOS",
  title: "Sacar el texto",
  lede:
    "Una página rastreada es casi toda envoltura — navegación, anuncios, scripts, pies de página. La extracción saca de esa envoltura el texto limpio del artículo, convierte PDFs y escaneos en markdown, y etiqueta el idioma — todo antes de crear un solo token.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Qué se descarta", "Formatos difíciles", "Identificar idioma"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Reducir una página al artículo",
      intro:
        "Ya viste filtrarse el montón de páginas. Ahora acércate a una: incluso una buena es casi toda plantilla — navegación, anuncios, cabeceras, pies — envolviendo una rebanada delgada de artículo.",
      bullets: [
        "**Los bloques verdes {ring} son el artículo** — el titular y el cuerpo. Eso es todo lo que un modelo debería aprender.",
        "**Todo lo demás es plantilla** — nav superior, aviso de cookies, anuncios, enlaces relacionados, pie. Se repite en cada página del sitio.",
        "**Conserva la plantilla y el modelo aprende a escribirla** — menús y 'aceptar cookies' en vez de prosa.",
      ],
      cardLabel: "UNA PÁGINA · BLOQUE A BLOQUE",
      aria: "Una página web dibujada como una pila de bloques; la extracción conserva el cuerpo del artículo y quita la plantilla.",
      steps: 1,
      captions: ["La página cruda: el cuerpo del artículo sepultado en nav, anuncios y plantilla. Activa la extracción para sacarlo."],
      hint: "Activa la extracción — la navegación, los anuncios y el pie se caen y solo queda el artículo.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Esta es la página entera como se rastreó — el artículo es solo unos pocos de estos bloques. Activa la extracción.",
        "La extracción conservó el titular y el cuerpo, y descartó cada bloque de plantilla — nav, aviso de cookies, anuncios, enlaces relacionados, pie.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Cuando la página no es HTML limpio",
      intro:
        "No toda fuente es HTML ordenado. Los PDFs, escaneos e imágenes traen buen texto — pero no puedes simplemente leerlo. La detección de estructura y el OCR lo recuperan como markdown limpio.",
      bullets: [
        "**Casi todas las páginas son HTML** — un parser quita etiquetas, nav y anuncios y conserva el cuerpo. (Ese fue el paso anterior.)",
        "**Los PDFs y escaneos son más difíciles.** Un PDF a dos columnas se revuelve si lees en recto; una página escaneada no tiene texto, solo píxeles.",
        "**La solución es estructura + OCR** — hallar columnas y tablas, leer imágenes a caracteres, y emitir **markdown** limpio con títulos, tablas y matemáticas intactos.",
      ],
      cardLabel: "EL ARCHIVO → MARKDOWN",
      aria: "Un formato de archivo difícil arriba y el markdown limpio que el parser recupera de él abajo.",
      steps: 1,
      captions: ["Elige un formato — el archivo desordenado de arriba se vuelve el markdown limpio de abajo."],
      hint: "Recorre los formatos — un PDF a dos columnas y un escaneo dan trabajo real; el HTML limpio casi nada.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "El HTML limpio es el caso fácil — quita las etiquetas y el texto del artículo está ahí mismo.",
        "Un PDF a dos columnas esconde el orden de lectura — si lees en recto, las frases se revuelven. El parser detecta las columnas primero.",
        "Una página escaneada es solo una imagen — sin texto. El OCR lee los píxeles a caracteres antes de que pase nada más.",
        "Las tablas y ecuaciones llevan el significado en su disposición. El parser las reconstruye como tablas y matemáticas de markdown para que la estructura sobreviva.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "¿En qué idioma está esto?",
      intro:
        "Antes de mezclar nada, un clasificador rápido lee cada documento y etiqueta su idioma — para poder equilibrar el corpus entre idiomas a propósito, y no dejarlo a lo que la web tuviera.",
      bullets: [
        "**Un clasificador diminuto puntúa el texto** entre idiomas y elige el mejor — en bastante menos de un milisegundo por documento.",
        "**El texto corto o mezclado es difícil.** Pocas palabras, o dos idiomas a la vez, dejan las puntuaciones repartidas y bajas.",
        "**Las etiquetas dejan a los laboratorios dividir el flujo por idioma** y mezclar cada uno en la proporción elegida.",
      ],
      cardLabel: "CONFIANZA DE IDIOMA",
      aria: "Un conjunto de barras de confianza, una por idioma candidato, con el idioma de mayor puntuación marcado como la etiqueta.",
      steps: 1,
      captions: ["El clasificador puntúa la muestra entre idiomas; el más alto gana — si supera la barra."],
      hint: "Elige una muestra — el fragmento mezclado deja todas las puntuaciones bajas y se retiene.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Inglés limpio — el clasificador está 98% seguro. Una etiqueta fácil y confiada.",
        "Español limpio — 99% de confianza. El portugués y el gallego quedan muy atrás.",
        "Chino — alta confianza solo por los caracteres, incluso en una línea corta.",
        "Inglés y español mezclados en un fragmento — las puntuaciones se reparten, nada supera la barra, así que se retiene.",
      ],
    },
  ],
  n1toggle: "Extracción",
  n1on: "SÍ",
  n1off: "NO",
  n1blockLabels: [
    "Navegación superior",
    "Aviso de cookies",
    "Cabecera y logo",
    "Titular",
    "Autor · fecha",
    "Párrafo del artículo",
    "Anuncio incrustado",
    "Párrafo del artículo",
    "Artículos relacionados",
    "Enlaces del pie",
  ],
  n1summaryOff: "Página cruda — 10 bloques, casi todo plantilla.",
  n1summaryOn: "Se quedó el artículo — 4 bloques · 6 descartados.",
  n2formats: ["HTML limpio", "PDF a dos columnas", "Página escaneada", "Tabla y matemáticas"],
  n2rawLabel: "EL ARCHIVO",
  n2mdLabel: "MARKDOWN DE SALIDA",
  n2techniques: ["Quitar etiquetas y plantilla", "Detectar columnas, ordenar", "OCR — píxeles a texto", "Reconstruir tabla + math"],
  n2output: [
    ["# Resultados Q3", "Ingresos +14% interanual,", "margen plano en 38%."],
    ["# Modelo climático", "La base de 2020", "muestra +1.2°C para 2050."],
    ["# Notas de campo, 1974", "La muestra B se mantuvo", "en los tres ensayos."],
    ["| Región | Ventas |", "| ------ | ------ |", "| APAC   | 4.2M   |", "$E = mc^2$ · restaurado"],
  ],
  n2deeperTitle: "Cómo un escaneo se vuelve markdown",
  n2deeperBody:
    "El OCR (reconocimiento óptico de caracteres) lee los píxeles de una imagen y los convierte en caracteres. Luego los modelos de estructura hallan las columnas, tablas y títulos para que el orden de lectura sea correcto. Los modelos de visión más nuevos se saltan el proceso: leen toda la imagen de la página y emiten markdown directamente — con títulos, tablas y ecuaciones incluidos.",
  n3samples: [
    { key: "en", label: "Inglés", text: "The council met on Tuesday." },
    { key: "es", label: "Español", text: "El concejo se reunió el martes." },
    { key: "zh", label: "中文", text: "理事会周二开会。" },
    { key: "mixed", label: "Mezcla", text: "Hello, ¿cómo estás? Let's go." },
  ],
  n3confLabel: "CONFIANZA DE IDIOMA",
  n3taggedPrefix: "etiqueta:",
  n3uncertain: "incierto — retenido",
  n3langNames: {
    en: "Inglés",
    es: "Español",
    zh: "Chino",
    de: "Alemán",
    nl: "Neerlandés",
    fr: "Francés",
    pt: "Portugués",
    gl: "Gallego",
    it: "Italiano",
    ja: "Japonés",
    ko: "Coreano",
    un: "Otro",
  },
  calloutFastLabel: "PARA SABER · IDENTIFICAR IDIOMA",
  calloutFastTitle: "Lo bastante rápido para correr en todo",
  calloutFastBody:
    "Un clasificador de idioma como fastText etiqueta un documento en menos de un milisegundo — así que puede correr en cada una de billones de páginas. Las etiquetas luego dejan a un laboratorio dividir el flujo por idioma y mezclar cada uno en las proporciones que quiere, en vez de lo que el rastreo trajera.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ:
    "El filtrado ya tiró las páginas basura. ¿Por qué correr extracción en las que conservas — por qué no entrenar con el HTML crudo?",
  explainA:
    "Porque incluso una buena página es casi toda plantilla — barras de nav, anuncios, avisos de cookies y pies envolviendo una rebanada delgada de artículo. Entrena con el HTML crudo y el modelo aprende a emitir esa envoltura en vez de prosa. La extracción aísla el texto principal, convierte formatos difíciles — PDFs a dos columnas, imágenes escaneadas, tablas y matemáticas — en **markdown** limpio, y etiqueta el idioma de cada documento para poder equilibrar el corpus a propósito. Texto limpio entra, texto limpio sale.",
  bridgeLabel: "SIGUIENTE: PUNTUACIÓN POR CLASIFICADOR",
  bridgeBody:
    "El texto está limpio, estructurado y etiquetado por idioma — pero *limpio* no es lo mismo que *bueno*. Sigue **un modelo que califica la web**: un clasificador pequeño puntúa cada página de 0 a 1 y conserva solo las de puntuación alta.",
  prevLesson: "Tirar la basura",
  nextLesson: "Un modelo que califica la web",
};
