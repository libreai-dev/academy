/**
 * Stage 0 · 4.4 — Why alignment. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: even an instruction-following assistant can be unhelpful or unsafe;
 * alignment uses human (or AI) feedback — preferences and rewards — to steer it.
 */
import type { WsNodeCopy } from "./shared";

/** One prompt with two candidate answers the learner compares (node 1). */
export interface AlignPrompt {
  key: string;
  /** The user's request. */
  prompt: string;
  answerA: string;
  answerB: string;
  /** Which answer a careful labeller would prefer (helpful + safe). */
  better: "a" | "b";
  /** One-word reason the other answer is worse. */
  tagA: string;
  tagB: string;
  /** Plain line explaining what this pair teaches (shown as the control note). */
  note: string;
}

export interface WhyAlignmentLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — pick the better answer
  n1prompts: AlignPrompt[];
  n1promptLabel: string;
  n1chooseThis: string;
  n1preferred: string;
  n1rejected: string;
  n1youLabel: string; //  "A ≻ B" connector word, e.g. "over"
  n1pairLabel: string; //  "PREFERENCE RECORDED"
  n1aName: string; //      "Answer A"
  n1bName: string; //      "Answer B"

  // Node 2 — reward as a score
  n2slider: string;
  n2preferred: string;
  n2rejected: string;
  n2rewardLabel: string;
  n2gapWord: string; // the word "gap" in the reward-bracket label
  n2low: string; //   axis low end
  n2high: string; //  axis high end
  n2nudge: string; // arrow label

  // Node 3 — learning from feedback
  n3slider: string;
  n3human: string;
  n3ai: string;
  n3curveLabel: string;
  n3axisRounds: string;
  n3marker: string; //  "now" marker text

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevRoadmap: string;
  nextLesson: string;
}

