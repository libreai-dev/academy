/**
 * Stage 0 · 1.2 — Multi-turn & formatting. Interface + EN/ES copy for the
 * article, isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: longer conversations, tool results, and reasoning all fold back
 * into the same role-block format the model was trained on (see the previous
 * "special tokens" lesson). Builds on it; does not re-teach it.
 */
import type { WsNodeCopy } from "./shared";

/** Node 1 — one exchange in the growing transcript. */
export interface MtfTurn {
  user: string;
  assistant: string;
}

/** Node 2 — one tool scenario: call, result block, final answer. */
export interface MtfTool {
  label: string;
  user: string;
  /** The tool call the assistant emits (code-ish literal). */
  call: string;
  /** What the tool returns (code-ish literal). */
  result: string;
  answer: string;
}

export interface MultiTurnFormattingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // node 1 — stacking turns
  n1slider: string;
  n1system: string;
  n1turns: MtfTurn[];
  n1activeTag: string;
  n1blocksWord: string; //  "blocks"
  n1tokensWord: string; //  "tokens"
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;
  // node 2 — tool results
  n2tools: MtfTool[];
  n2toolTag: string;
  n2userRole: string; //    unused label hook if needed
  // node 3 — the scratchpad
  n3user: string;
  n3think: string;
  n3answerOff: string;
  n3answerOn: string;
  n3thinkLabel: string;
  n3toggle: string;
  n3on: string;
  n3off: string;
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

