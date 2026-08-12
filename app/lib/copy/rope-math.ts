/**
 * Stage 0 · 1.3 — RoPE (rotary position embedding), the math. Interface +
 * EN/ES copy for the article, isolated from every other lesson so edits here
 * never touch theirs.
 *
 * One idea: RoPE encodes position by ROTATING each token's query and key
 * vectors by an angle set by its position — so when two tokens are compared,
 * only the difference in their positions matters (relative distance for free).
 * Builds on the positional-encoding lesson (why order needs tagging at all).
 */
import type { WsNodeCopy } from "./shared";

export interface RopeMathLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — spin by position
  n1posLabel: string; //    slider "TOKEN POSITION m"
  n1freqLabel: string; //   segmented group label
  n1freqs: string[]; //     [Fast pair, Medium pair, Slow pair]
  n1startLabel: string; //  diagram: "position 0" ghost arrow
  n1nowLabel: string; //    diagram: "position m" live arrow
  n1angleWord: string; //   diagram sweep label, e.g. "turn"

  // Node 2 — only the gap survives
  n2qLabel: string; //      slider "QUERY position m"
  n2kLabel: string; //      slider "KEY position n"
  n2shift: string; //       button "Shift both +1"
  n2queryWord: string; //   diagram "query"
  n2keyWord: string; //     diagram "key"
  n2gapWord: string; //     diagram "gap = m − n"
  n2matchWord: string; //   diagram "match"

  // Node 3 — rotate vs add
  n3posLabel: string; //    slider driving both panels
  n3addTitle: string; //    panel A title
  n3rotTitle: string; //    panel B title
  n3vWord: string; //       "token"
  n3posWord: string; //     "position"
  n3sumWord: string; //     "result"
  n3lenLabel: string; //    "length"
  n3changed: string; //     "length changed"
  n3kept: string; //        "length kept"

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

