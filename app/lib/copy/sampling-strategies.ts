/**
 * Stage 0 · Sampling strategies. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: the previous lesson ("Choosing the next token") ended with a
 * probability distribution and one pick. This lesson is about the knobs that
 * reshape that distribution before the pick — temperature, top-k / top-p, and a
 * repetition penalty — and how each trades focus against creativity.
 */
import type { WsNodeCopy } from "./shared";

export interface SamplingStrategiesLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  /** Candidate token labels, index-aligned to BASE_LOGITS in the lib module. */
  tokens: string[];
  promptLabel: string; //  "THE PROMPT SO FAR"
  promptText: string; //   "The cat sat on the …"
  keptWord: string; //     "kept"
  droppedWord: string; //  "dropped"
  topPickWord: string; //  "top pick"
  // node 1 — temperature
  n1slider: string; //     "TEMPERATURE"
  n1presetsLabel: string;
  n1presets: string[]; //  [Focused, Balanced, Creative]
  n1presetNotes: string[];
  n1roll: string; //       "🎲 Sample a token"
  n1sampledWord: string; //"sampled"
  n1sampledFmt: string; // "sampled: {t}" template prefix (before token)
  // node 2 — top-k / top-p
  n2kSlider: string; //    "TOP-K"
  n2pSlider: string; //    "TOP-P"
  n2kPanel: string; //     "TOP-K · keep a fixed count"
  n2pPanel: string; //     "TOP-P · keep a fixed probability mass"
  // node 3 — repetition penalty
  n3slider: string; //     "REPETITION PENALTY"
  n3contextLabel: string;
  n3contextText: string;
  n3penalisedWord: string; // "penalised"
  n3noteOff: string; //    shown at penalty 1.0
  n3noteFmt: string; //    "{t} pushed down — top pick is now {u}" template
  // deeper blocks
  deeperTempTitle: string;
  deeperTempBody: string;
  deeperPenTitle: string;
  deeperPenBody: string;
  // outro
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const samplingStrategiesEN: SamplingStrategiesLesson = {
  crumb: "STAGE 0 · SAMPLING STRATEGIES",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Sampling strategies",
  lede: "The last lesson left you holding a probability for every next token. That is not the answer yet — it is raw material. These three knobs reshape that distribution before a token is drawn, trading focus against creativity. Every one is live to play with.",
  pipelineLabel: "THE 3 KNOBS",
  pipeline: ["Temperature", "Cut the tail: top-k / top-p", "Repetition penalty"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Temperature: flatten or sharpen",
      intro: "You already know [softmax](/stage/0/choosing-the-next-token) turns raw scores into probabilities. Temperature is one number that goes *inside* it — dividing every score before the squash.",
      bullets: [
        "**Low temperature sharpens.** Divide the scores by a small number and the gaps blow up — one bar towers over the rest. The model plays it safe.",
        "**High temperature flattens.** Divide by a big number and the bars level out toward a coin flip. The model gets adventurous — and sloppier.",
        "**T = 1 changes nothing** — it's the raw distribution. **T → 0 is greedy**: the top bar wins every time.",
        "**Ranking never changes, spread does.** Temperature can't make a low bar outrank a high one — it only widens or narrows the odds. Hit *sample* to feel it.",
      ],
      cardLabel: "PROBABILITY OVER NEXT TOKENS · TEMPERATURE",
      aria: "A probability bar chart over eight candidate tokens that flattens or sharpens as temperature changes.",
      steps: 1,
      captions: ["Move temperature and watch the bars spread out or spike; sample to draw one."],
      hint: "Drag temperature, then hit sample a few times — low T lands on 'mat' almost always, high T wanders.",
      readoutTitle: "",
      rows: [],
      sliderNote: "Temperature = how evenly the odds are spread. Below 1 the model gets focused and repeatable; above 1 it gets varied and risky.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Cut the tail before you roll",
      intro: "Even a good distribution has a long tail of junk tokens, each with a tiny chance. Sampling could still pick one. Top-k and top-p both chop that tail off first — they just measure the cut differently.",
      bullets: [
        "**Top-k keeps a fixed *count*.** Keep the k best tokens, drop the rest, then sample. Simple, but blind to how peaked the distribution is.",
        "**Top-p keeps a fixed *mass*.** Keep the fewest top tokens whose probabilities add up to p (say 90%), drop the rest. The count flexes with the distribution.",
        "**Same idea, different ruler.** When the model is confident, top-p keeps just a couple; when it's unsure, top-p widens to stay fair. Top-k always keeps the same number.",
        "**Both renormalise the survivors** back to 100% before the draw — the dropped tail can never be chosen.",
      ],
      cardLabel: "TOP-K vs TOP-P · SAME DISTRIBUTION, TWO CUTS",
      aria: "Two bar charts of the same distribution, one truncated by a fixed count and one by a fixed probability mass.",
      steps: 1,
      captions: ["Move each cutoff and watch which tokens survive into the sampling pool."],
      hint: "Drag both cutoffs — notice top-p keeps a different number of tokens than top-k for the same distribution.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Repetition penalty: stop the loop",
      intro: "Left alone, a confident model loops — 'the cat sat on the mat, the cat sat on the mat …'. A repetition penalty leans against tokens it has just used, so it stops circling.",
      bullets: [
        "**It docks tokens already in the recent text.** Any word the model just generated gets its score cut before the softmax, so its bar shrinks.",
        "**The looped word here is 'mat'.** At penalty 1 it wins again and the loop continues; raise the penalty and its bar drops below 'floor', which takes over.",
        "**Turn it up too far and text degrades** — the model starts dodging perfectly good words just because it used them once. Most decoders sit around 1.1–1.3.",
        "**This is a decode-time patch, not a cure.** It nudges the odds after the model has spoken; it doesn't teach the model anything.",
      ],
      cardLabel: "PROBABILITY OVER NEXT TOKENS · REPETITION PENALTY",
      aria: "A probability bar chart where the already-used token's bar shrinks as the repetition penalty rises.",
      steps: 1,
      captions: ["Raise the penalty and watch the repeated token's bar fall until a fresh word leads."],
      hint: "Drag the penalty up — 'mat' was the runaway favourite; watch it drop and 'floor' take the lead.",
      readoutTitle: "",
      rows: [],
      sliderNote: "Penalty = how hard to push down words already used. 1.0 does nothing; higher shrinks repeats, but too high starts refusing good words.",
    },
  ],
  tokens: ["mat", "floor", "rug", "carpet", "sofa", "bed", "step", "roof"],
  promptLabel: "THE PROMPT SO FAR",
  promptText: "The cat sat on the …",
  keptWord: "kept",
  droppedWord: "dropped",
  topPickWord: "top pick",
  n1slider: "TEMPERATURE",
  n1presetsLabel: "PRESETS",
  n1presets: ["Focused · 0.4", "Balanced · 1.0", "Creative · 1.6"],
  n1presetNotes: [
    "Focused (T = 0.4) — the scores are stretched apart, so 'mat' dominates. Great for facts and code, dull for prose.",
    "Balanced (T = 1.0) — the raw distribution, untouched. The default starting point.",
    "Creative (T = 1.6) — the bars flatten, so lower-ranked words get a real shot. More variety, more mistakes.",
  ],
  n1roll: "🎲 Sample a token",
  n1sampledWord: "sampled",
  n1sampledFmt: "sampled:",
  n2kSlider: "TOP-K · keep k tokens",
  n2pSlider: "TOP-P · keep p of the mass",
  n2kPanel: "TOP-K · a fixed count",
  n2pPanel: "TOP-P · a fixed mass",
  n3slider: "REPETITION PENALTY",
  n3contextLabel: "ALREADY GENERATED",
  n3contextText: "The cat sat on the mat. The cat sat on the …",
  n3penalisedWord: "penalised",
  n3noteOff: "Penalty 1.0 — nothing is docked, so 'mat' wins again and the sentence loops.",
  n3noteFmt: "pushed down — top pick is now",
  deeperTempTitle: "The temperature formula",
  deeperTempBody:
    "Softmax with temperature T is p(i) = exp(zᵢ ⁄ T) ⁄ Σⱼ exp(zⱼ ⁄ T). Dividing the scores by T before exponentiating is the whole trick: T < 1 magnifies the gaps between scores (sharper), T > 1 shrinks them (flatter), and T = 1 is the plain softmax from the last lesson. As T → 0 the largest score dominates completely, which is exactly greedy decoding.",
  deeperPenTitle: "How the penalty is applied",
  deeperPenBody:
    "The common (Hugging-Face-style) form adjusts each already-seen token's raw score z before the softmax: z ⁄ penalty when z > 0, and z × penalty when z < 0 — positive scores shrink toward zero while negative scores grow more negative, and both lower the token's probability. A penalty of 1.0 leaves everything unchanged. A related knob, 'frequency penalty', subtracts a fixed amount per occurrence, so a word used five times is docked five times as hard.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Temperature and top-p both aim for 'more variety without more nonsense'. Why keep both instead of just turning temperature up?",
  explainA: "Because they act on different parts of the distribution. **Temperature** rescales *every* bar at once — turn it up for variety and you also feed oxygen to the junk tokens in the tail, so nonsense creeps in. **Top-p** (and top-k) don't touch the shape; they *delete the tail* outright, then renormalise, so the unlikely tokens simply can't be drawn no matter how flat things get. In practice you combine them: top-p removes the truly bad options, and temperature sets how adventurous the model is among the ones that remain. A **repetition penalty** is a third, orthogonal knob — it targets words the model just used, to stop it looping.",
  bridgeLabel: "NEXT · BACKPROPAGATION",
  bridgeBody: "You've now seen the whole forward path — text in, one token out, knobs and all. But where do the weights that produce those scores come from? Next, **backpropagation**: how the model measures its own mistakes and rewrites its weights to make better predictions.",
  prevLesson: "Back: feed-forward network",
  nextLesson: "Continue to backpropagation",
};

