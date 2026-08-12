/**
 * Stage 0 · Phase 0.1b — Domain-specific source selection. Interface + EN/ES
 * copy for the article, isolated from every other lesson.
 */

/** One node of the 0.1b lesson — scannable: a short intro + bullets + a callout. */
export interface DomNodeCopy {
  eyebrow: string;
  title: string;
  intro: string; //     one-sentence lead
  bullets: string[]; // 3–4 takeaways (support **bold** / `code` / [links] / {ring})
  /** Rich context / plain-language jargon, in a Callout above the interactive. */
  callout: { label: string; title: string; body: string };
  cardLabel: string;
  aria: string; //      accessible name for the diagram
  captions: string[]; // one per step (length 1 → live view, no stepper)
  hint: string;
  readoutTitle: string;
  rows: string[];
  readoutNote: string; // plain-language line under the readout
}

/** Diagram labels that must be translated (drawn inside the d3 illustrations). */
export interface DomUi {
  keep: string;
  drop: string;
  wontParse: string;
  machineMade: string;
  packed: string;
  reReads: string;
  safeLimit: string;
  overfit: string;
  driftWarn: string;
  reasoning: string;
  theMix: string;
  permissive: string;
  copyleft: string;
  quarantine: string;
  safeToTrain: string;
  leaked: string;
  twoColPage: string;
  naive: string;
  vision: string;
  scrambled: string;
  cleanLatex: string;
}

