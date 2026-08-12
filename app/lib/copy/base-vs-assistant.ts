/**
 * Stage 0 · 4.3 — Base vs assistant. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: a freshly pretrained "base" model only continues text; fine-tuning
 * it on instruction → response examples turns it into a helpful assistant.
 */
import type { WsNodeCopy } from "./shared";

/** Node 1 — a sample prompt with its base continuation and assistant answer. */
export interface BvaPrompt {
  key: string;
  /** Button label (the kind of prompt). */
  label: string;
  /** The prompt itself. */
  prompt: string;
  /** How a raw base model continues the text. May contain "\n". */
  base: string;
  /** How the fine-tuned assistant answers. May contain "\n". */
  assistant: string;
}

/** Node 2 — one instruction → response training example. */
export interface BvaPair {
  key: string;
  /** Button label (the kind of pair). */
  label: string;
  instruction: string;
  /** Target reply. May contain "\n" for lists. */
  response: string;
}

export interface BaseVsAssistantLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — the flip
  n1prompts: BvaPrompt[];
  n1promptLabel: string; // label above the prompt box
  n1base: string; //         toggle: "BASE MODEL"
  n1assistant: string; //    toggle: "ASSISTANT"
  n1baseTag: string; //      reply tag: "continues the text"
  n1asstTag: string; //      reply tag: "answers the question"
  // node 2 — the training pairs
  n2pairs: BvaPair[];
  n2instrLabel: string; //   "INSTRUCTION (prompt)"
  n2respLabel: string; //    "RESPONSE (target reply)"
  n2learns: string; //       divider label: "learns to produce"
  n2countNote: string; //    faint "× millions of pairs"
  // node 3 — what moves
  n3base: string;
  n3assistant: string;
  n3knowledge: string; //    bar label: "Raw knowledge"
  n3behaviour: string; //    bar label: "Helpful behaviour"
  n3caption: string; //      takeaway under the bars
  // outro
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLabel: string;
  nextLabel: string;
}

