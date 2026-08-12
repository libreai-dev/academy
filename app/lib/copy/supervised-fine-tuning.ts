/**
 * Stage 0 · 4.3 — Supervised fine-tuning (SFT). Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: SFT trains the base model on instruction→response examples, with the
 * loss applied ONLY to the response — so it learns to answer, not to continue.
 * Builds on 4.3-prior "Base vs assistant" (that fine-tuning flips a continuer
 * into a helper); this lesson shows the mechanism that does it.
 */
import type { WsNodeCopy } from "./shared";

/** One instruction→response training pair (Nodes 1 & 2). */
export interface SftExample {
  key: string;
  /** Button label — the kind of task. */
  label: string;
  /** What a user would type. */
  prompt: string;
  /** The ideal answer the model should learn to produce. */
  response: string;
}

/** One prompt shown two ways: base continuation vs SFT answer (Node 3). */
export interface SftOutcome {
  key: string;
  label: string;
  prompt: string;
  /** How a raw base model continues the text. */
  base: string;
  /** How the fine-tuned model answers. */
  sft: string;
}

export interface SupervisedFineTuningLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // shared example sets
  examples: SftExample[]; // nodes 1 & 2
  outcomes: SftOutcome[]; // node 3
  // node 1 — the data
  n1promptLabel: string; //   region label on the strip
  n1responseLabel: string;
  n1markerLegend: string; //  legend: "role marker"
  // node 2 — the loss mask
  n2mask: string; //          toggle name
  n2maskedNote: string; //    note when mask ON
  n2unmaskedNote: string; //  note when mask OFF
  n2ignoredLegend: string; // legend: prompt cells
  n2gradedLegend: string; //  legend: response cells
  n2tokensGraded: string; //  footer: "tokens graded"
  // node 3 — before vs after
  n3baseLabel: string;
  n3sftLabel: string;
  n3baseTag: string;
  n3sftTag: string;
  n3promptLabel: string;
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

