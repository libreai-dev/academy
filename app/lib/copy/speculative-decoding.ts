/**
 * Stage 0 · Expert — Speculative decoding. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: a small fast DRAFT model guesses several next tokens, and the big
 * model VERIFIES them all in one pass — accepting the correct prefix — so you
 * get the big model's exact output with far fewer of its slow steps. Builds on
 * the KV-cache lesson (why decode is one-token-at-a-time and memory-bound).
 */
import type { WsNodeCopy } from "./shared";

export interface SpeculativeDecodingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — the bottleneck (memory-bound decode)
  n1slider: string; //        "POSITIONS PER PASS"
  n1passLabel: string; //     "ONE BIG-MODEL PASS"
  n1memLabel: string; //      "MEMORY · load all weights"
  n1computeLabel: string; //  "COMPUTE · the math"
  n1producesLabel: string; // "PRODUCES"
  n1perTokenLabel: string; // "per-token time"
  n1tokWord: string; //       "tok"

  // Node 2 — draft & verify (the centrepiece)
  n2spec: string; //          "SPECULATION"
  n2kSlider: string; //       "DRAFT LENGTH  k"
  n2aSlider: string; //       "ACCEPT RATE"
  n2draftLabel: string; //    "DRAFT · small model guesses k"
  n2acceptWord: string; //    "accepted"
  n2rejectWord: string; //    "rejected"
  n2bonusLabel: string; //    "big model's token"
  n2meterLabel: string; //    "BIG-MODEL PASSES FOR 100 TOKENS"
  n2plainBar: string; //      "plain decode"
  n2specBar: string; //       "speculative"
  n2draftTokens: string[]; // k illustrative guessed tokens
  n2offNote: string; //       shown when speculation is off
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 — self-drafting heads (Medusa / Eagle)
  n3opts: string[]; //        [Separate draft model, Self-drafting heads]
  n3bigLabel: string; //      "BIG MODEL"
  n3draftLabel: string; //    "DRAFT MODEL"
  n3headLabel: string; //     "head"
  n3guessLabel: string; //    "guesses"
  n3verifyLabel: string; //   "verify"
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;

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