export const multiTurnFormattingEN: MultiTurnFormattingLesson = {
  crumb: "STAGE 0 · 1.2 · MULTI-TURN & FORMATTING",
  eyebrow: "STAGE 0 · 1.2 · 3 NODES",
  title: "One format, every turn",
  lede: "Last lesson, a single message became a role block wrapped in special tokens. Real conversations are messier — many turns, tool calls, step-by-step reasoning. The trick: all of it folds back into that same stack of role blocks the model was trained on.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Stacking turns", "Tool results fold in", "The reasoning scratchpad"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "A conversation is just stacked blocks",
      intro: "The model has no memory. Each turn, the whole conversation is re-sent as role blocks — stacked oldest to newest — and the model writes the next one.",
      bullets: [
        "**Every message is one role block** — `system`, `user`, or `assistant` — wrapped in the special tokens from the last lesson.",
        "**The history is the input.** Add a turn and the entire stack is sent again; nothing is remembered between calls.",
        "**The model always writes the last block** — the open `assistant` turn at the bottom {ring}.",
        "**A longer chat is a taller stack**, until it runs into the context limit.",
      ],
      cardLabel: "THE TRANSCRIPT · stacked role blocks",
      aria: "A vertical stack of role blocks — system, user, assistant — growing as turns are added.",
      steps: 1,
      captions: ["Drag to add turns — each one appends a user block and an assistant block."],
      hint: "Drag the turns slider — watch the same stack grow, block by block.",
      readoutTitle: "TRANSCRIPT",
      rows: ["BLOCKS", "EST TOKENS"],
      readoutNote: "The whole stack is re-sent on every turn: how many role blocks it holds, and roughly how many tokens that is.",
      sliderNote: "The model is stateless. To 'remember' turn 1, the app resends turn 1 — every single time you talk to it.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "A tool result comes back as its own block",
      intro: "When the assistant needs live data, it writes a tool call instead of an answer. Your code runs the tool, and the result re-enters the stack as a new `tool` block — then the model reads everything again and answers.",
      bullets: [
        "**The assistant emits a tool call** instead of a final answer — still just text inside its block.",
        "**Your code runs the tool** and appends the output as a `tool` role block.",
        "**The model re-reads the whole stack** — now including the result — and writes the real answer.",
        "**Nothing new in the format** — a tool result is just one more role block.",
      ],
      cardLabel: "TOOL CALL · the result folds back in",
      aria: "A transcript where the assistant calls a tool and the tool's result appears as its own block.",
      steps: 3,
      captions: [
        "The assistant calls a tool; its output returns as a tool block; the model answers.",
        "A different tool — same shape: call, tool block, answer.",
        "Any tool at all — the result is always just another role block.",
      ],
      hint: "Pick a tool — the call, the tool block, and the final answer all update together.",
      readoutTitle: "TOOL_CALL",
      rows: ["TOOL", "RESULT"],
      optionNotes: [
        "Weather — the model can't know live weather, so it calls a weather tool; the JSON result returns as a tool block.",
        "Web search — for fresh facts the model searches, then reads the returned snippet out of the tool block.",
        "Calculator — models are shaky at exact arithmetic, so they offload it and read the exact result back.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Pre-fill `<think>` to make it reason",
      intro: "You can start the assistant's block for it. Pre-open the turn with a `<think>` tag and the model fills a private scratchpad — reasoning step by step — before it writes the answer.",
      bullets: [
        "**The answer block is just text you can seed.** Put `<think>` at its start and the model keeps going from there.",
        "**Inside `<think>` it reasons out loud** — a scratchpad that's stripped away before you see the reply.",
        "**Then it writes the real answer** after the scratchpad closes.",
        "**This is how reasoning models work** — the same block format, one pre-filled tag.",
      ],
      cardLabel: "ASSISTANT BLOCK · with and without a scratchpad",
      aria: "One assistant block shown two ways: answering directly, and with a pre-filled reasoning scratchpad.",
      steps: 1,
      captions: ["Toggle the scratchpad — the same block, pre-filled with a reasoning step."],
      hint: "Turn the scratchpad on — the model thinks first, and catches the two-step discount.",
      readoutTitle: "ASSISTANT_BLOCK",
      rows: ["SCRATCHPAD", "ANSWER"],
      optionNotes: [
        "Scratchpad off — the model answers immediately. On a two-step problem it can slip and say $26 (illustrative).",
        "`<think>` pre-filled — the model works through 40 × 0.75, then × 0.90, and lands on $27.",
      ],
    },
  ],
  n1slider: "TURNS",
  n1system: "You are a helpful assistant.",
  n1turns: [
    { user: "What's a transformer, in one line?", assistant: "A network that reads all the tokens at once and predicts the next one." },
    { user: "And what does attention do?", assistant: "It lets each token look at the others to decide what matters." },
    { user: "Give me a metaphor for that.", assistant: "Like everyone in a meeting glancing at whoever's most relevant." },
    { user: "Now summarize all of that.", assistant: "" },
  ],
  n1activeTag: "← the model writes this block next",
  n1blocksWord: "blocks",
  n1tokensWord: "tokens",
  calloutLabel: "FROM THE LAST LESSON",
  calloutTitle: "Same block, wrapped in special tokens",
  calloutBody: "Each block is `<|im_start|>role … <|im_end|>` — the exact format the model was trained on. A whole conversation is just those blocks, in order.",
  n2tools: [
    { label: "Weather", user: "What's the weather in Lima right now?", call: 'get_weather(city="Lima")', result: '{ "tempC": 24, "sky": "clear" }', answer: "It's 24°C and clear in Lima right now." },
    { label: "Web search", user: "Who won the game last night?", call: 'web_search("game result last night")', result: "top hit: Home 3 – 1 Away", answer: "The home side won it 3–1." },
    { label: "Calculator", user: "What's 18% of 2,450?", call: 'calc("2450 * 0.18")', result: "441", answer: "18% of 2,450 is 441." },
  ],
  n2toolTag: "role: tool — appended to the stack",
  n2userRole: "user",
  n3user: "A $40 shirt is 25% off, then 10% off the sale price. Final price?",
  n3think: "40 × 0.75 = 30. Then 30 × 0.90 = 27.",
  n3answerOff: "It's $26.",
  n3answerOn: "It's $27.",
  n3thinkLabel: "<think> · scratchpad, hidden from the user",
  n3toggle: "SCRATCHPAD",
  n3on: "ON",
  n3off: "OFF",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Your chat app 'remembers' everything you said earlier — but the model is stateless. So where does the memory actually live?",
  explainA: "In the transcript, not the model. Every turn, the app rebuilds the whole conversation as a stack of role blocks — `system`, then each `user` and `assistant` message in order — and sends the entire thing again. The model reads that stack fresh each time and writes exactly one new block: the open `assistant` turn at the bottom. Tool results and reasoning don't change the rules — a tool output is just another `tool` block appended to the stack, and a `<think>` scratchpad is just the assistant block pre-filled with a tag. **One format, reused for everything** — which is why 'memory,' 'tools,' and 'reasoning' all run on the same plumbing.",
  bridgeLabel: "NEXT · THE ATTENTION MECHANISM",
  bridgeBody: "The model reads this whole stack in a single pass — but how does it decide which earlier tokens matter for the next word? Next, **attention**: the step where every token weighs every other one.",
  prevLesson: "Back: special tokens",
  nextLesson: "Continue to attention",
};

/* ============================================================ SPANISH ======= */

