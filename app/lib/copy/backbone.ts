/**
 * Copy for the **LLM-Fundamentals backbone** (`app/components/Backbone.tsx`,
 * route `/stage/0`), authored in full EN + ES.
 *
 * Structure (station order, article levels, routes) lives in
 * `app/lib/backbone.ts`; this module only holds the localized strings, keyed by
 * the same station/article/level keys. `copy.ts` imports `backboneEN/ES` and
 * exposes it as `t.backbone`.
 */

import type { Level } from "../backbone";

/** Title + one-line blurb for a station or an article. */
export interface TitleBlurb {
  t: string;
  d: string;
}

export interface BackboneCopy {
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  /** Label above the depth selector. */
  depthLabel: string;
  /** Plural noun for the live path count, e.g. "lessons in this path". */
  pathWord: string;
  /** Mono label on each station node, e.g. "STATION". */
  stationWord: string;
  /** Chip on a built lesson. */
  liveWord: string;
  /** Chip on an unbuilt lesson. */
  comingSoon: string;
  /** Level name + one-line meaning, keyed by level. */
  levels: Record<Level, TitleBlurb>;
  /** Station title + subtitle, keyed by station key. */
  stations: Record<string, TitleBlurb>;
  /** Article title + blurb, keyed by article key. */
  articles: Record<string, TitleBlurb>;
}

