/**
 * Stage 0 · 1.4 — Long context. Interface + EN/ES copy for the scroll-driven
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: a model trained on a short window (say 4k tokens) can be stretched
 * to 128k+ WITHOUT retraining, by rescaling RoPE's rotation frequencies so far
 * positions still land on angles the model saw in training. Three ways to do it
 * — linear, NTK-aware, YaRN — trade reach against how sharp nearby tokens stay.
 * Builds on rope-math.ts (position = rotation; only the gap matters).
 */
import type { WsNodeCopy } from "./shared";

export interface LongContextLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — the problem
  n1posLabel: string; //   slider "TOKEN POSITION m"
  n1pairLabel: string; //  segmented group label
  n1pairs: string[]; //    [Fast pair, Slow pair]
  n1seenLabel: string; //  green arc caption
  n1unseenLabel: string; //red arrow caption
  n1okLabel: string; //    "in training"
  n1trainWord: string; //  "trained to 4k"

  // Node 2 — the fix (frequency scaling on the same dial)
  n2scaleLabel: string; // slider "SCALE FACTOR"
  n2rawLabel: string; //   ghost arrow "raw position"
  n2fixLabel: string; //   live arrow "after ÷ s"
  n2reachWord: string; //  "reach"
  n2targetWord: string; // "target"
  n2inLabel: string; //    "back in the seen zone"
  n2outLabel: string; //   "still outside"

  // Node 3 — the methods
  n3ctxLabel: string; //   slider "TARGET CONTEXT"
  n3methods: string[]; //  [Linear, NTK-aware, YaRN]
  n3verdicts: string[]; // one line under each panel, index-aligned
  n3fast: string; //       strip axis left
  n3slow: string; //       strip axis right
  n3stretch: string; //    strip y-axis label
  n3full: string; //       dashed top line label

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

/* ============================================================ ENGLISH ======= */

