/**
 * Stage 0 · Phase 4.4 — PPO (Proximal Policy Optimization). Interface + EN/ES
 * copy for the article, isolated from every other lesson so edits here never
 * touch theirs.
 *
 * One idea: PPO is the online RL loop that improves the model *from* a reward
 * model — taking small clipped steps and holding a KL "leash" to a frozen
 * reference, so it improves without drifting into gibberish. Builds directly on
 * the reward-modeling lesson (the scorer) — it does not re-teach it.
 */
import type { WsNodeCopy } from "./shared";

export type PpoRegimeKey = "stuck" | "healthy" | "hacking";

export interface PpoLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — the cast
  n1roles: string[]; //            toggle labels: Policy, Frozen reference, Reward model, Critic
  n1answer: string; //             arrow label: policy → reward model
  n1score: string; //              arrow label: reward model → critic
  n1update: string; //             arrow label: critic → policy
  n1leash: string; //              tether label: reference ↔ policy
  n1frozen: string; //             box label for the reference
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;

  // Node 2 — the clip
  n2clipSlider: string;
  n2ratioSlider: string;
  n2good: string; //               toggle: a token we want MORE of (advantage > 0)
  n2bad: string; //                toggle: a token we want LESS of (advantage < 0)
  n2panelNoClip: string;
  n2panelClip: string;
  n2trustBand: string; //          label over the shaded band
  n2clippedTag: string; //         "CLIPPED"
  n2clippedNote: string; //        note when the clip bites
  n2freeNote: string; //           note when the step is inside the band
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 — the KL leash
  n3clipSlider: string;
  n3klSlider: string;
  n3ref: string; //                leash anchor label
  n3policy: string; //             leash policy label
  n3drift: string; //              "drift = KL"
  n3rmLabel: string; //            bar label: reward-model score
  n3qualityLabel: string; //       bar label: true quality
  n3regimeLabels: Record<PpoRegimeKey, string>; // short verdict shown in the diagram
  n3regimeNotes: Record<PpoRegimeKey, string>; //  the plain-language note by the controls
  n3deeperTitle: string;
  n3deeperBody: string;

  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

