/**
 * Stage 0 · Test-time search. Interface + EN/ES copy for the article, isolated
 * from every other lesson so edits here never touch theirs.
 *
 * One idea: spend more compute at INFERENCE to get better answers — sample many
 * and keep the best (Best-of-N), or search a tree of reasoning paths (MCTS),
 * judged by a scorer. Builds on the Sampling strategies lesson (temperature).
 */
import type { WsNodeCopy } from "./shared";

export interface TestTimeSearchLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — Best-of-N
  n1slider: string; //     "SAMPLES (N)"
  n1title: string; //      diagram section title
  n1keptLabel: string; //  "kept"
  // Node 2 — Tree search (MCTS)
  n2slider: string; //     "SEARCH BUDGET"
  n2steps: string[]; //    one note per budget 0..4
  n2title: string; //      diagram section title
  n2valueLabel: string; // "value estimate"
  n2legendValue: string;
  n2legendBest: string;
  // Node 3 — the trade-off
  n3slider: string; //     "COMPUTE BUDGET"
  n3bonLabel: string; //   "Best-of-N"
  n3treeLabel: string; //  "Tree search"
  n3budgetWord: string; // "calls"
  n3qualityWord: string; //"best score"
  n3note: string;
  // Deeper blocks
  deeper1Title: string;
  deeper1Body: string;
  deeper2Title: string;
  deeper2Body: string;
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

