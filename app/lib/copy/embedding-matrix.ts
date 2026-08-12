/**
 * Stage 1 · 1.3 — The embedding matrix. Interface + EN/ES copy, isolated from
 * every other lesson so edits here never touch theirs. All user-facing text for
 * this article lives in this file (both languages, full parity). The numeric
 * data (ids, vectors, coordinates) lives in app/lib/embedding-matrix.ts.
 */
import type { WsNodeCopy } from "./shared";

export interface EmbeddingMatrixLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  /** The 13 displayed tokens, index-aligned to app/lib/embedding-matrix.ts. */
  words: string[];
  /** Legend / cluster names: animals · royalty · numbers · food. */
  clusters: string[];
  // Node 1 — the lookup
  n1pick: string;
  n1note: string;
  n1matrixTitle: string; // in-diagram
  n1vectorTitle: string; // in-diagram
  n1dims: string; //        in-diagram
  n1rowWas: string; //      in-diagram: "row {id}"
  // Node 2 — meaning as coordinates
  n2focus: string;
  // Node 3 — it is learned
  n3before: string;
  n3after: string;
  n3beforeTag: string; // in-diagram
  n3afterTag: string; //  in-diagram
  // wrap-up
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLabel: string;
  nextLabel: string;
}

export const embeddingMatrixEN: EmbeddingMatrixLesson = {
  crumb: "STAGE 0 · 1.3 · THE EMBEDDING MATRIX",
  eyebrow: "STAGE 0 · 1.3 · 3 NODES",
  title: "The embedding matrix",
  lede: "A token is just an ID — a number. Before a model can do anything with it, that number becomes a list of numbers by looking it up in one giant, learned table. This is that table, and why similar words end up as near-neighbours.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The lookup", "Meaning as coordinates", "Learned, not given"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "A token ID picks a row",
      intro:
        "Think of a Python list you index by number. The embedding matrix is exactly that — one row per token — and the token ID is the index.",
      bullets: [
        "**One row per token.** The vocabulary is the rows; the model learns them during training.",
        "**The token ID is the row number.** Token 9127 → read row 9127. No math, just a lookup.",
        "**That row of numbers *is* the vector** — the token's meaning written as coordinates the model can compute with.",
        "**Real rows are long** — hundreds to thousands of numbers. We show 8 so the whole row fits.",
      ],
      cardLabel: "TOKEN ID → ROW → VECTOR",
      aria: "A vocabulary matrix with one highlighted row shown blown up as a bar-chart vector.",
      steps: 1,
      captions: ["Pick a token; its row lights up and becomes the vector on the right."],
      hint: "Pick any token — the matrix lights that row and blows it up into the bars: that row is the vector.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Meaning becomes a position",
      intro:
        "Now every token is a point in space, so 'closeness' means 'similar'. The model learns to park related tokens near each other.",
      bullets: [
        "**Each dot is one token's vector**, squashed down to 2D so it fits on screen.",
        "**Neighbours share meaning.** Pick a word and its nearest points are things that mean something similar.",
        "**Clusters form on their own** — animals here, numbers there. Nobody labelled them; training pulled them together.",
      ],
      cardLabel: "THE MEANING MAP · pick a word to see its neighbours",
      aria: "A 2D scatter of word vectors; a chosen word is linked to its nearest neighbours.",
      steps: 4,
      captions: [
        "cat's neighbours are other animals.",
        "king sits by queen and prince.",
        "three is next to one and two.",
        "bread groups with apple and cheese.",
      ],
      hint: "Switch the focus word — the green lines connect it to its nearest neighbours, which share its meaning.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "“cat” lands with dog, wolf and kitten — the model learned they're all animals.",
        "“king” sits beside queen and prince — royalty clusters together.",
        "“three” is next to one and two — numbers share a neighbourhood.",
        "“bread” neighbours apple and cheese — foods group up.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The table is learned, not given",
      intro:
        "The matrix doesn't start out meaningful. It begins as random numbers, and training slowly slides the rows into place.",
      bullets: [
        "**Before training: random.** Every row is noise, so the map is a shapeless cloud.",
        "**Training nudges the rows** — words used in similar ways get pulled together, over billions of examples.",
        "**After training: organised.** The same map now has clean clusters — meaning, learned straight from raw text.",
      ],
      cardLabel: "BEFORE vs AFTER TRAINING",
      aria: "The same word points shown as a random cloud before training and as clusters after.",
      steps: 2,
      captions: [
        "Before training: random rows, a shapeless cloud.",
        "After training: the same words, pulled into clusters.",
      ],
      hint: "Flip between before and after — watch the random cloud collapse into meaning-based clusters.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Random start: the rows are just noise, so the points scatter with no pattern.",
        "After training: similar words have been pulled together into clusters — that's the meaning.",
      ],
    },
  ],
  words: ["cat", "dog", "wolf", "kitten", "king", "queen", "prince", "one", "two", "three", "apple", "bread", "cheese"],
  clusters: ["Animals", "Royalty", "Numbers", "Food"],
  n1pick: "PICK A TOKEN",
  n1note:
    "Every token has one fixed row. Picking a token is just reading its row — that row of numbers is the vector the rest of the model works with.",
  n1matrixTitle: "VOCABULARY — one row per token",
  n1vectorTitle: "THIS ROW = THE VECTOR",
  n1dims: "8 of hundreds shown",
  n1rowWas: "row",
  n2focus: "FOCUS WORD",
  n3before: "Before training",
  n3after: "After training",
  n3beforeTag: "random — no structure yet",
  n3afterTag: "clustered by meaning",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A token ID is just a number like 9127. How does the model turn it into 'meaning'?",
  explainA:
    "It looks it up. The model's first layer is a giant learned table — the embedding matrix — with one row per token. The ID is the row number, and that row is a list of numbers: the token's vector. Those numbers start out random, and training moves them so tokens used in similar ways end up close together. So 'meaning' here is just a position in space, and similar words share a neighbourhood.",
  bridgeLabel: "NEXT · THE TRANSFORMER BLOCK",
  bridgeBody:
    "Now every token is a vector. Next, **the transformer block** — how those vectors look at each other and mix, so a word's meaning can shift with the words around it.",
  prevLabel: "Back: the token dictionary",
  nextLabel: "Continue: the transformer block",
};