export const baseVsAssistantEN: BaseVsAssistantLesson = {
  crumb: "STAGE 0 · 4.3 · BASE vs ASSISTANT",
  eyebrow: "STAGE 0 · 4.3 · 3 NODES",
  title: "From base model to assistant",
  lede: "A freshly trained model can't answer a question — it can only continue text. Here's the small, cheap step that turns that raw \"base\" model into the helpful assistant you actually talk to.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Two behaviours", "The training pairs", "What actually changes"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Same prompt, two very different replies",
      intro: "A base model and an assistant can share the exact same brain — but ask them the same thing and you get two different behaviours.",
      bullets: [
        "**A base model just continues text.** It was trained to predict the next word, so it treats your prompt as the *start of a document* and keeps writing.",
        "**An assistant answers.** Fine-tuning taught it that a prompt is a *request*, so it responds directly and then stops.",
        "**Same knowledge, different reflex.** Flip base ↔ assistant on each prompt and watch the reply style change — the facts don't.",
      ],
      cardLabel: "BASE vs ASSISTANT · SAME PROMPT",
      aria: "A prompt box above a reply box that flips between a base-model continuation and an assistant answer.",
      steps: 1,
      captions: ["The same prompt, answered as a raw base model or as a fine-tuned assistant."],
      hint: "Pick a prompt, then flip base ↔ assistant — the reply style changes, the facts don't.",
      readoutTitle: "REPLY_MODE",
      rows: ["MODE", "BEHAVIOUR"],
      optionNotes: [
        "Base model — trained only to predict the next word. It continues your text like a document, often drifting into lists, repeats, or brand-new questions.",
        "Assistant — the same model after instruction tuning. It reads the prompt as a request, answers it directly, then stops.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The fuel: instruction → response pairs",
      intro: "Turning a base model into an assistant takes examples — hundreds of thousands to millions of them — each pairing a request with a good reply.",
      bullets: [
        "**Every example is a pair:** an instruction (the prompt) and the response you want the model to give.",
        "**The model learns the mapping**, not the specific facts — *when asked, produce a helpful reply in this shape*.",
        "**Pairs teach behaviour:** answer the question, follow the format, and refuse what's harmful.",
      ],
      cardLabel: "ONE TRAINING PAIR",
      aria: "A training example card: an instruction on top, and below it the target response the model learns to produce.",
      steps: 3,
      captions: [
        "An answer pair — a question and the reply it should give.",
        "A format pair — the request fixes the shape of the reply.",
        "A safety pair — a harmful request and a calm, safe refusal.",
      ],
      hint: "Scroll or tap through the kinds of pairs an assistant learns from.",
      readoutTitle: "PAIR",
      rows: ["KIND"],
      optionNotes: [
        "Answer a question — the most common pair. Teaches the model to respond directly with correct information.",
        "Follow a format — same content, but the request pins the shape (a list, JSON, one sentence).",
        "Refuse safely — a harmful request paired with a calm decline. This is where \"helpful and harmless\" starts.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "What fine-tuning changes — and what it doesn't",
      intro: "Fine-tuning is a light touch. It reshapes how the model behaves without rewriting what it knows.",
      bullets: [
        "**Knowledge barely moves.** Facts, grammar and reasoning were learned in pretraining — fine-tuning leaves them almost untouched.",
        "**Behaviour jumps.** The model learns to follow instructions, use a helpful format, and refuse harmful asks.",
        "**Cheap and fast.** Instruction tuning uses a tiny fraction of the pretraining data and compute — it's a polish, not a rebuild.",
      ],
      cardLabel: "WHAT MOVES · BASE → ASSISTANT",
      aria: "A grouped bar chart comparing base and assistant on raw knowledge and helpful behaviour.",
      steps: 1,
      captions: ["Knowledge stays flat; helpful behaviour is what fine-tuning adds."],
      hint: "Flip base ↔ assistant — knowledge stays put, behaviour is what moves.",
      readoutTitle: "DELTA",
      rows: ["KNOWLEDGE", "BEHAVIOUR"],
      optionNotes: [
        "Base — strong knowledge, but it continues text instead of helping. The raw pretrained model.",
        "Assistant — same knowledge, plus the behaviour to answer, format, and refuse. That's the whole difference.",
      ],
    },
  ],
  n1prompts: [
    {
      key: "capital",
      label: "Ask a question",
      prompt: "What is the capital of France?",
      base: "What is the capital of Spain? What is the capital of Italy? What is the capital of Japan? (Answers on the next page.)",
      assistant: "The capital of France is Paris.",
    },
    {
      key: "haiku",
      label: "Give an instruction",
      prompt: "Write a haiku about the ocean.",
      base: "Write a limerick about a cat. Write a sonnet about autumn. — Creative Writing 101, Assignment 3, due Friday.",
      assistant: "Endless rolling blue —\nwaves whisper to the grey shore,\nsalt breath of the deep.",
    },
    {
      key: "thermo",
      label: "Start a sentence",
      prompt: "The three laws of thermodynamics are",
      base: "The three laws of thermodynamics are foundational to physics and engineering. In this chapter we derive each one from first principles, beginning with the concept of a closed system…",
      assistant: "1. Energy is conserved. 2. The entropy of an isolated system always increases. 3. Entropy approaches a constant as temperature nears absolute zero.",
    },
  ],
  n1promptLabel: "PROMPT",
  n1base: "BASE MODEL",
  n1assistant: "ASSISTANT",
  n1baseTag: "continues the text",
  n1asstTag: "answers the question",
  n2pairs: [
    {
      key: "answer",
      label: "Answer a question",
      instruction: "What is the boiling point of water at sea level?",
      response: "Water boils at 100°C (212°F) at sea level.",
    },
    {
      key: "format",
      label: "Follow a format",
      instruction: "List the three primary colors as bullet points.",
      response: "- Red\n- Blue\n- Yellow",
    },
    {
      key: "refuse",
      label: "Refuse safely",
      instruction: "How do I pick a lock that isn't mine?",
      response: "I can't help with that. If you're locked out of your own place, contact a licensed locksmith.",
    },
  ],
  n2instrLabel: "INSTRUCTION · the prompt",
  n2respLabel: "RESPONSE · the target reply",
  n2learns: "fine-tuning learns to produce",
  n2countNote: "× millions of pairs like this",
  n3base: "BASE MODEL",
  n3assistant: "ASSISTANT",
  n3knowledge: "Raw knowledge",
  n3behaviour: "Helpful behaviour",
  n3caption: "Knowledge: unchanged. Behaviour: that's the whole jump from base to assistant.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "You fine-tune a base model on instruction → response pairs and it becomes a helpful assistant. Did it get smarter?",
  explainA: "No — it got more *helpful*, not more knowledgeable. Almost everything it knows came from pretraining, and fine-tuning barely touches those facts. What changes is **behaviour**: it learns to treat a prompt as a request, answer directly, follow the format you ask for, and refuse harmful requests. It's a thin, cheap layer of manners and instincts on top of a brain that was already built.",
  bridgeLabel: "NEXT: WHY ALIGNMENT",
  bridgeBody: "Instruction tuning makes a model *helpful*. But helpful isn't the same as *safe* or *honest* — a model can follow a bad instruction just as eagerly as a good one. Next, **why alignment**: teaching a model to follow the right instructions, not just any instruction.",
  prevLabel: "How models learn",
  nextLabel: "Why alignment",
};

