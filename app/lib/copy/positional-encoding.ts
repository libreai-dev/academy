/**
 * Stage 0 · 1.3 — Positional encoding. Interface + EN/ES copy for the article,
 * isolated from every other lesson so edits here never touch theirs. All
 * user-facing text lives here (both languages, full parity). The numeric data
 * and vector maths live in app/lib/positional-encoding.ts.
 *
 * One idea: attention, by itself, ignores word order — so a position signal is
 * ADDED to every token vector to tell "dog bites man" from "man bites dog".
 * Builds on the embedding lesson (each token is already a vector). The RoPE
 * maths is out of scope on purpose — it's a separate Expert lesson.
 */
import type { WsNodeCopy } from "./shared";

export interface PositionalEncodingLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];
  /** The three demo words: [noun A, verb, noun B]. Reordered by index. */
  words: string[];
  // Node 1 — order changes meaning
  n1roles: string[]; //     [AGENT, ACTION, TARGET] tags under the chips
  n1arcLabel: string; //    "acts on" — the arrow from agent to target
  n1verdicts: string[]; //  one plain reading per ordering (index-aligned)
  // Node 2 — attention is order-blind
  n2wroteLabel: string; //  "YOU WROTE"
  n2dropLabel: string; //   "attention drops position"
  n2bagLabel: string; //    "WHAT ATTENTION SEES · a bag of tokens"
  n2sameTag: string; //     "same set — no order"
  // Node 3 — adding position
  n3peToggle: string; //    "POSITION SIGNAL"
  n3posLabel: string; //    "SLOT"
  n3word: string; //        the single demo token, e.g. "dog"
  n3meaningLabel: string; //"meaning"
  n3plusLabel: string; //   "+ position"
  n3equalsLabel: string; // "= model reads"
  n3offWord: string; //     "off"
  n3onNote: string; //      note shown while the signal is on
  n3offNote: string; //     note shown while the signal is off
  n3onTagFmt: string; //    in-diagram tag when on: "{p}" is the slot number
  n3offTag: string; //      in-diagram tag when off
  n3deeperTitle: string;
  n3deeperBody: string;
  // wrap-up
  explainLabel: string;
  explainQ: string;
  explainA: string;
  bridgeLabel: string;
  bridgeBody: string;
  prevLesson: string;
  nextLesson: string;
}

/* ============================================================ ENGLISH ======= */

