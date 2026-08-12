/**
 * Stage 0 · Reference 2·A — The attention mechanism. Interface + EN/ES copy,
 * isolated from every other lesson so edits here never touch theirs.
 *
 * ONE idea (medium depth — builds on "The transformer block", which showed that
 * a token *looks at* other tokens): HOW that look works. Each token builds three
 * little vectors — a query, a key, a value — matches its query against every
 * key to get weights, and blends the values by those weights. Softmax, residual
 * and RMSNorm are named but each gets one plain clause; the math lives in Deeper.
 */
import type { WsNodeCopy } from "./shared";

export interface AttentionMechanismLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  /** The example sentence, token by token (5 tokens). */
  tokens: string[];

  // Node 1 · Q/K/V
  n1roleLabel: string; //   control-group label ("SHOW")
  n1roles: string[]; //     [Query, Key, Value]
  n1embLabel: string; //    "embedding of" (drawn before the token word)

  // Node 2 · the match
  n2queryLabel: string; //  control-group label ("QUERY TOKEN")
  n2colScore: string; //    header over the raw-score column
  n2colWeight: string; //   header over the weight bars
  n2sumLabel: string; //    footer: "the weights sum to 100%"
  n2selfLabel: string; //   small tag on the query's own row
  /** Note template; {q} = query word, {k} = most-attended word, {p} = its %. */
  n2noteTemplate: string;
  n2deeperTitle: string;
  n2deeperBody: string;

  // Node 3 · the blend
  n3wrapperLabel: string; // the residual+norm toggle
  n3valuesLabel: string; // "weighted values"
  n3blendLabel: string; //  "blended"
  n3inputLabel: string; //  "+ input"
  n3normLabel: string; //   "normalize"
  n3outLabel: string; //    "block output"
  n3blendNote: string; //   note when the wrapper is off
  n3wrapperNote: string; // note when the wrapper is on
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

/* ============================================================ ENGLISH ======= */