export const supervisedFineTuningEN: SupervisedFineTuningLesson = {
  crumb: "STAGE 0 · 4.3 · SUPERVISED FINE-TUNING",
  eyebrow: "STAGE 0 · 4.3 · 3 NODES",
  title: "Supervised fine-tuning",
  lede: "You already saw that fine-tuning flips a text-continuer into a helper. This is how it's done: train the base model on instruction→answer examples, and grade it only on the answer — so it learns to reply, not to ramble.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The training data", "Grade only the answer", "Base vs SFT"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The data is prompt-and-answer pairs",
      intro: "SFT data isn't raw web text. It's hand-built examples: a prompt, and the exact answer you wish the model would give.",
      bullets: [
        "**Each example has two parts.** The {ring} green **response** is the ideal answer; the grey **prompt** is what a user types.",
        "**Role markers wrap every turn.** Special tokens — `<|user|>`, `<|assistant|>` — tell the model whose turn it is and where the answer begins.",
        "**Quality beats quantity here.** A few hundred thousand clean, human-written pairs teach more than billions of scraped pages.",
        "**These pairs are the whole curriculum** — the model learns the *shape* of a good answer from them.",
      ],
      cardLabel: "ONE TRAINING EXAMPLE",
      aria: "A training example laid out as tokens: a grey prompt region, then a green response region, wrapped in role markers.",
      steps: 1,
      captions: ["Pick an example — the grey cells are the prompt, the green cells are the answer the model should learn."],
      hint: "Switch examples — a question, a rewrite, a coding task. Same shape every time: prompt, then ideal answer.",
      readoutTitle: "EXAMPLE",
      rows: ["PROMPT", "RESPONSE"],
      optionNotes: [
        "A factual question. The ideal answer states the fact directly — no preamble, no follow-up questions of its own.",
        "A rewrite instruction. The response is the rewritten text, in the exact tone that was asked for.",
        "A coding task. The response is just the working function — the model learns to output code, not chit-chat.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The trick: grade only the answer",
      intro: "Here's what makes SFT work. The model reads the whole sequence and predicts every next token — but the loss, its grade, is counted only on the response.",
      bullets: [
        "**The prompt is context, not a target.** The model reads it, but earns no gradient for reproducing it — so it never learns to *write your questions for you*.",
        "**The {ring} answer tokens carry the loss.** Each green cell's prediction is compared to the ideal token; that gap is what training shrinks.",
        "**Masking = setting the prompt's loss to zero.** Turn the mask off and the model wastes effort learning to continue the prompt — the exact base-model habit you're breaking.",
        "**One idea, one toggle** — flip the mask and watch which cells get graded.",
      ],
      cardLabel: "LOSS MASK · WHAT GETS GRADED",
      aria: "The same token strip with a loss bar under each response token; the prompt tokens are greyed out and ungraded.",
      steps: 1,
      captions: ["Grey cells are read but not graded; only the green answer cells feed a loss back into the weights."],
      hint: "Toggle the mask — grey means 'read, not graded'; green means 'graded against the ideal answer'.",
      readoutTitle: "LOSS_MASK",
      rows: ["GRADED", "IGNORED"],
      sliderNote: "The prompt sets the scene; the answer is what's scored.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Same prompt, before and after",
      intro: "That masked loss, repeated over hundreds of thousands of pairs, is the whole difference. Same prompt, same knowledge underneath — only the fine-tuning changed.",
      bullets: [
        "**The base model continues the text.** It treats your question as a pattern to extend, so you get more questions, or a tangent.",
        "**The SFT model answers.** It learned that after the `<|assistant|>` marker, a helpful reply should follow.",
        "**Nothing new was memorised.** The facts were already inside the base model; SFT taught it *when and how* to hand them over.",
      ],
      cardLabel: "SAME PROMPT · BASE vs SFT",
      aria: "Two output cards for one prompt: the base model's continuation beside the SFT model's answer.",
      steps: 1,
      captions: ["One prompt, two behaviours — the base rambles, the SFT model answers."],
      hint: "Switch the prompt — the base keeps continuing the pattern; the SFT model replies.",
      readoutTitle: "OUTCOME",
      rows: ["BASE", "SFT"],
      optionNotes: [
        "A factual question: the base spins off more questions; the SFT model just answers it.",
        "A rewrite request: the base repeats the instruction pattern; the SFT model returns the rewritten line.",
        "A coding task: the base lists more tasks; the SFT model writes the function.",
      ],
    },
  ],
  examples: [
    { key: "qa", label: "Question", prompt: "What is the capital of France?", response: "The capital of France is Paris." },
    { key: "rewrite", label: "Rewrite", prompt: "Make this friendlier: Send the report.", response: "Could you send the report when you get a chance? Thanks!" },
    { key: "code", label: "Code", prompt: "Write a function that adds two numbers.", response: "def add(a, b): return a + b" },
  ],
  outcomes: [
    { key: "qa", label: "Question", prompt: "What is the capital of France?", base: "What is the capital of Germany? What is the capital of Spain? What is the capital of…", sft: "The capital of France is Paris." },
    { key: "rewrite", label: "Rewrite", prompt: "Make this friendlier: Send the report.", base: "Make this shorter: Send the report. Make this formal: Send the report.", sft: "Could you send the report when you get a chance? Thanks!" },
    { key: "code", label: "Code", prompt: "Write a function that adds two numbers.", base: "Write a function that subtracts two numbers. Write a function that multiplies…", sft: "def add(a, b): return a + b" },
  ],
  n1promptLabel: "PROMPT · what the user types",
  n1responseLabel: "RESPONSE · the ideal answer",
  n1markerLegend: "role marker",
  n2mask: "PROMPT MASK",
  n2maskedNote: "SFT: only the answer is graded. The model reads the prompt for context but earns no gradient there — all of its learning goes into replying.",
  n2unmaskedNote: "Mask off: the model is also rewarded for reproducing the prompt. That wastes capacity and reinforces the 'just continue the text' habit SFT exists to remove.",
  n2ignoredLegend: "prompt · read, not graded",
  n2gradedLegend: "answer · graded",
  n2tokensGraded: "tokens graded",
  n3baseLabel: "BASE MODEL",
  n3sftLabel: "SFT MODEL",
  n3baseTag: "continues the text",
  n3sftTag: "answers the question",
  n3promptLabel: "PROMPT",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "During SFT the model still reads the prompt tokens. So why don't we count them in the loss?",
  explainA: "Because we don't want the model to get better at *writing prompts* — we want it better at *answering* them. The prompt is only context: the model conditions its predictions on it, but if we graded it there too, we'd spend training signal teaching it to reproduce user questions, and we'd reinforce the base model's 'continue the text' reflex — the very habit SFT exists to replace. By zeroing the loss on the prompt and keeping it only on the response, every scrap of gradient pushes toward one skill: given a prompt and the `<|assistant|>` marker, produce a good reply. The knowledge underneath is the same base model — SFT just aims all the learning at *when and how* to use it.",
  bridgeLabel: "NEXT: SYNTHETIC DATA",
  bridgeBody: "Good SFT needs a lot of clean prompt→answer pairs — and humans are slow and expensive to write them. Next, **synthetic data**: using strong models to generate and filter training examples at scale.",
  prevLesson: "Back: optimizers",
  nextLesson: "Continue: Synthetic data",
};

