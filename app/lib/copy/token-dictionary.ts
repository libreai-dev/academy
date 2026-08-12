/**
 * Stage 0 · 1.3 — The token dictionary (BPE). Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: models don't read letters or words — they read tokens from a fixed
 * dictionary, and that dictionary is BUILT by merging the most frequent pairs
 * (Byte-Pair Encoding). Distinct from the Stage-1 "tokens" lesson (what a token
 * IS): this one is about how the vocabulary is made and how text is looked up.
 */
import type { WsNodeCopy } from "./shared";

/** A one-tap example for the live lookup (Node 3). */
export interface TokDictPreset {
  label: string;
  text: string;
  note: string;
}

export interface TokenDictionaryLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the unit
  n1schemes: string[]; //   [Letters, Whole words, Sub-words]
  n1dictLabel: string; //   "DICTIONARY SIZE"
  n1seqLabel: string; //    "SEQUENCE LENGTH"
  n1wordLabel: string; //   "THE WORD"
  n1entriesWord: string; // "entries"
  n1piecesWord: string; //  "pieces"
  // Node 2 — building the dictionary (BPE)
  n2slider: string; //      "MERGES APPLIED"
  n2vocabLabel: string; //  "DICTIONARY (grows each merge)"
  n2sampleLabel: string; // "SAMPLE WORD"
  n2mergeStart: string; //  shown at merge 0
  n2mergeFmt: string; //    "merge {n}: {a} + {b} → {merged}" template pieces
  n2joins: string; //       "joins"
  n2seen: string; //        "seen {n}×"
  n2done: string; //        "one whole entry"
  n2baseLegend: string; //  "characters"
  n2mergedLegend: string; //"merged tokens"
  // Node 3 — live lookup
  n3inputLabel: string;
  n3default: string;
  n3loading: string;
  n3presetsLabel: string;
  n3presets: TokDictPreset[];
  n3tapeLabel: string;
  n3idLegend: string; //    "each token → one integer id"
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