/* ============================================================ SPANISH ======= */

export const samplingStrategiesES: SamplingStrategiesLesson = {
  crumb: "ETAPA 0 · ESTRATEGIAS DE MUESTREO",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Estrategias de muestreo",
  lede: "La lección anterior te dejó con una probabilidad para cada token siguiente. Eso todavía no es la respuesta — es materia prima. Estas tres perillas reconfiguran esa distribución antes de sacar un token, cambiando enfoque por creatividad. Todas están en vivo para que juegues.",
  pipelineLabel: "LAS 3 PERILLAS",
  pipeline: ["Temperatura", "Cortar la cola: top-k / top-p", "Penalización por repetición"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Temperatura: aplanar o afilar",
      intro: "Ya sabes que [softmax](/stage/0/choosing-the-next-token) convierte puntuaciones crudas en probabilidades. La temperatura es un número que va *dentro* de él — divide cada puntuación antes del aplastado.",
      bullets: [
        "**Temperatura baja afila.** Divide las puntuaciones por un número pequeño y las brechas se disparan — una barra domina a las demás. El modelo va a lo seguro.",
        "**Temperatura alta aplana.** Divide por un número grande y las barras se nivelan hacia el azar puro. El modelo se vuelve atrevido — y más descuidado.",
        "**T = 1 no cambia nada** — es la distribución cruda. **T → 0 es greedy**: la barra más alta gana siempre.",
        "**El orden nunca cambia, la dispersión sí.** La temperatura no puede hacer que una barra baja supere a una alta — solo ensancha o estrecha las probabilidades. Pulsa *muestrear* para sentirlo.",
      ],
      cardLabel: "PROBABILIDAD DEL SIGUIENTE TOKEN · TEMPERATURA",
      aria: "Un gráfico de barras de probabilidad sobre ocho tokens candidatos que se aplana o se afila al cambiar la temperatura.",
      steps: 1,
      captions: ["Mueve la temperatura y mira las barras dispersarse o dispararse; muestrea para sacar una."],
      hint: "Arrastra la temperatura y muestrea varias veces — con T baja casi siempre cae en 'tapete', con T alta vagabundea.",
      readoutTitle: "",
      rows: [],
      sliderNote: "Temperatura = qué tan parejas están repartidas las probabilidades. Bajo 1 el modelo se enfoca y se vuelve repetible; sobre 1 se vuelve variado y arriesgado.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Corta la cola antes de tirar",
      intro: "Hasta una buena distribución tiene una larga cola de tokens basura, cada uno con una probabilidad diminuta. El muestreo aún podría elegir uno. Top-k y top-p cortan esa cola primero — solo miden el corte distinto.",
      bullets: [
        "**Top-k conserva un *número* fijo.** Quédate con los k mejores tokens, descarta el resto y luego muestrea. Simple, pero ciego a qué tan concentrada está la distribución.",
        "**Top-p conserva una *masa* fija.** Quédate con los menos tokens de arriba cuyas probabilidades sumen p (digamos 90%), descarta el resto. El número se flexibiliza con la distribución.",
        "**Misma idea, distinta regla.** Cuando el modelo está seguro, top-p conserva solo un par; cuando duda, top-p se ensancha para ser justo. Top-k siempre conserva el mismo número.",
        "**Ambos renormalizan a los sobrevivientes** de vuelta al 100% antes de tirar — la cola descartada jamás puede ser elegida.",
      ],
      cardLabel: "TOP-K vs TOP-P · MISMA DISTRIBUCIÓN, DOS CORTES",
      aria: "Dos gráficos de barras de la misma distribución, uno truncado por un número fijo y otro por una masa de probabilidad fija.",
      steps: 1,
      captions: ["Mueve cada corte y mira qué tokens sobreviven al conjunto de muestreo."],
      hint: "Arrastra ambos cortes — fíjate que top-p conserva un número distinto de tokens que top-k para la misma distribución.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Penalización por repetición: corta el bucle",
      intro: "Si lo dejas solo, un modelo seguro entra en bucle — 'el gato se sentó en el tapete, el gato se sentó en el tapete …'. Una penalización por repetición se opone a los tokens que acaba de usar, para que deje de dar vueltas.",
      bullets: [
        "**Descuenta a los tokens ya presentes en el texto reciente.** Cualquier palabra que el modelo acaba de generar recibe un recorte en su puntuación antes del softmax, así su barra encoge.",
        "**Aquí la palabra en bucle es 'tapete'.** Con penalización 1 gana de nuevo y el bucle sigue; sube la penalización y su barra cae por debajo de 'suelo', que toma el mando.",
        "**Súbela demasiado y el texto se degrada** — el modelo empieza a esquivar palabras perfectamente buenas solo por haberlas usado una vez. La mayoría de los decodificadores rondan 1.1–1.3.",
        "**Es un parche en la decodificación, no una cura.** Empuja las probabilidades después de que el modelo ya habló; no le enseña nada al modelo.",
      ],
      cardLabel: "PROBABILIDAD DEL SIGUIENTE TOKEN · PENALIZACIÓN POR REPETICIÓN",
      aria: "Un gráfico de barras de probabilidad donde la barra del token ya usado encoge al subir la penalización por repetición.",
      steps: 1,
      captions: ["Sube la penalización y mira caer la barra del token repetido hasta que lidera una palabra fresca."],
      hint: "Sube la penalización — 'tapete' era el favorito absoluto; míralo caer y a 'suelo' tomar el mando.",
      readoutTitle: "",
      rows: [],
      sliderNote: "Penalización = con cuánta fuerza empujar hacia abajo las palabras ya usadas. 1.0 no hace nada; más alto encoge las repeticiones, pero demasiado alto empieza a rechazar palabras buenas.",
    },
  ],
  tokens: ["tapete", "suelo", "alfombra", "felpudo", "sofá", "cama", "escalón", "techo"],
  promptLabel: "EL PROMPT HASTA AHORA",
  promptText: "El gato se sentó en el …",
  keptWord: "conservados",
  droppedWord: "descartados",
  topPickWord: "elegida",
  n1slider: "TEMPERATURA",
  n1presetsLabel: "PRESETS",
  n1presets: ["Enfocado · 0.4", "Equilibrado · 1.0", "Creativo · 1.6"],
  n1presetNotes: [
    "Enfocado (T = 0.4) — las puntuaciones se estiran, así que 'tapete' domina. Ideal para datos y código, aburrido para prosa.",
    "Equilibrado (T = 1.0) — la distribución cruda, intacta. El punto de partida por defecto.",
    "Creativo (T = 1.6) — las barras se aplanan, así que las palabras peor situadas tienen oportunidad real. Más variedad, más errores.",
  ],
  n1roll: "🎲 Muestrear un token",
  n1sampledWord: "muestreado",
  n1sampledFmt: "muestreado:",
  n2kSlider: "TOP-K · conserva k tokens",
  n2pSlider: "TOP-P · conserva p de la masa",
  n2kPanel: "TOP-K · un número fijo",
  n2pPanel: "TOP-P · una masa fija",
  n3slider: "PENALIZACIÓN POR REPETICIÓN",
  n3contextLabel: "YA GENERADO",
  n3contextText: "El gato se sentó en el tapete. El gato se sentó en el …",
  n3penalisedWord: "penalizado",
  n3noteOff: "Penalización 1.0 — no se descuenta nada, así que 'tapete' gana de nuevo y la frase entra en bucle.",
  n3noteFmt: "empujado abajo — la mejor opción ahora es",
  deeperTempTitle: "La fórmula de la temperatura",
  deeperTempBody:
    "El softmax con temperatura T es p(i) = exp(zᵢ ⁄ T) ⁄ Σⱼ exp(zⱼ ⁄ T). Dividir las puntuaciones por T antes de exponenciar es todo el truco: T < 1 magnifica las brechas entre puntuaciones (más afilado), T > 1 las encoge (más plano), y T = 1 es el softmax simple de la lección anterior. Cuando T → 0 la puntuación más grande domina por completo, que es exactamente la decodificación greedy.",
  deeperPenTitle: "Cómo se aplica la penalización",
  deeperPenBody:
    "La forma común (estilo Hugging Face) ajusta la puntuación cruda z de cada token ya visto antes del softmax: z ⁄ penalización cuando z > 0, y z × penalización cuando z < 0 — los puntajes positivos se encogen hacia cero mientras que los negativos se vuelven más negativos, y ambos bajan la probabilidad del token. Una penalización de 1.0 deja todo igual. Una perilla relacionada, la 'penalización por frecuencia', resta una cantidad fija por aparición, así una palabra usada cinco veces se descuenta cinco veces más fuerte.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Temperatura y top-p buscan lo mismo: 'más variedad sin más disparates'. ¿Por qué conservar ambos en vez de solo subir la temperatura?",
  explainA: "Porque actúan sobre partes distintas de la distribución. La **temperatura** reescala *todas* las barras a la vez — súbela para variedad y también le das oxígeno a los tokens basura de la cola, así se cuelan los disparates. **Top-p** (y top-k) no tocan la forma; *borran la cola* de raíz y luego renormalizan, así los tokens improbables simplemente no pueden salir por más plano que quede todo. En la práctica los combinas: top-p elimina las opciones de verdad malas, y la temperatura fija cuán atrevido es el modelo entre las que quedan. La **penalización por repetición** es una tercera perilla, ortogonal — apunta a las palabras que el modelo acaba de usar, para que no entre en bucle.",
  bridgeLabel: "SIGUIENTE · RETROPROPAGACIÓN",
  bridgeBody: "Ya viste todo el camino hacia adelante — entra texto, sale un token, con perillas y todo. Pero ¿de dónde salen los pesos que producen esas puntuaciones? Sigue **la retropropagación**: cómo el modelo mide sus propios errores y reescribe sus pesos para predecir mejor.",
  prevLesson: "Atrás: red feed-forward",
  nextLesson: "Continuar a retropropagación",
};
