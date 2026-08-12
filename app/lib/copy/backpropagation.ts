/**
 * Stage 0 · 2.5.1 — Backpropagation. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs. All
 * user-facing text lives here, both languages, full parity.
 *
 * One idea: to cut the loss, the model works out how much each weight caused the
 * error (its gradient, via the chain rule) and nudges every weight the opposite
 * way. Builds on "How models learn" (guess → loss → nudge) — that lesson said
 * "nudge the weights downhill"; this one shows HOW the nudge is computed.
 */
import type { WsNodeCopy } from "./shared";

export interface BackpropagationLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — blame flows backward
  n1modes: string[]; //      [Forward pass, Backward pass]
  n1predictWord: string; //  "prediction"
  n1targetWord: string; //   "target"
  n1errorWord: string; //    "error"
  n1lossWord: string; //     "loss"
  n1blameWord: string; //    "blame"
  n1inputWord: string; //    "input"
  n1weightWord: string; //   "weight"

  // Node 2 — the gradient
  n2w1Label: string; //      slider: weight 1
  n2w2Label: string; //      slider: weight 2
  n2youLabel: string; //     "you are here"
  n2minLabel: string; //     "lowest loss"
  n2uphillLabel: string; //  "gradient — uphill"
  n2downhillLabel: string; //"−gradient — downhill"
  n2lowLabel: string; //     legend: low loss
  n2highLabel: string; //    legend: high loss
  n2lossWord: string; //     "loss"

  // Node 3 — take a step
  n3rateLabel: string; //    slider: learning rate
  n3stepBtn: string; //      "Step"
  n3runBtn: string; //       "Run ×10"
  n3resetBtn: string; //     "Reset"
  n3stepWord: string; //     "step"
  n3rateNotes: string[]; //  [slow, good, big], index-aligned to lrRegime
  n3startNote: string; //    shown before the first step
  n3convergedNote: string; //shown once loss is tiny

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

