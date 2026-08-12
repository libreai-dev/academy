/**
 * Stage 0 · Expert — Constrained decoding. Interface + EN/ES copy, isolated
 * from every other lesson so edits here never touch theirs.
 *
 * One idea: to guarantee valid output (JSON, a grammar), the decoder masks out
 * any next-token that would break the structure — so only structurally valid
 * tokens can ever be chosen. Builds on Sampling strategies (softmax over logits
 * → pick one token); here we intervene on those logits BEFORE the pick.
 */
import type { WsNodeCopy } from "./shared";

export interface ConstrainedDecodingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — the problem
  n1modes: string[]; //     failure-mode button labels
  n1askLabel: string; //    "YOU ASKED FOR"
  n1ask: string; //         the request line
  n1invalid: string; //     "INVALID"
  n1parseLabel: string; //  "JSON.parse →"
  // Node 2 — logit masking
  n2moments: string[]; //   3 decode-moment button labels
  n2constraintLabel: string;
  n2on: string;
  n2off: string;
  n2maskedTag: string; //   "masked · p=0"
  n2chosenTag: string; //   "chosen"
  n2prefixLabel: string; // "OUTPUT SO FAR"
  n2validBadge: string; //  "still valid JSON"
  n2breakBadge: string; //  "breaks JSON"
  n2candLabel: string; //   "NEXT-TOKEN CANDIDATES"
  n2deeperTitle: string;
  n2deeperBody: string;
  // Node 3 — grammars
  n3positions: string[]; // 4 grammar-position button labels
  n3freeLabel: string; //   "FREE · allows"
  n3grammarLabel: string; //"JSON GRAMMAR · allows"
  n3refLabel: string; //    "the grammar — read-only"
  n3emittedLabel: string; //"SO FAR"
  n3anything: string; //    "…anything"
  // callout
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;
  // shared tail
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const constrainedDecodingEN: ConstrainedDecodingLesson = {
  crumb: "STAGE 0 · EXPERT · CONSTRAINED DECODING",
  eyebrow: "STAGE 0 · EXPERT · 3 NODES",
  title: "Constrained decoding",
  lede: "You need machine-readable JSON, every single time — but a language model only predicts likely next-tokens, and 'likely' isn't 'valid'. Constrained decoding closes the gap: at every step it forbids any token that would break the structure, so the output is valid by construction.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Why free sampling breaks", "Masking the bad tokens", "Grammars decide what's allowed"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Free sampling doesn't know the rules",
      intro: "In Sampling strategies you saw the model score every token and pick one it likes. Nothing in that loop knows what valid JSON is — so a fluent, confident model still hands you text a parser rejects.",
      bullets: [
        "**The model optimises for *plausible*, not *parseable*.** A markdown fence or a friendly 'Sure!' is very likely text — and instantly invalid JSON.",
        "**One wrong token poisons the whole string.** An unquoted key or a trailing comma makes `JSON.parse` throw on the entire response.",
        "**At scale this is expensive.** Even a 1% failure rate means retries, dropped records, and pipelines that wedge on the one bad row.",
        "**Prompt-begging doesn't guarantee it.** 'Reply with only JSON' lowers the failure rate; it can't make it zero.",
      ],
      cardLabel: "FOUR WAYS THE SAME REQUEST BREAKS",
      aria: "A broken JSON string with the offending part highlighted and the parser error beneath.",
      steps: 1,
      captions: ["Each button is a real way free decoding produces invalid JSON for the same request."],
      hint: "Tap through the failure modes — the red span is exactly where JSON.parse gives up.",
      readoutTitle: "PARSE_RESULT",
      rows: ["STATUS", "AT BYTE", "CAUSE"],
      optionNotes: [
        "Prose preamble — the model opens with 'Sure!' before the object. The very first character isn't JSON, so parsing fails at byte 0.",
        "Markdown fence — it wraps the object in ```json … ```. Great for humans, but the backticks aren't JSON.",
        "Unquoted key — `age` instead of `\"age\"`. JSON keys must be double-quoted strings; a bareword is rejected.",
        "Trailing comma — a comma after the last value. Legal in JavaScript, illegal in JSON.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Mask the tokens that would break it",
      intro: "The fix doesn't change the model — it edits the model's choices. At every decode step a validator lists which tokens keep the JSON well-formed, and masking sets the probability of every other token to zero.",
      bullets: [
        "**Masking = force `p = 0`.** Every invalid token's logit is set to −∞, so after softmax its probability is exactly zero — it can never be sampled.",
        "**The survivors renormalise.** The model still picks by its own preference among the valid tokens — masking removes options, it doesn't invent them.",
        "**Even a strong first choice gets vetoed.** When the top token is a fence or a trailing comma, masking simply passes it over for the best *valid* one.",
        "**Toggle the constraint** and watch the same candidates flip between 'breaks JSON' and 'valid by construction'.",
      ],
      cardLabel: "ONE DECODE STEP · MASK ON/OFF",
      aria: "Candidate next-tokens as probability bars; invalid ones greyed to zero when the constraint is on.",
      steps: 1,
      captions: ["Pick a moment and toggle the mask — invalid candidates drop to zero and the valid ones grow to fill the gap."],
      hint: "Switch the moment, then flip the mask off — the greedy pick becomes an invalid token and the output breaks.",
      readoutTitle: "MASK_STATE",
      rows: ["KEPT", "MASKED", "CHOSEN P"],
      readoutNote: "How the mask reshaped this step: how many candidates survived, how many were zeroed, and the renormalised probability of the token that won.",
      optionNotes: [
        "First token — the model's favourite is a markdown fence. The mask forbids it and the humble `{` wins.",
        "The key — an unquoted `age` and a single-quoted `'age'` are tempting but invalid; the mask keeps only the double-quoted key.",
        "Closing up — the greedy pick is a trailing comma. The mask vetoes it and the object closes cleanly with `}`.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "A grammar decides what's allowed next",
      intro: "Masking needs a source of truth: *which* tokens are valid right now? That source is a grammar — a compact set of rules describing every legal string. The engine tracks where you are in the grammar and reads off the allowed set.",
      bullets: [
        "**A grammar is a shape, written down.** These rules say the output must be `{`, then the key `\"age\"`, then a number, then `}` — nothing else.",
        "**Position decides the allowed set.** Right after `\"age\":` the grammar permits only number tokens — a digit or a minus sign. A quote is off the table.",
        "**Free decoding has no such map**, so at every position it would allow *anything*; the grammar narrows it to exactly what's legal.",
        "**This is what powers structured outputs.** JSON Schema or a [GBNF](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) grammar compiles into the allowed-set the masker enforces every step.",
      ],
      cardLabel: "SAME POSITION · FREE vs GRAMMAR",
      aria: "Two panels of token classes: free decoding lights all of them, the grammar lights only the legal ones.",
      steps: 1,
      captions: ["Walk the positions — the grammar's allowed set shrinks to exactly what's legal while free decoding stays wide open."],
      hint: "Step through the positions — after the colon, the grammar allows only a number; free decoding still allows a string, a brace, anything.",
      readoutTitle: "ALLOWED_SET",
      rows: ["POSITION", "GRAMMAR", "FREE"],
      readoutNote: "At the current position: what the grammar permits next versus what unconstrained decoding would permit.",
      optionNotes: [
        "Start — the grammar's first rule demands an opening brace. Only `{` is allowed; everything else is masked.",
        "After the brace — the shape needs its key next, so only the string `\"age\"` is allowed.",
        "After the colon — a value is due, and this grammar pins it to a number: only digits and a leading minus survive.",
        "After the value — the object must close, so the only allowed token is `}`.",
      ],
    },
  ],
  n1modes: ["Prose preamble", "Markdown fence", "Unquoted key", "Trailing comma"],
  n1askLabel: "YOU ASKED FOR",
  n1ask: 'valid JSON  ·  {"age": <number>}',
  n1invalid: "INVALID",
  n1parseLabel: "JSON.parse →",
  n2moments: ["First token", "The key", "Closing up"],
  n2constraintLabel: "CONSTRAINT",
  n2on: "ON",
  n2off: "OFF",
  n2maskedTag: "masked · p=0",
  n2chosenTag: "chosen",
  n2prefixLabel: "OUTPUT SO FAR",
  n2validBadge: "valid by construction",
  n2breakBadge: "breaks JSON",
  n2candLabel: "NEXT-TOKEN CANDIDATES",
  n2deeperTitle: "Go deeper — why −∞ and not just a filter?",
  n2deeperBody:
    "Masking is applied to the logits (the raw scores) before the softmax that turns them into probabilities. Setting an invalid token's logit to −∞ makes exp(−∞) = 0, so it contributes nothing to the sum and its probability is exactly zero; the remaining tokens' probabilities automatically renormalise to sum to 1. Doing it at the logit stage (rather than sampling and rejecting) means you never waste a forward pass on an impossible token, and it composes with any sampler — greedy, temperature, or top-p all respect the mask. The only real cost is computing the allowed set each step, which the grammar makes cheap.",
  n3positions: ["Start", "After {", 'After "age":', "After 36"],
  n3freeLabel: "FREE · allows",
  n3grammarLabel: "JSON GRAMMAR · allows",
  n3refLabel: "the grammar (GBNF) — read-only",
  n3emittedLabel: "SO FAR",
  n3anything: "…anything",
  calloutLabel: "GOOD TO KNOW · STRUCTURED OUTPUTS",
  calloutTitle: "From JSON Schema to a token mask",
  calloutBody:
    "This is the machinery behind 'JSON mode' and 'structured outputs'. You hand the API a JSON Schema (or a GBNF grammar); the engine compiles it to a state machine, and at every decode step it computes the allowed tokens and masks the rest. The model's quality still decides *what* it says — the grammar only guarantees the *shape* it comes out in.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A model is already very good at emitting JSON. Why bolt on a grammar and mask tokens instead of just trusting a good prompt?",
  explainA: "Because 'very good' isn't 'guaranteed', and a single bad token — a stray fence, an unquoted key, a trailing comma — makes the *entire* response unparseable. A prompt can only lower the odds of that; **constrained decoding removes the possibility**. At each step a grammar says exactly which tokens keep the output well-formed, and masking sets every other token's probability to zero, so the model physically cannot pick an invalid one. It still chooses freely *among the valid tokens*, so quality is untouched — you've only deleted the outcomes that would break your parser. Valid by construction, not by luck.",
  bridgeLabel: "NEXT: REASONING TOKENS",
  bridgeBody: "Masking controls the *form* of the output. Next, **reasoning tokens**: hidden scratch-work the model generates before its answer — where the goal is the opposite, to let it wander freely so the final answer comes out better.",
  prevLesson: "Back: mixture of experts",
  nextLesson: "Continue: reasoning tokens",
};

