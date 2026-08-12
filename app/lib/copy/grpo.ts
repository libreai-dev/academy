/**
 * Stage 0 · 4.5 — GRPO (Group Relative Policy Optimization). Interface + EN/ES
 * copy, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: GRPO drops PPO's memory-heavy critic. Instead of a value network
 * predicting each answer's expected score, it samples a *group* of answers to
 * the same prompt and scores each one against the group's average — simpler and
 * far cheaper. Builds on 4.4 (PPO — the clipped step + KL leash it keeps).
 */
import type { WsNodeCopy } from "./shared";

/** A one-tap batch for the relative-advantage view (Node 3). */
export interface AdvPreset {
  key: string;
  label: string;
  note: string;
}

export interface GrpoLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — no critic
  n1slider: string; //     "MODEL SIZE"
  n1ppoLabel: string; //   "PPO"
  n1grpoLabel: string; //  "GRPO"
  n1roleNames: Record<"policy" | "critic" | "reward" | "reference", string>;
  n1trained: string; //    "trained"
  n1frozen: string; //     "frozen"
  n1removed: string; //    "critic removed"
  n1totalLabel: string; // "total"
  // Node 2 — group sampling
  n2slider: string; //     "GROUP SIZE G"
  n2promptLabel: string; //"one prompt"
  n2answerLabel: string; //"answer"
  n2rewardLabel: string; //"reward"
  n2judgeLabel: string; // "reward model"
  // Node 3 — relative advantage
  n3presets: AdvPreset[];
  n3meanLabel: string; //  "group mean"
  n3rewardAxis: string; // "reward"
  n3rawLabel: string; //   "reward − mean" (label for the per-answer number)
  n3upLabel: string; //    "above → reinforced"
  n3downLabel: string; //  "below → suppressed"
  n3answerWord: string; // "answer"
  // Deeper blocks (collapsed math), one per node
  deeperTitle: string[];
  deeperBody: string[];
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const grpoEN: GrpoLesson = {
  crumb: "STAGE 0 · 4.5 · GRPO",
  eyebrow: "STAGE 0 · 4.5 · 3 NODES",
  title: "GRPO: drop the critic",
  lede: "PPO trains four networks, and one of them — the critic — is as big as the model you're training. GRPO throws it away. Instead of a value network guessing each answer's expected score, it samples a whole group of answers to one prompt and scores each against the group's average. Same clipped step, same KL leash, no critic.",
  pipelineLabel: "THE 3 IDEAS",
  pipeline: ["No critic", "A group per prompt", "Score against the mean"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Delete the critic",
      intro: "In PPO the critic is a second, full-size network that predicts each answer's expected score. GRPO removes it — and that one deletion is most of the savings.",
      bullets: [
        "**The critic was a whole extra model.** It guessed the score *before* the judge saw the answer, so PPO could measure the surprise — and it's typically the same size as the model being trained.",
        "**GRPO stores none of it.** No value network to hold in memory, run each step, or tune — one less full-size, *trained* network.",
        "**The two frozen helpers stay.** The reward model (the learned judge) and the frozen reference (the KL-leash anchor) are inference-only, so they cost far less than a trained one.",
        "**A trained network is ~8× a frozen one.** It carries weights *plus* gradients *plus* optimizer state. Dropping one trained model cuts training memory by roughly a third to a half.",
      ],
      cardLabel: "PPO vs GRPO · WHAT'S IN MEMORY",
      aria: "Two memory stacks side by side: PPO with policy, critic, reward model and reference; GRPO with the same minus the critic, so its total bar is shorter.",
      steps: 1,
      captions: ["Slide the model size — both stacks grow, but GRPO stays lighter by one full-size trained network."],
      hint: "Drag the model size — GRPO is always shorter by exactly one trained model, the critic.",
      readoutTitle: "TRAINING_MEMORY",
      rows: ["PPO", "GRPO", "SAVED"],
      readoutNote: "Rough GPU memory to train. A trained network (weights + gradients + optimizer state) costs far more than a frozen one; removing the critic removes one whole trained model.",
      sliderNote: "Bigger model, bigger everything — but GRPO's bar always trails PPO's by one trained, model-sized network. That gap is the whole point.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "A group of answers per prompt",
      intro: "Without a critic, GRPO has no learned guess for the expected score. Its fix is almost embarrassingly simple: answer the same prompt several times and let the answers be each other's yardstick.",
      bullets: [
        "**One prompt, many answers.** For each prompt GRPO samples a *group* — often 4 to 16 completions — instead of a single one.",
        "**Each answer gets scored.** The reward model rates every completion in the group, exactly as in PPO — that step is unchanged.",
        "**The group is the baseline.** The other answers to the *same* prompt show what a normal score looks like here — that's what replaces the critic.",
        "**Sampling is cheap.** A few extra generations cost far less than training, running, and storing a whole second network.",
      ],
      cardLabel: "ONE PROMPT → A GROUP OF ANSWERS",
      aria: "A single prompt fanning out into several answers, each scored by the reward model.",
      steps: 1,
      captions: ["Drag the group size — the same prompt fans out into more answers, each with its own reward score."],
      hint: "Drag the group size G — the one prompt fans out into more sampled answers, each scored on its own.",
      readoutTitle: "GROUP",
      rows: ["PROMPT", "ANSWERS", "REWARDS"],
      readoutNote: "Every answer in the group shares one prompt; the reward model scores each. Their spread becomes the baseline in the next step.",
      sliderNote: "One prompt, G sampled answers. More answers give a steadier baseline but cost more to generate — real runs use around 8 to 16.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Score each answer against the mean",
      intro: "Here's the whole move. Take the group's scores, find their average, and judge every answer by how far it lands from that average — above gets reinforced, below gets suppressed.",
      bullets: [
        "**Advantage = reward − group mean.** Subtract the group's average from each answer. Positive means better than its peers; negative means worse.",
        "**Divide by the spread to normalize.** GRPO scales that gap by the group's standard deviation (how spread out the scores are), so an easy prompt and a hard one produce comparable numbers.",
        "**Above-average answers are reinforced, below-average suppressed.** Then the *same* clipped step and KL leash from PPO apply — only the advantage is computed differently.",
        "**A flat group teaches nothing.** If every answer scores about the same, every advantage is near zero — no signal, so the model barely moves on that prompt.",
      ],
      cardLabel: "GROUP → MEAN → PER-ANSWER ADVANTAGE",
      aria: "A reward bar for each answer with a group-mean line across them; each answer's advantage is shown as a push up (above the mean) or down (below).",
      steps: 1,
      captions: ["Switch batches — the mean line moves and each answer's advantage flips sign around it."],
      hint: "Switch batches — watch the group-mean line move, and each answer flip between reinforced and suppressed.",
      readoutTitle: "ADVANTAGE",
      rows: ["MEAN", "SPREAD", "REINFORCED", "SUPPRESSED"],
      readoutNote: "Advantage is each reward minus the group mean, divided by the spread. Above the line is pushed up; below is pushed down; a flat group gives almost no push.",
    },
  ],
  n1slider: "MODEL SIZE",
  n1ppoLabel: "PPO",
  n1grpoLabel: "GRPO",
  n1roleNames: {
    policy: "Policy",
    critic: "Critic",
    reward: "Reward model",
    reference: "Reference",
  },
  n1trained: "trained",
  n1frozen: "frozen",
  n1removed: "critic removed",
  n1totalLabel: "total",
  n2slider: "GROUP SIZE G",
  n2promptLabel: "one prompt",
  n2answerLabel: "answer",
  n2rewardLabel: "reward",
  n2judgeLabel: "reward model",
  n3presets: [
    { key: "mixed", label: "Mixed batch", note: "A normal spread: clear winners above the line, clear losers below. Strong, useful signal — the model learns a lot from this prompt." },
    { key: "flat", label: "All similar", note: "Every answer scores about the same, so the mean sits right on top of them. Advantages are near zero — almost nothing to learn here." },
    { key: "standout", label: "One standout", note: "One answer beats the rest by a mile. It gets a big positive push while the whole pack gets small negative ones." },
  ],
  n3meanLabel: "group mean",
  n3rewardAxis: "reward",
  n3rawLabel: "reward − mean",
  n3upLabel: "reinforced",
  n3downLabel: "suppressed",
  n3answerWord: "answer",
  deeperTitle: [
    "Why a trained network costs ~8× a frozen one",
    "The advantage, with no critic",
    "The objective is PPO's, minus the value model",
  ],
  deeperBody: [
    "A frozen model just runs forward, so it only stores its weights — about 2 bytes per parameter in fp16. A *trained* model also stores a gradient for every weight, plus the optimizer's state (Adam keeps a running mean and variance, usually in fp32, often alongside an fp32 master copy of the weights). Add it up and each trained parameter costs roughly 16 bytes versus 2 — about 8×. So the critic, being a trained model the size of the policy, is one of the biggest single items on the GPU, and deleting it is the headline saving. (Activations and the KV cache add more on top, but scale with both stacks the same way.)",
    "PPO estimated the advantage `A` with a learned critic: `A ≈ actual reward − critic's predicted reward`. GRPO replaces the critic's prediction with the *group mean*. For a group of G answers with rewards `r₁…r_G`, each answer's advantage is `Âᵢ = (rᵢ − mean(r)) / std(r)`. The mean plays the critic's old role of 'what score did we expect', and dividing by the standard deviation keeps advantages on a comparable scale across prompts. No network, no separate training loop — just the arithmetic of the batch you already generated.",
    "GRPO keeps PPO's objective almost verbatim: `E[ min( r·Â , clip(r, 1−ε, 1+ε)·Â ) ] − β·KL`, where `r` is the new-vs-old probability ratio, the `clip` bounds the step, and `β·KL` is the leash to the frozen reference. The only change is `Â`: it's the group-relative advantage above instead of a critic's output, and every token in a response usually shares that one response-level advantage. Same guardrails, one fewer network to train and tune.",
  ],
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "GRPO throws away PPO's critic. What does it use instead to tell a good answer from a bad one — and why is that cheaper?",
  explainA: "PPO's critic was a second, full-size network that predicted each answer's expected score, so PPO could measure the *surprise* — actual minus expected — as the advantage. GRPO gets that baseline for free by sampling a **group** of answers to the same prompt and scoring them all. The group's **average** score becomes the baseline, and each answer's **advantage** is simply how far above or below that average it landed, divided by the group's spread. Above-average answers are reinforced, below-average suppressed — using the *same* clipped step and KL leash as PPO. It's cheaper because generating a few extra answers costs far less than training, running, and storing a whole extra network — so GRPO frees up roughly a third to a half of the training memory.",
  bridgeLabel: "NEXT: VERIFIABLE REWARDS",
  bridgeBody: "GRPO still leans on a reward *model* — a learned judge, and any learned judge can be gamed. But for math and code there's something better: you can just **check the answer**. Next, **verifiable rewards** — where the reward is a passing unit test or a correct final number, not a guess.",
  prevLesson: "Back: PPO",
  nextLesson: "Continue to verifiable rewards",
};

