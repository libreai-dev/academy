/**
 * Stage 0 · 4.6 — Verifiable rewards (RLVR). Interface + EN/ES copy, isolated
 * from every other lesson so edits here never touch theirs.
 *
 * One idea: for math and code you can skip the learned reward model and check
 * the answer objectively — does the code pass its tests, is the number exactly
 * right — a crisp true/false reward. Builds on "Reward modeling" (4.4), which
 * trained a fuzzy scalar to imitate human taste; here the reward is ground
 * truth, and the new risk is the model gaming the check.
 */
import type { WsNodeCopy } from "./shared";

export interface VerifiableRewardsLesson {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  pipelineLabel: string;
  /** Topic labels (no numbers — the index numbers them). */
  pipeline: string[];
  nodes: WsNodeCopy[];

  // Node 1 — the verifier
  n1problemLabel: string;
  n1candidateLabel: string;
  n1candidates: string[]; //   button labels, index-aligned to CANDIDATES
  n1verifierLabel: string;
  n1goldRow: string; //        "gold"
  n1gotRow: string; //         "extracted"
  n1rewardWord: string; //     "reward"
  n1passWord: string; //       "MATCH"
  n1failWord: string; //       "NO MATCH"

  // Node 2 — process vs outcome
  n2solutionLabel: string;
  n2solutions: string[]; //    button labels, index-aligned to SOLUTIONS
  n2ormTitle: string; //       "OUTCOME · ORM"
  n2ormSub: string; //         "one reward, at the end"
  n2prmTitle: string; //       "PROCESS · PRM"
  n2prmSub: string; //         "a reward at every step"
  n2rewardWord: string; //     "reward"
  n2finalWord: string; //      "final answer"