export const attentionMechanismEN: AttentionMechanismLesson = {
  crumb: "STAGE 0 · REFERENCE 2·A · THE ATTENTION MECHANISM",
  eyebrow: "STAGE 0 · REFERENCE 2·A · 3 NODES",
  title: "How attention actually works",
  lede: "The transformer block showed that each token looks at the others. This is the machine that does the looking. Every token makes three little vectors — a query, a key, a value — and that's all it takes. Build them, match them, blend them.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Query, key, value", "The match", "The blend"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Every token makes three vectors",
      intro: "A token starts as one vector — its embedding, the meaning we handed it. Attention immediately splits that into three roles, each a separate small vector.",
      bullets: [
        "**Query — what I'm looking for.** The vector `bank` uses to go searching: *give me some water or place context so you know which bank I am.*",
        "**Key — what I offer.** How each token advertises itself, so other tokens' queries can find it. `river`'s key is loud about *water*.",
        "**Value — what I hand over.** The actual information a token passes along once it's been matched — separate from how it got found.",
        "**Each is just the embedding times a learned weight matrix** (`Wq`, `Wk`, `Wv`). Training picks those matrices; here they're fixed so you can read the result.",
      ],
      cardLabel: "ONE TOKEN → QUERY · KEY · VALUE",
      aria: "The token 'bank' as an embedding, split into three separate vectors: query, key, and value.",
      steps: 3,
      captions: [
        "The query: what this token is looking for in the others.",
        "The key: what this token advertises so others can find it.",
        "The value: the information it hands over when matched.",
      ],
      hint: "Switch Query / Key / Value — same token, three different vectors, three different jobs.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Query — `bank`'s search vector. It leans hard on the 'water/place' dimensions because that's the context it needs to resolve which kind of bank it is.",
        "Key — how a token makes itself findable. A query 'matches' a token by lining up with its key, so `river`'s key emphasises the same dimensions `bank` is querying for.",
        "Value — the payload. Once `bank`'s query matches `river`'s key, it's `river`'s *value* that gets pulled in — the meaning, kept separate from the matching.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "The match: query dot key → weights",
      intro: "To score how well a query fits a key, you take their dot product — multiply the two vectors position by position and add it up. A bigger number means a better match.",
      bullets: [
        "**One score per token.** The query token compares itself to every key, itself included, giving a raw score for each.",
        "**Softmax turns scores into weights.** It's a function that squashes the raw scores into positive fractions that **add up to 1** — a clean 'share of attention'.",
        "**The winner takes most of the attention.** `bank`'s query lands hardest on `river`, so most of its attention goes there — that's how it learns it's a *riverbank*.",
      ],
      cardLabel: "ATTENTION WEIGHTS · q · k → softmax",
      aria: "For the chosen query token, a bar for each token showing its attention weight after softmax.",
      steps: 5,
      captions: [
        "The query looks at 'The'.",
        "The query looks at 'bank'.",
        "The query looks at 'by'.",
        "The query looks at 'the'.",
        "The query looks at 'river'.",
      ],
      hint: "Pick the query token — watch where its attention goes. Try `bank`.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "The blend: mix the values",
      intro: "The weights are the recipe. Multiply each token's value vector by its weight and add them up — that weighted mix is what the token walks away with.",
      bullets: [
        "**A weighted average of values.** 43% of `river` plus 24% of `bank` plus a little of the rest — the vector for `bank` now carries 'river' in it.",
        "**That's the whole point of attention:** a token's vector gets updated with context pulled from the tokens it matched.",
        "**One safety wrapper.** The block adds the token's original vector back in (a *residual* — a shortcut that keeps the signal from washing out) and then **RMSNorm** rescales it to a steady size. Turn it on to see both.",
      ],
      cardLabel: "BLEND VALUES → RESIDUAL → RMSNORM",
      aria: "The value vectors mixed by their attention weights into one blended vector, then the residual and normalize steps.",
      steps: 2,
      captions: [
        "The blend alone: values mixed by their attention weights.",
        "With the wrapper: add the input back, then normalize.",
      ],
      hint: "Toggle the wrapper — see the residual shortcut and RMSNorm that every block adds.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Blend only — each token's value scaled by its attention weight, summed. This is attention's raw output: `bank`'s vector now leans toward `river`.",
        "Residual + RMSNorm — add the token's own input vector back (so nothing is lost), then rescale to a steady magnitude. Both are what let you stack blocks deep without the signal blowing up or fading away.",
      ],
    },
  ],
  tokens: ["The", "bank", "by", "the", "river"],
  n1roleLabel: "SHOW",
  n1roles: ["Query", "Key", "Value"],
  n1embLabel: "embedding of",
  n2queryLabel: "QUERY TOKEN",
  n2colScore: "q · k",
  n2colWeight: "attention weight",
  n2sumLabel: "the weights always sum to 100%",
  n2selfLabel: "query",
  n2noteTemplate: "**{q}** puts most of its attention on **{k}** — about {p}% — so it reads its meaning from there.",
  n2deeperTitle: "Why divide by √(dimension)?",
  n2deeperBody:
    "Real attention scales each score by 1/√(d_k) — the square root of the key vector's length — before the softmax. With long vectors the dot products get large, and a large gap makes softmax almost one-hot (all attention on a single token). Dividing keeps the scores in a sane range so the gradients stay useful during training. It's a numerical steadier, not a change to the idea.",
  n3wrapperLabel: "RESIDUAL + RMSNORM",
  n3valuesLabel: "weighted values",
  n3blendLabel: "blended",
  n3inputLabel: "+ input",
  n3normLabel: "normalize",
  n3outLabel: "block output",
  n3blendNote:
    "Attention's raw output: each value scaled by its weight and summed. `bank`'s vector now leans toward `river` — it has picked up its context.",
  n3wrapperNote:
    "The wrapper every block adds: the residual puts the original vector back so nothing is lost, and RMSNorm rescales to a steady size — together they let you stack dozens of blocks.",
  n3deeperTitle: "RMSNorm vs LayerNorm",
  n3deeperBody:
    "RMSNorm divides a vector by its root-mean-square — sqrt(mean(xᵢ²)) — and multiplies by a learned gain. It's a lighter cousin of LayerNorm (it skips centering the mean), which is why modern models like Llama use it: fewer operations, same steadying effect. The point is only that every block's output arrives at a predictable magnitude, so the next block sees a stable input.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "A token needs to pull in meaning from another token. Why bother with three separate vectors — query, key, value — instead of just comparing the two tokens directly?",
  explainA: "Because the three roles are genuinely different jobs, and letting the model learn each one separately is what makes attention flexible. The **query** is what a token is *looking for*; the **key** is how a token *advertises itself* to be found; and the **value** is the *information it hands over* once matched. Splitting 'how do I get found' (key) from 'what do I contribute' (value) means a token can be easy to find for one reason but pass along something else entirely — the search and the payload are decoupled. The model matches query against key with a dot product, softmaxes the scores into weights that sum to one, and blends the values by those weights. Three cheap vectors per token, and every token can gather exactly the context it needs, all in parallel.",
  bridgeLabel: "NEXT: 2·B · THE FEED-FORWARD NETWORK",
  bridgeBody: "Attention let each token gather context from the others. But mixing isn't thinking. Next, **the feed-forward network**: the small per-token network that runs after attention and actually transforms what each token now knows.",
  prevLesson: "Back: multi-turn formatting",
  nextLesson: "Continue to the feed-forward network",
};

