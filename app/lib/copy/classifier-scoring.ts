/**
 * Stage 0 · Phase 0.3 — "A model that grades the web" (classifier scoring).
 * Interface + EN/ES copy for the article, isolated from every other lesson so
 * edits here never touch theirs.
 *
 * One idea: a small, fast classifier trained on good-vs-bad text scores every
 * page 0–1, and only the high scorers are kept (the FineWeb-Edu idea). Builds
 * on quality filtering (hand-written rules) — this is the trained upgrade.
 */
import type { WsNodeCopy } from "./shared";

export interface ClassifierScoringLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the training signal
  n1sources: string[]; //     button labels, aligned to TRAIN_SOURCES
  n1examples: string[]; //    snippet text per source, aligned to TRAIN_SOURCES
  n1previewLabel: string; //  "THIS EXAMPLE"
  n1goodTag: string; //       "GOOD · 1"
  n1badTag: string; //        "BAD · 0"
  n1goodBin: string; //       "GOOD PILE · label 1"
  n1badBin: string; //        "BAD PILE · label 0"
  // Node 2 — scoring a page
  n2signals: string[]; //     toggle labels, aligned to SIGNALS
  n2docLabel: string; //      "THE PAGE BEING SCORED"
  n2docText: string;
  n2scoreCap: string; //      "QUALITY SCORE" (drawn in the meter)
  n2wordHigh: string; //      verdict word under the number
  n2wordMid: string;
  n2wordLow: string;
  n2verdictHigh: string; //   note when score is high
  n2verdictMid: string;
  n2verdictLow: string;
  n2low: string; //           axis word "junk"
  n2high: string; //          axis word "gold"
  // Node 3 — the threshold
  n3slider: string; //        "KEEP THRESHOLD"
  n3samples: string[]; //     sample-doc labels, aligned to SAMPLE_DOCS
  n3keptTag: string; //       "KEPT"
  n3keepLabel: string; //     "keep ≥" prefix on the threshold line
  n3low: string; //           axis word "junk"
  n3high: string; //          axis word "gold"
  n3ofWeb: string; //         "of the web" (drawn beside kept %)
  // shared
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const classifierScoringEN: ClassifierScoringLesson = {
  crumb: "STAGE 0 · PHASE 0.3 · CLASSIFIER SCORING",
  eyebrow: "STAGE 0 · PHASE 0.3 · 3 NODES",
  title: "A model that grades the web",
  lede: "Hand-written rules only catch obvious junk. So labs train a small, fast model on examples of good and bad text, let it score every page from 0 to 1, and keep only the high scorers. This is the FineWeb-Edu idea — play with all three steps.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Good vs bad, by example", "One score per page", "Where to draw the line"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Good and bad, by example",
      intro: "A quality grader is just a model you fit to labelled examples — the same 'fit a function to data' idea, aimed at one question: does this read like the good stuff?",
      bullets: [
        "**You don't write the rule — you show examples.** Curated pages (encyclopedias, textbooks, docs) are labelled *good* (1); raw web dump (spam, link farms, boilerplate) is labelled *bad* (0).",
        "**The model learns the pattern that splits the two piles** — clean prose and real information on one side, keyword soup on the other.",
        "**Better labels beat a bigger model here.** A few hundred thousand well-chosen examples can grade billions of pages.",
        "**This builds on [quality filtering](/stage/0/quality-filtering)** — rules caught the obvious junk; a trained grader catches the subtle kind.",
      ],
      cardLabel: "TRAINING SET · GOOD vs BAD",
      aria: "Labelled training examples sorted into a good pile and a bad pile.",
      steps: 1,
      captions: ["Each example drops into the good or bad pile — that labelled set is what the model learns from."],
      hint: "Flip through the sources — each one lands in the pile its label says.",
      readoutTitle: "TRAINING_LABEL",
      rows: ["SOURCE", "LABEL", "PILE"],
      optionNotes: [
        "Encyclopedia — clean, factual, well-edited prose. A textbook 'good' example (label 1).",
        "Textbook — clear explanations with worked examples. Exactly the text you want more of (label 1).",
        "API docs — precise, structured, information-dense. Good (label 1).",
        "SEO spam — keyword stuffing written for search engines, not people. Bad (label 0).",
        "Link farm — a page that's nothing but links, no real content. Bad (label 0).",
        "Nav boilerplate — cookie notices, footers, menus. Real text, zero learning value. Bad (label 0).",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "One number per page",
      intro: "Once trained, the grader reads a brand-new page and outputs a single number between 0 and 1 — how much it looks like the good examples.",
      bullets: [
        "**The score is a similarity-to-good measure, not a fact-check.** 0.9 means 'reads like a textbook', not 'is true'.",
        "**It adds up the signals it learned** — full sentences, real information, on-topic, clean formatting, cited sources.",
        "**More good signals → higher score.** Flip them on and off and watch the number move.",
        "**FineWeb-Edu grades 'educational value'** this way, then keeps only the top slice.",
      ],
      cardLabel: "QUALITY SCORE · 0 to 1",
      aria: "A meter from zero to one showing the page's quality score building from its signals.",
      steps: 1,
      captions: ["The signals the grader detects add up to a single 0–1 score."],
      hint: "Toggle the signals this page shows — the score climbs as good signals add up.",
      readoutTitle: "PAGE_SCORE",
      rows: ["SCORE", "VERDICT"],
      optionNotes: [
        "Full sentences — well-formed prose instead of fragments or lists. A strong positive.",
        "Real information — actual facts and explanations, not filler. The biggest lift.",
        "On topic — coherent and about one thing, not scattered SEO bait.",
        "Clean formatting — no ad boilerplate, menus, or cookie notices bleeding into the text.",
        "Cites sources — links or references that signal a considered, trustworthy page.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Where to draw the line",
      intro: "Now every one of billions of pages has a score. You keep the ones above a cut-off — one slider that decides how big, and how clean, your corpus is.",
      bullets: [
        "**Raise the cut-off → smaller, cleaner corpus.** Lower it → bigger and noisier. There's no free lunch.",
        "**The web is mostly low-scoring** — the tall left hump is junk; the small right hump is the good stuff worth keeping.",
        "**A thin top slice can beat the whole pile.** FineWeb-Edu keeps only high scorers and still trains better models than the full, unfiltered web.",
        "**Same grader, different knob:** the scores are fixed; the threshold is your call.",
      ],
      cardLabel: "SCORE DISTRIBUTION · KEEP THRESHOLD",
      aria: "A histogram of page quality scores with a movable keep-threshold line and three sample pages.",
      steps: 1,
      captions: ["Every bar is a slice of the web at that score; the line keeps only what's to its right."],
      hint: "Drag the threshold — watch how little of the web survives a strict cut-off.",
      readoutTitle: "CORPUS_YIELD",
      rows: ["KEPT", "SHARE", "TOKENS"],
      readoutNote: "What survives your cut-off: how many pages clear the bar, their share of the web, and the training tokens left.",
      sliderNote: "The cut-off trades size for quality. Keep more and you drag in junk; keep less and you may starve the model of data.",
    },
  ],
  n1sources: ["Encyclopedia", "Textbook", "API docs", "SEO spam", "Link farm", "Nav boilerplate"],
  n1examples: [
    "Photosynthesis converts light energy into chemical energy stored in glucose, releasing oxygen as a by-product.",
    "A prime number is a whole number greater than 1 whose only divisors are 1 and itself. For example, 7 is prime.",
    "fetch(url) returns a Promise that resolves to a Response. Call .json() on it to parse the response body.",
    "BEST cheap flights DEALS!! click here now → buy followers, buy likes, cheap meds, casino bonus tonight!!!",
    "Home | About | Cheap shoes | Cheap bags | Cheap watches | Contact | Login | Sign up | More links here",
    "Accept cookies. Subscribe to our newsletter. © 2024. All rights reserved. Terms · Privacy · Menu · Top",
  ],
  n1previewLabel: "THIS EXAMPLE",
  n1goodTag: "GOOD · 1",
  n1badTag: "BAD · 0",
  n1goodBin: "GOOD PILE · label 1",
  n1badBin: "BAD PILE · label 0",
  n2signals: ["Full sentences", "Real information", "On topic", "Clean formatting", "Cites sources"],
  n2docLabel: "THE PAGE BEING SCORED",
  n2docText: "Photosynthesis lets plants turn sunlight into stored energy. This page walks through how, step by step, with a labelled diagram and cited sources.",
  n2scoreCap: "QUALITY SCORE",
  n2wordHigh: "textbook-like",
  n2wordMid: "borderline",
  n2wordLow: "spam-like",
  n2verdictHigh: "High score — this page reads like the good examples. It clears most thresholds.",
  n2verdictMid: "Middling score — borderline. Whether it survives depends on how strict the cut-off is (next node).",
  n2verdictLow: "Low score — reads like junk. Almost any threshold drops it.",
  n2low: "junk",
  n2high: "gold",
  n3slider: "KEEP THRESHOLD",
  n3samples: ["SEO spam", "Forum thread", "Wikipedia"],
  n3keptTag: "KEPT",
  n3keepLabel: "keep ≥",
  n3low: "junk",
  n3high: "gold",
  n3ofWeb: "of the web",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Why train a whole model to grade text, instead of just writing more filtering rules?",
  explainA: "Because quality is fuzzy. Rules catch obvious junk — too short, too repetitive — but they can't tell a thoughtful explanation from fluent spam. A classifier trained on real *good* and *bad* examples learns that boundary from data, gives every page one comparable score, and lets you keep just the top slice by moving a single threshold. It's the same 'fit a function to data' trick as any model — pointed at the question *is this worth training on?*",
  bridgeLabel: "NEXT: SAFETY FILTERING",
  bridgeBody: "You can now grade pages for quality. But a high-quality page can still be toxic, unsafe, or full of personal data. Next, **safety filtering**: the separate pass that strips harmful and private content before a single token reaches the model.",
  prevLesson: "Back: extraction & parsing",
  nextLesson: "Continue: Safety filtering",
};

