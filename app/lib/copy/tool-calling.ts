/**
 * Stage 0 · Phase 3 — Tool calling. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * One idea: the model can emit a structured tool call that pauses generation,
 * runs real code or an API outside the model, and feeds the result back as a
 * new turn to continue from. Builds on the autoregressive loop.
 */
import type { WsNodeCopy } from "./shared";

/** Node 1 — one request scenario (button + what the model does with it). */
export interface TcRequest {
  label: string; //   button text
  user: string; //    the user's message (kept short so the diagram fits)
  tool: string; //    tool name, or "" when the model answers directly
  args: string; //    JSON arguments, or "" for a direct answer
  prose: string; //   the direct prose answer, or "" when it calls a tool
}

/** Node 2 — one executable tool (button + the runtime's call and result). */
export interface TcTool {
  label: string; //   button text
  fn: string; //      function name shown in the runtime panel
  call: string; //    the real request the harness makes
  ok: string; //      the successful result value
  err: string; //     the failure value when the error toggle is on
}

export interface ToolCallingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — emit a call
  n1userLabel: string;
  n1modelLabel: string;
  n1modelSub: string;
  n1proseLabel: string;
  n1callLabel: string;
  n1specialLabel: string;
  n1nameKey: string; //   "name"
  n1argsKey: string; //   "arguments"
  n1requests: TcRequest[];
  // Node 2 — pause & execute
  n2insideLabel: string;
  n2insideBody: string;
  n2runtimeLabel: string;
  n2parseStep: string;
  n2callStep: string;
  n2resultStep: string;
  n2errorToggle: string;
  n2okTag: string;
  n2errTag: string;
  n2errorNote: string;
  n2tools: TcTool[];
  // Node 3 — feed back
  n3phaseButtons: string[]; // 4 phase labels
  n3phaseNotes: string[]; //   4 plain-language notes, one per phase
  n3roleUser: string;
  n3roleAssistant: string;
  n3roleTool: string;
  n3userText: string;
  n3callName: string;
  n3callArgs: string;
  n3resultText: string;
  n3answerText: string;
  n3contextLabel: string;
  n3pauseLabel: string;
  n3loopLabel: string;
  // deeper + shared
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