export const positionalEncodingEN: PositionalEncodingLesson = {
  crumb: "STAGE 0 · 1.3 · POSITIONAL ENCODING",
  eyebrow: "STAGE 0 · 1.3 · 3 NODES",
  title: "Positional encoding",
  lede: "Attention reads every token at once — which means, on its own, it can't tell word order apart. \"Dog bites man\" and \"man bites dog\" would look identical. Here's the small trick that puts order back: stamp each token with where it sits.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Order is meaning", "Attention is order-blind", "Stamp each token"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Same words, different order, different sentence",
      intro: "Word order isn't decoration — in English it decides who did what to whom. Rearrange the exact same three words and the meaning flips or falls apart.",
      bullets: [
        "**The first slot is the agent** — the one doing the action. The last slot is the target.",
        "**Swap them and the meaning inverts.** `dog bites man` and `man bites dog` share every word, yet mean opposite things.",
        "**Scramble further and it means nothing.** The words carry no order of their own — the *positions* do all the work.",
        "**So any model that reads text must track position** — hold that thought for the next node.",
      ],
      cardLabel: "THREE WORDS · REARRANGED",
      aria: "Three word chips shown in a chosen order, with an arrow from the agent to the target and a plain reading beneath.",
      steps: 1,
      captions: ["Pick an arrangement of the same three words and read what it now means."],
      hint: "Tap the three arrangements — the arrow always runs first → last, but who's the agent changes.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "`dog bites man` — the dog is the agent (first slot), the man is the target (last slot). An everyday, if unlucky, event.",
        "`man bites dog` — same three words, positions swapped. Now the man is biting the dog. Opposite meaning, identical vocabulary.",
        "`bites man dog` — scrambled. No arrangement of roles makes sense; the sentence collapses. Order was carrying the meaning.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "To raw attention, a sentence is just a bag",
      intro: "Attention is the mechanism that lets every token look at every other token at once. That power has a blind spot: with nothing marking position, it sees an unordered set — a bag of tokens.",
      bullets: [
        "**Attention compares tokens by content, not by slot.** It asks \"how related are these two?\", never \"which came first?\".",
        "**So different orders collapse to the same bag.** Flip the sentence on top — the bag underneath doesn't move.",
        "**A bag can't tell agent from target.** Both readings from the last node land as the *same* input.",
        "**This is why order has to be added in** — the model can't recover it on its own.",
      ],
      cardLabel: "ORDERED INPUT → UNORDERED BAG",
      aria: "An ordered row of word chips above, an arrow down, and the same chips as an unordered bag below that never changes.",
      steps: 1,
      captions: ["Change the order on top; watch the bag the model actually sees stay exactly the same."],
      hint: "Flip between the arrangements — the bag underneath is identical every time. That's the problem.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "`dog bites man` on top — but the bag is just {dog, bites, man}. Position thrown away.",
        "`man bites dog` on top — the opposite sentence, yet the very same bag {dog, bites, man}.",
        "A scramble on top — still the same bag. Every ordering melts into one unordered set.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "Add a position signal to every token",
      intro: "The fix is small and literal. Each token is already a vector (that's the embedding lesson). Before attention runs, we add a second vector that depends only on the slot — so where a token sits becomes part of what it is.",
      bullets: [
        "**meaning vector + position vector = what the model reads.** Same word, plus a stamp for its slot.",
        "**Every slot's stamp is different**, so `dog` in slot 0 and `dog` in slot 3 are now *different* vectors.",
        "**Turn the signal off** and the position row goes flat — every slot looks identical again, order lost.",
        "**With computed positions (like RoPE), nothing is stored** — the position comes from the slot number, so any length works.",
      ],
      cardLabel: "MEANING + POSITION = MODEL INPUT",
      aria: "Three stacked vectors: the token's meaning, the position signal for the chosen slot, and their sum.",
      steps: 1,
      captions: ["Switch the position signal on and move the token between slots; watch the summed vector change."],
      hint: "Toggle the signal, then change the slot — with it off, every slot gives the same bottom row.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Signal ON — each slot adds its own pattern, so the same word in different slots becomes different vectors. Order is now baked into the input.",
      ],
      sliderNote: "Signal OFF — the position row is all zeros, so the bottom row just copies the meaning. Every slot is identical; the model is back to a bag.",
    },
  ],
  words: ["dog", "bites", "man"],
  n1roles: ["AGENT", "ACTION", "TARGET"],
  n1arcLabel: "acts on",
  n1verdicts: [
    "A dog bites a man.",
    "A man bites a dog.",
    "…that isn't a sentence.",
  ],
  n2wroteLabel: "YOU WROTE",
  n2dropLabel: "attention drops position ↓",
  n2bagLabel: "WHAT ATTENTION SEES · a bag",
  n2sameTag: "same set — no order",
  n3peToggle: "POSITION SIGNAL",
  n3posLabel: "SLOT",
  n3word: "dog",
  n3meaningLabel: "meaning",
  n3plusLabel: "+ position",
  n3equalsLabel: "= model reads",
  n3offWord: "off",
  n3onNote: "With the signal on, each slot adds a different pattern — so the same word in slot 0 and slot 3 becomes two different vectors. Order is now part of the input.",
  n3offNote: "With the signal off, the position row is all zeros and the bottom row just copies the meaning. Every slot looks the same — the model is back to a bag.",
  n3onTagFmt: "slot {p}: a one-of-a-kind vector",
  n3offTag: "every slot identical — order lost",
  n3deeperTitle: "Go deeper: where the wavy pattern comes from",
  n3deeperBody: "The original method (Vaswani et al., 2017) builds each position vector from sine and cosine waves. Dimension 0 uses a fast wave, and each later dimension uses a slower one, so every slot number lands on a unique combination of wave heights — like a binary counter made of smooth curves. Because it's computed from the slot number, not learned, it works for sequences longer than anything seen in training. Modern models often use a rotation-based variant called RoPE that rotates each token's vector by an angle set by its position; that's its own Expert lesson. The idea you need here is the same either way: position is a signal mixed into each token before attention runs.",
  explainLabel: "EXPLAIN IT BACK",
  explainQ: "Attention already looks at every token at once. So why does the model still need a separate position signal added to each vector?",
  explainA: "Because attention compares tokens by *content*, not by *slot* — it measures how related two tokens are, never which one came first. On its own it treats the sentence as an unordered bag, so `dog bites man` and `man bites dog` reach it as the identical set of tokens and it can't tell agent from target. Positional encoding fixes this by **adding a position vector to each token's meaning vector** before attention runs, so the same word in a different slot becomes a different vector. The order is no longer lost — it's baked right into the numbers the model reads.",
  bridgeLabel: "NEXT: SPECIAL TOKENS",
  bridgeBody: "Every token now carries *what* it means and *where* it sits. But a real prompt needs more than words — it needs markers for where a turn starts, where the system message ends, where to stop. Next, **special tokens**: the reserved symbols that give a sequence its structure.",
  prevLesson: "Back: safety filtering",
  nextLesson: "Continue: Special tokens",
};