export const ropeMathEN: RopeMathLesson = {
  crumb: "STAGE 0 · 1.3 · ROPE, THE MATH",
  eyebrow: "STAGE 0 · 1.3 · 3 NODES",
  title: "RoPE: position as rotation",
  lede: "Earlier you saw that attention is order-blind, so every token gets tagged with its position. RoPE does that tagging with a twist — literally. It rotates each token's vector by an angle set by where it sits, and out of that one move relative distance falls out for free.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Spin by position", "Only the gap survives", "Rotate, don't add"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Spin the vector by its position",
      intro: "RoPE tags a token's position by rotating its vector — the further along the token sits, the more its vector turns.",
      bullets: [
        "**Attention uses two vectors per token** — a *query* (what this token is looking for) and a *key* (what it offers). RoPE splits each into 2D pairs, an (x, y) at a time.",
        "**Each pair spins by an angle set by position.** At position m the pair turns by m·θ — token 0 sits untouched, token 5 is turned five steps.",
        "**Different pairs spin at different speeds.** Some coordinates turn fast, others slowly — together they pin position exactly, like the fast and slow hands of a clock.",
        "**The length never changes — only the angle.** A rotation just points the vector a new way; it never makes it longer or shorter.",
      ],
      cardLabel: "ONE 2D PAIR ON THE DIAL",
      aria: "A dial showing one vector rotating from its position-0 direction to its rotated position, with the swept angle marked.",
      steps: 1,
      captions: ["Drag the position — the arrow turns further the later the token sits."],
      hint: "Drag the position, then switch the pair — the fast pair whips around, the slow pair barely moves.",
      readoutTitle: "ROTATION",
      rows: ["POSITION", "ANGLE", "LENGTH"],
      readoutNote: "Position m turns the vector by m·θ. The angle grows with position, but the length is fixed — rotation never stretches it.",
      optionNotes: [
        "Fast pair — a large θ per step, so the arrow whips around; a few positions already send it most of the way around the dial. These pairs tell nearby positions apart.",
        "Medium pair — a moderate θ per step. A middle-of-the-road turn rate that resolves positions a handful of tokens apart.",
        "Slow pair — a tiny θ per step, so the arrow barely creeps. These pairs stay distinct across long distances — the coarse hand that never wraps.",
      ],
      sliderNote: "Position m is which slot the token sits in. Raise it and the pair turns by more (m·θ) — but its length stays exactly the same.",
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Only the gap survives",
      intro: "Put a query and a key on the same dial. Attention compares them with a dot product — and once both are rotated by their positions, that comparison depends only on the distance between them.",
      bullets: [
        "**A dot product is a match score** — large when two vectors point the same way, small when they point apart. It's how attention decides which tokens matter to each other.",
        "**Rotating both leaves the angle between them = (m − n)·θ.** The absolute positions cancel out; only the gap m − n remains.",
        "**Slide both the same amount and nothing changes.** Shift the whole pair down the sentence and the match holds — RoPE is relative by construction.",
        "**That's the whole trick.** The model learns 'three tokens back', never 'the token at index 812'.",
      ],
      cardLabel: "QUERY vs KEY · ANGLE BETWEEN THEM",
      aria: "A dial with a query arrow and a key arrow; the angle between them is marked, along with the resulting match score.",
      steps: 1,
      captions: ["Move each position — the angle between the arrows is set purely by the gap m − n."],
      hint: "Move the two positions, then hit Shift both — the gap, the angle, and the match don't budge.",
      readoutTitle: "RELATIVE_SCORE",
      rows: ["GAP m−n", "ANGLE", "MATCH"],
      readoutNote: "The match score is cos of the angle between query and key. Shift both positions together and every row here stays frozen — only the gap matters.",
      optionNotes: [
        "Query position m — where the token doing the looking sits. On its own it just spins the green arrow; only its distance from the key changes the score.",
        "Key position n — where the token being looked at sits. Spin it and the amber arrow moves; again only the gap m − n reaches the score.",
        "Shift both +1 — slides the whole pair one step down the sentence. Both arrows turn, but the angle between them is unchanged — proof RoPE only sees relative distance.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Rotate, don't add",
      intro: "The older fix added a position vector on top of the token. RoPE rotates instead — and that one change keeps the vector's strength clean.",
      bullets: [
        "**Add (the old way):** glue a position vector onto the token. The result points a new way and changes length — so 'where it is' leaks into 'how strong it is'.",
        "**Rotate (RoPE):** spin the token instead. Same length, new angle — position rides purely in the direction.",
        "**Length is signal.** The dot product multiplies lengths, so a wobbling length is noise the model has to fight through.",
        "**Rotation is *orthogonal*** — the math word for a move that never stretches. Position gets encoded for free, with nothing added to the magnitude.",
      ],
      cardLabel: "ADD A VECTOR vs ROTATE IT",
      aria: "Two panels side by side: adding a position vector changes the token's length, while rotating it keeps the length identical.",
      steps: 1,
      captions: ["Drag the position — the added vector stretches the arrow; the rotated one keeps its length."],
      hint: "Drag the position and watch the two lengths — the left one drifts, the right one is pinned.",
      readoutTitle: "LENGTH",
      rows: ["ADD", "ROTATE"],
      readoutNote: "Both panels start from the same token. Adding a position vector changes its length as position grows; rotating leaves the length identical at every position.",
      sliderNote: "Position feeds both panels at once. On the left the position vector is added on; on the right the token is rotated by the same amount.",
    },
  ],
  n1posLabel: "TOKEN POSITION m",
  n1freqLabel: "WHICH PAIR",
  n1freqs: ["Fast pair", "Medium pair", "Slow pair"],
  n1startLabel: "position 0",
  n1nowLabel: "position m",
  n1angleWord: "turn",
  n2qLabel: "QUERY position m",
  n2kLabel: "KEY position n",
  n2shift: "Shift both +1",
  n2queryWord: "query",
  n2keyWord: "key",
  n2gapWord: "gap",
  n2matchWord: "match",
  n3posLabel: "TOKEN POSITION",
  n3addTitle: "ADD A POSITION VECTOR",
  n3rotTitle: "ROTATE (RoPE)",
  n3vWord: "token",
  n3posWord: "position",
  n3sumWord: "result",
  n3lenLabel: "length",
  n3changed: "length changed",
  n3kept: "length kept",
  deeperTitle: "Go deeper: why the gap is all that's left",
  deeperBody:
    "Take one 2D pair. Rotating the query `q` at position `m` and the key `k` at position `n` means multiplying each by a rotation matrix `R(mθ) = [[cos mθ, −sin mθ], [sin mθ, cos mθ]]`. The attention score is the dot product of the rotated vectors: `(R(mθ)q) · (R(nθ)k) = qᵀ R(mθ)ᵀ R(nθ) k`. Because a rotation matrix is *orthogonal* (`Rᵀ = R⁻¹`), `R(mθ)ᵀ R(nθ) = R((n − m)θ)` — a single rotation by the gap. So the score equals `qᵀ R((n − m)θ) k`, a function of `n − m` alone. Orthogonality also means `‖R(mθ)q‖ = ‖q‖`, so no magnitude is ever added. Real models stack dozens of pairs, each with its own `θ_i = base^(−2i/d)` (base is usually 10000), giving the spread of fast-to-slow turn rates you switched between in node 1.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Two tokens sit at positions 5 and 8. Someone inserts three tokens before both, so now they're at 8 and 11. Why doesn't RoPE's attention score between them change?",
  explainA: "Because RoPE encodes position as a *rotation*, and attention compares the two tokens with a dot product of their rotated vectors. Rotating the query by 8 steps and the key by 11 steps leaves an angle between them worth (11 − 8) = 3 steps — exactly the same 3-step gap as (8 − 5) before the insert. The absolute positions rotate away and only the *difference* survives, so the match score is identical. That relative-distance property is baked into the geometry, not learned — which is also why RoPE stretches to longer contexts more gracefully than a lookup table of absolute positions.",
  bridgeLabel: "NEXT: 1.4 · LONG CONTEXT",
  bridgeBody: "The gap is all RoPE keeps — but stretch the context to 100k tokens and those gaps get huge, spinning the fast pairs round and round past anything they saw in training. Next, **long context**: how models slow RoPE's rotations down to read far more text than they were trained on.",
  prevLesson: "Back: bin-packing",
  nextLesson: "Continue to long context",
};

