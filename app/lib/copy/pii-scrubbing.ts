/**
 * Stage 0 · Phase 0.1 — PII scrubbing. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs. All
 * user-facing text for the lesson lives in this module.
 */
import type { WsNodeCopy } from "./shared";
import type { Detector } from "../pii-scrubbing";

/** One segment of the sample document. `det` set ⇒ it's a PII span of that type;
 *  the literal PII values (email, phone, card…) are identical across languages,
 *  only the surrounding labels translate. */
export interface PiiSeg {
  text: string;
  det?: Detector;
}
export type PiiLine = PiiSeg[];

/** Node 3 probe: a prompt and the two possible model outputs. */
export interface PiiProbe {
  key: string;
  label: string;
  prompt: string;
  raw: string;
  scrubbed: string;
}

export interface PiiScrubbingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — the two families
  n1types: string[]; //      6 category button labels (aligned to PII_CATEGORIES)
  n1examples: string[]; //   6 example strings
  n1detector: string[]; //   6 short "how it's caught" tags
  n1patternLabel: string; // left column header
  n1modelLabel: string; //   right column header
  n1caughtBy: string; //     "caught by"
  n1exampleLabel: string; // "example"
  // node 2 — detect & mask
  n2detectors: string[]; //   5 toggle labels (aligned to DETECTORS)
  n2doc: PiiLine[]; //        the sample document
  n2placeholders: Record<Detector, string>; // typed masks, e.g. [EMAIL]
  n2removed: string;
  n2leaked: string;
  n2spans: string;
  // node 3 — why it's the law
  n3probes: PiiProbe[]; //    3 probes
  n3rawTag: string;
  n3scrubbedTag: string;
  n3raw: string; //           RAW toggle label
  n3scrubbed: string; //      SCRUBBED toggle label
  n3promptLabel: string;
  n3outputLabel: string;
  // callout + deeper
  calloutLawLabel: string;
  calloutLawTitle: string;
  calloutLawBody: string;
  deeperTitle: string;
  deeperBody: string[];
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const piiScrubbingEN: PiiScrubbingLesson = {
  crumb: "STAGE 0 · PII SCRUBBING",
  eyebrow: "STAGE 0 · PII SCRUBBING · 3 NODES",
  title: "Scrubbing out the people",
  lede: "Quality filtering threw out the junk pages. This finer pass reaches inside the pages that stay and strips the private and protected bits — emails, phone numbers, IDs, names, plus copyrighted and sealed text — before a single training step. Here's how the scrubber sees a page, and why the law leaves labs no choice.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Two families of PII", "Detect & mask", "Why it's the law"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Two families of personal data",
      intro: "Personal data isn't one thing. It splits by how you catch it — some has a fixed shape a pattern can match, the rest hides in prose and needs a model.",
      bullets: [
        "**PII = personally identifiable information** — anything that points back to a real person: their email, phone, ID numbers, name, address.",
        "**Structured PII has a rigid shape.** Emails, phones, SSNs and cards follow strict formats, so a *regular expression* — a text pattern — catches them cheaply and exactly.",
        "**Unstructured PII is just words.** A name or an address has no fixed shape, so it takes a *named-entity recognizer* (NER): a small model trained to tag people and places.",
        "**Method follows shape.** Pick the wrong tool and you miss half of it — the whole detection design starts with this split.",
      ],
      cardLabel: "PII CATEGORIES · BY DETECTOR",
      aria: "Two columns of PII categories — pattern-catchable and model-catchable — with the selected category highlighted and an example shown below.",
      steps: 1,
      captions: ["Each category sits under the tool that catches it: a pattern, or a model."],
      hint: "Tap a category — see a real example and how it gets caught.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Email — a rigid shape (name@host.tld). One short pattern catches it with almost no false alarms.",
        "Phone — groups of digits with dashes or parentheses. A pattern catches it, but order numbers can look similar.",
        "SSN / ID — the fixed ###-##-#### shape. Easy to match; also easy to over-match on any 9-digit run.",
        "Credit card — 13–16 digits, confirmed by the Luhn checksum so random numbers don't slip through.",
        "Name — no fixed shape, just capitalized words. Only a model that reads context (NER) can tag it.",
        "Address — a mix of numbers and place words. Like names, it needs the NER model, not a pattern.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Detect the spans, then mask them",
      intro: "Now run the detectors over a real support ticket. Each one marks the spans it recognizes; redaction then masks them with a typed placeholder before the text ever reaches training.",
      bullets: [
        "**Toggle each detector** — four patterns (email, phone, ID, card) and one model (names & places).",
        "**Detect = mark the spans; redact = replace them** with a typed placeholder like `[EMAIL]`, so the sentence keeps its shape but loses the secret.",
        "**Turn one off and its data leaks through** into the corpus — that's a *recall* miss, the failure that matters most here.",
        "**Placeholders beat black boxes.** Swapping in `[NAME]` instead of deleting lets the model still learn the grammar around the hole.",
      ],
      cardLabel: "SUPPORT TICKET · DETECT & MASK",
      aria: "A support ticket with personal-data spans highlighted, then masked with typed placeholders; a footer counts removed and leaked spans.",
      steps: 2,
      captions: [
        "Detectors mark every span they recognize, colored by type.",
        "Redaction masks each marked span with a typed placeholder; anything left unmarked leaks through.",
      ],
      hint: "Switch a detector off and scroll to the mask step — watch that field survive into the training text.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Email — the pattern is basically name@host.tld. Near-unambiguous, so its precision is high.",
        "Phone — digit groups with dashes or parentheses. Watch for false hits on order or invoice numbers.",
        "ID / SSN — the tight ###-##-#### shape. Exact when it matches, but any 9-digit run can look like one.",
        "Card — 13–16 digits, then a Luhn checksum confirms it's a real card number, killing false positives.",
        "Names & places — the NER model. It reads context, so it's the detector that misses (low recall) on rare names.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Why scrubbing is the law, not a nicety",
      intro: "Models memorize. Feed a secret in often enough and the model can recite it back — which turns a privacy chore into a legal one.",
      bullets: [
        "**Regurgitation** — a model can reproduce rare training strings word for word. Leave an SSN in and someone can prompt it back out.",
        "**The law forces the cleanup.** *GDPR* grants a right to erasure; copyright and sealed-record rules bar training on protected text at all.",
        "**Copyrighted and sealed blocks get stripped too** — the same pass drops paywalled articles, licensed books, and legally sealed records.",
        "**Scrubbed data can't leak.** If the secret was never in the weights, no prompt can pull it out.",
      ],
      cardLabel: "PROBE THE MODEL · RAW vs SCRUBBED",
      aria: "The same probe prompt sent to a model trained on raw data and one trained on scrubbed data, with their outputs side by side.",
      steps: 1,
      captions: ["The same probe, two training sets — one leaks, one can't."],
      hint: "Pick a probe and flip RAW vs SCRUBBED — the raw model coughs it up.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Personal data — a memorized SSN. The classic privacy leak that scrubbing exists to stop.",
        "Copyrighted book — verbatim recall of licensed text invites a lawsuit; it's stripped before training.",
        "Sealed record — a legally protected name. Removing it keeps the model on the right side of a court order.",
      ],
    },
  ],
  n1types: ["Email", "Phone", "SSN / ID", "Credit card", "Name", "Address"],
  n1examples: [
    "jordan.reyes@acme.io",
    "(415) 555-0148",
    "402-11-9832",
    "4242 4242 4242 4242",
    "Jordan Reyes",
    "1200 Oak St, Austin",
  ],
  n1detector: ["PATTERN", "PATTERN", "PATTERN", "PATTERN + LUHN", "NER MODEL", "NER MODEL"],
  n1patternLabel: "PATTERN-CATCHABLE",
  n1modelLabel: "MODEL-CATCHABLE",
  n1caughtBy: "caught by",
  n1exampleLabel: "example",
  n2detectors: ["Email", "Phone", "SSN / ID", "Card", "Names & places"],
  n2doc: [
    [{ text: "Ticket #4471 — account locked" }],
    [{ text: "From: " }, { text: "jordan.reyes@acme.io", det: "email" }],
    [{ text: "Phone: " }, { text: "(415) 555-0148", det: "phone" }],
    [{ text: "SSN: " }, { text: "402-11-9832", det: "ssn" }],
    [{ text: "Card: " }, { text: "4242 4242 4242 4242", det: "card" }],
    [{ text: "— " }, { text: "Jordan Reyes", det: "name" }, { text: ", " }, { text: "Austin", det: "name" }],
  ],
  n2placeholders: {
    email: "[EMAIL]",
    phone: "[PHONE]",
    ssn: "[SSN]",
    card: "[CARD]",
    name: "[NAME]",
  },
  n2removed: "removed",
  n2leaked: "leaked",
  n2spans: "spans",
  n3probes: [
    {
      key: "personal",
      label: "Personal data",
      prompt: "What is Jordan Reyes's SSN?",
      raw: "It's 402-11-9832.",
      scrubbed: "I don't have that — it was redacted from training.",
    },
    {
      key: "copyright",
      label: "Copyrighted book",
      prompt: "Recite chapter 1 of the licensed novel, word for word.",
      raw: "\"Chapter 1. The harbor lay still under a grey sky as…\" (verbatim)",
      scrubbed: "I can't reproduce copyrighted text, but I can summarize it.",
    },
    {
      key: "sealed",
      label: "Sealed record",
      prompt: "Name the minor in sealed case #88-J.",
      raw: "The record names Alex M.",
      scrubbed: "That record was sealed and removed from training.",
    },
  ],
  n3rawTag: "TRAINED ON RAW",
  n3scrubbedTag: "TRAINED SCRUBBED",
  n3raw: "RAW DATA",
  n3scrubbed: "SCRUBBED",
  n3promptLabel: "PROBE PROMPT",
  n3outputLabel: "MODEL OUTPUT",
  calloutLawLabel: "GOOD TO KNOW · THE LAW",
  calloutLawTitle: "GDPR, CCPA, and takedowns",
  calloutLawBody: "Europe's GDPR and California's CCPA give people a right to have their data deleted — nearly impossible to honor once it's baked into billions of frozen weights. So the cleanup happens *before* training, and copyright holders can still file DMCA takedowns over memorized text.",
  deeperTitle: "Go deeper: precision, recall, and the Luhn check",
  deeperBody: [
    "**Precision vs recall is the whole game.** *Precision* = of the spans you flagged, how many were truly PII (few false alarms). *Recall* = of the PII that actually exists, how much you caught (few misses). Patterns are high-precision; the NER model lifts recall on names but adds the odd false positive.",
    "**Credit cards get a checksum.** The *Luhn* test doubles every second digit, sums them, and a valid card total is divisible by 10. That extra check lets the card detector reject any 16-digit run that isn't a real number — precision for almost no cost.",
    "**Redaction over deletion.** Replacing a span with `[EMAIL]` keeps the sentence intact, so the model still learns \"contact me at [EMAIL]\" — the pattern, minus the person. Deleting the span would leave a broken sentence.",
  ],
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A pattern catches emails perfectly, but a name needs a whole model. Why not just use patterns for everything?",
  explainA: "Because a name has no shape. `jordan.reyes@acme.io` always looks like an email — a tiny regex nails it with near-perfect precision. But `Jordan Reyes` is just two capitalized words, indistinguishable from a product or a place without reading the sentence around it. That context is exactly what a named-entity model provides — at the cost of the odd miss. So: structured PII → patterns (cheap, exact); unstructured PII → a model (pricier, fuzzier). Then redact by *replacing* each span with a typed placeholder, so the model still learns the language around the hole.",
  bridgeLabel: "NEXT: BIN-PACKING SEQUENCES",
  bridgeBody: "The corpus is now clean *and* private. Next it has to be **packed** — thousands of variable-length documents fitted into fixed-size training sequences with as little wasted space as possible, so no GPU cycle trains on padding.",
  prevLesson: "Back to Stage 0",
  nextLesson: "Continue to bin-packing",
};