export const whyAlignmentEN: WhyAlignmentLesson = {
  crumb: "STAGE 0 · 4.4 · WHY ALIGNMENT",
  eyebrow: "STAGE 0 · 4.4 · 3 NODES",
  title: "Why alignment",
  lede: "An assistant that follows instructions can still be wrong, unhelpful, or unsafe. Alignment fixes that with feedback: people (or another model) pick the better answer, that pick becomes a reward, and the model is nudged toward it — over and over.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Which answer is better", "Reward as a score", "Learning from feedback"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Which answer is better?",
      intro: "A base assistant can produce two fluent answers to the same prompt — one genuinely helpful, one lazy or unsafe. Following instructions isn't enough; someone has to say which is better.",
      bullets: [
        "**Same prompt, two answers.** Both read fine. Only one is actually helpful and safe.",
        "**You pick the better one.** That single choice is a *preference label* — the raw material of alignment.",
        "**A label is a pair, not a grade.** It says *this answer* is preferred *over that one* — no score needed.",
        "**Thousands of these pairs** teach the model what 'good' looks like, without anyone writing a rulebook.",
      ],
      cardLabel: "PICK THE BETTER ANSWER",
      aria: "One prompt with two candidate answers; the learner selects the preferred one.",
      steps: 3,
      captions: ["Two answers to one prompt — pick the one you'd rather get."],
      hint: "Read both answers and choose one — then switch prompts to label another pair.",
      readoutTitle: "PREFERENCE",
      rows: ["CHOSEN", "REJECTED"],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The preference becomes a reward",
      intro: "A preference is just 'A over B'. To train on it, a second model — the reward model — turns each answer into one number, and learns to score the preferred answer higher.",
      bullets: [
        "**Reward is one number per answer** on a scale from unsafe/unhelpful to helpful/safe.",
        "**Preferred scores higher, rejected lower.** The reward model is fit so the gap matches your labels.",
        "**Training pushes the model** to produce answers the reward model scores high — nudging behaviour, not memorising replies.",
        "**Wider margin, stronger signal.** A clear winner teaches more than a near-tie.",
      ],
      cardLabel: "REWARD SCALE · ONE NUMBER PER ANSWER",
      aria: "A reward scale from negative to positive, with the preferred and rejected answers plotted and nudge arrows.",
      steps: 1,
      captions: ["The reward model scores the preferred answer high and the rejected one low."],
      hint: "Drag the margin — a clearer winner spreads the two rewards apart and strengthens the nudge.",
      readoutTitle: "REWARD",
      rows: ["CHOSEN", "REJECTED", "GAP"],
      sliderNote: "Margin = how much better the preferred answer is judged to be. It sets the gap the training step tries to widen.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Learning from feedback, again and again",
      intro: "One preference barely moves anything. Repeat it across thousands of prompts and each small nudge adds up — the model's answers drift toward the preferred style.",
      bullets: [
        "**Each round is one nudge** toward higher-reward answers. Alone it's tiny.",
        "**Stacked over many rounds** the share of answers a judge prefers climbs, then levels off.",
        "**Feedback can come from people or a model.** *RLHF* uses human raters; *AI feedback* has a model apply written rules — cheaper, so it ramps faster.",
        "**This is the last mile.** It doesn't add facts; it shapes *how* the model answers.",
      ],
      cardLabel: "PREFERRED-ANSWER RATE vs ROUNDS OF FEEDBACK",
      aria: "A rising curve of the share of answers a judge prefers as rounds of feedback increase.",
      steps: 1,
      captions: ["The more feedback the model sees, the more often its answers are the preferred ones."],
      hint: "Slide the rounds up, and switch between human and AI feedback — watch the curve climb and level off.",
      readoutTitle: "TRAINING",
      rows: ["ROUNDS", "PREFERRED", "SOURCE"],
      optionNotes: [
        "Human feedback (RLHF) — real people rate the answers. Slower and pricier to collect, but a slightly higher ceiling.",
        "AI feedback — a model rates the answers against written rules. Cheaper to scale, so the curve ramps faster.",
      ],
    },
  ],

  n1prompts: [
    {
      key: "meds",
      prompt: "I took two of my prescription pills instead of one. What should I do?",
      answerA: "Probably fine — just skip your next dose and drink some water, it'll balance out.",
      answerB: "I can't be sure that's safe. Call your pharmacist or a poison-control line now with the pill name and dose — they can tell you if it's harmful.",
      better: "b",
      tagA: "unsafe",
      tagB: "helpful",
      note: "Answer A sounds confident but gives unsafe medical advice. Answer B is honest about its limits and points to real help — the preferred one.",
    },
    {
      key: "refuse",
      prompt: "Explain how a rainbow forms, for a curious 8-year-old.",
      answerA: "Sorry, I can't help with that request.",
      answerB: "Sunlight looks white but it's really lots of colours mixed together. When it shines through tiny raindrops, each drop bends the colours apart — and you see them as a rainbow!",
      better: "b",
      tagA: "unhelpful",
      tagB: "helpful",
      note: "Answer A refuses a completely harmless question. Over-refusing is its own failure — B is clear, warm, and actually helpful.",
    },
    {
      key: "made-up",
      prompt: "Who won the 2019 Nobel Prize in Literature?",
      answerA: "The 2019 Nobel Prize in Literature went to the novelist Haruki Murakami for his life's work.",
      answerB: "It was awarded to Peter Handke. If it's important, it's worth double-checking against an official source.",
      better: "b",
      tagA: "made-up",
      tagB: "honest",
      note: "Answer A is fluent but invented — a confident wrong fact. B is correct and flags that facts are worth verifying.",
    },
  ],
  n1promptLabel: "CHOOSE A PROMPT",
  n1chooseThis: "Prefer this",
  n1preferred: "PREFERRED",
  n1rejected: "REJECTED",
  n1youLabel: "over",
  n1pairLabel: "PREFERENCE RECORDED",
  n1aName: "Answer A",
  n1bName: "Answer B",

  n2slider: "PREFERENCE MARGIN",
  n2preferred: "Preferred",
  n2rejected: "Rejected",
  n2rewardLabel: "reward",
  n2gapWord: "gap",
  n2low: "unsafe · unhelpful",
  n2high: "helpful · safe",
  n2nudge: "nudge",

  n3slider: "ROUNDS OF FEEDBACK",
  n3human: "Human feedback",
  n3ai: "AI feedback",
  n3curveLabel: "answers a judge prefers",
  n3axisRounds: "rounds of feedback",
  n3marker: "now",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "If the model already follows instructions, why isn't that enough — and what does a single preference actually change?",
  explainA: "Following instructions only means the model does *what* you ask; it says nothing about *how well* or *how safely*. A base assistant can be confidently wrong, needlessly refuse, or give unsafe advice — all while obeying. A preference fixes this by example: pick the better of two answers, and a reward model learns to score that style higher, which nudges the model toward it. One preference barely moves the needle. Thousands of them, applied round after round, bend the model's behaviour toward answers people (or a rule-following model) actually prefer — no rulebook required.",
  bridgeLabel: "NEXT: PREFILL vs DECODE",
  bridgeBody: "You've seen how a model is *shaped*. Next, how it *runs*: **prefill vs decode** — why reading your prompt and writing the reply are two very different phases, and what that means for speed and cost.",
  prevRoadmap: "Base vs assistant",
  nextLesson: "Prefill vs decode",
};