/* ============================================================ SPANISH ======= */

export const constrainedDecodingES: ConstrainedDecodingLesson = {
  crumb: "ETAPA 0 · EXPERTO · DECODIFICACIÓN RESTRINGIDA",
  eyebrow: "ETAPA 0 · EXPERTO · 3 NODOS",
  title: "Decodificación restringida",
  lede: "Necesitas JSON legible por máquina, siempre — pero un modelo de lenguaje solo predice tokens probables, y 'probable' no es 'válido'. La decodificación restringida cierra la brecha: en cada paso prohíbe cualquier token que rompería la estructura, así la salida es válida por construcción.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Por qué falla el muestreo libre", "Enmascarar los tokens malos", "La gramática decide qué se permite"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El muestreo libre no conoce las reglas",
      intro: "En Estrategias de muestreo viste al modelo puntuar cada token y elegir uno que le gusta. Nada en ese bucle sabe qué es JSON válido — así que un modelo fluido y seguro igual te entrega texto que un parser rechaza.",
      bullets: [
        "**El modelo optimiza lo *plausible*, no lo *parseable*.** Un cerco markdown o un amable 'Claro' es texto muy probable — y JSON inválido al instante.",
        "**Un solo token malo envenena toda la cadena.** Una clave sin comillas o una coma final hacen que `JSON.parse` falle en toda la respuesta.",
        "**A escala esto es caro.** Aun un 1% de fallos significa reintentos, registros perdidos y pipelines que se atascan por la única fila mala.",
        "**Rogarle en el prompt no lo garantiza.** 'Responde solo con JSON' baja la tasa de fallo; no puede llevarla a cero.",
      ],
      cardLabel: "CUATRO FORMAS DE ROMPER LA MISMA PETICIÓN",
      aria: "Una cadena JSON rota con la parte culpable resaltada y el error del parser debajo.",
      steps: 1,
      captions: ["Cada botón es una forma real en que la decodificación libre produce JSON inválido para la misma petición."],
      hint: "Recorre los modos de fallo — el tramo rojo es justo donde JSON.parse se rinde.",
      readoutTitle: "PARSE_RESULT",
      rows: ["STATUS", "AT BYTE", "CAUSE"],
      optionNotes: [
        "Preámbulo de prosa — el modelo abre con 'Claro' antes del objeto. El primer carácter no es JSON, así que el parseo falla en el byte 0.",
        "Cerco markdown — envuelve el objeto en ```json … ```. Ideal para humanos, pero las comillas invertidas no son JSON.",
        "Clave sin comillas — `age` en vez de `\"age\"`. Las claves JSON deben ser cadenas entre comillas dobles; una palabra suelta se rechaza.",
        "Coma final — una coma tras el último valor. Legal en JavaScript, ilegal en JSON.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Enmascara los tokens que lo romperían",
      intro: "El arreglo no cambia el modelo — edita sus elecciones. En cada paso de decodificación un validador lista qué tokens mantienen el JSON bien formado, y el enmascarado pone en cero la probabilidad de todos los demás.",
      bullets: [
        "**Enmascarar = forzar `p = 0`.** El logit de cada token inválido se pone en −∞, así que tras el softmax su probabilidad es exactamente cero — nunca puede muestrearse.",
        "**Los que sobreviven se renormalizan.** El modelo sigue eligiendo según su propia preferencia entre los tokens válidos — el enmascarado quita opciones, no inventa ninguna.",
        "**Hasta un fuerte favorito es vetado.** Cuando el token top es un cerco o una coma final, el enmascarado simplemente lo salta por el mejor token *válido*.",
        "**Alterna la restricción** y mira los mismos candidatos oscilar entre 'rompe el JSON' y 'válido por construcción'.",
      ],
      cardLabel: "UN PASO DE DECODIFICACIÓN · MÁSCARA ON/OFF",
      aria: "Tokens candidatos como barras de probabilidad; los inválidos se apagan a cero cuando la restricción está activa.",
      steps: 1,
      captions: ["Elige un momento y alterna la máscara — los candidatos inválidos caen a cero y los válidos crecen para llenar el hueco."],
      hint: "Cambia el momento y luego apaga la máscara — la elección voraz se vuelve un token inválido y la salida se rompe.",
      readoutTitle: "MASK_STATE",
      rows: ["KEPT", "MASKED", "CHOSEN P"],
      readoutNote: "Cómo remodeló la máscara este paso: cuántos candidatos sobrevivieron, cuántos se pusieron en cero, y la probabilidad renormalizada del token ganador.",
      optionNotes: [
        "Primer token — el favorito del modelo es un cerco markdown. La máscara lo prohíbe y gana el humilde `{`.",
        "La clave — un `age` sin comillas y un `'age'` con comilla simple son tentadores pero inválidos; la máscara conserva solo la clave con comillas dobles.",
        "El cierre — la elección voraz es una coma final. La máscara la veta y el objeto cierra limpio con `}`.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Una gramática decide qué se permite",
      intro: "El enmascarado necesita una fuente de verdad: ¿*qué* tokens son válidos ahora mismo? Esa fuente es una gramática — un conjunto compacto de reglas que describe toda cadena legal. El motor rastrea dónde estás en la gramática y lee el conjunto permitido.",
      bullets: [
        "**Una gramática es una forma, escrita.** Estas reglas dicen que la salida debe ser `{`, luego la clave `\"age\"`, luego un número, luego `}` — nada más.",
        "**La posición decide el conjunto permitido.** Justo tras `\"age\":` la gramática permite solo tokens de número — un dígito o un signo menos. Una comilla queda descartada.",
        "**La decodificación libre no tiene ese mapa**, así que en cada posición permitiría *cualquier cosa*; la gramática lo reduce a exactamente lo que es legal.",
        "**Esto es lo que potencia las salidas estructuradas.** Un JSON Schema o una gramática [GBNF](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) se compila en el conjunto permitido que la máscara aplica en cada paso.",
      ],
      cardLabel: "MISMA POSICIÓN · LIBRE vs GRAMÁTICA",
      aria: "Dos paneles de clases de token: la decodificación libre las enciende todas, la gramática solo las legales.",
      steps: 1,
      captions: ["Recorre las posiciones — el conjunto permitido de la gramática se encoge a exactamente lo legal mientras la libre queda abierta de par en par."],
      hint: "Recorre las posiciones — tras los dos puntos, la gramática permite solo un número; la libre aún permite una cadena, una llave, cualquier cosa.",
      readoutTitle: "ALLOWED_SET",
      rows: ["POSITION", "GRAMMAR", "FREE"],
      readoutNote: "En la posición actual: qué permite la gramática a continuación frente a lo que permitiría la decodificación sin restricción.",
      optionNotes: [
        "Inicio — la primera regla de la gramática exige una llave de apertura. Solo `{` está permitido; todo lo demás se enmascara.",
        "Tras la llave — la forma necesita su clave a continuación, así que solo se permite la cadena `\"age\"`.",
        "Tras los dos puntos — toca un valor, y esta gramática lo fija a un número: solo sobreviven los dígitos y un menos inicial.",
        "Tras el valor — el objeto debe cerrar, así que el único token permitido es `}`.",
      ],
    },
  ],
  n1modes: ["Preámbulo de prosa", "Cerco markdown", "Clave sin comillas", "Coma final"],
  n1askLabel: "PEDISTE",
  n1ask: 'JSON válido  ·  {"age": <número>}',
  n1invalid: "INVÁLIDO",
  n1parseLabel: "JSON.parse →",
  n2moments: ["Primer token", "La clave", "El cierre"],
  n2constraintLabel: "RESTRICCIÓN",
  n2on: "ON",
  n2off: "OFF",
  n2maskedTag: "enmascarado · p=0",
  n2chosenTag: "elegido",
  n2prefixLabel: "SALIDA HASTA AHORA",
  n2validBadge: "válido por construcción",
  n2breakBadge: "rompe el JSON",
  n2candLabel: "CANDIDATOS AL SIGUIENTE TOKEN",
  n2deeperTitle: "Más a fondo — ¿por qué −∞ y no solo un filtro?",
  n2deeperBody:
    "La máscara se aplica a los logits (las puntuaciones crudas) antes del softmax que los vuelve probabilidades. Poner el logit de un token inválido en −∞ hace que exp(−∞) = 0, así no aporta nada a la suma y su probabilidad es exactamente cero; las probabilidades de los tokens restantes se renormalizan solas para sumar 1. Hacerlo en la etapa de logits (en vez de muestrear y rechazar) significa que nunca gastas una pasada hacia adelante en un token imposible, y compone con cualquier muestreador — voraz, temperatura o top-p, todos respetan la máscara. El único costo real es calcular el conjunto permitido en cada paso, que la gramática abarata.",
  n3positions: ["Inicio", "Tras {", 'Tras "age":', "Tras 36"],
  n3freeLabel: "LIBRE · permite",
  n3grammarLabel: "GRAMÁTICA JSON · permite",
  n3refLabel: "la gramática (GBNF) — solo lectura",
  n3emittedLabel: "HASTA AHORA",
  n3anything: "…cualquier cosa",
  calloutLabel: "PARA SABER · SALIDAS ESTRUCTURADAS",
  calloutTitle: "De un JSON Schema a una máscara de tokens",
  calloutBody:
    "Esta es la maquinaria detrás del 'modo JSON' y las 'salidas estructuradas'. Le entregas a la API un JSON Schema (o una gramática GBNF); el motor lo compila a una máquina de estados, y en cada paso de decodificación calcula los tokens permitidos y enmascara el resto. La calidad del modelo aún decide *qué* dice — la gramática solo garantiza la *forma* en que sale.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un modelo ya es muy bueno emitiendo JSON. ¿Por qué añadir una gramática y enmascarar tokens en vez de confiar en un buen prompt?",
  explainA: "Porque 'muy bueno' no es 'garantizado', y un solo token malo — un cerco perdido, una clave sin comillas, una coma final — vuelve *toda* la respuesta imposible de parsear. Un prompt solo puede bajar esa probabilidad; **la decodificación restringida elimina la posibilidad**. En cada paso una gramática dice exactamente qué tokens mantienen la salida bien formada, y el enmascarado pone en cero la probabilidad de todos los demás, así el modelo físicamente no puede elegir uno inválido. Sigue eligiendo libremente *entre los tokens válidos*, así que la calidad queda intacta — solo borraste los resultados que romperían tu parser. Válido por construcción, no por suerte.",
  bridgeLabel: "SIGUIENTE: TOKENS DE RAZONAMIENTO",
  bridgeBody: "El enmascarado controla la *forma* de la salida. Sigue **los tokens de razonamiento**: borrador oculto que el modelo genera antes de su respuesta — donde la meta es la opuesta, dejarlo divagar libremente para que la respuesta final salga mejor.",
  prevLesson: "Atrás: mezcla de expertos",
  nextLesson: "Continuar: tokens de razonamiento",
};