/* ============================================================ SPANISH ======= */

export const supervisedFineTuningES: SupervisedFineTuningLesson = {
  crumb: "ETAPA 0 · 4.3 · AJUSTE FINO SUPERVISADO",
  eyebrow: "ETAPA 0 · 4.3 · 3 NODOS",
  title: "Ajuste fino supervisado",
  lede: "Ya viste que el ajuste fino convierte un continuador de texto en un asistente. Así se hace: entrena el modelo base con ejemplos de instrucción→respuesta, y califícalo solo en la respuesta — para que aprenda a contestar, no a divagar.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Los datos de entrenamiento", "Califica solo la respuesta", "Base vs SFT"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Los datos son pares de prompt y respuesta",
      intro: "Los datos de SFT no son texto web crudo. Son ejemplos hechos a mano: un prompt, y la respuesta exacta que querrías que el modelo diera.",
      bullets: [
        "**Cada ejemplo tiene dos partes.** La **respuesta** {ring} verde es la contestación ideal; el **prompt** gris es lo que escribe un usuario.",
        "**Marcadores de rol envuelven cada turno.** Tokens especiales — `<|user|>`, `<|assistant|>` — le dicen al modelo de quién es el turno y dónde empieza la respuesta.",
        "**Aquí la calidad gana a la cantidad.** Unos cientos de miles de pares limpios, escritos por humanos, enseñan más que miles de millones de páginas raspadas.",
        "**Estos pares son todo el temario** — el modelo aprende de ellos la *forma* de una buena respuesta.",
      ],
      cardLabel: "UN EJEMPLO DE ENTRENAMIENTO",
      aria: "Un ejemplo de entrenamiento como tokens: una región de prompt gris, luego una región de respuesta verde, envueltas en marcadores de rol.",
      steps: 1,
      captions: ["Elige un ejemplo — las celdas grises son el prompt, las verdes son la respuesta que el modelo debe aprender."],
      hint: "Cambia de ejemplo — una pregunta, una reescritura, una tarea de código. La misma forma siempre: prompt, luego respuesta ideal.",
      readoutTitle: "EXAMPLE",
      rows: ["PROMPT", "RESPONSE"],
      optionNotes: [
        "Una pregunta de hecho. La respuesta ideal enuncia el dato directamente — sin preámbulo, sin preguntas propias de seguimiento.",
        "Una instrucción de reescritura. La respuesta es el texto reescrito, en el tono exacto que se pidió.",
        "Una tarea de código. La respuesta es solo la función que funciona — el modelo aprende a producir código, no a charlar.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El truco: califica solo la respuesta",
      intro: "Esto es lo que hace que SFT funcione. El modelo lee toda la secuencia y predice cada token siguiente — pero la pérdida, su calificación, se cuenta solo en la respuesta.",
      bullets: [
        "**El prompt es contexto, no un objetivo.** El modelo lo lee, pero no gana gradiente por reproducirlo — así que nunca aprende a *escribirte las preguntas*.",
        "**Los tokens de la respuesta {ring} llevan la pérdida.** La predicción de cada celda verde se compara con el token ideal; esa diferencia es lo que el entrenamiento reduce.",
        "**Enmascarar = poner en cero la pérdida del prompt.** Apaga la máscara y el modelo malgasta esfuerzo aprendiendo a continuar el prompt — el hábito del modelo base que quieres romper.",
        "**Una idea, un interruptor** — alterna la máscara y mira qué celdas se califican.",
      ],
      cardLabel: "MÁSCARA DE PÉRDIDA · QUÉ SE CALIFICA",
      aria: "La misma tira de tokens con una barra de pérdida bajo cada token de respuesta; los tokens del prompt están en gris y sin calificar.",
      steps: 1,
      captions: ["Las celdas grises se leen pero no se califican; solo las verdes devuelven una pérdida a los pesos."],
      hint: "Alterna la máscara — gris = 'leído, no calificado'; verde = 'calificado contra la respuesta ideal'.",
      readoutTitle: "LOSS_MASK",
      rows: ["GRADED", "IGNORED"],
      sliderNote: "El prompt pone el escenario; la respuesta es lo que se puntúa.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "El mismo prompt, antes y después",
      intro: "Esa pérdida enmascarada, repetida sobre cientos de miles de pares, es toda la diferencia. El mismo prompt, el mismo conocimiento debajo — solo cambió el ajuste fino.",
      bullets: [
        "**El modelo base continúa el texto.** Trata tu pregunta como un patrón que extender, así que recibes más preguntas, o una tangente.",
        "**El modelo SFT responde.** Aprendió que después del marcador `<|assistant|>` debe venir una respuesta útil.",
        "**No se memorizó nada nuevo.** Los datos ya estaban dentro del modelo base; SFT le enseñó *cuándo y cómo* entregarlos.",
      ],
      cardLabel: "EL MISMO PROMPT · BASE vs SFT",
      aria: "Dos tarjetas de salida para un prompt: la continuación del modelo base junto a la respuesta del modelo SFT.",
      steps: 1,
      captions: ["Un prompt, dos conductas — el base divaga, el modelo SFT responde."],
      hint: "Cambia el prompt — el base sigue continuando el patrón; el modelo SFT contesta.",
      readoutTitle: "OUTCOME",
      rows: ["BASE", "SFT"],
      optionNotes: [
        "Una pregunta de hecho: el base dispara más preguntas; el modelo SFT simplemente la responde.",
        "Una reescritura: el base repite el patrón de la instrucción; el modelo SFT devuelve la línea reescrita.",
        "Una tarea de código: el base lista más tareas; el modelo SFT escribe la función.",
      ],
    },
  ],
  examples: [
    { key: "qa", label: "Pregunta", prompt: "¿Cuál es la capital de Francia?", response: "La capital de Francia es París." },
    { key: "rewrite", label: "Reescribir", prompt: "Hazlo más amable: Envía el informe.", response: "¿Podrías enviar el informe cuando puedas? ¡Gracias!" },
    { key: "code", label: "Código", prompt: "Escribe una función que sume dos números.", response: "def add(a, b): return a + b" },
  ],
  outcomes: [
    { key: "qa", label: "Pregunta", prompt: "¿Cuál es la capital de Francia?", base: "¿Cuál es la capital de Alemania? ¿Cuál es la capital de España? ¿Cuál es la capital de…", sft: "La capital de Francia es París." },
    { key: "rewrite", label: "Reescribir", prompt: "Hazlo más amable: Envía el informe.", base: "Hazlo más corto: Envía el informe. Hazlo más formal: Envía el informe.", sft: "¿Podrías enviar el informe cuando puedas? ¡Gracias!" },
    { key: "code", label: "Código", prompt: "Escribe una función que sume dos números.", base: "Escribe una función que reste dos números. Escribe una función que multiplique…", sft: "def add(a, b): return a + b" },
  ],
  n1promptLabel: "PROMPT · lo que escribe el usuario",
  n1responseLabel: "RESPONSE · la respuesta ideal",
  n1markerLegend: "marcador de rol",
  n2mask: "MÁSCARA DEL PROMPT",
  n2maskedNote: "SFT: solo se califica la respuesta. El modelo lee el prompt como contexto pero no gana gradiente ahí — todo su aprendizaje va a responder.",
  n2unmaskedNote: "Máscara apagada: el modelo también es premiado por reproducir el prompt. Eso malgasta capacidad y refuerza el hábito de 'solo continuar el texto' que SFT quiere quitar.",
  n2ignoredLegend: "prompt · leído, no calificado",
  n2gradedLegend: "respuesta · calificada",
  n2tokensGraded: "tokens calificados",
  n3baseLabel: "MODELO BASE",
  n3sftLabel: "MODELO SFT",
  n3baseTag: "continúa el texto",
  n3sftTag: "responde la pregunta",
  n3promptLabel: "PROMPT",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Durante SFT el modelo igual lee los tokens del prompt. ¿Por qué no los contamos en la pérdida?",
  explainA: "Porque no queremos que el modelo sea mejor *escribiendo prompts* — lo queremos mejor *respondiéndolos*. El prompt es solo contexto: el modelo condiciona sus predicciones en él, pero si también lo calificáramos ahí, gastaríamos señal de entrenamiento enseñándole a reproducir preguntas de usuario, y reforzaríamos el reflejo de 'continuar el texto' del modelo base — justo el hábito que SFT existe para reemplazar. Al poner en cero la pérdida del prompt y dejarla solo en la respuesta, cada pizca de gradiente empuja hacia una sola habilidad: dado un prompt y el marcador `<|assistant|>`, producir una buena respuesta. El conocimiento debajo es el mismo modelo base — SFT solo dirige todo el aprendizaje hacia *cuándo y cómo* usarlo.",
  bridgeLabel: "SIGUIENTE: DATOS SINTÉTICOS",
  bridgeBody: "Un buen SFT necesita muchos pares limpios de prompt→respuesta — y los humanos son lentos y caros para escribirlos. Sigue **datos sintéticos**: usar modelos fuertes para generar y filtrar ejemplos de entrenamiento a escala.",
  prevLesson: "Atrás: optimizadores",
  nextLesson: "Continuar: Datos sintéticos",
};
