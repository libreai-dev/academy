// ============================================================================
// posts.ts — the writing registry for xavier-ramirez.com
//
// Every interactive lesson is surfaced here as a blog "post". The six
// CATEGORIES double as the site's levels/stages: Foundations first, then the
// build-a-model track (Data → Architecture → Training → Alignment → Inference).
// Generated from each lesson route's metadata; edit titles/summaries here.
// ============================================================================

export type Category =
  | "Foundations"
  | "Data"
  | "Architecture"
  | "Training"
  | "Alignment"
  | "Inference";

export interface Post {
  slug: string;
  /** 0 = build-a-model track, 1 = foundations. */
  stage: 0 | 1;
  category: Category;
  /** Canonical URL — the live interactive lesson. */
  href: string;
  title: string;
  summary: string;
  /** ISO date, used for sorting. */
  date: string;
  /** Human date shown in lists, e.g. "28 Jul 2026". */
  displayDate: string;
  read: string;
  lang: "en" | "es";
}

/** Category → one-line description, shown on the writing index. */
export const CATEGORY_META: Record<Category, string> = {
  Foundations: "The mental models an engineer needs before anything else.",
  Data: "Turning the open web into a small, clean pile a model can learn from.",
  Architecture: "What is actually inside a transformer, one part at a time.",
  Training: "How weights are fit, made cheaper, and squeezed to run.",
  Alignment: "Turning a raw base model into a helpful, steerable assistant.",
  Inference: "What it costs to actually serve a model, token by token.",
};

export const CATEGORY_ORDER: Category[] = [
  "Foundations",
  "Data",
  "Architecture",
  "Training",
  "Alignment",
  "Inference",
];