/** Phase 0.1b — Domain-specific source selection (4 nodes). */
export interface DomainLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: DomNodeCopy[];
  ui: DomUi;
  /** Dynamic control-state notes (placeholders: {web}{name}{x}{n}{k}{links}{q}{kb}). */
  notes: {
    n1drift: string;
    n1overfit: string;
    n1ok: string;
    n2on: string;
    n2off: string;
    n3on: string;
    n3off: string;
    n4vision: string;
    n4naive: string;
  };
  // Node 1 — data recipe
  n1presets: string[];
  n1domains: string[]; //  Web / Code / Maths / Books
  // Node 2 — clean code
  n2toggles: string[]; //  drop broken / drop machine-made / pack by import
  // Node 3 — licensing
  n3licenses: string[]; //  MIT / Apache-2.0 / BSD / GPL-3.0
  n3allowLabel: string;
  n3deepScan: string;
  // Node 4 — PDF extraction
  n4modes: string[]; //    naive / two-stage
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const domainsEN: DomainLesson = {
      crumb: "STAGE 0 · PHASE 0.1B · DOMAIN-SPECIFIC SOURCES",
      eyebrow: "STAGE 0 · PHASE 0.1B · 4 NODES",
      title: "Domain-specific sources",
      lede: "Raw web text is thin on reasoning. To teach logic, maths and code, labs blend in denser sources — and each one needs its own cleanup. Four short, interactive steps.",
      pipelineLabel: "THE PIPELINE",
      pipeline: ["01 Recipe", "02 Clean code", "03 Licensing", "04 PDFs"],
      nodes: [
        {
          eyebrow: "NODE 01 / 04",
          title: "Why mix in code and maths",
          intro: "Raw web text is mostly chatter — thin on step-by-step reasoning. Labs deliberately blend in denser sources, but the mix is a balancing act.",
          bullets: [
            "**Add code, maths and books.** They're a tiny slice of the web but carry the most logic and structure.",
            "**Keep 15–30% web text.** It keeps the model's everyday language natural — and holds [overfitting](https://en.wikipedia.org/wiki/Overfitting) at bay.",
            "**Don't overdo it.** Lean too hard on a small, specialised pile and the model re-reads it until it *memorises* it instead of learning the pattern.",
          ],
          callout: {
            label: "IN PLAIN WORDS",
            title: "Overfitting & epochs",
            body: "One full pass over the data is an *epoch*. Re-read a tiny pile many times and the model *memorises* it — like cramming answers instead of understanding — so labs cap re-reads and keep general web text in the mix.",
          },
          cardLabel: "SET THE TRAINING MIX",
          aria: "The training mix and how often each pile is re-read",
          captions: ["The mix, its re-reads, and the reasoning it buys"],
          hint: "Drag Maths up: its small pile gets re-read past the 1.2× limit and the bar turns red — that's overfitting.",
          readoutTitle: "RECIPE",
          rows: ["Reasoning", "Web share", "Max re-reads", "Verdict"],
          readoutNote: "Aim for high reasoning while keeping web at or above 15% and re-reads under 1.2x.",
        },
        {
          eyebrow: "NODE 02 / 04",
          title: "Keep only clean, connected code",
          intro: "Code teaches logic and structure — but only if it's readable and kept in context.",
          bullets: [
            "**Drop the garbage.** Files that won't [parse](https://tree-sitter.github.io/tree-sitter/) (broken syntax) and machine-made blobs (minified bundles, generated [protobuf](https://protobuf.dev/)) teach nothing.",
            "**Keep files together.** Stitch a repo's files in import order with a `<|file_sep|>` marker into one {ring} green stream, so the model sees how `main.py` uses `utils.py`.",
            "**Why it matters.** A model that only ever saw lone files can't follow imports, class inheritance, or how a whole repo fits together.",
          ],
          callout: {
            label: "IN PLAIN WORDS",
            title: "Parse & minified",
            body: "*Parsing* means reading code into a valid tree; if a parser like [tree-sitter](https://tree-sitter.github.io/tree-sitter/) chokes on a file, it's broken. *Minified* code is crushed onto one giant line to save space — unreadable to humans and models alike.",
          },
          cardLabel: "CLEAN & PACK THE REPO",
          aria: "Six files sorted into keep or drop, then packed into one stream",
          captions: [
            "STEP 1/2 — sort the files: keep the clean ones, drop the rest",
            "STEP 2/2 — pack the survivors in import order with <|file_sep|>",
          ],
          hint: "Turn off 'Drop broken files' — broken.py sneaks back into the packed stream.",
          readoutTitle: "RESULT",
          rows: ["Kept", "Dropped", "Import links", "Packed size"],
          readoutNote: "Broken and machine-made files are removed; the rest are stitched into one stream.",
        },
        {
          eyebrow: "NODE 03 / 04",
          title: "Some open-source code isn't safe to train on",
          intro: "A license sets the rules for reusing code. Some are safe to train on; some can force you to give your own product away.",
          bullets: [
            "**Permissive ([MIT](https://opensource.org/license/mit), BSD, Apache):** use it freely. The {ring} green folders are safe to train on.",
            "**[Copyleft](https://en.wikipedia.org/wiki/Copyleft) (GPL, AGPL) is 'sticky':** if your model reproduces this code, you may have to open-source your product. Quarantine it.",
            "**The trap:** a repo can say MIT at the top and hide GPL code in a subfolder — so you have to check *every* folder, not just the root.",
          ],
          callout: {
            label: "LEGAL NOTE",
            title: "Why copyleft is risky",
            body: "[Copyleft](https://en.wikipedia.org/wiki/Copyleft) licences like the GPL require that anything built from the code is also open-sourced. Train on it and a model that later emits a snippet can pull that duty into commercial output — so it's quarantined, not deleted.",
          },
          cardLabel: "SCAN EVERY FOLDER",
          aria: "A repo tree with a hidden GPL subfolder being quarantined",
          captions: [
            "STEP 1/2 — the repo: root says MIT, but each folder has its own license",
            "STEP 2/2 — a deep scan pulls the copyleft folders into quarantine",
          ],
          hint: "Turn the deep scan OFF — the GPL folder inherits 'MIT' and leaks into your safe corpus.",
          readoutTitle: "AUDIT",
          rows: ["Root license", "Quarantined", "Safe to train", "Verdict"],
          readoutNote: "A permissive root does not make the whole repo safe — subfolders can override it.",
        },
        {
          eyebrow: "NODE 04 / 04",
          title: "Papers are PDFs, and PDFs fight back",
          intro: "Papers hold the densest knowledge — but it's locked inside PDFs that a naive reader scrambles.",
          bullets: [
            "**The problem:** reading straight across a two-column page interleaves the columns into nonsense, and equations turn to garbage.",
            "**The fix:** a fast, cheap text pass for simple pages; a [vision model](https://github.com/facebookresearch/nougat) only for two-column and maths-heavy ones — its {ring} green output is clean [LaTeX](https://en.wikipedia.org/wiki/LaTeX).",
            "**Why route:** the vision model costs ~100x more, so you only pay it where a page truly needs it.",
          ],
          callout: {
            label: "IN PLAIN WORDS",
            title: "Vision model & LaTeX",
            body: "A *vision model* ([Nougat](https://github.com/facebookresearch/nougat), Marker) 'looks' at the page image to rebuild its layout — like reading it with eyes. Maths comes back as *LaTeX*, the text format for equations, e.g. `\\frac{a}{b}` for a fraction.",
          },
          cardLabel: "READ THE PAGE THE RIGHT WAY",
          aria: "A two-column page read naively versus by a vision model",
          captions: ["Naive reading versus the two-stage vision pipeline"],
          hint: "Switch to 'Naive' — the equation collapses into unreadable text and valid-LaTeX drops to 0%.",
          readoutTitle: "EXTRACTION",
          rows: ["Method", "Valid LaTeX", "Sent to vision", "Cost"],
          readoutNote: "Route the hard pages to the vision model; keep the cheap path for the easy 72%.",
        },
      ],
      ui: {
        keep: "KEEP",
        drop: "DROP",
        wontParse: "won't parse",
        machineMade: "machine-made",
        packed: "PACKED STREAM",
        reReads: "TIMES EACH PILE IS RE-READ",
        safeLimit: "1.2x limit",
        overfit: "OVERFIT",
        driftWarn: "web share below 15% — everyday language drifts",
        reasoning: "REASONING",
        theMix: "THE MIX — share of training tokens",
        permissive: "permissive · safe",
        copyleft: "copyleft · sticky",
        quarantine: "QUARANTINE",
        safeToTrain: "training set",
        leaked: "GPL leaked into the training set",
        twoColPage: "two-column page",
        naive: "Naive read",
        vision: "Vision model",
        scrambled: "columns interleaved · unusable",
        cleanLatex: "layout restored · clean LaTeX",
      },
      notes: {
        n1drift: "Web is only {web}% — below 15%, so the model's everyday language starts to drift.",
        n1overfit: "{name} is re-read {x}× — too small a pile, so the model memorises it (overfitting).",
        n1ok: "Balanced: strong reasoning, no overfitting, and web text above 15%.",
        n2on: "{n} files removed (broken or machine-made); the {k} clean files are packed with {links} import links intact.",
        n2off: "broken.py is kept — it can't parse, so it poisons the packed stream. Turn the filter back on.",
        n3on: "Deep scan: {q} copyleft subfolders quarantined; {kb} KB of MIT/BSD code is safe to train on.",
        n3off: "Shallow scan: the GPL folder inherited \"MIT\" and leaked into training — a real legal risk.",
        n4vision: "The vision model rebuilds the layout — the equation comes out as clean, valid LaTeX.",
        n4naive: "Naive reading interleaves the two columns; the equation is destroyed (0% valid LaTeX).",
      },
      n1presets: ["Default web", "Llama-3 style", "DeepSeek reasoner", "Extreme STEM"],
      n1domains: ["Web", "Code", "Maths", "Books"],
      n2toggles: ["Drop broken files", "Drop machine-made", "Pack by import"],
      n3licenses: ["MIT", "Apache-2.0", "BSD", "GPL-3.0"],
      n3allowLabel: "Licenses you allow",
      n3deepScan: "Deep folder scan",
      n4modes: ["Naive read", "Two-stage vision"],
      explainLabel: "EXPLAIN IT BACK",
      explainQ: "Common Crawl is free and massive. Why spend real engineering to add code, papers and clean-licensed repos on top of it?",
      explainA: "Because the free web is thin on what makes a model *reason* — dense, structured, correct text. Code teaches logic, papers teach maths and long arguments, books teach staying coherent over many pages. But you can't just dump them in: broken or machine-made code has to be filtered, PDFs need their layout rebuilt, and copyleft code has to be quarantined or you risk having to open-source your product. And every specialised pile is small — lean on it too hard and the model memorises instead of learns. The skill is the *mix* and the *cleanup*, not the raw size.",
      bridgeLabel: "NEXT: 0.2 · QUALITY FILTERING",
      bridgeBody: "The mixture is now dense, clean and legally safe, with code stitched together by `<|file_sep|>`. Next, **quality filtering** — perplexity scores and fine-tuned classifiers ([FineWeb-Edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)) strip the subtle noise that survived.",
      prevLesson: "Back to 0.1a",
      nextLesson: "0.2 coming soon",
    };