export const longContextEN: LongContextLesson = {
  crumb: "STAGE 0 · 1.4 · LONG CONTEXT",
  eyebrow: "STAGE 0 · 1.4 · 3 NODES",
  title: "Long context: reading past what it trained on",
  lede: "A model is trained on a fixed window — maybe 4k tokens. Yet the same model can read 128k. It isn't retrained; its RoPE rotations are quietly rescaled so far-away positions land on angles it already understands. Here's the break, the fix, and the three ways labs do it.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Why it breaks", "Rescale the spin", "Linear vs NTK vs YaRN"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Why a longer prompt breaks it",
      intro: "RoPE turns each token's vector by an angle set by its position. Train only to 4k tokens and the model only ever sees a slice of those angles — go further and it rotates into territory it has never seen.",
      bullets: [
        "**Recap from RoPE:** each 2D *pair* of the vector spins by `m·θ`, where `m` is the position and `θ` is that pair's fixed turn rate.",
        "**Fast pairs spin all the way around during training** — the {ring} green ring is a *full* circle, so every angle is familiar. Push the position further and it just lands somewhere it's already been. No problem.",
        "**Slow pairs barely move** — over the whole 4k window they sweep only a thin green wedge. That wedge is *all* the model ever saw.",
        "**Past 4k, the slow pair's arrow leaves the wedge** into angles that never appeared in training. The model has no idea what they mean — attention gets noisy and the output degrades.",
      ],
      cardLabel: "ONE PAIR ON THE DIAL · SEEN vs UNSEEN",
      aria: "A rotation dial with a green arc marking angles seen in training and an arrow that leaves the arc when the position runs past the training length.",
      steps: 1,
      captions: ["Drag the position past 4k on the slow pair — the arrow leaves the green 'seen in training' wedge."],
      hint: "Switch to the Slow pair, then drag the position past 4k — the arrow turns red the moment it leaves the wedge.",
      readoutTitle: "POSITION_CHECK",
      rows: ["POSITION", "ANGLE", "STATUS"],
      readoutNote: "Where this pair's arrow points at the chosen position, and whether that angle falls inside the arc the model saw during training.",
      optionNotes: [
        "Fast pair — a big θ per step, so it wraps the full circle many times before 4k. Every angle is in-distribution, so extending the context doesn't faze it.",
        "Slow pair — a tiny θ per step. Over the whole 4k window it sweeps well under one turn, so most of the circle is unseen. This is the pair that breaks when you go long.",
      ],
      sliderNote: "Position m sets the raw angle m·θ. Below 4k you're inside the seen wedge; drag past it and the slow pair rotates into unseen angles.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Rescale the spin so far still fits",
      intro: "The fix needs no retraining. Divide the rotation frequency by a scale factor `s`, and position `m` now turns by `m·θ ⁄ s` — as if it sat at `m⁄s`. Far positions get pulled back into the wedge the model already knows.",
      bullets: [
        "**It's a relabel, not new learning.** Scaling by `s` makes the model read position `s·4k` the way it used to read `4k` — every angle stays inside the seen wedge.",
        "**Reach = `s · 4k`.** Want 128k from a 4k model? Use `s = 32`. Slide `s` and watch the red arrow get dragged back into the green.",
        "**Nothing is free.** Dividing *every* frequency also slows the fast pairs, so tokens sitting close together rotate less apart — nearby detail gets a little blurry.",
        "**A short fine-tune sharpens it back.** A few hundred steps at the new length lets the model settle into the rescaled angles.",
      ],
      cardLabel: "SAME DIAL · RAW vs RESCALED",
      aria: "The same rotation dial: a red arrow for the raw far position outside the seen wedge, and a green rescaled arrow pulled back inside it as the scale factor rises.",
      steps: 1,
      captions: ["Raise the scale factor — the far position's arrow slides from the red 'unseen' zone back into the green wedge."],
      hint: "Drag the scale factor up — the target position slots back inside the seen wedge once the reach passes it.",
      readoutTitle: "RESCALE",
      rows: ["SCALE", "REACH", "STATUS"],
      readoutNote: "The scale factor you set, the context length it buys (s · 4k), and whether the fixed far target now lands inside the seen wedge.",
      sliderNote: "Scale factor s divides every rotation frequency. Reach grows to s·4k; the far target lands back in the seen zone once reach passes it.",
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Three ways to spread the stretch",
      intro: "Linear scaling squeezes every frequency the same, which is why it blurs nearby tokens. The better methods stretch the slow pairs hard and leave the fast pairs mostly alone. Each strip below shows how much a method rescales each pair, fast to slow.",
      bullets: [
        "**Linear (Position Interpolation)** — scale *everything* by `s`. Simplest, biggest reach, but the fast pairs get squashed, so local detail suffers. Usually needs fine-tuning.",
        "**NTK-aware** — scale the slow pairs a lot and the fast pairs barely at all. Nearby tokens stay crisp, and it often works with *no* fine-tuning at all.",
        "**YaRN** — the current default: leave the fast pairs untouched, fully scale the slow ones, ramp the band between, and nudge attention's sharpness. Best quality for the least fine-tuning.",
        "**Same goal every time:** keep far positions inside the seen angles *without* wrecking how the model tells close tokens apart.",
      ],
      cardLabel: "WHO GETS STRETCHED · FAST → SLOW PAIRS",
      aria: "Three panels, one per method, each a strip from fast pairs to slow pairs showing how much that method rescales each pair.",
      steps: 1,
      captions: ["Pick a method — the highlighted strip shows how much it stretches each pair, from fast on the left to slow on the right."],
      hint: "Tap Linear, NTK-aware and YaRN — watch which pairs each one leaves untouched (flat at the bottom) versus fully stretches (up to the dashed line).",
      readoutTitle: "TARGET",
      rows: ["FROM", "TO", "SCALE"],
      readoutNote: "The stretch you're asking for: the trained window, the target context, and the scale factor between them that every method has to cover.",
      optionNotes: [
        "Linear — a flat full-height strip: every pair, fast or slow, is scaled by the same s. Maximum reach, but the fast pairs pay for it in blurred local detail.",
        "NTK-aware — a ramp: fast pairs (left) stay near the floor, slow pairs (right) rise to full scaling. Keeps nearby tokens sharp, often with no fine-tuning.",
        "YaRN — three bands: fast pairs untouched, a ramped middle, slow pairs fully scaled — plus a small attention-temperature tweak. The best-quality default.",
      ],
    },
  ],
  n1posLabel: "TOKEN POSITION m",
  n1pairLabel: "WHICH PAIR",
  n1pairs: ["Fast pair", "Slow pair"],
  n1seenLabel: "seen in training",
  n1unseenLabel: "never seen",
  n1okLabel: "in training",
  n1trainWord: "trained to 4k",
  n2scaleLabel: "SCALE FACTOR ×s",
  n2rawLabel: "raw position",
  n2fixLabel: "after ÷ s",
  n2reachWord: "reach",
  n2targetWord: "target",
  n2inLabel: "back in the seen zone",
  n2outLabel: "still unseen",
  n3ctxLabel: "TARGET CONTEXT",
  n3methods: ["Linear", "NTK-aware", "YaRN"],
  n3verdicts: [
    "Full reach · blurs nearby tokens · needs fine-tuning",
    "Keeps nearby detail · often no fine-tuning",
    "Best quality · the current default",
  ],
  n3fast: "fast pairs",
  n3slow: "slow pairs",
  n3stretch: "stretched",
  n3full: "fully ÷ s",
  deeperTitle: "Go deeper: the exact rescaling each method uses",
  deeperBody:
    "Each RoPE pair i has frequency `θ_i = base^(−2i/d)` (base 10000). Over a training length `L` it completes `L·θ_i ⁄ 2π` turns — many for small i (fast), a fraction of one for large i (slow). To extend to `L′ = s·L`: **Linear / Position Interpolation** divides every frequency, `θ_i → θ_i ⁄ s`, equivalently feeding position `m⁄s` — uniform, so high-frequency (fast) pairs lose resolution. **NTK-aware** instead scales the *base*, `base → base · s^(d ⁄ (d−2))`, which leaves the fastest pairs almost untouched and interpolates the slow ones, so it often extends context with no fine-tuning. **YaRN** decides per pair by wavelength: pairs whose wavelength is far shorter than `L` (fast) are left to extrapolate, pairs whose wavelength exceeds `L` (slow) are fully interpolated like linear, and a middle band is ramped between them — then it scales the attention logits by a temperature `1⁄√t` (with `t` a function of `s`) to counter the softmax spreading out over more tokens. That combination is why YaRN reaches long context at the lowest fine-tuning cost.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A model trained to 4k reads a 100k-token prompt fine after linear scaling — but its answers on tightly-worded, nearby text got slightly worse. Why?",
  explainA: "Because linear scaling divides *every* RoPE frequency by the same factor `s`, including the fast pairs that tell neighbouring tokens apart. Those fast pairs now rotate less between adjacent positions, so two tokens sitting side by side look more alike than they used to — the model loses a little of its fine, local resolution. The far positions were the whole point: dividing the frequencies pulls their angles back inside the arc the model saw in training, so long-range reading works. The trade is reach for sharpness. NTK-aware and YaRN exist precisely to avoid it: they stretch the slow pairs (which set long-range position) hard while leaving the fast pairs (which set local detail) nearly untouched — so you keep the reach without blurring what's close.",
  bridgeLabel: "NEXT: FLASH ATTENTION",
  bridgeBody: "You can now feed the model 128k tokens — but attention compares every token with every other, and at 128k that's about seventeen billion pairs. Next, **flash attention**: the trick that computes all of it without ever storing that giant grid, so long context is actually affordable to run.",
  prevLesson: "Back: RoPE, the math",
  nextLesson: "Continue to flash attention",
};