export const tokenDictionaryEN: TokenDictionaryLesson = {
  crumb: "STAGE 0 · 1.3 · THE TOKEN DICTIONARY",
  eyebrow: "STAGE 0 · 1.3 · 3 NODES",
  title: "The token dictionary",
  lede: "A model never sees your letters or your words. It sees tokens — entries in a fixed dictionary. This is how that dictionary gets built by merging the most common pairs, and how your text turns into a row of integer IDs.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Letters, words, or pieces", "Building the dictionary", "Text → integer IDs"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Letters, words, or pieces?",
      intro: "Before a model can read text, you have to chop it into units. There are three obvious choices — and only one of them scales.",
      bullets: [
        "**Letters** — a tiny dictionary (~100 symbols), but every word becomes a long string of units. The model has to reassemble meaning from scratch.",
        "**Whole words** — short sequences, but a giant dictionary — and it *breaks on any word it hasn't seen*: names, typos, new slang, code.",
        "**Sub-words** — the middle ground everyone uses: common words stay whole, rare words split into reusable pieces. Nothing is ever out of vocabulary.",
        "**This is the real design choice.** GPT-style models pick sub-words — roughly 100k–200k in modern models like GPT-4o.",
      ],
      cardLabel: "ONE WORD · THREE WAYS TO SPLIT IT",
      aria: "The word tokenization split three ways: into letters, as one whole word, and into sub-word pieces.",
      steps: 1,
      captions: ["Pick a unit and watch the same word get carved up — and the dictionary size that choice implies."],
      hint: "Switch between the three — sub-words keep the sequence short without an impossibly large dictionary.",
      readoutTitle: "UNIT_TRADEOFF",
      rows: ["DICT SIZE", "SEQUENCE"],
      optionNotes: [
        "Letters — the dictionary is tiny (just the alphabet, digits, punctuation), but a single word becomes a dozen units. Cheap vocabulary, expensive sequences.",
        "Whole words — one entry per word means short sequences, but you'd need hundreds of thousands of entries and you'd still choke on any new or misspelled word.",
        "Sub-words — the winner. Frequent words are single entries; rare words fall back to pieces you've already seen. Small dictionary, short sequences, nothing unknown.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Building the dictionary, one merge at a time",
      intro: "The dictionary isn't written by hand — it's grown by an algorithm called BPE (Byte-Pair Encoding). It has one rule, repeated: find the most common adjacent pair and glue it into a new entry.",
      bullets: [
        "**Start with single characters.** Every word is just a row of letters — the smallest possible dictionary.",
        "**Merge the most frequent pair.** Across the whole corpus, whichever two neighbours appear together most often become one new token.",
        "**Repeat.** Each merge adds one entry to the dictionary — and the words built from it get shorter.",
        "**Frequent words collapse into a single entry.** Watch `newest` shrink from six characters to one token as the merges pile up.",
      ],
      cardLabel: "BPE · MERGE THE MOST FREQUENT PAIR",
      aria: "A Byte-Pair Encoding trainer: a growing dictionary and a sample word shrinking as merges are applied.",
      steps: 1,
      captions: ["Drag the slider to apply merges — the dictionary grows and the sample word gets shorter."],
      hint: "Drag from 0 to 8 merges — the dictionary grows by one entry each step, and `newest` collapses into a single token.",
      readoutTitle: "BPE_STATE",
      rows: ["MERGES", "DICT SIZE", "SAMPLE"],
      sliderNote: "At 0 merges the dictionary is just the characters. Each merge glues the most frequent adjacent pair into a new entry.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Your text, as integer IDs",
      intro: "Once the dictionary exists, reading text is just a lookup: split it into the longest entries that fit, then swap each one for its row number. That number — an integer ID — is all the model ever receives.",
      bullets: [
        "**Type anything below.** This uses the real GPT-4o tokenizer (`o200k`), not a toy — the same dictionary a frontier model uses.",
        "**Each coloured chip is one token; the number under it is its ID.** A space usually rides along at the front of a word.",
        "**Common words are one token; rare words split** into several. Emoji and unusual characters break into raw bytes — several IDs for one symbol.",
      ],
      cardLabel: "REAL TOKENIZER · o200k",
      aria: "A live token tape: the typed text split into coloured token chips, each with its integer ID beneath.",
      steps: 1,
      captions: ["Type, and watch your text become a row of tokens — each one an integer the model looks up."],
      hint: "Type or tap a preset — watch common words stay whole and rare ones shatter into pieces.",
      readoutTitle: "LOOKUP",
      rows: ["TOKENS", "CHARACTERS", "CHARS/TOKEN"],
      readoutNote: "How your text compressed: tokens produced, characters in, and the average characters each token stands for.",
    },
  ],
  n1schemes: ["Letters", "Whole words", "Sub-words"],
  n1dictLabel: "DICTIONARY SIZE",
  n1seqLabel: "SEQUENCE LENGTH",
  n1wordLabel: "THE WORD",
  n1entriesWord: "entries",
  n1piecesWord: "units",
  n2slider: "MERGES APPLIED",
  n2vocabLabel: "DICTIONARY · grows one entry per merge",
  n2sampleLabel: "SAMPLE WORD",
  n2mergeStart: "0 merges — the dictionary is just the raw characters.",
  n2mergeFmt: "merge",
  n2joins: "→",
  n2seen: "seen",
  n2done: "newest is now one whole entry.",
  n2baseLegend: "characters",
  n2mergedLegend: "merged tokens",
  n3inputLabel: "YOUR TEXT",
  n3default: "The newest tokenizers are unbelievably fast 🚀",
  n3loading: "Loading the real tokenizer…",
  n3presetsLabel: "TRY ONE",
  n3presets: [
    { label: "Common vs rare", text: "the antidisestablishmentarianism", note: "`the` is one token; the long rare word shatters into many pieces." },
    { label: "Code", text: "const x = arr.map(n => n * 2);", note: "Symbols, spaces and identifiers each become their own tokens." },
    { label: "Emoji + accents", text: "café ☕ niño 🚀", note: "Accented letters and emoji break into raw bytes — several IDs for one symbol." },
    { label: "Numbers", text: "1234567890", note: "Long numbers split into chunks — a model doesn't see one big number." },
  ],
  n3tapeLabel: "TOKENS · piece over integer id",
  n3idLegend: "each token → one integer id the model receives",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Why do models use sub-word tokens instead of just a dictionary of whole words?",
  explainA: "Because a whole-word dictionary can never be complete — there's always a new name, typo, slang term or snippet of code it has never seen, and it would have no entry for it. Sub-words fix this: frequent words get their own single entry, and anything rare falls back to smaller pieces the dictionary already contains, down to single characters if needed. **BPE** builds that dictionary automatically by repeatedly merging the most common adjacent pair, so the entries end up matching how the language is actually used. The result is a fixed, modest vocabulary (~100k–200k in modern models) that can represent *any* text as a short row of integer IDs — nothing is ever out of vocabulary.",
  bridgeLabel: "NEXT: THE EMBEDDING MATRIX",
  bridgeBody: "Now your text is a row of integer IDs — but an integer means nothing to a network. Next, **the embedding matrix**: how each token ID becomes a vector of numbers that carries the token's *meaning*.",
  prevLesson: "Back: quality filtering",
  nextLesson: "Continue: The embedding matrix",
};