export const ppoEN: PpoLesson = {
  crumb: "STAGE 0 · PPO",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "PPO",
  lede: "Reward modeling gave us a scorer. PPO is the loop that actually improves the model from it — taking small, clipped steps and holding a leash to a frozen copy of itself, so it gets better without drifting into gibberish.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The cast", "Clipped steps", "The KL leash"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The four players in the loop",
      intro:
        "PPO is a training loop with four parts. It reuses the reward model from the Reward-modeling lesson as the scorer — and adds a critic, a coach that predicts the score so each update knows what counts as better-than-expected.",
      bullets: [
        "**Policy** — the model we're training. It writes an answer to a prompt.",
        "**Reward model** — the scorer from the Reward-modeling lesson. It rates that answer with one number.",
        "**Critic** — predicts the score *before* it's revealed. The gap (score − prediction) is the **advantage**: how much better the answer was than expected.",
        "**Frozen reference** — a saved copy of the model from before RL. A **KL leash** (KL = a distance between two probability distributions) ties the policy to it so it can't wander off.",
      ],
      cardLabel: "ACTOR–CRITIC LOOP",
      aria: "A loop from policy to reward model to critic and back, with a KL leash to a frozen reference.",
      steps: 1,
      captions: [
        "The policy writes an answer, the reward model scores it, the critic turns that into an advantage, and the update nudges the policy — all on a KL leash to the frozen reference.",
      ],
      hint: "Tap each player to see its job in the loop.",
      readoutTitle: "LOOP",
      rows: ["POLICY", "REWARD", "CRITIC", "REF"],
      optionNotes: [
        "Policy — the model we're training. Each round it writes a fresh answer to the prompt, and the update nudges its weights.",
        "Frozen reference — a snapshot of the model taken before RL started. It never changes; the KL leash measures how far the policy has drifted from it.",
        "Reward model — the scorer you built in the Reward-modeling lesson. It reads the policy's answer and returns a single quality number.",
        "Critic — predicts the score an answer will get. Score minus this prediction is the advantage that actually drives the update.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Why each step is clipped",
      intro:
        "Online RL is unstable: one over-eager update can wreck the model. PPO's fix is a clip — it caps how far a single step may move any token's probability.",
      bullets: [
        "**The ratio r** = how much the new policy changes a token's probability vs the old one. r = 1 means no change.",
        "**The clip keeps r inside a band** [1−ε, 1+ε]. A good token can be pushed up — but only to 1+ε; past that, the reward for pushing harder is cut off.",
        "**Without the clip, a big advantage means a giant step** that can collapse the policy. With it, the step is bounded no matter how tempting.",
        "**ε is small — about 0.2.** It's a trust region: change a little, re-check, change a little more.",
      ],
      cardLabel: "THE CLIP · r vs [1−ε, 1+ε]",
      aria: "Two panels comparing an unclipped step to a clipped step on a probability-ratio line.",
      steps: 1,
      captions: ["Top: no clip — the step follows the raw ratio. Bottom: PPO caps it at the band edge."],
      hint: "Move the sliders — push the ratio past 1+ε and watch the clipped step stop.",
      readoutTitle: "STEP",
      rows: ["RATIO", "APPLIED"],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The leash that stops reward hacking",
      intro:
        "Chase the reward model too hard and the policy learns to game it — high scores, junk answers. The KL leash pulls the policy back toward the frozen reference so it improves without drifting.",
      bullets: [
        "**β sets the leash strength.** Higher β = shorter leash = the policy stays near the reference.",
        "**Too loose (low β):** the policy drifts far, the reward-model score keeps climbing, but real quality collapses — that's *reward hacking*.",
        "**Too tight (high β):** the policy can barely move and never really improves.",
        "**The sweet spot** lifts the reward-model score *and* true quality — a small, controlled drift.",
      ],
      cardLabel: "REWARD GAIN vs DRIFT",
      aria: "A leash between a frozen reference and the policy, with reward-model score and true-quality bars.",
      steps: 1,
      captions: ["Loosen the leash and the policy drifts; the reward-model score rises even as true quality falls."],
      hint: "Drag both sliders — find the β where true quality peaks, not just the reward score.",
      readoutTitle: "OUTCOME",
      rows: ["DRIFT", "RM", "QUALITY"],
    },
  ],

  n1roles: ["Policy", "Frozen ref", "Reward model", "Critic"],
  n1answer: "answer",
  n1score: "score",
  n1update: "update Δθ",
  n1leash: "KL leash",
  n1frozen: "FROZEN REF",
  calloutLabel: "GOOD TO KNOW · THE CRITIC",
  calloutTitle: "Advantage = score − expectation",
  calloutBody:
    "The reward model says how good an answer is; the critic says how good it *expected* to be. PPO trains on the difference — the advantage. A high score the critic already predicted teaches nothing; only the surprise (better or worse than expected) moves the weights. That's what keeps the loop learning signal, not just applause.",

  n2clipSlider: "CLIP ε",
  n2ratioSlider: "PROPOSED RATIO r",
  n2good: "Good token (A > 0)",
  n2bad: "Bad token (A < 0)",
  n2panelNoClip: "NO CLIP",
  n2panelClip: "PPO CLIP",
  n2trustBand: "trust band",
  n2clippedTag: "CLIPPED",
  n2clippedNote:
    "The step wants to move past the band, so the clip caps it at the edge — the extra push earns no extra reward. One update can't lurch the policy.",
  n2freeNote:
    "The proposed step is inside the band [1−ε, 1+ε], so the clip does nothing — the full gradient applies. The clip only bites on steps that reach too far.",
  n2deeperTitle: "The clipped surrogate objective",
  n2deeperBody:
    "PPO maximises L = E[ min( r·A , clip(r, 1−ε, 1+ε)·A ) ], where r = π_new/π_old is the probability ratio and A is the advantage. The min() picks the more pessimistic of two terms: the raw r·A, and a version where r is frozen to the band edge. When a good step (A > 0) pushes r past 1+ε, the clipped term stops growing, so the gradient there goes flat — the model gets no reward for over-shooting. It's a first-order trust region without the expensive second-order math of its predecessor, TRPO.",

  n3clipSlider: "CLIP ε",
  n3klSlider: "KL β",
  n3ref: "FROZEN REF",
  n3policy: "policy",
  n3drift: "drift = KL",
  n3rmLabel: "RM score",
  n3qualityLabel: "quality",
  n3regimeLabels: {
    stuck: "STUCK · leash too tight",
    healthy: "HEALTHY · controlled drift",
    hacking: "REWARD HACKING · gibberish",
  },
  n3regimeNotes: {
    stuck: "The leash is so short the policy barely moves — the reward-model score inches up and quality never really improves. Loosen β.",
    healthy: "A small, controlled drift: the reward-model score and true quality rise together. This is where you want to train.",
    hacking: "The policy has drifted far and is now gaming the scorer — the reward-model score is high, but true quality has collapsed into confident nonsense. Tighten β.",
  },
  n3deeperTitle: "The KL penalty term",
  n3deeperBody:
    "The reward the policy actually optimises is r_total = r_RM − β · KL(π ‖ π_ref): the reward-model score minus β times the KL distance from the frozen reference. KL(π ‖ π_ref) grows as the policy's output distribution moves away from the reference's, so the penalty acts like a spring pulling it back. β is the spring constant. Some implementations instead clip or adaptively tune β to hit a target KL each batch. Either way, the clip bounds one step; the KL bounds the total distance travelled — which is what actually stops reward hacking.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ:
    "PPO already caps each step with the clip. So why also tie the model to a frozen reference with a KL penalty?",
  explainA:
    "Because the clip only bounds one step at a time — it says nothing about where you end up after thousands of them. Small clipped steps still compound, and the policy can slowly walk somewhere the reward model loves but humans don't: confident gibberish that games the scorer. The KL leash bounds the *total* distance from the trusted starting model, so the sum of all those little steps can't drift into reward hacking. Clip controls the step; KL controls the destination.",
  bridgeLabel: "NEXT: GRPO",
  bridgeBody:
    "PPO works — but that critic is a second full-size network to train and store, expensive and finicky. Next, **GRPO** throws the critic out: instead of predicting the score, it samples a *group* of answers to the same prompt and uses their average as the baseline. Same advantage idea, half the machinery.",
  prevLesson: "Parameter-efficient fine-tuning",
  nextLesson: "Continue to GRPO",
};

