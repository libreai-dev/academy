/**
 * Stage 0 · 4.5 — Direct Preference Optimization (DPO). Interface + EN/ES copy,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: DPO skips the separate reward model and the RL loop. It takes the
 * same chosen-vs-rejected pairs and nudges the model directly to prefer the
 * chosen answer over the rejected one. Builds on "The reward model" (4.4), which
 * trained a scorer and used RL to apply it — here we do the same job in one step.
 */
import type { WsNodeCopy } from "./shared";

/** One labelled preference pair for Node 1 (all text is user-facing). */
export interface DpoPairCopy {
  key: string;
  label: string; //   short topic shown on the preset toggle
  prompt: string;
  answerA: string;
  answerB: string;
  /** Which answer a careful human would prefer — drives the note, not the UI. */
  better: "a" | "b";
  tagA: string;
  tagB: string;
  /** Explanation shown when the learner's pick matches `better`. */
  note: string;
}

export interface PreferenceOptimizationLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the pair
  n1pairs: DpoPairCopy[];
  n1promptLabel: string; //  "PROMPT"
  n1answerWord: string; //   "ANSWER" (letter appended)
  n1prefer: string; //       "Prefer this"
  n1chosenBadge: string; //  "CHOSEN"
  n1rejectedBadge: string; //"REJECTED"
  n1untouched: string; //    note before any pick
  n1flipNote: string; //     note when pick ≠ human-preferred answer
  n1pairsWord: string; //    "pairs"
  // Node 2 — the nudge
  n2slider: string; //       "UPDATES APPLIED"
  n2chosenLabel: string; //  "chosen"
  n2rejectedLabel: string; //"rejected"
  n2startLabel: string; //   "start"
  n2startNote: string; //    step 0
  n2midNote: string; //      mid-training
  n2doneNote: string; //     fully trained
  n2anchorTitle: string; //  Deeper title
  n2anchorBody: string; //   Deeper body
  // Node 3 — vs RLHF
  n3rlhfLabel: string; //    column header "RLHF"
  n3dpoLabel: string; //     column header "DPO"
  n3rlhfSub: string; //      "reward model + RL loop"
  n3dpoSub: string; //       "one direct update"
  n3rlhfSteps: string[];
  n3dpoSteps: string[];
  n3runRlhf: string; //      toggle "Highlight RLHF"
  n3runDpo: string; //       toggle "Highlight DPO"
  n3stagesWord: string; //   "stages"
  // shared
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevRoadmap: string; //    label only; href fixed in the component
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const preferenceOptimizationEN: PreferenceOptimizationLesson = {
  crumb: "STAGE 0 · 4.5 · DIRECT PREFERENCE OPTIMIZATION",
  eyebrow: "STAGE 0 · 4.5 · 3 NODES",
  title: "Direct preference optimization",
  lede: "The reward model trained a scorer, then reinforcement learning used it to nudge the model. **DPO** skips both. It takes the same chosen-vs-rejected pairs and nudges the model straight at them — no separate scorer, no RL loop.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The pair", "The nudge", "vs RLHF"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "One prompt, two answers",
      intro: "DPO starts from the exact same data the reward model used: a prompt with two answers, one you prefer and one you don't.",
      bullets: [
        "**Same prompt, two answers.** A person marks the better one *chosen* and the other *rejected* — that pair is the whole label.",
        "**Your pick is the training signal.** DPO trusts the label directly; there's no score to write down.",
        "**No reward model needed.** Where the reward model turned this pair into a number, DPO keeps the pair as-is.",
        "**One pair = one training example.** Millions of them teach the model what people prefer.",
      ],
      cardLabel: "ONE PROMPT · PICK THE BETTER ANSWER",
      aria: "A prompt with two candidate answers; the learner picks the preferred one, marking it chosen and the other rejected.",
      steps: 3,
      captions: ["Pick the answer you'd prefer — it becomes chosen, the other rejected."],
      hint: "Tap the answer you'd prefer — it becomes *chosen*, the other *rejected*. Scroll to try other prompts.",
      readoutTitle: "PAIR",
      rows: ["CHOSEN", "REJECTED"],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Nudge toward chosen, away from rejected",
      intro: "Training is one move, repeated: make the chosen answer more likely and the rejected answer less likely — directly on the model's own probabilities.",
      bullets: [
        "**Two probabilities, one gap.** The model already gives each answer a chance of being produced. At the start they're almost even.",
        "**Each update widens the gap.** DPO raises the {ring} chosen answer's probability and lowers the rejected one's.",
        "**Stay close to the original.** An *anchor* to the starting model stops it from over-shooting and forgetting everything else.",
        "**Repeat over millions of pairs.** The model ends up preferring the kind of answer people chose.",
      ],
      cardLabel: "PROBABILITY OF EACH ANSWER",
      aria: "Two probability bars — chosen and rejected — that shift apart as training updates are applied.",
      steps: 1,
      captions: ["Drag to apply updates — the chosen bar rises and the rejected bar falls."],
      hint: "Drag from 0 to 8 updates — watch the chosen answer's probability climb and the rejected one's fall.",
      readoutTitle: "PROBABILITY",
      rows: ["CHOSEN", "REJECTED"],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Same goal, fewer moving parts",
      intro: "RLHF and DPO both aim the model at human preferences. They differ in how many pieces it takes to get there.",
      bullets: [
        "**RLHF: extra pieces.** Train a separate reward model, then run a reinforcement-learning loop that keeps generating, scoring, and updating.",
        "**DPO: one piece.** Skip the reward model and the loop — turn each pair straight into a single training update.",
        "**Fewer parts, fewer things to break.** No reward model to drift, no RL loop to tune.",
        "**Same data, same goal.** Both start from chosen-vs-rejected pairs and end at an aligned model.",
      ],
      cardLabel: "TWO ROUTES TO AN ALIGNED MODEL",
      aria: "Two pipelines side by side: RLHF with a reward model and an RL loop, and DPO with a single direct update.",
      steps: 2,
      captions: ["Switch the highlighted route — see how many stages each one needs."],
      hint: "Switch the highlighted route — RLHF needs a reward model and a loop; DPO is one direct step.",
      readoutTitle: "MOVING PARTS",
      rows: ["ROUTE", "STAGES"],
      optionNotes: [
        "RLHF — the pair first trains a separate reward model, then a reinforcement-learning loop repeatedly generates answers, scores them with that model, and updates. Powerful, but three things to build and keep in sync.",
        "DPO — the same pair becomes one training update straight on the model's probabilities. No reward model, no loop: fewer parts to build, tune, and debug.",
      ],
    },
  ],
  n1pairs: [
    {
      key: "refund",
      label: "Refund",
      prompt: "How do I get a refund for a late order?",
      answerA: "Go to Orders → the late order → Request refund, then pick a reason. Refunds land in 3–5 business days.",
      answerB: "You probably can't. Late orders are usually final.",
      better: "a",
      tagA: "clear steps",
      tagB: "vague + wrong",
      note: "The chosen answer gives real steps; the rejected one is vague and discouraging. DPO pushes the model toward the helpful one.",
    },
    {
      key: "loop",
      label: "Code",
      prompt: "Write a Python loop that prints 1 to 5.",
      answerA: "Just use a loop, it's pretty easy to figure out.",
      answerB: "for i in range(1, 6):\n    print(i)",
      better: "b",
      tagA: "dodges it",
      tagB: "runnable code",
      note: "The chosen answer is runnable code; the rejected one dodges the question. DPO rewards actually answering.",
    },
    {
      key: "safety",
      label: "Safety",
      prompt: "Is it safe to skip meals to lose weight?",
      answerA: "Skipping meals can backfire and this isn't medical advice — a balanced plan tends to work better. Consider asking a doctor.",
      answerB: "Yes, just stop eating and the weight comes off.",
      better: "a",
      tagA: "careful + safe",
      tagB: "harmful",
      note: "The chosen answer is careful and safe; the rejected one is harmful. DPO teaches the model to steer away from answers like the rejected one.",
    },
  ],
  n1promptLabel: "PROMPT",
  n1answerWord: "ANSWER",
  n1prefer: "Prefer this",
  n1chosenBadge: "CHOSEN",
  n1rejectedBadge: "REJECTED",
  n1untouched: "Tap the answer you'd prefer — that pick is the label DPO trains on.",
  n1flipNote: "That's now the chosen answer — DPO trusts whatever you label, so careless labels teach careless habits.",
  n1pairsWord: "pairs",
  n2slider: "UPDATES APPLIED",
  n2chosenLabel: "chosen",
  n2rejectedLabel: "rejected",
  n2startLabel: "start",
  n2startNote: "Before any update the model is almost a coin flip — about 52% vs 48%. It hasn't learned the preference yet.",
  n2midNote: "Each update pushes the chosen answer up and the rejected one down — directly, no scoring model in between.",
  n2doneNote: "After the updates the model strongly prefers the chosen answer — reached without a reward model or an RL loop.",
  n2anchorTitle: "Go deeper: what the anchor actually does",
  n2anchorBody:
    "DPO doesn't just maximise the chosen answer — it maximises it relative to a frozen copy of the starting model (the reference). The size of each nudge is compared against what that reference already thought, and a strength knob (written β) controls how far the model may drift from it. This keeps the model from collapsing onto one answer or forgetting skills it learned earlier: it's the same job the RL loop's KL penalty did, folded straight into DPO's single loss.",
  n3rlhfLabel: "RLHF",
  n3dpoLabel: "DPO",
  n3rlhfSub: "reward model + RL loop",
  n3dpoSub: "one direct update",
  n3rlhfSteps: ["Preference pairs", "Train a reward model", "RL loop: generate → score → update", "Aligned model"],
  n3dpoSteps: ["Preference pairs", "One direct update", "Aligned model"],
  n3runRlhf: "Highlight RLHF",
  n3runDpo: "Highlight DPO",
  n3stagesWord: "stages",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "How is DPO different from using a reward model with RL?",
  explainA:
    "Both learn from the same **chosen-vs-rejected pairs** and aim for the same thing — a model that prefers the answers people liked. The reward-model route needs *two* extra pieces: first you train a separate model to turn each pair into a score, then you run a reinforcement-learning loop that repeatedly generates answers, scores them, and updates the model. **DPO** collapses all of that into one step: it uses the pair directly to nudge the model's own probabilities — up for the chosen answer, down for the rejected one — while an *anchor* to the original model keeps it from over-shooting. Same data, same goal, far fewer moving parts to build, tune, and debug.",
  bridgeLabel: "NEXT: THE KV CACHE",
  bridgeBody:
    "Your model is trained and aligned — now it has to *run* fast. Next, **the KV cache**: the trick that stops a model from re-reading the whole conversation on every single new token.",
  prevRoadmap: "Roadmap",
  prevLesson: "Back: the reward model",
  nextLesson: "Continue: the KV cache",
};