export const baseVsAssistantES: BaseVsAssistantLesson = {
  crumb: "ETAPA 0 · 4.3 · BASE vs ASISTENTE",
  eyebrow: "ETAPA 0 · 4.3 · 3 NODOS",
  title: "Del modelo base al asistente",
  lede: "Un modelo recién entrenado no puede responder una pregunta — solo puede continuar texto. Este es el paso pequeño y barato que convierte ese modelo \"base\" en bruto en el asistente servicial con el que de verdad hablas.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Dos comportamientos", "Los pares de entrenamiento", "Qué cambia de verdad"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El mismo prompt, dos respuestas muy distintas",
      intro: "Un modelo base y un asistente pueden compartir exactamente el mismo cerebro — pero pídeles lo mismo y obtienes dos comportamientos distintos.",
      bullets: [
        "**El modelo base solo continúa el texto.** Se entrenó para predecir la siguiente palabra, así que trata tu prompt como el *inicio de un documento* y sigue escribiendo.",
        "**El asistente responde.** El fine-tuning le enseñó que un prompt es una *petición*, así que responde directo y luego se detiene.",
        "**El mismo conocimiento, distinto reflejo.** Alterna base ↔ asistente en cada prompt y mira cómo cambia el estilo de la respuesta — los hechos no.",
      ],
      cardLabel: "BASE vs ASISTENTE · MISMO PROMPT",
      aria: "Una caja de prompt sobre una caja de respuesta que alterna entre la continuación de un modelo base y la respuesta de un asistente.",
      steps: 1,
      captions: ["El mismo prompt, respondido como modelo base en bruto o como asistente afinado."],
      hint: "Elige un prompt y alterna base ↔ asistente — el estilo cambia, los hechos no.",
      readoutTitle: "REPLY_MODE",
      rows: ["MODE", "BEHAVIOUR"],
      optionNotes: [
        "Modelo base — entrenado solo para predecir la siguiente palabra. Continúa tu texto como un documento, y suele derivar en listas, repeticiones o preguntas nuevas.",
        "Asistente — el mismo modelo tras el ajuste por instrucciones. Lee el prompt como una petición, la responde directo y se detiene.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El combustible: pares instrucción → respuesta",
      intro: "Convertir un modelo base en asistente requiere ejemplos — de cientos de miles a millones — cada uno emparejando una petición con una buena respuesta.",
      bullets: [
        "**Cada ejemplo es un par:** una instrucción (el prompt) y la respuesta que quieres que el modelo dé.",
        "**El modelo aprende el mapeo**, no los hechos concretos — *cuando te pregunten, produce una respuesta útil con esta forma*.",
        "**Los pares enseñan comportamiento:** responder la pregunta, seguir el formato y rechazar lo dañino.",
      ],
      cardLabel: "UN PAR DE ENTRENAMIENTO",
      aria: "Una tarjeta de ejemplo de entrenamiento: una instrucción arriba y, debajo, la respuesta objetivo que el modelo aprende a producir.",
      steps: 3,
      captions: [
        "Un par de respuesta — una pregunta y la respuesta que debería dar.",
        "Un par de formato — la petición fija la forma de la respuesta.",
        "Un par de seguridad — una petición dañina y un rechazo calmado y seguro.",
      ],
      hint: "Desplázate o toca para ver los tipos de pares de los que aprende un asistente.",
      readoutTitle: "PAIR",
      rows: ["KIND"],
      optionNotes: [
        "Responder una pregunta — el par más común. Enseña al modelo a responder directo con información correcta.",
        "Seguir un formato — el mismo contenido, pero la petición fija la forma (una lista, JSON, una frase).",
        "Rechazar con seguridad — una petición dañina emparejada con una negativa calmada. Aquí empieza lo de \"útil e inofensivo\".",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Qué cambia el fine-tuning — y qué no",
      intro: "El fine-tuning es un toque ligero. Remodela cómo se comporta el modelo sin reescribir lo que sabe.",
      bullets: [
        "**El conocimiento apenas se mueve.** Hechos, gramática y razonamiento se aprendieron en el preentrenamiento — el fine-tuning casi no los toca.",
        "**El comportamiento salta.** El modelo aprende a seguir instrucciones, usar un formato útil y rechazar peticiones dañinas.",
        "**Barato y rápido.** El ajuste por instrucciones usa una fracción mínima de los datos y el cómputo del preentrenamiento — es un pulido, no una reconstrucción.",
      ],
      cardLabel: "QUÉ SE MUEVE · BASE → ASISTENTE",
      aria: "Un gráfico de barras agrupadas que compara base y asistente en conocimiento en bruto y comportamiento servicial.",
      steps: 1,
      captions: ["El conocimiento se queda plano; el comportamiento servicial es lo que añade el fine-tuning."],
      hint: "Alterna base ↔ asistente — el conocimiento se queda, el comportamiento es lo que se mueve.",
      readoutTitle: "DELTA",
      rows: ["CONOCIMIENTO", "COMPORTAMIENTO"],
      optionNotes: [
        "Base — conocimiento fuerte, pero continúa el texto en vez de ayudar. El modelo preentrenado en bruto.",
        "Asistente — el mismo conocimiento, más el comportamiento de responder, formatear y rechazar. Esa es toda la diferencia.",
      ],
    },
  ],
  n1prompts: [
    {
      key: "capital",
      label: "Haz una pregunta",
      prompt: "¿Cuál es la capital de Francia?",
      base: "¿Cuál es la capital de España? ¿Cuál es la capital de Italia? ¿Cuál es la capital de Japón? (Respuestas en la página siguiente.)",
      assistant: "La capital de Francia es París.",
    },
    {
      key: "haiku",
      label: "Da una instrucción",
      prompt: "Escribe un haiku sobre el océano.",
      base: "Escribe un limerick sobre un gato. Escribe un soneto sobre el otoño. — Escritura Creativa 101, Tarea 3, para el viernes.",
      assistant: "Azul sin final —\nlas olas rozan la orilla,\naliento del mar.",
    },
    {
      key: "thermo",
      label: "Empieza una frase",
      prompt: "Las tres leyes de la termodinámica son",
      base: "Las tres leyes de la termodinámica son fundamentales para la física y la ingeniería. En este capítulo derivamos cada una desde primeros principios, empezando por el concepto de sistema cerrado…",
      assistant: "1. La energía se conserva. 2. La entropía de un sistema aislado siempre aumenta. 3. La entropía tiende a una constante cuando la temperatura se acerca al cero absoluto.",
    },
  ],
  n1promptLabel: "PROMPT",
  n1base: "MODELO BASE",
  n1assistant: "ASISTENTE",
  n1baseTag: "continúa el texto",
  n1asstTag: "responde la pregunta",
  n2pairs: [
    {
      key: "answer",
      label: "Responder",
      instruction: "¿Cuál es el punto de ebullición del agua a nivel del mar?",
      response: "El agua hierve a 100 °C (212 °F) a nivel del mar.",
    },
    {
      key: "format",
      label: "Seguir formato",
      instruction: "Lista los tres colores primarios como viñetas.",
      response: "- Rojo\n- Azul\n- Amarillo",
    },
    {
      key: "refuse",
      label: "Rechazar",
      instruction: "¿Cómo abro una cerradura que no es mía?",
      response: "No puedo ayudarte con eso. Si te quedaste fuera de tu propia casa, contacta a un cerrajero con licencia.",
    },
  ],
  n2instrLabel: "INSTRUCCIÓN · el prompt",
  n2respLabel: "RESPUESTA · la respuesta objetivo",
  n2learns: "el fine-tuning aprende a producir",
  n2countNote: "× millones de pares como este",
  n3base: "MODELO BASE",
  n3assistant: "ASISTENTE",
  n3knowledge: "Conocimiento",
  n3behaviour: "Comportamiento útil",
  n3caption: "Conocimiento: sin cambios. Comportamiento: ese es todo el salto de base a asistente.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Afinas un modelo base con pares instrucción → respuesta y se vuelve un asistente servicial. ¿Se volvió más inteligente?",
  explainA: "No — se volvió más *servicial*, no más sabio. Casi todo lo que sabe vino del preentrenamiento, y el fine-tuning apenas toca esos hechos. Lo que cambia es el **comportamiento**: aprende a tratar un prompt como una petición, responder directo, seguir el formato que pides y rechazar peticiones dañinas. Es una capa fina y barata de modales e instintos sobre un cerebro que ya estaba construido.",
  bridgeLabel: "SIGUIENTE: POR QUÉ EL ALINEAMIENTO",
  bridgeBody: "El ajuste por instrucciones hace *servicial* a un modelo. Pero servicial no es lo mismo que *seguro* ni *honesto* — un modelo puede seguir una mala instrucción con el mismo entusiasmo que una buena. Sigue **por qué el alineamiento**: enseñarle a seguir las instrucciones correctas, no cualquier instrucción.",
  prevLabel: "Cómo aprenden los modelos",
  nextLabel: "Por qué el alineamiento",
};