export const speculativeDecodingEN: SpeculativeDecodingLesson = {
  crumb: "STAGE 0 · EXPERT · SPECULATIVE DECODING",
  eyebrow: "STAGE 0 · EXPERT · 3 NODES",
  title: "Speculative decoding",
  lede: "A big model writes one token per slow step. Speculative decoding lets a small model guess ahead, then the big model checks all the guesses in a single pass — same output, far fewer slow steps. Play with the guessing and watch the speed-up.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Why decode is slow", "Draft & verify", "Drafting with heads"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Why one token at a time is slow",
      intro: "From the KV-cache lesson you know decode runs one token per forward pass. Here's the twist that makes it slow — and the exact gap speculative decoding exploits.",
      bullets: [
        "**Each pass reloads the whole model.** To produce one token, the GPU streams every weight — ~140 GB for a 70B model — from memory. That read is the wall.",
        "**Decode is *memory-bound*, not compute-bound.** The math finishes in a blink; the GPU then sits ~97% idle, waiting on memory. The bar below shows it.",
        "**So a pass that scores 5 positions costs almost the same as one that scores 1** — you already paid to load the weights. Plain decode wastes this: it only ever asks for one.",
        "**That idle headroom is the whole opportunity.** If you had a few *guesses* to check, one pass could confirm them all for nearly free.",
      ],
      cardLabel: "ONE PASS · MEMORY vs COMPUTE",
      aria: "One big-model pass: a long memory-load bar, a tiny compute bar, and the tokens it produces.",
      steps: 1,
      captions: ["One pass loads all the weights once — then can score several positions for almost the same time."],
      hint: "Slide positions-per-pass 1 → 8. The memory cost holds flat; the per-token time collapses.",
      readoutTitle: "PASS_COST",
      rows: ["WEIGHTS/PASS", "PASS TIME", "TOKENS/PASS", "PER-TOKEN"],
      readoutNote: "Illustrative, ~70B model on one accelerator. The pass time barely moves as you score more positions, because loading the weights dominates.",
      sliderNote: "Positions scored in a single pass. Loading the 140 GB of weights costs ~42 ms no matter what — so scoring more positions makes each token cheaper.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Draft a few, verify in one pass",
      intro: "A small, fast *draft* model guesses the next few tokens. The big model then reads all of them at once and keeps the longest run it agrees with — so most tokens skip the slow model entirely.",
      bullets: [
        "**Draft:** the small model proposes `k` tokens, cheaply and quickly.",
        "**Verify:** the big model scores all `k` in one pass and accepts the correct prefix; the first wrong guess is dropped, and the big model always supplies one correct token itself.",
        "**Accept rate** is how often the draft agrees with the big model. Higher acceptance and longer drafts mean more tokens per slow pass.",
        "**The output is identical to running the big model alone** — verification is a check, not a shortcut on quality. You only ever save time.",
      ],
      cardLabel: "DRAFT → VERIFY → ACCEPT PREFIX",
      aria: "A row of drafted tokens with an accepted green prefix, a rejected guess, and one token from the big model, above a speed-up meter.",
      steps: 1,
      captions: ["The small model guesses ahead; the big model keeps the prefix it agrees with, plus one guaranteed token."],
      hint: "Turn speculation on, then push draft length and accept rate up — watch tokens-per-pass and the speed-up climb.",
      readoutTitle: "THROUGHPUT",
      rows: ["TOKENS/VERIFY", "PASSES/100 TOK", "SPEED-UP"],
      readoutNote: "Per big-model verification: expected tokens accepted, big-model passes to reach 100 tokens, and the resulting wall-clock speed-up.",
      optionNotes: [
        "Speculation ON — the small model drafts and the big model verifies. Fewer big-model passes for the same text.",
        "Speculation OFF — plain decode. One big-model pass per token: the baseline you're speeding up.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Skip the second model: draft with heads",
      intro: "Running a separate draft model works, but it's a second model to host and keep aligned. Medusa and EAGLE fold the drafting into the big model itself.",
      bullets: [
        "**Separate draft model** — a small standalone model guesses; simple, but it's extra weights to load and its outputs must track the big model to keep acceptance high.",
        "**Bolt-on heads (Medusa / EAGLE)** — a few tiny prediction *heads* sit on top of the big model and each guess a future token straight from its own hidden state. No second model to serve.",
        "**Heads are cheap and well-aligned** — trained on the base model's own signals, so their guesses land more often, lifting the accept rate for free.",
        "**Same verify step as Node 2.** However the guesses are produced, the big model still checks them in one pass, so the output stays identical.",
      ],
      cardLabel: "SEPARATE MODEL vs BOLT-ON HEADS",
      aria: "Two architectures side by side: a separate draft model feeding the big model, versus prediction heads attached to the big model.",
      steps: 1,
      captions: ["Two ways to make the guesses — a standalone draft model, or lightweight heads on the big model itself."],
      hint: "Switch the two — the drafting source changes, but the big model's one-pass verify is the same either way.",
      readoutTitle: "DRAFT_SOURCE",
      rows: ["SOURCE", "EXTRA MODEL", "ALIGNMENT"],
      optionNotes: [
        "Separate draft model — a small independent model. Easy to drop in, but it's extra weights in memory, and it drifts from the big model unless carefully matched.",
        "Self-drafting heads — a handful of small heads on the big model (Medusa, EAGLE). Nothing extra to host, and because they read the base model's hidden state, their guesses agree more often.",
      ],
    },
  ],

  n1slider: "POSITIONS PER PASS",
  n1passLabel: "ONE BIG-MODEL PASS",
  n1memLabel: "MEMORY · load all weights",
  n1computeLabel: "COMPUTE · the math",
  n1producesLabel: "PRODUCES",
  n1perTokenLabel: "per-token time",
  n1tokWord: "tok",

  n2spec: "SPECULATION",
  n2kSlider: "DRAFT LENGTH  k",
  n2aSlider: "ACCEPT RATE",
  n2draftLabel: "DRAFT · small model guesses k",
  n2acceptWord: "accepted",
  n2rejectWord: "rejected",
  n2bonusLabel: "big model",
  n2meterLabel: "BIG-MODEL PASSES FOR 100 TOKENS",
  n2plainBar: "plain decode",
  n2specBar: "speculative",
  n2draftTokens: ["The", " quick", " brown", " fox", " jumps", " over", " the", " dog"],
  n2offNote: "Speculation is off — one big-model pass per token, no speed-up. Turn it on to draft ahead.",
  n2deeperTitle: "The math: expected tokens per pass",
  n2deeperBody:
    "With acceptance probability α (alpha, how often a guess is right) and a draft of k tokens, the expected number of tokens accepted per big-model pass is (1 − α^(k+1)) / (1 − α). The +1 in the exponent is the bonus token the big model always contributes, even when every guess is rejected — so you never go backwards. Wall-clock speed-up divides that by the cost of a cycle: one big pass plus k cheap draft passes. Verification uses the big model's own probabilities to accept or resample, which is why the final text matches the big model exactly.",

  n3opts: ["Separate draft model", "Self-drafting heads"],
  n3bigLabel: "BIG MODEL",
  n3draftLabel: "DRAFT MODEL",
  n3headLabel: "head",
  n3guessLabel: "guesses",
  n3verifyLabel: "verify",
  calloutLabel: "GOOD TO KNOW · MEDUSA & EAGLE",
  calloutTitle: "Drafting heads, in one line",
  calloutBody:
    "Medusa adds a few extra output heads that each predict one more token ahead; EAGLE reuses the model's own features to draft even more accurately. Both avoid shipping a second model, and both hand their guesses to the same one-pass verification — so the answer is unchanged, just faster.",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Speculative decoding runs an extra draft model on every step. Why is it faster, not slower?",
  explainA: "Because big-model decode is **memory-bound**: every pass reloads all the weights and the GPU's math units sit mostly idle. Verifying `k` guesses in one pass costs almost the same as generating a single token — that idle headroom is free. Each pass then emits the whole accepted prefix plus one guaranteed token, so several tokens skip the slow model. The draft model is small and cheap; the big-model passes it saves dwarf its cost. And because verification uses the big model's own probabilities to accept or correct each guess, the final text is **identical** to the big model running alone — you pay only in speed.",
  bridgeLabel: "END OF STAGE 0 · YOU BUILT AN LLM",
  bridgeBody: "That's the last stop in **Stage 0**. You've followed an LLM from raw web text through training to a served, sped-up model. Head back to the roadmap to pick where you go next.",
  prevLesson: "Back: quantization",
  nextLesson: "Back to the roadmap",
};

