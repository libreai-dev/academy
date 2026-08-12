/**
 * Stage 0 · 4.4 — Reward modeling. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: a reward model is trained to predict human preference as a single
 * score, so it can judge brand-new answers automatically. Builds on
 * "Why alignment" (why we steer models toward human preferences) — here we
 * teach the mechanism: comparisons → a scalar → an automatic judge.
 */
import type { WsNodeCopy } from "./shared";

/** One preference pair the learner labels in Node 1. */
export interface RmPair {
  /** Short topic tag for the pair selector button. */
  tag: string;
  prompt: string;
  a: string;
  b: string;
}

/** One candidate answer the trained model scores in Node 3. */
export interface RmCandidate {
  /** Short label that fits inside a bar row. */
  label: string;
  /** Reward score the trained model assigns (0–10 display scale). */
  reward: number;
}

export interface RewardModelingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — preference pairs
  n1pairs: RmPair[];
  n1pairSelLabel: string; //   "PICK A PROMPT"
  n1winnerLabel: string; //    "WHICH ANSWER IS BETTER?"
  n1pickA: string; //          "Answer A is better"
  n1pickB: string; //          "Answer B is better"
  n1promptTag: string; //      "PROMPT"
  n1tagA: string; //           "A"
  n1tagB: string; //           "B"
  n1preferred: string; //      "PREFERRED"
  n1rejected: string; //       "REJECTED"

  // Node 2 — learn a score
  n2slider: string; //         "TRAINING STEPS"
  n2axisLabel: string; //      "REWARD SCORE"
  n2worse: string; //          "worse"
  n2better: string; //         "better"
  n2chosenTag: string; //      "preferred"
  n2rejectedTag: string; //    "rejected"
  n2marginTag: string; //      "margin"
  n2rChosen: string; //        readout row: r(preferred)
  n2rRejected: string; //      readout row: r(rejected)
  n2marginRow: string; //      readout row: MARGIN
  n2matchRow: string; //       readout row: HUMAN MATCH
  n2startNote: string; //      note at step 0
  n2trainedNote: string; //    note near the end

  // Node 3 — use it to rank
  n3prompt: string;
  n3promptTag: string; //      "NEW PROMPT"
  n3candidates: RmCandidate[];
  n3asWritten: string; //      toggle: "As submitted"
  n3ranked: string; //         toggle: "Rank by reward"
  n3scoreTag: string; //       "reward"
  n3bestTag: string; //        "BEST PICK"
  n3asWrittenNote: string;
  n3rankedNote: string;

  // Go deeper
  deeperTitle: string;
  deeperBody: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const rewardModelingEN: RewardModelingLesson = {
  crumb: "STAGE 0 · REWARD MODELING",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Reward modeling",
  lede: "You can't have a human grade every answer a model ever writes. So you train a second model to predict what humans prefer — a single score that stands in for human judgement, and can rank answers it has never seen.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Humans compare answers", "The model learns a score", "It judges new answers"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Humans pick the better answer",
      intro: "In **[why alignment](/stage/0/why-alignment)** you saw *why* we steer models toward what people want. This is the raw material for it: comparisons. People don't hand out scores — they just say which of two answers is better.",
      bullets: [
        "**Comparing beats scoring.** Ask someone to rate an answer 1–10 and everyone uses a different scale. Ask *A or B?* and the answers are consistent.",
        "**Each labelled pair is one training example** — a prompt, a *chosen* answer, and a *rejected* one.",
        "**You judge on whatever matters** — clarity, correctness, safety, tone. Try the three prompts below and pick a winner for each.",
      ],
      cardLabel: "PREFERENCE PAIR",
      aria: "A prompt with two candidate answers side by side; the preferred one is highlighted green.",
      steps: 1,
      captions: ["A prompt with two answers — mark the one a person would prefer."],
      hint: "Pick a prompt, then choose which answer is better — that pair becomes one label.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Answer A marked better — this pair is stored as A ≻ B (“chosen over rejected”). That single fact is the training signal.",
        "Answer B marked better — this pair is stored as B ≻ A. Flip your pick and the label flips with it.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The model learns a score",
      intro: "Now the reward model reads an answer and outputs one number. It never sees a “correct” score — only your pairs. Training nudges it until the preferred answer scores higher than the rejected one.",
      bullets: [
        "**Both answers start tied** — the untrained model is guessing, so it ranks the pair right about half the time.",
        "**Each step widens the gap.** The score of the *preferred* answer is pushed up, the *rejected* one down — drag the slider to watch.",
        "**The gap is the confidence.** A bigger margin means the model agrees with humans more often. It's fitting a ranking, not memorising scores.",
      ],
      cardLabel: "REWARD SCORE · ONE PAIR",
      aria: "A reward-score axis with the preferred and rejected answers pulling apart as training steps increase.",
      steps: 1,
      captions: ["One pair on a reward axis — training pulls the preferred answer above the rejected one."],
      hint: "Drag the training steps — the two scores separate and the human-match climbs toward 100%.",
      readoutTitle: "REWARD_STATE",
      rows: ["r(preferred)", "r(rejected)", "MARGIN", "HUMAN MATCH"],
      readoutNote: "The model's current scores for the pair, the gap between them, and how often that gap agrees with the human's choice.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Now it judges new answers",
      intro: "The trained reward model is an automatic judge. Give it a fresh prompt and several candidate answers, and it scores each one — no human in the loop. Sort by score and the best answer floats to the top.",
      bullets: [
        "**One number per answer, at scale.** The judge scores millions of answers a human never has to read.",
        "**Ranking is the payoff.** Toggle to sort by reward — the highest-scored answer is the pick.",
        "**This is how the signal gets used** — keep the best of many samples, or feed the scores into training (next lesson).",
      ],
      cardLabel: "SCORE & RANK CANDIDATES",
      aria: "Five candidate answers with reward bars; sorting by reward puts the best pick on top.",
      steps: 1,
      captions: ["Fresh candidate answers, each scored by the trained reward model, then ranked."],
      hint: "Flip to “Rank by reward” — the answers reorder and the top pick is highlighted.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "As submitted — the candidates in the order they were written. The reward is shown, but nothing is chosen yet.",
        "Ranked by reward — sorted highest score first. The top bar is what the model would pick as the best answer.",
      ],
    },
  ],

  n1pairs: [
    {
      tag: "Science",
      prompt: "Explain photosynthesis to a 10-year-old.",
      a: "Plants catch sunlight and turn it into food, and let out the air we breathe.",
      b: "Photosynthesis is the conversion of radiant energy to chemical energy via chlorophyll.",
    },
    {
      tag: "Code",
      prompt: "How do I reverse a list in Python?",
      a: "Use my_list.reverse() to flip it in place, or my_list[::-1] for a copy.",
      b: "Write a loop that swaps elements from both ends until they meet in the middle.",
    },
    {
      tag: "Safety",
      prompt: "Is it safe to mix bleach and ammonia?",
      a: "No — never mix them. It makes toxic gas. Keep them apart and ventilate.",
      b: "A small amount is probably fine if you crack a window open first.",
    },
  ],
  n1pairSelLabel: "PICK A PROMPT",
  n1winnerLabel: "WHICH ANSWER IS BETTER?",
  n1pickA: "Answer A is better",
  n1pickB: "Answer B is better",
  n1promptTag: "PROMPT",
  n1tagA: "A",
  n1tagB: "B",
  n1preferred: "PREFERRED",
  n1rejected: "REJECTED",

  n2slider: "TRAINING STEPS",
  n2axisLabel: "REWARD SCORE",
  n2worse: "worse",
  n2better: "better",
  n2chosenTag: "preferred",
  n2rejectedTag: "rejected",
  n2marginTag: "margin",
  n2rChosen: "r(preferred)",
  n2rRejected: "r(rejected)",
  n2marginRow: "MARGIN",
  n2matchRow: "HUMAN MATCH",
  n2startNote: "Step 0: both answers score the same, so the model ranks the pair no better than a coin flip.",
  n2trainedNote: "Trained: the preferred answer scores well above the rejected one, and the model matches the human almost every time.",

  n3prompt: "Write a git commit message for a login bug fix.",
  n3promptTag: "NEW PROMPT",
  n3candidates: [
    { label: "Guard missing token", reward: 9.1 },
    { label: "Fix null login check", reward: 8.3 },
    { label: "Resolve logout crash", reward: 7.2 },
    { label: "fixed stuff", reward: 2.1 },
    { label: "update", reward: 1.4 },
  ],
  n3asWritten: "As submitted",
  n3ranked: "Rank by reward",
  n3scoreTag: "reward",
  n3bestTag: "BEST PICK",
  n3asWrittenNote: "The five candidates in submission order. Each already has a reward score — but nothing is picked yet.",
  n3rankedNote: "Sorted by reward: the clearest, most specific commit message wins, and the two lazy ones sink to the bottom.",

  deeperTitle: "The math: turning comparisons into a score",
  deeperBody: "The model gives each answer a number r. For a pair, it predicts the chance the human prefers A as sigmoid(rₐ − rᵇ) — the classic **Bradley–Terry** model. Training minimises the gap between that prediction and the human's actual choice, which simply means: push rₐ above rᵇ whenever the human chose A. The absolute value of r is meaningless; only the *differences* carry information, which is why the same model can score an answer it has never seen — it learned an ordering, not a lookup table.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A reward model outputs one number for an answer, but nobody ever told it the “right” score. So how does it learn what a good answer is?",
  explainA: "It never sees absolute scores — only human comparisons: *this answer is better than that one*. Training nudges the model so the preferred answer earns a higher number than the rejected one, across thousands of pairs. The single number it settles on is just whatever ordering best reproduces those human choices. That's why it can score a brand-new answer it has never seen — it learned the **ranking**, not a lookup table.",
  bridgeLabel: "NEXT: PREFERENCE OPTIMIZATION",
  bridgeBody: "You now have an automatic judge. Next, **preference optimization** — how that reward signal is actually used to *retrain the model itself* (PPO, DPO), turning “this is better” into new weights.",
  prevLesson: "Back to synthetic data",
  nextLesson: "Continue: Preference optimization",
};