// Newest first.
export const POSTS: Post[] = [
  { slug: "test-time-search", stage: 0, category: "Inference", href: "/stage/0/test-time-search", title: "Test-time search", summary: "Spend more compute at inference to get better answers. Play with three live diagrams — Best-of-N sampling, tree search (MCTS), and the compute-vs-quality trade-off — to see how a…", date: "2026-07-13", displayDate: "13 Jul 2026", read: "10 min read", lang: "en" },
  { slug: "speculative-decoding", stage: 0, category: "Inference", href: "/stage/0/speculative-decoding", title: "Speculative decoding", summary: "A small draft model guesses several next tokens; the big model verifies them all in one pass and accepts the correct prefix.", date: "2026-07-10", displayDate: "10 Jul 2026", read: "11 min read", lang: "en" },
  { slug: "prefill-vs-decode", stage: 0, category: "Inference", href: "/stage/0/prefill-vs-decode", title: "Prefill vs decode", summary: "Serving a model has two phases: prefill reads the whole prompt in one fast parallel pass, then decode writes the answer one token at a time.", date: "2026-07-07", displayDate: "7 Jul 2026", read: "12 min read", lang: "en" },
  { slug: "kv-cache-systems", stage: 0, category: "Inference", href: "/stage/0/kv-cache-systems", title: "Managing the KV cache", summary: "A serving engine manages the KV cache like an OS manages memory. Play with three live diagrams — fragmentation, PagedAttention's fixed pages, and RadixAttention's shared prefixes — to…", date: "2026-07-04", displayDate: "4 Jul 2026", read: "8 min read", lang: "en" },
  { slug: "kv-cache", stage: 0, category: "Inference", href: "/stage/0/kv-cache", title: "The KV cache", summary: "Why generation is limited by memory, not compute. Three live diagrams: the rising staircase of wasted work without a cache, the collapse to a flat line with it, and the KV cache eating…", date: "2026-07-01", displayDate: "1 Jul 2026", read: "12 min read", lang: "en" },
  { slug: "autoregressive-loop", stage: 0, category: "Inference", href: "/stage/0/autoregressive-loop", title: "The autoregressive loop", summary: "One token isn't a sentence. Play the loop that writes a whole paragraph: the model predicts a token, appends it, feeds it back, and repeats until an end-of-sequence token — the reason…", date: "2026-06-28", displayDate: "28 Jun 2026", read: "6 min read", lang: "en" },
  { slug: "constrained-decoding", stage: 0, category: "Inference", href: "/stage/0/constrained-decoding", title: "Constrained decoding", summary: "Guarantee valid JSON, every time. Three live diagrams show why free sampling breaks, how logit masking forces invalid tokens to zero probability, and how a grammar decides exactly…", date: "2026-06-25", displayDate: "25 Jun 2026", read: "11 min read", lang: "en" },
  { slug: "sampling-strategies", stage: 0, category: "Inference", href: "/stage/0/sampling-strategies", title: "Sampling strategies", summary: "You have a probability for every next token — now how do you pick? Play with three live bar charts: temperature flattens or sharpens the odds, top-k / top-p chop off the unlikely tail,…", date: "2026-06-22", displayDate: "22 Jun 2026", read: "9 min read", lang: "en" },
  { slug: "choosing-the-next-token", stage: 0, category: "Inference", href: "/stage/0/choosing-the-next-token", title: "Choosing the next token", summary: "A transformer's last step turns one hidden state into a single next token. Scroll through three live diagrams — the unembedding that scores every token, the softmax that turns scores…", date: "2026-06-19", displayDate: "19 Jun 2026", read: "10 min read", lang: "en" },
  { slug: "tool-calling", stage: 0, category: "Alignment", href: "/stage/0/tool-calling", title: "Tool calling", summary: "A model can't check the weather or run your database — it only predicts text. Step through the tool-calling loop with three live diagrams: the model emits a structured call, the…", date: "2026-06-16", displayDate: "16 Jun 2026", read: "9 min read", lang: "en" },
  { slug: "multi-turn-formatting", stage: 0, category: "Alignment", href: "/stage/0/multi-turn-formatting", title: "Multi-turn & formatting", summary: "A model has no memory. Scroll through three live diagrams — a growing stack of role blocks, a tool result folding back in, and a pre-filled <think> scratchpad — to see how long chats,…", date: "2026-06-13", displayDate: "13 Jun 2026", read: "8 min read", lang: "en" },
  { slug: "reasoning-tokens", stage: 0, category: "Alignment", href: "/stage/0/reasoning-tokens", title: "Reasoning tokens", summary: "A reasoning model has no second brain — it writes a hidden scratchpad before its answer, bracketed by <think> tokens.", date: "2026-06-10", displayDate: "10 Jun 2026", read: "10 min read", lang: "en" },
  { slug: "verifiable-rewards", stage: 0, category: "Alignment", href: "/stage/0/verifiable-rewards", title: "Verifiable rewards", summary: "For math and code you can skip the learned reward model and check the answer for real. Scroll through three live diagrams — a verifier scoring candidate answers, outcome vs process…", date: "2026-06-07", displayDate: "7 Jun 2026", read: "7 min read", lang: "en" },
  { slug: "grpo", stage: 0, category: "Alignment", href: "/stage/0/grpo", title: "GRPO: drop the critic", summary: "GRPO removes PPO's memory-heavy critic. Scroll three live diagrams — the PPO-vs-GRPO memory stacks, one prompt fanning into a group of answers, and each answer scored against the group…", date: "2026-06-04", displayDate: "4 Jun 2026", read: "10 min read", lang: "en" },
  { slug: "ppo", stage: 0, category: "Alignment", href: "/stage/0/ppo", title: "PPO", summary: "PPO is the online RL loop that improves a model from a reward model. Scroll through three live diagrams — the actor–critic cast, the clipped step, and the KL leash — to see how it gets…", date: "2026-06-01", displayDate: "1 Jun 2026", read: "12 min read", lang: "en" },
  { slug: "preference-optimization", stage: 0, category: "Alignment", href: "/stage/0/preference-optimization", title: "Direct preference optimization", summary: "DPO skips the separate reward model and the RL loop. It takes the same chosen-vs-rejected pairs and nudges the model directly to prefer the chosen answer over the rejected one — pick a…", date: "2026-05-29", displayDate: "29 May 2026", read: "10 min read", lang: "en" },
  { slug: "reward-modeling", stage: 0, category: "Alignment", href: "/stage/0/reward-modeling", title: "Reward modeling", summary: "You can't have a human grade every answer. Scroll through three live diagrams — labelling preference pairs, training a scalar reward, and ranking fresh answers — to see how a model…", date: "2026-05-26", displayDate: "26 May 2026", read: "8 min read", lang: "en" },
  { slug: "base-vs-assistant", stage: 0, category: "Alignment", href: "/stage/0/base-vs-assistant", title: "From base model to assistant", summary: "A freshly pretrained base model only continues text. Play with three live diagrams — the same prompt answered two ways, the instruction → response pairs that teach it, and what…", date: "2026-05-23", displayDate: "23 May 2026", read: "9 min read", lang: "en" },
  { slug: "why-alignment", stage: 0, category: "Alignment", href: "/stage/0/why-alignment", title: "Why alignment", summary: "An instruction-following assistant can still be unhelpful or unsafe. Play with three live diagrams — pick the better of two answers, watch that preference become a reward score, and…", date: "2026-05-20", displayDate: "20 May 2026", read: "11 min read", lang: "en" },
  { slug: "quantization", stage: 0, category: "Training", href: "/stage/0/quantization", title: "Quantization", summary: "Store each weight in 4, 3 or 2 bits instead of 16 and a model shrinks from a data-centre GPU to a laptop.", date: "2026-05-17", displayDate: "17 May 2026", read: "9 min read", lang: "en" },
  { slug: "distillation", stage: 0, category: "Training", href: "/stage/0/distillation", title: "Model distillation", summary: "How a small model learns from a giant. Scroll through six live diagrams — the memory bottleneck, soft-target logits, behavioral cloning, on- vs off-policy distillation, edge deployment…", date: "2026-05-14", displayDate: "14 May 2026", read: "8 min read", lang: "en" },
  { slug: "parameter-efficient-finetuning", stage: 0, category: "Training", href: "/stage/0/parameter-efficient-finetuning", title: "Parameter-efficient fine-tuning", summary: "LoRA freezes a giant model and trains a tiny low-rank adapter instead — so a huge model fine-tunes on a single GPU.", date: "2026-05-11", displayDate: "11 May 2026", read: "11 min read", lang: "en" },
  { slug: "supervised-fine-tuning", stage: 0, category: "Training", href: "/stage/0/supervised-fine-tuning", title: "Supervised fine-tuning", summary: "How a base model becomes an assistant: train it on instruction→answer pairs and grade it only on the answer.", date: "2026-05-08", displayDate: "8 May 2026", read: "8 min read", lang: "en" },
  { slug: "bin-packing", stage: 0, category: "Training", href: "/stage/0/bin-packing", title: "Bin-packing for training", summary: "How clean text becomes GPU-ready batches: pre-tokenize the corpus once, stitch documents into one stream with <eos> markers, and pack the stream into fixed-length blocks with zero…", date: "2026-05-05", displayDate: "5 May 2026", read: "6 min read", lang: "en" },
  { slug: "distributed-training", stage: 0, category: "Training", href: "/stage/0/distributed-training", title: "Distributed training", summary: "A frontier model is too big for one GPU. Scroll through three live diagrams — the data-parallel GPU grid, tensor-vs-pipeline model splitting, and the ZeRO/FSDP memory bar — to see how…", date: "2026-05-02", displayDate: "2 May 2026", read: "11 min read", lang: "en" },
  { slug: "mixed-precision", stage: 0, category: "Training", href: "/stage/0/mixed-precision", title: "Mixed-precision training", summary: "Training runs in low-precision numbers for speed and memory. Scroll through three live diagrams — the bit layouts of FP32/BF16/FP8, gradient survival under loss scaling, and a one-GPU…", date: "2026-04-29", displayDate: "29 Apr 2026", read: "10 min read", lang: "en" },
  { slug: "matrix-optimizers", stage: 0, category: "Training", href: "/stage/0/matrix-optimizers", title: "Optimizers that fit", summary: "AdamW stores two extra numbers per weight. Play with three live diagrams — the per-weight memory tax, optimizer-state bytes for Lion, Adafactor and Muon, and loss-vs-steps convergence…", date: "2026-04-26", displayDate: "26 Apr 2026", read: "7 min read", lang: "en" },
  { slug: "optimizers", stage: 0, category: "Training", href: "/stage/0/optimizers", title: "The optimizer: AdamW", summary: "Backprop gives the gradient; the optimizer decides the step. Scroll through three live diagrams — SGD vs Adam on a loss surface, per-weight step sizes, and the warmup-then-decay…", date: "2026-04-23", displayDate: "23 Apr 2026", read: "8 min read", lang: "en" },
  { slug: "backpropagation", stage: 0, category: "Training", href: "/stage/0/backpropagation", title: "Backpropagation", summary: "How one wrong guess tells millions of weights which way to move. Scroll through three live diagrams — blame flowing backward through a tiny network, the gradient arrow on a loss bowl,…", date: "2026-04-20", displayDate: "20 Apr 2026", read: "8 min read", lang: "en" },
  { slug: "how-models-learn", stage: 0, category: "Training", href: "/stage/0/how-models-learn", title: "How models learn", summary: "Training is one tiny loop at absurd scale: guess the next token, measure how wrong it was (loss), nudge the weights, repeat.", date: "2026-04-17", displayDate: "17 Apr 2026", read: "10 min read", lang: "en" },
  { slug: "long-context", stage: 0, category: "Architecture", href: "/stage/0/long-context", title: "Long context", summary: "A model trained on 4k tokens can read 128k without retraining. Scroll through three live diagrams — the RoPE dial that breaks past its training length, the frequency rescale that fixes…", date: "2026-04-14", displayDate: "14 Apr 2026", read: "9 min read", lang: "en" },
  { slug: "mixture-of-experts", stage: 0, category: "Architecture", href: "/stage/0/mixture-of-experts", title: "Mixture of Experts", summary: "Instead of one big feed-forward per token, a router sends each token to a few specialist experts.", date: "2026-04-11", displayDate: "11 Apr 2026", read: "7 min read", lang: "en" },
  { slug: "transformer-block", stage: 0, category: "Architecture", href: "/stage/0/transformer-block", title: "The transformer block", summary: "A transformer is one small block stacked over and over. Play with three live diagrams — attention links over a token row, the parts of a block (mix, think, shortcut), and a stack of…", date: "2026-04-08", displayDate: "8 Apr 2026", read: "9 min read", lang: "en" },
  { slug: "feed-forward", stage: 0, category: "Architecture", href: "/stage/0/feed-forward", title: "The feed-forward network", summary: "After attention, each token runs through a small 2-layer network that expands the vector, fires a gate, and compresses it back — where most of a model's facts are stored.", date: "2026-04-05", displayDate: "5 Apr 2026", read: "7 min read", lang: "en" },
  { slug: "flash-attention", stage: 0, category: "Architecture", href: "/stage/0/flash-attention", title: "FlashAttention", summary: "Attention's N×N score grid grows with the square of the sequence. Play with three live diagrams — the memory wall, tiling the grid through fast on-chip memory, and GQA/MQA key-value…", date: "2026-04-02", displayDate: "2 Apr 2026", read: "7 min read", lang: "en" },
  { slug: "attention-mechanism", stage: 0, category: "Architecture", href: "/stage/0/attention-mechanism", title: "How attention works", summary: "The transformer block showed each token looks at the others; this is the machine that does it.", date: "2026-03-30", displayDate: "30 Mar 2026", read: "9 min read", lang: "en" },
  { slug: "rope-math", stage: 0, category: "Architecture", href: "/stage/0/rope-math", title: "RoPE: position as rotation", summary: "RoPE encodes a token's position by rotating its query and key vectors. Play with three live dials to see why only the gap between two positions survives — and why rotating beats adding…", date: "2026-03-27", displayDate: "27 Mar 2026", read: "6 min read", lang: "en" },
  { slug: "positional-encoding", stage: 0, category: "Architecture", href: "/stage/0/positional-encoding", title: "Positional encoding", summary: "Attention reads every token at once, so on its own it can't tell word order apart — \\", date: "2026-03-24", displayDate: "24 Mar 2026", read: "9 min read", lang: "en" },
  { slug: "embedding-matrix", stage: 0, category: "Architecture", href: "/stage/0/embedding-matrix", title: "The embedding matrix", summary: "A token ID is just a number. Play with three live diagrams — the matrix lookup that turns an ID into a vector, the 2D meaning map where similar words become neighbours, and the…", date: "2026-03-21", displayDate: "21 Mar 2026", read: "7 min read", lang: "en" },
  { slug: "special-tokens", stage: 0, category: "Architecture", href: "/stage/0/special-tokens", title: "Special tokens & chat templates", summary: "How does a whole chat become tokens? Scroll through three live diagrams — the conversation array, the chat template that folds it into one string, and a reserved control token as a…", date: "2026-03-18", displayDate: "18 Mar 2026", read: "9 min read", lang: "en" },
  { slug: "token-dictionary", stage: 0, category: "Architecture", href: "/stage/0/token-dictionary", title: "The token dictionary", summary: "Models don't read letters or words — they read tokens from a fixed dictionary. Three live diagrams: letters vs words vs sub-words, a Byte-Pair Encoding trainer that builds the…", date: "2026-03-15", displayDate: "15 Mar 2026", read: "7 min read", lang: "en" },
  { slug: "data-pipeline-deep", stage: 0, category: "Data", href: "/stage/0/data-pipeline-deep", title: "Inside the data pipeline", summary: "Part 2 of the data pipeline: twelve live, interactive deep-dives under the same four stations — the robots.txt gate, retrain-vs-retrieve, prompt injection, connected-code cleanup,…", date: "2026-03-12", displayDate: "12 Mar 2026", read: "6 min read", lang: "en" },
  { slug: "synthetic-data", stage: 0, category: "Data", href: "/stage/0/synthetic-data", title: "Synthetic data", summary: "Strong models write their own training data. Scroll through three live diagrams — evolving a seed prompt into harder variants, building a step-by-step reasoning trace, and a…", date: "2026-03-09", displayDate: "9 Mar 2026", read: "6 min read", lang: "en" },
  { slug: "data-recipe", stage: 0, category: "Data", href: "/stage/0/data-recipe", title: "Data recipe & synthetic expansion", summary: "A clean corpus isn't a training set yet. Scroll through six live diagrams — the domain mixer, temperature sampling, the epoch cliff, synthetic textbook generation, the 3-gate synthetic…", date: "2026-03-06", displayDate: "6 Mar 2026", read: "8 min read", lang: "en" },
  { slug: "safety-filtering", stage: 0, category: "Data", href: "/stage/0/safety-filtering", title: "Safety filtering", summary: "A well-written page can still be hateful, explicit, or dangerous. Scroll through three live diagrams — the harm categories, the classify-then-cut gate, and the strictness tradeoff — to…", date: "2026-03-03", displayDate: "3 Mar 2026", read: "10 min read", lang: "en" },
  { slug: "pii-scrubbing", stage: 0, category: "Data", href: "/stage/0/pii-scrubbing", title: "PII scrubbing", summary: "Before training, personal data — emails, phones, IDs, names — and copyrighted or sealed text are detected and stripped.", date: "2026-02-28", displayDate: "28 Feb 2026", read: "11 min read", lang: "en" },
  { slug: "deduplication", stage: 0, category: "Data", href: "/stage/0/deduplication", title: "Multi-stage deduplication", summary: "The open web repeats itself constantly. Scroll through six live diagrams — the memorization gate, exact hash + suffix-array trimming, a real MinHash estimator, the LSH S-curve,…", date: "2026-02-25", displayDate: "25 Feb 2026", read: "9 min read", lang: "en" },
  { slug: "classifier-scoring", stage: 0, category: "Data", href: "/stage/0/classifier-scoring", title: "A model that grades the web", summary: "Hand-written rules only catch obvious junk. Train a small classifier on good-vs-bad text, score every page 0–1, and keep only the high scorers — the FineWeb-Edu idea, in three live…", date: "2026-02-22", displayDate: "22 Feb 2026", read: "9 min read", lang: "en" },
  { slug: "quality-filtering", stage: 0, category: "Data", href: "/stage/0/quality-filtering", title: "Quality filtering", summary: "Most of the crawled web is junk. Scroll through three live diagrams — how little of a page is prose, the four cheap heuristic rules that catch menus, spam and gibberish, and the funnel…", date: "2026-02-19", displayDate: "19 Feb 2026", read: "12 min read", lang: "en" },
  { slug: "extraction-parsing", stage: 0, category: "Data", href: "/stage/0/extraction-parsing", title: "Extraction & parsing", summary: "A crawled page is mostly boilerplate. Scroll through three live diagrams — strip a page to the article, turn hard formats (PDFs, scans, tables) into clean markdown, and tag the…", date: "2026-02-16", displayDate: "16 Feb 2026", read: "9 min read", lang: "en" },
  { slug: "domain-sources", stage: 0, category: "Data", href: "/stage/0/domain-sources", title: "Domain-specific sources", summary: "Web text is thin on reasoning. Scroll through six live diagrams — the data-recipe mixer, AST repo packing, copyleft scrubbing, two-stage PDF/OCR routing, temporal decay of Q&A, and…", date: "2026-02-13", displayDate: "13 Feb 2026", read: "8 min read", lang: "en" },
  { slug: "web-scale-ingestion", stage: 0, category: "Data", href: "/stage/0/web-scale-ingestion", title: "Web-scale ingestion", summary: "Nobody downloads the internet. Scroll through six live diagrams — the authority field, the byte treemap, the WARC→.bin flow, the robots.txt gate, retrain-vs-retrieve, and prompt…", date: "2026-02-10", displayDate: "10 Feb 2026", read: "9 min read", lang: "en" },
  { slug: "data-pipeline", stage: 0, category: "Data", href: "/stage/0/data-pipeline", title: "The data pipeline · Part 1", summary: "From the whole internet to a training recipe. Walk the four stations that turn the open web into a small, clean, carefully-blended corpus — gather, extract, deduplicate, mix — across…", date: "2026-02-07", displayDate: "7 Feb 2026", read: "10 min read", lang: "en" },
  { slug: "life-of-an-llm", stage: 1, category: "Foundations", href: "/stage/1/life-of-an-llm", title: "The life of an LLM", summary: "The six steps that turn raw text into a model you can talk to: gather data, clean & tokenize, pretrain, fine-tune & align, evaluate, and host. A clickable pipeline.", date: "2026-02-04", displayDate: "4 Feb 2026", read: "10 min read", lang: "en" },
  { slug: "bias", stage: 1, category: "Foundations", href: "/stage/1/bias", title: "Bias", summary: "A model mirrors its corpus's skews — bias is the data's statistics learned faithfully. See who's in the data vs. the world, and why every cleaning choice is a value choice.", date: "2026-02-01", displayDate: "1 Feb 2026", read: "7 min read", lang: "en" },
  { slug: "data", stage: 1, category: "Foundations", href: "/stage/1/data", title: "Data", summary: "A model's knowledge is just the text it was fed. Clean a real dataset stage by stage, watch most of it get thrown away, and see the token tape a model trains on.", date: "2026-01-29", displayDate: "29 Jan 2026", read: "7 min read", lang: "en" },
  { slug: "transformers", stage: 1, category: "Foundations", href: "/stage/1/transformers", title: "Transformers & attention", summary: "A fixed embedding can't tell riverside “bank” from money “bank.” Attention is the fix: each token looks at the others and blends in what's relevant.", date: "2026-01-26", displayDate: "26 Jan 2026", read: "7 min read", lang: "en" },
  { slug: "embeddings", stage: 1, category: "Foundations", href: "/stage/1/embeddings", title: "Embeddings", summary: "Every token becomes a vector — a point on a map where nearby means similar in meaning. Explore the map, watch it settle out of pretraining, and try king − man + woman ≈ queen.", date: "2026-01-23", displayDate: "23 Jan 2026", read: "12 min read", lang: "en" },
  { slug: "tokens", stage: 1, category: "Foundations", href: "/stage/1/tokens", title: "Tokens", summary: "A model never sees your words, it sees tokens. A live tokenizer lesson on cost, context limits, and why models miscount letters.", date: "2026-01-20", displayDate: "20 Jan 2026", read: "11 min read", lang: "en" },
  { slug: "gpu-or-cpu", stage: 1, category: "Foundations", href: "/stage/1/gpu-or-cpu", title: "GPU or CPU?", summary: "A neural network is a mountain of matrix multiplies — that's why AI runs on GPUs, not CPUs. Race the two machines, tour a rack of GPUs, and split a model across the fleet.", date: "2026-01-17", displayDate: "17 Jan 2026", read: "6 min read", lang: "en" },
  { slug: "neural-networks", stage: 1, category: "Foundations", href: "/stage/1/neural-networks", title: "Neural networks", summary: "A neural network is a function you fit to data — stacked multiply-and-adds with a nonlinearity. Wire up a real tiny network by hand and watch the decision boundary bend.", date: "2026-01-14", displayDate: "14 Jan 2026", read: "8 min read", lang: "en" },
];

/** All categories that actually have posts, in curriculum order. */
export const CATEGORIES: Category[] = CATEGORY_ORDER.filter((c) =>
  POSTS.some((p) => p.category === c),
);

export const postCount = POSTS.length;

/** The N most recent posts (already sorted newest-first). */
export function recentPosts(n = 5): Post[] {
  return POSTS.slice(0, n);
}

export function postsByCategory(category: Category | "All"): Post[] {
  return category === "All"
    ? POSTS
    : POSTS.filter((p) => p.category === category);
}