export const classifierScoringES: ClassifierScoringLesson = {
  crumb: "ETAPA 0 · FASE 0.3 · PUNTUACIÓN POR CLASIFICADOR",
  eyebrow: "ETAPA 0 · FASE 0.3 · 3 NODOS",
  title: "Un modelo que califica la web",
  lede: "Las reglas escritas a mano solo atrapan la basura obvia. Así que los laboratorios entrenan un modelo pequeño y rápido con ejemplos de texto bueno y malo, dejan que puntúe cada página de 0 a 1, y conservan solo las de puntuación alta. Esta es la idea de FineWeb-Edu — juega con los tres pasos.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Bueno vs malo, por ejemplo", "Un puntaje por página", "Dónde trazar la línea"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Bueno y malo, con ejemplos",
      intro: "Un calificador de calidad es solo un modelo que ajustas a ejemplos etiquetados — la misma idea de 'ajustar una función a los datos', apuntada a una pregunta: ¿esto se lee como lo bueno?",
      bullets: [
        "**No escribes la regla — muestras ejemplos.** Las páginas curadas (enciclopedias, libros de texto, docs) se etiquetan *bueno* (1); el volcado web crudo (spam, granjas de enlaces, plantillas) se etiqueta *malo* (0).",
        "**El modelo aprende el patrón que separa los dos montones** — prosa limpia e información real de un lado, sopa de palabras clave del otro.",
        "**Mejores etiquetas ganan a un modelo más grande aquí.** Unos cientos de miles de ejemplos bien elegidos pueden calificar miles de millones de páginas.",
        "**Esto se apoya en el [filtrado por calidad](/stage/0/quality-filtering)** — las reglas atraparon la basura obvia; un calificador entrenado atrapa la sutil.",
      ],
      cardLabel: "SET DE ENTRENAMIENTO · BUENO vs MALO",
      aria: "Ejemplos de entrenamiento etiquetados, ordenados en un montón bueno y uno malo.",
      steps: 1,
      captions: ["Cada ejemplo cae en el montón bueno o malo — ese set etiquetado es lo que el modelo aprende."],
      hint: "Recorre las fuentes — cada una cae en el montón que dice su etiqueta.",
      readoutTitle: "TRAINING_LABEL",
      rows: ["SOURCE", "LABEL", "PILE"],
      optionNotes: [
        "Enciclopedia — prosa limpia, factual y bien editada. Un ejemplo 'bueno' de manual (etiqueta 1).",
        "Libro de texto — explicaciones claras con ejemplos resueltos. Justo el texto que quieres más (etiqueta 1).",
        "Docs de API — precisas, estructuradas, densas en información. Bueno (etiqueta 1).",
        "Spam SEO — relleno de palabras clave escrito para buscadores, no para personas. Malo (etiqueta 0).",
        "Granja de enlaces — una página que es solo enlaces, sin contenido real. Malo (etiqueta 0).",
        "Plantilla de navegación — avisos de cookies, pies de página, menús. Texto real, cero valor de aprendizaje. Malo (etiqueta 0).",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Un número por página",
      intro: "Ya entrenado, el calificador lee una página nueva y saca un solo número entre 0 y 1 — cuánto se parece a los ejemplos buenos.",
      bullets: [
        "**El puntaje mide parecido a lo bueno, no verifica hechos.** 0.9 significa 'se lee como un libro de texto', no 'es cierto'.",
        "**Suma las señales que aprendió** — frases completas, información real, en tema, formato limpio, fuentes citadas.",
        "**Más señales buenas → puntaje más alto.** Actívalas y desactívalas y mira moverse el número.",
        "**FineWeb-Edu califica el 'valor educativo'** así, y luego conserva solo la porción superior.",
      ],
      cardLabel: "PUNTAJE DE CALIDAD · 0 a 1",
      aria: "Un medidor de cero a uno que muestra el puntaje de calidad construido a partir de sus señales.",
      steps: 1,
      captions: ["Las señales que detecta el calificador se suman en un solo puntaje 0–1."],
      hint: "Alterna las señales que muestra esta página — el puntaje sube al sumar señales buenas.",
      readoutTitle: "PAGE_SCORE",
      rows: ["SCORE", "VERDICT"],
      optionNotes: [
        "Frases completas — prosa bien formada en vez de fragmentos o listas. Un positivo fuerte.",
        "Información real — hechos y explicaciones de verdad, no relleno. El mayor empujón.",
        "En tema — coherente y sobre una sola cosa, no cebo SEO disperso.",
        "Formato limpio — sin plantillas de anuncios, menús ni avisos de cookies mezclados en el texto.",
        "Cita fuentes — enlaces o referencias que señalan una página cuidada y confiable.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Dónde trazar la línea",
      intro: "Ahora cada una de miles de millones de páginas tiene un puntaje. Conservas las que están por encima de un corte — un control que decide qué tan grande, y qué tan limpio, es tu corpus.",
      bullets: [
        "**Sube el corte → corpus más pequeño y limpio.** Bájalo → más grande y ruidoso. No hay almuerzo gratis.",
        "**La web es en su mayoría de puntaje bajo** — la joroba alta de la izquierda es basura; la pequeña de la derecha es lo bueno que vale la pena conservar.",
        "**Una porción fina superior puede ganar al montón entero.** FineWeb-Edu conserva solo puntajes altos y aun así entrena mejores modelos que la web completa sin filtrar.",
        "**Mismo calificador, otra perilla:** los puntajes están fijos; el umbral lo decides tú.",
      ],
      cardLabel: "DISTRIBUCIÓN DE PUNTAJES · UMBRAL",
      aria: "Un histograma de puntajes de calidad con una línea de umbral movible y tres páginas de muestra.",
      steps: 1,
      captions: ["Cada barra es una porción de la web en ese puntaje; la línea conserva solo lo que está a su derecha."],
      hint: "Arrastra el umbral — mira qué poco de la web sobrevive a un corte estricto.",
      readoutTitle: "CORPUS_YIELD",
      rows: ["CONSERVA", "PORCIÓN", "TOKENS"],
      readoutNote: "Lo que sobrevive a tu corte: cuántas páginas superan la barra, su porción de la web y los tokens de entrenamiento que quedan.",
      sliderNote: "El corte cambia tamaño por calidad. Conserva más y arrastras basura; conserva menos y puedes dejar al modelo sin datos.",
    },
  ],
  n1sources: ["Enciclopedia", "Libro de texto", "Docs de API", "Spam SEO", "Granja de enlaces", "Plantilla nav"],
  n1examples: [
    "La fotosíntesis convierte la energía de la luz en energía química almacenada en glucosa, liberando oxígeno como subproducto.",
    "Un número primo es un entero mayor que 1 cuyos únicos divisores son 1 y él mismo. Por ejemplo, 7 es primo.",
    "fetch(url) devuelve una Promise que resuelve a una Response. Llama a .json() para parsear el cuerpo de la respuesta.",
    "¡¡MEJORES OFERTAS de vuelos baratos!! haz clic aquí ya → compra seguidores, compra likes, medicinas baratas, ¡¡bono de casino!!",
    "Inicio | Acerca | Zapatos baratos | Bolsos baratos | Relojes baratos | Contacto | Entrar | Registro | Más enlaces",
    "Acepta cookies. Suscríbete a nuestro boletín. © 2024. Todos los derechos reservados. Términos · Privacidad · Menú",
  ],
  n1previewLabel: "ESTE EJEMPLO",
  n1goodTag: "BUENO · 1",
  n1badTag: "MALO · 0",
  n1goodBin: "MONTÓN BUENO · etiqueta 1",
  n1badBin: "MONTÓN MALO · etiqueta 0",
  n2signals: ["Frases completas", "Información real", "En tema", "Formato limpio", "Cita fuentes"],
  n2docLabel: "LA PÁGINA QUE SE PUNTÚA",
  n2docText: "La fotosíntesis permite a las plantas convertir la luz del sol en energía almacenada. Esta página lo explica paso a paso, con un diagrama etiquetado y fuentes citadas.",
  n2scoreCap: "PUNTAJE DE CALIDAD",
  n2wordHigh: "tipo libro",
  n2wordMid: "en el límite",
  n2wordLow: "tipo spam",
  n2verdictHigh: "Puntaje alto — esta página se lee como los ejemplos buenos. Supera casi cualquier umbral.",
  n2verdictMid: "Puntaje intermedio — en el límite. Que sobreviva depende de qué tan estricto sea el corte (siguiente nodo).",
  n2verdictLow: "Puntaje bajo — se lee como basura. Casi cualquier umbral la descarta.",
  n2low: "basura",
  n2high: "oro",
  n3slider: "UMBRAL DE CORTE",
  n3samples: ["Spam SEO", "Hilo de foro", "Wikipedia"],
  n3keptTag: "CONSERVA",
  n3keepLabel: "conserva ≥",
  n3low: "basura",
  n3high: "oro",
  n3ofWeb: "de la web",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "¿Por qué entrenar todo un modelo para calificar texto, en vez de solo escribir más reglas de filtrado?",
  explainA: "Porque la calidad es difusa. Las reglas atrapan la basura obvia — muy corta, muy repetitiva — pero no distinguen una explicación reflexiva de un spam bien redactado. Un clasificador entrenado con ejemplos reales *buenos* y *malos* aprende esa frontera desde los datos, da a cada página un puntaje comparable, y te deja conservar solo la porción superior moviendo un único umbral. Es el mismo truco de 'ajustar una función a los datos' que cualquier modelo — apuntado a la pregunta *¿vale la pena entrenar con esto?*",
  bridgeLabel: "SIGUIENTE: FILTRADO DE SEGURIDAD",
  bridgeBody: "Ya puedes calificar páginas por calidad. Pero una página de alta calidad puede seguir siendo tóxica, insegura o llena de datos personales. Sigue el **filtrado de seguridad**: el paso aparte que quita contenido dañino y privado antes de que un solo token llegue al modelo.",
  prevLesson: "Atrás: extracción y parsing",
  nextLesson: "Continuar: Filtrado de seguridad",
};