export const backboneEN: BackboneCopy = {
  crumb: "Stage 0 · LLM Fundamentals",
  eyebrow: "STAGE 0 · THE BACKBONE",
  title: "How an LLM is built, end to end.",
  lede:
    "Follow the pipeline from raw web text to a served answer — nine stations, left to right. Set how deep you want to go, and each station reveals the right lessons.",
  depthLabel: "How deep?",
  pathWord: "lessons in this path",
  stationWord: "STATION",
  liveWord: "Live",
  comingSoon: "Coming soon",
  levels: {
    fundamentals: { t: "Fundamentals", d: "The plain idea — what it is and why it exists." },
    medium: { t: "Medium", d: "How it actually works, mechanism by mechanism." },
    expert: { t: "Expert", d: "The algorithms, systems, and trade-offs at the edge." },
  },
  stations: {
    crawl: { t: "Crawl", d: "Get the raw text." },
    filter: { t: "Filter", d: "Clean it and build the training set." },
    embed: { t: "Embed", d: "Turn text into vectors the model can do math on." },
    transformer: { t: "Transformer", d: "The forward pass through the hidden layers." },
    generate: { t: "Generate", d: "How the next token is chosen." },
    pretrain: { t: "Pretrain", d: "Teach it on all that data." },
    finetune: { t: "Finetune", d: "Specialize the base model." },
    align: { t: "Align", d: "Learn from human & AI feedback." },
    serve: { t: "Serve", d: "Run it fast for real users." },
  },
  articles: {
    // Crawl
    crawl: { t: "Web-scale crawling", d: "Common Crawl and petabytes of pages." },
    domain: { t: "Domain-specific sources", d: "GitHub, arXiv, PubMed, books." },
    pii: { t: "PII & legal scrubbing", d: "Stripping emails, IDs, and copyright." },
    // Filter
    quality: { t: "Quality filtering & heuristics", d: "Why ~90% of the web is thrown out." },
    extract: { t: "Text extraction & parsing", d: "HTML → clean text; OCR; language ID." },
    classifier: { t: "Classifier quality scoring", d: "A model that scores “is this educational?”" },
    safety: { t: "Safety & harm filtering", d: "Removing toxic and unsafe content." },
    dedup: { t: "Deduplication", d: "Exact, fuzzy, and semantic duplicate removal." },
    recipe: { t: "Data recipe & synthetic expansion", d: "Upsampling domains; textbook-style rewrites." },
    binpack: { t: "Bin-packing & serialization", d: "Pre-tokenize, pack, and stream to the GPU." },
    // Embed
    tokendict: { t: "The token dictionary (BPE)", d: "How text is split into sub-word tokens." },
    embedmatrix: { t: "The embedding matrix", d: "Token IDs become vectors of meaning." },
    posenc: { t: "Positional encoding — why order matters", d: "So “dog bites man” ≠ “man bites dog”." },
    specialtok: { t: "Special tokens & chat templating", d: "Roles, control tokens, system prompt." },
    scratchpad: { t: "Scratchpad & multi-turn formatting", d: "Think blocks, tool results, past turns." },
    rope: { t: "RoPE, the math", d: "Rotation matrices and relative distance." },
    longctx: { t: "Long-context scaling", d: "Stretching to 128k+ tokens (YaRN)." },
    // Transformer
    block: { t: "What a transformer block does", d: "Attention, in plain words." },
    attention: { t: "The attention mechanism", d: "Q/K/V, softmax, residuals, RMSNorm." },
    mlp: { t: "The MLP / feed-forward block", d: "Expand, activate (SwiGLU), compress." },
    flash: { t: "FlashAttention & efficient attention", d: "GQA/MQA, causal masking, long sequences." },
    moe: { t: "Mixture of Experts (MoE)", d: "Router, Top-K gate, load balancing." },
    // Generate
    hidden: { t: "From hidden state to a token", d: "Unembedding → logits → softmax → pick." },
    arloop: { t: "The autoregressive loop & EOS", d: "Feed it back and repeat until it stops." },
    sampling: { t: "Sampling strategies", d: "Temperature, top-p, top-k, repetition penalty." },
    constrained: { t: "Constrained decoding & grammars", d: "Force valid JSON or a schema." },
    reasoning: { t: "Reasoning delimiters", d: "Think scratchpads before answering." },
    tools: { t: "Tool & function calling", d: "Pause to run code or an API." },
    search: { t: "Test-time search", d: "Best-of-N, MCTS, multi-token prediction." },
    // Pretrain
    learn: { t: "How a model learns", d: "Loss: guess, check, adjust — billions of times." },
    backprop: { t: "Backpropagation & gradient descent", d: "The chain rule that updates the weights." },
    optim: { t: "Optimizers & learning-rate schedules", d: "AdamW; warmup and decay." },
    precision: { t: "Precision & memory tricks", d: "Mixed precision, checkpointing, clipping." },
    distributed: { t: "Distributed training", d: "3D parallelism, ZeRO/FSDP across GPUs." },
    matrixopt: { t: "Modern matrix optimizers", d: "Muon, Lion, Adafactor." },
    // Finetune
    basevs: { t: "Base model vs. assistant", d: "Why the raw model isn’t usable yet." },
    sft: { t: "Supervised fine-tuning (SFT)", d: "Training on instruction → response pairs." },
    syndata: { t: "Synthetic instruction data", d: "Evol-Instruct, reasoning traces, rejection sampling." },
    peft: { t: "Parameter-efficient finetuning", d: "LoRA, QLoRA, DoRA on one GPU." },
    distill: { t: "Distillation", d: "Teacher → student knowledge transfer." },
    // Align
    whyalign: { t: "Why alignment exists", d: "Reward, preference, learning from feedback." },
    reward: { t: "Reward modeling", d: "Training an AI judge that scores answers." },
    dpo: { t: "Direct preference optimization (DPO)", d: "Align straight from chosen/rejected pairs." },
    ppo: { t: "PPO", d: "Actor–critic RL with a KL leash." },
    grpo: { t: "GRPO", d: "Group-relative rewards, no critic." },
    verifiable: { t: "Verifiable rewards & reward hacking", d: "Code/math verifiers; blocking exploits." },
    // Serve
    prefill: { t: "Prefill vs. decode", d: "Reading the prompt vs. writing one token at a time." },
    kvcache: { t: "The KV cache", d: "Why generation is memory-bound." },
    kvsystems: { t: "KV-cache systems", d: "PagedAttention, RadixAttention, prefix reuse." },
    quant: { t: "Quantization", d: "GPTQ/AWQ/GGUF; 4/3/2-bit; FP8." },
    specdecode: { t: "Speculative decoding", d: "Draft models and Medusa/Eagle heads." },
  },
};