export const ppoES: PpoLesson = {
  crumb: "ETAPA 0 · PPO",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "PPO",
  lede: "El modelado de recompensa nos dio un evaluador. PPO es el bucle que de verdad mejora el modelo a partir de él — dando pasos pequeños y recortados y sujetando una correa a una copia congelada de sí mismo, para que mejore sin derivar hacia el sinsentido.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El elenco", "Pasos recortados", "La correa KL"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Los cuatro jugadores del bucle",
      intro:
        "PPO es un bucle de entrenamiento con cuatro partes. Reutiliza el modelo de recompensa de la lección de Modelado de recompensa como evaluador — y añade un crítico, un entrenador que predice la puntuación para que cada actualización sepa qué cuenta como mejor-de-lo-esperado.",
      bullets: [
        "**Política** — el modelo que entrenamos. Escribe una respuesta a un prompt.",
        "**Modelo de recompensa** — el evaluador de la lección de Modelado de recompensa. Puntúa esa respuesta con un solo número.",
        "**Crítico** — predice la puntuación *antes* de conocerla. La brecha (puntuación − predicción) es la **ventaja**: cuánto mejor fue la respuesta de lo esperado.",
        "**Referencia congelada** — una copia guardada del modelo de antes del RL. Una **correa KL** (KL = una distancia entre dos distribuciones de probabilidad) ata la política a ella para que no se aleje.",
      ],
      cardLabel: "BUCLE ACTOR–CRÍTICO",
      aria: "Un bucle de la política al modelo de recompensa, al crítico y de vuelta, con una correa KL a una referencia congelada.",
      steps: 1,
      captions: [
        "La política escribe una respuesta, el modelo de recompensa la puntúa, el crítico lo convierte en una ventaja y la actualización empuja a la política — todo con una correa KL a la referencia congelada.",
      ],
      hint: "Toca cada jugador para ver su tarea en el bucle.",
      readoutTitle: "LOOP",
      rows: ["POLÍTICA", "RECOMP", "CRÍTICO", "REF"],
      optionNotes: [
        "Política — el modelo que entrenamos. Cada ronda escribe una respuesta nueva al prompt, y la actualización ajusta sus pesos.",
        "Referencia congelada — una instantánea del modelo tomada antes de empezar el RL. Nunca cambia; la correa KL mide cuánto se ha alejado la política de ella.",
        "Modelo de recompensa — el evaluador que construiste en la lección de Modelado de recompensa. Lee la respuesta de la política y devuelve un solo número de calidad.",
        "Crítico — predice la puntuación que sacará una respuesta. Puntuación menos esa predicción es la ventaja que de verdad impulsa la actualización.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Por qué cada paso se recorta",
      intro:
        "El RL en línea es inestable: una sola actualización demasiado ansiosa puede arruinar el modelo. El arreglo de PPO es un recorte — limita cuánto puede mover un solo paso la probabilidad de cualquier token.",
      bullets: [
        "**La razón r** = cuánto cambia la política nueva la probabilidad de un token frente a la vieja. r = 1 significa sin cambio.",
        "**El recorte mantiene r dentro de una banda** [1−ε, 1+ε]. Un buen token puede subir — pero solo hasta 1+ε; más allá, la recompensa por empujar más se corta.",
        "**Sin el recorte, una ventaja grande es un paso gigante** que puede colapsar la política. Con él, el paso está acotado por muy tentador que sea.",
        "**ε es pequeño — cerca de 0.2.** Es una región de confianza: cambia un poco, revisa, cambia un poco más.",
      ],
      cardLabel: "EL RECORTE · r vs [1−ε, 1+ε]",
      aria: "Dos paneles comparando un paso sin recortar con uno recortado sobre una línea de razón de probabilidad.",
      steps: 1,
      captions: ["Arriba: sin recorte — el paso sigue la razón cruda. Abajo: PPO lo limita en el borde de la banda."],
      hint: "Mueve los deslizadores — empuja la razón más allá de 1+ε y mira cómo el paso recortado se detiene.",
      readoutTitle: "STEP",
      rows: ["RAZÓN", "APLICADO"],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "La correa que frena el reward hacking",
      intro:
        "Persigue el modelo de recompensa con demasiada fuerza y la política aprende a hacerle trampa — puntuaciones altas, respuestas basura. La correa KL tira de la política de vuelta hacia la referencia congelada para que mejore sin derivar.",
      bullets: [
        "**β fija la fuerza de la correa.** β más alto = correa más corta = la política se queda cerca de la referencia.",
        "**Demasiado floja (β bajo):** la política deriva lejos, la puntuación del modelo de recompensa sigue subiendo, pero la calidad real colapsa — eso es *reward hacking*.",
        "**Demasiado tensa (β alto):** la política apenas se mueve y nunca mejora de verdad.",
        "**El punto justo** sube la puntuación del modelo de recompensa *y* la calidad real — una deriva pequeña y controlada.",
      ],
      cardLabel: "GANANCIA vs DERIVA",
      aria: "Una correa entre una referencia congelada y la política, con barras de puntuación de recompensa y calidad real.",
      steps: 1,
      captions: ["Afloja la correa y la política deriva; la puntuación de recompensa sube aunque la calidad real caiga."],
      hint: "Arrastra ambos deslizadores — encuentra la β donde la calidad real llega al pico, no solo la puntuación.",
      readoutTitle: "OUTCOME",
      rows: ["DERIVA", "RM", "CALIDAD"],
    },
  ],

  n1roles: ["Política", "Ref congelada", "M. recompensa", "Crítico"],
  n1answer: "respuesta",
  n1score: "puntuación",
  n1update: "ajuste Δθ",
  n1leash: "correa KL",
  n1frozen: "REF CONGELADA",
  calloutLabel: "PARA SABER · EL CRÍTICO",
  calloutTitle: "Ventaja = puntuación − expectativa",
  calloutBody:
    "El modelo de recompensa dice qué tan buena es una respuesta; el crítico dice qué tan buena *esperaba* que fuera. PPO entrena sobre la diferencia — la ventaja. Una puntuación alta que el crítico ya predijo no enseña nada; solo la sorpresa (mejor o peor de lo esperado) mueve los pesos. Eso es lo que mantiene señal de aprendizaje en el bucle, no solo aplausos.",

  n2clipSlider: "RECORTE ε",
  n2ratioSlider: "RAZÓN PROPUESTA r",
  n2good: "Buen token (A > 0)",
  n2bad: "Mal token (A < 0)",
  n2panelNoClip: "SIN RECORTE",
  n2panelClip: "RECORTE PPO",
  n2trustBand: "banda de confianza",
  n2clippedTag: "RECORTADO",
  n2clippedNote:
    "El paso quiere pasar de la banda, así que el recorte lo limita en el borde — el empujón extra no gana recompensa extra. Una actualización no puede sacudir la política.",
  n2freeNote:
    "El paso propuesto está dentro de la banda [1−ε, 1+ε], así que el recorte no hace nada — se aplica el gradiente completo. El recorte solo actúa en pasos que llegan demasiado lejos.",
  n2deeperTitle: "El objetivo sustituto recortado",
  n2deeperBody:
    "PPO maximiza L = E[ min( r·A , clip(r, 1−ε, 1+ε)·A ) ], donde r = π_new/π_old es la razón de probabilidad y A es la ventaja. El min() elige el más pesimista de dos términos: el r·A crudo, y una versión donde r se congela al borde de la banda. Cuando un buen paso (A > 0) empuja r más allá de 1+ε, el término recortado deja de crecer, así que el gradiente ahí se aplana — el modelo no gana recompensa por pasarse. Es una región de confianza de primer orden sin la costosa matemática de segundo orden de su predecesor, TRPO.",

  n3clipSlider: "RECORTE ε",
  n3klSlider: "KL β",
  n3ref: "REF CONGELADA",
  n3policy: "política",
  n3drift: "deriva = KL",
  n3rmLabel: "punt. RM",
  n3qualityLabel: "calidad",
  n3regimeLabels: {
    stuck: "ATASCADO · correa muy tensa",
    healthy: "SANO · deriva controlada",
    hacking: "REWARD HACKING · sinsentido",
  },
  n3regimeNotes: {
    stuck: "La correa es tan corta que la política apenas se mueve — la puntuación de recompensa sube a rastras y la calidad nunca mejora de verdad. Afloja β.",
    healthy: "Una deriva pequeña y controlada: la puntuación de recompensa y la calidad real suben juntas. Aquí es donde quieres entrenar.",
    hacking: "La política ha derivado lejos y ahora le hace trampa al evaluador — la puntuación de recompensa es alta, pero la calidad real colapsó en un sinsentido confiado. Tensa β.",
  },
  n3deeperTitle: "El término de penalización KL",
  n3deeperBody:
    "La recompensa que la política optimiza de verdad es r_total = r_RM − β · KL(π ‖ π_ref): la puntuación del modelo de recompensa menos β por la distancia KL a la referencia congelada. KL(π ‖ π_ref) crece a medida que la distribución de salida de la política se aleja de la de la referencia, así que la penalización actúa como un resorte que tira de vuelta. β es la constante del resorte. Algunas implementaciones en su lugar recortan o ajustan β de forma adaptativa para alcanzar una KL objetivo por lote. En cualquier caso, el recorte acota un paso; la KL acota la distancia total recorrida — que es lo que de verdad frena el reward hacking.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ:
    "PPO ya limita cada paso con el recorte. ¿Por qué atar además el modelo a una referencia congelada con una penalización KL?",
  explainA:
    "Porque el recorte solo acota un paso a la vez — no dice nada sobre dónde acabas tras miles de ellos. Los pasos recortados pequeños igual se acumulan, y la política puede caminar despacio hacia un lugar que el modelo de recompensa adora pero los humanos no: sinsentido confiado que le hace trampa al evaluador. La correa KL acota la distancia *total* desde el modelo de partida confiable, así que la suma de todos esos pasitos no puede derivar al reward hacking. El recorte controla el paso; la KL controla el destino.",
  bridgeLabel: "SIGUIENTE: GRPO",
  bridgeBody:
    "PPO funciona — pero ese crítico es una segunda red de tamaño completo que entrenar y almacenar, cara y delicada. Sigue **GRPO**: tira el crítico a la basura y, en vez de predecir la puntuación, muestrea un *grupo* de respuestas al mismo prompt y usa su promedio como base. La misma idea de ventaja, la mitad de la maquinaria.",
  prevLesson: "Ajuste fino eficiente en parámetros",
  nextLesson: "Continuar a GRPO",
};