/* ============================================================ SPANISH ======= */

export const tokenDictionaryES: TokenDictionaryLesson = {
  crumb: "ETAPA 0 · 1.3 · EL DICCIONARIO DE TOKENS",
  eyebrow: "ETAPA 0 · 1.3 · 3 NODOS",
  title: "El diccionario de tokens",
  lede: "Un modelo nunca ve tus letras ni tus palabras. Ve tokens — entradas de un diccionario fijo. Así se construye ese diccionario fusionando los pares más comunes, y así tu texto se convierte en una fila de IDs enteros.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Letras, palabras o piezas", "Construir el diccionario", "Texto → IDs enteros"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "¿Letras, palabras o piezas?",
      intro: "Antes de que un modelo pueda leer texto, hay que cortarlo en unidades. Hay tres opciones obvias — y solo una escala.",
      bullets: [
        "**Letras** — un diccionario diminuto (~100 símbolos), pero cada palabra se vuelve una larga cadena de unidades. El modelo tiene que rearmar el significado desde cero.",
        "**Palabras enteras** — secuencias cortas, pero un diccionario gigante — y *se rompe con cualquier palabra que no haya visto*: nombres, erratas, jerga nueva, código.",
        "**Sub-palabras** — el punto medio que todos usan: las palabras comunes quedan enteras, las raras se parten en piezas reutilizables. Nada queda nunca fuera del vocabulario.",
        "**Esta es la decisión de diseño real.** Los modelos estilo GPT eligen sub-palabras — unas 100k–200k en modelos modernos como GPT-4o.",
      ],
      cardLabel: "UNA PALABRA · TRES FORMAS DE PARTIRLA",
      aria: "La palabra tokenization partida de tres formas: en letras, como una palabra entera y en piezas de sub-palabra.",
      steps: 1,
      captions: ["Elige una unidad y mira cómo se corta la misma palabra — y el tamaño de diccionario que implica esa elección."],
      hint: "Alterna entre las tres — las sub-palabras mantienen la secuencia corta sin un diccionario imposiblemente grande.",
      readoutTitle: "UNIT_TRADEOFF",
      rows: ["DICT SIZE", "SEQUENCE"],
      optionNotes: [
        "Letras — el diccionario es diminuto (solo el alfabeto, dígitos, puntuación), pero una sola palabra se vuelve una docena de unidades. Vocabulario barato, secuencias caras.",
        "Palabras enteras — una entrada por palabra da secuencias cortas, pero necesitarías cientos de miles de entradas y aun así te atascarías con cualquier palabra nueva o mal escrita.",
        "Sub-palabras — la ganadora. Las palabras frecuentes son entradas únicas; las raras recurren a piezas que ya viste. Diccionario pequeño, secuencias cortas, nada desconocido.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Construir el diccionario, una fusión a la vez",
      intro: "El diccionario no se escribe a mano — lo hace crecer un algoritmo llamado BPE (Byte-Pair Encoding). Tiene una sola regla, repetida: busca el par adyacente más común y pégalo en una entrada nueva.",
      bullets: [
        "**Empieza con caracteres sueltos.** Cada palabra es solo una fila de letras — el diccionario más pequeño posible.",
        "**Fusiona el par más frecuente.** En todo el corpus, los dos vecinos que más aparecen juntos se vuelven un token nuevo.",
        "**Repite.** Cada fusión añade una entrada al diccionario — y las palabras hechas con él se acortan.",
        "**Las palabras frecuentes se colapsan en una sola entrada.** Mira `newest` encogerse de seis caracteres a un token a medida que se acumulan las fusiones.",
      ],
      cardLabel: "BPE · FUSIONA EL PAR MÁS FRECUENTE",
      aria: "Un entrenador de Byte-Pair Encoding: un diccionario que crece y una palabra de muestra que se encoge al aplicar fusiones.",
      steps: 1,
      captions: ["Arrastra el control para aplicar fusiones — el diccionario crece y la palabra de muestra se acorta."],
      hint: "Arrastra de 0 a 8 fusiones — el diccionario crece una entrada por paso, y `newest` se colapsa en un solo token.",
      readoutTitle: "BPE_STATE",
      rows: ["MERGES", "DICT SIZE", "SAMPLE"],
      sliderNote: "Con 0 fusiones el diccionario es solo los caracteres. Cada fusión pega el par adyacente más frecuente en una entrada nueva.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Tu texto, como IDs enteros",
      intro: "Una vez que el diccionario existe, leer texto es solo una búsqueda: pártelo en las entradas más largas que encajen y cambia cada una por su número de fila. Ese número — un ID entero — es todo lo que el modelo recibe.",
      bullets: [
        "**Escribe lo que quieras abajo.** Esto usa el tokenizador real de GPT-4o (`o200k`), no un juguete — el mismo diccionario que usa un modelo de frontera.",
        "**Cada ficha de color es un token; el número debajo es su ID.** Un espacio suele viajar al inicio de la palabra.",
        "**Las palabras comunes son un token; las raras se parten** en varias. Los emoji y caracteres inusuales se rompen en bytes crudos — varios IDs para un símbolo.",
      ],
      cardLabel: "TOKENIZADOR REAL · o200k",
      aria: "Una cinta de tokens en vivo: el texto escrito partido en fichas de color, cada una con su ID entero debajo.",
      steps: 1,
      captions: ["Escribe y mira tu texto volverse una fila de tokens — cada uno un entero que el modelo busca."],
      hint: "Escribe o toca un ejemplo — mira las palabras comunes quedar enteras y las raras estallar en piezas.",
      readoutTitle: "LOOKUP",
      rows: ["TOKENS", "CHARACTERS", "CHARS/TOKEN"],
      readoutNote: "Cuánto se comprimió tu texto: tokens producidos, caracteres de entrada y el promedio de caracteres que representa cada token.",
    },
  ],
  n1schemes: ["Letras", "Palabras enteras", "Sub-palabras"],
  n1dictLabel: "TAMAÑO DEL DICCIONARIO",
  n1seqLabel: "LARGO DE SECUENCIA",
  n1wordLabel: "LA PALABRA",
  n1entriesWord: "entradas",
  n1piecesWord: "unidades",
  n2slider: "FUSIONES APLICADAS",
  n2vocabLabel: "DICCIONARIO · crece una entrada por fusión",
  n2sampleLabel: "PALABRA DE MUESTRA",
  n2mergeStart: "0 fusiones — el diccionario es solo los caracteres crudos.",
  n2mergeFmt: "fusión",
  n2joins: "→",
  n2seen: "vista",
  n2done: "newest ya es una entrada entera.",
  n2baseLegend: "caracteres",
  n2mergedLegend: "tokens fusionados",
  n3inputLabel: "TU TEXTO",
  n3default: "Los tokenizadores más nuevos son increíblemente rápidos 🚀",
  n3loading: "Cargando el tokenizador real…",
  n3presetsLabel: "PRUEBA UNO",
  n3presets: [
    { label: "Común vs raro", text: "el antidisestablishmentarianism", note: "`el` es un token; la palabra rara y larga estalla en muchas piezas." },
    { label: "Código", text: "const x = arr.map(n => n * 2);", note: "Símbolos, espacios e identificadores se vuelven cada uno su propio token." },
    { label: "Emoji + acentos", text: "café ☕ niño 🚀", note: "Las letras acentuadas y los emoji se rompen en bytes crudos — varios IDs por símbolo." },
    { label: "Números", text: "1234567890", note: "Los números largos se parten en trozos — el modelo no ve un número grande." },
  ],
  n3tapeLabel: "TOKENS · pieza sobre id entero",
  n3idLegend: "cada token → un id entero que el modelo recibe",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "¿Por qué los modelos usan tokens de sub-palabra en vez de un diccionario de palabras enteras?",
  explainA: "Porque un diccionario de palabras enteras nunca puede estar completo — siempre hay un nombre nuevo, una errata, un término de jerga o un fragmento de código que jamás vio, y no tendría entrada para él. Las sub-palabras lo resuelven: las palabras frecuentes tienen su propia entrada única, y lo raro recurre a piezas más pequeñas que el diccionario ya contiene, hasta caracteres sueltos si hace falta. **BPE** construye ese diccionario automáticamente fusionando una y otra vez el par adyacente más común, así las entradas terminan coincidiendo con cómo se usa de verdad el lenguaje. El resultado es un vocabulario fijo y modesto (~100k–200k en modelos modernos) que puede representar *cualquier* texto como una fila corta de IDs enteros — nada queda nunca fuera del vocabulario.",
  bridgeLabel: "SIGUIENTE: LA MATRIZ DE EMBEDDINGS",
  bridgeBody: "Ahora tu texto es una fila de IDs enteros — pero un entero no significa nada para una red. Sigue **la matriz de embeddings**: cómo cada ID de token se vuelve un vector de números que lleva el *significado* del token.",
  prevLesson: "Atrás: filtrado de calidad",
  nextLesson: "Continuar: la matriz de embeddings",
};
