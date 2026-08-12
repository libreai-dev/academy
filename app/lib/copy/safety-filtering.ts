/**
 * Stage 0 · Phase 0.4 — "Safety filtering". Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: after quality scoring, a separate pass runs toxicity / NSFW / danger
 * classifiers over every page and strips the harmful ones out of the corpus —
 * before a single token reaches the model. Push the strictness dial too far and
 * you also lose legitimate pages. Builds on classifier scoring (the trained
 * grader) — same machinery, aimed at harm instead of quality.
 */
import type { WsNodeCopy } from "./shared";

export interface SafetyFilteringLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the harm categories
  n1categories: string[]; //  button + verdict labels, aligned to CATEGORIES
  n1examples: string[]; //    what a flagged page in this category contains
  n1docLabel: string; //      "A PAGE THIS CATCHES"
  n1removeStamp: string; //   "STRIP FROM CORPUS"
  n1keepLabel: string; //     "everything else → kept"
  // Node 2 — the gate
  n2docs: string[]; //        page button labels, aligned to SAFETY_DOCS
  n2gateLabel: string; //     "SAFETY CLASSIFIERS"
  n2keptWord: string; //      "KEPT"
  n2flagWord: string; //      "FLAGGED"
  n2keptTag: string; //       "KEPT" tally caption
  n2flagTag: string; //       "FLAGGED" tally caption
  n2safeNote: string; //      short line shown when the page is genuinely safe
  // Node 3 — the strictness tradeoff
  n3slider: string; //        "STRICTNESS"
  n3harmfulRow: string; //    "Harmful pages"
  n3legitRow: string; //      "Legit pages"
  n3removed: string; //       "removed"
  n3missed: string; //        "missed"
  n3kept: string; //          "kept"
  n3wrong: string; //         "wrongly removed"
  // shared
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const safetyFilteringEN: SafetyFilteringLesson = {
  crumb: "STAGE 0 · PHASE 0.4 · SAFETY FILTERING",
  eyebrow: "STAGE 0 · PHASE 0.4 · 3 NODES",
  title: "Cutting the harm out first",
  lede: "Quality scoring keeps the pages worth learning from — but a well-written page can still be hateful, explicit, or dangerous. So a separate safety pass runs harm classifiers over every page and strips the bad ones out, before a single token reaches the model. Play with all three steps.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The harm categories", "Classify, then keep or cut", "How strict is too strict"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "What counts as harm",
      intro: "Safety filtering isn't one filter — it's a handful of detectors, each trained to spot one kind of harm. A page is cut if it trips any of them.",
      bullets: [
        "**Each category is its own trained classifier** — the same 'grade a page 0–1' machinery from the [last lesson](/stage/0/classifier-scoring), aimed at harm instead of quality.",
        "**Four common buckets:** hate speech, sexual / explicit (NSFW), violence & danger (weapons, drugs, self-harm how-tos), and targeted harassment.",
        "**They run in parallel, and any hit removes the page** — one high score is enough to strip it from the corpus.",
        "**This is about the *training data*, not the chatbot's guardrails.** Cleaning the corpus means the model never learns the worst patterns in the first place.",
      ],
      cardLabel: "HARM CATEGORIES · one detector each",
      aria: "Four harm-category detectors; the selected one flags an example page for removal.",
      steps: 1,
      captions: ["Each detector owns one kind of harm; a page that trips it is stripped from the corpus."],
      hint: "Tap through the categories — each detector describes the kind of page it removes.",
      readoutTitle: "CATEGORY",
      rows: ["DETECTOR", "VERDICT"],
      optionNotes: [
        "Hate speech — text attacking or dehumanising people for who they are (race, religion, gender, and so on).",
        "Sexual / NSFW — explicit sexual content. Usually removed wholesale from pre-training data.",
        "Violence & danger — instructions for weapons, drugs, or self-harm; graphic gore. The 'how to cause harm' bucket.",
        "Harassment — content targeting a specific person to threaten, demean, or coordinate abuse.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The gate: classify, then keep or cut",
      intro: "Every page runs the full bank of detectors. Its highest harm score decides: below the line it's kept, at or above it's flagged and removed.",
      bullets: [
        "**One page in, one verdict out** — kept, or flagged with the category that caught it.",
        "**The detectors aren't perfect.** A clean medical or history page can score *warm* on 'danger' just for mentioning drugs or war — that's the false-positive risk the next step is about.",
        "**Here the bar is fixed** at a middle value; flip through the batch and watch the running kept / flagged tally.",
        "**Flagged pages are dropped, not edited** — they never enter the training set.",
      ],
      cardLabel: "PAGE → CLASSIFIERS → VERDICT",
      aria: "A page flowing through the bank of safety classifiers to a kept-or-flagged verdict, with a running tally.",
      steps: 6,
      captions: [
        "A medical-dosage article: warm on 'danger', but under the bar — kept.",
        "A hateful rant: the hate detector spikes — flagged and removed.",
        "Explicit content: the NSFW detector spikes — flagged and removed.",
        "Weapon instructions: the danger detector spikes — flagged and removed.",
        "A harassment thread: the harassment detector spikes — flagged and removed.",
        "War reporting: violence-adjacent, warm on 'danger', but under the bar — kept.",
      ],
      hint: "Step through the pages — each runs the detectors, then lands on a verdict.",
      readoutTitle: "GATE_DECISION",
      rows: ["PAGE", "TOP SIGNAL", "SCORE", "VERDICT"],
      readoutNote: "How the gate resolved this page: which detector scored highest, its 0–1 score, and whether the page cleared the fixed bar.",
      optionNotes: [
        "Medical dosage guide — clean and useful, but names drugs and amounts, so 'danger' runs warm. It stays under the bar and is kept.",
        "Hate rant — a post dehumanising a group. The hate detector spikes; the page is flagged.",
        "Explicit page — sexual content. The NSFW detector spikes; the page is flagged.",
        "Weapon build guide — step-by-step instructions to cause harm. The danger detector spikes; the page is flagged.",
        "Harassment thread — a pile-on targeting one person. The harassment detector spikes; the page is flagged.",
        "War reporting — legitimate journalism about a conflict; 'danger' ticks up but stays under the bar. Kept.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "How strict is too strict",
      intro: "One dial sets the bar for the whole corpus. Turn it up and you catch more harm — but the twitchy detectors start flagging legitimate pages too. That's the whole tradeoff.",
      bullets: [
        "**Stricter → more harm removed, but more legit pages lost.** There's no setting that only catches the bad stuff.",
        "**Harmful pages are a tiny slice of the web** (~1.5% here) — but even a 1% false-positive rate quietly removes a big slice of perfectly good pages.",
        "**Too loose and toxic text leaks into the weights; too strict and you gut medicine, history, and news.** Labs tune this to remove the clear harm and accept a little slippage.",
        "**Same detectors, one knob** — the scores are fixed; where you draw the line is the judgement call.",
      ],
      cardLabel: "STRICTNESS · harm removed vs legit lost",
      aria: "Two proportion bars: the share of harmful pages removed, and the share of legit pages wrongly removed, both rising with strictness.",
      steps: 1,
      captions: ["Raise the dial and both bars grow — more harm caught, and more legit pages caught with it."],
      hint: "Drag the strictness dial — watch legit-pages-lost climb right alongside harm-removed.",
      readoutTitle: "FILTER_YIELD",
      rows: ["HARM REMOVED", "LEGIT LOST", "CORPUS KEPT"],
      readoutNote: "At this strictness: the share of harmful pages caught, the share of legit pages wrongly cut, and how much of the whole corpus survives.",
      optionNotes: [
        "Lenient — the bar is high, so only the most blatant harm is removed. Clean pages are safe, but toxic borderline content slips through into the corpus.",
        "Balanced — catches most clear harm while keeping false positives low. Roughly where labs aim.",
        "Aggressive — the bar is low, so nearly all harm is caught — but medicine, history, and news get swept out with it. The corpus shrinks and loses real knowledge.",
      ],
    },
  ],
  n1categories: ["Hate speech", "Sexual / NSFW", "Violence & danger", "Harassment"],
  n1examples: [
    "A post dehumanising people for their ethnicity or religion.",
    "Explicit sexual content, usually removed wholesale from pre-training.",
    "Step-by-step instructions for building a weapon.",
    "A coordinated thread targeting one person with abuse.",
  ],
  n1docLabel: "A PAGE THIS CATCHES",
  n1removeStamp: "STRIP FROM CORPUS",
  n1keepLabel: "clean pages → kept",
  n2docs: ["Medical guide", "Hate rant", "Explicit page", "Weapon guide", "Harassment", "War report"],
  n2gateLabel: "SAFETY CLASSIFIERS",
  n2keptWord: "KEPT",
  n2flagWord: "FLAGGED",
  n2keptTag: "KEPT",
  n2flagTag: "FLAGGED",
  n2safeNote: "Genuinely safe — under the bar on every detector.",
  n3slider: "STRICTNESS",
  n3harmfulRow: "Harmful pages",
  n3legitRow: "Legit pages",
  n3removed: "removed",
  n3missed: "missed",
  n3kept: "kept",
  n3wrong: "wrongly removed",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Quality scoring already dropped the junk. Why run a whole separate safety pass — and why can't we just crank it to maximum strictness?",
  explainA: "Because quality and safety are different questions. A hateful rant can be fluent, well-formatted, and *high* quality — it sails through the grader but must still be cut. So a separate bank of harm detectors (hate, NSFW, danger, harassment) runs over every page and strips any that trip. But the detectors are jittery: a medicine or history page can score warm on 'danger' with no harm at all. Crank strictness to the max and you remove nearly all the harm — and gut medicine, history, and news along with it. The real setting removes the clear harm and accepts a little slippage, because there's no line that catches only the bad stuff.",
  bridgeLabel: "NEXT: POSITIONAL ENCODING",
  bridgeBody: "The corpus is now gathered, extracted, deduped, graded, and cleaned of harm — a clean pile of tokens. Next we start *building the model itself*. First puzzle: the transformer reads all tokens at once, so how does it know their **order**? That's **positional encoding**.",
  prevLesson: "Back: classifier scoring",
  nextLesson: "Continue: Positional encoding",
};

