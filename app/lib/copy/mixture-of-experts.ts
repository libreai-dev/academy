/**
 * Stage 0 · 2·B — Mixture of Experts (MoE). Interface + EN/ES copy, isolated
 * from every other lesson so edits here never touch theirs.
 *
 * One idea: instead of one big feed-forward per token, a router sends each token
 * to a few specialist "experts" — so the model holds far more parameters while
 * using similar compute per token. Builds on the feed-forward lesson.
 */
import type { WsNodeCopy } from "./shared";

export interface MixtureOfExpertsLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — router + top-K
  n1tokenLabels: string[]; // four token-picker button labels
  n1topk: string; //         top-K slider label
  n1routerLabel: string; //  "ROUTER" drawn in the svg
  n1expertPrefix: string; // "E" drawn before each expert index
  // Node 2 — load balancing
  n2slider: string; //       balance-strength slider label
  n2capacityLabel: string; //"capacity" drawn on the dashed line
  n2expertPrefix: string;
  n2notes: string[]; //      dynamic note, [low, mid, high] balance
  // Node 3 — shared expert
  n3shared: string; //       shared-expert toggle label
  n3routedSlider: string; // routed-experts (top-K) slider label
  n3sharedLabel: string; //  "SHARED" drawn in the svg
  n3expertPrefix: string;
  n3outputLabel: string; //  "OUTPUT" drawn in the svg
  n3tokenGlyph: string; //   the token drawn entering the layer
  // Callout (node 2 aside)
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;
  // Go-deeper (after the nodes)
  deeperTitle: string;
  deeperBody: string;
  // shared chrome
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const mixtureOfExpertsEN: MixtureOfExpertsLesson = {
  crumb: "STAGE 0 · 2·B · MIXTURE OF EXPERTS",
  eyebrow: "STAGE 0 · 2·B · 3 NODES",
  title: "Mixture of Experts",
  lede: "Frontier models are mostly Mixture-of-Experts. Instead of running one giant feed-forward network for every token, a router sends each token to a few specialist experts — so the model can hold far more knowledge while each token costs about the same to run.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Router + top-K", "Load balancing", "The shared expert"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "One router, many experts",
      intro: "A Mixture-of-Experts layer is a pile of small feed-forward networks — the experts — plus a router that picks which few to run for each token.",
      bullets: [
        "**Last lesson, one big feed-forward network ran for every token.** MoE replaces it with many smaller ones, the *experts*.",
        "**A tiny *router* scores the token against each expert** and sends it to only the top few — *top-K*. The rest stay switched off for that token.",
        "**More experts means more total knowledge at the same cost per token.** An 8-expert, top-2 layer holds about 4× the feed-forward parameters of a dense one, while each token still runs just 2 experts — roughly double the work.",
        "**The {ring} green bars are the router's scores.** Change the token and the top experts change; raise top-K to run more of them.",
      ],
      cardLabel: "TOKEN → ROUTER → TOP-K EXPERTS",
      aria: "A token entering a router that scores eight experts and lights up the top few.",
      steps: 1,
      captions: ["The router scores every expert for this token; the top-K light up and run — the rest are skipped."],
      hint: "Switch the token, then raise or lower top-K — watch which experts light up.",
      readoutTitle: "ROUTING",
      rows: ["EXPERTS", "ACTIVE", "PARAMS USED"],
      readoutNote: "How many experts exist, how many run for this token, and the share of the layer's feed-forward parameters that touches — the rest stay idle.",
      optionNotes: [
        "A code token leans on the experts that specialised on code — a different set than a plain word picks.",
        "A Japanese character routes to different experts again — specialisation is learned from data, not assigned by hand.",
        "Even a common word has a favourite set of experts. Node 3 shows why routing the basics is wasteful.",
        "A number token picks its own experts. Each kind of token carves its own path through the layer.",
      ],
      sliderNote: "top-K is how many experts each token runs. Higher K = more compute per token for usually a small quality gain; most models use 1 or 2.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Stop everyone piling onto one expert",
      intro: "Left to itself, the router plays favourites — a few experts get swamped while others sit idle and never learn.",
      bullets: [
        "**Nothing forces balance.** Early in training the router finds a few experts it likes and keeps sending tokens there.",
        "**Swamped experts overflow.** Each expert has a *capacity* — a cap per batch. Tokens over the cap are *dropped*: they skip the layer entirely (shown in red).",
        "**Idle experts are wasted parameters** — and they never improve, because they almost never see a token.",
        "**An extra *load-balance loss* fixes it.** It penalises lopsided routing, nudging the router to spread tokens evenly. Slide it up.",
      ],
      cardLabel: "TOKENS PER EXPERT · ONE BATCH",
      aria: "A bar chart of tokens routed to each expert, with a dashed capacity line and red dropped overflow.",
      steps: 1,
      captions: ["Each bar is one expert's token load; the dashed line is its capacity, and red is overflow that gets dropped."],
      hint: "Drag the balance strength up from 0 — the load evens out and the dropped (red) tokens vanish.",
      readoutTitle: "LOAD",
      rows: ["BUSIEST", "IDLE", "DROPPED"],
      readoutNote: "The most-loaded expert, how many experts are nearly idle, and how many of the batch's 512 tokens overflowed capacity and were dropped.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "One expert that's always on",
      intro: "Some knowledge — grammar, punctuation, the most common words — every token needs. Routing that to a specialist wastes the router's picks.",
      bullets: [
        "**Without a shared expert, every routed expert relearns the common stuff** — the same basics duplicated across all of them (the grey band).",
        "**A *shared expert* runs for every token, always** — no routing decision. It holds the common knowledge once.",
        "**Now the routed experts are free to specialise** on the rarer, harder patterns, and a top-K slot isn't burned on the basics.",
        "**This is the modern design** (DeepSeek-V3 and others): one always-on shared expert alongside the routed ones.",
      ],
      cardLabel: "SHARED EXPERT + ROUTED EXPERTS",
      aria: "A token feeding an always-on shared expert plus its top-K routed experts, summed into the output.",
      steps: 1,
      captions: ["The token always runs the shared expert, plus its top-K routed experts; their outputs are summed."],
      hint: "Toggle the shared expert off — each routed expert sprouts a grey 'common' band, the duplicated basics.",
      readoutTitle: "SHARED",
      rows: [],
      optionNotes: [
        "Shared expert off: each routed expert carries a duplicated 'common' band (grey) — capacity spent on basics every other expert also learned.",
        "Shared expert on: the common knowledge lives in one always-on expert (green), so the routed experts hold only their specialty.",
      ],
    },
  ],
  n1tokenLabels: ["Code", "CJK char", "Common word", "Number"],
  n1topk: "TOP-K · EXPERTS PER TOKEN",
  n1routerLabel: "ROUTER",
  n1expertPrefix: "E",
  n2slider: "BALANCE STRENGTH α",
  n2capacityLabel: "capacity",
  n2expertPrefix: "E",
  n2notes: [
    "No balancing: a couple of experts hoard the tokens, overflow their capacity, and the rest sit idle.",
    "The load-balance loss is kicking in — the spread is flattening and fewer tokens are dropped.",
    "Balanced: every expert carries a similar load, nothing overflows, and no capacity is wasted.",
  ],
  n3shared: "SHARED EXPERT",
  n3routedSlider: "ROUTED EXPERTS · top-K",
  n3sharedLabel: "SHARED",
  n3expertPrefix: "E",
  n3outputLabel: "OUTPUT",
  n3tokenGlyph: "the",
  calloutLabel: "GOOD TO KNOW · CAPACITY",
  calloutTitle: "Why tokens get dropped",
  calloutBody: "Each expert gets a fixed number of slots per batch — usually 1.25× the average, the *capacity factor*. It keeps the maths a fixed shape the GPU can run efficiently. If routing is lopsided, popular experts run out of slots and the extra tokens are skipped for that layer — a real cost of poor balancing.",
  deeperTitle: "The load-balance loss, precisely",
  deeperBody: "For a batch, let fᵢ be the fraction of tokens routed to expert i and Pᵢ the router's average probability on expert i. The auxiliary loss is L = α · N · Σᵢ fᵢ · Pᵢ. It is smallest when both are uniform (1/N each), so gradient descent pushes routing toward an even split. α (typically ~0.01) sets how hard — set it too high and the router balances at the expense of picking the *right* expert. Newer models such as DeepSeek-V3 drop this loss and instead add a learned per-expert bias to the gate, nudged up for under-used experts — balancing with no gradient tug-of-war against the main objective.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A Mixture-of-Experts model can hold many times the parameters of a dense model but cost about the same to run per token. How?",
  explainA: "Because parameters and compute are decoupled. Every expert adds to the model's total parameters — its *capacity* to store knowledge — but a token only runs the top-K experts the router picks (usually 1 or 2), so the compute per token tracks K, not the number of experts. An 8-expert, top-2 layer holds ~4× the feed-forward parameters of a dense layer while doing ~2× the feed-forward work per token; a bigger model with 256 experts at top-8 holds far more still at similar cost. The catches are real: you must **balance the load** so the router doesn't collapse onto a few favourites, and the idle experts still cost memory. A **shared expert** then absorbs the common knowledge so the routed ones can truly specialise.",
  bridgeLabel: "NEXT: CONSTRAINED DECODING",
  bridgeBody: "Every layer so far shapes the numbers that become the *next-token* scores. Next, **constrained decoding**: forcing those scores to obey a grammar so the model can only emit valid JSON, SQL, or whatever schema you demand.",
  prevLesson: "Back: FlashAttention & GQA",
  nextLesson: "Continue to constrained decoding",
};