export const testTimeSearchEN: TestTimeSearchLesson = {
  crumb: "STAGE 0 · TEST-TIME SEARCH",
  eyebrow: "STAGE 0 · TEST-TIME SEARCH · 3 NODES",
  title: "Test-time search",
  lede: "A trained model gives one answer per prompt — unless you spend more compute at inference. Generate many answers and keep the best, or search a tree of reasoning paths. Same frozen weights, better answers, more compute.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Best-of-N", "Tree search (MCTS)", "The trade-off"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Best-of-N: sample many, keep the best",
      intro: "The simplest way to spend more compute at inference: don't settle for the first answer. Sample N of them, then keep the single best.",
      bullets: [
        "**Sample N answers** to the same prompt with a non-zero **temperature** — the randomness knob from the Sampling strategies lesson — so each one comes out different.",
        "**Score each with a reward model** — a second model trained to grade answers — and keep the highest scorer.",
        "**Quality climbs with N**, fast at first: the best of 12 tries beats the best of 2. But every extra sample is another full generation.",
        "**It's the baseline for test-time compute** — no training, just a scorer and a loop, and often shockingly effective.",
      ],
      cardLabel: "BEST-OF-N · N SAMPLES, ONE KEPT",
      aria: "A list of N candidate answers, each with a reward score, the highest scorer highlighted.",
      steps: 1,
      captions: ["Raise N and watch more candidates appear — the best score can only rise or hold."],
      hint: "Drag N from 1 to 12 — more tries buy a better best answer, but the average barely moves.",
      readoutTitle: "BEST_OF_N",
      rows: ["SAMPLES", "BEST SCORE", "MEAN"],
      readoutNote: "What N samples bought: how many you generated, the best reward score among them, and the average (which barely improves — you're selecting, not improving each answer).",
      sliderNote: "Each extra sample is a full generation. The best score jumps early, then plateaus — classic diminishing returns.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Tree search: spend the budget where it pays",
      intro: "Best-of-N generates every candidate in full, then throws most away. Tree search is smarter — it scores partial reasoning and pours compute into the branches that look promising.",
      bullets: [
        "**Reasoning is a tree.** Each step forks into a few next steps; a full answer is one path from root to leaf.",
        "**A value model scores partial paths** — a guess at the final quality — so you don't have to finish a branch to judge it.",
        "**Spend the budget best-first** — the heart of **MCTS** (Monte-Carlo Tree Search): expand the most promising node, score its children, repeat.",
        "**You reach the best leaf without generating them all** — the win over Best-of-N when finishing an answer is expensive.",
      ],
      cardLabel: "TREE SEARCH · EXPAND THE PROMISING BRANCH",
      aria: "A reasoning tree that reveals branches as the search budget grows, with the best root-to-leaf path highlighted.",
      steps: 1,
      captions: ["Raise the budget and watch the search expand the promising branch first, finding a 90 without touching the rest."],
      hint: "Drag the budget from 0 to 4 — the search scores every first step, then digs into the best one before the others.",
      readoutTitle: "TREE_SEARCH",
      rows: ["EXPANSIONS", "NODES", "BEST PATH"],
      readoutNote: "The state of the search: expansions spent, tree nodes revealed so far, and the score of the best complete path found.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The trade-off: compute for quality",
      intro: "More inference compute buys more quality — but not for free, and not forever. Here's the same budget spent two ways.",
      bullets: [
        "**Both curves rise, then flatten.** The first few samples help a lot; the twentieth barely moves the score.",
        "**Tree search gets more quality per unit compute** — it prunes dead branches instead of finishing them.",
        "**But it needs a value model and more plumbing.** Best-of-N needs nothing but a scorer and a for-loop.",
        "**The real trade-off is compute vs latency vs quality** — spend it where the answer is worth the wait.",
      ],
      cardLabel: "SAME BUDGET, TWO METHODS",
      aria: "Two quality bars — Best-of-N and tree search — filling as the compute budget rises, tree search staying higher.",
      steps: 1,
      captions: ["Raise the compute budget and compare: tree search stays above Best-of-N, and both level off."],
      hint: "Slide the budget up — quality climbs fast, then flattens; tree search stays ahead the whole way.",
      readoutTitle: "TRADE_OFF",
      rows: [],
      readoutNote: "",
    },
  ],
  n1slider: "SAMPLES (N)",
  n1title: "N candidate answers · scored by a reward model",
  n1keptLabel: "kept",
  n2slider: "SEARCH BUDGET (expansions)",
  n2steps: [
    "Just the prompt. Nothing has been explored yet.",
    "Score the first step of each branch with the value model — a cheap guess at how promising each path is. B looks best.",
    "Spend the budget on the most promising branch (B) first, expanding only its children. It already finds a 90.",
    "Expand branch A too — its best leaf (62) is worse. The budget was better spent on B.",
    "Expand the last branch, C. Nothing beats B's 90 — but a flat Best-of-N would have generated all six answers in full to find it.",
  ],
  n2title: "One reasoning tree · value estimates → final scores",
  n2valueLabel: "value",
  n2legendValue: "value estimate (partial path)",
  n2legendBest: "best path found",
  n3slider: "COMPUTE BUDGET",
  n3bonLabel: "Best-of-N",
  n3treeLabel: "Tree search",
  n3budgetWord: "model calls",
  n3qualityWord: "best score",
  n3note: "Illustrative scores — the shape (rise then flatten, tree above Best-of-N) is the real lesson, not the exact numbers.",
  deeper1Title: "Best-of-N and the reward-hacking ceiling",
  deeper1Body: "Best-of-N is really `argmax` over N samples of the reward model's score. Push N high enough and you stop selecting *good* answers and start selecting answers that *fool the reward model* — the reported score keeps rising while true quality falls. This is **reward over-optimization**, and it tracks the KL divergence between the base model and the selected distribution: the further Best-of-N drifts from the base policy, the more the proxy reward and the true reward come apart. In practice N in the low tens is the sweet spot. (Best-of-N is also distinct from `pass@k`, which asks whether *any* of k samples is correct — an upper bound you can only cash in with a verifier.)",
  deeper2Title: "How MCTS picks which node to expand",
  deeper2Body: "At each step MCTS selects the child that maximizes a score like `Q(s,a) + c·√(ln N(s) / N(s,a))` — the first term is the node's estimated value (*exploit*), the second grows for rarely-visited nodes (*explore*), and `c` tunes the balance. In LLM reasoning the value term comes from a learned **value** or **process reward model** that scores partial chains of thought, and the random rollout that ends a classic MCTS is often replaced by that model's estimate. The whole point is to dodge the exponential blow-up of expanding every branch down to its leaves.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "You have a fixed inference budget. When is tree search worth the extra machinery over plain Best-of-N?",
  explainA: "When finishing an answer is expensive and you can tell early whether a path is going nowhere. Best-of-N generates every candidate in full before scoring, so much of its compute goes into answers it will throw away. Tree search scores *partial* reasoning with a value model and pours the budget into the promising branches — reaching a strong answer without ever completing the weak ones. The catch is the machinery: tree search needs a value (or process reward) model and a search loop, while Best-of-N needs only a scorer and a loop. Rule of thumb: cheap answers or no value model → **Best-of-N**; long, costly reasoning where partial progress is judgeable → **tree search**.",
  bridgeLabel: "NEXT: MIXED PRECISION",
  bridgeBody: "Searching at inference means running the model many times — so every run has to be cheap. Next, **mixed precision**: storing and multiplying weights in fewer bits (FP16, BF16, FP8) to make each of those forward passes faster and smaller.",
  prevLesson: "Back: tool calling",
  nextLesson: "Continue: mixed precision",
};

