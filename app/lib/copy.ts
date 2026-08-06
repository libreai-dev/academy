/**
 * All user-facing copy for the Academy, authored in both English and Spanish
 * (content parity is a core commitment — neither language is a translation
 * afterthought). Components read from `COPY[lang]`; the active language lives in
 * the ThemeLang context so switching updates every screen live.
 */

export type Lang = "en" | "es";
export type Theme = "light" | "dark";

export interface Stage {
  title: string;
  desc: string;
  lessons: number;
  /** Illustrative completion percentage for the progress ring. */
  pct: number;
}

export interface Copy {
  badge: string;
  heroTitle: string;
  heroSub: string;
  ctaStart: string;
  ctaPaths: string;
  graphicLabel: string;
  graphicMetaWord: string;
  legend1: string;
  legend2: string;
  whyLede: string;
  roadmapLabel: string;
  roadmapTitle: string;
  roadmapSub: string;
  howLabel: string;
  howTitle: string;
  how1: string;
  how1d: string;
  how2: string;
  how2d: string;
  how3: string;
  how3d: string;
  how4: string;
  how4d: string;
  pathsLabel: string;
  pathsTitle: string;
  path1Route: string;
  path1: string;
  path1d: string;
  path1cta: string;
  path2Route: string;
  path2: string;
  path2d: string;
  path2cta: string;
  backRoadmap: string;
  stage1Label: string;
  stage1Title: string;
  crumb: string;
  lessonTitle: string;
  lessonLede: string;
  p1: string;
  conceptList: string[];
  playLabel: string;
  playTitle: string;
  tokensLabel: string;
  charsLabel: string;
  costLabel: string;
  inputLabel: string;
  playNote: string;
  explainLabel: string;
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string;
  prev: string;
  next: string;
  markComplete: string;
  completed: string;
  reveal: string;
  hide: string;
  progress: string;
  footer: string;
  contribute: string;
  contact: string;
  stages: Stage[];
  lessonsWord: string;
  start: string;
  review: string;
  locked: string;
  life: LifeCopy;
  tok: TokenLesson;
  data: DataLesson;
  bias: BiasLesson;
  stage1List: string[];
}

export interface LifeStage {
  name: string;
  tagline: string;
  before: string;
  after: string;
  tokens?: string[];
  bars?: { label: string; p: number }[];
  labs: string;
  tools: string;
  hardware: string;
  money: string;
}

export interface LifeCopy {
  crumb: string;
  title: string;
  lede: string;
  intro: string;
  stagesLabel: string;
  beforeCap: string;
  afterCap: string;
  labsCap: string;
  toolsCap: string;
  hardwareCap: string;
  moneyCap: string;
  prevBtn: string;
  nextBtn: string;
  stages: LifeStage[];
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string;
  nextWord: string;
}

/** A one-tap example that loads into the calculator to reveal a failure mode. */
export interface TokenPreset {
  label: string;
  text: string;
  note: string;
}

/** Copy for the rebuilt, interactive "Tokens" lesson (real tokenizer + d3). */
export interface TokenLesson {
  flowText: string;
  flowTokens: string;
  flowIds: string;
  flowCaption: string;
  calcLabel: string;
  calcTitle: string;
  calcInputLabel: string;
  seed: string;
  countLabel: string;
  idsLabel: string;
  decodeLabel: string;
  loading: string;
  engineNote: string;
  legendWord: string;
  legendSub: string;
  legendSpace: string;
  legendPunct: string;
  legendNum: string;
  legendByte: string;
  tryLabel: string;
  tryTitle: string;
  tryBody: string;
  presets: TokenPreset[];
  dictLabel: string;
  dictTitle: string;
  dictBody: string;
  dictSearchLabel: string;
  dictColId: string;
  dictColPiece: string;
  dictColKind: string;
  dictRandom: string;
  dictCommon: string;
  dictNote: string;
  dictEmpty: string;
  commonWords: string[];
  dictWhyLabel: string;
  dictWhyTitle: string;
  dictWhyBody: string;
  dictWhyCommon: string;
  dictWhyRare: string;
  dictWhyInList: string;
  dictWhyBuilt: string;
  curiosityLabel: string;
  curiosityBody: string;
  curiosityBody2: string;
  cmpLabel: string;
  cmpTitle: string;
  cmpBody: string;
  cmpNote: string;
  cmpForYourText: string;
  cmpLangTitle: string;
  cmpLangBody: string;
  cmpEnLabel: string;
  cmpEsLabel: string;
  cmpEnText: string;
  cmpEsText: string;
  tokensWord: string;
  bridgeLabel: string;
  bridgeBody: string;
}

/** One seeded document in the "Clean this dataset" interactive (text only). */
export interface DataDoc {
  id: string;
  title: string;
  raw: string;
}

/** One pipeline stage's labels in the "Clean this dataset" interactive. */
export interface DataStageCopy {
  name: string;
  desc: string;
}

export interface DataLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  // hero flow
  heroRawLabel: string;
  heroCleanLabel: string;
  heroTokensLabel: string;
  heroIdsLabel: string;
  heroRaw: string;
  heroClean: string;
  heroCaption: string;
  // concept
  concept: string[];
  // interactive A — clean this dataset
  cleanLabel: string;
  cleanTitle: string;
  cleanBody: string;
  rawStageName: string;
  stepperHint: string;
  stages: DataStageCopy[];
  docsKeptLabel: string;
  tokensKeptLabel: string;
  runLabel: string;
  nextStageLabel: string;
  resetLabel: string;
  reasonBoilerplate: string;
  reasonDup: string;
  reasonSpam: string;
  reasonPii: string;
  reasonBenchmark: string;
  keptBadge: string;
  qualityWord: string;
  resultTitle: string;
  resultBody: string;
  illustrativeNote: string;
  docsWord: string;
  tokensWord: string;
  docs: DataDoc[];
  // interactive B — scale
  scaleLabel: string;
  scaleTitle: string;
  scaleBody: string;
  scalePagesLabel: string;
  scaleTokensLabel: string;
  scaleStorageLabel: string;
  denseBlockLabel: string;
  denseBlockNote: string;
  denseSepLabel: string;
  hoverHint: string;
  compareTitle: string;
  compareBody: string;
  compareWiki: string;
  compareFrontier: string;
  compareNote: string;
  // the tape
  tapeLabel: string;
  tapeTitle: string;
  tape: string[];
  // chicken-and-egg loop
  loopLabel: string;
  loopTitle: string;
  loopBody: string;
  // explain / deeper
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string;
  // bridge
  bridgeLabel: string;
  bridgeBody: string;
}

/** One language row in the representation meter (structural numbers only). */
export interface BiasLang {
  key: string;
  text: number; // illustrative share of training text (0–1)
  pop: number; //  illustrative share of world population (0–1)
}

/** One formal↔informal register pair for "your filter has an opinion". */
export interface BiasPair {
  topic: string;
  formal: string;
  informal: string;
  note: string;
}

/** One debated mitigation. */
export interface BiasMitigation {
  title: string;
  body: string;
}

export interface BiasLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  concept: string[];
  // interactive A — representation meter
  repLabel: string;
  repTitle: string;
  repBody: string;
  repTextLabel: string;
  repPopLabel: string;
  langs: BiasLang[];
  repOver: string;
  repUnder: string;
  repFactorWord: string;
  repSelectHint: string;
  repNote: string;
  // interactive B — the filter has an opinion
  filterLabel: string;
  filterTitle: string;
  filterBody: string;
  pairs: BiasPair[];
  filterFormalLabel: string;
  filterInformalLabel: string;
  filterScoreWord: string;
  filterNote: string;
  // teaser — association bias
  assocLabel: string;
  assocTitle: string;
  assocBody: string;
  // mitigations
  mitLabel: string;
  mitTitle: string;
  mitBody: string;
  mitigations: BiasMitigation[];
  mitClosing: string;
  // explain / deeper
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string;
  // bridge
  bridgeLabel: string;
  bridgeBody: string;
}