/* ============================================================ SPANISH ======= */

export const positionalEncodingES: PositionalEncodingLesson = {
  crumb: "ETAPA 0 · 1.3 · CODIFICACIÓN POSICIONAL",
  eyebrow: "ETAPA 0 · 1.3 · 3 NODOS",
  title: "Codificación posicional",
  lede: "La atención lee todos los tokens a la vez — lo que significa que, por sí sola, no distingue el orden de las palabras. «Perro muerde hombre» y «hombre muerde perro» se verían idénticos. Este es el pequeño truco que devuelve el orden: marcar a cada token con dónde está.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["El orden es significado", "La atención es ciega al orden", "Marcar cada token"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Mismas palabras, otro orden, otra frase",
      intro: "El orden de las palabras no es adorno — decide quién le hizo qué a quién. Reordena las mismas tres palabras y el significado se invierte o se deshace.",
      bullets: [
        "**La primera posición es el agente** — quien realiza la acción. La última es el objetivo.",
        "**Intercámbialos y el significado se invierte.** `perro muerde hombre` y `hombre muerde perro` comparten cada palabra, pero dicen lo opuesto.",
        "**Revuélvelas más y no significa nada.** Las palabras no llevan orden propio — las *posiciones* hacen todo el trabajo.",
        "**Así que todo modelo que lea texto debe rastrear la posición** — guarda esa idea para el siguiente nodo.",
      ],
      cardLabel: "TRES PALABRAS · REORDENADAS",
      aria: "Tres fichas de palabra en un orden elegido, con una flecha del agente al objetivo y una lectura sencilla debajo.",
      steps: 1,
      captions: ["Elige un arreglo de las mismas tres palabras y lee lo que significa ahora."],
      hint: "Toca los tres arreglos — la flecha siempre va de primera → última, pero quién es el agente cambia.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "`perro muerde hombre` — el perro es el agente (primera posición), el hombre es el objetivo (última). Un evento cotidiano, aunque desafortunado.",
        "`hombre muerde perro` — las mismas tres palabras, posiciones intercambiadas. Ahora el hombre muerde al perro. Significado opuesto, vocabulario idéntico.",
        "`muerde hombre perro` — revuelto. Ningún reparto de roles tiene sentido; la frase se derrumba. El orden llevaba el significado.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Para la atención cruda, una frase es solo una bolsa",
      intro: "La atención es el mecanismo que deja que cada token mire a todos los demás a la vez. Ese poder tiene un punto ciego: sin nada que marque la posición, ve un conjunto sin orden — una bolsa de tokens.",
      bullets: [
        "**La atención compara tokens por contenido, no por posición.** Pregunta «¿qué tan relacionados están estos dos?», nunca «¿cuál vino primero?».",
        "**Así que órdenes distintos colapsan en la misma bolsa.** Cambia la frase de arriba — la bolsa de abajo no se mueve.",
        "**Una bolsa no distingue agente de objetivo.** Las dos lecturas del nodo anterior llegan como la *misma* entrada.",
        "**Por eso hay que añadir el orden** — el modelo no puede recuperarlo solo.",
      ],
      cardLabel: "ENTRADA ORDENADA → BOLSA SIN ORDEN",
      aria: "Una fila ordenada de fichas arriba, una flecha hacia abajo y las mismas fichas como una bolsa sin orden abajo que nunca cambia.",
      steps: 1,
      captions: ["Cambia el orden de arriba; mira cómo la bolsa que el modelo ve de verdad queda igual."],
      hint: "Alterna entre los arreglos — la bolsa de abajo es idéntica cada vez. Ese es el problema.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "`perro muerde hombre` arriba — pero la bolsa es solo {perro, muerde, hombre}. La posición se descartó.",
        "`hombre muerde perro` arriba — la frase opuesta, y sin embargo la misma bolsa {perro, muerde, hombre}.",
        "Un revoltijo arriba — sigue siendo la misma bolsa. Todo orden se funde en un único conjunto sin orden.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Añade una señal de posición a cada token",
      intro: "El arreglo es pequeño y literal. Cada token ya es un vector (eso fue la lección de embeddings). Antes de que corra la atención, sumamos un segundo vector que depende solo de la posición — así, dónde está un token pasa a ser parte de lo que es.",
      bullets: [
        "**vector de significado + vector de posición = lo que lee el modelo.** La misma palabra, más un sello de su posición.",
        "**El sello de cada posición es distinto**, así que `perro` en la posición 0 y `perro` en la 3 son ahora vectores *diferentes*.",
        "**Apaga la señal** y la fila de posición se aplana — cada posición vuelve a verse igual, el orden se pierde.",
        "**Con posiciones calculadas (como RoPE), no se guarda nada** — la posición viene del número de posición, así que cualquier longitud funciona.",
      ],
      cardLabel: "SIGNIFICADO + POSICIÓN = ENTRADA DEL MODELO",
      aria: "Tres vectores apilados: el significado del token, la señal de posición de la posición elegida y su suma.",
      steps: 1,
      captions: ["Enciende la señal de posición y mueve el token entre posiciones; mira cambiar el vector sumado."],
      hint: "Activa la señal y luego cambia la posición — con ella apagada, toda posición da la misma fila de abajo.",
      readoutTitle: "",
      rows: [],
      optionNotes: [
        "Señal ENCENDIDA — cada posición añade su propio patrón, así que la misma palabra en posiciones distintas se vuelve vectores distintos. El orden ya está integrado en la entrada.",
      ],
      sliderNote: "Señal APAGADA — la fila de posición es todo ceros, así que la fila de abajo solo copia el significado. Cada posición es idéntica; el modelo vuelve a una bolsa.",
    },
  ],
  words: ["perro", "muerde", "hombre"],
  n1roles: ["AGENTE", "ACCIÓN", "OBJETIVO"],
  n1arcLabel: "actúa sobre",
  n1verdicts: [
    "Un perro muerde a un hombre.",
    "Un hombre muerde a un perro.",
    "…eso no es una frase.",
  ],
  n2wroteLabel: "ESCRIBISTE",
  n2dropLabel: "la atención descarta la posición ↓",
  n2bagLabel: "LO QUE VE LA ATENCIÓN · una bolsa",
  n2sameTag: "mismo conjunto — sin orden",
  n3peToggle: "SEÑAL DE POSICIÓN",
  n3posLabel: "POSICIÓN",
  n3word: "perro",
  n3meaningLabel: "significado",
  n3plusLabel: "+ posición",
  n3equalsLabel: "= lee el modelo",
  n3offWord: "apagada",
  n3onNote: "Con la señal encendida, cada posición añade un patrón distinto — así que la misma palabra en la posición 0 y en la 3 se vuelve dos vectores diferentes. El orden ya es parte de la entrada.",
  n3offNote: "Con la señal apagada, la fila de posición es todo ceros y la fila de abajo solo copia el significado. Cada posición se ve igual — el modelo vuelve a una bolsa.",
  n3onTagFmt: "posición {p}: un vector único",
  n3offTag: "cada posición idéntica — orden perdido",
  n3deeperTitle: "Ir más a fondo: de dónde sale el patrón ondulado",
  n3deeperBody: "El método original (Vaswani et al., 2017) construye cada vector de posición con ondas de seno y coseno. La dimensión 0 usa una onda rápida, y cada dimensión posterior usa una más lenta, así que cada número de posición cae en una combinación única de alturas de onda — como un contador binario hecho de curvas suaves. Como se calcula del número de posición, no se aprende, funciona para secuencias más largas que cualquiera vista en el entrenamiento. Los modelos modernos suelen usar una variante basada en rotación llamada RoPE, que rota el vector de cada token por un ángulo fijado por su posición; esa es su propia lección Experta. La idea que necesitas aquí es la misma en ambos casos: la posición es una señal que se mezcla en cada token antes de que corra la atención.",
  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "La atención ya mira todos los tokens a la vez. Entonces, ¿por qué el modelo aún necesita una señal de posición aparte sumada a cada vector?",
  explainA: "Porque la atención compara tokens por *contenido*, no por *posición* — mide qué tan relacionados están dos tokens, nunca cuál vino primero. Por sí sola trata la frase como una bolsa sin orden, así que `perro muerde hombre` y `hombre muerde perro` le llegan como el conjunto idéntico de tokens y no puede distinguir agente de objetivo. La codificación posicional lo arregla **sumando un vector de posición al vector de significado de cada token** antes de que corra la atención, así la misma palabra en otra posición se vuelve un vector distinto. El orden ya no se pierde — queda integrado en los números que lee el modelo.",
  bridgeLabel: "SIGUIENTE: TOKENS ESPECIALES",
  bridgeBody: "Cada token lleva ahora *qué* significa y *dónde* está. Pero un prompt real necesita más que palabras — necesita marcas de dónde empieza un turno, dónde termina el mensaje del sistema, dónde parar. Sigue **los tokens especiales**: los símbolos reservados que le dan estructura a una secuencia.",
  prevLesson: "Atrás: filtrado de seguridad",
  nextLesson: "Continuar: Tokens especiales",
};