/* ============================================================ SPANISH ======= */

export const testTimeSearchES: TestTimeSearchLesson = {
  crumb: "ETAPA 0 · BÚSQUEDA EN INFERENCIA",
  eyebrow: "ETAPA 0 · BÚSQUEDA EN INFERENCIA · 3 NODOS",
  title: "Búsqueda en inferencia",
  lede: "Un modelo entrenado da una respuesta por prompt — a menos que gastes más cómputo en la inferencia. Genera muchas respuestas y quédate con la mejor, o busca en un árbol de razonamientos. Los mismos pesos congelados, mejores respuestas, más cómputo.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Best-of-N", "Búsqueda en árbol (MCTS)", "El compromiso"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Best-of-N: muestrea muchas, quédate con la mejor",
      intro: "La forma más simple de gastar más cómputo en la inferencia: no te conformes con la primera respuesta. Muestrea N de ellas y quédate con la mejor.",
      bullets: [
        "**Muestrea N respuestas** al mismo prompt con una **temperatura** distinta de cero — la perilla de azar de la lección de Estrategias de muestreo — para que cada una salga distinta.",
        "**Puntúa cada una con un modelo de recompensa** — un segundo modelo entrenado para calificar respuestas — y quédate con la de mayor puntaje.",
        "**La calidad sube con N**, rápido al principio: la mejor de 12 intentos supera a la mejor de 2. Pero cada muestra extra es otra generación completa.",
        "**Es la línea base del cómputo en inferencia** — sin entrenamiento, solo un puntuador y un bucle, y a menudo sorprendentemente eficaz.",
      ],
      cardLabel: "BEST-OF-N · N MUESTRAS, UNA ELEGIDA",
      aria: "Una lista de N respuestas candidatas, cada una con un puntaje de recompensa, con la de mayor puntaje resaltada.",
      steps: 1,
      captions: ["Sube N y mira aparecer más candidatas — el mejor puntaje solo puede subir o mantenerse."],
      hint: "Arrastra N de 1 a 12 — más intentos compran una mejor respuesta, pero el promedio casi no se mueve.",
      readoutTitle: "BEST_OF_N",
      rows: ["MUESTRAS", "MEJOR PUNTAJE", "PROMEDIO"],
      readoutNote: "Lo que compraron N muestras: cuántas generaste, el mejor puntaje de recompensa entre ellas y el promedio (que casi no mejora — estás seleccionando, no mejorando cada respuesta).",
      sliderNote: "Cada muestra extra es una generación completa. El mejor puntaje salta al inicio y luego se estanca — rendimientos decrecientes clásicos.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Búsqueda en árbol: gasta el presupuesto donde rinde",
      intro: "Best-of-N genera cada candidata entera y luego tira casi todas. La búsqueda en árbol es más lista — puntúa razonamientos parciales y vuelca cómputo en las ramas que se ven prometedoras.",
      bullets: [
        "**El razonamiento es un árbol.** Cada paso se bifurca en varios pasos siguientes; una respuesta completa es un camino de la raíz a una hoja.",
        "**Un modelo de valor puntúa caminos parciales** — una estimación de la calidad final — para no tener que terminar una rama para juzgarla.",
        "**Gasta el presupuesto primero en lo mejor** — el corazón de **MCTS** (Monte-Carlo Tree Search): expande el nodo más prometedor, puntúa sus hijos, repite.",
        "**Llegas a la mejor hoja sin generarlas todas** — la ventaja sobre Best-of-N cuando terminar una respuesta es caro.",
      ],
      cardLabel: "BÚSQUEDA EN ÁRBOL · EXPANDE LA RAMA PROMETEDORA",
      aria: "Un árbol de razonamiento que revela ramas al crecer el presupuesto de búsqueda, con el mejor camino raíz-hoja resaltado.",
      steps: 1,
      captions: ["Sube el presupuesto y mira la búsqueda expandir primero la rama prometedora, hallando un 90 sin tocar el resto."],
      hint: "Arrastra el presupuesto de 0 a 4 — la búsqueda puntúa cada primer paso y luego cava en el mejor antes que en los demás.",
      readoutTitle: "TREE_SEARCH",
      rows: ["EXPANSIONES", "NODOS", "MEJOR CAMINO"],
      readoutNote: "El estado de la búsqueda: expansiones gastadas, nodos del árbol revelados hasta ahora y el puntaje del mejor camino completo hallado.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "El compromiso: cómputo por calidad",
      intro: "Más cómputo en inferencia compra más calidad — pero no gratis, y no para siempre. Aquí está el mismo presupuesto gastado de dos formas.",
      bullets: [
        "**Ambas curvas suben y luego se aplanan.** Las primeras muestras ayudan mucho; la vigésima casi no mueve el puntaje.",
        "**La búsqueda en árbol logra más calidad por unidad de cómputo** — poda ramas muertas en vez de terminarlas.",
        "**Pero necesita un modelo de valor y más plomería.** Best-of-N no necesita más que un puntuador y un bucle.",
        "**El compromiso real es cómputo vs latencia vs calidad** — gástalo donde la respuesta valga la espera.",
      ],
      cardLabel: "MISMO PRESUPUESTO, DOS MÉTODOS",
      aria: "Dos barras de calidad — Best-of-N y búsqueda en árbol — que se llenan al subir el presupuesto, con el árbol más alto.",
      steps: 1,
      captions: ["Sube el presupuesto de cómputo y compara: la búsqueda en árbol se mantiene sobre Best-of-N, y ambas se nivelan."],
      hint: "Sube el presupuesto — la calidad trepa rápido y luego se aplana; la búsqueda en árbol va adelante todo el camino.",
      readoutTitle: "TRADE_OFF",
      rows: [],
      readoutNote: "",
    },
  ],
  n1slider: "MUESTRAS (N)",
  n1title: "N respuestas candidatas · puntuadas por un modelo de recompensa",
  n1keptLabel: "elegida",
  n2slider: "PRESUPUESTO DE BÚSQUEDA (expansiones)",
  n2steps: [
    "Solo el prompt. Nada se ha explorado aún.",
    "Puntúa el primer paso de cada rama con el modelo de valor — una estimación barata de qué tan prometedor es cada camino. B se ve mejor.",
    "Gasta el presupuesto primero en la rama más prometedora (B), expandiendo solo sus hijos. Ya encuentra un 90.",
    "Expande también la rama A — su mejor hoja (62) es peor. El presupuesto rindió más en B.",
    "Expande la última rama, C. Nada supera el 90 de B — pero un Best-of-N plano habría generado las seis respuestas enteras para hallarlo.",
  ],
  n2title: "Un árbol de razonamiento · estimaciones de valor → puntajes finales",
  n2valueLabel: "valor",
  n2legendValue: "estimación de valor (camino parcial)",
  n2legendBest: "mejor camino hallado",
  n3slider: "PRESUPUESTO DE CÓMPUTO",
  n3bonLabel: "Best-of-N",
  n3treeLabel: "Búsqueda en árbol",
  n3budgetWord: "llamadas al modelo",
  n3qualityWord: "mejor puntaje",
  n3note: "Puntajes ilustrativos — la forma (subir y luego aplanarse, el árbol sobre Best-of-N) es la lección real, no los números exactos.",
  deeper1Title: "Best-of-N y el techo del reward hacking",
  deeper1Body: "Best-of-N es en realidad un `argmax` sobre N muestras del puntaje del modelo de recompensa. Sube N lo suficiente y dejas de seleccionar respuestas *buenas* y empiezas a seleccionar respuestas que *engañan al modelo de recompensa* — el puntaje reportado sigue subiendo mientras la calidad real cae. Esto es la **sobreoptimización de la recompensa**, y sigue la divergencia KL entre el modelo base y la distribución seleccionada: cuanto más se aleja Best-of-N de la política base, más se separan la recompensa proxy y la real. En la práctica N en las decenas bajas es el punto justo. (Best-of-N también difiere de `pass@k`, que pregunta si *alguna* de k muestras es correcta — una cota superior que solo cobras con un verificador.)",
  deeper2Title: "Cómo MCTS elige qué nodo expandir",
  deeper2Body: "En cada paso MCTS elige el hijo que maximiza un puntaje como `Q(s,a) + c·√(ln N(s) / N(s,a))` — el primer término es el valor estimado del nodo (*explotar*), el segundo crece para los nodos poco visitados (*explorar*), y `c` ajusta el equilibrio. En el razonamiento con LLM el término de valor viene de un **modelo de valor** o **modelo de recompensa de proceso** aprendido que puntúa cadenas de pensamiento parciales, y el rollout aleatorio que cierra un MCTS clásico suele reemplazarse por la estimación de ese modelo. Todo el objetivo es esquivar la explosión exponencial de expandir cada rama hasta sus hojas.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Tienes un presupuesto de inferencia fijo. ¿Cuándo vale la búsqueda en árbol la maquinaria extra frente a un Best-of-N simple?",
  explainA: "Cuando terminar una respuesta es caro y puedes saber pronto si un camino no lleva a nada. Best-of-N genera cada candidata entera antes de puntuar, así que mucho de su cómputo va a respuestas que tirará. La búsqueda en árbol puntúa el razonamiento *parcial* con un modelo de valor y vuelca el presupuesto en las ramas prometedoras — llegando a una respuesta fuerte sin completar nunca las débiles. La trampa es la maquinaria: la búsqueda en árbol necesita un modelo de valor (o de recompensa de proceso) y un bucle de búsqueda, mientras que Best-of-N solo necesita un puntuador y un bucle. Regla práctica: respuestas baratas o sin modelo de valor → **Best-of-N**; razonamiento largo y costoso donde el progreso parcial se puede juzgar → **búsqueda en árbol**.",
  bridgeLabel: "SIGUIENTE: PRECISIÓN MIXTA",
  bridgeBody: "Buscar en inferencia significa correr el modelo muchas veces — así que cada corrida tiene que ser barata. Sigue **la precisión mixta**: guardar y multiplicar los pesos en menos bits (FP16, BF16, FP8) para que cada una de esas pasadas hacia adelante sea más rápida y pequeña.",
  prevLesson: "Atrás: llamado a herramientas",
  nextLesson: "Continuar: precisión mixta",
};