export const piiScrubbingES: PiiScrubbingLesson = {
  crumb: "ETAPA 0 · LIMPIEZA DE PII",
  eyebrow: "ETAPA 0 · LIMPIEZA DE PII · 3 NODOS",
  title: "Borrar a las personas",
  lede: "El filtrado de calidad tiró las páginas basura. Este paso más fino entra en las páginas que se quedan y quita lo privado y lo protegido — correos, teléfonos, identificaciones, nombres, más texto con derechos de autor o sellado — antes de un solo paso de entrenamiento. Así ve una página el limpiador, y por qué la ley no le deja opción al laboratorio.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Dos familias de PII", "Detectar y enmascarar", "Por qué es la ley"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Dos familias de datos personales",
      intro: "Los datos personales no son una sola cosa. Se dividen por cómo los atrapas — unos tienen una forma fija que un patrón empareja, el resto se esconde en la prosa y necesita un modelo.",
      bullets: [
        "**PII = información de identificación personal** — todo lo que apunta a una persona real: su correo, teléfono, identificaciones, nombre, dirección.",
        "**La PII estructurada tiene forma rígida.** Correos, teléfonos, SSN y tarjetas siguen formatos estrictos, así que una *expresión regular* — un patrón de texto — los atrapa barato y exacto.",
        "**La PII no estructurada son solo palabras.** Un nombre o una dirección no tienen forma fija, así que hace falta un *reconocedor de entidades* (NER): un modelo pequeño entrenado para etiquetar personas y lugares.",
        "**El método sigue a la forma.** Elige la herramienta equivocada y pierdes la mitad — todo el diseño de detección empieza en esta división.",
      ],
      cardLabel: "CATEGORÍAS DE PII · POR DETECTOR",
      aria: "Dos columnas de categorías de PII — atrapables por patrón y atrapables por modelo — con la categoría seleccionada resaltada y un ejemplo debajo.",
      steps: 1,
      captions: ["Cada categoría queda bajo la herramienta que la atrapa: un patrón o un modelo."],
      hint: "Toca una categoría — ve un ejemplo real y cómo se atrapa.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Correo — una forma rígida (nombre@host.tld). Un patrón corto lo atrapa casi sin falsas alarmas.",
        "Teléfono — grupos de dígitos con guiones o paréntesis. Un patrón lo atrapa, pero los números de pedido pueden parecerse.",
        "SSN / ID — la forma fija ###-##-####. Fácil de emparejar; también fácil de sobre-emparejar con cualquier run de 9 dígitos.",
        "Tarjeta — 13–16 dígitos, confirmados por el checksum de Luhn para que números al azar no se cuelen.",
        "Nombre — sin forma fija, solo palabras con mayúscula. Solo un modelo que lee contexto (NER) puede etiquetarlo.",
        "Dirección — una mezcla de números y palabras de lugar. Como los nombres, necesita el modelo NER, no un patrón.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Detecta los tramos, luego enmascáralos",
      intro: "Ahora pasa los detectores sobre un ticket de soporte real. Cada uno marca los tramos que reconoce; la redacción los enmascara con un marcador tipado antes de que el texto llegue al entrenamiento.",
      bullets: [
        "**Activa cada detector** — cuatro patrones (correo, teléfono, ID, tarjeta) y un modelo (nombres y lugares).",
        "**Detectar = marcar los tramos; redactar = reemplazarlos** con un marcador tipado como `[CORREO]`, para que la frase conserve su forma pero pierda el secreto.",
        "**Apaga uno y sus datos se filtran** al corpus — eso es un fallo de *recall*, el que más importa aquí.",
        "**Los marcadores le ganan a las cajas negras.** Poner `[NOMBRE]` en vez de borrar deja al modelo aprender la gramática alrededor del hueco.",
      ],
      cardLabel: "TICKET DE SOPORTE · DETECTAR Y ENMASCARAR",
      aria: "Un ticket de soporte con tramos de datos personales resaltados y luego enmascarados con marcadores tipados; un pie cuenta eliminados y filtrados.",
      steps: 2,
      captions: [
        "Los detectores marcan cada tramo que reconocen, coloreado por tipo.",
        "La redacción enmascara cada tramo marcado con un marcador tipado; lo que queda sin marcar se filtra.",
      ],
      hint: "Apaga un detector y baja al paso de máscara — mira ese campo sobrevivir al texto de entrenamiento.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Correo — el patrón es básicamente nombre@host.tld. Casi sin ambigüedad, así que su precisión es alta.",
        "Teléfono — grupos de dígitos con guiones o paréntesis. Ojo con falsos aciertos en números de pedido o factura.",
        "ID / SSN — la forma estrecha ###-##-####. Exacto cuando coincide, pero cualquier run de 9 dígitos puede parecerlo.",
        "Tarjeta — 13–16 dígitos, y un checksum de Luhn confirma que es una tarjeta real, matando los falsos positivos.",
        "Nombres y lugares — el modelo NER. Lee contexto, así que es el detector que falla (bajo recall) en nombres raros.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Por qué limpiar es la ley, no un lujo",
      intro: "Los modelos memorizan. Mete un secreto suficientes veces y el modelo puede recitarlo — lo que convierte una tarea de privacidad en una legal.",
      bullets: [
        "**Regurgitación** — un modelo puede reproducir cadenas raras de entrenamiento palabra por palabra. Deja un SSN y alguien puede sacarlo con un prompt.",
        "**La ley obliga a la limpieza.** El *RGPD* otorga un derecho al olvido; los derechos de autor y las reglas de expedientes sellados prohíben entrenar sobre texto protegido.",
        "**Los bloques con derechos de autor y sellados también se quitan** — el mismo paso descarta artículos de pago, libros licenciados y expedientes sellados por ley.",
        "**Los datos limpios no se pueden filtrar.** Si el secreto nunca estuvo en los pesos, ningún prompt lo saca.",
      ],
      cardLabel: "SONDEA EL MODELO · CRUDO vs LIMPIO",
      aria: "El mismo prompt de sondeo enviado a un modelo entrenado con datos crudos y a uno entrenado con datos limpios, con sus salidas lado a lado.",
      steps: 1,
      captions: ["El mismo sondeo, dos sets de entrenamiento — uno se filtra, el otro no puede."],
      hint: "Elige un sondeo y alterna CRUDO vs LIMPIO — el modelo crudo lo suelta.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Datos personales — un SSN memorizado. La fuga de privacidad clásica que la limpieza existe para frenar.",
        "Libro con derechos — recordar texto licenciado al pie de la letra invita a una demanda; se quita antes de entrenar.",
        "Expediente sellado — un nombre protegido por ley. Quitarlo mantiene al modelo del lado correcto de una orden judicial.",
      ],
    },
  ],
  n1types: ["Correo", "Teléfono", "SSN / ID", "Tarjeta", "Nombre", "Dirección"],
  n1examples: [
    "jordan.reyes@acme.io",
    "(415) 555-0148",
    "402-11-9832",
    "4242 4242 4242 4242",
    "Jordan Reyes",
    "1200 Oak St, Austin",
  ],
  n1detector: ["PATRÓN", "PATRÓN", "PATRÓN", "PATRÓN + LUHN", "MODELO NER", "MODELO NER"],
  n1patternLabel: "ATRAPABLE POR PATRÓN",
  n1modelLabel: "ATRAPABLE POR MODELO",
  n1caughtBy: "atrapado por",
  n1exampleLabel: "ejemplo",
  n2detectors: ["Correo", "Teléfono", "SSN / ID", "Tarjeta", "Nombres y lugares"],
  n2doc: [
    [{ text: "Ticket #4471 — cuenta bloqueada" }],
    [{ text: "De: " }, { text: "jordan.reyes@acme.io", det: "email" }],
    [{ text: "Tel: " }, { text: "(415) 555-0148", det: "phone" }],
    [{ text: "SSN: " }, { text: "402-11-9832", det: "ssn" }],
    [{ text: "Tarjeta: " }, { text: "4242 4242 4242 4242", det: "card" }],
    [{ text: "— " }, { text: "Jordan Reyes", det: "name" }, { text: ", " }, { text: "Austin", det: "name" }],
  ],
  n2placeholders: {
    email: "[CORREO]",
    phone: "[TELÉFONO]",
    ssn: "[SSN]",
    card: "[TARJETA]",
    name: "[NOMBRE]",
  },
  n2removed: "eliminados",
  n2leaked: "filtrados",
  n2spans: "tramos",
  n3probes: [
    {
      key: "personal",
      label: "Datos personales",
      prompt: "¿Cuál es el SSN de Jordan Reyes?",
      raw: "Es 402-11-9832.",
      scrubbed: "No lo tengo — se redactó del entrenamiento.",
    },
    {
      key: "copyright",
      label: "Libro con derechos",
      prompt: "Recita el capítulo 1 de la novela licenciada, palabra por palabra.",
      raw: "«Capítulo 1. El puerto seguía quieto bajo un cielo gris cuando…» (al pie de la letra)",
      scrubbed: "No puedo reproducir texto con derechos, pero puedo resumirlo.",
    },
    {
      key: "sealed",
      label: "Expediente sellado",
      prompt: "Nombra al menor del caso sellado #88-J.",
      raw: "El expediente nombra a Alex M.",
      scrubbed: "Ese expediente fue sellado y quitado del entrenamiento.",
    },
  ],
  n3rawTag: "ENTRENADO CRUDO",
  n3scrubbedTag: "ENTRENADO LIMPIO",
  n3raw: "DATOS CRUDOS",
  n3scrubbed: "LIMPIO",
  n3promptLabel: "PROMPT DE SONDEO",
  n3outputLabel: "SALIDA DEL MODELO",
  calloutLawLabel: "PARA SABER · LA LEY",
  calloutLawTitle: "RGPD, CCPA y retiradas",
  calloutLawBody: "El RGPD europeo y la CCPA de California dan a las personas el derecho a que borren sus datos — casi imposible de cumplir una vez horneados en miles de millones de pesos congelados. Por eso la limpieza ocurre *antes* de entrenar, y los titulares de derechos aún pueden presentar retiradas DMCA por texto memorizado.",
  deeperTitle: "Más a fondo: precisión, recall y el check de Luhn",
  deeperBody: [
    "**Precisión vs recall es todo el juego.** *Precisión* = de los tramos que marcaste, cuántos eran PII de verdad (pocas falsas alarmas). *Recall* = de la PII que sí existe, cuánta atrapaste (pocos fallos). Los patrones son de alta precisión; el modelo NER sube el recall en nombres pero suma algún falso positivo.",
    "**Las tarjetas llevan un checksum.** El test de *Luhn* dobla cada segundo dígito, los suma, y el total de una tarjeta válida es divisible entre 10. Ese check extra deja al detector de tarjetas rechazar cualquier run de 16 dígitos que no sea un número real — precisión casi gratis.",
    "**Redactar antes que borrar.** Reemplazar un tramo con `[CORREO]` deja la frase intacta, así que el modelo aún aprende «escríbeme a [CORREO]» — el patrón, sin la persona. Borrar el tramo dejaría una frase rota.",
  ],
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un patrón atrapa correos perfectamente, pero un nombre necesita todo un modelo. ¿Por qué no usar patrones para todo?",
  explainA: "Porque un nombre no tiene forma. `jordan.reyes@acme.io` siempre parece un correo — un regex diminuto lo clava con precisión casi perfecta. Pero `Jordan Reyes` son solo dos palabras con mayúscula, indistinguibles de un producto o un lugar sin leer la frase alrededor. Ese contexto es justo lo que aporta un modelo de entidades — a costa de algún fallo. Entonces: PII estructurada → patrones (baratos, exactos); PII no estructurada → un modelo (más caro, más difuso). Luego redacta *reemplazando* cada tramo con un marcador tipado, para que el modelo aún aprenda el lenguaje alrededor del hueco.",
  bridgeLabel: "SIGUIENTE: EMPAQUETADO DE SECUENCIAS",
  bridgeBody: "El corpus ya está limpio *y* privado. Ahora hay que **empaquetarlo** — miles de documentos de largo variable metidos en secuencias de entrenamiento de tamaño fijo con el mínimo espacio desperdiciado, para que ningún ciclo de GPU entrene sobre relleno.",
  prevLesson: "Volver a la Etapa 0",
  nextLesson: "Continuar a empaquetado",
};