/* ============================================================ SPANISH ======= */

export const grpoES: GrpoLesson = {
  crumb: "ETAPA 0 · 4.5 · GRPO",
  eyebrow: "ETAPA 0 · 4.5 · 3 NODOS",
  title: "GRPO: fuera el crítico",
  lede: "PPO entrena cuatro redes, y una de ellas — el crítico — es tan grande como el modelo que entrenas. GRPO la elimina. En vez de una red de valor adivinando la puntuación esperada de cada respuesta, muestrea todo un grupo de respuestas a un mismo prompt y puntúa cada una contra el promedio del grupo. Mismo paso recortado, misma correa KL, sin crítico.",
  pipelineLabel: "LAS 3 IDEAS",
  pipeline: ["Sin crítico", "Un grupo por prompt", "Puntuar contra el promedio"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Elimina el crítico",
      intro: "En PPO el crítico es una segunda red de tamaño completo que predice la puntuación esperada de cada respuesta. GRPO la quita — y esa única eliminación es casi todo el ahorro.",
      bullets: [
        "**El crítico era un modelo entero de más.** Adivinaba la puntuación *antes* de que el juez viera la respuesta, para que PPO midiera la sorpresa — y suele ser del mismo tamaño que el modelo que se entrena.",
        "**GRPO no guarda nada de él.** No hay red de valor que mantener en memoria, ejecutar cada paso ni ajustar — una red *entrenada* de tamaño completo menos.",
        "**Los dos ayudantes congelados se quedan.** El modelo de recompensa (el juez aprendido) y la referencia congelada (el ancla de la correa KL) son solo de inferencia, así que cuestan mucho menos que uno entrenado.",
        "**Una red entrenada pesa ~8× una congelada.** Lleva pesos *más* gradientes *más* estado del optimizador. Quitar un modelo entrenado recorta la memoria de entrenamiento entre un tercio y la mitad.",
      ],
      cardLabel: "PPO vs GRPO · QUÉ HAY EN MEMORIA",
      aria: "Dos pilas de memoria lado a lado: PPO con política, crítico, modelo de recompensa y referencia; GRPO igual menos el crítico, así que su barra total es más corta.",
      steps: 1,
      captions: ["Desliza el tamaño del modelo — ambas pilas crecen, pero GRPO queda más ligera por una red entrenada de tamaño completo."],
      hint: "Arrastra el tamaño del modelo — GRPO siempre es más corta por exactamente un modelo entrenado, el crítico.",
      readoutTitle: "MEMORIA_ENTRENAMIENTO",
      rows: ["PPO", "GRPO", "AHORRADO"],
      readoutNote: "Memoria de GPU aproximada para entrenar. Una red entrenada (pesos + gradientes + estado del optimizador) cuesta mucho más que una congelada; quitar el crítico elimina un modelo entrenado entero.",
      sliderNote: "Modelo más grande, todo más grande — pero la barra de GRPO siempre va por detrás de la de PPO en una red entrenada del tamaño del modelo. Ese hueco es todo el punto.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Un grupo de respuestas por prompt",
      intro: "Sin crítico, GRPO no tiene una estimación aprendida de la puntuación esperada. Su solución es casi vergonzosamente simple: responde el mismo prompt varias veces y deja que las respuestas se midan entre sí.",
      bullets: [
        "**Un prompt, muchas respuestas.** Para cada prompt GRPO muestrea un *grupo* — a menudo de 4 a 16 respuestas — en vez de una sola.",
        "**Cada respuesta se puntúa.** El modelo de recompensa califica cada respuesta del grupo, igual que en PPO — ese paso no cambia.",
        "**El grupo es la línea base.** Las demás respuestas al *mismo* prompt muestran cómo se ve una puntuación normal aquí — eso es lo que reemplaza al crítico.",
        "**Muestrear es barato.** Unas pocas generaciones extra cuestan mucho menos que entrenar, ejecutar y almacenar una segunda red entera.",
      ],
      cardLabel: "UN PROMPT → UN GRUPO DE RESPUESTAS",
      aria: "Un solo prompt abriéndose en varias respuestas, cada una puntuada por el modelo de recompensa.",
      steps: 1,
      captions: ["Arrastra el tamaño del grupo — el mismo prompt se abre en más respuestas, cada una con su propia puntuación."],
      hint: "Arrastra el tamaño del grupo G — el único prompt se abre en más respuestas muestreadas, cada una puntuada por su cuenta.",
      readoutTitle: "GRUPO",
      rows: ["PROMPT", "RESPUESTAS", "RECOMPENSAS"],
      readoutNote: "Cada respuesta del grupo comparte un prompt; el modelo de recompensa puntúa cada una. Su dispersión se vuelve la línea base en el siguiente paso.",
      sliderNote: "Un prompt, G respuestas muestreadas. Más respuestas dan una línea base más estable pero cuestan más de generar — las corridas reales usan entre 8 y 16.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Puntúa cada respuesta contra el promedio",
      intro: "Aquí está toda la jugada. Toma las puntuaciones del grupo, saca su promedio y juzga cada respuesta por qué tan lejos cae de ese promedio — por encima se refuerza, por debajo se suprime.",
      bullets: [
        "**Ventaja = recompensa − promedio del grupo.** Resta el promedio del grupo a cada respuesta. Positivo significa mejor que sus pares; negativo, peor.",
        "**Divide por la dispersión para normalizar.** GRPO escala ese hueco por la desviación estándar del grupo (qué tan dispersas están las puntuaciones), así un prompt fácil y uno difícil dan números comparables.",
        "**Las respuestas por encima del promedio se refuerzan, las de abajo se suprimen.** Luego se aplica el *mismo* paso recortado y la misma correa KL de PPO — solo la ventaja se calcula distinto.",
        "**Un grupo plano no enseña nada.** Si todas las respuestas puntúan casi igual, cada ventaja es casi cero — sin señal, así que el modelo apenas se mueve en ese prompt.",
      ],
      cardLabel: "GRUPO → PROMEDIO → VENTAJA POR RESPUESTA",
      aria: "Una barra de recompensa por cada respuesta con una línea de promedio del grupo cruzándolas; la ventaja de cada respuesta se muestra como un empuje hacia arriba (sobre el promedio) o hacia abajo (por debajo).",
      steps: 1,
      captions: ["Cambia de lote — la línea de promedio se mueve y la ventaja de cada respuesta cambia de signo a su alrededor."],
      hint: "Cambia de lote — mira la línea de promedio del grupo moverse, y cada respuesta alternar entre reforzada y suprimida.",
      readoutTitle: "VENTAJA",
      rows: ["PROMEDIO", "DISPERSIÓN", "REFORZADAS", "SUPRIMIDAS"],
      readoutNote: "La ventaja es cada recompensa menos el promedio del grupo, dividida por la dispersión. Por encima de la línea se empuja hacia arriba; por debajo, hacia abajo; un grupo plano casi no empuja.",
    },
  ],
  n1slider: "TAMAÑO DEL MODELO",
  n1ppoLabel: "PPO",
  n1grpoLabel: "GRPO",
  n1roleNames: {
    policy: "Política",
    critic: "Crítico",
    reward: "Recompensa",
    reference: "Referencia",
  },
  n1trained: "entrenada",
  n1frozen: "congelada",
  n1removed: "crítico eliminado",
  n1totalLabel: "total",
  n2slider: "TAMAÑO DEL GRUPO G",
  n2promptLabel: "un prompt",
  n2answerLabel: "respuesta",
  n2rewardLabel: "recompensa",
  n2judgeLabel: "modelo de recompensa",
  n3presets: [
    { key: "mixed", label: "Lote variado", note: "Una dispersión normal: ganadores claros sobre la línea, perdedores claros debajo. Señal fuerte y útil — el modelo aprende mucho de este prompt." },
    { key: "flat", label: "Todas similares", note: "Todas las respuestas puntúan casi igual, así que el promedio se posa justo encima de ellas. Las ventajas rondan cero — casi nada que aprender aquí." },
    { key: "standout", label: "Una sobresale", note: "Una respuesta supera al resto por mucho. Recibe un gran empuje positivo mientras todo el grupo recibe pequeños empujes negativos." },
  ],
  n3meanLabel: "promedio del grupo",
  n3rewardAxis: "recompensa",
  n3rawLabel: "recompensa − promedio",
  n3upLabel: "reforzadas",
  n3downLabel: "suprimidas",
  n3answerWord: "respuesta",
  deeperTitle: [
    "Por qué una red entrenada cuesta ~8× una congelada",
    "La ventaja, sin crítico",
    "El objetivo es el de PPO, menos el modelo de valor",
  ],
  deeperBody: [
    "Un modelo congelado solo corre hacia adelante, así que solo guarda sus pesos — unos 2 bytes por parámetro en fp16. Un modelo *entrenado* además guarda un gradiente por cada peso, más el estado del optimizador (Adam mantiene una media y una varianza móviles, normalmente en fp32, a menudo junto a una copia maestra fp32 de los pesos). Súmalo y cada parámetro entrenado cuesta unos 16 bytes frente a 2 — cerca de 8×. Así que el crítico, siendo un modelo entrenado del tamaño de la política, es uno de los ítems más grandes de la GPU, y borrarlo es el ahorro estrella. (Las activaciones y la caché KV suman más encima, pero escalan igual en ambas pilas.)",
    "PPO estimaba la ventaja `A` con un crítico aprendido: `A ≈ recompensa real − recompensa predicha por el crítico`. GRPO reemplaza la predicción del crítico por el *promedio del grupo*. Para un grupo de G respuestas con recompensas `r₁…r_G`, la ventaja de cada respuesta es `Âᵢ = (rᵢ − promedio(r)) / desv(r)`. El promedio cumple el viejo papel del crítico de 'qué puntuación esperábamos', y dividir por la desviación estándar mantiene las ventajas en una escala comparable entre prompts. Sin red, sin bucle de entrenamiento aparte — solo la aritmética del lote que ya generaste.",
    "GRPO mantiene el objetivo de PPO casi al pie de la letra: `E[ min( r·Â , clip(r, 1−ε, 1+ε)·Â ) ] − β·KL`, donde `r` es la razón de probabilidad nueva vs vieja, el `clip` acota el paso y `β·KL` es la correa a la referencia congelada. El único cambio es `Â`: es la ventaja relativa al grupo de arriba en vez de la salida de un crítico, y cada token de una respuesta suele compartir esa única ventaja a nivel de respuesta. Mismas barandillas, una red menos que entrenar y ajustar.",
  ],
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "GRPO desecha el crítico de PPO. ¿Qué usa en su lugar para distinguir una buena respuesta de una mala — y por qué es más barato?",
  explainA: "El crítico de PPO era una segunda red de tamaño completo que predecía la puntuación esperada de cada respuesta, para que PPO midiera la *sorpresa* — real menos esperado — como la ventaja. GRPO consigue esa línea base gratis muestreando un **grupo** de respuestas al mismo prompt y puntuándolas todas. El **promedio** del grupo se vuelve la línea base, y la **ventaja** de cada respuesta es simplemente qué tan por encima o por debajo de ese promedio cayó, dividida por la dispersión del grupo. Las respuestas por encima del promedio se refuerzan, las de abajo se suprimen — usando el *mismo* paso recortado y la misma correa KL que PPO. Es más barato porque generar unas pocas respuestas extra cuesta mucho menos que entrenar, ejecutar y almacenar una red entera de más — así que GRPO libera entre un tercio y la mitad de la memoria de entrenamiento.",
  bridgeLabel: "SIGUIENTE: RECOMPENSAS VERIFICABLES",
  bridgeBody: "GRPO todavía se apoya en un *modelo* de recompensa — un juez aprendido, y cualquier juez aprendido se puede engañar. Pero para matemáticas y código hay algo mejor: puedes simplemente **verificar la respuesta**. A continuación, **recompensas verificables** — donde la recompensa es una prueba unitaria que pasa o un número final correcto, no una suposición.",
  prevLesson: "Atrás: PPO",
  nextLesson: "Continuar a recompensas verificables",
};