export const COPY: Record<Lang, Copy> = {
  en: {
    badge: "Free and open · part of libreai.dev",
    heroTitle: "Become an AI-native engineer.",
    heroSub:
      "A hands-on, interactive guide for software engineers who don't (yet) know AI — from how models are built to running your own. In English and Spanish.",
    ctaStart: "Start Stage 1",
    ctaPaths: "Choose your path",
    graphicLabel: "THE BLACK BOX, OPENED",
    graphicMetaWord: "UNDERSTOOD",
    legend1: "What you understand — and can therefore change, run, and own.",
    legend2: "What stays magic while someone else keeps the weights.",
    whyLede:
      "AI is being built as a black box you rent. It doesn't have to be — but only people who understand how it's built get to choose otherwise.",
    roadmapLabel: "THE ROADMAP",
    roadmapTitle: "Six stages, no AI background required.",
    roadmapSub:
      "Start at Stage 1 for the full picture, or jump to Stage 3 if you just want to ship. Every stage ends with something that runs.",
    howLabel: "HOW IT WORKS",
    howTitle: "Built the way engineers actually learn.",
    how1: "Interactive-first",
    how1d:
      "Every lesson has a thing you tweak until the idea clicks. Reading is the backup.",
    how2: "Explain it back",
    how2d:
      "You restate the idea before moving on — the check that separates reading from knowing.",
    how3: "English & Spanish",
    how3d:
      "Both languages are authored, not translated as an afterthought. Neither is primary.",
    how4: "Free & open",
    how4d:
      "Open lessons, open components, no account. Contribute a lesson or a translation by PR.",
    pathsLabel: "TWO PATHS",
    pathsTitle: "Pick the one that matches your deadline.",
    path1Route: "STAGE 3 → 4 → 6",
    path1: "Builder fast-track",
    path1d:
      "You need to ship an AI feature this quarter. Agents, RAG, evals, cost, guardrails — then your capstone.",
    path1cta: "Start the fast-track",
    path2Route: "STAGE 1 → 6",
    path2: "Deep understanding",
    path2d:
      "The full picture: tokens, training, embeddings, attention — then everything the fast-track covers. You'll know why, not just how.",
    path2cta: "Start at the beginning",
    backRoadmap: "Back to the roadmap",
    stage1Label: "STAGE 1 · 9 LESSONS",
    stage1Title: "Foundations",
    crumb: "STAGE 1 · FOUNDATIONS · LESSON 2",
    lessonTitle: "Tokens",
    lessonLede:
      "A model never sees your words. It sees tokens — and that one fact explains your bill, your context limit, and the odd ways models fail.",
    p1: "A token is a chunk of text — usually a **common word**, a **word fragment**, or a **piece of punctuation**. Before anything happens, your text is cut into these chunks and each one is swapped for a number. Think of it as the model's **character encoding**: the unit it counts in, and the only unit it can read or write.",
    conceptList: [
      "**It's what you pay for.** Billing counts tokens, in both directions — your prompt and the reply.",
      "**It's what the context window measures.** An 8k limit means 8,000 *tokens*, not 8,000 words.",
      "**English packs ~4 characters per token**, so a 1,000-word prompt lands near 1,300 tokens. Code, JSON, and other languages pack in less — Spanish routinely costs 20–30% more for the same meaning.",
      "**It explains the “dumb” failures.** A model miscounts the letters in “strawberry” because it saw 3 chunks, not letters; it fumbles `1234567` because that splits as 123 / 456 / 7. Both are tokenization showing through, not broken reasoning.",
    ],
    playLabel: "INTERACTIVE",
    playTitle: "Live tokenizer",
    tokensLabel: "TOKENS",
    charsLabel: "CHARS",
    costLabel: "INPUT COST",
    inputLabel:
      "Type or paste anything — the chips below are the tokens the model would see.",
    playNote:
      "A simplified subword tokenizer, close enough to feel the effect: try a long number, a URL, some JSON, an emoji, and the same sentence in Spanish. Cost assumes $3 per million input tokens.",
    explainLabel: "EXPLAIN IT BACK",
    explainQ:
      "In your own words: why does a model miscount the letters in a word?",
    explainA:
      "Because it never receives letters. The word arrives already cut into a few subword tokens, each a single opaque number, so there is nothing letter-shaped to count. Asking for a letter count asks the model to recall a fact about text it cannot see — which is why a two-line script does it perfectly and a frontier model sometimes does not.",
    deeperTitle: "Go deeper: how the vocabulary is built",
    deeperBody:
      "Most models use byte-pair encoding. Start with raw bytes as the vocabulary, count adjacent pairs across a huge corpus, merge the most frequent pair into a new token, and repeat tens of thousands of times. Frequent words survive whole; rare words decompose into fragments. Because the merge list is learned from the training corpus, a tokenizer trained mostly on English is structurally more expensive for everyone else — one reason Spanish and other languages cost more per idea, and one reason open, locally-trained tokenizers matter.",
    prev: "The life of an LLM",
    next: "Data",
    markComplete: "Mark complete",
    completed: "✓ Completed",
    reveal: "Reveal a model answer",
    hide: "Hide the answer",
    progress: "complete",
    footer: "libreai Academy · free and open, forever",
    contribute: "Contribute a lesson",
    contact: "Contact",
    stages: [
      {
        title: "Foundations",
        desc: "How AI actually works inside — tokens, training, embeddings, attention.",
        lessons: 9,
        pct: 25,
      },
      {
        title: "Working with LLMs",
        desc: "Prompting, sampling, context budgets, structured output.",
        lessons: 5,
        pct: 0,
      },
      {
        title: "Coding with AI agents",
        desc: "Claude Code, Codex, rules files, permissions, hooks, MCP.",
        lessons: 7,
        pct: 0,
      },
      {
        title: "Building AI into software",
        desc: "RAG, tool calling, agents, guardrails, evals, cost control.",
        lessons: 10,
        pct: 0,
      },
      {
        title: "Own it",
        desc: "Datasets, fine-tuning, open-weight models, local and self-hosted.",
        lessons: 8,
        pct: 0,
      },
      {
        title: "Capstone",
        desc: "Your own AI, on your own data, self-hosted end to end.",
        lessons: 1,
        pct: 0,
      },
    ],
    lessonsWord: "LESSONS",
    start: "Start",
    review: "Review",
    locked: "Preview",
    life: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 1",
      title: "The life of an LLM",
      lede: "The model you chat with is the last step of a six-stage assembly line. Here is each stage — what actually happens, the tools and hardware labs use, and where the money goes.",
      intro: "Step through the pipeline. Each stage shows a real before → after, plus what the lab does, the tools, the hardware, and the spend.",
      stagesLabel: "THE PIPELINE",
      beforeCap: "BEFORE",
      afterCap: "AFTER",
      labsCap: "WHAT THE LAB DOES",
      toolsCap: "TOOLS",
      hardwareCap: "HARDWARE",
      moneyCap: "WHERE THE MONEY GOES",
      prevBtn: "Previous",
      nextBtn: "Next stage",
      stages: [
        { name: "Gather data", tagline: "Assemble a massive, mostly-text corpus.", before: "The open web, books, Wikipedia, GitHub, licensed archives", after: "~10–15 trillion tokens of raw text (FineWeb, The Stack, …)", labs: "Crawl, license and pool sources; strike data deals; fight the quality and legal battles. Increasingly the hardest, most contested stage.", tools: "Common Crawl, web crawlers, dataset pipelines (FineWeb, RedPajama, The Stack).", hardware: "Large CPU clusters + petabytes of storage. Little or no GPU yet.", money: "Storage, bandwidth, and data licensing — deals can run into the tens or hundreds of millions. Compute here is minor." },
        { name: "Clean & tokenize", tagline: "Filter the junk, then cut text into tokens.", before: "<div>BUY NOW!!!</div> · the cat sat on the mat · the cat sat on the mat", after: "", tokens: ["the", " cat", " sat", " on", " the", " mat"], labs: "Quality-filter (dedupe, drop spam, boilerplate and PII), then train a BPE tokenizer and encode the whole corpus to integer IDs.", tools: "Dedup (MinHash), quality classifiers; tokenizers (tiktoken, SentencePiece, HF tokenizers).", hardware: "CPU-heavy and distributed (Spark / Ray). GPU optional.", money: "Mostly engineer time and CPU compute — cheap next to training, but it decides the final quality." },
        { name: "Pretrain", tagline: "Predict the next token, trillions of times.", before: "context — the cat sat on the ___", after: "", bars: [{ label: "mat", p: 0.71 }, { label: "floor", p: 0.13 }, { label: "dog", p: 0.08 }, { label: "the", p: 0.05 }, { label: "sat", p: 0.03 }], labs: "Launch the big training run for weeks to months; babysit loss curves, restarts and instabilities. The output is the base model.", tools: "PyTorch / JAX, Megatron / DeepSpeed / FSDP, distributed schedulers, experiment tracking.", hardware: "Thousands to tens of thousands of H100 / TPU accelerators on fast interconnect (InfiniBand / NVLink).", money: "The megabill: a frontier run is often $10M–$100M+ in GPU-time. This dominates the entire budget." },
        { name: "Fine-tune & align", tagline: "Turn a text-completer into a helpful assistant.", before: "base model → \"How do I sort a list? How do I reverse a list? How do I…\"", after: "aligned → \"Use sorted(xs), or xs.sort() to sort in place. Example: …\"", labs: "Instruction-tune on curated examples, then RLHF / DPO on human preference data; red-team for safety.", tools: "SFT + RLHF / DPO (e.g. TRL), reward models, human annotation platforms.", hardware: "Tens to hundreds of GPUs — far less than pretraining — plus a large human labeling workforce.", money: "Compute is modest; the spend shifts to people — annotators, domain experts, red-teamers. Quality beats quantity." },
        { name: "Evaluate", tagline: "Prove it works — and doesn't misbehave.", before: "candidate model + benchmark & safety suites", after: "MMLU 86% · HumanEval 74% · safety ✓ → go / no-go", labs: "Run public and private benchmarks, capability and safety evals, regression tests; sometimes external audits before release.", tools: "Eval harnesses (lm-eval-harness), private eval sets, LLM-as-judge, red-team suites.", hardware: "Modest inference GPUs — mostly running the model across test sets.", money: "Little compute; the cost is eval design, private test sets, and human review time." },
        { name: "Host / serve", tagline: "Make the weights answer requests.", before: "the final weights — a big folder of tensors", after: "an API endpoint — or a file you run locally with Ollama", labs: "Deploy on inference infra with batching, quantization and autoscaling behind an API — or publish open weights for others to self-host.", tools: "Serving: vLLM, TGI, TensorRT-LLM. Local: Ollama, llama.cpp. Quantization: GGUF, AWQ.", hardware: "Fleets of inference GPUs (A100 / H100 / L40S) for an API; a single consumer GPU or a laptop for a quantized local model.", money: "Ongoing and usage-based: GPU-hours per million tokens. Closed = rent forever; open weights self-hosted = pay only your own hardware." },
      ],
      explainQ: "Pretraining costs 10–100× more than fine-tuning, yet fine-tuning is what makes a chatbot feel smart. Why spend the fortune on pretraining at all?",
      explainA: "Because fine-tuning only steers knowledge the model already has — it can't create it. Pretraining is where the model actually learns language, facts and patterns, by compressing trillions of tokens into its weights. Fine-tuning then spends comparatively little to point that latent capability at \"be a helpful assistant.\" Skip pretraining and there is nothing to align; skip alignment and you have a powerful model that won't follow instructions. The fortune goes to pretraining because that is where the capability is created — everything after is cheap shaping.",
      deeperTitle: "Go deeper: why the cost is so lopsided",
      deeperBody: "Pretraining runs one forward+backward pass over ~10^13 tokens with ~10^11 parameters — training FLOPs scale as roughly 6 × params × tokens, which is where the eight-figure GPU bills come from. Fine-tuning touches thousands to millions of examples, often with parameter-efficient methods (LoRA) that update under 1% of the weights, so it is orders of magnitude cheaper. Serving is different again: no training math, just repeated forward passes — cheap per request, but it never stops, so at scale inference can out-spend training over a model's lifetime.",
      nextWord: "Tokens",
    },
    tok: {
      flowText: "YOUR TEXT",
      flowTokens: "TOKENS",
      flowIds: "NUMBERS",
      flowCaption: "A model can't read letters. Your text is chopped into tokens, and every token becomes a number. Those numbers are the only thing the model ever sees.",
      calcLabel: "TRY IT · LIVE",
      calcTitle: "Token calculator",
      calcInputLabel: "Type or paste anything",
      seed: 'A model never sees "strawberry" — it sees 3 tokens. Try 1234567, {"id":42}, https://libreai.dev 🌱',
      countLabel: "TOKENS",
      idsLabel: "THE NUMBERS (TOKEN IDS)",
      decodeLabel: "WHAT EACH NUMBER MEANS",
      loading: "Loading the real GPT-4o tokenizer…",
      engineNote: "This is the real tokenizer (o200k, GPT-4o) running in your browser — nothing here is faked.",
      legendWord: "word",
      legendSub: "word piece",
      legendSpace: "space",
      legendPunct: "symbol",
      legendNum: "number",
      legendByte: "raw bytes",
      tryLabel: "SEE IT BREAK",
      tryTitle: "Why models do “dumb” things",
      tryBody: "Tap an example. Every classic model failure is really just tokenization showing through.",
      presets: [
        { label: "strawberry", text: "strawberry", note: "One word, 3 tokens. The model never sees the letters — so “how many r’s?” is a trick question." },
        { label: "1234567", text: "1234567", note: "Split into 123 / 456 / 7. The digits don’t line up by place value, so long-number math goes wrong." },
        { label: "🌱 emoji", text: "🌱", note: "One emoji becomes 2 number-only tokens of raw bytes — no character in sight." },
        { label: "JSON", text: '{"id":42}', note: "Punctuation and keys each cost tokens. Structure is never free." },
        { label: "Spanish", text: "El gato se sentó en la alfombra", note: "The same idea as in English, but more tokens — non-English text costs more to say." },
      ],
      dictLabel: "THE DICTIONARY",
      dictTitle: "One fixed list of ~200,000 pieces",
      dictBody: "A tokenizer isn’t smart — it’s just a fixed **dictionary**. Every entry pairs one **piece of text** with one **number**. Tokenizing your prompt is nothing more than looking each piece up to get its number; when the model replies in numbers, the same list runs in reverse to turn them back into text. Here are a few **common words** — each already its own single entry:",
      dictSearchLabel: "Look up your own text in the dictionary",
      dictColId: "NUMBER",
      dictColPiece: "PIECE OF TEXT",
      dictColKind: "KIND",
      dictRandom: "Roll random entries",
      dictCommon: "Common words",
      dictNote: "Real entries from the o200k dictionary. Spaces shown as ␣, line breaks as ⏎.",
      dictEmpty: "Type something to look it up.",
      commonWords: ["the", "and", "cat", "water", "house", "hello", "world", "time", "people", "make"],
      dictWhyLabel: "WHY THE COUNT VARIES",
      dictWhyTitle: "Why some words are several tokens",
      dictWhyBody: "The list only has room for so many entries. **Common words earn their own single entry** — they show up so often it’s worth it. A **rarer or longer word has no entry of its own**, so the tokenizer builds it from the smaller pieces it *does* have. That’s the whole reason one word can be 1 token and the next is 3:",
      dictWhyCommon: "cat",
      dictWhyRare: "strawberry",
      dictWhyInList: "In the list — one entry",
      dictWhyBuilt: "Not in the list — built from pieces",
      curiosityLabel: "CURIOSITY",
      curiosityBody: "So why do tokens average **~4 characters** each? It falls straight out of the fixed vocabulary. With only **~200,000 slots**, the tokenizer spends them on the **common** words — each gets its own single token — while rare and long words are built from smaller pieces. Averaged over ordinary English, that trade-off lands at **~4 characters per token**. Feed it code or another language and the average shifts.",
      curiosityBody2: "And why ~200,000, not millions? That size is itself a **sweet spot**. A **bigger vocabulary** packs more text into each token — but every extra slot adds a row to the model’s embedding table, and slots for words too rare to appear often barely get learned. **Too small** and text shatters into many pieces, so sequences grow long and slow to process. **~100k–200k** balances the two: short sequences without a bloated, half-wasted vocabulary.",
      cmpLabel: "TOKENIZERS DIFFER",
      cmpTitle: "Same words, different tokenizer, different bill",
      cmpBody: "There’s no single “correct” tokenizer. Newer models ship bigger dictionaries that pack more text into each token — so the very same sentence can cost fewer tokens on GPT-4o than on GPT-4.",
      cmpNote: "Live token counts for your text above, from two real GPT tokenizers.",
      cmpForYourText: "your text above",
      cmpLangTitle: "Same meaning, two languages",
      cmpLangBody: "Because these dictionaries were built mostly from English, other languages get chopped into more pieces — so Spanish routinely costs 20–30% more tokens to say the exact same thing.",
      cmpEnLabel: "English",
      cmpEsLabel: "Spanish",
      cmpEnText: "The cat sat on the mat and looked out the window.",
      cmpEsText: "El gato se sentó en la alfombra y miró por la ventana.",
      tokensWord: "tokens",
      bridgeLabel: "NEXT: WHERE TOKENS COME FROM",
      bridgeBody: "These numbers are the model’s entire world. Line up the tokens from a million web pages — trillions of them — and you have the giant block of numbers a model trains on. That’s the next lesson.",
    },
    data: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 3",
      title: "Data",
      lede: "A model’s knowledge is just the text it was fed. Follow one web page from raw crawl to a clean tape of token numbers — and watch how much gets thrown away.",
      prev: "Tokens",
      next: "Bias",
      heroRawLabel: "RAW PAGE (WIKITEXT / HTML)",
      heroCleanLabel: "CLEAN TEXT",
      heroTokensLabel: "TOKENS",
      heroIdsLabel: "THE TAPE (INTEGERS)",
      heroRaw: "<p>'''Photosynthesis''' {{nbsp}}turns [[light]] into <b>chemical energy</b>.</p>",
      heroClean: "Photosynthesis turns light into chemical energy.",
      heroCaption: "Every page takes this trip: strip the markup to plain text, cut the text into tokens, store the token IDs. Do it a billion times and you have a training set.",
      concept: [
        "A model has no facts of its own. Everything it “knows” came from a **giant pile of text** — most of it scraped from the public web, plus books, code, and reference sites like **Wikipedia** (our running example here).",
        "But raw web is filthy: navigation bars, ads, spam, duplicates, and pages you must *not* train on. So labs run the crawl through a **cleaning pipeline** before a single token reaches the model.",
        "The surprising part: **quality beats raw size.** A smaller, well-filtered corpus trains a better model than a bigger dirty one — so most of what’s collected is deliberately thrown away.",
      ],
      cleanLabel: "TRY IT · THE PIPELINE",
      cleanTitle: "Clean this dataset",
      cleanBody: "Here’s a tiny raw crawl of 15 documents. Run it through the pipeline one stage at a time and watch what survives. Each stage drops or rewrites cards; the meter tracks how many docs and tokens are left.",
      rawStageName: "Raw crawl",
      stepperHint: "The cleaning pipeline — click any stage to jump to it, or run it end to end below.",
      stages: [
        { name: "Extract text", desc: "Strip HTML and wikitext to plain text. Pages that were only navigation and boilerplate vanish." },
        { name: "Deduplicate", desc: "Collapse near-identical pages to one copy — the web is full of mirrors, and duplicates make models memorise instead of learn." },
        { name: "Quality filter", desc: "Score each page and drop spam and gibberish. A model-based “is this textbook-like?” classifier does this at scale." },
        { name: "Decontaminate & scrub", desc: "Remove personal data, and drop anything that looks like a test question — you must not train on the exam." },
        { name: "Tokenize", desc: "Turn each surviving page into token IDs with the real tokenizer. This is the tape the model actually trains on." },
      ],
      docsKeptLabel: "DOCS KEPT",
      tokensKeptLabel: "TOKENS KEPT",
      runLabel: "Run the pipeline",
      nextStageLabel: "Next stage →",
      resetLabel: "Reset",
      reasonBoilerplate: "Only navigation & boilerplate",
      reasonDup: "duplicate — collapsed to 1",
      reasonSpam: "Low quality — spam / gibberish",
      reasonPii: "Contains personal data",
      reasonBenchmark: "Looks like a test question",
      keptBadge: "kept",
      qualityWord: "quality",
      resultTitle: "What’s left is the model’s world",
      resultBody: "Most of the pile is gone — and everything the model will ever “know” is now in the survivors. Get this wrong and the model is wrong; there is no later stage that adds back what cleaning removed.",
      illustrativeNote: "Toy corpus. Similarity and quality scores here are illustrative, not a real classifier — but the stages and their order are exactly what frontier labs run.",
      docsWord: "docs",
      tokensWord: "tokens",
      docs: [
        { id: "photosynthesis", title: "Photosynthesis", raw: "<p>'''Photosynthesis''' is the process by which green [[plant]]s convert light energy into chemical energy stored as glucose, releasing oxygen as a by-product.</p>" },
        { id: "photosynthesis-dup", title: "Photosynthesis (mirror)", raw: "Photosynthesis is the process green plants use to convert light energy into chemical energy stored as glucose, releasing oxygen as a by-product." },
        { id: "andes", title: "Andes", raw: "<p>The '''Andes''' are the longest continental mountain range in the world, running about 7,000 km along the western edge of [[South America]].</p>" },
        { id: "andes-nav", title: "Andes — nav footer", raw: "<nav><a href=\"/home\">Home</a> · <a href=\"/edit\">Edit</a> · <a href=\"/talk\">Talk</a></nav><div class=\"ad\">Advertisement — sign up now!</div>" },
        { id: "jupiter-html", title: "Jupiter", raw: "<div class=\"infobox\"><h1>Jupiter</h1><p>Jupiter is the fifth planet from the Sun and the <b>largest</b> in the Solar System, a gas giant.</p></div>" },
        { id: "printing", title: "Printing press", raw: "The printing press, introduced by Johannes Gutenberg around 1440, made books cheap to reproduce and helped spread literacy across Europe." },
        { id: "casino-spam", title: "Casino ad", raw: "🎰 BEST ONLINE CASINO!!! WIN $$$$ NOW!!! CLICK HERE CLICK HERE BONUS BONUS!!! 🎰🎰🎰" },
        { id: "seo-spam", title: "SEO page", raw: "cheap flights cheap flights buy cheap flights best cheap flights cheap flights deals cheap flights now cheap flights" },
        { id: "contact-pii", title: "Project contact", raw: "For enquiries about the Riverside project, email Maria Gomez at maria.gomez@example.com or call +1-555-0142." },
        { id: "quiz-benchmark", title: "Quiz item", raw: "Question: Which gas do plants release during photosynthesis? A) Nitrogen B) Oxygen C) Hydrogen D) Argon. Answer: B) Oxygen." },
        { id: "turing", title: "Alan Turing", raw: "<p>'''Alan Turing''' was a British mathematician who formalised computation with the [[Turing machine]] and helped break the Enigma cipher during the Second World War.</p>" },
        { id: "turing-dup", title: "Alan Turing (mirror)", raw: "Alan Turing, a British mathematician, formalised computation with the Turing machine and helped break the Enigma cipher in World War II." },
        { id: "gibberish", title: "Untitled", raw: "asdf qwer zxcv asdf qwer 00 11 22 zzzz asdfqwer lorem asdf qwer zxcv 99 88" },
        { id: "everest", title: "Mount Everest", raw: "Mount Everest, on the border of Nepal and China, is Earth’s highest mountain above sea level, reaching about 8,849 metres." },
        { id: "cookie-boilerplate", title: "Cookie banner", raw: "<div class=\"cookie\">We use cookies to improve your experience. <button>Accept all</button> <button>Reject</button></div>" },
      ],
      scaleLabel: "TRY IT · SCALE",
      scaleTitle: "One page, then a billion",
      scaleBody: "A clean page is about 1,000 tokens. Now scale up: drag from one page to a million and watch the tape — and the disk it needs — grow. Each cell is a token, coloured by ID; the darker lines are document separators.",
      scalePagesLabel: "PAGES",
      scaleTokensLabel: "TOKENS",
      scaleStorageLabel: "STORAGE (uint16)",
      denseBlockLabel: "THE DENSE BLOCK",
      denseBlockNote: "A window into the tape — each square is one token ID.",
      denseSepLabel: "document separator",
      hoverHint: "Hover a cell for its token ID.",
      compareTitle: "Even all of Wikipedia is a rounding error",
      compareBody: "Stack every English Wikipedia article together and you get about 4 billion tokens. A frontier model trains on roughly 15 trillion. Wikipedia is around **0.03%** of the diet — which is exactly why labs crawl the whole web.",
      compareWiki: "All English Wikipedia",
      compareFrontier: "Frontier training corpus",
      compareNote: "Linear scale — that thin sliver on the left is all of Wikipedia. ~4B vs ~15,000B tokens.",
      tapeLabel: "WHY A FLAT TAPE",
      tapeTitle: "Why it’s stored as one long line of integers",
      tape: [
        "The model only ever eats integers, so the corpus is **tokenized once and saved as the numbers** — never re-parsed from text at training time. Tokenizing 15 trillion tokens is expensive; you pay it once.",
        "They’re stored as **fixed-width integers** (a ≤65k vocab fits in a 2-byte `uint16`), packed end to end into one huge array. Fixed width means the file is **memory-mappable** and any training sample is an **O(1) random-access** slice — grab a window from anywhere instantly.",
        "Documents are simply concatenated, with a special **document-separator token** between them so the model can tell where one ends and the next begins.",
      ],
      loopLabel: "FULL CIRCLE",
      loopTitle: "The tokenizer came from this data too",
      loopBody: "Remember the tokenizer’s dictionary from the last lesson? It wasn’t handed down — its merges were **fit to a sample of this same cleaned corpus**, then frozen and applied to all of it. The data shapes the tokenizer, and the tokenizer encodes the data. That’s the loop that produces the tape.",
      explainQ: "A colleague says: “Just train on more data — scrape everything, don’t bother filtering, more is always better.” Where does that go wrong?",
      explainA: "Because the model becomes its data — skews, spam, and all. Duplicates push it to memorise instead of generalise; spam and boilerplate crowd out signal; leaving in test questions inflates scores without real ability; and un-scrubbed personal data can be regurgitated. Past a point, a smaller clean corpus beats a bigger dirty one: you’re not just adding text, you’re defining what the model knows.",
      deeperTitle: "Go deeper: BPE fitting, dedup and the data blend",
      deeperBody: "Dedup at scale uses MinHash / LSH to find near-duplicates without comparing every pair. Quality filtering blends cheap heuristics with a learned classifier trained on “good” reference text. The corpus is also a deliberate **blend** — web, code, books, math, multilingual — reweighted to shape capabilities, though it’s an open research problem exactly how a mix maps to skills. And the tokenizer’s BPE merges are fit on a representative sample of the final corpus, so vocabulary and data co-evolve.",
      bridgeLabel: "NEXT: THE DATA HAS A POINT OF VIEW",
      bridgeBody: "You just made a dozen cleaning choices — what’s “quality,” what’s a “duplicate,” which languages made the cut. Every one of those is a value choice, and the model inherits all of them. That’s bias, and it’s the next lesson.",
    },
    bias: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 4",
      title: "Bias",
      lede: "A model is a compression of its corpus, so it inherits the corpus’s skews. Nobody injects bias — the model just learns the statistics of the text it was shown, faithfully.",
      prev: "Data",
      next: "Neural networks",
      concept: [
        "Last lesson you cleaned a dataset. This lesson is about what that dataset *contained* — because a model can only mirror the text it’s built from. If a viewpoint is rare in the data, it’s rare in the model; if it’s dominant, the model treats it as the default.",
        "So “bias” here isn’t a bug someone added. It’s the **data’s statistics, learned faithfully.** That’s an important reframing: the fix is never “remove the bias” — it’s understanding whose text the corpus is made of, and deciding what to do about it.",
        "And here’s the part that ties back to this whole stage: **every collection and cleaning choice is a value choice.** What counts as quality, what gets deduplicated, which languages are worth crawling — each one quietly shapes who the model serves best.",
      ],
      repLabel: "TRY IT · WHO’S IN THE DATA",
      repTitle: "Who’s in the data vs. who’s in the world",
      repBody: "Training text isn’t a neutral sample of humanity — it’s mostly English and mostly Global-North. Select a language to compare its share of training text with its share of the world’s people.",
      repTextLabel: "SHARE OF TRAINING TEXT",
      repPopLabel: "SHARE OF WORLD POPULATION",
      langs: [
        { key: "English", text: 0.46, pop: 0.05 },
        { key: "Chinese", text: 0.06, pop: 0.12 },
        { key: "Spanish", text: 0.05, pop: 0.06 },
        { key: "Hindi", text: 0.005, pop: 0.07 },
        { key: "Arabic", text: 0.007, pop: 0.04 },
        { key: "All others", text: 0.42, pop: 0.66 },
      ],
      repOver: "over-represented",
      repUnder: "under-represented",
      repFactorWord: "in the data vs. the world",
      repSelectHint: "Select a language to see the gap.",
      repNote: "Illustrative shares, rounded — real figures vary by corpus, but the shape is robust: English dominates the text far beyond its share of speakers. This is also why, from the Tokens lesson, Spanish and other languages cost more tokens and are modelled less well — the case for local, own-data models.",
      filterLabel: "TRY IT · THE FILTER’S NORM",
      filterTitle: "Your quality filter has an opinion",
      filterBody: "Remember the quality filter from the Data lesson? It rewards a particular style — formal, edited, encyclopaedic prose. The same idea said plainly scores lower. Tap a pair and watch the exact same meaning get two different scores.",
      pairs: [
        {
          topic: "Public transit",
          formal: "The municipal council convened to evaluate proposals for improving public transportation across the district.",
          informal: "the council got together to look at ideas for making the buses better around here.",
          note: "Same meaning. The formal version scores higher only because it matches the filter’s house style, not because it’s more true or more useful.",
        },
        {
          topic: "A study result",
          formal: "Researchers observed that the intervention substantially reduced reported symptoms among most participants.",
          informal: "the study found the treatment helped most folks feel a lot better.",
          note: "Everyday, spoken, and many world-English registers land lower — so they’re filtered out more often, and the model hears less of how most people actually talk.",
        },
        {
          topic: "Cooking",
          formal: "The recipe requires that the dough be allowed to rest for a minimum of thirty minutes before baking.",
          informal: "let the dough chill for like half an hour before you bake it.",
          note: "Neither is wrong. But if “quality” means “reads like an encyclopaedia,” the corpus quietly tilts toward one voice and away from others.",
        },
      ],
      filterFormalLabel: "Formal / edited",
      filterInformalLabel: "Informal / spoken",
      filterScoreWord: "quality",
      filterNote: "Same illustrative scorer as the Data lesson. The point isn’t the exact numbers — it’s that “quality” is defined against a norm, and every norm includes some voices and excludes others.",
      assocLabel: "A GLIMPSE AHEAD",
      assocTitle: "Bias also hides in what sits next to what",
      assocBody: "There’s a subtler kind of skew. Models learn from **co-occurrence** — which words show up near which. If a corpus overwhelmingly pairs one job with one gender, or one place with one adjective, the model absorbs that association as if it were fact. You can’t see it in any single sentence; it lives in the statistics. Two lessons from now, in **Embeddings**, you’ll *see* these associations as directions in vector space — and measure them.",
      mitLabel: "WHAT CAN BE DONE",
      mitTitle: "Partial fixes, genuinely debated",
      mitBody: "There’s no unbiased corpus to reach for — only choices, each with trade-offs. These are the main levers, and reasonable people disagree about when and how far to use them.",
      mitigations: [
        { title: "Reweight the blend", body: "Up-sample under-represented languages and sources so they carry more weight. Helps coverage — but too much repetition of scarce data hurts quality, so it’s a balancing act." },
        { title: "Collect on purpose", body: "Commission and digitise text for low-resource languages and communities instead of only crawling what’s already online. Slow and costly, but it fixes the source, not just the symptom." },
        { title: "Document the data", body: "Datasheets and data statements record what a corpus contains and omits, so downstream users know its blind spots. Transparency, not a cure." },
        { title: "Measure the skew", body: "Bias evaluations probe a trained model for specific disparities. Useful signal — but a benchmark only tests what its authors thought to ask." },
      ],
      mitClosing: "None of these produces a “neutral” model, and that’s the honest takeaway: there is no view from nowhere. The goal isn’t a bias-free corpus — it’s making the choices **visible and deliberate** instead of accidental.",
      explainQ: "Someone says: “Just train the model on unbiased data and the bias problem goes away.” Why is that not really possible?",
      explainA: "Because there’s no neutral corpus to train on. Any collection of text over-represents whoever writes the most and gets crawled the most — a specific slice of languages, places, and registers — and cleaning choices add more values on top. A model faithfully compresses whatever skew is in its data, so bias can be measured, reduced, and documented, but not eliminated. The realistic goal is to make the choices explicit and accountable, not to pretend a value-free dataset exists.",
      deeperTitle: "Go deeper: representation vs. allocation, and why evals are hard",
      deeperBody: "It helps to separate representational skew (how groups are depicted in the text) from allocational effects (how a deployed system’s decisions help or harm groups) — mitigations differ for each. Measurement is genuinely hard: association tests can be unstable, benchmarks only cover imagined cases, and reducing one measured disparity can worsen another, so there’s rarely a single knob that makes a model “fair.” This is active, contested research — treat confident one-line fixes with suspicion.",
      bridgeLabel: "NEXT: INSIDE THE MODEL",
      bridgeBody: "You’ve followed the data all the way in — sourced, tokenized, cleaned, and skewed. Next we open the thing it trains: the neural network that turns all those token numbers into predictions.",
    },
    stage1List: [
      "The life of an LLM",
      "Tokens",
      "Data",
      "Bias",
      "Neural networks",
      "How training works",
      "Embeddings",
      "Transformers",
      "Pretraining → alignment",
    ],
  },

  es: {
    badge: "Libre y abierto · parte de libreai.dev",
    heroTitle: "Conviértete en ingeniero AI-native.",
    heroSub:
      "Una guía práctica e interactiva para ingenieros de software que todavía no saben de IA — desde cómo se construyen los modelos hasta ejecutar el tuyo. En español e inglés.",
    ctaStart: "Empezar la Etapa 1",
    ctaPaths: "Elige tu ruta",
    graphicLabel: "LA CAJA NEGRA, ABIERTA",
    graphicMetaWord: "ENTENDIDO",
    legend1: "Lo que entiendes — y por tanto puedes cambiar, ejecutar y hacer tuyo.",
    legend2: "Lo que sigue siendo magia mientras otro se queda con los pesos.",
    whyLede:
      "La IA se está construyendo como una caja negra que alquilas. No tiene que ser así — pero solo quien entiende cómo está hecha puede elegir otro camino.",
    roadmapLabel: "LA RUTA",
    roadmapTitle: "Seis etapas, sin conocimientos previos de IA.",
    roadmapSub:
      "Empieza en la Etapa 1 para el panorama completo, o salta a la Etapa 3 si necesitas entregar ya. Cada etapa termina con algo que funciona.",
    howLabel: "CÓMO FUNCIONA",
    howTitle: "Hecho como los ingenieros aprenden de verdad.",
    how1: "Interactivo primero",
    how1d:
      "Cada lección trae algo que ajustas hasta que la idea encaja. Leer es el respaldo.",
    how2: "Explícalo de vuelta",
    how2d:
      "Reformulas la idea antes de avanzar: el chequeo que separa leer de saber.",
    how3: "Español e inglés",
    how3d:
      "Ambos idiomas se escriben desde cero, no se traducen al final. Ninguno es el principal.",
    how4: "Libre y abierto",
    how4d:
      "Lecciones y componentes abiertos, sin cuenta. Aporta una lección o una traducción por PR.",
    pathsLabel: "DOS RUTAS",
    pathsTitle: "Elige la que se ajusta a tu plazo.",
    path1Route: "ETAPA 3 → 4 → 6",
    path1: "Vía rápida para construir",
    path1d:
      "Necesitas entregar una función con IA este trimestre. Agentes, RAG, evals, costos, guardarraíles — y luego tu proyecto final.",
    path1cta: "Empezar la vía rápida",
    path2Route: "ETAPA 1 → 6",
    path2: "Entendimiento profundo",
    path2d:
      "El panorama completo: tokens, entrenamiento, embeddings, atención — y todo lo de la vía rápida. Sabrás el por qué, no solo el cómo.",
    path2cta: "Empezar desde el principio",
    backRoadmap: "Volver a la ruta",
    stage1Label: "ETAPA 1 · 9 LECCIONES",
    stage1Title: "Fundamentos",
    crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 2",
    lessonTitle: "Tokens",
    lessonLede:
      "El modelo nunca ve tus palabras: ve tokens. Ese único hecho explica tu factura, tu límite de contexto y los errores más raros de los modelos.",
    p1: "Un token es un trozo de texto: normalmente una **palabra común**, un **fragmento de palabra** o un **signo de puntuación**. Antes de cualquier cosa, tu texto se corta en esos trozos y cada uno se cambia por un número. Piénsalo como la **codificación de caracteres** del modelo: la unidad en la que cuenta y la única que puede leer o escribir.",
    conceptList: [
      "**Es lo que pagas.** La facturación cuenta tokens, en las dos direcciones — tu prompt y la respuesta.",
      "**Es lo que mide la ventana de contexto.** Un límite de 8k son 8.000 *tokens*, no 8.000 palabras.",
      "**El inglés cabe en ~4 caracteres por token**, así que un prompt de 1.000 palabras ronda los 1.300 tokens. El código, el JSON y otros idiomas caben en menos — el español suele costar entre 20% y 30% más para decir lo mismo.",
      "**Explica los fallos “tontos”.** Un modelo cuenta mal las letras de “strawberry” porque vio 3 trozos, no letras; se equivoca con `1234567` porque se parte en 123 / 456 / 7. Es la tokenización asomándose, no un fallo de razonamiento.",
    ],
    playLabel: "INTERACTIVO",
    playTitle: "Tokenizador en vivo",
    tokensLabel: "TOKENS",
    charsLabel: "CARACT.",
    costLabel: "COSTO ENTRADA",
    inputLabel:
      "Escribe o pega lo que quieras: los chips de abajo son los tokens que vería el modelo.",
    playNote:
      "Un tokenizador subword simplificado, suficiente para sentir el efecto: prueba un número largo, una URL, algo de JSON, un emoji y la misma frase en español. El costo asume 3 USD por millón de tokens de entrada.",
    explainLabel: "EXPLÍCALO DE VUELTA",
    explainQ:
      "Con tus palabras: ¿por qué un modelo cuenta mal las letras de una palabra?",
    explainA:
      "Porque nunca recibe letras. La palabra llega ya cortada en unos pocos tokens subword, cada uno un número opaco, así que no hay nada con forma de letra que contar. Pedirle el conteo de letras es pedirle un dato sobre un texto que no puede ver — por eso un script de dos líneas lo hace perfecto y un modelo de frontera a veces no.",
    deeperTitle: "Más a fondo: cómo se construye el vocabulario",
    deeperBody:
      "La mayoría de los modelos usa byte-pair encoding. Se parte de bytes crudos como vocabulario, se cuentan los pares adyacentes en un corpus enorme, se fusiona el par más frecuente en un token nuevo y se repite decenas de miles de veces. Las palabras frecuentes sobreviven completas; las raras se descomponen en fragmentos. Como la lista de fusiones se aprende del corpus de entrenamiento, un tokenizador entrenado casi todo en inglés es estructuralmente más caro para el resto — una razón por la que el español cuesta más por idea, y una razón por la que importan los tokenizadores abiertos y entrenados localmente.",
    prev: "La vida de un LLM",
    next: "Datos",
    markComplete: "Marcar como completada",
    completed: "✓ Completada",
    reveal: "Ver una respuesta modelo",
    hide: "Ocultar la respuesta",
    progress: "completado",
    footer: "libreai Academy · libre y abierto, siempre",
    contribute: "Aporta una lección",
    contact: "Contacto",
    stages: [
      { title: "Fundamentos", desc: "Cómo funciona la IA por dentro: tokens, entrenamiento, embeddings, atención.", lessons: 9, pct: 25 },
      { title: "Trabajar con LLMs", desc: "Prompting, sampling, presupuesto de contexto, salida estructurada.", lessons: 5, pct: 0 },
      { title: "Programar con agentes", desc: "Claude Code, Codex, archivos de reglas, permisos, hooks, MCP.", lessons: 7, pct: 0 },
      { title: "Llevar IA a tu software", desc: "RAG, tool calling, agentes, guardarraíles, evals, control de costos.", lessons: 10, pct: 0 },
      { title: "Hazlo tuyo", desc: "Datasets, fine-tuning, modelos de pesos abiertos, local y self-hosted.", lessons: 8, pct: 0 },
      { title: "Proyecto final", desc: "Tu propia IA, con tus propios datos, self-hosted de principio a fin.", lessons: 1, pct: 0 },
    ],
    lessonsWord: "LECCIONES",
    start: "Empezar",
    review: "Repasar",
    locked: "Ver",
    life: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 1",
      title: "La vida de un LLM",
      lede: "El modelo con el que chateas es el último paso de una línea de montaje de seis etapas. Aquí tienes cada una — qué pasa de verdad, las herramientas y el hardware que usan los labs, y a dónde va el dinero.",
      intro: "Recorre la tubería. Cada etapa muestra un antes → después real, más lo que hace el lab, las herramientas, el hardware y el gasto.",
      stagesLabel: "LA TUBERÍA",
      beforeCap: "ANTES",
      afterCap: "DESPUÉS",
      labsCap: "QUÉ HACE EL LAB",
      toolsCap: "HERRAMIENTAS",
      hardwareCap: "HARDWARE",
      moneyCap: "A DÓNDE VA EL DINERO",
      prevBtn: "Anterior",
      nextBtn: "Siguiente etapa",
      stages: [
        { name: "Reunir datos", tagline: "Reunir un corpus enorme, casi todo texto.", before: "La web abierta, libros, Wikipedia, GitHub, archivos con licencia", after: "~10–15 billones de tokens de texto crudo (FineWeb, The Stack, …)", labs: "Rastrear, licenciar y juntar fuentes; cerrar acuerdos de datos; pelear las batallas de calidad y legales. Cada vez la etapa más difícil y disputada.", tools: "Common Crawl, crawlers, pipelines de datasets (FineWeb, RedPajama, The Stack).", hardware: "Grandes clústeres de CPU + petabytes de almacenamiento. Poco o nada de GPU todavía.", money: "Almacenamiento, ancho de banda y licencias de datos — los acuerdos pueden llegar a decenas o cientos de millones. El cómputo aquí es menor." },
        { name: "Limpiar y tokenizar", tagline: "Filtrar la basura y cortar el texto en tokens.", before: "<div>¡COMPRA YA!!!</div> · el gato se sentó en la alfombra · el gato se sentó en la alfombra", after: "", tokens: ["el", " gato", " se", " sentó", " en", " la", " alfombra"], labs: "Filtrar por calidad (deduplicar, quitar spam, boilerplate y PII), luego entrenar un tokenizador BPE y codificar todo el corpus a IDs enteros.", tools: "Deduplicación (MinHash), clasificadores de calidad; tokenizadores (tiktoken, SentencePiece, HF tokenizers).", hardware: "Intensivo en CPU y distribuido (Spark / Ray). GPU opcional.", money: "Sobre todo tiempo de ingeniería y cómputo de CPU — barato frente al entrenamiento, pero decide la calidad final." },
        { name: "Preentrenar", tagline: "Predecir el siguiente token, billones de veces.", before: "contexto — el gato se sentó en la ___", after: "", bars: [{ label: "alfombra", p: 0.71 }, { label: "suelo", p: 0.13 }, { label: "perro", p: 0.08 }, { label: "la", p: 0.05 }, { label: "sentó", p: 0.03 }], labs: "Lanzar el gran entrenamiento durante semanas o meses; vigilar curvas de pérdida, reinicios e inestabilidades. La salida es el modelo base.", tools: "PyTorch / JAX, Megatron / DeepSpeed / FSDP, schedulers distribuidos, seguimiento de experimentos.", hardware: "De miles a decenas de miles de aceleradores H100 / TPU con interconexión rápida (InfiniBand / NVLink).", money: "La megafactura: un entrenamiento de frontera suele costar 10–100 M USD+ en GPU. Domina todo el presupuesto." },
        { name: "Fine-tuning y alineación", tagline: "Convertir un completador de texto en un asistente útil.", before: "modelo base → \"¿Cómo ordeno una lista? ¿Cómo invierto una lista? ¿Cómo…\"", after: "alineado → \"Usa sorted(xs), o xs.sort() para ordenar in situ. Ejemplo: …\"", labs: "Instruction-tuning con ejemplos curados, luego RLHF / DPO con datos de preferencia humana; red-teaming de seguridad.", tools: "SFT + RLHF / DPO (p. ej. TRL), modelos de recompensa, plataformas de anotación humana.", hardware: "De decenas a cientos de GPUs — mucho menos que el preentrenamiento — más una gran fuerza de anotadores.", money: "El cómputo es modesto; el gasto pasa a las personas — anotadores, expertos de dominio, red-teamers. La calidad supera a la cantidad." },
        { name: "Evaluar", tagline: "Demostrar que funciona — y que no se porta mal.", before: "modelo candidato + suites de benchmark y seguridad", after: "MMLU 86% · HumanEval 74% · seguridad ✓ → sí / no", labs: "Correr benchmarks públicos y privados, evals de capacidad y seguridad, tests de regresión; a veces auditorías externas antes de lanzar.", tools: "Harnesses de eval (lm-eval-harness), sets privados, LLM-as-judge, suites de red-team.", hardware: "GPUs de inferencia modestas — sobre todo correr el modelo sobre los sets de prueba.", money: "Poco cómputo; el costo es el diseño de evals, los sets privados y el tiempo de revisión humana." },
        { name: "Hospedar / servir", tagline: "Hacer que los pesos respondan peticiones.", before: "los pesos finales — una gran carpeta de tensores", after: "un endpoint de API — o un archivo que ejecutas local con Ollama", labs: "Desplegar en infra de inferencia con batching, cuantización y autoescalado tras una API — o publicar los pesos abiertos para que otros los self-hosteen.", tools: "Serving: vLLM, TGI, TensorRT-LLM. Local: Ollama, llama.cpp. Cuantización: GGUF, AWQ.", hardware: "Flotas de GPUs de inferencia (A100 / H100 / L40S) para una API; una sola GPU de consumo o un portátil para un modelo local cuantizado.", money: "Continuo y por uso: horas-GPU por millón de tokens. Cerrado = alquilas para siempre; pesos abiertos self-hosted = pagas solo tu propio hardware." },
      ],
      explainQ: "El preentrenamiento cuesta 10–100× más que el fine-tuning, y aun así el fine-tuning es lo que hace que un chatbot parezca inteligente. ¿Por qué gastar la fortuna en preentrenar?",
      explainA: "Porque el fine-tuning solo dirige conocimiento que el modelo ya tiene — no puede crearlo. El preentrenamiento es donde el modelo aprende de verdad el lenguaje, los hechos y los patrones, comprimiendo billones de tokens en sus pesos. El fine-tuning luego gasta comparativamente poco en apuntar esa capacidad latente hacia \"sé un asistente útil.\" Sin preentrenamiento no hay nada que alinear; sin alineación tienes un modelo potente que no sigue instrucciones. La fortuna va al preentrenamiento porque ahí se crea la capacidad — todo lo demás es moldeado barato.",
      deeperTitle: "Más a fondo: por qué el costo es tan desigual",
      deeperBody: "El preentrenamiento hace una pasada adelante+atrás sobre ~10^13 tokens con ~10^11 parámetros — los FLOPs de entrenamiento escalan como ~6 × parámetros × tokens, de ahí las facturas de ocho cifras en GPU. El fine-tuning toca de miles a millones de ejemplos, a menudo con métodos eficientes en parámetros (LoRA) que actualizan menos del 1% de los pesos, así que es órdenes de magnitud más barato. El serving es otra cosa: sin matemática de entrenamiento, solo pasadas hacia adelante repetidas — barato por petición, pero no para nunca, así que a escala la inferencia puede gastar más que el entrenamiento durante la vida del modelo.",
      nextWord: "Tokens",
    },
    tok: {
      flowText: "TU TEXTO",
      flowTokens: "TOKENS",
      flowIds: "NÚMEROS",
      flowCaption: "Un modelo no puede leer letras. Tu texto se parte en tokens y cada token se vuelve un número. Esos números son lo único que el modelo llega a ver.",
      calcLabel: "PRUÉBALO · EN VIVO",
      calcTitle: "Calculadora de tokens",
      calcInputLabel: "Escribe o pega lo que quieras",
      seed: 'Un modelo nunca ve "strawberry": ve 3 tokens. Prueba 1234567, {"id":42}, https://libreai.dev 🌱',
      countLabel: "TOKENS",
      idsLabel: "LOS NÚMEROS (IDS DE TOKEN)",
      decodeLabel: "QUÉ SIGNIFICA CADA NÚMERO",
      loading: "Cargando el tokenizador real de GPT-4o…",
      engineNote: "Este es el tokenizador real (o200k, GPT-4o) corriendo en tu navegador — aquí no hay nada falso.",
      legendWord: "palabra",
      legendSub: "trozo",
      legendSpace: "espacio",
      legendPunct: "símbolo",
      legendNum: "número",
      legendByte: "bytes crudos",
      tryLabel: "MÍRALO FALLAR",
      tryTitle: "Por qué los modelos hacen cosas “tontas”",
      tryBody: "Toca un ejemplo. Cada fallo clásico de los modelos es en realidad la tokenización asomándose.",
      presets: [
        { label: "strawberry", text: "strawberry", note: "Una palabra, 3 tokens. El modelo nunca ve las letras — así que “¿cuántas r?” es una pregunta trampa." },
        { label: "1234567", text: "1234567", note: "Se parte en 123 / 456 / 7. Los dígitos no se alinean por valor posicional, y la aritmética de números largos falla." },
        { label: "🌱 emoji", text: "🌱", note: "Un emoji se vuelve 2 tokens de solo números (bytes crudos) — ni una letra a la vista." },
        { label: "JSON", text: '{"id":42}', note: "La puntuación y las claves cuestan tokens. La estructura nunca es gratis." },
        { label: "Español", text: "El gato se sentó en la alfombra", note: "La misma idea que en inglés, pero más tokens — el texto no inglés cuesta más." },
      ],
      dictLabel: "EL DICCIONARIO",
      dictTitle: "Una lista fija de ~200.000 piezas",
      dictBody: "Un tokenizador no es inteligente — es solo un **diccionario** fijo. Cada entrada empareja una **pieza de texto** con un **número**. Tokenizar tu prompt no es más que buscar cada pieza para obtener su número; cuando el modelo responde en números, la misma lista funciona al revés para volver a convertirlos en texto. Aquí tienes unas cuantas **palabras comunes** — cada una ya es su propia entrada:",
      dictSearchLabel: "Busca tu propio texto en el diccionario",
      dictColId: "NÚMERO",
      dictColPiece: "PIEZA DE TEXTO",
      dictColKind: "TIPO",
      dictRandom: "Entradas al azar",
      dictCommon: "Palabras comunes",
      dictNote: "Entradas reales del diccionario o200k. Espacios como ␣, saltos de línea como ⏎.",
      dictEmpty: "Escribe algo para buscarlo.",
      commonWords: ["el", "la", "gato", "agua", "casa", "hola", "mundo", "tiempo", "gente", "hacer"],
      dictWhyLabel: "POR QUÉ VARÍA LA CUENTA",
      dictWhyTitle: "Por qué algunas palabras son varios tokens",
      dictWhyBody: "La lista solo tiene espacio para tantas entradas. **Las palabras comunes se ganan su propia entrada** — aparecen tan a menudo que vale la pena. Una **palabra más rara o más larga no tiene entrada propia**, así que el tokenizador la arma con las piezas más pequeñas que *sí* tiene. Esa es toda la razón por la que una palabra es 1 token y la siguiente son 3:",
      dictWhyCommon: "gato",
      dictWhyRare: "descentralización",
      dictWhyInList: "En la lista — una entrada",
      dictWhyBuilt: "No está en la lista — armada con piezas",
      curiosityLabel: "CURIOSIDAD",
      curiosityBody: "¿Y por qué cada token promedia **~4 caracteres**? Sale directo del vocabulario fijo. Con solo **~200.000 ranuras**, el tokenizador las gasta en las palabras **comunes** — cada una recibe su propio token — mientras que las palabras raras y largas se arman con piezas más pequeñas. Promediado sobre el inglés corriente, ese equilibrio queda en **~4 caracteres por token**. Dale código u otro idioma y el promedio cambia.",
      curiosityBody2: "¿Y por qué ~200.000 y no millones? Ese tamaño es en sí un **punto justo**. Un **vocabulario más grande** mete más texto en cada token — pero cada ranura extra añade una fila a la tabla de embeddings del modelo, y las ranuras de palabras demasiado raras apenas se aprenden. **Demasiado pequeño** y el texto se rompe en muchas piezas, así que las secuencias se alargan y cuesta procesarlas. **~100k–200k** equilibra ambas: secuencias cortas sin un vocabulario inflado y medio desperdiciado.",
      cmpLabel: "LOS TOKENIZADORES DIFIEREN",
      cmpTitle: "Mismas palabras, otro tokenizador, otra factura",
      cmpBody: "No hay un único tokenizador “correcto”. Los modelos nuevos traen diccionarios más grandes que meten más texto en cada token — así la misma frase puede costar menos tokens en GPT-4o que en GPT-4.",
      cmpNote: "Conteos en vivo para tu texto de arriba, de dos tokenizadores reales de GPT.",
      cmpForYourText: "tu texto de arriba",
      cmpLangTitle: "Mismo significado, dos idiomas",
      cmpLangBody: "Como estos diccionarios se construyeron casi todo con inglés, otros idiomas se parten en más piezas — por eso el español suele costar 20–30% más tokens para decir exactamente lo mismo.",
      cmpEnLabel: "Inglés",
      cmpEsLabel: "Español",
      cmpEnText: "The cat sat on the mat and looked out the window.",
      cmpEsText: "El gato se sentó en la alfombra y miró por la ventana.",
      tokensWord: "tokens",
      bridgeLabel: "SIGUIENTE: DE DÓNDE VIENEN LOS TOKENS",
      bridgeBody: "Estos números son todo el mundo del modelo. Alinea los tokens de un millón de páginas web — billones de ellos — y tienes el bloque gigante de números con el que un modelo entrena. Esa es la próxima lección.",
    },
    data: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 3",
      title: "Datos",
      lede: "El conocimiento de un modelo es solo el texto con el que lo alimentaron. Sigue una página web desde el rastreo en crudo hasta una cinta limpia de números — y mira cuánto se descarta.",
      prev: "Tokens",
      next: "Sesgo",
      heroRawLabel: "PÁGINA CRUDA (WIKITEXT / HTML)",
      heroCleanLabel: "TEXTO LIMPIO",
      heroTokensLabel: "TOKENS",
      heroIdsLabel: "LA CINTA (ENTEROS)",
      heroRaw: "<p>'''Photosynthesis''' {{nbsp}}turns [[light]] into <b>chemical energy</b>.</p>",
      heroClean: "Photosynthesis turns light into chemical energy.",
      heroCaption: "Cada página hace este viaje: quita el marcado hasta dejar texto plano, corta el texto en tokens, guarda los IDs. Hazlo mil millones de veces y tienes un conjunto de entrenamiento.",
      concept: [
        "Un modelo no tiene hechos propios. Todo lo que “sabe” vino de un **montón gigante de texto** — casi todo raspado de la web pública, más libros, código y sitios de referencia como **Wikipedia** (nuestro ejemplo recurrente aquí).",
        "Pero la web en crudo está sucia: barras de navegación, anuncios, spam, duplicados y páginas con las que *no* debes entrenar. Por eso los laboratorios pasan el rastreo por una **tubería de limpieza** antes de que un solo token llegue al modelo.",
        "Lo sorprendente: **la calidad gana a la cantidad.** Un corpus más pequeño y bien filtrado entrena un mejor modelo que uno más grande y sucio — así que gran parte de lo recolectado se descarta a propósito.",
      ],
      cleanLabel: "PRUÉBALO · LA TUBERÍA",
      cleanTitle: "Limpia este dataset",
      cleanBody: "Aquí tienes un pequeño rastreo crudo de 15 documentos. Pásalo por la tubería etapa por etapa y mira qué sobrevive. Cada etapa descarta o reescribe tarjetas; el medidor lleva la cuenta de cuántos docs y tokens quedan.",
      rawStageName: "Rastreo crudo",
      stepperHint: "La tubería de limpieza — haz clic en cualquier etapa para saltar a ella, o ejecútala de principio a fin abajo.",
      stages: [
        { name: "Extraer texto", desc: "Quita el HTML y el wikitext hasta dejar texto plano. Las páginas que eran solo navegación y relleno desaparecen." },
        { name: "Deduplicar", desc: "Colapsa páginas casi idénticas a una sola copia — la web está llena de espejos, y los duplicados hacen que el modelo memorice en vez de aprender." },
        { name: "Filtro de calidad", desc: "Puntúa cada página y descarta spam y galimatías. Un clasificador basado en modelo “¿esto parece de libro de texto?” hace esto a escala." },
        { name: "Descontaminar y depurar", desc: "Elimina datos personales y descarta lo que parezca una pregunta de examen — no debes entrenar con el examen." },
        { name: "Tokenizar", desc: "Convierte cada página superviviente en IDs de token con el tokenizador real. Esta es la cinta con la que el modelo realmente entrena." },
      ],
      docsKeptLabel: "DOCS QUE QUEDAN",
      tokensKeptLabel: "TOKENS QUE QUEDAN",
      runLabel: "Ejecutar la tubería",
      nextStageLabel: "Siguiente etapa →",
      resetLabel: "Reiniciar",
      reasonBoilerplate: "Solo navegación y relleno",
      reasonDup: "duplicado — colapsado a 1",
      reasonSpam: "Baja calidad — spam / galimatías",
      reasonPii: "Contiene datos personales",
      reasonBenchmark: "Parece una pregunta de examen",
      keptBadge: "conservado",
      qualityWord: "calidad",
      resultTitle: "Lo que queda es el mundo del modelo",
      resultBody: "Casi todo el montón desapareció — y todo lo que el modelo llegará a “saber” está ahora en los supervivientes. Equivócate aquí y el modelo se equivoca; no hay etapa posterior que reponga lo que la limpieza quitó.",
      illustrativeNote: "Corpus de juguete. La similitud y las puntuaciones de calidad son ilustrativas, no un clasificador real — pero las etapas y su orden son exactamente lo que ejecutan los laboratorios de frontera.",
      docsWord: "docs",
      tokensWord: "tokens",
      docs: [
        { id: "photosynthesis", title: "Fotosíntesis", raw: "<p>La '''fotosíntesis''' es el proceso por el que las [[planta]]s verdes convierten la energía de la luz en energía química almacenada como glucosa, liberando oxígeno como subproducto.</p>" },
        { id: "photosynthesis-dup", title: "Fotosíntesis (espejo)", raw: "La fotosíntesis es el proceso que usan las plantas verdes para convertir la energía de la luz en energía química almacenada como glucosa, liberando oxígeno como subproducto." },
        { id: "andes", title: "Andes", raw: "<p>Los '''Andes''' son la cordillera continental más larga del mundo, con unos 7.000 km a lo largo del borde occidental de [[Sudamérica]].</p>" },
        { id: "andes-nav", title: "Andes — pie de navegación", raw: "<nav><a href=\"/home\">Inicio</a> · <a href=\"/edit\">Editar</a> · <a href=\"/talk\">Discusión</a></nav><div class=\"ad\">Publicidad — ¡regístrate ya!</div>" },
        { id: "jupiter-html", title: "Júpiter", raw: "<div class=\"infobox\"><h1>Júpiter</h1><p>Júpiter es el quinto planeta desde el Sol y el <b>mayor</b> del Sistema Solar, un gigante gaseoso.</p></div>" },
        { id: "printing", title: "Imprenta", raw: "La imprenta, introducida por Johannes Gutenberg hacia 1440, abarató la reproducción de libros y ayudó a difundir la alfabetización por Europa." },
        { id: "casino-spam", title: "Anuncio de casino", raw: "🎰 ¡EL MEJOR CASINO ONLINE!!! ¡GANA $$$$ YA!!! ¡CLIC AQUÍ CLIC AQUÍ BONO BONO!!! 🎰🎰🎰" },
        { id: "seo-spam", title: "Página SEO", raw: "vuelos baratos vuelos baratos comprar vuelos baratos mejores vuelos baratos ofertas de vuelos baratos vuelos baratos ya" },
        { id: "contact-pii", title: "Contacto del proyecto", raw: "Para consultas sobre el proyecto Riverside, escribe a Maria Gomez a maria.gomez@example.com o llama al +1-555-0142." },
        { id: "quiz-benchmark", title: "Pregunta de examen", raw: "Pregunta: ¿Qué gas liberan las plantas durante la fotosíntesis? A) Nitrógeno B) Oxígeno C) Hidrógeno D) Argón. Respuesta: B) Oxígeno." },
        { id: "turing", title: "Alan Turing", raw: "<p>'''Alan Turing''' fue un matemático británico que formalizó la computación con la [[máquina de Turing]] y ayudó a descifrar el código Enigma durante la Segunda Guerra Mundial.</p>" },
        { id: "turing-dup", title: "Alan Turing (espejo)", raw: "Alan Turing, matemático británico, formalizó la computación con la máquina de Turing y ayudó a descifrar el código Enigma en la Segunda Guerra Mundial." },
        { id: "gibberish", title: "Sin título", raw: "asdf qwer zxcv asdf qwer 00 11 22 zzzz asdfqwer lorem asdf qwer zxcv 99 88" },
        { id: "everest", title: "Monte Everest", raw: "El monte Everest, en la frontera entre Nepal y China, es la montaña más alta de la Tierra sobre el nivel del mar, con unos 8.849 metros." },
        { id: "cookie-boilerplate", title: "Aviso de cookies", raw: "<div class=\"cookie\">Usamos cookies para mejorar tu experiencia. <button>Aceptar todas</button> <button>Rechazar</button></div>" },
      ],
      scaleLabel: "PRUÉBALO · ESCALA",
      scaleTitle: "Una página, luego mil millones",
      scaleBody: "Una página limpia son unos 1.000 tokens. Ahora escala: arrastra de una página a un millón y mira crecer la cinta — y el disco que necesita. Cada celda es un token, coloreado por ID; las líneas más oscuras separan documentos.",
      scalePagesLabel: "PÁGINAS",
      scaleTokensLabel: "TOKENS",
      scaleStorageLabel: "ALMACENAMIENTO (uint16)",
      denseBlockLabel: "EL BLOQUE DENSO",
      denseBlockNote: "Una ventana a la cinta — cada cuadro es un ID de token.",
      denseSepLabel: "separador de documento",
      hoverHint: "Pasa el cursor por una celda para ver su ID de token.",
      compareTitle: "Hasta toda Wikipedia es un error de redondeo",
      compareBody: "Junta todos los artículos de la Wikipedia en inglés y tienes unos 4 mil millones de tokens. Un modelo de frontera entrena con unos 15 billones. Wikipedia es alrededor del **0,03%** de la dieta — que es justo por qué los laboratorios rastrean toda la web.",
      compareWiki: "Toda la Wikipedia en inglés",
      compareFrontier: "Corpus de entrenamiento de frontera",
      compareNote: "Escala lineal — esa fina franja de la izquierda es toda Wikipedia. ~4 mil M vs ~15.000 mil M tokens.",
      tapeLabel: "POR QUÉ UNA CINTA PLANA",
      tapeTitle: "Por qué se guarda como una larga línea de enteros",
      tape: [
        "El modelo solo come enteros, así que el corpus se **tokeniza una vez y se guarda como los números** — nunca se vuelve a parsear desde texto al entrenar. Tokenizar 15 billones de tokens es caro; lo pagas una sola vez.",
        "Se guardan como **enteros de ancho fijo** (un vocabulario ≤65k cabe en un `uint16` de 2 bytes), empaquetados uno tras otro en un único array enorme. El ancho fijo hace el archivo **mapeable en memoria** y cualquier muestra de entrenamiento es un corte de **acceso aleatorio O(1)** — toma una ventana desde cualquier punto al instante.",
        "Los documentos simplemente se concatenan, con un **token separador de documento** especial entre ellos para que el modelo sepa dónde termina uno y empieza el siguiente.",
      ],
      loopLabel: "CÍRCULO COMPLETO",
      loopTitle: "El tokenizador también salió de estos datos",
      loopBody: "¿Recuerdas el diccionario del tokenizador de la lección anterior? No cayó del cielo — sus fusiones se **ajustaron a una muestra de este mismo corpus limpio**, luego se congelaron y se aplicaron a todo. Los datos moldean el tokenizador, y el tokenizador codifica los datos. Ese es el bucle que produce la cinta.",
      explainQ: "Un colega dice: “Solo entrena con más datos — raspa todo, no te molestes en filtrar, más siempre es mejor.” ¿Dónde falla eso?",
      explainA: "Porque el modelo se convierte en sus datos — sesgos, spam y todo. Los duplicados lo empujan a memorizar en vez de generalizar; el spam y el relleno ahogan la señal; dejar preguntas de examen infla las puntuaciones sin capacidad real; y los datos personales sin depurar pueden regurgitarse. Pasado un punto, un corpus limpio más pequeño gana a uno sucio más grande: no solo añades texto, defines lo que el modelo sabe.",
      deeperTitle: "Ve más a fondo: ajuste de BPE, dedup y la mezcla de datos",
      deeperBody: "La deduplicación a escala usa MinHash / LSH para hallar casi-duplicados sin comparar cada par. El filtrado de calidad combina heurísticas baratas con un clasificador entrenado sobre texto de referencia “bueno”. El corpus también es una **mezcla** deliberada — web, código, libros, matemáticas, multilingüe — reponderada para moldear capacidades, aunque es un problema abierto exactamente cómo un mix se traduce en habilidades. Y las fusiones BPE del tokenizador se ajustan sobre una muestra representativa del corpus final, así que vocabulario y datos coevolucionan.",
      bridgeLabel: "SIGUIENTE: LOS DATOS TIENEN UN PUNTO DE VISTA",
      bridgeBody: "Acabas de tomar una docena de decisiones de limpieza — qué es “calidad”, qué es un “duplicado”, qué idiomas entraron. Cada una es una decisión de valor, y el modelo las hereda todas. Eso es el sesgo, y es la próxima lección.",
    },
    bias: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 4",
      title: "Sesgo",
      lede: "Un modelo es una compresión de su corpus, así que hereda las inclinaciones del corpus. Nadie inyecta el sesgo — el modelo solo aprende, fielmente, la estadística del texto que le mostraron.",
      prev: "Datos",
      next: "Redes neuronales",
      concept: [
        "La lección pasada limpiaste un dataset. Esta trata de lo que ese dataset *contenía* — porque un modelo solo puede reflejar el texto con el que se construye. Si un punto de vista es raro en los datos, es raro en el modelo; si es dominante, el modelo lo trata como lo normal.",
        "Así que el “sesgo” aquí no es un fallo que alguien añadió. Es la **estadística de los datos, aprendida fielmente.** Es un replanteo importante: el arreglo nunca es “quitar el sesgo” — es entender de quién es el texto del corpus y decidir qué hacer al respecto.",
        "Y aquí está la parte que conecta toda esta etapa: **cada decisión de recolección y limpieza es una decisión de valor.** Qué cuenta como calidad, qué se deduplica, qué idiomas vale la pena rastrear — cada una moldea en silencio a quién sirve mejor el modelo.",
      ],
      repLabel: "PRUÉBALO · QUIÉN ESTÁ EN LOS DATOS",
      repTitle: "Quién está en los datos vs. quién está en el mundo",
      repBody: "El texto de entrenamiento no es una muestra neutral de la humanidad — es sobre todo inglés y del Norte Global. Selecciona un idioma para comparar su parte del texto de entrenamiento con su parte de la población mundial.",
      repTextLabel: "PARTE DEL TEXTO DE ENTRENAMIENTO",
      repPopLabel: "PARTE DE LA POBLACIÓN MUNDIAL",
      langs: [
        { key: "Inglés", text: 0.46, pop: 0.05 },
        { key: "Chino", text: 0.06, pop: 0.12 },
        { key: "Español", text: 0.05, pop: 0.06 },
        { key: "Hindi", text: 0.005, pop: 0.07 },
        { key: "Árabe", text: 0.007, pop: 0.04 },
        { key: "Todos los demás", text: 0.42, pop: 0.66 },
      ],
      repOver: "sobrerrepresentado",
      repUnder: "subrepresentado",
      repFactorWord: "en los datos vs. el mundo",
      repSelectHint: "Selecciona un idioma para ver la brecha.",
      repNote: "Cifras ilustrativas, redondeadas — los datos reales varían según el corpus, pero la forma es robusta: el inglés domina el texto muy por encima de su parte de hablantes. Por esto también, desde la lección de Tokens, el español y otros idiomas cuestan más tokens y se modelan peor — el argumento a favor de los modelos locales y con datos propios.",
      filterLabel: "PRUÉBALO · LA NORMA DEL FILTRO",
      filterTitle: "Tu filtro de calidad tiene una opinión",
      filterBody: "¿Recuerdas el filtro de calidad de la lección de Datos? Premia un estilo concreto — prosa formal, editada, enciclopédica. La misma idea dicha llanamente puntúa más bajo. Toca un par y mira cómo el mismo significado recibe dos puntuaciones distintas.",
      pairs: [
        {
          topic: "Transporte público",
          formal: "El consejo municipal se reunió para evaluar propuestas de mejora del transporte público en todo el distrito.",
          informal: "el consejo se juntó para mirar ideas para hacer mejores los buses por aquí.",
          note: "Mismo significado. La versión formal puntúa más alto solo porque encaja con el estilo del filtro, no porque sea más cierta o más útil.",
        },
        {
          topic: "Resultado de un estudio",
          formal: "Los investigadores observaron que la intervención redujo notablemente los síntomas reportados en la mayoría de los participantes.",
          informal: "el estudio encontró que el tratamiento ayudó a que la mayoría de la gente se sintiera mucho mejor.",
          note: "Los registros cotidianos, hablados y de muchos españoles del mundo caen más bajo — así que se filtran más, y el modelo oye menos de cómo habla de verdad la mayoría.",
        },
        {
          topic: "Cocina",
          formal: "La receta exige que la masa repose un mínimo de treinta minutos antes de hornear.",
          informal: "deja la masa un rato y luego la metes al horno.",
          note: "Ninguno está mal. Pero si “calidad” significa “se lee como una enciclopedia”, el corpus se inclina en silencio hacia una voz y se aleja de otras.",
        },
      ],
      filterFormalLabel: "Formal / editado",
      filterInformalLabel: "Informal / hablado",
      filterScoreWord: "calidad",
      filterNote: "El mismo puntuador ilustrativo de la lección de Datos. Lo importante no son los números exactos — es que la “calidad” se define contra una norma, y toda norma incluye unas voces y excluye otras.",
      assocLabel: "UN VISTAZO ADELANTE",
      assocTitle: "El sesgo también se esconde en qué va junto a qué",
      assocBody: "Hay una inclinación más sutil. Los modelos aprenden de la **coocurrencia** — qué palabras aparecen cerca de cuáles. Si un corpus empareja abrumadoramente un oficio con un género, o un lugar con un adjetivo, el modelo absorbe esa asociación como si fuera un hecho. No se ve en ninguna frase suelta; vive en la estadística. Dentro de dos lecciones, en **Embeddings**, *verás* estas asociaciones como direcciones en el espacio vectorial — y las medirás.",
      mitLabel: "QUÉ SE PUEDE HACER",
      mitTitle: "Arreglos parciales, genuinamente en debate",
      mitBody: "No hay un corpus insesgado al que recurrir — solo decisiones, cada una con sus compensaciones. Estas son las principales palancas, y gente razonable discrepa sobre cuándo y cuánto usarlas.",
      mitigations: [
        { title: "Reponderar la mezcla", body: "Sobremuestrear idiomas y fuentes subrepresentados para que pesen más. Ayuda a la cobertura — pero repetir demasiado datos escasos daña la calidad, así que es un equilibrio." },
        { title: "Recolectar a propósito", body: "Encargar y digitalizar texto para idiomas y comunidades de pocos recursos en vez de solo rastrear lo que ya está en línea. Lento y costoso, pero arregla la fuente, no solo el síntoma." },
        { title: "Documentar los datos", body: "Las fichas de datos (datasheets, data statements) registran qué contiene y qué omite un corpus, para que quien lo use conozca sus puntos ciegos. Transparencia, no cura." },
        { title: "Medir la inclinación", body: "Las evaluaciones de sesgo sondean un modelo entrenado buscando disparidades concretas. Señal útil — pero un benchmark solo prueba lo que a sus autores se les ocurrió preguntar." },
      ],
      mitClosing: "Ninguna de estas produce un modelo “neutral”, y esa es la conclusión honesta: no hay una vista desde ningún lugar. La meta no es un corpus sin sesgo — es hacer las decisiones **visibles y deliberadas** en vez de accidentales.",
      explainQ: "Alguien dice: “Solo entrena el modelo con datos insesgados y el problema del sesgo desaparece.” ¿Por qué no es realmente posible?",
      explainA: "Porque no hay un corpus neutral con el que entrenar. Cualquier colección de texto sobrerrepresenta a quien más escribe y más se rastrea — una porción concreta de idiomas, lugares y registros — y las decisiones de limpieza añaden más valores encima. Un modelo comprime fielmente la inclinación que haya en sus datos, así que el sesgo se puede medir, reducir y documentar, pero no eliminar. La meta realista es hacer las decisiones explícitas y responsables, no fingir que existe un dataset libre de valores.",
      deeperTitle: "Ve más a fondo: representación vs. asignación, y por qué las evals son difíciles",
      deeperBody: "Ayuda separar la inclinación representacional (cómo se retrata a los grupos en el texto) de los efectos asignativos (cómo las decisiones de un sistema desplegado ayudan o perjudican a los grupos) — las mitigaciones difieren para cada una. La medición es genuinamente difícil: los tests de asociación pueden ser inestables, los benchmarks solo cubren casos imaginados, y reducir una disparidad medida puede empeorar otra, así que rara vez hay una sola perilla que haga “justo” a un modelo. Es investigación activa y en disputa — sospecha de los arreglos confiados de una línea.",
      bridgeLabel: "SIGUIENTE: DENTRO DEL MODELO",
      bridgeBody: "Has seguido los datos hasta el fondo — obtenidos, tokenizados, limpiados e inclinados. Ahora abrimos lo que entrenan: la red neuronal que convierte todos esos números de token en predicciones.",
    },
    stage1List: [
      "La vida de un LLM",
      "Tokens",
      "Datos",
      "Sesgo",
      "Redes neuronales",
      "Cómo funciona el entrenamiento",
      "Embeddings",
      "Transformers",
      "Preentrenamiento → alineación",
    ],
  },
};

/** Demo text seeded into the tokenizer, per language. */
export const SAMPLE: Record<Lang, string> = {
  en: 'A model never sees "strawberry" — it sees 3 tokens. Try 1234567, {"id":42}, https://libreai.dev 🌱',
  es: 'El modelo nunca ve "strawberry": ve 3 tokens. Prueba 1234567, {"id":42}, https://libreai.dev 🌱',
};

/** GitHub organisation — editable placeholder until the handle is finalised. */
export const GITHUB_URL = "https://github.com/libreai-dev";

/** Overall roadmap progress shown in the header (illustrative for the MVP). */
export const OVERALL_PROGRESS = 3;