/* ============================================================ SPANISH ======= */

export const mixtureOfExpertsES: MixtureOfExpertsLesson = {
  crumb: "ETAPA 0 · 2·B · MEZCLA DE EXPERTOS",
  eyebrow: "ETAPA 0 · 2·B · 3 NODOS",
  title: "Mezcla de expertos",
  lede: "Los modelos de frontera son en su mayoría Mezcla de Expertos. En vez de correr una red feed-forward gigante para cada token, un enrutador manda cada token a unos pocos expertos especialistas — así el modelo guarda mucho más conocimiento mientras cada token cuesta casi lo mismo de correr.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Enrutador + top-K", "Balanceo de carga", "El experto compartido"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Un enrutador, muchos expertos",
      intro: "Una capa de Mezcla de Expertos es un montón de redes feed-forward pequeñas — los expertos — más un enrutador que elige cuáles pocas correr para cada token.",
      bullets: [
        "**La lección anterior corría una red feed-forward grande para cada token.** MoE la reemplaza por muchas pequeñas, los *expertos*.",
        "**Un *enrutador* diminuto puntúa el token contra cada experto** y lo manda solo a los mejores pocos — *top-K*. El resto quedan apagados para ese token.",
        "**Más expertos = más conocimiento total al mismo costo por token.** Una capa de 8 expertos a top-2 guarda unos 4× los parámetros feed-forward de una densa, mientras cada token corre solo 2 expertos — casi el doble de trabajo.",
        "**Las {ring} barras verdes son las puntuaciones del enrutador.** Cambia el token y cambian los mejores expertos; sube top-K para correr más.",
      ],
      cardLabel: "TOKEN → ENRUTADOR → TOP-K EXPERTOS",
      aria: "Un token entrando a un enrutador que puntúa ocho expertos e ilumina los mejores pocos.",
      steps: 1,
      captions: ["El enrutador puntúa cada experto para este token; los top-K se iluminan y corren — el resto se omiten."],
      hint: "Cambia el token, luego sube o baja top-K — mira qué expertos se iluminan.",
      readoutTitle: "ROUTING",
      rows: ["EXPERTOS", "ACTIVOS", "PARÁMS USADOS"],
      readoutNote: "Cuántos expertos existen, cuántos corren para este token, y la porción de los parámetros feed-forward de la capa que se toca — el resto queda inactivo.",
      optionNotes: [
        "Un token de código se apoya en los expertos que se especializaron en código — un set distinto al que elige una palabra.",
        "Un carácter japonés se enruta a otros expertos — la especialización se aprende de los datos, no se asigna a mano.",
        "Hasta una palabra común tiene su set favorito de expertos. El Nodo 3 muestra por qué enrutar lo básico es un desperdicio.",
        "Un token numérico elige sus propios expertos. Cada tipo de token traza su propio camino por la capa.",
      ],
      sliderNote: "top-K es cuántos expertos corre cada token. K más alto = más cómputo por token para una ganancia de calidad casi siempre pequeña; la mayoría usa 1 o 2.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Que no se amontonen todos en un experto",
      intro: "Si lo dejas solo, el enrutador tiene favoritos — unos pocos expertos se saturan mientras otros quedan inactivos y nunca aprenden.",
      bullets: [
        "**Nada obliga al balance.** Temprano en el entrenamiento el enrutador encuentra unos expertos que le gustan y sigue mandándoles tokens.",
        "**Los expertos saturados desbordan.** Cada experto tiene una *capacidad* — un tope por lote. Los tokens sobre el tope se *descartan*: se saltan la capa entera (en rojo).",
        "**Los expertos inactivos son parámetros desperdiciados** — y nunca mejoran, porque casi no ven tokens.",
        "**Una *pérdida de balanceo de carga* extra lo arregla.** Penaliza el enrutamiento desigual y empuja al enrutador a repartir parejo. Súbela.",
      ],
      cardLabel: "TOKENS POR EXPERTO · UN LOTE",
      aria: "Un gráfico de barras de tokens enrutados a cada experto, con una línea de capacidad punteada y el desborde rojo descartado.",
      steps: 1,
      captions: ["Cada barra es la carga de un experto; la línea punteada es su capacidad, y el rojo es el desborde que se descarta."],
      hint: "Sube la fuerza de balanceo desde 0 — la carga se empareja y los tokens descartados (rojos) desaparecen.",
      readoutTitle: "LOAD",
      rows: ["MÁS CARGADO", "INACTIVOS", "DESCARTADOS"],
      readoutNote: "El experto más cargado, cuántos expertos quedan casi inactivos, y cuántos de los 512 tokens del lote desbordaron la capacidad y se descartaron.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Un experto que siempre está encendido",
      intro: "Algo de conocimiento — gramática, puntuación, las palabras más comunes — lo necesita cada token. Enrutar eso a un especialista desperdicia las elecciones del enrutador.",
      bullets: [
        "**Sin un experto compartido, cada experto enrutado reaprende lo común** — lo básico duplicado en todos ellos (la banda gris).",
        "**Un *experto compartido* corre para cada token, siempre** — sin decisión de enrutamiento. Guarda el conocimiento común una sola vez.",
        "**Ahora los expertos enrutados quedan libres para especializarse** en los patrones más raros y difíciles, y no se quema un cupo de top-K en lo básico.",
        "**Este es el diseño moderno** (DeepSeek-V3 y otros): un experto compartido siempre encendido junto a los enrutados.",
      ],
      cardLabel: "EXPERTO COMPARTIDO + EXPERTOS ENRUTADOS",
      aria: "Un token alimentando un experto compartido siempre encendido más sus expertos enrutados top-K, sumados en la salida.",
      steps: 1,
      captions: ["El token siempre corre el experto compartido, más sus expertos enrutados top-K; sus salidas se suman."],
      hint: "Apaga el experto compartido — cada experto enrutado brota una banda gris 'común', lo básico duplicado.",
      readoutTitle: "SHARED",
      rows: [],
      optionNotes: [
        "Experto compartido apagado: cada experto enrutado carga una banda 'común' duplicada (gris) — capacidad gastada en básicos que todos los demás también aprendieron.",
        "Experto compartido encendido: el conocimiento común vive en un experto siempre encendido (verde), así los enrutados guardan solo su especialidad.",
      ],
    },
  ],
  n1tokenLabels: ["Código", "Carácter CJK", "Palabra común", "Número"],
  n1topk: "TOP-K · EXPERTOS POR TOKEN",
  n1routerLabel: "ENRUTADOR",
  n1expertPrefix: "E",
  n2slider: "FUERZA DE BALANCEO α",
  n2capacityLabel: "capacidad",
  n2expertPrefix: "E",
  n2notes: [
    "Sin balanceo: un par de expertos acaparan los tokens, desbordan su capacidad, y el resto quedan inactivos.",
    "La pérdida de balanceo empieza a actuar — el reparto se aplana y se descartan menos tokens.",
    "Balanceado: cada experto lleva una carga parecida, nada desborda, y no se desperdicia capacidad.",
  ],
  n3shared: "EXPERTO COMPARTIDO",
  n3routedSlider: "EXPERTOS ENRUTADOS · top-K",
  n3sharedLabel: "COMPART.",
  n3expertPrefix: "E",
  n3outputLabel: "SALIDA",
  n3tokenGlyph: "the",
  calloutLabel: "PARA SABER · CAPACIDAD",
  calloutTitle: "Por qué se descartan tokens",
  calloutBody: "Cada experto recibe un número fijo de cupos por lote — normalmente 1.25× el promedio, el *factor de capacidad*. Mantiene la matemática con una forma fija que la GPU corre eficientemente. Si el enrutamiento es desigual, los expertos populares se quedan sin cupos y los tokens extra se saltan esa capa — un costo real del mal balanceo.",
  deeperTitle: "La pérdida de balanceo, con precisión",
  deeperBody: "Para un lote, sea fᵢ la fracción de tokens enrutados al experto i y Pᵢ la probabilidad media del enrutador sobre el experto i. La pérdida auxiliar es L = α · N · Σᵢ fᵢ · Pᵢ. Es mínima cuando ambas son uniformes (1/N cada una), así que el descenso de gradiente empuja el enrutamiento hacia un reparto parejo. α (típicamente ~0.01) fija cuán fuerte — muy alta y el enrutador balancea a costa de elegir el experto *correcto*. Modelos más nuevos como DeepSeek-V3 quitan esta pérdida y en su lugar añaden un sesgo por experto aprendido en la compuerta, subido para los expertos poco usados — balanceo sin un tira y afloja de gradientes contra el objetivo principal.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo de Mezcla de Expertos puede guardar muchas veces los parámetros de un modelo denso pero costar casi lo mismo por token. ¿Cómo?",
  explainA: "Porque los parámetros y el cómputo están desacoplados. Cada experto suma a los parámetros totales del modelo — su *capacidad* para guardar conocimiento — pero un token solo corre los top-K expertos que el enrutador elige (normalmente 1 o 2), así que el cómputo por token depende de K, no del número de expertos. Una capa de 8 expertos a top-2 guarda ~4× los parámetros feed-forward de una capa densa mientras hace ~2× el trabajo feed-forward por token; un modelo mayor con 256 expertos a top-8 guarda mucho más aún a costo parecido. Los inconvenientes son reales: hay que **balancear la carga** para que el enrutador no colapse en unos favoritos, y los expertos inactivos igual cuestan memoria. Un **experto compartido** absorbe entonces el conocimiento común para que los enrutados puedan especializarse de verdad.",
  bridgeLabel: "SIGUIENTE: DECODIFICACIÓN RESTRINGIDA",
  bridgeBody: "Cada capa hasta ahora moldea los números que se vuelven las puntuaciones del *siguiente token*. Sigue la **decodificación restringida**: forzar esas puntuaciones a obedecer una gramática para que el modelo solo pueda emitir JSON, SQL o el esquema válido que exijas.",
  prevLesson: "Atrás: FlashAttention y GQA",
  nextLesson: "Continuar a decodificación restringida",
};