export const backboneES: BackboneCopy = {
  crumb: "Etapa 0 · Fundamentos de LLM",
  eyebrow: "ETAPA 0 · LA COLUMNA",
  title: "Cómo se construye un LLM, de principio a fin.",
  lede:
    "Sigue el pipeline desde el texto crudo de la web hasta una respuesta servida — nueve estaciones, de izquierda a derecha. Elige qué tan profundo quieres llegar y cada estación revela las lecciones adecuadas.",
  depthLabel: "¿Qué tan profundo?",
  pathWord: "lecciones en esta ruta",
  stationWord: "ESTACIÓN",
  liveWord: "Disponible",
  comingSoon: "Próximamente",
  levels: {
    fundamentals: { t: "Fundamentos", d: "La idea simple — qué es y por qué existe." },
    medium: { t: "Medio", d: "Cómo funciona en realidad, mecanismo por mecanismo." },
    expert: { t: "Experto", d: "Los algoritmos, sistemas y compensaciones al límite." },
  },
  stations: {
    crawl: { t: "Rastrear", d: "Obtener el texto crudo." },
    filter: { t: "Filtrar", d: "Limpiarlo y construir el conjunto de entrenamiento." },
    embed: { t: "Incrustar", d: "Convertir texto en vectores con los que el modelo opera." },
    transformer: { t: "Transformer", d: "El paso hacia adelante por las capas ocultas." },
    generate: { t: "Generar", d: "Cómo se elige el siguiente token." },
    pretrain: { t: "Preentrenar", d: "Enseñarle con todos esos datos." },
    finetune: { t: "Ajustar", d: "Especializar el modelo base." },
    align: { t: "Alinear", d: "Aprender de la retroalimentación humana y de IA." },
    serve: { t: "Servir", d: "Ejecutarlo rápido para usuarios reales." },
  },
  articles: {
    // Crawl
    crawl: { t: "Rastreo a escala web", d: "Common Crawl y petabytes de páginas." },
    domain: { t: "Fuentes especializadas", d: "GitHub, arXiv, PubMed, libros." },
    pii: { t: "Limpieza de datos personales y legal", d: "Quitar correos, identificadores y copyright." },
    // Filter
    quality: { t: "Filtrado por calidad y heurísticas", d: "Por qué se descarta ~90% de la web." },
    extract: { t: "Extracción y análisis de texto", d: "HTML → texto limpio; OCR; idioma." },
    classifier: { t: "Puntuación de calidad con clasificador", d: "Un modelo que evalúa “¿es educativo?”" },
    safety: { t: "Filtrado de seguridad y daño", d: "Eliminar contenido tóxico e inseguro." },
    dedup: { t: "Deduplicación", d: "Quitar duplicados exactos, difusos y semánticos." },
    recipe: { t: "Receta de datos y expansión sintética", d: "Sobremuestrear dominios; reescrituras tipo libro de texto." },
    binpack: { t: "Empaquetado y serialización", d: "Pre-tokenizar, empaquetar y transmitir a la GPU." },
    // Embed
    tokendict: { t: "El diccionario de tokens (BPE)", d: "Cómo se divide el texto en subpalabras." },
    embedmatrix: { t: "La matriz de incrustación", d: "Los IDs de token se vuelven vectores de significado." },
    posenc: { t: "Codificación posicional — por qué importa el orden", d: "Para que “perro muerde hombre” ≠ “hombre muerde perro”." },
    specialtok: { t: "Tokens especiales y plantillas de chat", d: "Roles, tokens de control, prompt del sistema." },
    scratchpad: { t: "Borrador y formato multi-turno", d: "Bloques de pensamiento, resultados de herramientas, turnos previos." },
    rope: { t: "RoPE, las matemáticas", d: "Matrices de rotación y distancia relativa." },
    longctx: { t: "Escalado de contexto largo", d: "Estirar a 128k+ tokens (YaRN)." },
    // Transformer
    block: { t: "Qué hace un bloque transformer", d: "La atención, en palabras simples." },
    attention: { t: "El mecanismo de atención", d: "Q/K/V, softmax, conexiones residuales, RMSNorm." },
    mlp: { t: "El bloque MLP / feed-forward", d: "Expandir, activar (SwiGLU), comprimir." },
    flash: { t: "FlashAttention y atención eficiente", d: "GQA/MQA, enmascarado causal, secuencias largas." },
    moe: { t: "Mezcla de expertos (MoE)", d: "Enrutador, compuerta Top-K, balanceo de carga." },
    // Generate
    hidden: { t: "Del estado oculto a un token", d: "Desincrustación → logits → softmax → elegir." },
    arloop: { t: "El bucle autoregresivo y EOS", d: "Reingresarlo y repetir hasta que se detiene." },
    sampling: { t: "Estrategias de muestreo", d: "Temperatura, top-p, top-k, penalización por repetición." },
    constrained: { t: "Decodificación restringida y gramáticas", d: "Forzar JSON válido o un esquema." },
    reasoning: { t: "Delimitadores de razonamiento", d: "Borradores de pensamiento antes de responder." },
    tools: { t: "Llamada a herramientas y funciones", d: "Pausar para ejecutar código o una API." },
    search: { t: "Búsqueda en tiempo de inferencia", d: "Best-of-N, MCTS, predicción multi-token." },
    // Pretrain
    learn: { t: "Cómo aprende un modelo", d: "Pérdida: adivinar, verificar, ajustar — miles de millones de veces." },
    backprop: { t: "Retropropagación y descenso de gradiente", d: "La regla de la cadena que actualiza los pesos." },
    optim: { t: "Optimizadores y tasa de aprendizaje", d: "AdamW; calentamiento y decaimiento." },
    precision: { t: "Trucos de precisión y memoria", d: "Precisión mixta, checkpointing, recorte." },
    distributed: { t: "Entrenamiento distribuido", d: "Paralelismo 3D, ZeRO/FSDP entre GPUs." },
    matrixopt: { t: "Optimizadores matriciales modernos", d: "Muon, Lion, Adafactor." },
    // Finetune
    basevs: { t: "Modelo base vs. asistente", d: "Por qué el modelo crudo aún no es útil." },
    sft: { t: "Ajuste supervisado (SFT)", d: "Entrenar con pares instrucción → respuesta." },
    syndata: { t: "Datos de instrucción sintéticos", d: "Evol-Instruct, trazas de razonamiento, muestreo por rechazo." },
    peft: { t: "Ajuste eficiente en parámetros", d: "LoRA, QLoRA, DoRA en una sola GPU." },
    distill: { t: "Destilación", d: "Transferencia de conocimiento de maestro a estudiante." },
    // Align
    whyalign: { t: "Por qué existe la alineación", d: "Recompensa, preferencia, aprender de la retroalimentación." },
    reward: { t: "Modelado de recompensa", d: "Entrenar un juez de IA que puntúa respuestas." },
    dpo: { t: "Optimización directa de preferencias (DPO)", d: "Alinear directo desde pares elegido/rechazado." },
    ppo: { t: "PPO", d: "RL actor–crítico con una correa KL." },
    grpo: { t: "GRPO", d: "Recompensas relativas al grupo, sin crítico." },
    verifiable: { t: "Recompensas verificables y hackeo de recompensa", d: "Verificadores de código/matemáticas; bloquear trampas." },
    // Serve
    prefill: { t: "Prefill vs. decode", d: "Leer el prompt vs. escribir un token a la vez." },
    kvcache: { t: "La caché KV", d: "Por qué la generación está limitada por memoria." },
    kvsystems: { t: "Sistemas de caché KV", d: "PagedAttention, RadixAttention, reuso de prefijo." },
    quant: { t: "Cuantización", d: "GPTQ/AWQ/GGUF; 4/3/2-bit; FP8." },
    specdecode: { t: "Decodificación especulativa", d: "Modelos borrador y cabezas Medusa/Eagle." },
  },
};
