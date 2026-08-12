/**
 * Stage 0 · 1.1 — Special tokens & chat templates. Interface + EN/ES copy for
 * the article, isolated from every other lesson so edits here never touch
 * theirs.
 *
 * One idea: a chat is turned into ONE long formatted string, with reserved
 * control tokens marking who is speaking (system / user / assistant). Builds on
 * the token-dictionary lesson (a token = one entry / one integer ID); does not
 * re-teach it.
 */
import type { WsNodeCopy } from "./shared";

export interface SpecialTokensLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  // Node 1 — roles as data
  n1roles: string[]; //     segmented labels [System, User, Assistant]
  // Node 2 — the template
  n2systemLabel: string;
  n2userLabel: string;
  n2templates: string[]; // [ChatML, Llama 3]
  n2showIds: string;
  n2piecesWord: string; //  "reserved tokens" (for "N reserved tokens")
  n2genLabel: string; //    "← model writes here"
  n2msgsWord: string; //    "messages" (for "N messages → 1 string")
  n2stringWord: string; //  "1 string"
  // Node 3 — one reserved id
  n3plainLabel: string;
  n3reservedLabel: string;
  n3tokensWord: string; //  "characters" (plain-text pieces, not real tokens)
  n3oneToken: string; //    "1 token"
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

export const specialTokensEN: SpecialTokensLesson = {
  crumb: "STAGE 0 · 1.1 · SPECIAL TOKENS",
  eyebrow: "STAGE 0 · 1.1 · 3 NODES",
  title: "Special tokens & chat templates",
  lede: "You know a token is one entry in a fixed dictionary. So how does a whole conversation — system, you, the model — become tokens? It's folded into one long formatted string, with reserved control tokens marking who is speaking.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Roles as a list", "List → one string", "One reserved ID"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "A chat starts as a list, not a screen",
      intro: "Your chat app shows tidy bubbles. What it hands the model is plainer: a list of items, each tagged with a role and the content that was said.",
      bullets: [
        "**Three roles.** `system` sets the standing rules, `user` is you, `assistant` is the model. Every message is exactly one of these.",
        "**Order is the memory.** The list is read top to bottom; the model always writes the *last* turn — an empty `assistant` slot waiting to be filled.",
        "**It's just data.** No colours, no bubbles — an array of `{role, content}` objects, exactly what your app's API sends.",
      ],
      cardLabel: "THE CONVERSATION ARRAY",
      aria: "Three stacked cards — a system, user and assistant message — with the selected role highlighted.",
      steps: 3,
      captions: [
        "system — the standing instructions the model follows for the whole chat.",
        "user — the message a person actually typed.",
        "assistant — the model's reply; the final one is written last.",
      ],
      hint: "Tap a role to see what it's for — the model always answers as the final assistant turn.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "system — the standing instructions: who the model is and the rules it follows for the whole chat. Usually set once, first.",
        "user — your message. In a real app this is the only part a person types.",
        "assistant — the model's own turns. The final one is left blank; that blank is what the model fills in.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The template folds the list into one string",
      intro: "A chat template is a small function. It walks the list and emits one flat string, wrapping every turn in reserved control tokens that mark where it starts, who is speaking, and where it ends.",
      bullets: [
        "**Every turn gets delimiters** — an opener, the role name, the content, then a closer — repeated for each message.",
        "**This exact shape is ChatML** (`<|im_start|>` … `<|im_end|>`). Llama does the same job with different tokens — switch below.",
        "**The string ends with an empty assistant opener.** That trailing delimiter is the model's cue to start writing its reply.",
      ],
      cardLabel: "LIST → TEMPLATE → ONE STRING",
      aria: "The conversation rendered as one flat string, with the reserved control tokens highlighted.",
      steps: 1,
      captions: ["Edit a message or switch the template — the single rendered string rebuilds, control tokens highlighted."],
      hint: "Edit the user line, switch templates, or reveal the IDs — the green pieces are the reserved control tokens.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "ChatML — the format GPT-style models use. `<|im_start|>role` opens a turn and `<|im_end|>` closes it.",
        "Llama 3 — same idea, different tokens: `<|start_header_id|>role<|end_header_id|>` opens a turn, `<|eot_id|>` ends it, after a one-time `<|begin_of_text|>`.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "A control token is one entry, not a word",
      intro: "A token is one entry in the dictionary — one integer ID (the token-dictionary lesson). Control tokens are extra, reserved entries in that same dictionary.",
      bullets: [
        "**As plain text it's a dozen pieces.** If `<|im_start|>` were ordinary characters, the tokenizer would shatter it into many little tokens.",
        "**As a reserved token it's exactly one ID.** The dictionary holds a single dedicated entry — one integer the model reads instantly.",
        "**That's what keeps structure safe.** A user can type the characters `<|im_start|>`, but they stay ordinary text — never the real control token — so nobody can fake a system turn.",
      ],
      cardLabel: "PLAIN TEXT vs RESERVED TOKEN",
      aria: "The same delimiter shown two ways: split into many character tokens, and as one reserved id.",
      steps: 3,
      captions: [
        "<|im_start|> — begins a turn.",
        "<|im_end|> — ends a turn.",
        "<|endoftext|> — marks a document boundary.",
      ],
      hint: "Pick a control token — the left panel is what it would cost as plain text, the right is its single reserved ID.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "<|im_start|> — opens a turn and is followed by the role name. One reserved id: 100264.",
        "<|im_end|> — closes a turn so the next one can begin. One reserved id: 100265.",
        "<|endoftext|> — marks the boundary between whole documents in training. One reserved id: 100257.",
      ],
    },
  ],
  n1roles: ["System", "User", "Assistant"],
  n2systemLabel: "SYSTEM",
  n2userLabel: "USER · edit me",
  n2templates: ["ChatML", "Llama 3"],
  n2showIds: "Show token IDs",
  n2piecesWord: "reserved tokens",
  n2genLabel: "← model writes here",
  n2msgsWord: "messages",
  n2stringWord: "1 string",
  n3plainLabel: "AS PLAIN TEXT",
  n3reservedLabel: "RESERVED TOKEN",
  n3tokensWord: "characters",
  n3oneToken: "1 token",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Your app shows separate bubbles for system, user and assistant. What does the model actually receive?",
  explainA: "One flat string. A **chat template** walks the list of `{role, content}` items and renders them into a single sequence, wrapping each turn in reserved **control tokens** — `<|im_start|>` … `<|im_end|>` in ChatML — that mark where a turn begins, who is speaking, and where it ends. Those control tokens aren't spelled out letter by letter: each is a *single reserved entry* in the dictionary, one integer ID. That's what lets the model tell structure from content — and stops a user from faking a `system` turn just by typing the characters. The string ends with an empty `assistant` opener, and the model continues from there.",
  bridgeLabel: "NEXT · MULTI-TURN & FORMATTING",
  bridgeBody: "One exchange is now one string. Next, **multi-turn & formatting**: how longer chats, tool results, and the model's own reasoning all fold back into these same role blocks.",
  prevLesson: "Back: positional encoding",
  nextLesson: "Continue: Multi-turn & formatting",
};

