/**
 * Stage 0 · 0.6 — Bin-packing for training. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: cleaned text is pre-tokenized once, stitched into one stream with
 * end-of-document markers, and packed into fixed-length token blocks so a GPU
 * batch wastes zero compute on padding. Builds on 0.5's token dictionary
 * (text → integer IDs) — referenced, not re-taught.
 */
import type { WsNodeCopy } from "./shared";

export interface BinPackingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — pre-tokenize
  n1slider: string;
  n1onFlyLabel: string;
  n1preLabel: string;
  n1idleLabel: string;
  n1trainLabel: string;
  // Node 2 — concatenate + <eos>
  n2eosToggle: string;
  n2eosOn: string;
  n2eosOff: string;
  n2shuffleToggle: string;
  n2docLegend: string;
  n2eosLegend: string;
  n2noteEosOn: string;
  n2noteEosOff: string;
  calloutEosLabel: string;
  calloutEosTitle: string;
  calloutEosBody: string;
  // Node 3 — pack into blocks
  n3slider: string;
  n3padLabel: string;
  n3packLabel: string;
  n3wasted: string;
  n3blockWord: string;
  n3deeperTitle: string;
  n3deeperBody: string;
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

export const binPackingEN: BinPackingLesson = {
  crumb: "STAGE 0 · 0.6 · BIN-PACKING FOR TRAINING",
  eyebrow: "STAGE 0 · 0.6 · 3 NODES",
  title: "Bin-packing for training",
  lede: "A GPU wants to chew through fat, uniform batches with nothing wasted. This is how clean text becomes exactly that — pre-tokenized once, stitched into one stream with document markers, and packed into fixed-length blocks with zero padding.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Tokenize once", "Stitch with <eos>", "Pack into blocks"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Tokenize once, not every step",
      intro:
        "Earlier we turned text into integer token IDs. That lookup is cheap per document — but running it live, mid-training, would leave the GPUs waiting on the CPU. So the whole corpus is tokenized once, up front, and only the integers are saved.",
      bullets: [
        "**Tokenizing is CPU work; training is GPU work.** If the GPU pauses every step while the CPU prepares the next batch, the most expensive hardware in the building sits idle.",
        "**Do it once, ahead of time.** Every cleaned document is converted to token IDs in a single offline pass, spread across many CPU workers in parallel.",
        "**Save the integers, not the text.** Training then reads ready-made IDs straight from disk — there is no tokenizer in the hot loop.",
        "**The faster the GPU, the worse the stall.** A quicker GPU finishes each step sooner, so a fixed CPU delay eats a bigger share — pre-tokenizing only matters more over time.",
      ],
      cardLabel: "TOKENIZE-IN-LOOP vs PRE-TOKENIZED",
      aria: "Two training timelines: tokenizing every step leaves GPU-idle gaps; pre-tokenizing removes them.",
      steps: 1,
      captions: ["Raise the GPU speed and watch the in-loop timeline stall while the pre-tokenized one stays busy."],
      hint: "Drag the GPU speed up — the in-loop GPU idle climbs while the pre-tokenized path stays at 0%.",
      readoutTitle: "PIPELINE",
      rows: ["IN-LOOP", "PRE-TOKENIZED"],
      sliderNote:
        "A fixed CPU delay costs the GPU the same time each step. As the GPU gets faster, that delay becomes a bigger fraction of the step — so its idle time climbs, while pre-tokenized stays at zero.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Stitch the documents into one stream",
      intro:
        "Millions of documents arrive in wildly different lengths. Instead of training on each one alone, they're shuffled and joined head-to-tail into a single long stream of token IDs, with a special end-of-sequence marker between them.",
      bullets: [
        "**One giant sequence.** Every pre-tokenized document is concatenated into a single row of integer IDs.",
        "**`<eos>` marks each boundary.** A reserved token — one dedicated dictionary entry — sits between documents so the model can tell where one ends and learns to stop.",
        "**Shuffle first.** Documents are shuffled before stitching, so neighbouring text rarely comes from the same source.",
        "**Drop the marker and texts bleed together** — the model would learn to run a recipe straight into a news report.",
      ],
      cardLabel: "ONE CONTINUOUS STREAM",
      aria: "A stream of coloured document tokens joined by green end-of-sequence markers.",
      steps: 1,
      captions: ["Toggle the markers and shuffle the order to see the single stream re-form."],
      hint: "Toggle the markers off to watch the documents bleed together; shuffle to reorder them.",
      readoutTitle: "STREAM",
      rows: ["DOCS", "TOKENS"],
      optionNotes: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Pack the stream into fixed blocks",
      intro:
        "Training wants uniform rectangles — every example the same length so they stack into one GPU batch. So the stream is sliced into equal blocks of L tokens. Because it's one continuous stream, every block comes out completely full.",
      bullets: [
        "**Fixed block length `L`.** Cut the stream every `L` tokens (in practice 2,048–8,192). Every block is exactly full.",
        "**0% padding.** Packing from a continuous stream means no block is ever short — unlike padding each document separately, which fills the gaps with wasted filler tokens.",
        "**Stored as a memory-mapped `.bin` + `.idx`.** The IDs are one flat binary file; a tiny index records where each block starts, so any block loads instantly without scanning the rest.",
        "**A block may span an `<eos>`** — that's fine; the marker inside teaches the model where one document ends and the next begins.",
      ],
      cardLabel: "PAD EACH DOC vs PACK THE STREAM",
      aria: "Two layouts of the same tokens: padding each document wastes grey filler; packing the stream fills every block.",
      steps: 1,
      captions: ["Drag L and compare: padded rows fill with grey filler; packed rows stay completely full."],
      hint: "Drag the block length — the padded layout wastes more filler as L grows, while packing stays at 0%.",
      readoutTitle: "PACKING",
      rows: ["PADDED WASTE", "PACKED WASTE", "BLOCKS"],
      readoutNote:
        "Same tokens, two layouts: how much of each fixed L-token slot is wasted filler, and how many completely-full blocks packing produces.",
      sliderNote:
        "Padding pads every document out to L, so shorter documents waste more as L grows. Packing slices one stream, so nothing is padded — the leftover tail just carries to the next shard.",
    },
  ],
  n1slider: "GPU SPEED ×",
  n1onFlyLabel: "Tokenize each step",
  n1preLabel: "Pre-tokenized once",
  n1idleLabel: "GPU idle (waiting on CPU)",
  n1trainLabel: "GPU training",
  n2eosToggle: "Show <eos>",
  n2eosOn: "ON",
  n2eosOff: "OFF",
  n2shuffleToggle: "Shuffle",
  n2docLegend: "each colour = one document",
  n2eosLegend: "<eos> = document boundary",
  n2noteEosOn: "Every document ends in a green <eos> marker. The model reads it as 'this thought is finished' and learns to stop — even when the next document is stitched right behind it.",
  n2noteEosOff: "With the markers gone, the documents run together into one blur. The model can't tell where one ends, so it learns to slide from a recipe straight into a news report.",
  calloutEosLabel: "GOOD TO KNOW · SPECIAL TOKENS",
  calloutEosTitle: "<eos> is just another dictionary entry",
  calloutEosBody:
    "The end-of-sequence marker isn't magic — it's one reserved ID in the same token dictionary from the last lesson. The model learns what it means from seeing it at every document boundary: this thought is finished. The same trick gives models `<pad>`, `<bos>`, and the chat-role markers you'll meet later.",
  n3slider: "BLOCK LENGTH L",
  n3padLabel: "Pad each document",
  n3packLabel: "Pack the stream",
  n3wasted: "wasted",
  n3blockWord: "blocks",
  n3deeperTitle: "Won't a block mixing two documents confuse the model?",
  n3deeperBody:
    "By default, no — the model reads the whole block and the `<eos>` teaches it that the thread resets there. Many pipelines go further with **document masking** (also called intra-document attention): inside a packed block, each token may only attend back to tokens from its own document, never across an `<eos>`. That keeps packing's zero-waste efficiency while making a packed block behave exactly like separate documents. It costs a custom attention mask, which is why simpler runs skip it and lean on the `<eos>` alone.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Padding each document to a fixed length is simpler to code. Why do frontier labs pack a continuous stream instead?",
  explainA:
    "Because padding wastes GPU time on filler that carries no signal. A document that's half the block length spends half of every step multiplying `<pad>` tokens the model must ignore — and at web scale, across trillions of tokens and thousands of GPUs, that idle half is millions of dollars. Packing removes the waste entirely: the corpus is pre-tokenized once, concatenated into one stream with `<eos>` marking every boundary, then sliced into equal, completely-full blocks. Every token in every batch is real training signal, and a small `.idx` lets any block load instantly from the memory-mapped `.bin`. The one subtlety — two documents sharing a block — is handled by the `<eos>` marker, or optionally a document mask that stops attention crossing it.",
  bridgeLabel: "NEXT: POSITIONS (RoPE)",
  bridgeBody:
    "Every block is now a full row of L token IDs — but the model still has no idea which token came first. Next, **rotary position embeddings (RoPE)**: the math that tells attention where each token sits in the block.",
  prevLesson: "Back: PII scrubbing",
  nextLesson: "Continue: Positions (RoPE)",
};