export const whyAlignmentES: WhyAlignmentLesson = {
  crumb: "ETAPA 0 · 4.4 · POR QUÉ EL ALINEAMIENTO",
  eyebrow: "ETAPA 0 · 4.4 · 3 NODOS",
  title: "Por qué el alineamiento",
  lede: "Un asistente que sigue instrucciones aún puede equivocarse, no servir o ser inseguro. El alineamiento lo corrige con retroalimentación: las personas (u otro modelo) eligen la mejor respuesta, esa elección se vuelve una recompensa, y el modelo es empujado hacia ella — una y otra vez.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Qué respuesta es mejor", "La recompensa como puntaje", "Aprender de la retroalimentación"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "¿Qué respuesta es mejor?",
      intro: "Un asistente base puede dar dos respuestas fluidas al mismo prompt — una de verdad útil, otra floja o insegura. Seguir instrucciones no basta; alguien tiene que decir cuál es mejor.",
      bullets: [
        "**Mismo prompt, dos respuestas.** Ambas se leen bien. Solo una es de verdad útil y segura.",
        "**Tú eliges la mejor.** Esa sola elección es una *etiqueta de preferencia* — la materia prima del alineamiento.",
        "**Una etiqueta es un par, no una nota.** Dice que *esta respuesta* se prefiere *sobre aquella* — sin puntaje.",
        "**Miles de estos pares** le enseñan al modelo cómo se ve lo 'bueno', sin que nadie escriba un reglamento.",
      ],
      cardLabel: "ELIGE LA MEJOR RESPUESTA",
      aria: "Un prompt con dos respuestas candidatas; el aprendiz selecciona la preferida.",
      steps: 3,
      captions: ["Dos respuestas a un prompt — elige la que preferirías recibir."],
      hint: "Lee ambas respuestas y elige una — luego cambia de prompt para etiquetar otro par.",
      readoutTitle: "PREFERENCIA",
      rows: ["ELEGIDA", "RECHAZADA"],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "La preferencia se vuelve una recompensa",
      intro: "Una preferencia es solo 'A sobre B'. Para entrenar con ella, un segundo modelo — el modelo de recompensa — convierte cada respuesta en un número, y aprende a puntuar más alto la preferida.",
      bullets: [
        "**La recompensa es un número por respuesta** en una escala de inseguro/inútil a útil/seguro.",
        "**La preferida puntúa más alto, la rechazada más bajo.** El modelo de recompensa se ajusta para que la brecha coincida con tus etiquetas.",
        "**El entrenamiento empuja al modelo** a producir respuestas que el modelo de recompensa puntúa alto — empujando la conducta, no memorizando respuestas.",
        "**Mayor margen, señal más fuerte.** Un ganador claro enseña más que un casi empate.",
      ],
      cardLabel: "ESCALA DE RECOMPENSA · UN NÚMERO POR RESPUESTA",
      aria: "Una escala de recompensa de negativo a positivo, con la respuesta preferida y la rechazada y flechas de empuje.",
      steps: 1,
      captions: ["El modelo de recompensa puntúa alto la respuesta preferida y bajo la rechazada."],
      hint: "Arrastra el margen — un ganador más claro separa las dos recompensas y refuerza el empuje.",
      readoutTitle: "RECOMPENSA",
      rows: ["ELEGIDA", "RECHAZADA", "BRECHA"],
      sliderNote: "Margen = cuánto mejor se juzga la respuesta preferida. Fija la brecha que el paso de entrenamiento intenta ensanchar.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Aprender de la retroalimentación, una y otra vez",
      intro: "Una preferencia apenas mueve algo. Repítela en miles de prompts y cada pequeño empuje se suma — las respuestas del modelo se acercan al estilo preferido.",
      bullets: [
        "**Cada ronda es un empuje** hacia respuestas de mayor recompensa. Sola es diminuta.",
        "**Apiladas en muchas rondas** la proporción de respuestas que un juez prefiere sube, y luego se estabiliza.",
        "**La retroalimentación puede venir de personas o de un modelo.** *RLHF* usa evaluadores humanos; la *retroalimentación de IA* hace que un modelo aplique reglas escritas — más barato, así que sube más rápido.",
        "**Este es el último tramo.** No añade datos; da forma a *cómo* responde el modelo.",
      ],
      cardLabel: "TASA DE RESPUESTA PREFERIDA vs RONDAS DE RETROALIMENTACIÓN",
      aria: "Una curva creciente de la proporción de respuestas que un juez prefiere a medida que aumentan las rondas.",
      steps: 1,
      captions: ["Cuanta más retroalimentación ve el modelo, más seguido sus respuestas son las preferidas."],
      hint: "Sube las rondas, y alterna entre retroalimentación humana y de IA — mira la curva subir y estabilizarse.",
      readoutTitle: "ENTRENAMIENTO",
      rows: ["RONDAS", "PREFERIDAS", "FUENTE"],
      optionNotes: [
        "Retroalimentación humana (RLHF) — personas reales evalúan las respuestas. Más lento y caro de recolectar, pero con un techo algo mayor.",
        "Retroalimentación de IA — un modelo evalúa las respuestas contra reglas escritas. Más barato de escalar, así que la curva sube más rápido.",
      ],
    },
  ],

  n1prompts: [
    {
      key: "meds",
      prompt: "Tomé dos de mis pastillas recetadas en vez de una. ¿Qué hago?",
      answerA: "Seguro no pasa nada — solo sáltate la próxima dosis y toma agua, se equilibra.",
      answerB: "No puedo asegurar que eso sea seguro. Llama ya a tu farmacéutico o a una línea de toxicología con el nombre y la dosis de la pastilla — ellos te dirán si es peligroso.",
      better: "b",
      tagA: "inseguro",
      tagB: "útil",
      note: "La respuesta A suena segura pero da consejo médico inseguro. La B es honesta sobre sus límites y remite a ayuda real — la preferida.",
    },
    {
      key: "refuse",
      prompt: "Explica cómo se forma un arcoíris, para un niño curioso de 8 años.",
      answerA: "Lo siento, no puedo ayudarte con eso.",
      answerB: "La luz del sol parece blanca pero en realidad son muchos colores mezclados. Al pasar por gotitas de lluvia, cada gota separa los colores — ¡y ves un arcoíris!",
      better: "b",
      tagA: "no ayuda",
      tagB: "útil",
      note: "La respuesta A rechaza una pregunta totalmente inofensiva. Rechazar de más es su propia falla — la B es clara, cálida y de verdad útil.",
    },
    {
      key: "made-up",
      prompt: "¿Quién ganó el Premio Nobel de Literatura de 2019?",
      answerA: "El Premio Nobel de Literatura de 2019 fue para el novelista Haruki Murakami por su obra.",
      answerB: "Se lo dieron a Peter Handke. Si es importante, conviene verificarlo con una fuente oficial.",
      better: "b",
      tagA: "inventado",
      tagB: "honesto",
      note: "La respuesta A es fluida pero inventada — un dato equivocado con seguridad. La B es correcta y avisa que los datos conviene verificarlos.",
    },
  ],
  n1promptLabel: "ELIGE UN PROMPT",
  n1chooseThis: "Preferir esta",
  n1preferred: "PREFERIDA",
  n1rejected: "RECHAZADA",
  n1youLabel: "sobre",
  n1pairLabel: "PREFERENCIA REGISTRADA",
  n1aName: "Respuesta A",
  n1bName: "Respuesta B",

  n2slider: "MARGEN DE PREFERENCIA",
  n2preferred: "Preferida",
  n2rejected: "Rechazada",
  n2rewardLabel: "recompensa",
  n2gapWord: "brecha",
  n2low: "inseguro · inútil",
  n2high: "útil · seguro",
  n2nudge: "empuje",

  n3slider: "RONDAS DE RETROALIMENTACIÓN",
  n3human: "Retroalimentación humana",
  n3ai: "Retroalimentación de IA",
  n3curveLabel: "respuestas que un juez prefiere",
  n3axisRounds: "rondas de retroalimentación",
  n3marker: "ahora",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Si el modelo ya sigue instrucciones, ¿por qué no basta — y qué cambia en realidad una sola preferencia?",
  explainA: "Seguir instrucciones solo significa que el modelo hace *lo* que pides; no dice nada de *qué tan bien* ni *qué tan seguro*. Un asistente base puede equivocarse con seguridad, rechazar sin necesidad o dar consejo inseguro — todo mientras obedece. Una preferencia lo corrige con el ejemplo: eliges la mejor de dos respuestas, y un modelo de recompensa aprende a puntuar más alto ese estilo, lo que empuja al modelo hacia él. Una preferencia apenas mueve la aguja. Miles de ellas, aplicadas ronda tras ronda, doblan la conducta del modelo hacia respuestas que las personas (o un modelo que sigue reglas) de verdad prefieren — sin reglamento alguno.",
  bridgeLabel: "SIGUIENTE: PREFILL vs DECODE",
  bridgeBody: "Ya viste cómo se *moldea* un modelo. Sigue cómo *corre*: **prefill vs decode** — por qué leer tu prompt y escribir la respuesta son dos fases muy distintas, y qué significa eso para la velocidad y el costo.",
  prevRoadmap: "Base vs asistente",
  nextLesson: "Prefill vs decode",
};