export const rewardModelingES: RewardModelingLesson = {
  crumb: "ETAPA 0 · MODELADO DE RECOMPENSA",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Modelado de recompensa",
  lede: "No puedes tener a una persona calificando cada respuesta que un modelo escriba. Así que entrenas un segundo modelo para predecir lo que la gente prefiere — un solo puntaje que hace las veces del juicio humano, y que puede ordenar respuestas que nunca ha visto.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Humanos comparan respuestas", "El modelo aprende un puntaje", "Juzga respuestas nuevas"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Los humanos eligen la mejor respuesta",
      intro: "En **[por qué alinear](/stage/0/why-alignment)** viste *por qué* orientamos los modelos hacia lo que la gente quiere. Esta es la materia prima: comparaciones. La gente no reparte puntajes — solo dice cuál de dos respuestas es mejor.",
      bullets: [
        "**Comparar gana a puntuar.** Pide calificar una respuesta del 1 al 10 y cada quien usa otra escala. Pregunta *¿A o B?* y las respuestas son consistentes.",
        "**Cada par etiquetado es un ejemplo de entrenamiento** — un prompt, una respuesta *elegida* y una *rechazada*.",
        "**Juzgas por lo que importe** — claridad, corrección, seguridad, tono. Prueba los tres prompts de abajo y elige un ganador en cada uno.",
      ],
      cardLabel: "PAR DE PREFERENCIA",
      aria: "Un prompt con dos respuestas candidatas lado a lado; la preferida se resalta en verde.",
      steps: 1,
      captions: ["Un prompt con dos respuestas — marca la que una persona preferiría."],
      hint: "Elige un prompt y luego cuál respuesta es mejor — ese par se vuelve una etiqueta.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Respuesta A marcada como mejor — el par se guarda como A ≻ B (“elegida sobre rechazada”). Ese solo dato es la señal de entrenamiento.",
        "Respuesta B marcada como mejor — el par se guarda como B ≻ A. Cambia tu elección y la etiqueta cambia con ella.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El modelo aprende un puntaje",
      intro: "Ahora el modelo de recompensa lee una respuesta y devuelve un número. Nunca ve un puntaje “correcto” — solo tus pares. El entrenamiento lo ajusta hasta que la respuesta preferida puntúa más alto que la rechazada.",
      bullets: [
        "**Ambas respuestas empiezan empatadas** — el modelo sin entrenar adivina, así que acierta el orden del par la mitad de las veces.",
        "**Cada paso ensancha la brecha.** El puntaje de la respuesta *preferida* sube, el de la *rechazada* baja — arrastra el control para verlo.",
        "**La brecha es la confianza.** Un margen mayor significa que el modelo coincide con los humanos más seguido. Ajusta un orden, no memoriza puntajes.",
      ],
      cardLabel: "PUNTAJE DE RECOMPENSA · UN PAR",
      aria: "Un eje de puntaje de recompensa con la respuesta preferida y la rechazada separándose al aumentar los pasos de entrenamiento.",
      steps: 1,
      captions: ["Un par en un eje de recompensa — el entrenamiento sube la preferida por encima de la rechazada."],
      hint: "Arrastra los pasos de entrenamiento — los dos puntajes se separan y la coincidencia humana sube hacia 100%.",
      readoutTitle: "REWARD_STATE",
      rows: ["r(preferida)", "r(rechazada)", "MARGEN", "COINCIDENCIA"],
      readoutNote: "Los puntajes actuales del modelo para el par, la brecha entre ellos, y cuán seguido esa brecha coincide con la elección humana.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Ahora juzga respuestas nuevas",
      intro: "El modelo de recompensa entrenado es un juez automático. Dale un prompt nuevo y varias respuestas candidatas, y puntúa cada una — sin humano en el bucle. Ordena por puntaje y la mejor respuesta sube arriba.",
      bullets: [
        "**Un número por respuesta, a escala.** El juez puntúa millones de respuestas que ningún humano tiene que leer.",
        "**El premio es el orden.** Activa ordenar por recompensa — la respuesta mejor puntuada es la elegida.",
        "**Así se usa la señal** — quedarte con la mejor de muchas muestras, o meter los puntajes al entrenamiento (siguiente lección).",
      ],
      cardLabel: "PUNTUAR Y ORDENAR CANDIDATAS",
      aria: "Cinco respuestas candidatas con barras de recompensa; ordenar por recompensa pone la mejor arriba.",
      steps: 1,
      captions: ["Respuestas candidatas nuevas, cada una puntuada por el modelo de recompensa, y luego ordenadas."],
      hint: "Cambia a “Ordenar por recompensa” — las respuestas se reordenan y la mejor se resalta.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Tal como se enviaron — las candidatas en el orden en que se escribieron. Se muestra la recompensa, pero aún no se elige nada.",
        "Ordenadas por recompensa — de mayor a menor. La barra superior es lo que el modelo elegiría como la mejor respuesta.",
      ],
    },
  ],

  n1pairs: [
    {
      tag: "Ciencia",
      prompt: "Explícale la fotosíntesis a un niño de 10 años.",
      a: "Las plantas atrapan la luz del sol y la vuelven comida, y sueltan el aire que respiramos.",
      b: "La fotosíntesis es la conversión de energía radiante en química mediante la clorofila.",
    },
    {
      tag: "Código",
      prompt: "¿Cómo invierto una lista en Python?",
      a: "Usa mi_lista.reverse() para voltearla en el sitio, o mi_lista[::-1] para una copia.",
      b: "Escribe un bucle que intercambie elementos de ambos extremos hasta que se encuentren.",
    },
    {
      tag: "Seguridad",
      prompt: "¿Es seguro mezclar cloro y amoníaco?",
      a: "No — nunca los mezcles. Forma gas tóxico. Mantenlos separados y ventila.",
      b: "Una cantidad pequeña seguro está bien si abres una ventana primero.",
    },
  ],
  n1pairSelLabel: "ELIGE UN PROMPT",
  n1winnerLabel: "¿CUÁL RESPUESTA ES MEJOR?",
  n1pickA: "La respuesta A es mejor",
  n1pickB: "La respuesta B es mejor",
  n1promptTag: "PROMPT",
  n1tagA: "A",
  n1tagB: "B",
  n1preferred: "PREFERIDA",
  n1rejected: "RECHAZADA",

  n2slider: "PASOS DE ENTRENAMIENTO",
  n2axisLabel: "PUNTAJE DE RECOMPENSA",
  n2worse: "peor",
  n2better: "mejor",
  n2chosenTag: "preferida",
  n2rejectedTag: "rechazada",
  n2marginTag: "margen",
  n2rChosen: "r(preferida)",
  n2rRejected: "r(rechazada)",
  n2marginRow: "MARGEN",
  n2matchRow: "COINCIDENCIA",
  n2startNote: "Paso 0: ambas respuestas puntúan igual, así que el modelo ordena el par no mejor que una moneda al aire.",
  n2trainedNote: "Entrenado: la respuesta preferida puntúa muy por encima de la rechazada, y el modelo coincide con el humano casi siempre.",

  n3prompt: "Escribe un mensaje de commit de git para un arreglo de login.",
  n3promptTag: "PROMPT NUEVO",
  n3candidates: [
    { label: "Proteger token faltante", reward: 9.1 },
    { label: "Corregir chequeo null", reward: 8.3 },
    { label: "Resolver crash de logout", reward: 7.2 },
    { label: "arreglé cosas", reward: 2.1 },
    { label: "update", reward: 1.4 },
  ],
  n3asWritten: "Tal como se enviaron",
  n3ranked: "Ordenar por recompensa",
  n3scoreTag: "recompensa",
  n3bestTag: "MEJOR ELECCIÓN",
  n3asWrittenNote: "Las cinco candidatas en orden de envío. Cada una ya tiene un puntaje — pero aún no se elige nada.",
  n3rankedNote: "Ordenadas por recompensa: el mensaje de commit más claro y específico gana, y los dos flojos se hunden al fondo.",

  deeperTitle: "La matemática: convertir comparaciones en un puntaje",
  deeperBody: "El modelo da a cada respuesta un número r. Para un par, predice la probabilidad de que el humano prefiera A como sigmoid(rₐ − rᵇ) — el clásico modelo **Bradley–Terry**. El entrenamiento minimiza la diferencia entre esa predicción y la elección real del humano, lo que simplemente significa: sube rₐ por encima de rᵇ cada vez que el humano eligió A. El valor absoluto de r no significa nada; solo las *diferencias* llevan información, y por eso el mismo modelo puede puntuar una respuesta que nunca ha visto — aprendió un orden, no una tabla de búsqueda.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo de recompensa devuelve un número para una respuesta, pero nadie le dijo nunca el puntaje “correcto”. ¿Entonces cómo aprende qué es una buena respuesta?",
  explainA: "Nunca ve puntajes absolutos — solo comparaciones humanas: *esta respuesta es mejor que aquella*. El entrenamiento ajusta el modelo para que la respuesta preferida gane un número más alto que la rechazada, a lo largo de miles de pares. El único número al que llega es simplemente el orden que mejor reproduce esas elecciones humanas. Por eso puede puntuar una respuesta nueva que nunca ha visto — aprendió el **orden**, no una tabla de búsqueda.",
  bridgeLabel: "SIGUIENTE: OPTIMIZACIÓN POR PREFERENCIA",
  bridgeBody: "Ya tienes un juez automático. Sigue la **optimización por preferencia** — cómo se usa esa señal de recompensa para *reentrenar el modelo mismo* (PPO, DPO), convirtiendo “esta es mejor” en nuevos pesos.",
  prevLesson: "Volver a datos sintéticos",
  nextLesson: "Continuar: Optimización por preferencia",
};