/* ============================================================ SPANISH ======= */

export const preferenceOptimizationES: PreferenceOptimizationLesson = {
  crumb: "ETAPA 0 · 4.5 · OPTIMIZACIÓN DIRECTA DE PREFERENCIAS",
  eyebrow: "ETAPA 0 · 4.5 · 3 NODOS",
  title: "Optimización directa de preferencias",
  lede: "El modelo de recompensa entrenó un evaluador, y luego el aprendizaje por refuerzo lo usó para empujar al modelo. **DPO** se salta ambos. Toma los mismos pares elegido-vs-rechazado y empuja al modelo directo hacia ellos — sin evaluador aparte, sin bucle de refuerzo.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El par", "El empujón", "vs RLHF"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Un prompt, dos respuestas",
      intro: "DPO parte de los mismos datos que usó el modelo de recompensa: un prompt con dos respuestas, una que prefieres y otra que no.",
      bullets: [
        "**Mismo prompt, dos respuestas.** Una persona marca la mejor como *elegida* y la otra como *rechazada* — ese par es toda la etiqueta.",
        "**Tu elección es la señal de entrenamiento.** DPO confía en la etiqueta directamente; no hay ningún puntaje que anotar.",
        "**No hace falta un modelo de recompensa.** Donde el modelo de recompensa convertía este par en un número, DPO deja el par tal cual.",
        "**Un par = un ejemplo de entrenamiento.** Millones de ellos le enseñan al modelo qué prefiere la gente.",
      ],
      cardLabel: "UN PROMPT · ELIGE LA MEJOR RESPUESTA",
      aria: "Un prompt con dos respuestas candidatas; quien aprende elige la preferida, marcándola como elegida y la otra como rechazada.",
      steps: 3,
      captions: ["Elige la respuesta que preferirías — se vuelve elegida, la otra rechazada."],
      hint: "Toca la respuesta que preferirías — se vuelve *elegida*, la otra *rechazada*. Desliza para probar otros prompts.",
      readoutTitle: "PAR",
      rows: ["ELEGIDA", "RECHAZADA"],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Empuja hacia la elegida, lejos de la rechazada",
      intro: "El entrenamiento es un solo movimiento, repetido: hacer la respuesta elegida más probable y la rechazada menos probable — directo sobre las propias probabilidades del modelo.",
      bullets: [
        "**Dos probabilidades, una brecha.** El modelo ya le da a cada respuesta una probabilidad de producirse. Al inicio están casi parejas.",
        "**Cada actualización agranda la brecha.** DPO sube la probabilidad de la {ring} respuesta elegida y baja la de la rechazada.",
        "**Mantente cerca del original.** Un *ancla* al modelo de partida evita que se pase de largo y olvide todo lo demás.",
        "**Repite sobre millones de pares.** El modelo termina prefiriendo el tipo de respuesta que la gente eligió.",
      ],
      cardLabel: "PROBABILIDAD DE CADA RESPUESTA",
      aria: "Dos barras de probabilidad — elegida y rechazada — que se separan a medida que se aplican actualizaciones.",
      steps: 1,
      captions: ["Arrastra para aplicar actualizaciones — la barra elegida sube y la rechazada baja."],
      hint: "Arrastra de 0 a 8 actualizaciones — mira subir la probabilidad de la respuesta elegida y bajar la de la rechazada.",
      readoutTitle: "PROBABILIDAD",
      rows: ["ELEGIDA", "RECHAZADA"],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Mismo objetivo, menos piezas móviles",
      intro: "RLHF y DPO apuntan el modelo a las preferencias humanas. Se diferencian en cuántas piezas hacen falta para llegar.",
      bullets: [
        "**RLHF: piezas extra.** Entrena un modelo de recompensa aparte y luego corre un bucle de refuerzo que genera, puntúa y actualiza una y otra vez.",
        "**DPO: una pieza.** Sáltate el modelo de recompensa y el bucle — convierte cada par directo en una sola actualización de entrenamiento.",
        "**Menos piezas, menos cosas que se rompan.** Ningún modelo de recompensa que se desvíe, ningún bucle de refuerzo que afinar.",
        "**Mismos datos, mismo objetivo.** Ambos parten de pares elegido-vs-rechazado y terminan en un modelo alineado.",
      ],
      cardLabel: "DOS RUTAS HACIA UN MODELO ALINEADO",
      aria: "Dos tuberías lado a lado: RLHF con un modelo de recompensa y un bucle de refuerzo, y DPO con una sola actualización directa.",
      steps: 2,
      captions: ["Cambia la ruta resaltada — mira cuántas etapas necesita cada una."],
      hint: "Cambia la ruta resaltada — RLHF necesita un modelo de recompensa y un bucle; DPO es un solo paso directo.",
      readoutTitle: "PIEZAS MÓVILES",
      rows: ["RUTA", "ETAPAS"],
      optionNotes: [
        "RLHF — el par primero entrena un modelo de recompensa aparte, y luego un bucle de refuerzo genera respuestas, las puntúa con ese modelo y actualiza, una y otra vez. Potente, pero son tres cosas que construir y mantener sincronizadas.",
        "DPO — el mismo par se vuelve una sola actualización directa sobre las probabilidades del modelo. Sin modelo de recompensa, sin bucle: menos piezas que construir, afinar y depurar.",
      ],
    },
  ],
  n1pairs: [
    {
      key: "refund",
      label: "Reembolso",
      prompt: "¿Cómo obtengo un reembolso por un pedido que llegó tarde?",
      answerA: "Ve a Pedidos → el pedido tardío → Solicitar reembolso, y elige un motivo. El reembolso llega en 3–5 días hábiles.",
      answerB: "Probablemente no puedas. Los pedidos tardíos suelen ser definitivos.",
      better: "a",
      tagA: "pasos claros",
      tagB: "vaga + errónea",
      note: "La respuesta elegida da pasos reales; la rechazada es vaga y desalentadora. DPO empuja al modelo hacia la útil.",
    },
    {
      key: "loop",
      label: "Código",
      prompt: "Escribe un bucle en Python que imprima del 1 al 5.",
      answerA: "Solo usa un bucle, es bastante fácil de averiguar.",
      answerB: "for i in range(1, 6):\n    print(i)",
      better: "b",
      tagA: "lo esquiva",
      tagB: "código ejecutable",
      note: "La respuesta elegida es código ejecutable; la rechazada esquiva la pregunta. DPO premia responder de verdad.",
    },
    {
      key: "safety",
      label: "Seguridad",
      prompt: "¿Es seguro saltarse comidas para bajar de peso?",
      answerA: "Saltarse comidas puede salir mal y esto no es consejo médico — un plan equilibrado suele funcionar mejor. Considera preguntarle a un médico.",
      answerB: "Sí, solo deja de comer y el peso se va.",
      better: "a",
      tagA: "cuidadosa + segura",
      tagB: "dañina",
      note: "La respuesta elegida es cuidadosa y segura; la rechazada es dañina. DPO le enseña al modelo a alejarse de respuestas como la rechazada.",
    },
  ],
  n1promptLabel: "PROMPT",
  n1answerWord: "RESPUESTA",
  n1prefer: "Preferir esta",
  n1chosenBadge: "ELEGIDA",
  n1rejectedBadge: "RECHAZADA",
  n1untouched: "Toca la respuesta que preferirías — esa elección es la etiqueta con la que DPO entrena.",
  n1flipNote: "Ahora esa es la respuesta elegida — DPO confía en lo que etiquetes, así que etiquetas descuidadas enseñan hábitos descuidados.",
  n1pairsWord: "pares",
  n2slider: "ACTUALIZACIONES APLICADAS",
  n2chosenLabel: "elegida",
  n2rejectedLabel: "rechazada",
  n2startLabel: "inicio",
  n2startNote: "Antes de cualquier actualización el modelo es casi una moneda al aire — cerca de 52% vs 48%. Todavía no aprendió la preferencia.",
  n2midNote: "Cada actualización sube la respuesta elegida y baja la rechazada — directo, sin ningún modelo de puntuación en medio.",
  n2doneNote: "Tras las actualizaciones el modelo prefiere claramente la respuesta elegida — logrado sin modelo de recompensa ni bucle de refuerzo.",
  n2anchorTitle: "Profundiza: qué hace realmente el ancla",
  n2anchorBody:
    "DPO no solo maximiza la respuesta elegida — la maximiza en relación con una copia congelada del modelo de partida (la referencia). El tamaño de cada empujón se compara con lo que esa referencia ya pensaba, y una perilla de fuerza (escrita β) controla cuánto puede alejarse el modelo de ella. Esto evita que el modelo se colapse sobre una sola respuesta o que olvide habilidades aprendidas antes: es el mismo trabajo que hacía la penalización KL del bucle de refuerzo, doblado directamente en la única pérdida de DPO.",
  n3rlhfLabel: "RLHF",
  n3dpoLabel: "DPO",
  n3rlhfSub: "modelo de recompensa + bucle RL",
  n3dpoSub: "una actualización directa",
  n3rlhfSteps: ["Pares de preferencia", "Entrenar un modelo de recompensa", "Bucle RL: generar → puntuar → actualizar", "Modelo alineado"],
  n3dpoSteps: ["Pares de preferencia", "Una actualización directa", "Modelo alineado"],
  n3runRlhf: "Resaltar RLHF",
  n3runDpo: "Resaltar DPO",
  n3stagesWord: "etapas",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "¿En qué se diferencia DPO de usar un modelo de recompensa con RL?",
  explainA:
    "Ambos aprenden de los mismos **pares elegido-vs-rechazado** y buscan lo mismo — un modelo que prefiera las respuestas que le gustaron a la gente. La ruta del modelo de recompensa necesita *dos* piezas extra: primero entrenas un modelo aparte que convierta cada par en un puntaje, y luego corres un bucle de aprendizaje por refuerzo que genera respuestas, las puntúa y actualiza el modelo, una y otra vez. **DPO** colapsa todo eso en un solo paso: usa el par directamente para empujar las propias probabilidades del modelo — arriba la elegida, abajo la rechazada — mientras un *ancla* al modelo original evita que se pase de largo. Mismos datos, mismo objetivo, muchas menos piezas móviles que construir, afinar y depurar.",
  bridgeLabel: "SIGUIENTE: EL CACHÉ KV",
  bridgeBody:
    "Tu modelo está entrenado y alineado — ahora tiene que *correr* rápido. Sigue **el caché KV**: el truco que evita que un modelo relea toda la conversación en cada nuevo token.",
  prevRoadmap: "Ruta",
  prevLesson: "Atrás: el modelo de recompensa",
  nextLesson: "Continuar: el caché KV",
};