/* ============================================================ SPANISH ======= */

export const binPackingES: BinPackingLesson = {
  crumb: "ETAPA 0 · 0.6 · EMPAQUETADO PARA ENTRENAR",
  eyebrow: "ETAPA 0 · 0.6 · 3 NODOS",
  title: "Empaquetado para entrenar",
  lede: "Una GPU quiere devorar lotes gordos y uniformes sin nada desperdiciado. Así se convierte el texto limpio exactamente en eso — tokenizado una sola vez, cosido en un flujo con marcadores de documento y empaquetado en bloques de largo fijo con cero relleno.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Tokenizar una vez", "Coser con <eos>", "Empaquetar en bloques"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Tokenizar una vez, no en cada paso",
      intro:
        "Antes convertimos el texto en IDs de token. Esa búsqueda es barata por documento — pero hacerla en vivo, durante el entrenamiento, dejaría a las GPU esperando a la CPU. Así que todo el corpus se tokeniza una sola vez, por adelantado, y solo se guardan los enteros.",
      bullets: [
        "**Tokenizar es trabajo de CPU; entrenar es trabajo de GPU.** Si la GPU se detiene en cada paso mientras la CPU prepara el siguiente lote, el hardware más caro del edificio queda ocioso.",
        "**Hazlo una vez, por adelantado.** Cada documento limpio se convierte a IDs de token en una sola pasada offline, repartida en muchos workers de CPU en paralelo.",
        "**Guarda los enteros, no el texto.** El entrenamiento lee entonces IDs ya listos directo del disco — no hay tokenizador en el bucle caliente.",
        "**Cuanto más rápida la GPU, peor el atasco.** Una GPU más veloz termina cada paso antes, así que un retraso fijo de CPU se come una porción mayor — pre-tokenizar solo importa más con el tiempo.",
      ],
      cardLabel: "TOKENIZAR-EN-BUCLE vs PRE-TOKENIZADO",
      aria: "Dos líneas de tiempo de entrenamiento: tokenizar en cada paso deja huecos de GPU ociosa; pre-tokenizar los elimina.",
      steps: 1,
      captions: ["Sube la velocidad de la GPU y mira la línea en-bucle atascarse mientras la pre-tokenizada sigue ocupada."],
      hint: "Sube la velocidad de la GPU — la GPU ociosa en-bucle crece mientras la vía pre-tokenizada se queda en 0%.",
      readoutTitle: "PIPELINE",
      rows: ["EN-BUCLE", "PRE-TOKENIZADO"],
      sliderNote:
        "Un retraso fijo de CPU le cuesta a la GPU el mismo tiempo cada paso. A medida que la GPU se acelera, ese retraso es una fracción mayor del paso — así que su tiempo ocioso sube, mientras que pre-tokenizado se queda en cero.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Cose los documentos en un solo flujo",
      intro:
        "Llegan millones de documentos de largos muy distintos. En vez de entrenar con cada uno por separado, se barajan y se unen de punta a punta en un único flujo largo de IDs de token, con un marcador especial de fin de secuencia entre ellos.",
      bullets: [
        "**Una secuencia gigante.** Cada documento pre-tokenizado se concatena en una sola fila de IDs enteros.",
        "**`<eos>` marca cada frontera.** Un token reservado — una entrada dedicada del diccionario — se pone entre documentos para que el modelo sepa dónde termina uno y aprenda a parar.",
        "**Baraja primero.** Los documentos se barajan antes de coser, para que el texto vecino rara vez venga de la misma fuente.",
        "**Quita el marcador y los textos se mezclan** — el modelo aprendería a pasar de una receta directo a una noticia.",
      ],
      cardLabel: "UN FLUJO CONTINUO",
      aria: "Un flujo de tokens de documento de colores unidos por marcadores verdes de fin de secuencia.",
      steps: 1,
      captions: ["Alterna los marcadores y baraja el orden para ver el flujo único rehacerse."],
      hint: "Apaga los marcadores para ver los documentos mezclarse; baraja para reordenarlos.",
      readoutTitle: "STREAM",
      rows: ["DOCS", "TOKENS"],
      optionNotes: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Empaqueta el flujo en bloques fijos",
      intro:
        "El entrenamiento quiere rectángulos uniformes — cada ejemplo del mismo largo para que se apilen en un lote de GPU. Así que el flujo se corta en bloques iguales de L tokens. Como es un flujo continuo, cada bloque sale completamente lleno.",
      bullets: [
        "**Largo de bloque fijo `L`.** Corta el flujo cada `L` tokens (en la práctica 2.048–8.192). Cada bloque queda exactamente lleno.",
        "**0% de relleno.** Empaquetar desde un flujo continuo significa que ningún bloque queda corto — a diferencia de rellenar cada documento por separado, que llena los huecos con tokens de relleno desperdiciados.",
        "**Guardado como un `.bin` + `.idx` mapeado en memoria.** Los IDs son un archivo binario plano; un índice diminuto registra dónde empieza cada bloque, así cualquiera se carga al instante sin recorrer el resto.",
        "**Un bloque puede cruzar un `<eos>`** — no pasa nada; el marcador dentro le enseña al modelo dónde termina un documento y empieza el siguiente.",
      ],
      cardLabel: "RELLENAR CADA DOC vs EMPAQUETAR EL FLUJO",
      aria: "Dos disposiciones de los mismos tokens: rellenar cada documento desperdicia relleno gris; empaquetar el flujo llena cada bloque.",
      steps: 1,
      captions: ["Arrastra L y compara: las filas rellenadas se llenan de relleno gris; las empaquetadas quedan llenas."],
      hint: "Arrastra el largo de bloque — la disposición rellenada desperdicia más a medida que L crece, mientras que empaquetar se queda en 0%.",
      readoutTitle: "PACKING",
      rows: ["RELLENO", "EMPAQUE", "BLOQUES"],
      readoutNote:
        "Los mismos tokens, dos disposiciones: cuánto de cada ranura fija de L tokens es relleno desperdiciado, y cuántos bloques completamente llenos produce el empaquetado.",
      sliderNote:
        "Rellenar acolcha cada documento hasta L, así que los más cortos desperdician más al crecer L. Empaquetar corta un solo flujo, así que nada se rellena — el sobrante de la cola simplemente pasa al siguiente shard.",
    },
  ],
  n1slider: "VELOCIDAD GPU ×",
  n1onFlyLabel: "Tokenizar cada paso",
  n1preLabel: "Pre-tokenizado una vez",
  n1idleLabel: "GPU ociosa (esperando a la CPU)",
  n1trainLabel: "GPU entrenando",
  n2eosToggle: "Mostrar <eos>",
  n2eosOn: "SÍ",
  n2eosOff: "NO",
  n2shuffleToggle: "Barajar",
  n2docLegend: "cada color = un documento",
  n2eosLegend: "<eos> = frontera de documento",
  n2noteEosOn: "Cada documento termina en un marcador verde <eos>. El modelo lo lee como 'esta idea terminó' y aprende a parar — aun cuando el siguiente documento va cosido justo detrás.",
  n2noteEosOff: "Sin los marcadores, los documentos se juntan en una sola mancha. El modelo no distingue dónde termina uno, así que aprende a deslizarse de una receta directo a una noticia.",
  calloutEosLabel: "PARA SABER · TOKENS ESPECIALES",
  calloutEosTitle: "<eos> es solo otra entrada del diccionario",
  calloutEosBody:
    "El marcador de fin de secuencia no es magia — es un ID reservado en el mismo diccionario de tokens de la lección anterior. El modelo aprende qué significa al verlo en cada frontera de documento: esta idea terminó. El mismo truco da a los modelos `<pad>`, `<bos>` y los marcadores de rol de chat que verás más adelante.",
  n3slider: "LARGO DE BLOQUE L",
  n3padLabel: "Rellenar cada documento",
  n3packLabel: "Empaquetar el flujo",
  n3wasted: "desperdicio",
  n3blockWord: "bloques",
  n3deeperTitle: "¿Un bloque que mezcla dos documentos no confunde al modelo?",
  n3deeperBody:
    "Por defecto, no — el modelo lee el bloque entero y el `<eos>` le enseña que el hilo se reinicia ahí. Muchos pipelines van más lejos con el **enmascarado de documento** (también llamado atención intra-documento): dentro de un bloque empaquetado, cada token solo puede atender hacia atrás a tokens de su propio documento, nunca cruzando un `<eos>`. Eso conserva la eficiencia de cero desperdicio del empaquetado y hace que un bloque empaquetado se comporte exactamente como documentos separados. Cuesta una máscara de atención a medida, por eso las corridas más simples lo omiten y se apoyan solo en el `<eos>`.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Rellenar cada documento a un largo fijo es más simple de programar. ¿Por qué los laboratorios de frontera empaquetan un flujo continuo en su lugar?",
  explainA:
    "Porque el relleno desperdicia tiempo de GPU en paja que no lleva señal. Un documento que mide la mitad del bloque pasa la mitad de cada paso multiplicando tokens `<pad>` que el modelo debe ignorar — y a escala web, entre billones de tokens y miles de GPU, esa mitad ociosa son millones de dólares. El empaquetado elimina el desperdicio por completo: el corpus se pre-tokeniza una vez, se concatena en un flujo con `<eos>` marcando cada frontera, y luego se corta en bloques iguales y completamente llenos. Cada token de cada lote es señal de entrenamiento real, y un pequeño `.idx` deja cargar cualquier bloque al instante desde el `.bin` mapeado en memoria. El único detalle — dos documentos compartiendo un bloque — lo resuelve el marcador `<eos>`, o de forma opcional una máscara de documento que impide que la atención lo cruce.",
  bridgeLabel: "SIGUIENTE: POSICIONES (RoPE)",
  bridgeBody:
    "Cada bloque es ahora una fila llena de L IDs de token — pero el modelo aún no tiene idea de qué token vino primero. Sigue **los embeddings rotatorios de posición (RoPE)**: la matemática que le dice a la atención dónde se sienta cada token en el bloque.",
  prevLesson: "Atrás: limpieza de PII",
  nextLesson: "Continuar: Posiciones (RoPE)",
};