export const safetyFilteringES: SafetyFilteringLesson = {
  crumb: "ETAPA 0 · FASE 0.4 · FILTRADO DE SEGURIDAD",
  eyebrow: "ETAPA 0 · FASE 0.4 · 3 NODOS",
  title: "Quitar el daño primero",
  lede: "La puntuación por calidad conserva las páginas de las que vale la pena aprender — pero una página bien escrita puede seguir siendo de odio, explícita o peligrosa. Así que un paso de seguridad aparte pasa clasificadores de daño por cada página y quita las malas, antes de que un solo token llegue al modelo. Juega con los tres pasos.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Las categorías de daño", "Clasificar, luego conservar o cortar", "Cuán estricto es demasiado"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Qué cuenta como daño",
      intro: "El filtrado de seguridad no es un filtro — es un puñado de detectores, cada uno entrenado para detectar un tipo de daño. Una página se corta si activa cualquiera de ellos.",
      bullets: [
        "**Cada categoría es su propio clasificador entrenado** — la misma maquinaria de 'calificar una página 0–1' de la [lección anterior](/stage/0/classifier-scoring), apuntada al daño en vez de a la calidad.",
        "**Cuatro cubetas comunes:** discurso de odio, sexual / explícito (NSFW), violencia y peligro (armas, drogas, guías de autolesión) y acoso dirigido.",
        "**Corren en paralelo, y cualquier acierto quita la página** — una sola puntuación alta basta para sacarla del corpus.",
        "**Esto es sobre los *datos de entrenamiento*, no sobre las barreras del chatbot.** Limpiar el corpus hace que el modelo nunca aprenda los peores patrones de entrada.",
      ],
      cardLabel: "CATEGORÍAS DE DAÑO · un detector cada una",
      aria: "Cuatro detectores de categorías de daño; el seleccionado marca una página de ejemplo para eliminarla.",
      steps: 1,
      captions: ["Cada detector posee un tipo de daño; una página que lo activa se saca del corpus."],
      hint: "Recorre las categorías — cada detector describe el tipo de página que quita.",
      readoutTitle: "CATEGORY",
      rows: ["DETECTOR", "VERDICT"],
      optionNotes: [
        "Discurso de odio — texto que ataca o deshumaniza a personas por lo que son (raza, religión, género, etc.).",
        "Sexual / NSFW — contenido sexual explícito. Suele eliminarse por completo de los datos de preentrenamiento.",
        "Violencia y peligro — instrucciones para armas, drogas o autolesiones; gore gráfico. La cubeta de 'cómo causar daño'.",
        "Acoso — contenido dirigido a una persona concreta para amenazar, humillar o coordinar abuso.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El portón: clasificar, luego conservar o cortar",
      intro: "Cada página pasa por todo el banco de detectores. Su puntuación de daño más alta decide: bajo la línea se conserva, en o sobre ella se marca y se elimina.",
      bullets: [
        "**Una página entra, un veredicto sale** — conservada, o marcada con la categoría que la atrapó.",
        "**Los detectores no son perfectos.** Una página médica o de historia limpia puede puntuar *tibio* en 'peligro' solo por mencionar drogas o guerra — ese es el riesgo de falso positivo del que trata el paso siguiente.",
        "**Aquí la barra es fija** en un valor medio; recorre el lote y observa el conteo corriente de conservadas / marcadas.",
        "**Las páginas marcadas se descartan, no se editan** — nunca entran al set de entrenamiento.",
      ],
      cardLabel: "PÁGINA → CLASIFICADORES → VEREDICTO",
      aria: "Una página que fluye por el banco de clasificadores de seguridad hacia un veredicto conservar-o-marcar, con un conteo corriente.",
      steps: 6,
      captions: [
        "Un artículo de dosis médicas: tibio en 'peligro', pero bajo la barra — conservado.",
        "Una diatriba de odio: el detector de odio se dispara — marcada y eliminada.",
        "Contenido explícito: el detector NSFW se dispara — marcada y eliminada.",
        "Instrucciones de armas: el detector de peligro se dispara — marcada y eliminada.",
        "Un hilo de acoso: el detector de acoso se dispara — marcada y eliminada.",
        "Reportaje de guerra: cercano a la violencia, tibio en 'peligro', pero bajo la barra — conservado.",
      ],
      hint: "Recorre las páginas — cada una corre los detectores y aterriza en un veredicto.",
      readoutTitle: "GATE_DECISION",
      rows: ["PAGE", "TOP SIGNAL", "SCORE", "VERDICT"],
      readoutNote: "Cómo resolvió el portón esta página: qué detector puntuó más alto, su puntaje 0–1, y si la página superó la barra fija.",
      optionNotes: [
        "Guía de dosis médicas — limpia y útil, pero nombra fármacos y cantidades, así que 'peligro' corre tibio. Se queda bajo la barra y se conserva.",
        "Diatriba de odio — un post que deshumaniza a un grupo. El detector de odio se dispara; la página se marca.",
        "Página explícita — contenido sexual. El detector NSFW se dispara; la página se marca.",
        "Guía para fabricar un arma — instrucciones paso a paso para causar daño. El detector de peligro se dispara; la página se marca.",
        "Hilo de acoso — una avalancha dirigida a una persona. El detector de acoso se dispara; la página se marca.",
        "Reportaje de guerra — periodismo legítimo sobre un conflicto; 'peligro' sube pero se queda bajo la barra. Conservado.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Cuán estricto es demasiado",
      intro: "Un solo control fija la barra para todo el corpus. Súbelo y atrapas más daño — pero los detectores nerviosos empiezan a marcar páginas legítimas también. Ese es todo el compromiso.",
      bullets: [
        "**Más estricto → más daño quitado, pero más páginas legítimas perdidas.** No hay ajuste que atrape solo lo malo.",
        "**Las páginas dañinas son una porción diminuta de la web** (~1.5% aquí) — pero incluso una tasa de falsos positivos del 1% quita en silencio una buena porción de páginas perfectamente válidas.",
        "**Muy laxo y el texto tóxico se filtra a los pesos; muy estricto y destripas medicina, historia y noticias.** Los laboratorios ajustan esto para quitar el daño claro y aceptar un poco de fuga.",
        "**Los mismos detectores, una perilla** — los puntajes están fijos; dónde trazas la línea es el juicio.",
      ],
      cardLabel: "ESTRICTEZ · daño quitado vs legítimo perdido",
      aria: "Dos barras de proporción: la fracción de páginas dañinas eliminadas y la fracción de páginas legítimas eliminadas por error, ambas subiendo con la estrictez.",
      steps: 1,
      captions: ["Sube el control y ambas barras crecen — más daño atrapado, y más páginas legítimas atrapadas con él."],
      hint: "Arrastra el control de estrictez — mira subir las páginas legítimas perdidas junto al daño quitado.",
      readoutTitle: "FILTER_YIELD",
      rows: ["HARM REMOVED", "LEGIT LOST", "CORPUS KEPT"],
      readoutNote: "A esta estrictez: la fracción de páginas dañinas atrapadas, la de páginas legítimas cortadas por error, y cuánto del corpus completo sobrevive.",
      optionNotes: [
        "Laxo — la barra está alta, así que solo se quita el daño más flagrante. Las páginas limpias están a salvo, pero el contenido tóxico al límite se cuela al corpus.",
        "Balanceado — atrapa casi todo el daño claro manteniendo bajos los falsos positivos. Más o menos donde apuntan los laboratorios.",
        "Agresivo — la barra está baja, así que casi todo el daño se atrapa — pero medicina, historia y noticias se barren con él. El corpus se encoge y pierde conocimiento real.",
      ],
    },
  ],
  n1categories: ["Discurso de odio", "Sexual / NSFW", "Violencia y peligro", "Acoso"],
  n1examples: [
    "Un post que deshumaniza a personas por su etnia o religión.",
    "Contenido sexual explícito, que suele eliminarse por completo del preentrenamiento.",
    "Instrucciones paso a paso para fabricar un arma.",
    "Un hilo coordinado que ataca con abuso a una persona.",
  ],
  n1docLabel: "UNA PÁGINA QUE ESTO ATRAPA",
  n1removeStamp: "SACAR DEL CORPUS",
  n1keepLabel: "páginas limpias → conservadas",
  n2docs: ["Guía médica", "Diatriba de odio", "Página explícita", "Guía de arma", "Acoso", "Reportaje"],
  n2gateLabel: "CLASIFICADORES DE SEGURIDAD",
  n2keptWord: "CONSERVADA",
  n2flagWord: "MARCADA",
  n2keptTag: "CONSERVADAS",
  n2flagTag: "MARCADAS",
  n2safeNote: "Genuinamente segura — bajo la barra en todos los detectores.",
  n3slider: "ESTRICTEZ",
  n3harmfulRow: "Páginas dañinas",
  n3legitRow: "Páginas legítimas",
  n3removed: "quitadas",
  n3missed: "no atrapadas",
  n3kept: "conservadas",
  n3wrong: "quitadas por error",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "La puntuación por calidad ya quitó la basura. ¿Por qué correr un paso de seguridad aparte — y por qué no ponerlo a la máxima estrictez?",
  explainA: "Porque calidad y seguridad son preguntas distintas. Una diatriba de odio puede ser fluida, bien formateada y de *alta* calidad — pasa el calificador sin problema pero igual hay que cortarla. Así que un banco aparte de detectores de daño (odio, NSFW, peligro, acoso) pasa por cada página y quita las que se activan. Pero los detectores son nerviosos: una página de medicina o historia puede puntuar tibio en 'peligro' sin daño alguno. Sube la estrictez al máximo y quitas casi todo el daño — y destripas medicina, historia y noticias con él. El ajuste real quita el daño claro y acepta un poco de fuga, porque no hay línea que atrape solo lo malo.",
  bridgeLabel: "SIGUIENTE: CODIFICACIÓN POSICIONAL",
  bridgeBody: "El corpus ya está reunido, extraído, deduplicado, calificado y limpio de daño — un montón limpio de tokens. Ahora empezamos a *construir el modelo*. Primer acertijo: el transformer lee todos los tokens a la vez, entonces ¿cómo sabe su **orden**? Eso es la **codificación posicional**.",
  prevLesson: "Atrás: puntuación por clasificador",
  nextLesson: "Continuar: Codificación posicional",
};