/* ============================================================ SPANISH ======= */

export const ropeMathES: RopeMathLesson = {
  crumb: "ETAPA 0 · 1.3 · ROPE, LA MATEMÁTICA",
  eyebrow: "ETAPA 0 · 1.3 · 3 NODOS",
  title: "RoPE: la posición como rotación",
  lede: "Antes viste que la atención es ciega al orden, así que a cada token se le etiqueta su posición. RoPE hace esa etiqueta con un giro — literalmente. Rota el vector de cada token por un ángulo que marca su posición, y de ese único movimiento cae, gratis, la distancia relativa.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Girar por posición", "Solo sobrevive la brecha", "Rotar, no sumar"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Gira el vector según su posición",
      intro: "RoPE etiqueta la posición de un token rotando su vector — cuanto más adelante está el token, más gira su vector.",
      bullets: [
        "**La atención usa dos vectores por token** — una *query* (lo que este token busca) y una *key* (lo que ofrece). RoPE parte cada uno en pares 2D, un (x, y) a la vez.",
        "**Cada par gira un ángulo que marca la posición.** En la posición m el par gira m·θ — el token 0 queda intacto, el token 5 gira cinco pasos.",
        "**Distintos pares giran a distinta velocidad.** Unas coordenadas giran rápido, otras lento — juntas fijan la posición con precisión, como las manecillas rápida y lenta de un reloj.",
        "**El largo nunca cambia — solo el ángulo.** Una rotación solo apunta el vector hacia otro lado; nunca lo hace más largo ni más corto.",
      ],
      cardLabel: "UN PAR 2D EN EL DIAL",
      aria: "Un dial que muestra un vector rotando desde su dirección en la posición 0 hasta su posición rotada, con el ángulo barrido marcado.",
      steps: 1,
      captions: ["Arrastra la posición — la flecha gira más cuanto más tarde esté el token."],
      hint: "Arrastra la posición y luego cambia el par — el par rápido gira mucho, el lento apenas se mueve.",
      readoutTitle: "ROTATION",
      rows: ["POSICIÓN", "ÁNGULO", "LARGO"],
      readoutNote: "La posición m gira el vector m·θ. El ángulo crece con la posición, pero el largo es fijo — la rotación nunca lo estira.",
      optionNotes: [
        "Par rápido — un θ grande por paso, así que la flecha gira mucho; unas pocas posiciones ya la llevan casi toda la vuelta. Estos pares distinguen posiciones cercanas.",
        "Par medio — un θ moderado por paso. Una velocidad de giro intermedia que resuelve posiciones a unos pocos tokens de distancia.",
        "Par lento — un θ diminuto por paso, así que la flecha apenas avanza. Estos pares siguen distintos a lo largo de grandes distancias — la manecilla gruesa que nunca da la vuelta.",
      ],
      sliderNote: "La posición m es la ranura donde está el token. Súbela y el par gira más (m·θ) — pero su largo queda exactamente igual.",
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Solo sobrevive la brecha",
      intro: "Pon una query y una key en el mismo dial. La atención las compara con un producto punto — y una vez que ambas están rotadas por su posición, esa comparación depende solo de la distancia entre ellas.",
      bullets: [
        "**Un producto punto es una puntuación de coincidencia** — grande cuando dos vectores apuntan igual, pequeña cuando apuntan distinto. Así decide la atención qué tokens importan entre sí.",
        "**Rotar ambos deja el ángulo entre ellos = (m − n)·θ.** Las posiciones absolutas se cancelan; solo queda la brecha m − n.",
        "**Desliza ambos lo mismo y nada cambia.** Corre el par entero por la frase y la coincidencia se mantiene — RoPE es relativo por construcción.",
        "**Ese es todo el truco.** El modelo aprende 'tres tokens atrás', nunca 'el token en el índice 812'.",
      ],
      cardLabel: "QUERY vs KEY · ÁNGULO ENTRE ELLOS",
      aria: "Un dial con una flecha de query y una de key; se marca el ángulo entre ellas junto con la puntuación de coincidencia resultante.",
      steps: 1,
      captions: ["Mueve cada posición — el ángulo entre las flechas lo fija solo la brecha m − n."],
      hint: "Mueve las dos posiciones y luego pulsa Correr ambas — la brecha, el ángulo y la coincidencia no se inmutan.",
      readoutTitle: "RELATIVE_SCORE",
      rows: ["BRECHA m−n", "ÁNGULO", "MATCH"],
      readoutNote: "La coincidencia es el coseno del ángulo entre query y key. Corre ambas posiciones juntas y cada fila aquí queda congelada — solo importa la brecha.",
      optionNotes: [
        "Posición de query m — dónde está el token que mira. Por sí sola solo gira la flecha verde; solo su distancia a la key cambia la puntuación.",
        "Posición de key n — dónde está el token mirado. Gírala y la flecha ámbar se mueve; de nuevo solo la brecha m − n llega a la puntuación.",
        "Correr ambas +1 — desliza el par entero un paso por la frase. Ambas flechas giran, pero el ángulo entre ellas no cambia — prueba de que RoPE solo ve distancia relativa.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Rotar, no sumar",
      intro: "El arreglo antiguo sumaba un vector de posición encima del token. RoPE rota en su lugar — y ese solo cambio mantiene limpia la fuerza del vector.",
      bullets: [
        "**Sumar (lo antiguo):** pega un vector de posición sobre el token. El resultado apunta distinto y cambia de largo — así 'dónde está' se filtra en 'qué tan fuerte es'.",
        "**Rotar (RoPE):** gira el token en su lugar. Mismo largo, nuevo ángulo — la posición viaja puramente en la dirección.",
        "**El largo es señal.** El producto punto multiplica largos, así que un largo que tiembla es ruido contra el que el modelo tiene que pelear.",
        "**La rotación es *ortogonal*** — la palabra matemática para un movimiento que nunca estira. La posición se codifica gratis, sin sumar nada a la magnitud.",
      ],
      cardLabel: "SUMAR UN VECTOR vs ROTARLO",
      aria: "Dos paneles lado a lado: sumar un vector de posición cambia el largo del token, mientras que rotarlo lo deja idéntico.",
      steps: 1,
      captions: ["Arrastra la posición — el vector sumado estira la flecha; el rotado conserva su largo."],
      hint: "Arrastra la posición y observa los dos largos — el de la izquierda deriva, el de la derecha queda fijo.",
      readoutTitle: "LENGTH",
      rows: ["SUMAR", "ROTAR"],
      readoutNote: "Ambos paneles parten del mismo token. Sumar un vector de posición cambia su largo al crecer la posición; rotar deja el largo idéntico en toda posición.",
      sliderNote: "La posición alimenta ambos paneles a la vez. A la izquierda se suma el vector de posición; a la derecha se rota el token la misma cantidad.",
    },
  ],
  n1posLabel: "POSICIÓN DEL TOKEN m",
  n1freqLabel: "QUÉ PAR",
  n1freqs: ["Par rápido", "Par medio", "Par lento"],
  n1startLabel: "posición 0",
  n1nowLabel: "posición m",
  n1angleWord: "giro",
  n2qLabel: "QUERY posición m",
  n2kLabel: "KEY posición n",
  n2shift: "Correr ambas +1",
  n2queryWord: "query",
  n2keyWord: "key",
  n2gapWord: "brecha",
  n2matchWord: "match",
  n3posLabel: "POSICIÓN DEL TOKEN",
  n3addTitle: "SUMAR UN VECTOR DE POSICIÓN",
  n3rotTitle: "ROTAR (RoPE)",
  n3vWord: "token",
  n3posWord: "posición",
  n3sumWord: "resultado",
  n3lenLabel: "largo",
  n3changed: "largo cambió",
  n3kept: "largo intacto",
  deeperTitle: "Más a fondo: por qué solo queda la brecha",
  deeperBody:
    "Toma un par 2D. Rotar la query `q` en la posición `m` y la key `k` en la posición `n` significa multiplicar cada una por una matriz de rotación `R(mθ) = [[cos mθ, −sin mθ], [sin mθ, cos mθ]]`. La puntuación de atención es el producto punto de los vectores rotados: `(R(mθ)q) · (R(nθ)k) = qᵀ R(mθ)ᵀ R(nθ) k`. Como una matriz de rotación es *ortogonal* (`Rᵀ = R⁻¹`), `R(mθ)ᵀ R(nθ) = R((n − m)θ)` — una sola rotación por la brecha. Así que la puntuación es `qᵀ R((n − m)θ) k`, función solo de `n − m`. La ortogonalidad también implica `‖R(mθ)q‖ = ‖q‖`, así que nunca se suma magnitud. Los modelos reales apilan docenas de pares, cada uno con su `θ_i = base^(−2i/d)` (la base suele ser 10000), lo que da el abanico de velocidades rápido-a-lento que alternaste en el nodo 1.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Dos tokens están en las posiciones 5 y 8. Alguien inserta tres tokens antes de ambos, así que ahora están en 8 y 11. ¿Por qué no cambia la puntuación de atención de RoPE entre ellos?",
  explainA: "Porque RoPE codifica la posición como una *rotación*, y la atención compara los dos tokens con un producto punto de sus vectores rotados. Rotar la query 8 pasos y la key 11 pasos deja entre ellas un ángulo que vale (11 − 8) = 3 pasos — exactamente la misma brecha de 3 pasos que (8 − 5) antes de la inserción. Las posiciones absolutas se van rotando y solo sobrevive la *diferencia*, así que la puntuación de coincidencia es idéntica. Esa propiedad de distancia relativa está grabada en la geometría, no aprendida — y por eso RoPE se estira a contextos más largos con más gracia que una tabla de posiciones absolutas.",
  bridgeLabel: "SIGUIENTE: 1.4 · CONTEXTO LARGO",
  bridgeBody: "La brecha es todo lo que RoPE guarda — pero estira el contexto a 100k tokens y esas brechas se vuelven enormes, girando los pares rápidos vuelta tras vuelta más allá de todo lo que vieron en el entrenamiento. Sigue **el contexto largo**: cómo los modelos frenan las rotaciones de RoPE para leer mucho más texto del que fueron entrenados.",
  prevLesson: "Atrás: bin-packing",
  nextLesson: "Continuar a contexto largo",
};