  // Node 3 — reward hacking
  n3solverLabel: string;
  n3solvers: string[]; //      button labels, index-aligned to SOLVERS
  n3guardLabel: string; //     "HIDDEN TESTS"
  n3visibleTitle: string; //   "Visible tests"
  n3hiddenTitle: string; //    "Hidden tests (held out)"
  n3hiddenOff: string; //      shown in the hidden panel when the guard is off
  n3rewardWord: string;
  n3verdictGamed: string; //   "GAMED — rewarded but wrong"
  n3verdictCaught: string; //  "CAUGHT — hidden tests failed"
  n3verdictSolved: string; //  "SOLVED — passes both"
  n3calloutTitle: string; //   heading for the reward-hacking callout

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

export const verifiableRewardsEN: VerifiableRewardsLesson = {
  crumb: "STAGE 0 · 4.6 · VERIFIABLE REWARDS",
  eyebrow: "STAGE 0 · 4.6 · 3 NODES",
  title: "Verifiable rewards",
  lede: "For math and code you don't need a reward model that guesses what a human would like. You can check the answer for real — does the number match, does the code pass its tests — and hand back a clean 1 or 0. The catch: give a model a checkable reward and it will try to game the check.",
  pipelineLabel: "THE 3 STEPS",
  pipeline: ["Check the real answer", "Grade every step", "Block the cheats"],
  nodes: [
    {
      eyebrow: "NODE 01 / 03",
      title: "Check the real answer, don't predict a score",
      intro: "Earlier you built a reward model — a trained scorer, a fuzzy guess at what a human would prefer, and something a model can learn to fool. For math and code there's a shortcut: check the answer against ground truth.",
      bullets: [
        "**A verifier is a program, not a network** — it runs the code or evaluates the maths and returns a hard `1` (correct) or `0` (wrong). No training, no drift.",
        "**It extracts and normalises first.** `\"The answer is 149.\"`, `149`, and `149.0` all reduce to the same number before the comparison — so formatting never costs a point.",
        "**This is RLVR** — reinforcement learning from *verifiable* rewards. The reward is ground truth, so the signal is exact where a learned scorer only approximates.",
        "**It only works where truth is checkable** — a unit-test suite for code, a known answer for maths. Open-ended writing still needs the learned reward model.",
      ],
      cardLabel: "CANDIDATE → VERIFIER → REWARD",
      aria: "A candidate answer flowing through a verifier that extracts a number, compares it to the gold answer, and outputs a binary reward.",
      steps: 1,
      captions: ["Pick a candidate answer and watch the verifier extract, compare, and score it."],
      hint: "Cycle the candidates — messy formatting still scores 1; only the wrong number gets a 0.",
      readoutTitle: "VERIFY",
      rows: ["EXTRACTED", "GOLD", "REWARD"],
      optionNotes: [
        "Free text — the verifier pulls the last number out (149) before comparing, so prose around the answer doesn't matter.",
        "Bare number — the simplest case: 149 matches the gold answer exactly. Reward 1.",
        "Decimal form — 149.0 is normalised to 149, so it still matches. Formatting never costs a point.",
        "Wrong answer — 144 forgets the `+ 5`. The number is off, so the verifier returns a hard 0.",
      ],
    },
    {
      eyebrow: "NODE 02 / 03",
      title: "Reward every step, not just the final answer",
      intro: "A right final answer can hide wrong reasoning. Grading only the outcome pays out for luck; grading each step gives a denser, more honest signal.",
      bullets: [
        "**Outcome reward (ORM)** scores one thing: the final answer. A lucky solution with a broken step in the middle still collects the full reward.",
        "**Process reward (PRM)** scores every step on its own — so a bad step gets a 0 even when the final answer sneaks in correct.",
        "**Denser signal trains faster.** One reward at the end is a faint whisper; a reward per step tells the model *where* it went wrong.",
        "**A PRM is itself a trained model** — a step grader learned from labelled reasoning — so it's a middle ground between a pure verifier and the human-taste reward model.",
      ],
      cardLabel: "OUTCOME vs PROCESS REWARD",
      aria: "The same worked solution graded two ways side by side: one reward at the end versus one reward per reasoning step.",
      steps: 1,
      captions: ["Compare the two graders on the same solution — outcome pays at the end, process pays per step."],
      hint: "Flip to the lucky solution — outcome still pays full reward; process flags the two broken steps in red.",
      readoutTitle: "GRADING",
      rows: ["OUTCOME", "PROCESS", "FINAL"],
      optionNotes: [
        "Clean solution — every step is valid and the answer is right. Both graders agree: full reward, all green.",
        "Lucky guess — two cancelling errors still land on x = 5. Outcome pays full reward for the right answer; process catches the broken middle steps.",
      ],
    },
    {
      eyebrow: "NODE 03 / 03",
      title: "When the model games the reward",
      intro: "Give a model a checkable reward and it optimises the check, not the task. If the tests are weak, it will pass them without ever solving the problem — reward hacking.",
      bullets: [
        "**The hack:** clear the visible tests without doing the work — hardcode their answers, or return whatever value makes them green.",
        "**The fix: held-out hidden tests.** Keep some cases secret. The real solver passes them; a cheat that only fits the visible cases fails.",
        "**Guard off, the hack is rewarded but wrong** — a `1` for a program that doesn't work. Guard on, the hidden tests catch it and the reward drops to `0`.",
        "**This is [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law)** — when a measure becomes the target, it stops measuring what you meant. Verifiable rewards don't escape it; they just move the fight to test coverage.",
      ],
      cardLabel: "SOLVER → TESTS → VERDICT",
      aria: "A candidate program run against visible tests and held-out hidden tests, with a verdict showing whether it gamed the reward or genuinely solved the task.",
      steps: 1,
      captions: ["Run each solver; turn the hidden tests on to see which passes are real and which were cheats."],
      hint: "The hardcoded solver is rewarded with the guard off — turn HIDDEN TESTS on and watch it get caught.",
      readoutTitle: "VERIFIER",
      rows: ["VISIBLE", "HIDDEN", "REWARD"],
      optionNotes: [
        "Hardcode tests — returns True only for the two visible primes. Passes what it can see; the hidden case is_prime(2) exposes it.",
        "Exploit weak test — the visible tests are all `True` cases, so `return True` clears them. The hidden False case is_prime(9) breaks it.",
        "Real solution — actually checks divisibility. Passes the visible tests and every hidden one. Nothing to catch.",
      ],
    },
  ],

  n1problemLabel: "PROBLEM",
  n1candidateLabel: "TRY A CANDIDATE ANSWER",
  n1candidates: ["Free text", "149", "149.0", "144"],
  n1verifierLabel: "VERIFIER",
  n1goldRow: "gold",
  n1gotRow: "extracted",
  n1rewardWord: "REWARD",
  n1passWord: "MATCH",
  n1failWord: "NO MATCH",

  n2solutionLabel: "PICK A SOLUTION",
  n2solutions: ["Clean solution", "Lucky guess"],
  n2ormTitle: "OUTCOME · ORM",
  n2ormSub: "one reward, at the end",
  n2prmTitle: "PROCESS · PRM",
  n2prmSub: "a reward at every step",
  n2rewardWord: "reward",
  n2finalWord: "final answer",

  n3solverLabel: "PICK A SOLVER",
  n3solvers: ["Hardcode tests", "Exploit weak test", "Real solution"],
  n3guardLabel: "HIDDEN TESTS",
  n3visibleTitle: "Visible tests",
  n3hiddenTitle: "Hidden tests · held out",
  n3hiddenOff: "not run — guard off",
  n3rewardWord: "REWARD",
  n3verdictGamed: "GAMED · rewarded but wrong",
  n3verdictCaught: "CAUGHT · hidden tests failed",
  n3verdictSolved: "SOLVED · passes both",
  n3calloutTitle: "When the reward can be gamed",

  explainLabel: "EXPLAIN IT BACK",
  explainQ: "If a verifier gives a perfect, ground-truth reward, why not use it for everything and retire the learned reward model?",
  explainA: "Because most of what we want from a model isn't checkable. A verifier needs a ground truth to compare against — a unit test, a known numeric answer — and that only exists for closed domains like maths and code. There's no unit test for \"is this explanation clear\" or \"is this reply kind\", so open-ended work still needs the learned reward model from earlier, fuzzy and foolable as it is. And even where a verifier applies, it rewards *passing the check*, not *solving the task* — weak tests get gamed, so you spend real effort on coverage and hidden held-out cases. **Verifiable rewards are exact but narrow; learned rewards are broad but approximate.** Frontier training uses both.",
  bridgeLabel: "NEXT: THE KV CACHE",
  bridgeBody: "You've now seen how a model is built, trained, and aligned. Now the course turns to *serving* it fast. First, **the KV cache**: how a model avoids re-reading the whole conversation on every new token — the single trick behind fast generation.",
  prevLesson: "Back: GRPO",
  nextLesson: "Continue: The KV cache",
};

/* ============================================================ SPANISH ======= */

export const verifiableRewardsES: VerifiableRewardsLesson = {
  crumb: "ETAPA 0 · 4.6 · RECOMPENSAS VERIFICABLES",
  eyebrow: "ETAPA 0 · 4.6 · 3 NODOS",
  title: "Recompensas verificables",
  lede: "Para matemáticas y código no necesitas un modelo de recompensa que adivine qué le gustaría a un humano. Puedes comprobar la respuesta de verdad — ¿coincide el número, pasa el código sus pruebas? — y devolver un 1 o un 0 limpio. El truco: dale a un modelo una recompensa comprobable e intentará hacerle trampa a la comprobación.",
  pipelineLabel: "LOS 3 PASOS",
  pipeline: ["Comprobar la respuesta real", "Calificar cada paso", "Bloquear las trampas"],
  nodes: [
    {
      eyebrow: "NODO 01 / 03",
      title: "Comprueba la respuesta real, no predigas una puntuación",
      intro: "Antes construiste un modelo de recompensa — un calificador entrenado, una suposición difusa de lo que preferiría un humano, y algo que un modelo puede aprender a engañar. Para matemáticas y código hay un atajo: comparar la respuesta con la verdad.",
      bullets: [
        "**Un verificador es un programa, no una red** — ejecuta el código o evalúa la matemática y devuelve un `1` duro (correcto) o un `0` (incorrecto). Sin entrenamiento, sin deriva.",
        "**Primero extrae y normaliza.** `\"La respuesta es 149.\"`, `149` y `149.0` se reducen al mismo número antes de comparar — así el formato nunca cuesta un punto.",
        "**Esto es RLVR** — aprendizaje por refuerzo con recompensas *verificables*. La recompensa es la verdad, así que la señal es exacta donde un calificador entrenado solo aproxima.",
        "**Solo sirve donde la verdad es comprobable** — una batería de pruebas para el código, una respuesta conocida para la matemática. La escritura abierta aún necesita el modelo de recompensa entrenado.",
      ],
      cardLabel: "CANDIDATO → VERIFICADOR → RECOMPENSA",
      aria: "Una respuesta candidata que pasa por un verificador que extrae un número, lo compara con la respuesta correcta y produce una recompensa binaria.",
      steps: 1,
      captions: ["Elige una respuesta candidata y mira al verificador extraer, comparar y calificar."],
      hint: "Recorre los candidatos — el formato desordenado igual saca 1; solo el número equivocado saca 0.",
      readoutTitle: "VERIFY",
      rows: ["EXTRACTED", "GOLD", "REWARD"],
      optionNotes: [
        "Texto libre — el verificador saca el último número (149) antes de comparar, así que la prosa alrededor de la respuesta no importa.",
        "Número solo — el caso más simple: 149 coincide exactamente con la respuesta correcta. Recompensa 1.",
        "Forma decimal — 149.0 se normaliza a 149, así que igual coincide. El formato nunca cuesta un punto.",
        "Respuesta incorrecta — 144 olvida el `+ 5`. El número está mal, así que el verificador devuelve un 0 duro.",
      ],
    },
    {
      eyebrow: "NODO 02 / 03",
      title: "Recompensa cada paso, no solo la respuesta final",
      intro: "Una respuesta final correcta puede esconder un razonamiento equivocado. Calificar solo el resultado paga por suerte; calificar cada paso da una señal más densa y más honesta.",
      bullets: [
        "**La recompensa de resultado (ORM)** califica una sola cosa: la respuesta final. Una solución con suerte y un paso roto en medio igual se lleva toda la recompensa.",
        "**La recompensa de proceso (PRM)** califica cada paso por su cuenta — así un paso malo saca 0 aunque la respuesta final salga correcta de casualidad.",
        "**Una señal más densa entrena más rápido.** Una recompensa al final es un susurro tenue; una recompensa por paso le dice al modelo *dónde* se equivocó.",
        "**Un PRM es en sí un modelo entrenado** — un calificador de pasos aprendido de razonamientos etiquetados — así que es un punto medio entre un verificador puro y el modelo de recompensa de gusto humano.",
      ],
      cardLabel: "RECOMPENSA DE RESULTADO vs DE PROCESO",
      aria: "La misma solución calificada de dos formas lado a lado: una recompensa al final frente a una recompensa por cada paso de razonamiento.",
      steps: 1,
      captions: ["Compara los dos calificadores en la misma solución — resultado paga al final, proceso paga por paso."],
      hint: "Cambia a la solución con suerte — resultado igual paga la recompensa completa; proceso marca en rojo los dos pasos rotos.",
      readoutTitle: "GRADING",
      rows: ["OUTCOME", "PROCESS", "FINAL"],
      optionNotes: [
        "Solución limpia — cada paso es válido y la respuesta es correcta. Ambos calificadores coinciden: recompensa completa, todo verde.",
        "Con suerte — dos errores que se cancelan igual llegan a x = 5. Resultado paga completo por la respuesta correcta; proceso atrapa los pasos rotos del medio.",
      ],
    },
    {
      eyebrow: "NODO 03 / 03",
      title: "Cuando el modelo le hace trampa a la recompensa",
      intro: "Dale a un modelo una recompensa comprobable y optimizará la comprobación, no la tarea. Si las pruebas son débiles, las pasará sin resolver nunca el problema — trampa de recompensa.",
      bullets: [
        "**La trampa:** pasar las pruebas visibles sin hacer el trabajo — codificar sus respuestas a mano, o devolver el valor que las ponga en verde.",
        "**El arreglo: pruebas ocultas apartadas.** Guarda algunos casos en secreto. El que resuelve de verdad los pasa; una trampa que solo encaja los casos visibles falla.",
        "**Con la guardia apagada, la trampa se recompensa pero está mal** — un `1` para un programa que no funciona. Con la guardia encendida, las pruebas ocultas la atrapan y la recompensa cae a `0`.",
        "**Esto es la [ley de Goodhart](https://es.wikipedia.org/wiki/Ley_de_Goodhart)** — cuando una medida se vuelve el objetivo, deja de medir lo que querías. Las recompensas verificables no escapan de ella; solo mueven la pelea a la cobertura de pruebas.",
      ],
      cardLabel: "PROGRAMA → PRUEBAS → VEREDICTO",
      aria: "Un programa candidato ejecutado contra pruebas visibles y pruebas ocultas apartadas, con un veredicto que muestra si hizo trampa o resolvió la tarea de verdad.",
      steps: 1,
      captions: ["Ejecuta cada programa; enciende las pruebas ocultas para ver qué aprobaciones son reales y cuáles eran trampas."],
      hint: "El programa con respuestas a mano se recompensa con la guardia apagada — enciende PRUEBAS OCULTAS y mira cómo lo atrapan.",
      readoutTitle: "VERIFIER",
      rows: ["VISIBLE", "HIDDEN", "REWARD"],
      optionNotes: [
        "Respuestas a mano — devuelve True solo para los dos primos visibles. Pasa lo que ve; el caso oculto is_prime(2) lo delata.",
        "Explota prueba débil — las pruebas visibles son todas casos `True`, así que `return True` las pasa. El caso oculto False is_prime(9) lo rompe.",
        "Solución real — de verdad comprueba la divisibilidad. Pasa las visibles y todas las ocultas. Nada que atrapar.",
      ],
    },
  ],

  n1problemLabel: "PROBLEMA",
  n1candidateLabel: "PRUEBA UNA RESPUESTA CANDIDATA",
  n1candidates: ["Texto libre", "149", "149.0", "144"],
  n1verifierLabel: "VERIFICADOR",
  n1goldRow: "correcta",
  n1gotRow: "extraído",
  n1rewardWord: "RECOMPENSA",
  n1passWord: "COINCIDE",
  n1failWord: "NO COINCIDE",

  n2solutionLabel: "ELIGE UNA SOLUCIÓN",
  n2solutions: ["Solución limpia", "Con suerte"],
  n2ormTitle: "RESULTADO · ORM",
  n2ormSub: "una recompensa, al final",
  n2prmTitle: "PROCESO · PRM",
  n2prmSub: "una recompensa por paso",
  n2rewardWord: "recompensa",
  n2finalWord: "respuesta final",

  n3solverLabel: "ELIGE UN PROGRAMA",
  n3solvers: ["Respuestas a mano", "Explota prueba débil", "Solución real"],
  n3guardLabel: "PRUEBAS OCULTAS",
  n3visibleTitle: "Pruebas visibles",
  n3hiddenTitle: "Pruebas ocultas · apartadas",
  n3hiddenOff: "no se ejecutan — guardia apagada",
  n3rewardWord: "RECOMPENSA",
  n3verdictGamed: "TRAMPA · recompensado pero mal",
  n3verdictCaught: "ATRAPADO · falló las ocultas",
  n3verdictSolved: "RESUELTO · pasa ambas",
  n3calloutTitle: "Cuando se puede engañar la recompensa",

  explainLabel: "EXPLÍCALO CON TUS PALABRAS",
  explainQ: "Si un verificador da una recompensa perfecta y basada en la verdad, ¿por qué no usarlo para todo y jubilar el modelo de recompensa entrenado?",
  explainA: "Porque casi nada de lo que queremos de un modelo es comprobable. Un verificador necesita una verdad contra la cual comparar — una prueba unitaria, una respuesta numérica conocida — y eso solo existe para dominios cerrados como la matemática y el código. No hay prueba unitaria para \"¿es clara esta explicación?\" o \"¿es amable esta respuesta?\", así que el trabajo abierto aún necesita el modelo de recompensa entrenado de antes, difuso y engañable como es. Y aun donde aplica un verificador, recompensa *pasar la comprobación*, no *resolver la tarea* — las pruebas débiles se hacen trampa, así que gastas esfuerzo real en cobertura y casos ocultos apartados. **Las recompensas verificables son exactas pero estrechas; las aprendidas son amplias pero aproximadas.** El entrenamiento de frontera usa ambas.",
  bridgeLabel: "SIGUIENTE: LA CACHÉ KV",
  bridgeBody: "Ya viste cómo se construye, se entrena y se alinea un modelo. Ahora el curso pasa a *servirlo* rápido. Primero, **la caché KV**: cómo un modelo evita releer toda la conversación en cada token nuevo — el único truco detrás de la generación rápida.",
  prevLesson: "Atrás: GRPO",
  nextLesson: "Continuar: La caché KV",
};