/* ============================================================ SPANISH ======= */

export const specialTokensES: SpecialTokensLesson = {
  crumb: "ETAPA 0 · 1.1 · TOKENS ESPECIALES",
  eyebrow: "ETAPA 0 · 1.1 · 3 NODOS",
  title: "Tokens especiales y plantillas de chat",
  lede: "Ya sabes que un token es una entrada de un diccionario fijo. Entonces, ¿cómo se vuelve tokens una conversación entera — el sistema, tú, el modelo? Se pliega en una sola cadena larga con formato, con tokens de control reservados que marcan quién habla.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Roles como lista", "Lista → una cadena", "Un ID reservado"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Un chat empieza como lista, no como pantalla",
      intro: "Tu app de chat muestra burbujas prolijas. Lo que le entrega al modelo es más simple: una lista de elementos, cada uno etiquetado con un rol y el contenido que se dijo.",
      bullets: [
        "**Tres roles.** `system` fija las reglas permanentes, `user` eres tú, `assistant` es el modelo. Cada mensaje es exactamente uno de estos.",
        "**El orden es la memoria.** La lista se lee de arriba abajo; el modelo siempre escribe el *último* turno — un hueco `assistant` vacío esperando ser llenado.",
        "**Son solo datos.** Sin colores, sin burbujas — un arreglo de objetos `{role, content}`, justo lo que envía la API de tu app.",
      ],
      cardLabel: "EL ARREGLO DE LA CONVERSACIÓN",
      aria: "Tres tarjetas apiladas — un mensaje de sistema, de usuario y de asistente — con el rol seleccionado resaltado.",
      steps: 3,
      captions: [
        "system — las instrucciones permanentes que el modelo sigue en todo el chat.",
        "user — el mensaje que una persona escribió de verdad.",
        "assistant — la respuesta del modelo; la última se escribe al final.",
      ],
      hint: "Toca un rol para ver para qué sirve — el modelo siempre responde como el turno final de assistant.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "system — las instrucciones permanentes: quién es el modelo y las reglas que sigue en todo el chat. Se fija una vez, al inicio.",
        "user — tu mensaje. En una app real, es la única parte que teclea una persona.",
        "assistant — los turnos propios del modelo. El último queda en blanco; ese blanco es lo que el modelo rellena.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "La plantilla pliega la lista en una cadena",
      intro: "Una plantilla de chat es una función pequeña. Recorre la lista y emite una sola cadena plana, envolviendo cada turno en tokens de control reservados que marcan dónde empieza, quién habla y dónde termina.",
      bullets: [
        "**Cada turno lleva delimitadores** — un abridor, el nombre del rol, el contenido y un cierre — repetidos por cada mensaje.",
        "**Esta forma exacta es ChatML** (`<|im_start|>` … `<|im_end|>`). Llama hace lo mismo con otros tokens — cámbialo abajo.",
        "**La cadena termina con un abridor de assistant vacío.** Ese delimitador final es la señal para que el modelo empiece a escribir su respuesta.",
      ],
      cardLabel: "LISTA → PLANTILLA → UNA CADENA",
      aria: "La conversación renderizada como una sola cadena plana, con los tokens de control reservados resaltados.",
      steps: 1,
      captions: ["Edita un mensaje o cambia la plantilla — la cadena renderizada se reconstruye, con los tokens de control resaltados."],
      hint: "Edita la línea del usuario, cambia de plantilla o revela los IDs — las piezas verdes son los tokens de control reservados.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "ChatML — el formato que usan los modelos estilo GPT. `<|im_start|>rol` abre un turno y `<|im_end|>` lo cierra.",
        "Llama 3 — la misma idea, otros tokens: `<|start_header_id|>rol<|end_header_id|>` abre un turno, `<|eot_id|>` lo termina, tras un único `<|begin_of_text|>`.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Un token de control es una entrada, no una palabra",
      intro: "Un token es una entrada del diccionario — un ID entero (la lección del diccionario de tokens). Los tokens de control son entradas extra, reservadas, en ese mismo diccionario.",
      bullets: [
        "**Como texto plano son una docena de piezas.** Si `<|im_start|>` fuera caracteres normales, el tokenizador lo haría añicos en muchos tokencitos.",
        "**Como token reservado es exactamente un ID.** El diccionario tiene una sola entrada dedicada — un entero que el modelo lee al instante.",
        "**Eso mantiene segura la estructura.** Un usuario puede teclear los caracteres `<|im_start|>`, pero quedan como texto normal — nunca el token de control real — así nadie puede falsear un turno de sistema.",
      ],
      cardLabel: "TEXTO PLANO vs TOKEN RESERVADO",
      aria: "El mismo delimitador mostrado de dos formas: partido en muchos tokens de caracteres, y como un id reservado.",
      steps: 3,
      captions: [
        "<|im_start|> — comienza un turno.",
        "<|im_end|> — termina un turno.",
        "<|endoftext|> — marca el límite de un documento.",
      ],
      hint: "Elige un token de control — el panel izquierdo es lo que costaría como texto plano, el derecho es su único ID reservado.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "<|im_start|> — abre un turno y va seguido del nombre del rol. Un id reservado: 100264.",
        "<|im_end|> — cierra un turno para que el siguiente pueda empezar. Un id reservado: 100265.",
        "<|endoftext|> — marca el límite entre documentos enteros en el entrenamiento. Un id reservado: 100257.",
      ],
    },
  ],
  n1roles: ["System", "User", "Assistant"],
  n2systemLabel: "SYSTEM",
  n2userLabel: "USER · edítame",
  n2templates: ["ChatML", "Llama 3"],
  n2showIds: "Ver IDs de token",
  n2piecesWord: "tokens reservados",
  n2genLabel: "← el modelo escribe aquí",
  n2msgsWord: "mensajes",
  n2stringWord: "1 cadena",
  n3plainLabel: "COMO TEXTO PLANO",
  n3reservedLabel: "TOKEN RESERVADO",
  n3tokensWord: "caracteres",
  n3oneToken: "1 token",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Tu app muestra burbujas separadas para sistema, usuario y asistente. ¿Qué recibe en realidad el modelo?",
  explainA: "Una sola cadena plana. Una **plantilla de chat** recorre la lista de elementos `{role, content}` y los renderiza en una sola secuencia, envolviendo cada turno en **tokens de control** reservados — `<|im_start|>` … `<|im_end|>` en ChatML — que marcan dónde empieza un turno, quién habla y dónde termina. Esos tokens de control no se deletrean letra por letra: cada uno es una *única entrada reservada* del diccionario, un ID entero. Eso es lo que deja al modelo distinguir estructura de contenido — e impide que un usuario falsee un turno `system` solo tecleando los caracteres. La cadena termina con un abridor `assistant` vacío, y el modelo continúa desde ahí.",
  bridgeLabel: "SIGUIENTE · MULTITURNO Y FORMATO",
  bridgeBody: "Un intercambio ya es una sola cadena. Sigue **multiturno y formato**: cómo los chats largos, los resultados de herramientas y el propio razonamiento del modelo se pliegan de vuelta en estos mismos bloques de rol.",
  prevLesson: "Atrás: codificación posicional",
  nextLesson: "Continuar: Multiturno y formato",
};