/* ============================================================ SPANISH ======= */

export const longContextES: LongContextLesson = {
  crumb: "ETAPA 0 · 1.4 · CONTEXTO LARGO",
  eyebrow: "ETAPA 0 · 1.4 · 3 NODOS",
  title: "Contexto largo: leer más allá de lo entrenado",
  lede: "Un modelo se entrena con una ventana fija — quizá 4k tokens. Y aun así el mismo modelo puede leer 128k. No se reentrena; sus rotaciones de RoPE se reescalan en silencio para que las posiciones lejanas caigan en ángulos que ya entiende. Aquí está la ruptura, el arreglo y las tres formas en que lo hacen los laboratorios.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Por qué se rompe", "Reescalar el giro", "Linear vs NTK vs YaRN"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Por qué un prompt más largo lo rompe",
      intro: "RoPE gira el vector de cada token un ángulo que marca su posición. Entrena solo hasta 4k tokens y el modelo solo ve una porción de esos ángulos — ve más lejos y gira hacia territorio que nunca vio.",
      bullets: [
        "**Repaso de RoPE:** cada *par* 2D del vector gira `m·θ`, donde `m` es la posición y `θ` es la velocidad de giro fija de ese par.",
        "**Los pares rápidos dan la vuelta entera durante el entrenamiento** — el anillo verde {ring} es un círculo *completo*, así que todo ángulo es familiar. Empuja la posición más lejos y solo cae donde ya estuvo. Sin problema.",
        "**Los pares lentos apenas se mueven** — en toda la ventana de 4k barren solo una cuña verde delgada. Esa cuña es *todo* lo que el modelo vio.",
        "**Pasado 4k, la flecha del par lento sale de la cuña** hacia ángulos que nunca aparecieron en el entrenamiento. El modelo no sabe qué significan — la atención se vuelve ruidosa y la salida se degrada.",
      ],
      cardLabel: "UN PAR EN EL DIAL · VISTO vs NO VISTO",
      aria: "Un dial de rotación con un arco verde que marca los ángulos vistos en el entrenamiento y una flecha que sale del arco cuando la posición pasa la longitud de entrenamiento.",
      steps: 1,
      captions: ["Arrastra la posición más allá de 4k en el par lento — la flecha sale de la cuña verde 'visto en entrenamiento'."],
      hint: "Cambia al par Lento y luego arrastra la posición pasado 4k — la flecha se pone roja apenas sale de la cuña.",
      readoutTitle: "POSITION_CHECK",
      rows: ["POSICIÓN", "ÁNGULO", "ESTADO"],
      readoutNote: "Hacia dónde apunta la flecha de este par en la posición elegida, y si ese ángulo cae dentro del arco que el modelo vio durante el entrenamiento.",
      optionNotes: [
        "Par rápido — un θ grande por paso, así que da la vuelta entera muchas veces antes de 4k. Todo ángulo está en distribución, así que extender el contexto no lo afecta.",
        "Par lento — un θ diminuto por paso. En toda la ventana de 4k barre bastante menos de una vuelta, así que casi todo el círculo queda sin ver. Este es el par que se rompe al ir largo.",
      ],
      sliderNote: "La posición m fija el ángulo crudo m·θ. Bajo 4k estás dentro de la cuña vista; arrastra más allá y el par lento gira hacia ángulos no vistos.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Reescalar el giro para que lo lejano quepa",
      intro: "El arreglo no necesita reentrenar. Divide la frecuencia de rotación por un factor de escala `s`, y la posición `m` ahora gira `m·θ ⁄ s` — como si estuviera en `m⁄s`. Las posiciones lejanas se jalan de vuelta a la cuña que el modelo ya conoce.",
      bullets: [
        "**Es un reetiquetado, no aprendizaje nuevo.** Escalar por `s` hace que el modelo lea la posición `s·4k` como antes leía `4k` — todo ángulo queda dentro de la cuña vista.",
        "**Alcance = `s · 4k`.** ¿Quieres 128k de un modelo de 4k? Usa `s = 32`. Desliza `s` y mira la flecha roja jalarse de vuelta al verde.",
        "**Nada es gratis.** Dividir *cada* frecuencia también frena los pares rápidos, así que los tokens cercanos giran menos entre sí — el detalle local se ve algo borroso.",
        "**Un ajuste fino corto lo devuelve al filo.** Unos cientos de pasos en la nueva longitud dejan al modelo asentarse en los ángulos reescalados.",
      ],
      cardLabel: "EL MISMO DIAL · CRUDO vs REESCALADO",
      aria: "El mismo dial de rotación: una flecha roja para la posición lejana cruda fuera de la cuña vista, y una flecha verde reescalada jalada de vuelta adentro al subir el factor de escala.",
      steps: 1,
      captions: ["Sube el factor de escala — la flecha de la posición lejana pasa de la zona roja 'no vista' de vuelta a la cuña verde."],
      hint: "Arrastra el factor de escala hacia arriba — la posición objetivo vuelve a entrar en la cuña vista cuando el alcance la supera.",
      readoutTitle: "RESCALE",
      rows: ["ESCALA", "ALCANCE", "ESTADO"],
      readoutNote: "El factor de escala que fijas, la longitud de contexto que compra (s · 4k), y si el objetivo lejano fijo ahora cae dentro de la cuña vista.",
      sliderNote: "El factor de escala s divide cada frecuencia de rotación. El alcance crece a s·4k; el objetivo lejano vuelve a la zona vista cuando el alcance lo supera.",
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Tres formas de repartir el estirón",
      intro: "El escalado lineal comprime cada frecuencia por igual, y por eso emborrona los tokens cercanos. Los mejores métodos estiran mucho los pares lentos y dejan casi intactos los rápidos. Cada tira de abajo muestra cuánto reescala un método cada par, de rápido a lento.",
      bullets: [
        "**Lineal (Interpolación de Posición)** — escala *todo* por `s`. El más simple, mayor alcance, pero los pares rápidos se aplastan, así que el detalle local sufre. Suele necesitar ajuste fino.",
        "**NTK-aware** — escala mucho los pares lentos y casi nada los rápidos. Los tokens cercanos quedan nítidos, y a menudo funciona *sin* ajuste fino.",
        "**YaRN** — el estándar actual: deja intactos los pares rápidos, escala del todo los lentos, hace una rampa en la banda intermedia y ajusta la nitidez de la atención. La mejor calidad con el menor ajuste fino.",
        "**El mismo objetivo siempre:** mantener las posiciones lejanas dentro de los ángulos vistos *sin* arruinar cómo el modelo distingue los tokens cercanos.",
      ],
      cardLabel: "A QUIÉN SE ESTIRA · PARES RÁPIDOS → LENTOS",
      aria: "Tres paneles, uno por método, cada uno una tira de pares rápidos a lentos que muestra cuánto reescala ese método cada par.",
      steps: 1,
      captions: ["Elige un método — la tira resaltada muestra cuánto estira cada par, de rápido a la izquierda a lento a la derecha."],
      hint: "Toca Linear, NTK-aware y YaRN — mira qué pares deja intactos cada uno (planos abajo) frente a los que estira del todo (hasta la línea punteada).",
      readoutTitle: "TARGET",
      rows: ["DESDE", "HASTA", "ESCALA"],
      readoutNote: "El estirón que pides: la ventana entrenada, el contexto objetivo y el factor de escala entre ambos que todo método debe cubrir.",
      optionNotes: [
        "Lineal — una tira plana a altura completa: cada par, rápido o lento, se escala por el mismo s. Alcance máximo, pero los pares rápidos lo pagan con detalle local borroso.",
        "NTK-aware — una rampa: los pares rápidos (izquierda) quedan cerca del piso, los lentos (derecha) suben a escala completa. Mantiene nítidos los tokens cercanos, a menudo sin ajuste fino.",
        "YaRN — tres bandas: pares rápidos intactos, un medio en rampa, pares lentos escalados del todo — más un pequeño ajuste de temperatura de atención. El estándar de mejor calidad.",
      ],
    },
  ],
  n1posLabel: "POSICIÓN DEL TOKEN m",
  n1pairLabel: "QUÉ PAR",
  n1pairs: ["Par rápido", "Par lento"],
  n1seenLabel: "visto en entrenamiento",
  n1unseenLabel: "nunca visto",
  n1okLabel: "en entrenamiento",
  n1trainWord: "entrenado a 4k",
  n2scaleLabel: "FACTOR DE ESCALA ×s",
  n2rawLabel: "posición cruda",
  n2fixLabel: "tras ÷ s",
  n2reachWord: "alcance",
  n2targetWord: "objetivo",
  n2inLabel: "de vuelta en la zona vista",
  n2outLabel: "aún no visto",
  n3ctxLabel: "CONTEXTO OBJETIVO",
  n3methods: ["Linear", "NTK-aware", "YaRN"],
  n3verdicts: [
    "Alcance total · emborrona tokens cercanos · necesita ajuste fino",
    "Mantiene el detalle cercano · a menudo sin ajuste fino",
    "Mejor calidad · el estándar actual",
  ],
  n3fast: "pares rápidos",
  n3slow: "pares lentos",
  n3stretch: "estirado",
  n3full: "del todo ÷ s",
  deeperTitle: "Más a fondo: el reescalado exacto de cada método",
  deeperBody:
    "Cada par i de RoPE tiene frecuencia `θ_i = base^(−2i/d)` (base 10000). En una longitud de entrenamiento `L` completa `L·θ_i ⁄ 2π` vueltas — muchas para i pequeño (rápido), una fracción de una para i grande (lento). Para extender a `L′ = s·L`: **Lineal / Interpolación de Posición** divide cada frecuencia, `θ_i → θ_i ⁄ s`, equivalente a alimentar la posición `m⁄s` — uniforme, así que los pares de alta frecuencia (rápidos) pierden resolución. **NTK-aware** en su lugar escala la *base*, `base → base · s^(d ⁄ (d−2))`, lo que deja casi intactos los pares más rápidos e interpola los lentos, así que a menudo extiende el contexto sin ajuste fino. **YaRN** decide por par según la longitud de onda: los pares cuya longitud de onda es mucho más corta que `L` (rápidos) se dejan extrapolar, los pares cuya longitud de onda supera `L` (lentos) se interpolan del todo como en lineal, y una banda intermedia se hace en rampa — luego escala los logits de atención por una temperatura `1⁄√t` (con `t` función de `s`) para contrarrestar que el softmax se reparta sobre más tokens. Esa combinación es por qué YaRN alcanza contexto largo con el menor costo de ajuste fino.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo entrenado a 4k lee bien un prompt de 100k tokens tras el escalado lineal — pero sus respuestas sobre texto cercano y muy preciso empeoraron un poco. ¿Por qué?",
  explainA: "Porque el escalado lineal divide *cada* frecuencia de RoPE por el mismo factor `s`, incluidos los pares rápidos que distinguen tokens vecinos. Esos pares rápidos ahora giran menos entre posiciones adyacentes, así que dos tokens uno al lado del otro se parecen más que antes — el modelo pierde algo de su resolución local fina. Las posiciones lejanas eran el objetivo: dividir las frecuencias jala sus ángulos de vuelta al arco que el modelo vio en el entrenamiento, así que la lectura de largo alcance funciona. El canje es alcance por nitidez. NTK-aware y YaRN existen justo para evitarlo: estiran mucho los pares lentos (que fijan la posición de largo alcance) mientras dejan casi intactos los rápidos (que fijan el detalle local) — así conservas el alcance sin emborronar lo cercano.",
  bridgeLabel: "SIGUIENTE: FLASH ATTENTION",
  bridgeBody: "Ya puedes darle al modelo 128k tokens — pero la atención compara cada token con todos los demás, y a 128k eso son unos diecisiete mil millones de pares. Sigue **flash attention**: el truco que lo calcula todo sin nunca guardar esa cuadrícula gigante, para que el contexto largo sea de verdad costeable de ejecutar.",
  prevLesson: "Atrás: RoPE, la matemática",
  nextLesson: "Continuar a flash attention",
};