export const toolCallingEN: ToolCallingLesson = {
  crumb: "STAGE 0 · TOOL CALLING",
  eyebrow: "STAGE 0 · 3 NODES",
  title: "Tool calling",
  lede: "A model can't check the weather or run your database — it only predicts text. So it does the next best thing: it writes a structured request for a tool, pauses, and lets something outside the model do the work. Here's that loop, step by step.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["The model asks for a tool", "The runtime runs it", "The result comes back"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "The model asks for a tool",
      intro: "Sometimes the best next token isn't a word — it's a request for a tool. The model emits a structured block and stops writing.",
      bullets: [
        "**A tool call is just tokens.** The model was fine-tuned to emit a structured block — a tool `name` plus JSON `arguments` — whenever a task needs the outside world.",
        "**It's still the same loop.** From the [autoregressive loop](/stage/0/autoregressive-loop) you know: predict the next token, append, repeat. A call is that loop producing a special block instead of prose.",
        "**The model routes.** A fact it already knows, it answers directly. Live data or exact computation, it asks for a tool instead of guessing.",
        "**Valid JSON is guaranteed when the server constrains decoding** — locking the decoder to the tool's schema (a *grammar* — a rule set the sampler must follow) forces the arguments to always parse. Without that constraint, valid JSON is likely, not certain.",
      ],
      cardLabel: "USER REQUEST → THE MODEL'S OUTPUT",
      aria: "A user request flows into the model, which outputs either a prose answer or a structured tool call.",
      steps: 1,
      captions: ["Pick a request and watch what the model chooses to emit — plain prose, or a structured tool call."],
      hint: "Try each request — the weather and the math become tool calls; the fact it just answers.",
      readoutTitle: "ROUTE",
      rows: ["DECISION", "TOOL"],
      optionNotes: [
        "Live data the model can't know — today's weather. It emits `get_weather` and stops; the loop hands off to the runtime.",
        "Exact arithmetic. Models are shaky at long multiplication, so it delegates to a calculator instead of guessing a number.",
        "A fact from training. No live data, no computation — the model just answers, with no tool call at all.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The runtime runs it — not the model",
      intro: "The model can't run code. It only wrote a request — so something outside the model has to actually do the work.",
      bullets: [
        "**Generation pauses.** The instant the call block ends, the runtime stops sampling. The model is frozen — it executes nothing itself.",
        "**The harness executes.** Your server — the *harness* wrapped around the model — parses the JSON, calls the real function or API, and captures whatever comes back.",
        "**Anything can be a tool** — a weather API, a calculator sandbox, a database query, even another model. The model only ever produced text asking for it.",
        "**Errors come back too.** A 503, a timeout, a bad expression — the failure is handed back like any other result, and the model has to deal with it.",
      ],
      cardLabel: "INSIDE THE MODEL vs OUTSIDE THE MODEL",
      aria: "Two panels: the suspended model above, and the runtime parsing and executing the tool below.",
      steps: 1,
      captions: ["The model sits frozen while the runtime parses the call, executes the real tool, and captures the result."],
      hint: "Switch tools, then flip the error toggle — the failure is returned to the model just like a normal result.",
      readoutTitle: "EXECUTION",
      rows: ["TOOL", "RESULT"],
      optionNotes: [
        "The runtime makes a real HTTP request to a weather service and gets JSON back — bytes the model never had in its weights.",
        "A sandbox evaluates the expression exactly. No guessing and no rounding: 58068, every single time.",
        "The harness runs the query against your database and returns the rows — private data that was never in any training set.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The result comes back as a turn",
      intro: "The tool's output doesn't go to you — it goes back to the model, as if it had been in the prompt all along.",
      bullets: [
        "**The result becomes a new turn.** The runtime appends it to the conversation with a `tool` role, right after the call that asked for it.",
        "**Generation resumes.** The model reads the whole thread — including the fresh result — and continues from there, exactly like reading a longer prompt.",
        "**It can loop.** If the answer needs another tool, the model emits another call, waits, reads that result, and only then writes prose. This loop is what an *agent* is.",
        "**Nothing is memorised.** The result lives in the context window for this chat only — the weights never change (that's [retrieval, not retraining](/stage/0/web-scale-ingestion)).",
      ],
      cardLabel: "THE CONVERSATION, TURN BY TURN",
      aria: "A conversation thread grows turn by turn: user, assistant tool call, tool result, assistant answer.",
      steps: 4,
      captions: [
        "The user asks something that needs a tool.",
        "The model emits a tool call — and generation pauses.",
        "The runtime's result is appended as a new tool turn.",
        "The model reads the whole thread and writes the answer.",
      ],
      hint: "Step through the loop — each turn is appended to the context the model reads before it answers.",
      readoutTitle: "THREAD",
      rows: ["TURNS", "ROLE"],
      optionNotes: [
        "The conversation starts: the user asks something the model can't answer from memory alone.",
        "The model emits a tool call and generation pauses — it's waiting for a result, not thinking.",
        "The runtime ran the tool and appended the result as a new `tool` turn in the thread.",
        "The model reads the whole thread — including the result — and writes the final answer. It could have called another tool first.",
      ],
    },
  ],
  n1userLabel: "USER",
  n1modelLabel: "MODEL",
  n1modelSub: "predicts the next token",
  n1proseLabel: "ASSISTANT · prose answer",
  n1callLabel: "ASSISTANT · structured tool call",
  n1specialLabel: "special tokens frame the block",
  n1nameKey: "name",
  n1argsKey: "arguments",
  n1requests: [
    { label: "Weather in Lima?", user: "What's the weather in Lima?", tool: "get_weather", args: '{ "city": "Lima" }', prose: "" },
    { label: "4839 × 12", user: "What is 4839 × 12?", tool: "calculator", args: '{ "expr": "4839*12" }', prose: "" },
    { label: "Who wrote Hamlet?", user: "Who wrote Hamlet?", tool: "", args: "", prose: "Shakespeare wrote Hamlet." },
  ],
  n2insideLabel: "INSIDE THE MODEL",
  n2insideBody: "suspended — not sampling",
  n2runtimeLabel: "OUTSIDE · the runtime (harness)",
  n2parseStep: "parse the JSON arguments",
  n2callStep: "call",
  n2resultStep: "result",
  n2errorToggle: "SIMULATE ERROR",
  n2okTag: "200 OK",
  n2errTag: "FAILED",
  n2errorNote: "The tool failed. The error is handed back to the model just like a normal result — and the model can apologise, retry, or reach for a different tool.",
  n2tools: [
    { label: "Weather API", fn: "get_weather", call: "GET api.weather.co?city=Lima", ok: '{ "tempC": 19 }', err: "503 · service unavailable" },
    { label: "Calculator", fn: "calculator", call: 'eval("4839 * 12")', ok: "58068", err: "error · bad expression" },
    { label: "SQL query", fn: "run_sql", call: "SELECT total FROM orders …", ok: "1 row · total = 4820", err: "error · table not found" },
  ],
  n3phaseButtons: ["Ask", "Call", "Result", "Answer"],
  n3phaseNotes: [
    "The conversation starts with the user's question.",
    "The model writes a tool call and stops — generation is paused, waiting.",
    "The runtime's result is appended as a new `tool` turn, back in the thread.",
    "The model reads everything, including the result, and writes the answer.",
  ],
  n3roleUser: "USER",
  n3roleAssistant: "ASSISTANT",
  n3roleTool: "TOOL",
  n3userText: "What's the weather in Lima?",
  n3callName: "get_weather",
  n3callArgs: '{ "city": "Lima" }',
  n3resultText: '{ "tempC": 19 }',
  n3answerText: "It's 19°C and clear in Lima right now.",
  n3contextLabel: "CONTEXT · grows every turn",
  n3pauseLabel: "PAUSE · generation suspended",
  n3loopLabel: "can repeat",
  deeperTitle: "What actually makes a tool call reliable?",
  deeperBody: "Under the hood there's no new mechanism — just the chat template plus constrained decoding. During fine-tuning the model is shown thousands of conversations where a special token sequence (things like `<|tool_call|>` in the chat template) precedes a JSON object, so it learns *when* to emit one. At inference the sampler is then constrained to the tool's JSON schema: at each step, only tokens that keep the output valid against the grammar are allowed, which is why the `arguments` always parse instead of occasionally coming out as broken JSON. The runtime detects the closing special token, stops sampling, dispatches the parsed call, and appends the return value as a `tool`-role message — the provider APIs (OpenAI function calling, Anthropic tool use) are thin wrappers over exactly this. Models can also emit *several* calls in one turn (parallel tool use), and the whole thing is stateless: the model relearns nothing between turns, it just re-reads a slightly longer thread. An 'agent' is this loop — call, read result, maybe call again, finally answer — run until the model decides it's done.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A tool call pauses the model, runs code, and feeds the result back. So where does the reasoning about that result happen — in the tool, or in the model?",
  explainA: "In the model. The tool is dumb: it takes structured arguments and returns bytes — a temperature, a sum, a row of data. All the reasoning about *whether* to call it, *what* arguments to pass, and *what the result means* happens inside the model's ordinary next-token loop. The call, the pause, and the returned result are just more tokens added to the context; when generation resumes, the model does exactly what it always does — predict the next token from everything it can see. An 'agent' is nothing more exotic than this loop run a few times: call, read the result, maybe call again, and finally answer.",
  bridgeLabel: "NEXT: TEST-TIME SEARCH",
  bridgeBody: "One call, then an answer. But hard problems need many attempts — trying an approach, checking the result, backing up, trying another. Next, **test-time search**: spending extra compute at answer-time to explore several reasoning paths and keep the best one.",
  prevLesson: "Back: reasoning tokens",
  nextLesson: "Continue to test-time search",
};