/* ============================================================ SPANISH ======= */

export const speculativeDecodingES: SpeculativeDecodingLesson = {
  crumb: "ETAPA 0 · EXPERTO · DECODIFICACIÓN ESPECULATIVA",
  eyebrow: "ETAPA 0 · EXPERTO · 3 NODOS",
  title: "Decodificación especulativa",
  lede: "Un modelo grande escribe un token por paso lento. La decodificación especulativa deja que un modelo pequeño adivine por adelantado, y luego el grande revisa todas las conjeturas en una sola pasada — misma salida, muchos menos pasos lentos. Juega con las conjeturas y mira la aceleración.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Por qué decodificar es lento", "Esbozar y verificar", "Esbozar con cabezas"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Por qué un token a la vez es lento",
      intro: "Por la lección de la caché KV ya sabes que la decodificación produce un token por pasada. Aquí está el detalle que la hace lenta — y el hueco exacto que aprovecha la decodificación especulativa.",
      bullets: [
        "**Cada pasada recarga todo el modelo.** Para producir un token, la GPU transmite todos los pesos — ~140 GB en un modelo de 70B — desde la memoria. Esa lectura es el muro.",
        "**Decodificar está *limitado por memoria*, no por cómputo.** La matemática termina en un parpadeo; luego la GPU queda ~97% inactiva, esperando a la memoria. La barra de abajo lo muestra.",
        "**Así que una pasada que puntúa 5 posiciones cuesta casi lo mismo que una que puntúa 1** — ya pagaste por cargar los pesos. La decodificación simple lo desperdicia: solo pide una.",
        "**Ese margen inactivo es toda la oportunidad.** Si tuvieras unas cuantas *conjeturas* que revisar, una pasada las confirmaría todas casi gratis.",
      ],
      cardLabel: "UNA PASADA · MEMORIA vs CÓMPUTO",
      aria: "Una pasada del modelo grande: una barra larga de carga de memoria, una barra diminuta de cómputo y los tokens que produce.",
      steps: 1,
      captions: ["Una pasada carga todos los pesos una vez — y luego puede puntuar varias posiciones por casi el mismo tiempo."],
      hint: "Desliza posiciones por pasada 1 → 8. El costo de memoria se mantiene plano; el tiempo por token se desploma.",
      readoutTitle: "PASS_COST",
      rows: ["PESOS/PASADA", "TIEMPO PASADA", "TOKENS/PASADA", "POR TOKEN"],
      readoutNote: "Ilustrativo, modelo ~70B en un acelerador. El tiempo de pasada casi no cambia al puntuar más posiciones, porque cargar los pesos domina.",
      sliderNote: "Posiciones puntuadas en una sola pasada. Cargar los 140 GB de pesos cuesta ~42 ms pase lo que pase — así que puntuar más posiciones abarata cada token.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Esboza unos pocos, verifica en una pasada",
      intro: "Un modelo *borrador* pequeño y rápido adivina los próximos tokens. El modelo grande los lee todos de una vez y conserva la racha más larga con la que está de acuerdo — así casi todos los tokens se saltan por completo el modelo lento.",
      bullets: [
        "**Borrador:** el modelo pequeño propone `k` tokens, barato y rápido.",
        "**Verificar:** el modelo grande puntúa los `k` en una pasada y acepta el prefijo correcto; la primera conjetura errónea se descarta, y el modelo grande siempre aporta un token correcto propio.",
        "**La tasa de aceptación** es qué tan seguido el borrador coincide con el modelo grande. Más aceptación y borradores más largos = más tokens por pasada lenta.",
        "**La salida es idéntica a ejecutar el modelo grande solo** — la verificación es un control, no un atajo en calidad. Solo ahorras tiempo.",
      ],
      cardLabel: "ESBOZAR → VERIFICAR → ACEPTAR PREFIJO",
      aria: "Una fila de tokens borrador con un prefijo verde aceptado, una conjetura rechazada y un token del modelo grande, sobre un medidor de aceleración.",
      steps: 1,
      captions: ["El modelo pequeño adivina por adelantado; el grande conserva el prefijo con el que coincide, más un token garantizado."],
      hint: "Enciende la especulación, luego sube la longitud del borrador y la aceptación — mira crecer los tokens por pasada y la aceleración.",
      readoutTitle: "THROUGHPUT",
      rows: ["TOKENS/VERIF.", "PASADAS/100 TOK", "ACELERACIÓN"],
      readoutNote: "Por verificación del modelo grande: tokens esperados aceptados, pasadas del modelo grande para llegar a 100 tokens y la aceleración de reloj resultante.",
      optionNotes: [
        "Especulación ENCENDIDA — el modelo pequeño esboza y el grande verifica. Menos pasadas del modelo grande para el mismo texto.",
        "Especulación APAGADA — decodificación simple. Una pasada del modelo grande por token: la base que estás acelerando.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Sáltate el segundo modelo: esboza con cabezas",
      intro: "Ejecutar un modelo borrador aparte funciona, pero es un segundo modelo que hospedar y mantener alineado. Medusa y EAGLE integran el esbozo en el propio modelo grande.",
      bullets: [
        "**Modelo borrador aparte** — un modelo pequeño independiente adivina; simple, pero son pesos extra que cargar y su salida debe seguir al modelo grande para mantener alta la aceptación.",
        "**Cabezas integradas (Medusa / EAGLE)** — unas pocas *cabezas* de predicción diminutas se colocan sobre el modelo grande y cada una adivina un token futuro directo desde su propio estado oculto. Sin segundo modelo que servir.",
        "**Las cabezas son baratas y bien alineadas** — entrenadas con las señales del propio modelo base, así sus conjeturas aciertan más seguido, subiendo la aceptación gratis.",
        "**Mismo paso de verificación que el Nodo 2.** Sin importar cómo se produzcan las conjeturas, el modelo grande las revisa en una pasada, así que la salida sigue idéntica.",
      ],
      cardLabel: "MODELO APARTE vs CABEZAS INTEGRADAS",
      aria: "Dos arquitecturas lado a lado: un modelo borrador aparte alimentando al modelo grande, frente a cabezas de predicción adjuntas al modelo grande.",
      steps: 1,
      captions: ["Dos formas de hacer las conjeturas — un modelo borrador independiente, o cabezas ligeras sobre el propio modelo grande."],
      hint: "Alterna las dos — la fuente del esbozo cambia, pero la verificación en una pasada del modelo grande es igual en ambas.",
      readoutTitle: "DRAFT_SOURCE",
      rows: ["FUENTE", "MODELO EXTRA", "ALINEACIÓN"],
      optionNotes: [
        "Modelo borrador aparte — un modelo pequeño independiente. Fácil de añadir, pero son pesos extra en memoria, y se desvía del modelo grande salvo que se ajuste con cuidado.",
        "Cabezas propias — un puñado de cabezas pequeñas sobre el modelo grande (Medusa, EAGLE). Nada extra que hospedar, y como leen el estado oculto del modelo base, sus conjeturas coinciden más seguido.",
      ],
    },
  ],

  n1slider: "POSICIONES POR PASADA",
  n1passLabel: "UNA PASADA DEL MODELO GRANDE",
  n1memLabel: "MEMORIA · cargar todos los pesos",
  n1computeLabel: "CÓMPUTO · la matemática",
  n1producesLabel: "PRODUCE",
  n1perTokenLabel: "tiempo por token",
  n1tokWord: "tok",

  n2spec: "ESPECULACIÓN",
  n2kSlider: "LONGITUD BORRADOR  k",
  n2aSlider: "ACEPTACIÓN",
  n2draftLabel: "BORRADOR · el modelo pequeño adivina k",
  n2acceptWord: "aceptados",
  n2rejectWord: "rechazado",
  n2bonusLabel: "modelo grande",
  n2meterLabel: "PASADAS DEL MODELO GRANDE PARA 100 TOKENS",
  n2plainBar: "decodificación simple",
  n2specBar: "especulativa",
  n2draftTokens: ["El", " veloz", " zorro", " marrón", " salta", " sobre", " el", " perro"],
  n2offNote: "La especulación está apagada — una pasada del modelo grande por token, sin aceleración. Enciéndela para esbozar por adelantado.",
  n2deeperTitle: "La matemática: tokens esperados por pasada",
  n2deeperBody:
    "Con probabilidad de aceptación α (alfa, qué tan seguido acierta una conjetura) y un borrador de k tokens, el número esperado de tokens aceptados por pasada del modelo grande es (1 − α^(k+1)) / (1 − α). El +1 del exponente es el token de regalo que el modelo grande siempre aporta, aun cuando se rechacen todas las conjeturas — así nunca retrocedes. La aceleración de reloj divide eso por el costo de un ciclo: una pasada grande más k pasadas de borrador baratas. La verificación usa las propias probabilidades del modelo grande para aceptar o remuestrear, por eso el texto final coincide exactamente con el modelo grande.",

  n3opts: ["Modelo borrador aparte", "Cabezas propias"],
  n3bigLabel: "MODELO GRANDE",
  n3draftLabel: "MODELO BORRADOR",
  n3headLabel: "cabeza",
  n3guessLabel: "conjeturas",
  n3verifyLabel: "verifica",
  calloutLabel: "PARA SABER · MEDUSA Y EAGLE",
  calloutTitle: "Cabezas de esbozo, en una línea",
  calloutBody:
    "Medusa añade unas cabezas de salida extra que predicen cada una un token más por adelantado; EAGLE reutiliza las propias características del modelo para esbozar con más precisión. Ambas evitan enviar un segundo modelo, y ambas entregan sus conjeturas a la misma verificación en una pasada — así la respuesta no cambia, solo va más rápido.",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "La decodificación especulativa ejecuta un modelo borrador extra en cada paso. ¿Por qué es más rápida, no más lenta?",
  explainA: "Porque decodificar con el modelo grande está **limitado por memoria**: cada pasada recarga todos los pesos y las unidades de cómputo de la GPU quedan casi inactivas. Verificar `k` conjeturas en una pasada cuesta casi lo mismo que generar un solo token — ese margen inactivo es gratis. Cada pasada emite entonces todo el prefijo aceptado más un token garantizado, así varios tokens se saltan el modelo lento. El modelo borrador es pequeño y barato; las pasadas del modelo grande que ahorra superan con creces su costo. Y como la verificación usa las propias probabilidades del modelo grande para aceptar o corregir cada conjetura, el texto final es **idéntico** al del modelo grande solo — solo pagas en velocidad.",
  bridgeLabel: "FIN DE LA ETAPA 0 · CONSTRUISTE UN LLM",
  bridgeBody: "Esa es la última parada de la **Etapa 0**. Seguiste a un LLM desde texto web crudo, pasando por el entrenamiento, hasta un modelo servido y acelerado. Vuelve a la ruta para elegir a dónde vas después.",
  prevLesson: "Atrás: cuantización",
  nextLesson: "Volver a la ruta",
};