export const embeddingMatrixES: EmbeddingMatrixLesson = {
  crumb: "ETAPA 0 · 1.3 · LA MATRIZ DE EMBEDDINGS",
  eyebrow: "ETAPA 0 · 1.3 · 3 NODOS",
  title: "La matriz de embeddings",
  lede: "Un token es solo un ID — un número. Antes de que el modelo pueda hacer nada con él, ese número se convierte en una lista de números al buscarlo en una tabla gigante y aprendida. Esta es esa tabla, y por qué las palabras parecidas terminan siendo vecinas.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["La búsqueda", "El significado como posición", "Aprendida, no dada"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Un ID de token elige una fila",
      intro:
        "Piensa en una lista de Python que indexas por número. La matriz de embeddings es justo eso — una fila por token — y el ID del token es el índice.",
      bullets: [
        "**Una fila por token.** El vocabulario son las filas; el modelo las aprende durante el entrenamiento.",
        "**El ID del token es el número de fila.** Token 9127 → lee la fila 9127. Sin matemáticas, solo una búsqueda.",
        "**Esa fila de números *es* el vector** — el significado del token escrito como coordenadas con las que el modelo puede calcular.",
        "**Las filas reales son largas** — de cientos a miles de números. Mostramos 8 para que quepa la fila entera.",
      ],
      cardLabel: "ID DE TOKEN → FILA → VECTOR",
      aria: "Una matriz de vocabulario con una fila resaltada, mostrada ampliada como un vector de barras.",
      steps: 1,
      captions: ["Elige un token; su fila se ilumina y se convierte en el vector de la derecha."],
      hint: "Elige cualquier token — la matriz ilumina esa fila y la amplía en las barras: esa fila es el vector.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El significado se vuelve una posición",
      intro:
        "Ahora cada token es un punto en el espacio, así que 'cercanía' significa 'parecido'. El modelo aprende a colocar los tokens relacionados unos cerca de otros.",
      bullets: [
        "**Cada punto es el vector de un token**, comprimido a 2D para que quepa en pantalla.",
        "**Los vecinos comparten significado.** Elige una palabra y sus puntos más cercanos son cosas que significan algo parecido.",
        "**Los grupos se forman solos** — animales por aquí, números por allá. Nadie los etiquetó; el entrenamiento los juntó.",
      ],
      cardLabel: "EL MAPA DE SIGNIFICADO · elige una palabra para ver sus vecinos",
      aria: "Un diagrama de dispersión 2D de vectores de palabras; una palabra elegida se une a sus vecinos más cercanos.",
      steps: 4,
      captions: [
        "los vecinos de gato son otros animales.",
        "rey queda junto a reina y príncipe.",
        "tres está al lado de uno y dos.",
        "pan se agrupa con manzana y queso.",
      ],
      hint: "Cambia la palabra en foco — las líneas verdes la conectan con sus vecinos más cercanos, que comparten su significado.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "“gato” cae con perro, lobo y gatito — el modelo aprendió que todos son animales.",
        "“rey” queda junto a reina y príncipe — la realeza se agrupa.",
        "“tres” está al lado de uno y dos — los números comparten vecindario.",
        "“pan” vecino de manzana y queso — las comidas se agrupan.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "La tabla se aprende, no se da",
      intro:
        "La matriz no empieza teniendo significado. Empieza como números al azar, y el entrenamiento desliza las filas a su sitio poco a poco.",
      bullets: [
        "**Antes de entrenar: al azar.** Cada fila es ruido, así que el mapa es una nube sin forma.",
        "**El entrenamiento empuja las filas** — las palabras usadas de forma parecida se juntan, a lo largo de miles de millones de ejemplos.",
        "**Después de entrenar: organizado.** El mismo mapa ahora tiene grupos limpios — significado, aprendido directo del texto crudo.",
      ],
      cardLabel: "ANTES vs DESPUÉS DE ENTRENAR",
      aria: "Los mismos puntos de palabras como nube al azar antes de entrenar y como grupos después.",
      steps: 2,
      captions: [
        "Antes de entrenar: filas al azar, una nube sin forma.",
        "Después de entrenar: las mismas palabras, juntadas en grupos.",
      ],
      hint: "Alterna entre antes y después — mira cómo la nube al azar se colapsa en grupos por significado.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Inicio al azar: las filas son solo ruido, así que los puntos se dispersan sin patrón.",
        "Tras entrenar: las palabras parecidas se juntaron en grupos — ese es el significado.",
      ],
    },
  ],
  words: ["gato", "perro", "lobo", "gatito", "rey", "reina", "príncipe", "uno", "dos", "tres", "manzana", "pan", "queso"],
  clusters: ["Animales", "Realeza", "Números", "Comida"],
  n1pick: "ELIGE UN TOKEN",
  n1note:
    "Cada token tiene una fila fija. Elegir un token es solo leer su fila — esa fila de números es el vector con el que trabaja el resto del modelo.",
  n1matrixTitle: "VOCABULARIO — una fila por token",
  n1vectorTitle: "ESTA FILA = EL VECTOR",
  n1dims: "8 de cientos mostrados",
  n1rowWas: "fila",
  n2focus: "PALABRA EN FOCO",
  n3before: "Antes de entrenar",
  n3after: "Después de entrenar",
  n3beforeTag: "al azar — aún sin estructura",
  n3afterTag: "agrupado por significado",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un ID de token es solo un número como 9127. ¿Cómo lo convierte el modelo en 'significado'?",
  explainA:
    "Lo busca. La primera capa del modelo es una tabla gigante y aprendida — la matriz de embeddings — con una fila por token. El ID es el número de fila, y esa fila es una lista de números: el vector del token. Esos números empiezan al azar, y el entrenamiento los mueve para que los tokens usados de forma parecida terminen cerca. Así que aquí el 'significado' es solo una posición en el espacio, y las palabras parecidas comparten vecindario.",
  bridgeLabel: "SIGUIENTE · EL BLOQUE TRANSFORMER",
  bridgeBody:
    "Ahora cada token es un vector. Sigue **el bloque transformer** — cómo esos vectores se miran entre sí y se mezclan, para que el significado de una palabra cambie con las palabras de alrededor.",
  prevLabel: "Volver: el diccionario de tokens",
  nextLabel: "Continuar: el bloque transformer",
};