export const multiTurnFormattingES: MultiTurnFormattingLesson = {
  crumb: "ETAPA 0 · 1.2 · MULTITURNO Y FORMATO",
  eyebrow: "ETAPA 0 · 1.2 · 3 NODOS",
  title: "Un solo formato, en cada turno",
  lede: "En la lección pasada, un mensaje se volvió un bloque de rol envuelto en tokens especiales. Las conversaciones reales son más enredadas — muchos turnos, llamadas a herramientas, razonamiento paso a paso. El truco: todo se dobla de vuelta a esa misma pila de bloques de rol con la que se entrenó el modelo.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Apilar turnos", "Las herramientas se doblan", "El bloc de razonamiento"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Una conversación es solo bloques apilados",
      intro: "El modelo no tiene memoria. En cada turno, toda la conversación se reenvía como bloques de rol — apilados del más viejo al más nuevo — y el modelo escribe el siguiente.",
      bullets: [
        "**Cada mensaje es un bloque de rol** — `system`, `user` o `assistant` — envuelto en los tokens especiales de la lección pasada.",
        "**El historial es la entrada.** Añade un turno y toda la pila se envía de nuevo; nada se recuerda entre llamadas.",
        "**El modelo siempre escribe el último bloque** — el turno `assistant` abierto, abajo del todo {ring}.",
        "**Un chat más largo es una pila más alta**, hasta chocar con el límite de contexto.",
      ],
      cardLabel: "LA TRANSCRIPCIÓN · bloques de rol apilados",
      aria: "Una pila vertical de bloques de rol — system, user, assistant — que crece al añadir turnos.",
      steps: 1,
      captions: ["Arrastra para añadir turnos — cada uno añade un bloque de usuario y uno de asistente."],
      hint: "Arrastra el control de turnos — mira crecer la misma pila, bloque a bloque.",
      readoutTitle: "TRANSCRIPCION",
      rows: ["BLOQUES", "TOKENS APROX"],
      readoutNote: "Toda la pila se reenvía en cada turno: cuántos bloques de rol contiene y, aproximadamente, cuántos tokens son.",
      sliderNote: "El modelo no tiene estado. Para 'recordar' el turno 1, la app reenvía el turno 1 — cada vez que le hablas.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El resultado de una herramienta vuelve como su propio bloque",
      intro: "Cuando el asistente necesita datos en vivo, escribe una llamada a herramienta en vez de una respuesta. Tu código ejecuta la herramienta, y el resultado vuelve a la pila como un nuevo bloque `tool` — luego el modelo lo lee todo de nuevo y responde.",
      bullets: [
        "**El asistente emite una llamada a herramienta** en vez de una respuesta final — sigue siendo solo texto dentro de su bloque.",
        "**Tu código ejecuta la herramienta** y añade la salida como un bloque de rol `tool`.",
        "**El modelo relee toda la pila** — ahora con el resultado incluido — y escribe la respuesta real.",
        "**Nada nuevo en el formato** — el resultado de una herramienta es solo un bloque de rol más.",
      ],
      cardLabel: "LLAMADA A HERRAMIENTA · el resultado se dobla de vuelta",
      aria: "Una transcripción donde el asistente llama a una herramienta y su resultado aparece como su propio bloque.",
      steps: 3,
      captions: [
        "El asistente llama a una herramienta; su salida vuelve como bloque tool; el modelo responde.",
        "Otra herramienta — la misma forma: llamada, bloque tool, respuesta.",
        "Cualquier herramienta — el resultado siempre es solo otro bloque de rol.",
      ],
      hint: "Elige una herramienta — la llamada, el bloque tool y la respuesta final se actualizan juntos.",
      readoutTitle: "TOOL_CALL",
      rows: ["TOOL", "RESULT"],
      optionNotes: [
        "Clima — el modelo no puede saber el clima en vivo, así que llama a una herramienta de clima; el resultado JSON vuelve como bloque tool.",
        "Búsqueda web — para datos frescos el modelo busca, y luego lee el fragmento devuelto desde el bloque tool.",
        "Calculadora — los modelos flaquean en aritmética exacta, así que la delegan y leen de vuelta el resultado exacto.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Pre-rellena `<think>` para que razone",
      intro: "Puedes empezar tú el bloque del asistente. Pre-abre el turno con una etiqueta `<think>` y el modelo llena un bloc privado — razonando paso a paso — antes de escribir la respuesta.",
      bullets: [
        "**El bloque de respuesta es solo texto que puedes sembrar.** Pon `<think>` al inicio y el modelo sigue desde ahí.",
        "**Dentro de `<think>` razona en voz alta** — un bloc que se elimina antes de que veas la respuesta.",
        "**Luego escribe la respuesta real** después de cerrar el bloc.",
        "**Así funcionan los modelos de razonamiento** — el mismo formato de bloque, una etiqueta pre-rellenada.",
      ],
      cardLabel: "BLOQUE ASSISTANT · con y sin bloc de notas",
      aria: "Un bloque de asistente mostrado de dos formas: respondiendo directo, y con un bloc de razonamiento pre-rellenado.",
      steps: 1,
      captions: ["Alterna el bloc — el mismo bloque, pre-rellenado con un paso de razonamiento."],
      hint: "Enciende el bloc — el modelo piensa primero, y atrapa el descuento de dos pasos.",
      readoutTitle: "ASSISTANT_BLOCK",
      rows: ["SCRATCHPAD", "ANSWER"],
      optionNotes: [
        "Bloc apagado — el modelo responde de inmediato. En un problema de dos pasos puede resbalar y decir $26 (ilustrativo).",
        "`<think>` pre-rellenado — el modelo trabaja 40 × 0.75, luego × 0.90, y llega a $27.",
      ],
    },
  ],
  n1slider: "TURNOS",
  n1system: "Eres un asistente útil.",
  n1turns: [
    { user: "¿Qué es un transformer, en una línea?", assistant: "Una red que lee todos los tokens a la vez y predice el siguiente." },
    { user: "¿Y qué hace la atención?", assistant: "Deja que cada token mire a los otros para decidir qué importa." },
    { user: "Dame una metáfora de eso.", assistant: "Como todos en una reunión mirando a quien es más relevante." },
    { user: "Ahora resume todo eso.", assistant: "" },
  ],
  n1activeTag: "← el modelo escribe este bloque a continuación",
  n1blocksWord: "bloques",
  n1tokensWord: "tokens",
  calloutLabel: "DE LA LECCIÓN PASADA",
  calloutTitle: "El mismo bloque, envuelto en tokens especiales",
  calloutBody: "Cada bloque es `<|im_start|>rol … <|im_end|>` — el formato exacto con el que se entrenó el modelo. Una conversación entera son solo esos bloques, en orden.",
  n2tools: [
    { label: "Clima", user: "¿Qué clima hace en Lima ahora mismo?", call: 'get_weather(city="Lima")', result: '{ "tempC": 24, "sky": "clear" }', answer: "Ahora mismo hace 24°C y está despejado en Lima." },
    { label: "Búsqueda web", user: "¿Quién ganó el partido de anoche?", call: 'web_search("resultado partido anoche")', result: "resultado: Local 3 – 1 Visita", answer: "Ganó el equipo local, 3–1." },
    { label: "Calculadora", user: "¿Cuánto es el 18% de 2,450?", call: 'calc("2450 * 0.18")', result: "441", answer: "El 18% de 2,450 es 441." },
  ],
  n2toolTag: "rol: tool — añadido a la pila",
  n2userRole: "user",
  n3user: "Una camisa de $40 tiene 25% de descuento, luego 10% sobre el precio rebajado. ¿Precio final?",
  n3think: "40 × 0.75 = 30. Luego 30 × 0.90 = 27.",
  n3answerOff: "Son $26.",
  n3answerOn: "Son $27.",
  n3thinkLabel: "<think> · bloc, oculto para el usuario",
  n3toggle: "BLOC",
  n3on: "SÍ",
  n3off: "NO",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Tu app de chat 'recuerda' todo lo que dijiste antes — pero el modelo no tiene estado. ¿Dónde vive esa memoria en realidad?",
  explainA: "En la transcripción, no en el modelo. En cada turno, la app reconstruye toda la conversación como una pila de bloques de rol — `system`, y luego cada mensaje `user` y `assistant` en orden — y la envía entera de nuevo. El modelo lee esa pila desde cero cada vez y escribe exactamente un bloque nuevo: el turno `assistant` abierto, abajo del todo. Las herramientas y el razonamiento no cambian las reglas — la salida de una herramienta es solo otro bloque `tool` añadido a la pila, y un bloc `<think>` es solo el bloque del asistente pre-rellenado con una etiqueta. **Un solo formato, reutilizado para todo** — por eso la 'memoria', las 'herramientas' y el 'razonamiento' corren sobre la misma tubería.",
  bridgeLabel: "SIGUIENTE · EL MECANISMO DE ATENCIÓN",
  bridgeBody: "El modelo lee toda esta pila en una sola pasada — pero ¿cómo decide qué tokens anteriores importan para la próxima palabra? Sigue **la atención**: el paso donde cada token pesa a todos los demás.",
  prevLesson: "Atrás: tokens especiales",
  nextLesson: "Continuar a atención",
};