/* ============================================================ SPANISH ======= */

export const attentionMechanismES: AttentionMechanismLesson = {
  crumb: "ETAPA 0 · REFERENCIA 2·A · EL MECANISMO DE ATENCIÓN",
  eyebrow: "ETAPA 0 · REFERENCIA 2·A · 3 NODOS",
  title: "Cómo funciona la atención de verdad",
  lede: "El bloque transformer mostró que cada token mira a los demás. Esta es la máquina que hace ese mirar. Cada token fabrica tres vectorcitos — una consulta, una clave, un valor — y con eso basta. Constrúyelos, emparéjalos, mézclalos.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Consulta, clave, valor", "El emparejamiento", "La mezcla"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Cada token fabrica tres vectores",
      intro: "Un token empieza como un solo vector — su embedding, el significado que le dimos. La atención lo divide de inmediato en tres roles, cada uno un vector pequeño aparte.",
      bullets: [
        "**Consulta — qué estoy buscando.** El vector con el que `banco` sale a buscar: *dame contexto de agua o lugar para saber qué banco soy.*",
        "**Clave — qué ofrezco.** Cómo se anuncia cada token, para que las consultas de otros lo encuentren. La clave de `río` grita *agua*.",
        "**Valor — qué entrego.** La información que un token realmente pasa una vez emparejado — separada de cómo lo encontraron.",
        "**Cada uno es solo el embedding por una matriz de pesos aprendida** (`Wq`, `Wk`, `Wv`). El entrenamiento elige esas matrices; aquí están fijas para que leas el resultado.",
      ],
      cardLabel: "UN TOKEN → CONSULTA · CLAVE · VALOR",
      aria: "El token 'banco' como embedding, dividido en tres vectores separados: consulta, clave y valor.",
      steps: 3,
      captions: [
        "La consulta: lo que este token busca en los demás.",
        "La clave: lo que este token anuncia para que otros lo encuentren.",
        "El valor: la información que entrega al ser emparejado.",
      ],
      hint: "Alterna Consulta / Clave / Valor — el mismo token, tres vectores distintos, tres trabajos distintos.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Consulta — el vector de búsqueda de `banco`. Se apoya fuerte en las dimensiones de 'agua/lugar' porque es el contexto que necesita para resolver qué tipo de banco es.",
        "Clave — cómo un token se hace localizable. Una consulta 'empareja' con un token al alinearse con su clave, así que la clave de `río` resalta las mismas dimensiones que `banco` consulta.",
        "Valor — la carga útil. Una vez que la consulta de `banco` empareja con la clave de `río`, es el *valor* de `río` lo que se trae — el significado, mantenido aparte del emparejamiento.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "El emparejamiento: consulta · clave → pesos",
      intro: "Para puntuar qué tan bien encaja una consulta con una clave, tomas su producto punto — multiplicas los dos vectores posición por posición y sumas. Un número mayor significa mejor coincidencia.",
      bullets: [
        "**Un puntaje por token.** El token-consulta se compara con cada clave, incluida la suya, dando un puntaje crudo para cada uno.",
        "**Softmax convierte puntajes en pesos.** Es una función que aplasta los puntajes crudos en fracciones positivas que **suman 1** — un 'reparto de atención' limpio.",
        "**El ganador se lleva casi toda la atención.** La consulta de `banco` cae con más fuerza en `río`, así que la mayor parte de su atención va ahí — así aprende que es una *orilla de río*.",
      ],
      cardLabel: "PESOS DE ATENCIÓN · c · k → softmax",
      aria: "Para el token-consulta elegido, una barra por cada token que muestra su peso de atención tras softmax.",
      steps: 5,
      captions: [
        "La consulta mira a 'El'.",
        "La consulta mira a 'banco'.",
        "La consulta mira a 'junto'.",
        "La consulta mira a 'al'.",
        "La consulta mira a 'río'.",
      ],
      hint: "Elige el token-consulta — mira a dónde va su atención. Prueba `banco`.",
      readoutTitle: "",
      rows: [],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "La mezcla: combina los valores",
      intro: "Los pesos son la receta. Multiplica el vector de valor de cada token por su peso y súmalos — esa mezcla ponderada es lo que el token se lleva.",
      bullets: [
        "**Un promedio ponderado de valores.** 43% de `río` más 24% de `banco` más un poco del resto — el vector de `banco` ahora lleva 'río' dentro.",
        "**Ese es todo el punto de la atención:** el vector de un token se actualiza con el contexto que trajo de los tokens que emparejó.",
        "**Una envoltura de seguridad.** El bloque vuelve a sumar el vector original del token (un *residual* — un atajo que evita que la señal se diluya) y luego **RMSNorm** lo reescala a un tamaño estable. Actívala para ver ambos.",
      ],
      cardLabel: "MEZCLAR VALORES → RESIDUAL → RMSNORM",
      aria: "Los vectores de valor mezclados por sus pesos de atención en un vector combinado, luego los pasos de residual y normalización.",
      steps: 2,
      captions: [
        "Solo la mezcla: valores combinados por sus pesos de atención.",
        "Con la envoltura: suma la entrada de vuelta, luego normaliza.",
      ],
      hint: "Alterna la envoltura — mira el atajo residual y el RMSNorm que añade cada bloque.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Solo la mezcla — el valor de cada token escalado por su peso de atención, sumado. Esta es la salida cruda de la atención: el vector de `banco` ahora se inclina hacia `río`.",
        "Residual + RMSNorm — vuelve a sumar el vector de entrada del propio token (para no perder nada) y luego reescala a una magnitud estable. Ambos son lo que te deja apilar bloques en profundidad sin que la señal explote o se apague.",
      ],
    },
  ],
  tokens: ["El", "banco", "junto", "al", "río"],
  n1roleLabel: "MOSTRAR",
  n1roles: ["Consulta", "Clave", "Valor"],
  n1embLabel: "embedding de",
  n2queryLabel: "TOKEN-CONSULTA",
  n2colScore: "c · k",
  n2colWeight: "peso de atención",
  n2sumLabel: "los pesos siempre suman 100%",
  n2selfLabel: "consulta",
  n2noteTemplate: "**{q}** pone la mayor parte de su atención en **{k}** — cerca del {p}% — así que lee su significado desde ahí.",
  n2deeperTitle: "¿Por qué dividir entre √(dimensión)?",
  n2deeperBody:
    "La atención real escala cada puntaje por 1/√(d_k) — la raíz cuadrada del largo del vector de clave — antes del softmax. Con vectores largos los productos punto se hacen grandes, y una brecha grande vuelve al softmax casi de una sola opción (toda la atención en un token). Dividir mantiene los puntajes en un rango sano para que los gradientes sigan siendo útiles durante el entrenamiento. Es un estabilizador numérico, no un cambio en la idea.",
  n3wrapperLabel: "RESIDUAL + RMSNORM",
  n3valuesLabel: "valores ponderados",
  n3blendLabel: "mezclado",
  n3inputLabel: "+ entrada",
  n3normLabel: "normalizar",
  n3outLabel: "salida del bloque",
  n3blendNote:
    "La salida cruda de la atención: cada valor escalado por su peso y sumado. El vector de `banco` ahora se inclina hacia `río` — recogió su contexto.",
  n3wrapperNote:
    "La envoltura que añade cada bloque: el residual devuelve el vector original para no perder nada, y RMSNorm reescala a un tamaño estable — juntos te dejan apilar decenas de bloques.",
  n3deeperTitle: "RMSNorm vs LayerNorm",
  n3deeperBody:
    "RMSNorm divide un vector por su raíz cuadrática media — sqrt(promedio(xᵢ²)) — y multiplica por una ganancia aprendida. Es un primo más ligero de LayerNorm (se salta centrar la media), por eso los modelos modernos como Llama lo usan: menos operaciones, el mismo efecto estabilizador. El punto es solo que la salida de cada bloque llega con una magnitud predecible, para que el siguiente bloque vea una entrada estable.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Un token necesita traer significado de otro token. ¿Por qué molestarse con tres vectores separados — consulta, clave, valor — en vez de comparar los dos tokens directamente?",
  explainA: "Porque los tres roles son trabajos genuinamente distintos, y dejar que el modelo aprenda cada uno por separado es lo que hace flexible a la atención. La **consulta** es lo que un token *busca*; la **clave** es cómo un token *se anuncia* para ser encontrado; y el **valor** es la *información que entrega* una vez emparejado. Separar 'cómo me encuentran' (clave) de 'qué aporto' (valor) permite que un token sea fácil de encontrar por una razón pero pase algo totalmente distinto — la búsqueda y la carga útil quedan desacopladas. El modelo empareja consulta contra clave con un producto punto, aplica softmax a los puntajes para volverlos pesos que suman uno, y mezcla los valores por esos pesos. Tres vectores baratos por token, y cada token puede reunir justo el contexto que necesita, todo en paralelo.",
  bridgeLabel: "SIGUIENTE: 2·B · LA RED FEED-FORWARD",
  bridgeBody: "La atención dejó que cada token reuniera contexto de los demás. Pero mezclar no es pensar. Sigue **la red feed-forward**: la pequeña red por token que corre después de la atención y de verdad transforma lo que cada token ahora sabe.",
  prevLesson: "Atrás: formato multironda",
  nextLesson: "Continuar a la red feed-forward",
};