export const domainsES: DomainLesson = {
      crumb: "ETAPA 0 · FASE 0.1B · FUENTES POR DOMINIO",
      eyebrow: "ETAPA 0 · FASE 0.1B · 4 NODOS",
      title: "Fuentes por dominio",
      lede: "El texto web crudo es pobre en razonamiento. Para enseñar lógica, matemáticas y código, los laboratorios mezclan fuentes más densas — y cada una necesita su propia limpieza. Cuatro pasos cortos e interactivos.",
      pipelineLabel: "LA TUBERÍA",
      pipeline: ["01 Receta", "02 Código", "03 Licencias", "04 PDFs"],
      nodes: [
        {
          eyebrow: "NODO 01 / 04",
          title: "Por qué mezclar código y matemáticas",
          intro: "El texto web crudo es sobre todo charla — pobre en razonamiento paso a paso. Los laboratorios mezclan a propósito fuentes más densas, pero la mezcla es un equilibrio delicado.",
          bullets: [
            "**Añade código, matemáticas y libros.** Son una porción diminuta de la web pero cargan la mayor parte de la lógica y la estructura.",
            "**Deja 15–30% de texto web.** Mantiene natural el lenguaje cotidiano del modelo — y frena el [sobreajuste](https://es.wikipedia.org/wiki/Sobreajuste).",
            "**No te excedas.** Si abusas de un montón pequeño y especializado, el modelo lo relee hasta *memorizarlo* en vez de aprender el patrón.",
          ],
          callout: {
            label: "EN PALABRAS SIMPLES",
            title: "Sobreajuste y épocas",
            body: "Una pasada completa por los datos es una *época*. Releer un montón pequeño muchas veces hace que el modelo lo *memorice* — como empollar respuestas en vez de entender — así que los laboratorios limitan las relecturas y dejan texto web en la mezcla.",
          },
          cardLabel: "AJUSTA LA MEZCLA",
          aria: "La mezcla de entrenamiento y cuántas veces se relee cada montón",
          captions: ["La mezcla, sus relecturas y el razonamiento que compra"],
          hint: "Sube Matemáticas: su montón pequeño se relee más de 1.2x y la barra se pone roja — eso es sobreajuste.",
          readoutTitle: "RECETA",
          rows: ["Razonamiento", "Cuota web", "Máx. relecturas", "Veredicto"],
          readoutNote: "Busca alto razonamiento manteniendo web en 15% o más y relecturas por debajo de 1.2x.",
        },
        {
          eyebrow: "NODO 02 / 04",
          title: "Conserva solo código limpio y conectado",
          intro: "El código enseña lógica y estructura — pero solo si es legible y se mantiene en contexto.",
          bullets: [
            "**Descarta la basura.** Los archivos que no [parsean](https://tree-sitter.github.io/tree-sitter/) (sintaxis rota) y los generados por máquina (paquetes minificados, [protobuf](https://protobuf.dev/)) no enseñan nada.",
            "**Mantén los archivos juntos.** Une los archivos del repo en orden de import con un marcador `<|file_sep|>` en un solo {ring} flujo verde, para que el modelo vea cómo `main.py` usa `utils.py`.",
            "**Por qué importa.** Un modelo que solo vio archivos sueltos no puede seguir imports, herencia de clases ni cómo encaja un repo entero.",
          ],
          callout: {
            label: "EN PALABRAS SIMPLES",
            title: "Parsear y minificado",
            body: "*Parsear* es leer el código a un árbol válido; si un parser como [tree-sitter](https://tree-sitter.github.io/tree-sitter/) se atasca con un archivo, está roto. El código *minificado* está aplastado en una sola línea gigante para ahorrar espacio — ilegible para humanos y modelos.",
          },
          cardLabel: "LIMPIA Y EMPAQUETA EL REPO",
          aria: "Seis archivos separados en conservar o descartar, luego empaquetados",
          captions: [
            "PASO 1/2 — separa los archivos: conserva los limpios, descarta el resto",
            "PASO 2/2 — empaqueta los supervivientes en orden de import con <|file_sep|>",
          ],
          hint: "Apaga 'Descartar rotos' — broken.py se cuela de vuelta en el flujo empaquetado.",
          readoutTitle: "RESULTADO",
          rows: ["Conservados", "Descartados", "Enlaces import", "Tamaño"],
          readoutNote: "Los archivos rotos y generados se eliminan; el resto se une en un solo flujo.",
        },
        {
          eyebrow: "NODO 03 / 04",
          title: "No todo el código abierto es seguro para entrenar",
          intro: "Una licencia fija las reglas para reutilizar el código. Algunas son seguras para entrenar; otras pueden obligarte a regalar tu propio producto.",
          bullets: [
            "**Permisivas ([MIT](https://opensource.org/license/mit), BSD, Apache):** úsalas libremente. Las {ring} carpetas verdes son seguras para entrenar.",
            "**[Copyleft](https://es.wikipedia.org/wiki/Copyleft) (GPL, AGPL) es 'pegajosa':** si tu modelo reproduce este código, podrías tener que abrir el código de tu producto. Ponla en cuarentena.",
            "**La trampa:** un repo puede decir MIT arriba y esconder código GPL en una subcarpeta — hay que revisar *cada* carpeta, no solo la raíz.",
          ],
          callout: {
            label: "NOTA LEGAL",
            title: "Por qué el copyleft es riesgoso",
            body: "Las licencias [copyleft](https://es.wikipedia.org/wiki/Copyleft) como la GPL exigen que todo lo construido con el código también sea abierto. Entrena con él y un modelo que luego emita un fragmento puede arrastrar ese deber a la salida comercial — por eso se pone en cuarentena, no se borra.",
          },
          cardLabel: "ESCANEA CADA CARPETA",
          aria: "Un árbol de repo con una subcarpeta GPL oculta puesta en cuarentena",
          captions: [
            "PASO 1/2 — el repo: la raíz dice MIT, pero cada carpeta tiene su licencia",
            "PASO 2/2 — un escaneo profundo lleva las carpetas copyleft a cuarentena",
          ],
          hint: "Apaga el escaneo profundo — la carpeta GPL hereda 'MIT' y se filtra a tu corpus seguro.",
          readoutTitle: "AUDITORÍA",
          rows: ["Licencia raíz", "En cuarentena", "Seguro entrenar", "Veredicto"],
          readoutNote: "Una raíz permisiva no hace seguro todo el repo — las subcarpetas pueden anularla.",
        },
        {
          eyebrow: "NODO 04 / 04",
          title: "Un paper es un PDF, y los PDF se resisten",
          intro: "Los papers guardan el conocimiento más denso — pero está encerrado en PDF que un lector ingenuo revuelve.",
          bullets: [
            "**El problema:** leer de corrido una página a dos columnas entrelaza las columnas en un sinsentido, y las ecuaciones se vuelven basura.",
            "**La solución:** una pasada de texto rápida para las páginas simples; un [modelo de visión](https://github.com/facebookresearch/nougat) solo para las de dos columnas y muchas matemáticas — su {ring} salida verde es [LaTeX](https://es.wikipedia.org/wiki/LaTeX) limpio.",
            "**Por qué enrutar:** el modelo de visión cuesta ~100x más, así que solo lo pagas donde la página de verdad lo necesita.",
          ],
          callout: {
            label: "EN PALABRAS SIMPLES",
            title: "Modelo de visión y LaTeX",
            body: "Un *modelo de visión* ([Nougat](https://github.com/facebookresearch/nougat), Marker) 'mira' la imagen de la página para reconstruir su estructura — como leerla con ojos. Las matemáticas vuelven como *LaTeX*, el formato de texto para ecuaciones, p. ej. `\\frac{a}{b}` para una fracción.",
          },
          cardLabel: "LEE LA PÁGINA DE LA FORMA CORRECTA",
          aria: "Una página a dos columnas leída de forma ingenua frente a un modelo de visión",
          captions: ["Lectura ingenua frente a la tubería de visión de dos etapas"],
          hint: "Cambia a 'Ingenua' — la ecuación se colapsa en texto ilegible y el LaTeX válido cae a 0%.",
          readoutTitle: "EXTRACCIÓN",
          rows: ["Método", "LaTeX válido", "A visión", "Costo"],
          readoutNote: "Enruta las páginas difíciles al modelo de visión; deja la vía barata para el 72% fácil.",
        },
      ],
      ui: {
        keep: "CONSERVAR",
        drop: "DESCARTAR",
        wontParse: "no parsea",
        machineMade: "generado",
        packed: "FLUJO EMPAQUETADO",
        reReads: "VECES QUE SE RELEE CADA MONTÓN",
        safeLimit: "límite 1.2x",
        overfit: "SOBREAJUSTE",
        driftWarn: "cuota web bajo 15% — el lenguaje cotidiano deriva",
        reasoning: "RAZONAMIENTO",
        theMix: "LA MEZCLA — cuota de tokens de entrenamiento",
        permissive: "permisiva · segura",
        copyleft: "copyleft · pegajosa",
        quarantine: "CUARENTENA",
        safeToTrain: "entrenamiento",
        leaked: "GPL filtrado al entrenamiento",
        twoColPage: "página a dos columnas",
        naive: "Lectura ingenua",
        vision: "Modelo de visión",
        scrambled: "columnas entrelazadas · inservible",
        cleanLatex: "estructura restaurada · LaTeX limpio",
      },
      notes: {
        n1drift: "La web es solo el {web}% — por debajo del 15%, así que el lenguaje cotidiano del modelo empieza a derivar.",
        n1overfit: "{name} se relee {x}× — un montón demasiado pequeño, así que el modelo lo memoriza (sobreajuste).",
        n1ok: "Equilibrado: buen razonamiento, sin sobreajuste y con texto web por encima del 15%.",
        n2on: "{n} archivos eliminados (rotos o generados); los {k} archivos limpios se empaquetan con {links} enlaces de import intactos.",
        n2off: "broken.py se conserva — no parsea, así que envenena el flujo empaquetado. Vuelve a activar el filtro.",
        n3on: "Escaneo profundo: {q} subcarpetas copyleft en cuarentena; {kb} KB de código MIT/BSD es seguro para entrenar.",
        n3off: "Escaneo superficial: la carpeta GPL heredó \"MIT\" y se filtró al entrenamiento — un riesgo legal real.",
        n4vision: "El modelo de visión reconstruye la estructura — la ecuación sale como LaTeX limpio y válido.",
        n4naive: "La lectura ingenua entrelaza las dos columnas; la ecuación queda destruida (0% de LaTeX válido).",
      },
      n1presets: ["Web por defecto", "Estilo Llama-3", "DeepSeek reasoner", "STEM extremo"],
      n1domains: ["Web", "Código", "Matemát.", "Libros"],
      n2toggles: ["Descartar rotos", "Descartar generados", "Empacar por import"],
      n3licenses: ["MIT", "Apache-2.0", "BSD", "GPL-3.0"],
      n3allowLabel: "Licencias permitidas",
      n3deepScan: "Escaneo profundo",
      n4modes: ["Lectura ingenua", "Visión 2 etapas"],
      explainLabel: "EXPLÍCALO CON TUS PALABRAS",
      explainQ: "Common Crawl es gratis y enorme. ¿Por qué gastar ingeniería de verdad en añadir código, papers y repos con licencia limpia encima?",
      explainA: "Porque la web gratis es pobre en lo que hace *razonar* a un modelo — texto denso, estructurado y correcto. El código enseña lógica, los papers enseñan matemáticas y argumentos largos, los libros enseñan coherencia a lo largo de muchas páginas. Pero no basta con volcarlos: el código roto o generado hay que filtrarlo, a los PDF hay que reconstruirles la estructura, y el código copyleft hay que ponerlo en cuarentena o te arriesgas a tener que abrir tu producto. Y cada montón especializado es pequeño — si abusas, el modelo memoriza en vez de aprender. La habilidad está en la *mezcla* y la *limpieza*, no en el tamaño.",
      bridgeLabel: "SIGUIENTE: 0.2 · FILTRADO DE CALIDAD",
      bridgeBody: "La mezcla ya es densa, limpia y legalmente segura, con el código unido por `<|file_sep|>`. Sigue el **filtrado de calidad** — puntajes de perplejidad y clasificadores afinados ([FineWeb-Edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)) quitan el ruido sutil que sobrevivió.",
      prevLesson: "Volver a 0.1a",
      nextLesson: "0.2 próximamente",
    };