export const backpropagationEN: BackpropagationLesson = {
  crumb: "STAGE 0 · 2.5 · BACKPROPAGATION",
  eyebrow: "STAGE 0 · 2.5 · 3 NODES",
  title: "Backpropagation",
  lede: "You already saw the model guess, measure its loss, and nudge its weights downhill. This is the missing piece: how it works out which way is downhill for millions of weights at once — by passing the blame backward through the network.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Blame flows backward", "The gradient", "Take a step"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The blame flows backward",
      intro: "First the network runs forward to make a guess. Then the error at the very end is passed back through it — and every weight gets a share of the blame for how wrong the guess was.",
      bullets: [
        "**Forward = predict.** The input flows left to right; each weight multiplies the signal, and the last one produces the guess.",
        "**Backward = assign blame.** Start from the error at the end and hand it back through the network, one weight at a time.",
        "**Each weight's blame = the blame arriving × the signal that flowed into it.** That single multiply, repeated at every step, *is* the chain rule.",
        "**A bigger signal or a wronger guess means more blame** — and that weight gets a bigger correction.",
      ],
      cardLabel: "ONE TINY NETWORK · FORWARD vs BACKWARD",
      aria: "A small chain of weights running forward to a prediction, then error flowing backward to each weight.",
      steps: 1,
      captions: ["Flip between the forward guess and the backward flow of blame through the same weights."],
      hint: "Switch to the backward pass — the error at the end splits into a share of blame for each weight.",
      readoutTitle: "PASS",
      rows: ["ERROR", "LOSS"],
      optionNotes: [
        "Forward pass — the input is multiplied by each weight in turn to produce the prediction. Then it's compared to the target to get the error.",
        "Backward pass — the error is carried back through the network. At each weight, multiply the blame coming in by the signal that flowed in — that's how much this weight caused the error.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The gradient points uphill",
      intro: "The blame on one weight is just a slope: if I nudge this weight up a hair, does the loss go up or down, and how fast? Collect that slope for every weight and you have the gradient. Here it's two weights, so the loss is a bowl.",
      bullets: [
        "**The map is the loss** — dark green is low (good), pale is high (bad). The bottom of the bowl is the best the model can do.",
        "**The red arrow is the gradient: the steepest way *uphill*** from where you stand. It's the slope in both weights at once.",
        "**Downhill is simply the opposite direction** (the green arrow). That's the way that cuts the loss.",
        "**The valley is stretched, so downhill doesn't point straight at the goal** — it points across the slope. That's why training takes many steps, not one.",
      ],
      cardLabel: "LOSS BOWL · THE GRADIENT ARROW",
      aria: "A contour map of the loss over two weights, with an arrow showing the uphill gradient and its downhill opposite.",
      steps: 1,
      captions: ["Move the two weights and watch the gradient arrow swing to always point straight uphill."],
      hint: "Drag either weight — the arrow always points uphill, and it shrinks to nothing as you near the bottom.",
      readoutTitle: "AT_THIS_POINT",
      rows: ["LOSS", "GRADIENT", "DOWNHILL"],
      readoutNote: "The loss where you're standing, how steep the slope is (the gradient's size), and the direction that lowers it.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Take a small step, then repeat",
      intro: "Now put it together. Each step moves the weights a little way downhill — a fraction of the gradient, set by the learning rate. Do it again and again and the ball rolls to the bottom of the bowl.",
      bullets: [
        "**One step:** every weight ← weight − learning-rate × its blame. Small, downhill, all at once.",
        "**Too small a rate crawls; too big overshoots** and the loss climbs instead of falling. Push the slider and watch it happen.",
        "**Repeat thousands of times and the loss keeps dropping** — this loop, over billions of weights, is how a model trains.",
      ],
      cardLabel: "GRADIENT DESCENT · ROLL DOWNHILL",
      aria: "The same loss bowl with a descent path; each step moves the point downhill toward the minimum.",
      steps: 1,
      captions: ["Press Step to nudge the weights downhill; the trail shows the path and the loss keeps dropping."],
      hint: "Press Step a few times, then push the learning rate up until the ball overshoots and the loss climbs.",
      readoutTitle: "DESCENT",
      rows: ["STEP", "LOSS", "RATE"],
      readoutNote: "How many steps you've taken, the loss right now, and the learning rate — the size of each downhill nudge.",
    },
  ],
  n1modes: ["Forward pass", "Backward pass"],
  n1predictWord: "prediction",
  n1targetWord: "target",
  n1errorWord: "error",
  n1lossWord: "loss",
  n1blameWord: "blame",
  n1inputWord: "input",
  n1weightWord: "w",
  n2w1Label: "WEIGHT 1",
  n2w2Label: "WEIGHT 2",
  n2youLabel: "you are here",
  n2minLabel: "lowest loss",
  n2uphillLabel: "gradient · uphill",
  n2downhillLabel: "−gradient · downhill",
  n2lowLabel: "low loss",
  n2highLabel: "high loss",
  n2lossWord: "loss",
  n3rateLabel: "LEARNING RATE",
  n3stepBtn: "Step",
  n3runBtn: "Run ×10",
  n3resetBtn: "Reset",
  n3stepWord: "step",
  n3rateNotes: [
    "Small rate — each step barely moves. Safe, but it would take forever to reach the bottom.",
    "Good rate — big enough to make real progress, small enough to keep heading downhill. The loss falls fast.",
    "Rate too big — the step overshoots the bottom and lands higher up the far wall. The loss climbs instead of falling, and it can blow up.",
  ],
  n3startNote: "You're up on the steep wall of the bowl. Press Step to move the weights a little way downhill.",
  n3convergedNote: "The ball has settled at the bottom — the loss is about as low as this bowl allows. Training has converged.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A model has millions of weights. How does one wrong guess tell every single one which way to move?",
  explainA: "By passing the blame backward. The model runs forward to make its guess, then measures the **error** at the end. Backpropagation carries that error back through the network: at every weight it multiplies the blame coming in by the signal that flowed in, which gives that weight's **gradient** — the slope of the loss with respect to it, i.e. how much it caused the error and in which direction. That one multiply, chained through every layer, is the **chain rule**, and it produces a gradient for all the weights in a single backward sweep. Then each weight takes a small step *against* its gradient — weight − learning-rate × gradient — which lowers the loss a little. Repeat, and the loss keeps falling.",
  bridgeLabel: "NEXT: 2.5.2 · OPTIMIZERS",
  bridgeBody: "Plain gradient descent takes the same fixed step everywhere — slow in flat spots, jumpy on steep walls. Next, **optimizers**: how tricks like momentum and per-weight learning rates (Adam) make the ball roll to the bottom far faster.",
  prevLesson: "Back: sampling strategies",
  nextLesson: "Continue to optimizers",
};

/* ============================================================ SPANISH ======= */