/* ============================================================ SPANISH ======= */

export const toolCallingES: ToolCallingLesson = {
  crumb: "ETAPA 0 · LLAMADO A HERRAMIENTAS",
  eyebrow: "ETAPA 0 · 3 NODOS",
  title: "Llamado a herramientas",
  lede: "Un modelo no puede consultar el clima ni ejecutar tu base de datos — solo predice texto. Así que hace lo siguiente mejor: escribe una petición estructurada de una herramienta, se pausa, y deja que algo fuera del modelo haga el trabajo. Este es ese bucle, paso a paso.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El modelo pide una herramienta", "El runtime la ejecuta", "El resultado regresa"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "El modelo pide una herramienta",
      intro: "A veces el mejor próximo token no es una palabra — es una petición de herramienta. El modelo emite un bloque estructurado y deja de escribir.",
      bullets: [
        "**Un llamado a herramienta son solo tokens.** El modelo se ajustó para emitir un bloque estructurado — un `name` de herramienta más `arguments` en JSON — cuando una tarea necesita el mundo exterior.",
        "**Sigue siendo el mismo bucle.** Del [bucle autoregresivo](/stage/0/autoregressive-loop) ya lo sabes: predice el próximo token, añádelo, repite. Un llamado es ese bucle produciendo un bloque especial en vez de prosa.",
        "**El modelo enruta.** Un dato que ya sabe, lo responde directo. Datos en vivo o cálculo exacto, pide una herramienta en vez de adivinar.",
        "**El JSON válido está garantizado cuando el servidor restringe la decodificación** — atar el decodificador al esquema de la herramienta (una *gramática* — un conjunto de reglas que el muestreador debe seguir) obliga a que los argumentos siempre parseen. Sin esa restricción, el JSON válido es probable, no seguro.",
      ],
      cardLabel: "PETICIÓN DEL USUARIO → LA SALIDA DEL MODELO",
      aria: "Una petición del usuario entra al modelo, que emite una respuesta en prosa o un llamado estructurado a herramienta.",
      steps: 1,
      captions: ["Elige una petición y mira qué decide emitir el modelo — prosa simple, o un llamado estructurado a herramienta."],
      hint: "Prueba cada petición — el clima y la cuenta se vuelven llamados; el dato lo responde sin más.",
      readoutTitle: "RUTA",
      rows: ["DECISIÓN", "HERRAMIENTA"],
      optionNotes: [
        "Datos en vivo que el modelo no puede saber — el clima de hoy. Emite `get_weather` y se detiene; el bucle le pasa el testigo al runtime.",
        "Aritmética exacta. Los modelos flaquean en multiplicaciones largas, así que delega en una calculadora en vez de adivinar un número.",
        "Un dato del entrenamiento. Sin datos en vivo, sin cálculo — el modelo simplemente responde, sin ningún llamado a herramienta.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El runtime la ejecuta — no el modelo",
      intro: "El modelo no puede ejecutar código. Solo escribió una petición — así que algo fuera del modelo tiene que hacer el trabajo de verdad.",
      bullets: [
        "**La generación se pausa.** En cuanto termina el bloque del llamado, el runtime deja de muestrear. El modelo queda congelado — no ejecuta nada por sí mismo.",
        "**El arnés ejecuta.** Tu servidor — el *arnés* que envuelve al modelo — parsea el JSON, llama a la función o API real y captura lo que regrese.",
        "**Cualquier cosa puede ser herramienta** — una API de clima, una calculadora en caja de arena, una consulta a base de datos, incluso otro modelo. El modelo solo produjo texto pidiéndola.",
        "**Los errores también regresan.** Un 503, un timeout, una expresión mala — el fallo se devuelve como cualquier otro resultado, y el modelo tiene que lidiar con él.",
      ],
      cardLabel: "DENTRO DEL MODELO vs FUERA DEL MODELO",
      aria: "Dos paneles: arriba el modelo suspendido, y abajo el runtime parseando y ejecutando la herramienta.",
      steps: 1,
      captions: ["El modelo queda congelado mientras el runtime parsea el llamado, ejecuta la herramienta real y captura el resultado."],
      hint: "Cambia de herramienta y activa el interruptor de error — el fallo se devuelve al modelo como un resultado normal.",
      readoutTitle: "EJECUCIÓN",
      rows: ["HERRAMIENTA", "RESULTADO"],
      optionNotes: [
        "El runtime hace una petición HTTP real a un servicio de clima y recibe JSON — bytes que el modelo nunca tuvo en sus pesos.",
        "Una caja de arena evalúa la expresión con exactitud. Sin adivinar ni redondear: 58068, siempre.",
        "El arnés corre la consulta contra tu base de datos y devuelve las filas — datos privados que nunca estuvieron en ningún set de entrenamiento.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "El resultado regresa como un turno",
      intro: "La salida de la herramienta no te llega a ti — regresa al modelo, como si hubiera estado en el prompt todo el tiempo.",
      bullets: [
        "**El resultado se vuelve un turno nuevo.** El runtime lo añade a la conversación con un rol `tool`, justo después del llamado que lo pidió.",
        "**La generación se reanuda.** El modelo lee todo el hilo — incluido el resultado fresco — y continúa desde ahí, igual que leyendo un prompt más largo.",
        "**Puede repetirse en bucle.** Si la respuesta necesita otra herramienta, el modelo emite otro llamado, espera, lee ese resultado, y solo entonces escribe prosa. Ese bucle es lo que es un *agente*.",
        "**Nada se memoriza.** El resultado vive en la ventana de contexto solo de este chat — los pesos nunca cambian (eso es [recuperar, no reentrenar](/stage/0/web-scale-ingestion)).",
      ],
      cardLabel: "LA CONVERSACIÓN, TURNO A TURNO",
      aria: "Un hilo de conversación crece turno a turno: usuario, llamado del asistente, resultado de la herramienta, respuesta del asistente.",
      steps: 4,
      captions: [
        "El usuario pregunta algo que necesita una herramienta.",
        "El modelo emite un llamado — y la generación se pausa.",
        "El resultado del runtime se añade como un turno tool nuevo.",
        "El modelo lee todo el hilo y escribe la respuesta.",
      ],
      hint: "Recorre el bucle — cada turno se añade al contexto que el modelo lee antes de responder.",
      readoutTitle: "HILO",
      rows: ["TURNOS", "ROL"],
      optionNotes: [
        "La conversación arranca: el usuario pregunta algo que el modelo no puede responder solo de memoria.",
        "El modelo emite un llamado y la generación se pausa — está esperando un resultado, no pensando.",
        "El runtime ejecutó la herramienta y añadió el resultado como un turno `tool` nuevo en el hilo.",
        "El modelo lee todo el hilo — incluido el resultado — y escribe la respuesta final. Pudo haber llamado otra herramienta primero.",
      ],
    },
  ],
  n1userLabel: "USUARIO",
  n1modelLabel: "MODELO",
  n1modelSub: "predice el próximo token",
  n1proseLabel: "ASISTENTE · respuesta en prosa",
  n1callLabel: "ASISTENTE · llamado estructurado",
  n1specialLabel: "tokens especiales enmarcan el bloque",
  n1nameKey: "name",
  n1argsKey: "arguments",
  n1requests: [
    { label: "¿Clima en Lima?", user: "¿Qué clima hace en Lima?", tool: "get_weather", args: '{ "city": "Lima" }', prose: "" },
    { label: "4839 × 12", user: "¿Cuánto es 4839 × 12?", tool: "calculator", args: '{ "expr": "4839*12" }', prose: "" },
    { label: "¿Quién escribió Hamlet?", user: "¿Quién escribió Hamlet?", tool: "", args: "", prose: "Shakespeare escribió Hamlet." },
  ],
  n2insideLabel: "DENTRO DEL MODELO",
  n2insideBody: "suspendido — sin muestrear",
  n2runtimeLabel: "FUERA · el runtime (arnés)",
  n2parseStep: "parsea los argumentos JSON",
  n2callStep: "llama",
  n2resultStep: "resultado",
  n2errorToggle: "SIMULAR ERROR",
  n2okTag: "200 OK",
  n2errTag: "FALLÓ",
  n2errorNote: "La herramienta falló. El error se devuelve al modelo como un resultado normal — y el modelo puede disculparse, reintentar, o tomar otra herramienta.",
  n2tools: [
    { label: "API de clima", fn: "get_weather", call: "GET api.weather.co?city=Lima", ok: '{ "tempC": 19 }', err: "503 · servicio no disponible" },
    { label: "Calculadora", fn: "calculator", call: 'eval("4839 * 12")', ok: "58068", err: "error · expresión inválida" },
    { label: "Consulta SQL", fn: "run_sql", call: "SELECT total FROM orders …", ok: "1 fila · total = 4820", err: "error · tabla no encontrada" },
  ],
  n3phaseButtons: ["Pregunta", "Llamado", "Resultado", "Respuesta"],
  n3phaseNotes: [
    "La conversación arranca con la pregunta del usuario.",
    "El modelo escribe un llamado y se detiene — la generación está en pausa, esperando.",
    "El resultado del runtime se añade como un turno `tool` nuevo, de vuelta en el hilo.",
    "El modelo lee todo, incluido el resultado, y escribe la respuesta.",
  ],
  n3roleUser: "USUARIO",
  n3roleAssistant: "ASISTENTE",
  n3roleTool: "TOOL",
  n3userText: "¿Qué clima hace en Lima?",
  n3callName: "get_weather",
  n3callArgs: '{ "city": "Lima" }',
  n3resultText: '{ "tempC": 19 }',
  n3answerText: "Ahora en Lima hay 19°C y está despejado.",
  n3contextLabel: "CONTEXTO · crece cada turno",
  n3pauseLabel: "PAUSA · generación suspendida",
  n3loopLabel: "puede repetirse",
  deeperTitle: "¿Qué hace confiable a un llamado a herramienta?",
  deeperBody: "Por dentro no hay ningún mecanismo nuevo — solo la plantilla de chat más el decodificado restringido. Durante el ajuste fino se le muestran al modelo miles de conversaciones donde una secuencia de tokens especiales (cosas como `<|tool_call|>` en la plantilla de chat) precede a un objeto JSON, así que aprende *cuándo* emitir uno. En inferencia el muestreador se restringe al esquema JSON de la herramienta: en cada paso, solo se permiten los tokens que mantienen la salida válida frente a la gramática, y por eso los `arguments` siempre parsean en vez de salir a veces como JSON roto. El runtime detecta el token especial de cierre, deja de muestrear, despacha el llamado parseado, y añade el valor de retorno como un mensaje con rol `tool` — las APIs de los proveedores (function calling de OpenAI, tool use de Anthropic) son envoltorios finos sobre exactamente esto. Los modelos también pueden emitir *varios* llamados en un turno (uso paralelo de herramientas), y todo es sin estado: el modelo no aprende nada entre turnos, solo relee un hilo un poco más largo. Un 'agente' es este bucle — llama, lee el resultado, quizá llama otra vez, y al final responde — corrido hasta que el modelo decide que terminó.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un llamado a herramienta pausa el modelo, ejecuta código y devuelve el resultado. ¿Dónde ocurre entonces el razonamiento sobre ese resultado — en la herramienta o en el modelo?",
  explainA: "En el modelo. La herramienta es tonta: toma argumentos estructurados y devuelve bytes — una temperatura, una suma, una fila de datos. Todo el razonamiento sobre *si* llamarla, *qué* argumentos pasar y *qué significa* el resultado ocurre dentro del bucle normal de próximo token del modelo. El llamado, la pausa y el resultado devuelto son solo más tokens añadidos al contexto; cuando la generación se reanuda, el modelo hace exactamente lo que siempre hace — predecir el próximo token a partir de todo lo que puede ver. Un 'agente' no es nada más exótico que este bucle corrido unas cuantas veces: llama, lee el resultado, quizá llama otra vez, y al final responde.",
  bridgeLabel: "SIGUIENTE: BÚSQUEDA EN TIEMPO DE INFERENCIA",
  bridgeBody: "Un llamado, y luego una respuesta. Pero los problemas difíciles requieren muchos intentos — probar un enfoque, revisar el resultado, retroceder, probar otro. Sigue la **búsqueda en tiempo de inferencia**: gastar cómputo extra al responder para explorar varios caminos de razonamiento y quedarse con el mejor.",
  prevLesson: "Atrás: tokens de razonamiento",
  nextLesson: "Continuar a búsqueda en tiempo de inferencia",
};