export const backpropagationES: BackpropagationLesson = {
  crumb: "ETAPA 0 · 2.5 · RETROPROPAGACIÓN",
  eyebrow: "ETAPA 0 · 2.5 · 3 NODOS",
  title: "Retropropagación",
  lede: "Ya viste al modelo adivinar, medir su pérdida y empujar sus pesos cuesta abajo. Esta es la pieza que faltaba: cómo averigua hacia dónde es cuesta abajo para millones de pesos a la vez — pasando la culpa hacia atrás por la red.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["La culpa va hacia atrás", "El gradiente", "Dar un paso"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "La culpa fluye hacia atrás",
      intro: "Primero la red corre hacia adelante para adivinar. Luego el error del final se pasa de vuelta por ella — y cada peso recibe su parte de culpa por cuán equivocada estuvo la adivinanza.",
      bullets: [
        "**Adelante = predecir.** La entrada fluye de izquierda a derecha; cada peso multiplica la señal, y el último produce la adivinanza.",
        "**Atrás = repartir la culpa.** Empieza en el error del final y pásalo de vuelta por la red, peso por peso.",
        "**La culpa de cada peso = la culpa que llega × la señal que entró en él.** Esa sola multiplicación, repetida en cada paso, *es* la regla de la cadena.",
        "**Una señal mayor o una adivinanza más errada significan más culpa** — y ese peso recibe una corrección mayor.",
      ],
      cardLabel: "UNA RED DIMINUTA · ADELANTE vs ATRÁS",
      aria: "Una pequeña cadena de pesos que corre hacia adelante hasta una predicción, y luego el error fluyendo hacia atrás a cada peso.",
      steps: 1,
      captions: ["Alterna entre la adivinanza hacia adelante y el flujo de culpa hacia atrás por los mismos pesos."],
      hint: "Cambia al paso hacia atrás — el error del final se reparte en una porción de culpa para cada peso.",
      readoutTitle: "PASO",
      rows: ["ERROR", "PÉRDIDA"],
      optionNotes: [
        "Paso hacia adelante — la entrada se multiplica por cada peso, uno tras otro, para producir la predicción. Luego se compara con el objetivo para obtener el error.",
        "Paso hacia atrás — el error se lleva de vuelta por la red. En cada peso, multiplica la culpa que llega por la señal que entró — eso es cuánto causó el error ese peso.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El gradiente apunta cuesta arriba",
      intro: "La culpa sobre un peso es solo una pendiente: si empujo este peso un pelín hacia arriba, ¿la pérdida sube o baja, y qué tan rápido? Junta esa pendiente para cada peso y tienes el gradiente. Aquí son dos pesos, así que la pérdida es un tazón.",
      bullets: [
        "**El mapa es la pérdida** — verde oscuro es baja (buena), pálido es alta (mala). El fondo del tazón es lo mejor que el modelo puede lograr.",
        "**La flecha roja es el gradiente: la subida *más empinada*** desde donde estás. Es la pendiente en ambos pesos a la vez.",
        "**Cuesta abajo es simplemente la dirección opuesta** (la flecha verde). Ese es el camino que reduce la pérdida.",
        "**El valle es alargado, así que cuesta abajo no apunta directo a la meta** — apunta cruzando la ladera. Por eso entrenar toma muchos pasos, no uno.",
      ],
      cardLabel: "TAZÓN DE PÉRDIDA · LA FLECHA DEL GRADIENTE",
      aria: "Un mapa de contornos de la pérdida sobre dos pesos, con una flecha que muestra el gradiente cuesta arriba y su opuesto cuesta abajo.",
      steps: 1,
      captions: ["Mueve los dos pesos y mira la flecha del gradiente girar para apuntar siempre directo cuesta arriba."],
      hint: "Arrastra cualquier peso — la flecha siempre apunta cuesta arriba, y se encoge hasta nada al acercarte al fondo.",
      readoutTitle: "EN_ESTE_PUNTO",
      rows: ["PÉRDIDA", "GRADIENTE", "CUESTA ABAJO"],
      readoutNote: "La pérdida donde estás parado, qué tan empinada es la pendiente (el tamaño del gradiente) y la dirección que la baja.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Da un paso pequeño, luego repite",
      intro: "Ahora júntalo. Cada paso mueve los pesos un poco cuesta abajo — una fracción del gradiente, fijada por la tasa de aprendizaje. Hazlo una y otra vez y la bola rueda al fondo del tazón.",
      bullets: [
        "**Un paso:** cada peso ← peso − tasa-de-aprendizaje × su culpa. Pequeño, cuesta abajo, todo a la vez.",
        "**Una tasa muy pequeña se arrastra; una muy grande se pasa** y la pérdida sube en vez de bajar. Empuja el control y míralo pasar.",
        "**Repite miles de veces y la pérdida sigue bajando** — este bucle, sobre miles de millones de pesos, es como entrena un modelo.",
      ],
      cardLabel: "DESCENSO POR GRADIENTE · RODAR CUESTA ABAJO",
      aria: "El mismo tazón de pérdida con un camino de descenso; cada paso mueve el punto cuesta abajo hacia el mínimo.",
      steps: 1,
      captions: ["Presiona Paso para empujar los pesos cuesta abajo; el rastro muestra el camino y la pérdida sigue bajando."],
      hint: "Presiona Paso unas veces, luego sube la tasa de aprendizaje hasta que la bola se pase y la pérdida suba.",
      readoutTitle: "DESCENSO",
      rows: ["PASO", "PÉRDIDA", "TASA"],
      readoutNote: "Cuántos pasos has dado, la pérdida ahora mismo y la tasa de aprendizaje — el tamaño de cada empujón cuesta abajo.",
    },
  ],
  n1modes: ["Hacia adelante", "Hacia atrás"],
  n1predictWord: "predicción",
  n1targetWord: "objetivo",
  n1errorWord: "error",
  n1lossWord: "pérdida",
  n1blameWord: "culpa",
  n1inputWord: "entrada",
  n1weightWord: "w",
  n2w1Label: "PESO 1",
  n2w2Label: "PESO 2",
  n2youLabel: "estás aquí",
  n2minLabel: "pérdida mínima",
  n2uphillLabel: "gradiente · arriba",
  n2downhillLabel: "−gradiente · abajo",
  n2lowLabel: "pérdida baja",
  n2highLabel: "pérdida alta",
  n2lossWord: "pérdida",
  n3rateLabel: "TASA DE APRENDIZAJE",
  n3stepBtn: "Paso",
  n3runBtn: "Correr ×10",
  n3resetBtn: "Reiniciar",
  n3stepWord: "paso",
  n3rateNotes: [
    "Tasa pequeña — cada paso apenas se mueve. Segura, pero tardaría una eternidad en llegar al fondo.",
    "Buena tasa — bastante grande para avanzar de verdad, bastante pequeña para seguir yendo cuesta abajo. La pérdida cae rápido.",
    "Tasa demasiado grande — el paso se pasa del fondo y cae más arriba en la pared opuesta. La pérdida sube en vez de bajar, y puede dispararse.",
  ],
  n3startNote: "Estás arriba en la pared empinada del tazón. Presiona Paso para mover los pesos un poco cuesta abajo.",
  n3convergedNote: "La bola se asentó en el fondo — la pérdida está casi tan baja como permite este tazón. El entrenamiento convergió.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo tiene millones de pesos. ¿Cómo le dice una sola adivinanza errada a cada uno hacia dónde moverse?",
  explainA: "Pasando la culpa hacia atrás. El modelo corre hacia adelante para adivinar, luego mide el **error** al final. La retropropagación lleva ese error de vuelta por la red: en cada peso multiplica la culpa que llega por la señal que entró, lo que da el **gradiente** de ese peso — la pendiente de la pérdida respecto a él, es decir, cuánto causó el error y en qué dirección. Esa sola multiplicación, encadenada por cada capa, es la **regla de la cadena**, y produce un gradiente para todos los pesos en un solo barrido hacia atrás. Luego cada peso da un paso pequeño *en contra* de su gradiente — peso − tasa-de-aprendizaje × gradiente — lo que baja la pérdida un poco. Repite, y la pérdida sigue cayendo.",
  bridgeLabel: "SIGUIENTE: 2.5.2 · OPTIMIZADORES",
  bridgeBody: "El descenso por gradiente simple da el mismo paso fijo en todas partes — lento en lo plano, brusco en las paredes empinadas. Sigue **los optimizadores**: cómo trucos como el momento y las tasas por peso (Adam) hacen que la bola llegue al fondo mucho más rápido.",
  prevLesson: "Atrás: estrategias de muestreo",
  nextLesson: "Continuar a optimizadores",
};
