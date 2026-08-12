/**
 * All user-facing copy for the Academy, authored in both English and Spanish
 * (content parity is a core commitment — neither language is a translation
 * afterthought). Components read from `COPY[lang]`; the active language lives in
 * the ThemeLang context so switching updates every screen live.
 */


// Per-article copy lives in its own module so separate lessons never collide
// on one giant object. copy.ts assembles them into COPY below.
import type { WsNodeCopy } from "./copy/shared";
import { webScaleEN, webScaleES, type WebScaleLesson, type WsPayloadCopy } from "./copy/webscale";
import { domainsEN, domainsES, type DomainLesson, type DomNodeCopy, type DomUi } from "./copy/domains";
import { dedupEN, dedupES, type DedupLesson } from "./copy/dedup";
import { recipeEN, recipeES, type RecipeLesson } from "./copy/recipe";
import { distillEN, distillES, type DistillLesson } from "./copy/distill";
import { backboneEN, backboneES, type BackboneCopy } from "./copy/backbone";
// Stage-0 Fundamentals lessons (batch 1) — each owns its copy module.
import { qualityFilteringEN, qualityFilteringES, type QualityFilteringLesson } from "./copy/quality-filtering";
import { tokenDictionaryEN, tokenDictionaryES, type TokenDictionaryLesson } from "./copy/token-dictionary";
import { embeddingMatrixEN, embeddingMatrixES, type EmbeddingMatrixLesson } from "./copy/embedding-matrix";
import { transformerBlockEN, transformerBlockES, type TransformerBlockLesson } from "./copy/transformer-block";
import { nextTokenEN, nextTokenES, type NextTokenLesson } from "./copy/nextToken";
import { autoregressiveLoopEN, autoregressiveLoopES, type AutoregressiveLoopLesson } from "./copy/autoregressive-loop";
import { howModelsLearnEN, howModelsLearnES, type HowModelsLearnLesson } from "./copy/how-models-learn";
import { baseVsAssistantEN, baseVsAssistantES, type BaseVsAssistantLesson } from "./copy/base-vs-assistant";
import { whyAlignmentEN, whyAlignmentES, type WhyAlignmentLesson } from "./copy/why-alignment";
import { prefillVsDecodeEN, prefillVsDecodeES, type PrefillVsDecodeLesson } from "./copy/prefill-vs-decode";
// Stage-0 Medium lessons (batch 2)
import { classifierScoringEN, classifierScoringES, type ClassifierScoringLesson } from "./copy/classifier-scoring";
import { multiTurnFormattingEN, multiTurnFormattingES, type MultiTurnFormattingLesson } from "./copy/multi-turn-formatting";
import { feedForwardEN, feedForwardES, type FeedForwardLesson } from "./copy/feed-forward";
import { extractionParsingEN, extractionParsingES, type ExtractionParsingLesson } from "./copy/extraction-parsing";
import { safetyFilteringEN, safetyFilteringES, type SafetyFilteringLesson } from "./copy/safety-filtering";
import { positionalEncodingEN, positionalEncodingES, type PositionalEncodingLesson } from "./copy/positional-encoding";
import { specialTokensEN, specialTokensES, type SpecialTokensLesson } from "./copy/special-tokens";
import { attentionMechanismEN, attentionMechanismES, type AttentionMechanismLesson } from "./copy/attention-mechanism";
import { samplingStrategiesEN, samplingStrategiesES, type SamplingStrategiesLesson } from "./copy/sampling-strategies";
// Stage-0 Expert lessons (batch 3)
import { piiScrubbingEN, piiScrubbingES, type PiiScrubbingLesson } from "./copy/pii-scrubbing";
import { binPackingEN, binPackingES, type BinPackingLesson } from "./copy/bin-packing";
import { ropeMathEN, ropeMathES, type RopeMathLesson } from "./copy/rope-math";
import { constrainedDecodingEN, constrainedDecodingES, type ConstrainedDecodingLesson } from "./copy/constrained-decoding";
import { reasoningTokensEN, reasoningTokensES, type ReasoningTokensLesson } from "./copy/reasoning-tokens";
import { backpropagationEN, backpropagationES, type BackpropagationLesson } from "./copy/backpropagation";
import { supervisedFineTuningEN, supervisedFineTuningES, type SupervisedFineTuningLesson } from "./copy/supervised-fine-tuning";
import { rewardModelingEN, rewardModelingES, type RewardModelingLesson } from "./copy/reward-modeling";
import { kvCacheEN, kvCacheES, type KvCacheLesson } from "./copy/kv-cache";
import { syntheticDataEN, syntheticDataES, type SyntheticDataLesson } from "./copy/synthetic-data";
import { optimizersEN, optimizersES, type OptimizersLesson } from "./copy/optimizers";
import { preferenceOptimizationEN, preferenceOptimizationES, type PreferenceOptimizationLesson } from "./copy/preference-optimization";
import { flashAttentionEN, flashAttentionES, type FlashAttentionLesson } from "./copy/flash-attention";
import { testTimeSearchEN, testTimeSearchES, type TestTimeSearchLesson } from "./copy/test-time-search";
import { mixedPrecisionEN, mixedPrecisionES, type MixedPrecisionLesson } from "./copy/mixed-precision";
import { matrixOptimizersEN, matrixOptimizersES, type MatrixOptimizersLesson } from "./copy/matrix-optimizers";
import { parameterEfficientFinetuningEN, parameterEfficientFinetuningES, type ParameterEfficientFinetuningLesson } from "./copy/parameter-efficient-finetuning";
import { ppoEN, ppoES, type PpoLesson } from "./copy/ppo";
import { grpoEN, grpoES, type GrpoLesson } from "./copy/grpo";
import { verifiableRewardsEN, verifiableRewardsES, type VerifiableRewardsLesson } from "./copy/verifiable-rewards";
import { kvCacheSystemsEN, kvCacheSystemsES, type KvCacheSystemsLesson } from "./copy/kv-cache-systems";
import { quantizationEN, quantizationES, type QuantizationLesson } from "./copy/quantization";
import { speculativeDecodingEN, speculativeDecodingES, type SpeculativeDecodingLesson } from "./copy/speculative-decoding";
import { longContextEN, longContextES, type LongContextLesson } from "./copy/long-context";
import { mixtureOfExpertsEN, mixtureOfExpertsES, type MixtureOfExpertsLesson } from "./copy/mixture-of-experts";
import { toolCallingEN, toolCallingES, type ToolCallingLesson } from "./copy/tool-calling";
import { distributedTrainingEN, distributedTrainingES, type DistributedTrainingLesson } from "./copy/distributed-training";
// The two-part "Data Pipeline" series (Stage 0) — reorganises the four data
// lessons above into one pipeline backbone. Additive: the originals are unchanged.
import { dataPipelineEN, dataPipelineES } from "./copy/data-pipeline";
import { dataPipelineDeepEN, dataPipelineDeepES } from "./copy/data-pipeline-deep";
import type { PipelineLesson } from "./copy/pipeline-shell";

// Re-export the article types so existing `from "./copy"` / `from "../lib/copy"`
// imports keep working unchanged.
export type { WsNodeCopy, WsPayloadCopy, WebScaleLesson, DomNodeCopy, DomUi, DomainLesson, DedupLesson, RecipeLesson, DistillLesson };
export type { BackboneCopy };
export type {
  QualityFilteringLesson,
  TokenDictionaryLesson,
  EmbeddingMatrixLesson,
  TransformerBlockLesson,
  NextTokenLesson,
  AutoregressiveLoopLesson,
  HowModelsLearnLesson,
  BaseVsAssistantLesson,
  WhyAlignmentLesson,
  PrefillVsDecodeLesson,
  ClassifierScoringLesson,
  MultiTurnFormattingLesson,
  FeedForwardLesson,
  ExtractionParsingLesson,
  SafetyFilteringLesson,
  PositionalEncodingLesson,
  SpecialTokensLesson,
  AttentionMechanismLesson,
  SamplingStrategiesLesson,
  PiiScrubbingLesson,
  BinPackingLesson,
  RopeMathLesson,
  ConstrainedDecodingLesson,
  ReasoningTokensLesson,
  BackpropagationLesson,
  SupervisedFineTuningLesson,
  RewardModelingLesson,
  FlashAttentionLesson,
  TestTimeSearchLesson,
  MixedPrecisionLesson,
  MatrixOptimizersLesson,
  ParameterEfficientFinetuningLesson,
  PpoLesson,
  GrpoLesson,
  VerifiableRewardsLesson,
  KvCacheSystemsLesson,
  QuantizationLesson,
  SpeculativeDecodingLesson,
  KvCacheLesson,
  SyntheticDataLesson,
  OptimizersLesson,
  PreferenceOptimizationLesson,
  LongContextLesson,
  MixtureOfExpertsLesson,
  ToolCallingLesson,
  DistributedTrainingLesson,
};
export type { PipelineLesson };

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
  neural: NeuralLesson;
  hw: HwLesson;
  emb: EmbLesson;
  attn: AttnLesson;
  webScale: WebScaleLesson;
  domains: DomainLesson;
  dedup: DedupLesson;
  recipe: RecipeLesson;
  distill: DistillLesson;
  dataPipeline: PipelineLesson;
  dataPipelineDeep: PipelineLesson;
  backbone: BackboneCopy;
  qualityFiltering: QualityFilteringLesson;
  tokenDictionary: TokenDictionaryLesson;
  embeddingMatrix: EmbeddingMatrixLesson;
  transformerBlock: TransformerBlockLesson;
  nextToken: NextTokenLesson;
  autoregressiveLoop: AutoregressiveLoopLesson;
  howModelsLearn: HowModelsLearnLesson;
  baseVsAssistant: BaseVsAssistantLesson;
  whyAlignment: WhyAlignmentLesson;
  prefillVsDecode: PrefillVsDecodeLesson;
  classifierScoring: ClassifierScoringLesson;
  multiTurnFormatting: MultiTurnFormattingLesson;
  feedForward: FeedForwardLesson;
  extractionParsing: ExtractionParsingLesson;
  safetyFiltering: SafetyFilteringLesson;
  positionalEncoding: PositionalEncodingLesson;
  specialTokens: SpecialTokensLesson;
  attentionMechanism: AttentionMechanismLesson;
  samplingStrategies: SamplingStrategiesLesson;
  piiScrubbing: PiiScrubbingLesson;
  binPacking: BinPackingLesson;
  ropeMath: RopeMathLesson;
  constrainedDecoding: ConstrainedDecodingLesson;
  reasoningTokens: ReasoningTokensLesson;
  backpropagation: BackpropagationLesson;
  supervisedFineTuning: SupervisedFineTuningLesson;
  rewardModeling: RewardModelingLesson;
  flashAttention: FlashAttentionLesson;
  testTimeSearch: TestTimeSearchLesson;
  mixedPrecision: MixedPrecisionLesson;
  matrixOptimizers: MatrixOptimizersLesson;
  parameterEfficientFinetuning: ParameterEfficientFinetuningLesson;
  ppo: PpoLesson;
  grpo: GrpoLesson;
  verifiableRewards: VerifiableRewardsLesson;
  kvCacheSystems: KvCacheSystemsLesson;
  quantization: QuantizationLesson;
  speculativeDecoding: SpeculativeDecodingLesson;
  kvCache: KvCacheLesson;
  syntheticData: SyntheticDataLesson;
  optimizers: OptimizersLesson;
  preferenceOptimization: PreferenceOptimizationLesson;
  longContext: LongContextLesson;
  mixtureOfExperts: MixtureOfExpertsLesson;
  toolCalling: ToolCallingLesson;
  distributedTraining: DistributedTrainingLesson;
  stage1List: string[];
}








/** Phase 0.5 — Data recipe & synthetic expansion (6 nodes). Reuses WsNodeCopy. */
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
  scoreAsideLabel: string;
  scoreAsideBody: string;
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
  tapeBridge: string;
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
  cutoffBody: string;
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

/** A one-tap example that sets the network into a revealing state. */
export interface NeuralPreset {
  label: string;
  note: string;
}

/** One model-splitting strategy card (interactive 3 of the "GPU or CPU?" lesson). */
export interface HwStrategy {
  key: string; //   "data" | "tensor" | "pipeline"
  label: string; // tab label
  tag: string; //   one-line what-it-does
  own: string; //   what each GPU holds (the whole-vs-split answer)
  desc: string; //  a sentence of detail
  comm: string; //  what the GPUs must exchange
}

/** "Embeddings: meaning as vectors" — words become points on a map where nearby
 *  means similar, and the map's structure is learned during pretraining. */
export interface EmbLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  // hero — a word becomes a vector becomes a point
  heroLabel: string;
  heroWord: string;
  heroVecLabel: string;
  heroMapLabel: string;
  heroCaption: string;
  // concept 1 — meaning as vectors
  concept: string[];
  // interactive 1 — the map
  mapLabel: string;
  mapTitle: string;
  mapBody: string;
  mapHint: string;
  mapNearLabel: string;
  groupLabels: { people: string; animal: string; food: string; tech: string };
  mapNote: string;
  // concept 2 — where the meaning comes from (pretraining)
  ptConcept: string[];
  // interactive 2 — vector arithmetic
  arLabel: string;
  arTitle: string;
  arBody: string;
  arResultLabel: string;
  arSlotStart: string;
  arSlotMinus: string;
  arSlotPlus: string;
  arRead: string;
  arNote: string;
  // interactive 3 — how this becomes the next token
  ntLabel: string;
  ntTitle: string;
  ntBody: string;
  ntTokens: string;
  ntEmbed: string;
  ntSeq: string;
  ntModel: string;
  ntNextVec: string;
  ntUnembed: string;
  ntScores: string;
  ntNextToken: string;
  ntWeights: string;
  ntData: string;
  ntTying: string;
  ntTakeaway: string;
  ntSteps: { t: string; d: string }[];
  ntPrev: string;
  ntNext: string;
  ntZoomIn: string; //  toggle → focus the active stage
  ntZoomOut: string; // toggle → see the whole pipeline
  // embedding-matrix explainer (before the next-token pipeline)
  emLabel: string;
  emTitle: string;
  emBody: string;
  emRows: string;
  emCols: string;
  emPick: string;
  emReadout: string; //  "{word}'s row — a few of its 4,096 numbers"
  emUnembTitle: string;
  emUnembBody: string;
  emPretrain: string;
  emWords: string[]; //   sample tokens offered as clickable rows
  // explain / deeper
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string[];
  cosTitle: string;
  cosBody: string[];
  // bridge
  bridgeLabel: string;
  bridgeBody: string;
  // per-word display labels (EN falls back to the key)
  words: Record<string, string>;
}

/** Display copy for one attention head in the lens interactive. */
export interface AttnHeadCopy {
  name: string;
  desc: string;
}

/** "Transformers & attention" — how tokens look at each other. Two interactives:
 *  the attention lens (click a word, watch what it attends to, across three
 *  heads) and the query·key·value toy (steer a query and watch “bank” take on
 *  its meaning from context). */
export interface AttnLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  // hero — one word flips what “it” looks at
  heroLabel: string;
  heroToggleLabel: string;
  heroWordTired: string;
  heroWordWide: string;
  heroReadTired: string;
  heroReadWide: string;
  heroCaption: string;
  // concept 1 — attention as a soft lookup
  concept: string[];
  // interactive 1 — the attention lens
  lensLabel: string;
  lensTitle: string;
  lensBody: string;
  lensHint: string;
  lensHeadLabel: string;
  heads: { reference: AttnHeadCopy; previous: AttnHeadCopy; syntax: AttnHeadCopy };
  lensRead: string; //   uses {q} and {k}
  lensNote: string;
  // concept 2 — query, key, value
  qkvConcept: string[];
  // interactive 2 — the query·key·value toy
  qkvLabel: string;
  qkvTitle: string;
  qkvBody: string;
  qkvSliderLabel: string;
  qkvSliderLeft: string;
  qkvSliderRight: string;
  qkvPresetRiver: string;
  qkvPresetMixed: string;
  qkvPresetMoney: string;
  qkvRiver: string;
  qkvMoney: string;
  qkvBank: string;
  qkvWeightLabel: string;
  qkvMeaningLabel: string;
  qkvRead: string; //   uses {w} (winning context word)
  qkvNote: string;
  // explain / deeper
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string[];
  maskTitle: string;
  maskBody: string[];
  // bridge
  bridgeLabel: string;
  bridgeBody: string;
}

/** "GPU or CPU?" — how a neural network actually runs on hardware. Three
 *  interactives: the matrix-multiply race, inside a rack, and splitting the
 *  model across many GPUs. */
export interface HwLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  // hero — a layer is a matrix multiply; the CPU walks it, the GPU fires it at once
  heroLabel: string;
  heroSub: string;
  heroCpu: string;
  heroGpu: string;
  heroCpuTag: string;
  heroGpuTag: string;
  heroCaption: string;
  // concept 1 — the work is matrix multiplication
  concept: string[];
  // interactive 1 — the matrix-multiply race
  raceLabel: string;
  raceTitle: string;
  raceBody: string;
  raceSizeLabel: string;
  raceRun: string;
  raceReset: string;
  raceCpuName: string;
  raceGpuName: string;
  raceCpuCores: string;
  raceGpuCores: string;
  raceStepsLabel: string;
  raceCellNote: string;
  raceSpeedupLabel: string;
  raceWinnerNote: string;
  raceNote: string;
  raceParamsLabel: string;
  raceNeuronsLabel: string;
  raceNeuronWord: string;
  raceLayerWord: string;
  raceDoneWord: string;
  raceReadyWord: string;
  raceDotLabel: string;
  raceCpuChip: string;
  raceGpuChip: string;
  raceCoresWord: string;
  raceAtOnce: string;
  raceOneAtATime: string;
  raceCompleteWord: string;
  // concept 2 — one GPU is not enough
  midConcept: string[];
  // interactive 2 — inside a rack
  rackLabel: string;
  rackTitle: string;
  rackBody: string;
  rackHint: string;
  rackPaths: string[]; //     [same node, across nodes, across racks]
  rackLinkLabel: string;
  rackBwLabel: string;
  rackTimeLabel: string;
  rackHopsLabel: string;
  rackNodeWord: string;
  rackRackWord: string;
  rackGpuWord: string;
  rackNvlink: string;
  rackInfiniband: string;
  rackNote: string;
  // concept 3 — split the model across GPUs
  splitConcept: string[];
  // interactive 3 — split the model
  splitLabel: string;
  splitTitle: string;
  splitBody: string;
  splitStrategies: HwStrategy[]; // 3
  splitNetLabel: string;
  splitOwnLabel: string;
  splitCommLabel: string;
  splitGpuWord: string;
  splitNote: string;
  // explain it back
  explainQ: string;
  explainA: string;
  // go deeper
  deeperTitle: string;
  deeperBody: string[];
  deeper2Title: string;
  deeper2Body: string[];
  // bridge
  bridgeLabel: string;
  bridgeBody: string;
}

export interface NeuralLesson {
  crumb: string;
  title: string;
  lede: string;
  prev: string;
  next: string;
  // hero — an LLM is a neural network (animated pipeline)
  heroPromptLabel: string;
  heroPromptText: string;
  heroTokensLabel: string;
  heroNetLabel: string;
  heroNetSub: string;
  heroNextLabel: string;
  heroPredict: string;
  heroAlt1: string;
  heroAlt2: string;
  heroStepTokenize: string;
  heroStepFlow: string;
  heroStepPredict: string;
  heroCaption: string;
  // concept — you already know this
  concept: string[];
  // interactive — the anatomy of a network, then the scale calculator
  psAnatomyLabel: string;
  psTitle: string;
  psBody: string;
  psLegend: string;
  psFormulaLead: string;
  psTotalNote: string;
  psLabel: string;
  psCalcTitle: string;
  psCalcBody: string;
  psWidthLabel: string;
  psDepthLabel: string;
  psNeuronsLabel: string;
  psParamsLabel: string;
  psConnNote: string;
  psPresets: NeuralPreset[];
  psTwoDials: string;
  // interactive A — one neuron (concrete, numeric)
  naLabel: string;
  naTitle: string;
  naBody: string;
  naScenarioLabel: string;
  naInput1: string;
  naInput2: string;
  naInput1Lo: string;
  naInput1Hi: string;
  naInput2Lo: string;
  naInput2Hi: string;
  naDialsLabel: string;
  naDialsHint: string;
  naComputeLabel: string;
  naSumLabel: string;
  naSquashLabel: string;
  naSquashHelp: string;
  naOutputLabel: string;
  naHam: string;
  naSpam: string;
  naVerdictSpam: string;
  naVerdictHam: string;
  naPresets: NeuralPreset[];
  naNote: string;
  // interactive — the dot product (match score), why LLMs use it
  dpLabel: string;
  dpTitle: string;
  dpBody: string;
  dpQuestionLead: string;
  dpQuestion: string;
  dpCandidates: string;
  dpLedgerLegend: string;
  dpFeatures: string[];
  dpRowTaste: string;
  dpRowMovie: string;
  dpRowProduct: string;
  dpSumLabel: string;
  dpSquashLead: string;
  dpSquashNote: string;
  dpMatrixHint: string;
  dpScoreLabel: string;
  dpKeep: string;
  dpDrop: string;
  dpParamNote: string;
  dpPresets: NeuralPreset[];
  dpWhy: string;
  // concept — what those knobs mean, then why stack
  midConcept: string[];
  // interactive B — a layer of neurons predicts the next word
  nwLabel: string;
  nwTitle: string;
  nwBody: string;
  nwInputLabel: string;
  nwHiddenLabel: string;
  nwOutputLabel: string;
  nwFeatures: string[];
  nwConcepts: string[];
  nwWords: string[];
  nwActionWord: string;
  nwSentence: string;
  nwPromptTail: string;
  nwVocabLead: string;
  nwVocabCount: string;
  nwFiresTag: string;
  nwQuietTag: string;
  nwWinnerTag: string;
  nwInspectHint: string;
  nwParamNote: string;
  nwPresets: NeuralPreset[];
  nwWhy: string;
  weightWord: string;
  biasWord: string;
  // closing
  closeConcept: string;
  // explain / deeper
  explainQ: string;
  explainA: string;
  deeperTitle: string;
  deeperBody: string;
  sizeDeeperTitle: string;
  sizeDeeperBody: string[];
  interpDeeperTitle: string;
  interpDeeperBody: string[];
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
    stage1Label: "STAGE 1 · 10 LESSONS",
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
        lessons: 10,
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
        "The surprising part: **quality beats raw size.** A smaller, well-filtered corpus trains a better model than a bigger dirty one — so most of what’s collected is deliberately thrown away. **Duplicates go first**: repeated text pushes a model to *memorise and regurgitate* instead of generalise, and wastes training on the same words twice.",
        "And what’s left isn’t one pile but a **blend** — a weighted recipe of web, code, books, math and many languages, some sources up-sampled and others down. The cutting has a cost of its own, too: **filter too aggressively and you strip out real diversity** along with the junk.",
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
      scoreAsideLabel: "HOW THE SCORE WORKS",
      scoreAsideBody: "That “quality” number isn’t objective. It’s a **classifier** trained to tell a **reference corpus** (Wikipedia, books) apart from raw web. It runs **per document**, **before tokenization**: the doc’s features become a vector `x`, learned weights `w` score it as `≈ w · x`, and that single number gates the *whole* document in or out. So it’s never a property of individual tokens — which is why you’ll never see it inside the tape. Low-quality docs are dropped up here and simply never become tokens.",
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
      tapeBridge: "This tape is the output of Interactive A. Every document that survived cleaning was **tokenized**, and its IDs **laid end-to-end** — all the survivors **concatenated** into one flat line, with a **document-separator token** between them (the darker cells). The docs you dropped add **zero cells**; they’re simply not here. Each square below is one token from that tape.",
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
      cutoffBody: "And because it’s written once, the tape is a **snapshot** — frozen at the moment of the crawl. The data is the model’s world, so the model’s world *ends where the tape ends*: it knows nothing that happened after. That frozen edge is its **knowledge cutoff**.",
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
    neural: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 5",
      title: "Neural networks",
      lede: "Here’s the one-sentence version: **an LLM is a neural network.** A giant one. It turns your tokens into a guess for the next token — and it’s built by repeating one tiny part. No math background needed; we’ll build that part from scratch.",
      prev: "Bias",
      next: "GPU or CPU?",
      heroPromptLabel: "YOUR PROMPT",
      heroPromptText: "I want a hot dog to",
      heroTokensLabel: "TOKENS",
      heroNetLabel: "A NEURAL NETWORK",
      heroNetSub: "layers of neurons — millions of them",
      heroNextLabel: "NEXT TOKEN",
      heroPredict: "eat",
      heroAlt1: "pet",
      heroAlt2: "buy",
      heroStepTokenize: "become numbers (last lesson)",
      heroStepFlow: "flow through the network",
      heroStepPredict: "out comes a prediction",
      heroCaption: "That’s an LLM, start to finish: your text becomes tokens, the tokens flow through a **neural network**, and out comes a guess for the next token. This whole lesson zooms into that middle box — because it’s just one tiny unit, the **neuron**, repeated millions of times. Let’s build one.",
      concept: [
        "Look at that middle box again. It’s nothing but a huge pile of numbers — the **weights** — and those numbers have a name you’ve seen on every model: **parameters**. When a model is called **Gemma 3 12B**, that’s **12 billion** of them; **Llama 3 70B** has seventy billion. That count *is* the model — everything it “knows” is those billions of numbers, arranged in layers. So the real question is simple: **what is one of these numbers, and what does it do?** Let’s zoom all the way in — to a single one.",
        "You’ve written this function before: `score = w1*a + w2*b + bias`. A weighted sum — a few inputs, each scaled by how much it matters, plus a constant. A **neuron** is exactly that, with one extra step at the end: it **squashes** the score into a 0-to-1 answer, like a probability.",
        "The numbers `w1, w2, bias` are the neuron’s **weights** — three of the model’s billions of parameters. Bigger weight = that input matters more; a **negative** weight means the input votes the *other* way. Change the weights and you change what the function decides. Nobody types these — they’re **learned** from data (that’s the next lesson). Here, you’ll set them yourself so you can see what they do.",
      ],
      psAnatomyLabel: "THE ANATOMY",
      psTitle: "A parameter is a weight on a connection",
      psBody: "Here’s a tiny network — four **layers** of **neurons**, wired together. Every **line is a weight**, and the weights are the **parameters**. **Click any neuron** to light up exactly which weights feed it, and the little formula it computes: `activation(w₁·a₁ + w₂·a₂ + … + b)`. Its parameters are those incoming weights, plus one bias — so parameters live on the **wires**, not the neurons.",
      psLegend: "Each column is a layer · each circle a neuron · each line a weight (one parameter).",
      psFormulaLead: "The highlighted neuron computes:",
      psTotalNote: "Count them up: **65 weights + 14 biases = 79 parameters** in this whole little network. A real model runs the same tally into the billions.",
      psLabel: "TRY IT · WHERE THE BILLIONS COME FROM",
      psCalcTitle: "Now scale it up — a 70B model in layers and neurons",
      psCalcBody: "Same parts, just more of them. A single neuron has only a few thousand weights — but **widen** each layer and **stack** more of them, and the total explodes. Drag the two dials, or jump straight to a real model’s size.",
      psWidthLabel: "WIDTH · neurons per layer",
      psDepthLabel: "DEPTH · layers",
      psNeuronsLabel: "NEURONS",
      psParamsLabel: "PARAMETERS",
      psConnNote: "Each line is one weight — one parameter. A layer of *width* neurons, each fed by *width* neurons before it, holds **width² connections**. Sum that over every layer and the total lands in the billions — from connections, not cells.",
      psPresets: [
        { label: "≈ 85M", note: "A small model — GPT-2 size. Even a network only 768 neurons wide, 12 layers deep, already carries ~85 **million** parameters." },
        { label: "≈ 12B", note: "Widen to 4,096 and deepen to 60 layers and the count leaps to ~12 **billion** — **Gemma 3 12B** territory. Only ~1 million neurons, though." },
        { label: "≈ 70B", note: "Double the width again to 8,192 and you reach ~70 **billion** — a **Llama 3 70B**-class model. Notice: doubling the width roughly **quadruples** the parameters." },
      ],
      psTwoDials: "So a model’s size is quoted in **parameters** — the memory-and-compute footprint — and it’s set by just **two dials**: **width** (neurons per layer) and **depth** (layers). Widen the network and parameters grow with the **square** of the width; that quadratic is where “12B”, “70B” and beyond come from. Only a few million neurons — but billions of connections between them.",
      naLabel: "TRY IT · ONE NEURON",
      naTitle: "A neuron deciding: spam, or not?",
      naBody: "Here’s a single neuron built as a tiny spam filter. It reads two things about an email, weighs each one, adds them up, and squashes the total into “how spammy, 0–100%”. Drag the inputs — or the neuron’s weights — and **watch every number update live**.",
      naScenarioLabel: "THE EMAIL",
      naInput1: "Suspicious links",
      naInput2: "Known sender",
      naInput1Lo: "none",
      naInput1Hi: "loads",
      naInput2Lo: "stranger",
      naInput2Hi: "close contact",
      naDialsLabel: "THE NEURON’S WEIGHTS",
      naDialsHint: "How much each input matters, and which way it votes. These are the knobs training tunes.",
      naComputeLabel: "WHAT THE NEURON COMPUTES",
      naSumLabel: "weighted sum",
      naSquashLabel: "squash to 0–1",
      naSquashHelp: "**σ is the sigmoid.** Its whole job is to squash that raw weighted sum — which can be anything from −∞ to +∞ — into a clean **0-to-1** score you can read like a probability. A big positive sum lands near **1**, a big negative one near **0**, and a sum around zero sits near **0.5**. The formula: `σ(z) = 1 / (1 + e^(−z))`.",
      naOutputLabel: "SPAM SCORE",
      naHam: "Not spam",
      naSpam: "Spam",
      naVerdictSpam: "→ flagged as spam",
      naVerdictHam: "→ delivered to inbox",
      naPresets: [
        { label: "Obvious spam", note: "Loads of links, total stranger. Both inputs push up hard — the score pins near 100%. Easy call." },
        { label: "Email from mum", note: "A known sender, barely any links. The **negative** weight on “known sender” drags the score down and vetoes it — delivered." },
        { label: "Borderline", note: "Right on the fence, near the 50% line. A tiny nudge to either input flips the verdict — that boundary is where a neuron is least sure." },
      ],
      naNote: "This is one real neuron — the same arithmetic runs, unchanged, billions of times inside a large model. The only thing that scales is the number of neurons and inputs.",
      dpLabel: "TRY IT · NEURON 3 — THE ‘HOT + DOG’ DETECTOR",
      dpBody: "The model reads *“I'm hungry, I want a hot dog”* and has to decide the intent: **Eat** or **Pet**? First, one neuron scans for the phrase. A neuron is pure vector math: its input is a **vector x** — which words are present — and its parameters are a **weight vector w** of the **same length**. The neuron outputs their **dot product** `w · x` = ∑ᵢ wᵢxᵢ: multiply the two vectors component by component, then add. This one, **Neuron 3**, carries big weights on *hot* and *dog*, so it spikes only when both appear. Pick a sentence.",
      dpTitle: "A neuron is one dot product",
      dpQuestionLead: "TWO VECTORS OF THE SAME LENGTH → ONE NUMBER",
      dpQuestion: "Does this sentence say “hot dog”?",
      dpCandidates: "w = the neuron’s weights · x = the words in the sentence",
      dpLedgerLegend: "**w** and **x** are both length-4 vectors. Multiply them **component by component** — wᵢ · xᵢ — and add the row. That single number is the **dot product** `w · x`.",
      dpFeatures: ["hot", "dog", "cold", "cute"],
      dpRowTaste: "w  (weights)",
      dpRowMovie: "x  (inputs)",
      dpRowProduct: "wᵢ · xᵢ",
      dpSumLabel: "w · x",
      dpSquashLead: "THE NEURON THEN SQUASHES:  σ(w · x + b)",
      dpSquashNote: "A neuron doesn’t stop at the dot product. It adds a **bias** and runs the total through **σ (the sigmoid)** — squashing any real number into a **0–1 activation**. With a bias of **−2.5**, only a full *hot + dog* match (w·x = 3.5 → σ ≈ 0.73) clears **50%**; half-matches like *“too hot”* fall well below. `σ(z) = 1 / (1 + e⁻ᶻ)`.",
      dpMatrixHint: "Tap a **component** to inspect its term: wᵢ × xᵢ.",
      dpScoreLabel: "FUSION SCORE  w · x",
      dpKeep: "yes — “hot dog”",
      dpDrop: "no — not the phrase",
      dpParamNote: "That’s the whole neuron: a **weight vector** dotted with an **input vector** — one multiply-add per component. Real models use vectors thousands long, but the operation is identical. On its own, though, Neuron 3 only knows the words *hot* and *dog* were said. It has **no idea** whether that means a snack or a warm puppy — that takes the network below.",
      dpPresets: [
        { label: "“I want a hot dog”", note: "Both **hot** (x₁=1) and **dog** (x₂=1) are present, each weighted **+1.75**, so their products stack to **w·x = +3.5** — a strong signal the **phrase** “hot dog” was said." },
        { label: "“the soup is too hot”", note: "Only **hot** fires (x₁=1); **dog** is 0, so its +1.75 weight multiplies by nothing. Score **+1.75** — half. The phrase isn’t there." },
        { label: "“look at that cute dog”", note: "**dog** is present (x₂=1), but so is **cute** (x₄=1, weight −1.0) and there’s no **hot**. Score **+0.75** — weak. Not the phrase “hot dog.”" },
      ],
      dpWhy: "That one number is what a neuron *is*: a **dot product of two vectors**. But `w·x = +3.5` is ambiguous — *hot dog* the food, or a *dog* that’s *hot*? A single neuron can’t tell. Resolving it takes a **network** that reads this score alongside other signals. That’s next.",
      midConcept: [
        "That’s Neuron 3 — one **dot product**, `w · x`. It found the phrase “hot dog,” scoring **+3.5**. But a score can’t tell a **snack** from a **warm puppy** — same words, two meanings. Resolving that takes context, and reading context takes more neurons **combined**.",
        "So we **stack** neurons into **layers**. Neuron 3 becomes one of **three inputs**; a **hidden layer** of context gates weighs it against *hunger* and *pet words*; and an **output layer** picks the intent — `f(g(x))`, functions inside functions. The squash on each neuron lets a later layer read *combinations*, not just sums. Here’s the whole network.",
      ],
      nwLabel: "TRY IT · THE 7-NEURON NETWORK",
      nwTitle: "The network predicts the next word",
      nwBody: "Same job as the hero: predict the next word — here, **eat** or **pet**. The full network is **3 → 2 → 2**. Three **input neurons** read the sentence: **Hunger**, **Pet words**, and **Hot+Dog** (Neuron 3, from above). Two **hidden gates** combine them: an **Eat gate** (fires on hunger *and* the hot-dog phrase) and a **Pet gate** (fires on pet words, but hunger shuts it down). Two **output neurons** — **EAT** and **PET** — read the gates, and the louder one is the prediction. Follow the signal left to right, and tap any wire to read its weight.",
      nwInputLabel: "INPUTS · three neurons",
      nwHiddenLabel: "HIDDEN · context gates",
      nwOutputLabel: "NEXT WORD · eat or pet",
      nwFeatures: ["Hunger", "Pet words", "Hot+Dog"],
      nwConcepts: ["Eat gate", "Pet gate"],
      nwWords: ["EAT", "PET"],
      nwActionWord: "output",
      nwSentence: "I'm hungry, I want a hot dog to",
      nwPromptTail: "→ the next word?",
      nwVocabLead: "NOW SCALE THE OUTPUT LAYER",
      nwVocabCount: "~200,000 tokens",
      nwFiresTag: "fires",
      nwQuietTag: "quiet",
      nwWinnerTag: "chosen",
      nwInspectHint: "Tap any **neuron** or **wire** to read the weight it carries — the parameters, live.",
      nwParamNote: "Only **14 parameters**, and the trick is the **Pet gate’s big negative weight on Hunger**: even when *hot* + *dog* both fire, a hungry context crushes “pet” and the meaning routes to **EAT**. No single neuron did that — the *combination* did.",
      nwPresets: [
        { label: "“I'm hungry, I want a hot dog”", note: "Hunger is high (**2.0**) and Hot+Dog fires (**3.5**). The **Eat gate** lights up, the **Pet gate** stays dark — hunger’s negative weight smothers it — and the output routes to **EAT** (~95%). “Hot dog” = food." },
        { label: "“let me pet that cute dog”", note: "No hunger, lots of **Pet words** (3.0). The **Pet gate** blazes, Eat stays quiet, and the intent is **PET** (~97%). Same detector, different context." },
        { label: "“the dog is panting in the hot sun”", note: "Here’s the magic: *hot* + *dog* both appear, so **Neuron 3 still fires +3.5** — it thinks “hot dog!” But there’s **no hunger** and the animal context is strong, so the network **overrules** it: **PET** (~80%). Context beat the phrase." },
      ],
      nwWhy: "That’s the whole point of depth: one neuron *found* the phrase, but the **network decided what it meant** by weighing it against context — and that’s a language model in miniature. Here we gave just **2 outputs**, EAT or PET. A real LLM’s output layer has **one neuron per token in its vocabulary — around 200,000** — so it emits a **200,000-long vector**: a score for *every possible next token*. Softmax turns that into a probability for each, and the model samples the next token from it. Everything else is identical — dot products and squashes, just thousands of inputs and dozens of far wider layers.",
      weightWord: "weight",
      biasWord: "bias",
      closeConcept: "One thing stayed hidden the whole lesson: **every weight here, you’d have to set by hand.** A real model has billions of them, and nobody types a single one — they’re *learned* from data. Where the weights come from is the one question left. That’s **training** — next.",
      explainQ: "You build a network with a hidden layer but leave the nonlinearity out — every neuron just passes its weighted sum straight through. Why can it still only draw a straight boundary?",
      explainA: "Because a stack of linear steps is still linear. Multiplying by weights and adding a bias is a linear operation, and composing linear operations just gives you one bigger linear operation — mathematically identical to a single layer. And a linear function can only carve space with a straight line (or a flat plane in higher dimensions). The nonlinearity between layers is what breaks the collapse: it reshapes the space before the next layer acts, so the composition can curve. No nonlinearity, no curves — however many layers you stack.",
      deeperTitle: "Go deeper: the matrix form, activations, and “universal approximation”",
      deeperBody: "In matrix form, one layer is `h = act(W·x + b)` — a matrix multiply, a bias add, and an element-wise nonlinearity; a network just chains these. Common activations: **tanh** (used here), **ReLU** (`max(0, z)`, the workhorse of large models), and **sigmoid** at the output for a probability. The *universal approximation theorem* says a network with a single hidden layer and enough neurons can approximate essentially any function — so raw capacity was never the hard part. The hard part is **finding the weights**, and that’s exactly what training does (next lesson). Everything a large model “knows” is billions of these same weights.",
      sizeDeeperTitle: "Go deeper: how big should a model be?",
      sizeDeeperBody: [
        "Recall that “size” is really two dials — **width × depth** — and they fix the parameter count (`params ≈ 12 × layers × d_model²`). That squaring is why a model is only a few *million* neurons but *billions* of parameters: the count lives in the **connections, not the cells**.",
        "But you don’t pick the size freely. You start from a **compute budget**: training cost is roughly `FLOPs ≈ 6 × params × tokens`. **Scaling laws** (Chinchilla) then say how to spend it — for a given budget there’s a *compute-optimal* balance of model size and data, famously about **~20 tokens per parameter**. A bigger model needs proportionally more data, not just more weights.",
        "Splitting that total into **depth vs width** is more heuristic than the total itself. There’s a known-good **aspect ratio**: too deep-and-thin trains slowly and unstably, too wide-and-shallow wastes capacity. Labs tune the ratio on small models, extrapolate, and round widths to sizes the GPUs run efficiently.",
        "A twist: labs often deliberately **over-train** a *smaller* model — feeding it far more tokens than “optimal” — because a smaller model is **cheaper to serve** for years afterward. Inference cost, not just training cost, pulls the final size down.",
        "And with an ever-bigger budget, the real limiter stops being compute and becomes **data**. High-quality text is finite; past a point you hit the **data wall** (the corpus you cleaned in the Data lesson only goes so far). The full scaling-laws story comes in **Pretraining → alignment** — this is just the intuition.",
      ],
      interpDeeperTitle: "Go deeper: what does a neuron actually mean?",
      interpDeeperBody: [
        "Tempting question: does neuron #4,127 *mean* something — “detects cats”? The honest answer is usually **no**. A single neuron in the middle of a network rarely has a clean meaning, for two reasons.",
        "**Polysemanticity**: one neuron lights up for many *unrelated* things at once. And **superposition**: a model packs **more features than it has neurons** into overlapping directions. It gets away with this because real features are **sparse** — only a few are active at any moment — so they rarely collide.",
        "So the reframe is: **meaning lives in directions, not neurons.** Neurons are just the *axes* of the space; the real features are *diagonals* across many of them. (That’s the same idea you’ll meet in **Embeddings** — meaning is a direction in a vector space.)",
        "It’s no longer a pure black box, though. **Sparse autoencoders** can pull human-interpretable features back out — a celebrated one is a “**Golden Gate Bridge**” feature — and **clamping** that feature on visibly steers the model’s behaviour. So we can now *read*, and even *nudge*, a growing fraction of what a model represents — at the **feature** level, not the neuron level.",
        "Very loosely, features get more abstract with depth: **early** layers lean surface and syntactic, **middle** layers more abstract and semantic, **late** layers swing toward steering the next token. Treat that as a narrative, not a map.",
        "Big caveat: interpretability is **early and incomplete** — nobody has a full labeled map of a large model, and it’s easy to overclaim. But it turns “what does a neuron mean?” into “what does a *direction* mean?” — which connects forward to **Embeddings** (meaning as a direction) and back to **Bias**, where those association skews are literally geometry in this same space.",
      ],
      bridgeLabel: "NEXT: GPU OR CPU?",
      bridgeBody: "You built this network out of dot products. Every one is a multiply-and-add — and a real model runs *billions* of them per token. That mountain of arithmetic is why AI runs on **GPUs**, wired together by the thousands. Next: watch the network run on real hardware.",
    },
    hw: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 06",
      title: "GPU or CPU?",
      lede: "You built a network out of dot products. Now watch it *run*. The same math — a mountain of multiply-and-adds — is why AI is built on **GPUs**, wired together by the thousands.",
      prev: "Neural networks",
      next: "Embeddings",
      heroLabel: "PROCESSING A NEURAL NETWORK",
      heroSub: "layer by layer — the same network, two machines",
      heroCpu: "CPU",
      heroGpu: "GPU",
      heroCpuTag: "one neuron at a time",
      heroGpuTag: "a whole layer at once",
      heroCaption: "Every neuron in a layer is independent — so the GPU computes them all at once, while the CPU grinds through them one by one.",
      concept: [
        "Remember the neuron from the last lesson: an output is `w · x` — multiply each weight by each input, add them up. A **layer** is just many neurons doing that side by side. To run the network you compute layer 1, feed it into layer 2, then layer 3 — a stack of these steps.",
        "Here is the key fact: *within* a layer, every neuron is **independent** — none needs another's answer, so they can all be computed at the same time. Only the layers depend on each other, in order.",
        "A **CPU** has a handful of large, clever cores; it mostly computes one neuron, then the next, then the next. A **GPU** has *thousands* of small cores, so it computes a whole layer's neurons **at once**. Same math — wildly different speed.",
      ],
      raceLabel: "TRY IT · RUN THE NETWORK",
      raceTitle: "Watch it process, layer by layer",
      raceBody: "The same network runs on both machines. Press run and watch: the **GPU** lights up a whole layer at a time; the **CPU** crawls neuron by neuron. Add neurons and the gap explodes.",
      raceSizeLabel: "Neurons per layer",
      raceRun: "Run the network",
      raceReset: "Reset",
      raceCpuName: "CPU",
      raceGpuName: "GPU",
      raceCpuCores: "one neuron per step",
      raceGpuCores: "one layer per step",
      raceStepsLabel: "steps",
      raceCellNote: "each neuron = one w · x dot product over the layer before it",
      raceSpeedupLabel: "GPU finishes sooner by",
      raceWinnerNote: "The GPU computes an entire layer in **one shot**, because its neurons don't depend on each other. It still waits for each layer before the next — layer 2 needs layer 1's answers. The **CPU** gets no such shortcut: it walks every neuron, one by one. Widen the layers and its bar runs off the edge.",
      raceNote: "This toy has a few dozen neurons. A real model has *billions* of parameters and hundreds of layers — which is why a CPU would take *months* on what a GPU cluster does in days.",
      raceParamsLabel: "parameters",
      raceNeuronsLabel: "neurons",
      raceNeuronWord: "neuron",
      raceLayerWord: "layer",
      raceDoneWord: "done",
      raceReadyWord: "ready",
      raceDotLabel: "Each neuron computes one **dot product**:",
      raceCpuChip: "a few cores",
      raceGpuChip: "thousands of cores",
      raceCoresWord: "cores",
      raceAtOnce: "at once",
      raceOneAtATime: "1 at a time",
      raceCompleteWord: "Complete",
      midConcept: [
        "So a GPU is the right tool. But one GPU is not enough. Each has a fixed pool of fast memory — say **80 GB** — and a frontier model's weights are *hundreds* of gigabytes. The model simply doesn't fit.",
        "So we wire many GPUs together. Eight GPUs share a board as a **node**, linked by ultra-fast **NVLink**. Many nodes fill a **rack**, linked by **InfiniBand** networking. The GPUs are constantly swapping half-finished results — so how fast those wires are matters as much as the GPUs themselves.",
      ],
      rackLabel: "TRY IT · INSIDE A RACK",
      rackTitle: "The wires between the GPUs",
      rackBody: "GPUs on the same **node** talk over NVLink — blazing fast. GPUs on different nodes cross the **InfiniBand** network — far slower. Send a tensor and watch where it has to travel.",
      rackHint: "Send a tensor between two GPUs:",
      rackPaths: ["Same node", "Across nodes", "Across racks"],
      rackLinkLabel: "LINK",
      rackBwLabel: "BANDWIDTH",
      rackTimeLabel: "RELATIVE TIME",
      rackHopsLabel: "HOPS",
      rackNodeWord: "node",
      rackRackWord: "rack",
      rackGpuWord: "GPU",
      rackNvlink: "NVLink",
      rackInfiniband: "InfiniBand",
      rackNote: "The lesson every distributed-training engineer learns: keep the chatty work **inside a node**. Every hop onto the network costs you — so you arrange the model to cross it as little as possible.",
      splitConcept: [
        "So: does each GPU hold the **whole network**, or just a **piece** of it? Both happen — it depends on the strategy. Here's the *same* next-word network on 2 GPUs, three different ways.",
      ],
      splitLabel: "TRY IT · SPLIT THE MODEL",
      splitTitle: "One network, spread across GPUs",
      splitBody: "This little network reads a prompt and predicts the next word. Pick a strategy and watch what each GPU actually holds — the **solid** neurons live on that GPU; the faint ones live on the other.",
      splitStrategies: [
        {
          key: "data",
          label: "Data parallel",
          tag: "copy the whole network",
          own: "the **whole network** — a full copy",
          desc: "Every GPU holds a complete copy of the network and runs a different batch of prompts. After each step they average their weight updates so the copies stay identical.",
          comm: "share gradients (all-reduce)",
        },
        {
          key: "tensor",
          label: "Tensor parallel",
          tag: "split every layer's neurons",
          own: "**a slice of every layer** — half the neurons",
          desc: "The network is too wide for one GPU, so each layer's neurons are split between them. Both GPUs work on the same prompt at the same time, each computing its half.",
          comm: "share activations every layer",
        },
        {
          key: "pipeline",
          label: "Pipeline parallel",
          tag: "split the network by depth",
          own: "**a few whole layers** — one stage",
          desc: "The first layers live on GPU 1, the later layers on GPU 2. A prompt flows through GPU 1, then hands off to GPU 2 to finish — an assembly line.",
          comm: "pass activations at the handoff",
        },
      ],
      splitNetLabel: "one network · predicts the next word",
      splitOwnLabel: "Each GPU holds:",
      splitCommLabel: "GPUs must exchange:",
      splitGpuWord: "GPU",
      splitNote: "Real training combines all three at once — data *and* tensor *and* pipeline parallel — across **thousands** of GPUs for weeks. A frontier model is far too big to copy whole onto one GPU, so it's *both* split up *and* replicated. That's what a training run really is, and why it costs what it costs.",
      explainQ: "Why is a matrix multiply the perfect job for a GPU, and a bad fit for a CPU?",
      explainA: "A matrix multiply is thousands of independent dot products — no cell needs any other cell's answer. A CPU has a few cores and must walk them mostly one at a time; a GPU has thousands of small cores that each compute a different cell simultaneously. The work is \"embarrassingly parallel,\" so throwing thousands of cores at it is a near-perfect match — that's the entire reason AI runs on GPUs.",
      deeperTitle: "Why not just use a faster CPU?",
      deeperBody: [
        "A CPU core is *individually* far faster and smarter than a GPU core — deep pipelines, branch prediction, big caches — because it's built to run one messy chain of decisions quickly. Neural-network math has almost no decisions: it's the same multiply-add, a trillion times over.",
        "For that, you don't want a few geniuses; you want a stadium of workers each doing one easy sum. GPUs trade cleverness-per-core for *thousands* of cores plus very wide memory to feed them. On matrix math that trade wins by 10–100×; on branchy everyday code it would lose badly.",
      ],
      deeper2Title: "What actually flows on those wires?",
      deeper2Body: [
        "During training the GPUs exchange two big things: **activations** (the intermediate numbers passing between layers) and **gradients** (each weight's correction after a batch). Tensor and pipeline parallelism move activations; data parallelism sums gradients across every replica.",
        "This is why bandwidth is a first-class design constraint. NVLink inside a node runs at hundreds of GB/s; the InfiniBand fabric between nodes is several times slower. Engineers place the split points to keep the heaviest traffic on the fastest wires — a memory-and-network puzzle as much as a math one.",
      ],
      bridgeLabel: "NEXT: EMBEDDINGS",
      bridgeBody: "You've followed a network from math to metal. Next: the very first thing that math touches — how a token becomes a vector of *meaning* the network can compute on.",
    },
    emb: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 07",
      title: "Embeddings",
      lede: "The network can't do math on the word *“king.”* So every token is turned into a **vector** — a point in space where **nearby means similar in meaning**. Here's the twist: nobody sets those numbers. **Pretraining** learns them.",
      prev: "GPU or CPU?",
      next: "Transformers",
      heroLabel: "A WORD BECOMES A POINT",
      heroWord: "queen",
      heroVecLabel: "its vector (a few of 4,096 numbers)",
      heroMapLabel: "…a point on the map — next to “king,” far from “cat” or “pizza”",
      heroCaption: "Same idea as a hash — but instead of scattering things, it places *similar* meanings *close together*.",
      concept: [
        "An **embedding** is a lookup table: every token in the vocabulary gets a row of numbers — its **vector**. Real models use **4,096** numbers per token; here we'll use just **two**, so we can draw them on a map.",
        "The one rule that makes it useful: **distance means meaning.** Words that mean similar things sit close together; unrelated words sit far apart. “Cat” lands near “dog,” far from “pizza.”",
        "That's it — meaning becomes *geometry*. And once meaning is geometry, the model can do arithmetic with it. Play with the map, then we'll see where the layout comes from.",
      ],
      mapLabel: "TRY IT · THE MAP OF MEANING",
      mapTitle: "Similar words sit close together",
      mapBody: "Every dot is a word, placed by its vector. Tap one and watch its **nearest neighbours** light up — they're the words closest in meaning. Notice how the four topics settle into their own neighbourhoods.",
      mapHint: "Tap a word:",
      mapNearLabel: "nearest in meaning",
      groupLabels: { people: "people", animal: "animals", food: "food", tech: "tech" },
      mapNote: "This is a *toy* map — 36 words in 2D. A real model has hundreds of thousands of tokens in 4,096 dimensions, but the rule is identical: close = similar.",
      ptConcept: [
        "So where do these positions come from? **Nobody places them.** They start as *random* numbers — every word scattered at random.",
        "Then **pretraining** happens: the model reads trillions of words, each time guessing the next token. Every guess nudges the vectors. Words that keep showing up in the *same contexts* — “king” and “queen,” “cat” and “dog” — get pulled together; words that never co-occur drift apart.",
        "After enough text, the random cloud has organised itself into the map you just explored. The meaning wasn't programmed — it **precipitated out of predicting the next word.** *“You shall know a word by the company it keeps.”*",
      ],
      arLabel: "TRY IT · MEANING IS ARITHMETIC",
      arTitle: "king − man + woman ≈ ?",
      arBody: "Each word is an arrow from the origin, so you can **add and subtract** them. **Subtracting** a word means stepping *away* from it; **adding** a word means stepping *toward* it. So `king − man + woman` reads: *start at **king**, step away from **man** and toward **woman*** — which is the same as walking the **man → woman** arrow, starting from king. You land on **queen**.",
      arResultLabel: "≈ nearest word",
      arSlotStart: "start at",
      arSlotMinus: "− subtract",
      arSlotPlus: "+ add",
      arRead: "Step through it: **1** the three words as vectors from **0** · **2** start at **king** · **3** subtract **man** · **4** add **woman** · **5** the chain lands nearest **queen**.",
      arNote: "That “man → woman” step is a **gender direction** the model discovered on its own — the same arrow separates actor/actress, uncle/aunt, prince/princess. Real embeddings hold hundreds of such directions (tense, plural, country→capital) nobody labelled.",
      ntLabel: "HOW THIS BECOMES THE NEXT TOKEN",
      ntTitle: "From vectors to the next word",
      ntBody: "Embeddings turn tokens into vectors — but how does that predict the *next* one? Here's the whole pipeline. Your prompt (up to **4,096 tokens**) is looked up in the embedding matrix, run through **the model**, and turned back into a score for every one of ~200,000 vocabulary tokens. The highest score wins.",
      ntTokens: "up to 4,096 tokens",
      ntEmbed: "embedding matrix",
      ntSeq: "the sequence",
      ntModel: "the model",
      ntNextVec: "the next-word vector",
      ntUnembed: "unembedding matrix",
      ntScores: "~200,000 scores — softmax, pick the highest",
      ntNextToken: "next token",
      ntWeights: "learned weights",
      ntData: "live data",
      ntTying: "In many LLMs these two matrices are the **same weights, transposed** (“weight tying”): the matrix that turns tokens *into* vectors also turns the final vector *back* into token scores.",
      ntTakeaway: "That's the whole loop: embed the tokens → run the model → score the vocabulary → pick one. Then append it and do it all again, one token at a time.",
      ntSteps: [
        { t: "Your prompt, as tokens", d: "The input is a sequence of up to **4,096 tokens** — the context window. Each token is one of ~200,000 vocabulary entries." },
        { t: "Look up each vector", d: "Grab each token's **row** from the embedding table — learned weights, shape **200k × 4k** (about 820M numbers on their own)." },
        { t: "The sequence of vectors", d: "Now the prompt is a stack — **N × 4k** — one 4,096-number vector per token, carrying meaning *and* position." },
        { t: "Run the model", d: "The whole sequence flows through **the model** (the layers and attention you'll meet next lesson) and out comes a single **4,096-number vector** — a point in the *same embedding space* as the tokens, its read on what should come next." },
        { t: "The next-word vector", d: "That **1 × 4k** vector is the model's compressed guess — effectively a *predicted embedding*: a point in the same space as every token, not a word yet. That's why the next step can just look for the nearest token." },
        { t: "Score every token", d: "Each column of the **4k × 200k** unembedding table is a token's own vector. Multiplying is a **dot product** with every column — it measures how closely two vectors line up, so scoring is really *finding the nearest token in the space*: 4,096 numbers become one **score** per vocabulary token, highest = best match." },
        { t: "Softmax → probabilities", d: "That's a **1 × 200k** row of raw scores (logits). **Softmax** turns them into probabilities that add up to 1 — a full distribution over the vocabulary." },
        { t: "Pick one, then repeat", d: "Greedy decoding takes the highest; real models usually **sample** (temperature and top-p trade focus for creativity). Append the winner to the prompt and run the whole thing again — **one token at a time**." },
      ],
      ntPrev: "Previous stage",
      ntNext: "Next stage",
      ntZoomIn: "Zoom to stage",
      ntZoomOut: "See whole pipeline",
      emLabel: "THE EMBEDDING MATRIX",
      emTitle: "One big table holds every token's meaning",
      emBody: "The map you just explored is really one giant lookup table: the **embedding matrix**. It has **one row per token** in the vocabulary (~200,000) and **one column per dimension** (4,096). So each row *is* a token's vector — its coordinates in a 4,096-dimensional meaning space, where distance and direction encode how tokens relate. Click a token to see its row.",
      emRows: "~200,000 tokens (rows)",
      emCols: "4,096 dimensions (columns) →",
      emPick: "Pick a token",
      emReadout: "{word} → a few of its 4,096 numbers",
      emUnembTitle: "And the unembedding matrix?",
      emUnembBody: "The **unembedding matrix** is the same idea, flipped: **4,096 × 200,000**. Where embedding turns *a token into a vector*, unembedding turns *a vector back into a score for every token*. In many models it's literally the same weights, transposed — the map read forwards to look up, and backwards to choose.",
      emPretrain: "Nobody types these numbers in. Every coordinate is **learned during pretraining** — the model reads enormous amounts of text and nudges each token's row until tokens that appear in similar contexts end up near each other. (Pretraining is its own stage later in the roadmap.)",
      emWords: ["king", "queen", "dog", "cat", "code", "pizza"],
      explainQ: "What does it mean that “king − man + woman ≈ queen,” and where did that structure come from?",
      explainA: "Each word is a vector — a point in space — and directions between points carry meaning. The step from “man” to “woman” is a consistent “gender” direction; applying that same step to “king” lands you on “queen.” Nobody defined a gender axis: pretraining placed the words by predicting the next token over huge text, and because “king/queen” and “man/woman” appear in parallel contexts, they ended up in parallel positions. The arithmetic is just following those learned directions.",
      deeperTitle: "Why two numbers here, but 4,096 in real models?",
      deeperBody: [
        "Two dimensions let us *draw* the map, but they can only encode so much — a handful of directions before words start colliding. Real models use **4,096** dimensions, so they can pack in far more independent “directions of meaning” (formality, tense, topic, sentiment…) without everything crowding together.",
        "You can't picture 4,096 dimensions, and you don't need to — the rules you saw here (close = similar, directions = relationships) hold identically up there. The math doesn't care how many dimensions it runs in.",
      ],
      cosTitle: "Distance, or angle? (cosine similarity)",
      cosBody: [
        "On our map we used plain straight-line distance. Real systems usually compare **angle** instead, via **cosine similarity**: two vectors pointing the same way score 1, perpendicular scores 0, opposite scores −1. It ignores how *long* the vectors are and asks only *which direction* they point — which turns out to track meaning better in high dimensions.",
        "This is the exact number behind semantic search and **RAG** (Stage 4): embed your question, embed every document, and return the ones whose vectors point most nearly the same way.",
      ],
      bridgeLabel: "NEXT: TRANSFORMERS & ATTENTION",
      bridgeBody: "You just saw **the model** as a single black box between the vectors and the answer. The next lesson opens that box: **attention**, how tokens look at each other so “bank” by a river and “bank” with your money stop sharing one vector — and settle what they mean *here*.",
      words: {},
    },
    attn: {
      crumb: "STAGE 1 · FOUNDATIONS · LESSON 08",
      title: "Transformers & attention",
      lede: "Embeddings gave every token *one* fixed vector. But “bank” by a river and “bank” with your money can't mean the same thing. **Attention** is the fix: each token updates itself by **looking at the others** — and the whole context decides what it means *here*.",
      prev: "Embeddings",
      next: "How training works",
      heroLabel: "ONE WORD CHANGES WHERE “IT” LOOKS",
      heroToggleLabel: "flip the last word",
      heroWordTired: "tired",
      heroWordWide: "wide",
      heroReadTired: "“it” looks back at **the animal** — because animals get *tired*. So **it = the animal**.",
      heroReadWide: "One word changed, and “it” now looks at **the street** — because streets are *wide*. So **it = the street**.",
      heroCaption: "Nothing else in the sentence moved. The model *re-reads* “it” by weighing every other word — that weighing is **attention**.",
      concept: [
        "Here's the problem. After the last lesson, “it” has exactly one embedding — the same numbers every time. But in *“…because it was tired,”* “it” means the **animal**; swap in *“wide”* and “it” means the **street**. A fixed vector can't be both.",
        "**Attention** solves it: before deciding anything, every token gets to **look at the other tokens** and pull in what's relevant, mixing their meaning into its own. “It” becomes a blend that's mostly *animal* — or mostly *street* — depending on the company it keeps.",
        "The engineer's picture: a **soft dictionary lookup**. Each token asks a question (a **query**), every token advertises a label (a **key**), and the closer a key matches the query, the more of that token's **value** you take. Not one exact hit — a *weighted blend* of all of them.",
      ],
      lensLabel: "TRY IT · THE ATTENTION LENS",
      lensTitle: "Tap a word — see what it looks at",
      lensBody: "Tap any word to make it the one doing the looking. The **arcs** and the highlight show how much it attends to each other word. Then switch **heads** below: a transformer runs many attention patterns at once, and each one learns a different job.",
      lensHint: "Tap a word:",
      lensHeadLabel: "attention head — each learns a different job",
      heads: {
        reference: { name: "reference", desc: "links a word to what it refers to — watch “it” reach back to “animal.”" },
        previous: { name: "previous word", desc: "each word looks one step back — a real, common pattern models grow on their own." },
        syntax: { name: "verb → its words", desc: "a verb reaches for its subject and object — “cross” pulls on “animal” and “street.”" },
      },
      lensRead: "In this head, **{q}** attends most to **{k}**.",
      lensNote: "The affinities here are *illustrative* — picked so each head's job is easy to see. But turning them into weights (**softmax**, so they sum to 1) and blending the tokens is exactly what a real transformer does. A real model stacks dozens of heads across dozens of layers.",
      qkvConcept: [
        "So how does a word actually *look*? Through three little vectors it makes from its own embedding: a **query** (what am I looking for?), a **key** (what do I offer?), and a **value** (what I'll hand over if you pick me).",
        "Match every **query** against every **key** with a dot product → **softmax** into weights that sum to 1 → take that **weighted blend of the values**. That blend is the token's new, context-aware meaning. Below, steer “bank”'s query by hand and watch its meaning slide.",
      ],
      qkvLabel: "TRY IT · QUERY · KEY · VALUE",
      qkvTitle: "“bank” finds its meaning",
      qkvBody: "“bank” sits between two neighbourhoods on the meaning map — riverside and finance. Drag the slider to steer its **query**. It scores each context word (query · key), **softmax** turns those into weights, and “bank” becomes the **weighted blend** of their values — sliding to whichever it listens to.",
      qkvSliderLabel: "steer bank's query",
      qkvSliderLeft: "look for river",
      qkvSliderRight: "look for money",
      qkvPresetRiver: "“by the river”",
      qkvPresetMixed: "ambiguous",
      qkvPresetMoney: "“at the money”",
      qkvRiver: "river",
      qkvMoney: "money",
      qkvBank: "bank",
      qkvWeightLabel: "attention weights (sum to 1)",
      qkvMeaningLabel: "bank's meaning, now",
      qkvRead: "“bank” is listening mostly to **{w}** — so that's what it means here.",
      qkvNote: "The keys and values are illustrative points, but the steps — dot product, softmax, weighted sum — are the real thing. In a trained model you don't steer the query: it's computed from the word's own embedding, so the *sentence* does this steering automatically.",
      explainQ: "The embedding of “bank” is a single fixed vector. So how can the model tell riverside “bank” from money “bank”?",
      explainA: "It doesn't rely on the embedding alone. Attention lets “bank” form a query and compare it (dot product) against every other word's key; a softmax turns those scores into weights, and “bank” takes a weighted blend of the other words' value vectors. Next to “river,” it blends in river; next to “money,” it blends in money. The fixed embedding is only the starting point — the surrounding words reshape it into a meaning that fits *this* sentence.",
      deeperTitle: "The one formula: softmax(QKᵀ / √d) · V",
      deeperBody: [
        "Stack every token's query into a matrix **Q**, every key into **K**, every value into **V**. Then all of attention is **softmax(QKᵀ / √d) · V**. `QKᵀ` is every query dotted with every key (all the affinities at once); `√d` just keeps the numbers from blowing up in high dimensions; **softmax** makes each row of weights sum to 1; multiplying by **V** takes the weighted blend. That's the entire mechanism — one matrix multiply, a normalize, another matrix multiply.",
        "**Multi-head:** run several of these in parallel with different learned Q/K/V, each free to track a different relationship (the heads you toggled), then concatenate. **Self-attention** is when Q, K, and V all come from the same sequence — a sentence reading itself.",
      ],
      maskTitle: "Why it scales — and the one twist for chat models",
      maskBody: [
        "The older approach read a sentence word-by-word, so word 50 was far from word 1. Attention connects **every token to every other in a single step** — long-range links are as cheap as short ones — and every one of those comparisons happens **in parallel** on the GPU. That parallelism is exactly why transformers could be trained on the whole internet, and why they took over.",
        "One twist for models that *generate* text: while predicting the next word they're only allowed to look **backward**, never at words that haven't been written yet (a **causal mask**). And since attention has no built-in sense of order, each token also gets a **positional** signal so “dog bites man” and “man bites dog” aren't the same soup.",
      ],
      bridgeLabel: "NEXT: HOW TRAINING WORKS",
      bridgeBody: "You've now seen the whole machine — tokens, embeddings, attention. But every weight in it started as a **random number**. The next lesson is the engine that tuned them: **loss, gradients, and backpropagation** — how trillions of guesses slowly turn noise into a model that knows things.",
    },
    webScale: webScaleEN,
    domains: domainsEN,
    dedup: dedupEN,
    recipe: recipeEN,
    distill: distillEN,
    dataPipeline: dataPipelineEN,
    dataPipelineDeep: dataPipelineDeepEN,
    backbone: backboneEN,
    qualityFiltering: qualityFilteringEN,
    tokenDictionary: tokenDictionaryEN,
    embeddingMatrix: embeddingMatrixEN,
    transformerBlock: transformerBlockEN,
    nextToken: nextTokenEN,
    autoregressiveLoop: autoregressiveLoopEN,
    howModelsLearn: howModelsLearnEN,
    baseVsAssistant: baseVsAssistantEN,
    whyAlignment: whyAlignmentEN,
    prefillVsDecode: prefillVsDecodeEN,
    classifierScoring: classifierScoringEN,
    multiTurnFormatting: multiTurnFormattingEN,
    feedForward: feedForwardEN,
    extractionParsing: extractionParsingEN,
    safetyFiltering: safetyFilteringEN,
    positionalEncoding: positionalEncodingEN,
    specialTokens: specialTokensEN,
    attentionMechanism: attentionMechanismEN,
    samplingStrategies: samplingStrategiesEN,
    piiScrubbing: piiScrubbingEN,
    binPacking: binPackingEN,
    ropeMath: ropeMathEN,
    constrainedDecoding: constrainedDecodingEN,
    reasoningTokens: reasoningTokensEN,
    backpropagation: backpropagationEN,
    supervisedFineTuning: supervisedFineTuningEN,
    rewardModeling: rewardModelingEN,
    flashAttention: flashAttentionEN,
    testTimeSearch: testTimeSearchEN,
    mixedPrecision: mixedPrecisionEN,
    matrixOptimizers: matrixOptimizersEN,
    parameterEfficientFinetuning: parameterEfficientFinetuningEN,
    ppo: ppoEN,
    grpo: grpoEN,
    verifiableRewards: verifiableRewardsEN,
    kvCacheSystems: kvCacheSystemsEN,
    quantization: quantizationEN,
    speculativeDecoding: speculativeDecodingEN,
    kvCache: kvCacheEN,
    syntheticData: syntheticDataEN,
    optimizers: optimizersEN,
    preferenceOptimization: preferenceOptimizationEN,
    longContext: longContextEN,
    mixtureOfExperts: mixtureOfExpertsEN,
    toolCalling: toolCallingEN,
    distributedTraining: distributedTrainingEN,
    stage1List: [
      "The life of an LLM",
      "Tokens",
      "Data",
      "Bias",
      "Neural networks",
      "GPU or CPU?",
      "Embeddings",
      "Transformers",
      "How training works",
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
    stage1Label: "ETAPA 1 · 10 LECCIONES",
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
      { title: "Fundamentos", desc: "Cómo funciona la IA por dentro: tokens, entrenamiento, embeddings, atención.", lessons: 10, pct: 25 },
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
        "Lo sorprendente: **la calidad gana a la cantidad.** Un corpus más pequeño y bien filtrado entrena un mejor modelo que uno más grande y sucio — así que gran parte de lo recolectado se descarta a propósito. **Los duplicados caen primero**: el texto repetido empuja al modelo a *memorizar y regurgitar* en vez de generalizar, y malgasta entrenamiento en las mismas palabras dos veces.",
        "Y lo que queda no es un solo montón sino una **mezcla** — una receta ponderada de web, código, libros, matemáticas y muchos idiomas, con unas fuentes sobremuestreadas y otras submuestreadas. El recorte también tiene su costo: **filtra demasiado fuerte y te llevas la diversidad real** junto con la basura.",
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
      scoreAsideLabel: "CÓMO FUNCIONA LA PUNTUACIÓN",
      scoreAsideBody: "Ese número de “calidad” no es objetivo. Es un **clasificador** entrenado para distinguir un **corpus de referencia** (Wikipedia, libros) de la web en crudo. Corre **por documento**, **antes de tokenizar**: las características del doc se vuelven un vector `x`, unos pesos aprendidos `w` lo puntúan como `≈ w · x`, y ese único número decide si el documento *entero* entra o sale. Así que nunca es una propiedad de los tokens sueltos — por eso no lo verás dentro de la cinta. Los docs de baja calidad se descartan aquí arriba y sencillamente nunca llegan a ser tokens.",
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
      tapeBridge: "Esta cinta es la salida del Interactivo A. Cada documento que sobrevivió a la limpieza se **tokenizó**, y sus IDs se **pusieron uno tras otro** — todos los supervivientes **concatenados** en una sola línea plana, con un **token separador de documento** entre ellos (las celdas más oscuras). Los docs que descartaste aportan **cero celdas**; sencillamente no están aquí. Cada cuadro de abajo es un token de esa cinta.",
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
      cutoffBody: "Y como se escribe una sola vez, la cinta es una **instantánea** — congelada en el momento del rastreo. Los datos son el mundo del modelo, así que el mundo del modelo *termina donde termina la cinta*: no sabe nada de lo que pasó después. Ese borde congelado es su **fecha de corte de conocimiento**.",
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
    neural: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 5",
      title: "Redes neuronales",
      lede: "La versión de una frase: **un LLM es una red neuronal.** Una gigante. Convierte tus tokens en una conjetura del siguiente token — y está hecha repitiendo una parte diminuta. Sin matemáticas previas; construiremos esa parte desde cero.",
      prev: "Sesgo",
      next: "¿GPU o CPU?",
      heroPromptLabel: "TU PROMPT",
      heroPromptText: "I want a hot dog to",
      heroTokensLabel: "TOKENS",
      heroNetLabel: "UNA RED NEURONAL",
      heroNetSub: "capas de neuronas — millones de ellas",
      heroNextLabel: "SIGUIENTE TOKEN",
      heroPredict: "eat",
      heroAlt1: "pet",
      heroAlt2: "buy",
      heroStepTokenize: "se vuelven números (lección anterior)",
      heroStepFlow: "fluyen por la red",
      heroStepPredict: "sale una predicción",
      heroCaption: "Eso es un LLM, de principio a fin: tu texto se vuelve tokens, los tokens fluyen por una **red neuronal**, y sale una conjetura del siguiente token. Toda esta lección hace zoom en esa caja del medio — porque es solo una unidad diminuta, la **neurona**, repetida millones de veces. Construyamos una.",
      concept: [
        "Mira otra vez esa caja del medio. No es más que un montón enorme de números — los **pesos** — y esos números tienen un nombre que has visto en cada modelo: **parámetros**. Cuando un modelo se llama **Gemma 3 12B**, son **12 mil millones** de ellos; **Llama 3 70B** tiene setenta mil millones. Ese número *es* el modelo — todo lo que “sabe” son esos miles de millones de números, dispuestos en capas. Así que la pregunta real es simple: **¿qué es uno de estos números y qué hace?** Hagamos zoom hasta el fondo — hasta uno solo.",
        "Ya has escrito esta función: `score = w1*a + w2*b + sesgo`. Una suma ponderada — unas entradas, cada una escalada por cuánto importa, más una constante. Una **neurona** es justo eso, con un paso extra al final: **aplasta** el resultado a una respuesta entre 0 y 1, como una probabilidad.",
        "Los números `w1, w2, sesgo` son los **pesos** de la neurona — tres de los miles de millones de parámetros del modelo. Peso más grande = esa entrada importa más; un peso **negativo** significa que la entrada vota al *otro* lado. Cambia los pesos y cambias lo que la función decide. Nadie los teclea — se **aprenden** de los datos (esa es la próxima lección). Aquí los pondrás tú, para ver qué hacen.",
      ],
      psAnatomyLabel: "LA ANATOMÍA",
      psTitle: "Un parámetro es un peso sobre una conexión",
      psBody: "Aquí tienes una red diminuta — cuatro **capas** de **neuronas**, cableadas entre sí. Cada **línea es un peso**, y los pesos son los **parámetros**. **Haz clic en cualquier neurona** para encender exactamente qué pesos la alimentan, y la pequeña fórmula que computa: `activation(w₁·a₁ + w₂·a₂ + … + b)`. Sus parámetros son esos pesos entrantes, más un sesgo — así que los parámetros viven en los **cables**, no en las neuronas.",
      psLegend: "Cada columna es una capa · cada círculo una neurona · cada línea un peso (un parámetro).",
      psFormulaLead: "La neurona resaltada computa:",
      psTotalNote: "Cuéntalos: **65 pesos + 14 sesgos = 79 parámetros** en toda esta pequeña red. Un modelo real lleva la misma cuenta a los miles de millones.",
      psLabel: "PRUÉBALO · DE DÓNDE SALEN LOS MILES DE MILLONES",
      psCalcTitle: "Ahora escálalo — un modelo de 70B en capas y neuronas",
      psCalcBody: "Las mismas partes, solo que más. Una sola neurona tiene apenas unos miles de pesos — pero **ensancha** cada capa y **apila** más, y el total explota. Arrastra las dos perillas, o salta directo al tamaño de un modelo real.",
      psWidthLabel: "ANCHO · neuronas por capa",
      psDepthLabel: "PROFUNDIDAD · capas",
      psNeuronsLabel: "NEURONAS",
      psParamsLabel: "PARÁMETROS",
      psConnNote: "Cada línea es un peso — un parámetro. Una capa de *ancho* neuronas, cada una alimentada por *ancho* neuronas antes, tiene **ancho² conexiones**. Suma eso por cada capa y el total llega a los miles de millones — de las conexiones, no de las celdas.",
      psPresets: [
        { label: "≈ 85M", note: "Un modelo pequeño — tamaño GPT-2. Incluso una red de solo 768 neuronas de ancho y 12 capas ya lleva ~85 **millones** de parámetros." },
        { label: "≈ 12B", note: "Ensancha a 4.096 y profundiza a 60 capas y la cuenta salta a ~12 **mil millones** — territorio **Gemma 3 12B**. Aunque son solo ~1 millón de neuronas." },
        { label: "≈ 70B", note: "Duplica el ancho otra vez a 8.192 y llegas a ~70 **mil millones** — un modelo clase **Llama 3 70B**. Fíjate: duplicar el ancho **cuadruplica** los parámetros." },
      ],
      psTwoDials: "Así que el tamaño de un modelo se mide en **parámetros** — la huella de memoria y cómputo — y lo fijan solo **dos perillas**: **ancho** (neuronas por capa) y **profundidad** (capas). Ensancha la red y los parámetros crecen con el **cuadrado** del ancho; esa cuadrática es de donde salen “12B”, “70B” y más. Solo unos pocos millones de neuronas — pero miles de millones de conexiones entre ellas.",
      naLabel: "PRUÉBALO · UNA NEURONA",
      naTitle: "Una neurona decidiendo: ¿spam o no?",
      naBody: "Aquí tienes una sola neurona montada como un filtro de spam diminuto. Lee dos cosas de un correo, pondera cada una, las suma, y aplasta el total a “cuán spam, 0–100%”. Arrastra las entradas — o los pesos de la neurona — y **mira cada número actualizarse en vivo**.",
      naScenarioLabel: "EL CORREO",
      naInput1: "Enlaces sospechosos",
      naInput2: "Remitente conocido",
      naInput1Lo: "ninguno",
      naInput1Hi: "muchos",
      naInput2Lo: "desconocido",
      naInput2Hi: "contacto cercano",
      naDialsLabel: "LOS PESOS DE LA NEURONA",
      naDialsHint: "Cuánto importa cada entrada, y hacia qué lado vota. Estas son las perillas que ajusta el entrenamiento.",
      naComputeLabel: "LO QUE COMPUTA LA NEURONA",
      naSumLabel: "suma ponderada",
      naSquashLabel: "aplastar a 0–1",
      naSquashHelp: "**σ es la sigmoide.** Su única tarea es aplastar esa suma ponderada cruda — que puede ir de −∞ a +∞ — en un puntaje limpio de **0 a 1** que se lee como una probabilidad. Una suma muy positiva cae cerca de **1**, una muy negativa cerca de **0**, y una suma alrededor de cero queda cerca de **0.5**. La fórmula: `σ(z) = 1 / (1 + e^(−z))`.",
      naOutputLabel: "PUNTAJE DE SPAM",
      naHam: "No es spam",
      naSpam: "Spam",
      naVerdictSpam: "→ marcado como spam",
      naVerdictHam: "→ entregado a la bandeja",
      naPresets: [
        { label: "Spam obvio", note: "Muchos enlaces, un total desconocido. Ambas entradas empujan fuerte hacia arriba — el puntaje se clava cerca del 100%. Fácil." },
        { label: "Correo de mamá", note: "Un remitente conocido, casi sin enlaces. El peso **negativo** de “remitente conocido” arrastra el puntaje hacia abajo y lo veta — entregado." },
        { label: "En el límite", note: "Justo en la raya, cerca del 50%. Un empujoncito a cualquier entrada voltea el veredicto — esa frontera es donde la neurona está menos segura." },
      ],
      naNote: "Esta es una neurona real — la misma aritmética corre, sin cambios, miles de millones de veces dentro de un modelo grande. Lo único que escala es el número de neuronas y de entradas.",
      dpLabel: "PRUÉBALO · NEURONA 3 — EL DETECTOR DE “HOT + DOG”",
      dpTitle: "Una neurona es un producto punto",
      dpBody: "El modelo lee *“I'm hungry, I want a hot dog”* y debe decidir la intención: **EAT** (comer) o **PET** (acariciar). Primero, una neurona busca la frase. Una neurona es puro álgebra de vectores: su entrada es un **vector x** — qué palabras están presentes — y sus parámetros son un **vector de pesos w** de la **misma longitud**. La neurona devuelve su **producto punto** `w · x` = ∑ᵢ wᵢxᵢ: multiplica los dos vectores componente por componente y suma. Esta, la **Neurona 3**, tiene pesos altos en *hot* y *dog*, así que solo se dispara cuando aparecen ambos. Elige una frase.",
      dpQuestionLead: "DOS VECTORES DE LA MISMA LONGITUD → UN NÚMERO",
      dpQuestion: "¿Esta frase dice «hot dog»?",
      dpCandidates: "w = los pesos de la neurona · x = las palabras de la frase",
      dpLedgerLegend: "**w** y **x** son ambos vectores de longitud 4. Multiplícalos **componente por componente** — wᵢ · xᵢ — y suma la fila. Ese único número es el **producto punto** `w · x`.",
      dpFeatures: ["hot", "dog", "cold", "cute"],
      dpRowTaste: "w  (pesos)",
      dpRowMovie: "x  (entradas)",
      dpRowProduct: "wᵢ · xᵢ",
      dpSumLabel: "w · x",
      dpSquashLead: "LUEGO LA NEURONA APLASTA:  σ(w · x + b)",
      dpSquashNote: "Una neurona no se detiene en el producto punto. Suma un **sesgo** y pasa el total por **σ (la sigmoide)** — aplastando cualquier número en una **activación de 0–1**. Con un sesgo de **−2.5**, solo una coincidencia completa *hot + dog* (w·x = 3.5 → σ ≈ 0.73) supera el **50%**; coincidencias a medias como *“muy caliente”* quedan bien por debajo. `σ(z) = 1 / (1 + e⁻ᶻ)`.",
      dpMatrixHint: "Toca un **componente** para inspeccionar su término: wᵢ × xᵢ.",
      dpScoreLabel: "PUNTAJE DE FUSIÓN  w · x",
      dpKeep: "sí — “hot dog”",
      dpDrop: "no — no es la frase",
      dpParamNote: "Esa es toda la neurona: un **vector de pesos** por producto punto con un **vector de entrada** — un multiplica-y-suma por componente. Los modelos reales usan vectores de miles de componentes, pero la operación es idéntica. Sin embargo, por sí sola la Neurona 3 solo sabe que se dijeron las palabras *hot* y *dog*. **No tiene idea** de si eso es un bocado o un perrito acalorado — eso lo hace la red de abajo.",
      dpPresets: [
        { label: "“I want a hot dog”", note: "**hot** (x₁=1) y **dog** (x₂=1) están presentes, cada uno con peso **+1.75**, así que sus productos se acumulan a **w·x = +3.5** — una señal fuerte de que se dijo la **frase** “hot dog.”" },
        { label: "“the soup is too hot”", note: "Solo **hot** se dispara (x₁=1); **dog** es 0, así que su peso +1.75 se multiplica por nada. Puntaje **+1.75** — la mitad. La frase no está." },
        { label: "“look at that cute dog”", note: "**dog** está presente (x₂=1), pero también **cute** (x₄=1, peso −1.0) y no hay **hot**. Puntaje **+0.75** — débil. No es la frase “hot dog.”" },
      ],
      dpWhy: "Ese único número es lo que *es* una neurona: un **producto punto de dos vectores**. Pero `w·x = +3.5` es ambiguo — ¿el *hot dog* comida, o un *perro* que tiene *calor*? Una sola neurona no lo sabe. Resolverlo requiere una **red** que lea este puntaje junto con otras señales. Eso es lo que sigue.",
      midConcept: [
        "Esa es la Neurona 3 — un solo **producto punto**, `w · x`. Encontró la frase “hot dog,” con puntaje **+3.5**. Pero un puntaje no distingue un **bocado** de un **perrito acalorado** — las mismas palabras, dos significados. Resolver eso requiere contexto, y leer contexto requiere más neuronas **combinadas**.",
        "Así que **apilamos** neuronas en **capas**. La Neurona 3 pasa a ser una de **tres entradas**; una **capa oculta** de compuertas de contexto la pesa contra *hambre* y *palabras de mascota*; y una **capa de salida** elige la intención — `f(g(x))`, funciones dentro de funciones. El aplastado de cada neurona permite que una capa posterior lea *combinaciones*, no solo sumas. Aquí está la red completa.",
      ],
      nwLabel: "PRUÉBALO · LA RED DE 7 NEURONAS",
      nwTitle: "La red predice la siguiente palabra",
      nwBody: "La misma tarea del inicio: predecir la siguiente palabra — aquí, **eat** o **pet**. La red completa es **3 → 2 → 2**. Tres **neuronas de entrada** leen la frase: **Hambre**, **Palabras de mascota** y **Hot+Dog** (la Neurona 3, de arriba). Dos **compuertas ocultas** las combinan: una **compuerta Eat** (se enciende con hambre *y* la frase hot dog) y una **compuerta Pet** (se enciende con palabras de mascota, pero el hambre la apaga). Dos **neuronas de salida** — **EAT** y **PET** — leen las compuertas, y la más fuerte es la predicción. Sigue la señal de izquierda a derecha, y toca cualquier cable para leer su peso.",
      nwInputLabel: "ENTRADAS · tres neuronas",
      nwHiddenLabel: "OCULTA · compuertas de contexto",
      nwOutputLabel: "SIGUIENTE PALABRA · eat o pet",
      nwFeatures: ["Hambre", "Mascota", "Hot+Dog"],
      nwConcepts: ["Eat gate", "Pet gate"],
      nwWords: ["EAT", "PET"],
      nwActionWord: "salida",
      nwSentence: "I'm hungry, I want a hot dog to",
      nwPromptTail: "→ ¿la siguiente palabra?",
      nwVocabLead: "AHORA ESCALA LA CAPA DE SALIDA",
      nwVocabCount: "~200.000 tokens",
      nwFiresTag: "se enciende",
      nwQuietTag: "callada",
      nwWinnerTag: "elegida",
      nwInspectHint: "Toca cualquier **neurona** o **cable** para leer el peso que lleva — los parámetros, en vivo.",
      nwParamNote: "Solo **14 parámetros**, y el truco es el **gran peso negativo de la compuerta Pet sobre el Hambre**: aunque *hot* + *dog* se enciendan, un contexto de hambre aplasta “pet” y la predicción va a **EAT**. Ninguna neurona sola hizo eso — lo hizo la *combinación*.",
      nwPresets: [
        { label: "“I want a hot dog”", note: "El hambre es alta (**2.0**) y Hot+Dog se enciende (**3.5**). La **compuerta Eat** se ilumina, la **compuerta Pet** queda a oscuras — el peso negativo del hambre la ahoga — y la predicción va a **EAT** (~95%). “Hot dog” = comida." },
        { label: "“let me pet that cute dog”", note: "Nada de hambre, muchas **palabras de mascota** (3.0). La **compuerta Pet** arde, Eat queda callada, y la predicción es **PET** (~97%). El mismo detector, otro contexto." },
        { label: "“the dog is panting in the hot sun”", note: "Aquí está la magia: *hot* + *dog* aparecen, así que **la Neurona 3 igual se enciende +3.5** — cree “¡hot dog!” Pero no hay **hambre** y el contexto animal es fuerte, así que la red lo **anula**: **PET** (~80%). El contexto le ganó a la frase." },
      ],
      nwWhy: "Ese es todo el punto de la profundidad: una neurona *encontró* la frase, pero la **red decidió qué significaba** pesándola contra el contexto — y eso es un modelo de lenguaje en miniatura. Aquí dimos solo **2 salidas**, EAT o PET. La capa de salida de un LLM real tiene **una neurona por cada token de su vocabulario — unos 200.000** — así que emite un **vector de 200.000 de largo**: un puntaje para *cada posible token siguiente*. El softmax lo convierte en una probabilidad para cada uno, y el modelo muestrea de ahí el siguiente token. Todo lo demás es idéntico — productos punto y aplastados, solo que con miles de entradas y docenas de capas mucho más anchas.",
      weightWord: "peso",
      biasWord: "sesgo",
      closeConcept: "Algo quedó oculto toda la lección: **cada peso de aquí, tendrías que ponerlo a mano.** Un modelo real tiene miles de millones, y nadie teclea ni uno — se *aprenden* de los datos. De dónde salen los pesos es la única pregunta que queda. Eso es el **entrenamiento** — a continuación.",
      explainQ: "Construyes una red con una capa oculta pero dejas fuera la no linealidad — cada neurona solo pasa su suma ponderada tal cual. ¿Por qué sigue pudiendo trazar solo una frontera recta?",
      explainA: "Porque una pila de pasos lineales sigue siendo lineal. Multiplicar por pesos y sumar un sesgo es una operación lineal, y componer operaciones lineales solo te da una operación lineal más grande — matemáticamente idéntica a una sola capa. Y una función lineal solo puede cortar el espacio con una recta (o un plano en más dimensiones). La no linealidad entre capas es lo que rompe ese colapso: remodela el espacio antes de que actúe la siguiente capa, así la composición puede curvarse. Sin no linealidad, no hay curvas — por más capas que apiles.",
      deeperTitle: "Ve más a fondo: la forma matricial, las activaciones y la “aproximación universal”",
      deeperBody: "En forma matricial, una capa es `h = act(W·x + b)` — una multiplicación de matrices, una suma de sesgo y una no linealidad elemento a elemento; una red solo encadena estas. Activaciones comunes: **tanh** (usada aquí), **ReLU** (`max(0, z)`, el caballo de batalla de los modelos grandes) y **sigmoide** a la salida para una probabilidad. El *teorema de aproximación universal* dice que una red con una sola capa oculta y suficientes neuronas puede aproximar casi cualquier función — así que la capacidad bruta nunca fue lo difícil. Lo difícil es **encontrar los pesos**, y eso es justo lo que hace el entrenamiento (próxima lección). Todo lo que un modelo grande “sabe” son miles de millones de estos mismos pesos.",
      sizeDeeperTitle: "Ve más a fondo: ¿de qué tamaño debería ser un modelo?",
      sizeDeeperBody: [
        "Recuerda que el “tamaño” son en realidad dos perillas — **ancho × profundidad** — y fijan la cuenta de parámetros (`params ≈ 12 × capas × d_model²`). Ese cuadrado es por qué un modelo tiene solo unos *millones* de neuronas pero *miles de millones* de parámetros: la cuenta vive en las **conexiones, no en las celdas**.",
        "Pero no eliges el tamaño libremente. Partes de un **presupuesto de cómputo**: el costo de entrenamiento es aproximadamente `FLOPs ≈ 6 × params × tokens`. Las **leyes de escalado** (Chinchilla) dicen cómo gastarlo — para un presupuesto dado hay un balance *óptimo en cómputo* entre tamaño y datos, famoso por rondar los **~20 tokens por parámetro**. Un modelo más grande necesita proporcionalmente más datos, no solo más pesos.",
        "Repartir ese total entre **profundidad y ancho** es más heurístico que el total mismo. Hay una **proporción** conocida que funciona: demasiado profundo-y-delgado entrena lento e inestable; demasiado ancho-y-plano desperdicia capacidad. Los laboratorios ajustan la proporción en modelos pequeños, extrapolan, y redondean los anchos a tamaños que las GPUs corren con eficiencia.",
        "Un giro: los laboratorios a menudo **sobre-entrenan** a propósito un modelo *más pequeño* — dándole muchos más tokens que lo “óptimo” — porque un modelo más pequeño es **más barato de servir** durante años. El costo de inferencia, no solo el de entrenamiento, empuja el tamaño final hacia abajo.",
        "Y con un presupuesto cada vez mayor, el límite real deja de ser el cómputo y pasa a ser los **datos**. El texto de calidad es finito; pasado un punto chocas con el **muro de datos** (el corpus que limpiaste en la lección de Datos solo llega hasta cierto punto). La historia completa de las leyes de escalado llega en **Preentrenamiento → alineación** — esto es solo la intuición.",
      ],
      interpDeeperTitle: "Ve más a fondo: ¿qué significa realmente una neurona?",
      interpDeeperBody: [
        "Pregunta tentadora: ¿la neurona #4.127 *significa* algo — “detecta gatos”? La respuesta honesta suele ser **no**. Una sola neurona en medio de una red rara vez tiene un significado limpio, por dos razones.",
        "**Polisemanticidad**: una neurona se enciende para muchas cosas *no relacionadas* a la vez. Y **superposición**: un modelo empaca **más características que neuronas** en direcciones que se solapan. Se sale con la suya porque las características reales son **dispersas** — solo unas pocas están activas a la vez — así que rara vez chocan.",
        "Así que el replanteo es: **el significado vive en direcciones, no en neuronas.** Las neuronas son solo los *ejes* del espacio; las características reales son *diagonales* a través de muchas. (Es la misma idea que verás en **Embeddings** — el significado es una dirección en un espacio vectorial.)",
        "Aunque ya no es una caja negra pura. Los **autoencoders dispersos** pueden extraer características interpretables por humanos — una célebre es una característica del “**puente Golden Gate**” — y **fijarla** al máximo dirige visiblemente el comportamiento del modelo. Así que ahora podemos *leer*, e incluso *empujar*, una fracción creciente de lo que un modelo representa — a nivel de **característica**, no de neurona.",
        "Muy a grandes rasgos, las características se vuelven más abstractas con la profundidad: las capas **tempranas** tiran a lo superficial y sintáctico, las **medias** a lo abstracto y semántico, las **tardías** a dirigir el siguiente token. Tómalo como una narrativa, no como un mapa.",
        "Gran advertencia: la interpretabilidad es **temprana e incompleta** — nadie tiene un mapa etiquetado completo de un modelo grande, y es fácil exagerar. Pero convierte “¿qué significa una neurona?” en “¿qué significa una *dirección*?” — lo que conecta hacia adelante con **Embeddings** (el significado como dirección) y hacia atrás con **Sesgo**, donde esas inclinaciones de asociación son literalmente geometría en este mismo espacio.",
      ],
      bridgeLabel: "SIGUIENTE: ¿GPU O CPU?",
      bridgeBody: "Construiste esta red a base de productos punto. Cada uno es una multiplicación y una suma — y un modelo real corre *miles de millones* por token. Esa montaña de aritmética es la razón por la que la IA corre en **GPUs**, conectadas por miles. Ahora: mira la red correr en hardware real.",
    },
    hw: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 06",
      title: "¿GPU o CPU?",
      lede: "Construiste una red a base de productos punto. Ahora mírala *correr*. Esa misma matemática — una montaña de multiplicaciones y sumas — es la razón por la que la IA se construye sobre **GPUs**, conectadas por miles.",
      prev: "Redes neuronales",
      next: "Embeddings",
      heroLabel: "PROCESANDO UNA RED NEURONAL",
      heroSub: "capa por capa — la misma red, dos máquinas",
      heroCpu: "CPU",
      heroGpu: "GPU",
      heroCpuTag: "una neurona a la vez",
      heroGpuTag: "una capa entera a la vez",
      heroCaption: "Cada neurona de una capa es independiente — así que la GPU las calcula todas a la vez, mientras la CPU las recorre una por una.",
      concept: [
        "Recuerda la neurona de la lección pasada: una salida es `w · x` — multiplica cada peso por cada entrada y suma. Una **capa** son muchas neuronas haciendo eso lado a lado. Para correr la red calculas la capa 1, la alimentas a la capa 2, luego la capa 3 — una pila de estos pasos.",
        "Y aquí está la clave: *dentro* de una capa, cada neurona es **independiente** — ninguna necesita la respuesta de otra, así que pueden calcularse todas al mismo tiempo. Solo las capas dependen entre sí, en orden.",
        "Una **CPU** tiene un puñado de núcleos grandes e inteligentes; calcula sobre todo una neurona, luego la siguiente, luego la siguiente. Una **GPU** tiene *miles* de núcleos pequeños, así que calcula las neuronas de una capa entera **a la vez**. La misma matemática — velocidad radicalmente distinta.",
      ],
      raceLabel: "PRUÉBALO · CORRE LA RED",
      raceTitle: "Míralo procesar, capa por capa",
      raceBody: "La misma red corre en ambas máquinas. Presiona correr y observa: la **GPU** enciende una capa entera de golpe; la **CPU** avanza neurona por neurona. Agrega neuronas y la brecha explota.",
      raceSizeLabel: "Neuronas por capa",
      raceRun: "Correr la red",
      raceReset: "Reiniciar",
      raceCpuName: "CPU",
      raceGpuName: "GPU",
      raceCpuCores: "una neurona por paso",
      raceGpuCores: "una capa por paso",
      raceStepsLabel: "pasos",
      raceCellNote: "cada neurona = un producto punto w · x sobre la capa anterior",
      raceSpeedupLabel: "la GPU termina antes por",
      raceWinnerNote: "La GPU calcula una capa entera de **un solo golpe**, porque sus neuronas no dependen entre sí. Aun así espera a cada capa antes de la siguiente — la capa 2 necesita las respuestas de la capa 1. La **CPU** no tiene ese atajo: recorre cada neurona, una por una. Ensancha las capas y su barra se sale del borde.",
      raceNote: "Este juguete tiene unas pocas docenas de neuronas. Un modelo real tiene *miles de millones* de parámetros y cientos de capas — por eso una CPU tardaría *meses* en lo que un clúster de GPUs hace en días.",
      raceParamsLabel: "parámetros",
      raceNeuronsLabel: "neuronas",
      raceNeuronWord: "neurona",
      raceLayerWord: "capa",
      raceDoneWord: "listo",
      raceReadyWord: "listo para correr",
      raceDotLabel: "Cada neurona calcula un **producto punto**:",
      raceCpuChip: "unos pocos núcleos",
      raceGpuChip: "miles de núcleos",
      raceCoresWord: "núcleos",
      raceAtOnce: "a la vez",
      raceOneAtATime: "1 a la vez",
      raceCompleteWord: "Completado",
      midConcept: [
        "Así que la GPU es la herramienta correcta. Pero una sola GPU no alcanza. Cada una tiene una cantidad fija de memoria rápida — digamos **80 GB** — y los pesos de un modelo de frontera pesan *cientos* de gigabytes. El modelo sencillamente no cabe.",
        "Por eso conectamos muchas GPUs. Ocho GPUs comparten una placa como un **nodo**, unidas por el ultrarrápido **NVLink**. Muchos nodos llenan un **rack**, unidos por la red **InfiniBand**. Las GPUs intercambian resultados a medio terminar sin parar — así que qué tan rápidos son esos cables importa tanto como las GPUs mismas.",
      ],
      rackLabel: "PRUÉBALO · DENTRO DE UN RACK",
      rackTitle: "Los cables entre las GPUs",
      rackBody: "Las GPUs del mismo **nodo** hablan por NVLink — velocísimo. Las GPUs en nodos distintos cruzan la red **InfiniBand** — mucho más lenta. Envía un tensor y mira por dónde tiene que viajar.",
      rackHint: "Envía un tensor entre dos GPUs:",
      rackPaths: ["Mismo nodo", "Entre nodos", "Entre racks"],
      rackLinkLabel: "ENLACE",
      rackBwLabel: "ANCHO DE BANDA",
      rackTimeLabel: "TIEMPO RELATIVO",
      rackHopsLabel: "SALTOS",
      rackNodeWord: "nodo",
      rackRackWord: "rack",
      rackGpuWord: "GPU",
      rackNvlink: "NVLink",
      rackInfiniband: "InfiniBand",
      rackNote: "La lección que aprende todo ingeniero de entrenamiento distribuido: mantén el trabajo parlanchín **dentro de un nodo**. Cada salto hacia la red te cuesta — así que acomodas el modelo para cruzarla lo menos posible.",
      splitConcept: [
        "Entonces: ¿cada GPU guarda la **red entera**, o solo una **parte**? Ambas cosas pasan — depende de la estrategia. Aquí está la *misma* red de siguiente-palabra en 2 GPUs, de tres formas distintas.",
      ],
      splitLabel: "PRUÉBALO · REPARTE EL MODELO",
      splitTitle: "Una red, repartida entre GPUs",
      splitBody: "Esta pequeña red lee un prompt y predice la siguiente palabra. Elige una estrategia y mira qué guarda de verdad cada GPU — las neuronas **sólidas** viven en esa GPU; las tenues viven en la otra.",
      splitStrategies: [
        {
          key: "data",
          label: "Paralelismo de datos",
          tag: "copia la red entera",
          own: "la **red entera** — una copia completa",
          desc: "Cada GPU guarda una copia completa de la red y corre un lote distinto de prompts. Tras cada paso promedian sus ajustes de pesos para que las copias sigan idénticas.",
          comm: "comparten gradientes (all-reduce)",
        },
        {
          key: "tensor",
          label: "Paralelismo de tensores",
          tag: "reparte las neuronas de cada capa",
          own: "**una tajada de cada capa** — la mitad de las neuronas",
          desc: "La red es demasiado ancha para una GPU, así que las neuronas de cada capa se reparten entre ellas. Ambas GPUs trabajan el mismo prompt a la vez, cada una calculando su mitad.",
          comm: "comparten activaciones en cada capa",
        },
        {
          key: "pipeline",
          label: "Paralelismo de tubería",
          tag: "reparte la red por profundidad",
          own: "**unas capas enteras** — una etapa",
          desc: "Las primeras capas viven en la GPU 1, las últimas en la GPU 2. Un prompt fluye por la GPU 1 y luego pasa a la GPU 2 para terminar — una línea de montaje.",
          comm: "pasan activaciones en el relevo",
        },
      ],
      splitNetLabel: "una red · predice la siguiente palabra",
      splitOwnLabel: "Cada GPU guarda:",
      splitCommLabel: "las GPUs deben intercambiar:",
      splitGpuWord: "GPU",
      splitNote: "El entrenamiento real combina las tres a la vez — datos *y* tensores *y* tubería — entre **miles** de GPUs durante semanas. Un modelo de frontera es demasiado grande para copiarlo entero en una GPU, así que a la vez se *reparte* y se *replica*. Eso es de verdad un entrenamiento, y por eso cuesta lo que cuesta.",
      explainQ: "¿Por qué una multiplicación de matrices es el trabajo perfecto para una GPU y una mala opción para una CPU?",
      explainA: "Una multiplicación de matrices son miles de productos punto independientes — ninguna celda necesita la respuesta de otra. Una CPU tiene pocos núcleos y debe recorrerlos casi uno por uno; una GPU tiene miles de núcleos pequeños que calculan una celda distinta cada uno, simultáneamente. El trabajo es \"vergonzosamente paralelo\", así que lanzarle miles de núcleos encaja casi a la perfección — esa es toda la razón por la que la IA corre en GPUs.",
      deeperTitle: "¿Por qué no usar una CPU más rápida?",
      deeperBody: [
        "Un núcleo de CPU es *individualmente* mucho más rápido e inteligente que uno de GPU — tuberías profundas, predicción de saltos, cachés grandes — porque está hecho para correr rápido una cadena enredada de decisiones. La matemática de las redes neuronales casi no tiene decisiones: es la misma multiplicación y suma, un billón de veces.",
        "Para eso no quieres unos pocos genios; quieres un estadio de trabajadores cada uno haciendo una suma fácil. Las GPUs cambian astucia-por-núcleo por *miles* de núcleos más una memoria muy ancha que los alimente. En matemática de matrices ese cambio gana por 10–100×; en código cotidiano lleno de decisiones perdería feo.",
      ],
      deeper2Title: "¿Qué corre de verdad por esos cables?",
      deeper2Body: [
        "Durante el entrenamiento las GPUs intercambian dos cosas grandes: **activaciones** (los números intermedios que pasan entre capas) y **gradientes** (la corrección de cada peso tras un lote). El paralelismo de tensores y de tubería mueve activaciones; el de datos suma gradientes entre todas las réplicas.",
        "Por eso el ancho de banda es una restricción de diseño de primer nivel. NVLink dentro de un nodo corre a cientos de GB/s; la red InfiniBand entre nodos es varias veces más lenta. Los ingenieros colocan los puntos de corte para mantener el tráfico más pesado en los cables más rápidos — un rompecabezas de memoria y red tanto como de matemática.",
      ],
      bridgeLabel: "SIGUIENTE: EMBEDDINGS",
      bridgeBody: "Seguiste una red desde la matemática hasta el metal. Ahora: lo primero que esa matemática toca — cómo un token se vuelve un vector de *significado* sobre el que la red puede calcular.",
    },
    emb: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 07",
      title: "Embeddings",
      lede: "La red no puede hacer matemáticas con la palabra *“rey.”* Así que cada token se convierte en un **vector** — un punto en el espacio donde **cercano significa parecido en significado**. Y lo sorprendente: nadie fija esos números. El **preentrenamiento** los aprende.",
      prev: "¿GPU o CPU?",
      next: "Transformers",
      heroLabel: "UNA PALABRA SE VUELVE UN PUNTO",
      heroWord: "reina",
      heroVecLabel: "su vector (unos pocos de 4.096 números)",
      heroMapLabel: "…un punto en el mapa — junto a “rey”, lejos de “gato” o “pizza”",
      heroCaption: "La misma idea que un hash — pero en vez de dispersar, coloca los significados *parecidos* *cerca*.",
      concept: [
        "Un **embedding** es una tabla de búsqueda: cada token del vocabulario recibe una fila de números — su **vector**. Los modelos reales usan **4.096** números por token; aquí usaremos solo **dos**, para poder dibujarlos en un mapa.",
        "La única regla que lo hace útil: **la distancia es significado.** Las palabras con significados parecidos quedan cerca; las no relacionadas, lejos. “Gato” cae cerca de “perro”, lejos de “pizza”.",
        "Eso es todo — el significado se vuelve *geometría*. Y una vez que el significado es geometría, el modelo puede hacer aritmética con él. Juega con el mapa y luego veremos de dónde sale la disposición.",
      ],
      mapLabel: "PRUÉBALO · EL MAPA DEL SIGNIFICADO",
      mapTitle: "Las palabras parecidas quedan cerca",
      mapBody: "Cada punto es una palabra, ubicada por su vector. Toca una y mira encenderse sus **vecinas más cercanas** — las palabras más próximas en significado. Fíjate cómo los cuatro temas se acomodan en sus propios barrios.",
      mapHint: "Toca una palabra:",
      mapNearLabel: "más cercanas en significado",
      groupLabels: { people: "personas", animal: "animales", food: "comida", tech: "tecnología" },
      mapNote: "Este es un mapa de *juguete* — 36 palabras en 2D. Un modelo real tiene cientos de miles de tokens en 4.096 dimensiones, pero la regla es idéntica: cerca = parecido.",
      ptConcept: [
        "¿De dónde salen estas posiciones? **Nadie las coloca.** Empiezan como números *aleatorios* — cada palabra dispersa al azar.",
        "Luego ocurre el **preentrenamiento**: el modelo lee billones de palabras, cada vez adivinando el siguiente token. Cada intento empuja los vectores. Las palabras que aparecen en los *mismos contextos* — “rey” y “reina”, “gato” y “perro” — se atraen; las que nunca coinciden se alejan.",
        "Tras suficiente texto, la nube aleatoria se ha organizado en el mapa que acabas de explorar. El significado no se programó — **se precipitó al predecir la siguiente palabra.** *“Conocerás una palabra por la compañía que tiene.”*",
      ],
      arLabel: "PRUÉBALO · EL SIGNIFICADO ES ARITMÉTICA",
      arTitle: "rey − hombre + mujer ≈ ?",
      arBody: "Cada palabra es una flecha desde el origen, así que puedes **sumarlas y restarlas**. **Restar** una palabra es dar un paso *alejándote* de ella; **sumar** una palabra es dar un paso *acercándote*. Entonces `rey − hombre + mujer` se lee: *empieza en **rey**, aléjate de **hombre** y acércate a **mujer*** — que es lo mismo que recorrer la flecha **hombre → mujer** partiendo de rey. Caes en **reina**.",
      arResultLabel: "≈ palabra más cercana",
      arSlotStart: "empieza en",
      arSlotMinus: "− resta",
      arSlotPlus: "+ suma",
      arRead: "Recórrelo por pasos: **1** las tres palabras como vectores desde **0** · **2** empieza en **rey** · **3** resta **hombre** · **4** suma **mujer** · **5** la cadena cae más cerca de **reina**.",
      arNote: "Ese paso “hombre → mujer” es una **dirección de género** que el modelo descubrió solo — la misma flecha separa actor/actriz, tío/tía, príncipe/princesa. Los embeddings reales guardan cientos de esas direcciones (tiempo verbal, plural, país→capital) que nadie etiquetó.",
      ntLabel: "CÓMO ESTO SE VUELVE EL SIGUIENTE TOKEN",
      ntTitle: "De vectores a la siguiente palabra",
      ntBody: "Los embeddings vuelven los tokens en vectores — ¿pero cómo predice eso el *siguiente*? Aquí está toda la tubería. Tu prompt (hasta **4.096 tokens**) se busca en la matriz de embeddings, pasa por **el modelo** y se convierte de vuelta en un puntaje para cada uno de los ~200.000 tokens del vocabulario. El puntaje más alto gana.",
      ntTokens: "hasta 4.096 tokens",
      ntEmbed: "matriz de embeddings",
      ntSeq: "la secuencia",
      ntModel: "el modelo",
      ntNextVec: "el vector de la siguiente palabra",
      ntUnembed: "matriz de des-embedding",
      ntScores: "~200.000 puntajes — softmax, elige el mayor",
      ntNextToken: "siguiente token",
      ntWeights: "pesos aprendidos",
      ntData: "datos en vivo",
      ntTying: "En muchos LLMs estas dos matrices son los **mismos pesos, transpuestos** (“weight tying”): la matriz que convierte tokens *en* vectores también convierte el vector final *de vuelta* en puntajes de tokens.",
      ntTakeaway: "Ese es todo el bucle: representa los tokens → corre el modelo → puntúa el vocabulario → elige uno. Luego lo agregas y lo repites todo, un token a la vez.",
      ntSteps: [
        { t: "Tu prompt, como tokens", d: "La entrada es una secuencia de hasta **4.096 tokens** — la ventana de contexto. Cada token es uno de ~200.000 entradas del vocabulario." },
        { t: "Busca cada vector", d: "Toma la **fila** de cada token en la tabla de embeddings — pesos aprendidos, forma **200k × 4k** (unos 820M de números por sí sola)." },
        { t: "La secuencia de vectores", d: "Ahora el prompt es una pila — **N × 4k** — un vector de 4.096 números por token, que carga significado *y* posición." },
        { t: "Corre el modelo", d: "La secuencia entera pasa por **el modelo** (las capas y la atención que verás en la próxima lección) y sale un solo **vector de 4.096 números** — un punto en el *mismo espacio de embeddings* que los tokens, su lectura de lo que sigue." },
        { t: "El vector de la siguiente palabra", d: "Ese vector **1 × 4k** es la conjetura comprimida del modelo — en efecto un *embedding predicho*: un punto en el mismo espacio que cada token, aún no una palabra. Por eso el siguiente paso solo tiene que buscar el token más cercano." },
        { t: "Puntúa cada token", d: "Cada columna de la tabla de des-embedding **4k × 200k** es el vector de un token. Multiplicar es un **producto punto** con cada columna — mide qué tan alineados están dos vectores, así que puntuar es en realidad *encontrar el token más cercano en el espacio*: 4.096 números se vuelven un **puntaje** por token del vocabulario, el mayor = mejor coincidencia." },
        { t: "Softmax → probabilidades", d: "Eso es una fila **1 × 200k** de puntajes crudos (logits). **Softmax** los convierte en probabilidades que suman 1 — una distribución completa sobre el vocabulario." },
        { t: "Elige uno, y repite", d: "La decodificación voraz toma el mayor; los modelos reales suelen **muestrear** (temperatura y top-p cambian enfoque por creatividad). Agrega el ganador al prompt y corre todo otra vez — **un token a la vez**." },
      ],
      ntPrev: "Etapa anterior",
      ntNext: "Etapa siguiente",
      ntZoomIn: "Acercar a la etapa",
      ntZoomOut: "Ver todo el pipeline",
      emLabel: "LA MATRIZ DE EMBEDDINGS",
      emTitle: "Una gran tabla guarda el significado de cada token",
      emBody: "El mapa que acabas de explorar es en realidad una tabla de búsqueda gigante: la **matriz de embeddings**. Tiene **una fila por token** del vocabulario (~200.000) y **una columna por dimensión** (4.096). Así que cada fila *es* el vector de un token — sus coordenadas en un espacio de significado de 4.096 dimensiones, donde la distancia y la dirección codifican cómo se relacionan los tokens. Haz clic en un token para ver su fila.",
      emRows: "~200.000 tokens (filas)",
      emCols: "4.096 dimensiones (columnas) →",
      emPick: "Elige un token",
      emReadout: "{word} → algunos de sus 4.096 números",
      emUnembTitle: "¿Y la matriz de des-embedding?",
      emUnembBody: "La **matriz de des-embedding** es la misma idea, al revés: **4.096 × 200.000**. Donde el embedding convierte *un token en un vector*, el des-embedding convierte *un vector de vuelta en un puntaje para cada token*. En muchos modelos son literalmente los mismos pesos, transpuestos — el mapa leído hacia adelante para buscar, y hacia atrás para elegir.",
      emPretrain: "Nadie escribe estos números a mano. Cada coordenada se **aprende durante el pretraining** — el modelo lee cantidades enormes de texto y ajusta la fila de cada token hasta que los tokens que aparecen en contextos parecidos quedan cerca unos de otros. (El pretraining es su propia etapa más adelante en el roadmap.)",
      emWords: ["rey", "reina", "perro", "gato", "código", "pizza"],
      explainQ: "¿Qué significa que “rey − hombre + mujer ≈ reina”, y de dónde salió esa estructura?",
      explainA: "Cada palabra es un vector — un punto en el espacio — y las direcciones entre puntos cargan significado. El paso de “hombre” a “mujer” es una dirección de “género” consistente; aplicar ese mismo paso a “rey” te lleva a “reina”. Nadie definió un eje de género: el preentrenamiento colocó las palabras al predecir el siguiente token sobre muchísimo texto, y como “rey/reina” y “hombre/mujer” aparecen en contextos paralelos, terminaron en posiciones paralelas. La aritmética solo sigue esas direcciones aprendidas.",
      deeperTitle: "¿Por qué dos números aquí, pero 4.096 en los modelos reales?",
      deeperBody: [
        "Dos dimensiones nos dejan *dibujar* el mapa, pero solo pueden codificar hasta cierto punto — unas pocas direcciones antes de que las palabras choquen. Los modelos reales usan **4.096** dimensiones, así que caben muchas más “direcciones de significado” independientes (formalidad, tiempo, tema, sentimiento…) sin que todo se amontone.",
        "No puedes imaginar 4.096 dimensiones, y no hace falta — las reglas que viste aquí (cerca = parecido, direcciones = relaciones) se cumplen igual allá arriba. A la matemática no le importa en cuántas dimensiones corre.",
      ],
      cosTitle: "¿Distancia, o ángulo? (similitud coseno)",
      cosBody: [
        "En nuestro mapa usamos distancia en línea recta. Los sistemas reales suelen comparar el **ángulo**, con la **similitud coseno**: dos vectores que apuntan igual dan 1, perpendiculares dan 0, opuestos dan −1. Ignora qué tan *largos* son los vectores y pregunta solo *hacia dónde* apuntan — lo que resulta seguir mejor el significado en muchas dimensiones.",
        "Este es el número exacto detrás de la búsqueda semántica y **RAG** (Etapa 4): representa tu pregunta como vector, representa cada documento, y devuelve los que apuntan más en la misma dirección.",
      ],
      bridgeLabel: "SIGUIENTE: TRANSFORMERS Y ATENCIÓN",
      bridgeBody: "Acabas de ver **el modelo** como una sola caja negra entre los vectores y la respuesta. La próxima lección abre esa caja: la **atención**, cómo los tokens se miran entre sí para que “banco” de un río y “banco” de tu dinero dejen de compartir un vector — y resuelvan qué significan *aquí*.",
      words: { man: "hombre", woman: "mujer", king: "rey", queen: "reina", prince: "príncipe", princess: "princesa", boy: "niño", girl: "niña", actor: "actor", actress: "actriz", uncle: "tío", aunt: "tía", teacher: "maestra", doctor: "doctor", artist: "artista", writer: "escritor", dog: "perro", cat: "gato", lion: "león", tiger: "tigre", horse: "caballo", wolf: "lobo", mouse: "ratón", bird: "pájaro", pizza: "pizza", bread: "pan", apple: "manzana", banana: "plátano", coffee: "café", cake: "pastel", laptop: "laptop", phone: "teléfono", keyboard: "teclado", server: "servidor", robot: "robot", code: "código" },
    },
    attn: {
      crumb: "ETAPA 1 · FUNDAMENTOS · LECCIÓN 08",
      title: "Transformers y atención",
      lede: "Los embeddings le daban a cada token *un* vector fijo. Pero “banco” junto a un río y “banco” con tu dinero no pueden significar lo mismo. La **atención** lo resuelve: cada token se actualiza **mirando a los demás** — y el contexto entero decide qué significa *aquí*.",
      prev: "Embeddings",
      next: "Cómo funciona el entrenamiento",
      heroLabel: "UNA PALABRA CAMBIA HACIA DÓNDE MIRA “IT”",
      heroToggleLabel: "cambia la última palabra",
      heroWordTired: "tired",
      heroWordWide: "wide",
      heroReadTired: "“it” mira hacia atrás a **the animal** — porque los animales se *cansan* (*tired*). Así que **it = el animal**.",
      heroReadWide: "Cambió una palabra, y “it” ahora mira a **the street** — porque las calles son *anchas* (*wide*). Así que **it = la calle**.",
      heroCaption: "Nada más en la oración se movió. El modelo *vuelve a leer* “it” pesando cada otra palabra — ese peso es la **atención**. (Usamos una oración en inglés porque el pronombre “it”, sin género, hace el truco más claro.)",
      concept: [
        "Este es el problema. Tras la lección anterior, “it” tiene exactamente un embedding — los mismos números siempre. Pero en *“…because it was tired”*, “it” es el **animal**; cambia a *“wide”* y “it” es la **calle**. Un vector fijo no puede ser ambos.",
        "La **atención** lo resuelve: antes de decidir nada, cada token puede **mirar a los otros tokens** y jalar lo relevante, mezclando su significado con el propio. “It” se vuelve una mezcla que es sobre todo *animal* — o sobre todo *calle* — según la compañía que tenga.",
        "La imagen para ingenieros: una **búsqueda difusa en un diccionario**. Cada token hace una pregunta (una **query**), cada token anuncia una etiqueta (una **key**), y cuanto más cerca coincide una key con la query, más tomas de ese **value** del token. No un único acierto exacto — una *mezcla ponderada* de todos.",
      ],
      lensLabel: "PRUÉBALO · LA LENTE DE ATENCIÓN",
      lensTitle: "Toca una palabra — mira qué observa",
      lensBody: "Toca cualquier palabra para que sea la que mira. Los **arcos** y el resaltado muestran cuánto atiende a cada otra palabra. Luego cambia de **cabeza** abajo: un transformer corre muchos patrones de atención a la vez, y cada uno aprende un trabajo distinto.",
      lensHint: "Toca una palabra:",
      lensHeadLabel: "cabeza de atención — cada una aprende un trabajo",
      heads: {
        reference: { name: "referencia", desc: "enlaza una palabra con aquello a lo que se refiere — mira cómo “it” alcanza a “animal.”" },
        previous: { name: "palabra anterior", desc: "cada palabra mira un paso atrás — un patrón real y común que los modelos desarrollan solos." },
        syntax: { name: "verbo → sus palabras", desc: "un verbo alcanza a su sujeto y objeto — “cross” jala a “animal” y “street.”" },
      },
      lensRead: "En esta cabeza, **{q}** atiende más a **{k}**.",
      lensNote: "Las afinidades aquí son *ilustrativas* — elegidas para que el trabajo de cada cabeza se vea fácil. Pero convertirlas en pesos (**softmax**, para que sumen 1) y mezclar los tokens es exactamente lo que hace un transformer real. Un modelo real apila decenas de cabezas a lo largo de decenas de capas.",
      qkvConcept: [
        "¿Y cómo *mira* realmente una palabra? A través de tres pequeños vectores que arma desde su propio embedding: una **query** (¿qué busco?), una **key** (¿qué ofrezco?) y un **value** (qué entrego si me eliges).",
        "Compara cada **query** con cada **key** con un producto punto → **softmax** hacia pesos que suman 1 → toma esa **mezcla ponderada de los values**. Esa mezcla es el nuevo significado del token, ya con contexto. Abajo, dirige la query de “banco” a mano y mira cómo su significado se desliza.",
      ],
      qkvLabel: "PRUÉBALO · QUERY · KEY · VALUE",
      qkvTitle: "“banco” encuentra su significado",
      qkvBody: "“banco” está entre dos barrios del mapa de significado — la ribera y las finanzas. Mueve el control para dirigir su **query**. Puntúa cada palabra de contexto (query · key), el **softmax** las vuelve pesos, y “banco” se vuelve la **mezcla ponderada** de sus values — deslizándose hacia el que escuche.",
      qkvSliderLabel: "dirige la query de banco",
      qkvSliderLeft: "buscar río",
      qkvSliderRight: "buscar dinero",
      qkvPresetRiver: "“junto al río”",
      qkvPresetMixed: "ambiguo",
      qkvPresetMoney: "“del dinero”",
      qkvRiver: "río",
      qkvMoney: "dinero",
      qkvBank: "banco",
      qkvWeightLabel: "pesos de atención (suman 1)",
      qkvMeaningLabel: "significado de banco, ahora",
      qkvRead: "“banco” está escuchando sobre todo a **{w}** — así que eso significa aquí.",
      qkvNote: "Las keys y values son puntos ilustrativos, pero los pasos — producto punto, softmax, suma ponderada — son de verdad. En un modelo entrenado no diriges la query: se calcula desde el propio embedding de la palabra, así que la *oración* dirige esto sola.",
      explainQ: "El embedding de “banco” es un solo vector fijo. ¿Cómo puede el modelo distinguir el “banco” de la ribera del “banco” del dinero?",
      explainA: "No depende solo del embedding. La atención deja que “banco” forme una query y la compare (producto punto) contra la key de cada otra palabra; un softmax vuelve esos puntajes en pesos, y “banco” toma una mezcla ponderada de los vectores value de las demás. Junto a “río”, mezcla río; junto a “dinero”, mezcla dinero. El embedding fijo es solo el punto de partida — las palabras de alrededor lo remodelan en un significado que encaja en *esta* oración.",
      deeperTitle: "La fórmula única: softmax(QKᵀ / √d) · V",
      deeperBody: [
        "Apila la query de cada token en una matriz **Q**, cada key en **K**, cada value en **V**. Entonces toda la atención es **softmax(QKᵀ / √d) · V**. `QKᵀ` es cada query por cada key (todas las afinidades a la vez); `√d` solo evita que los números se disparen en muchas dimensiones; el **softmax** hace que cada fila de pesos sume 1; multiplicar por **V** toma la mezcla ponderada. Ese es todo el mecanismo — una multiplicación de matrices, una normalización, otra multiplicación.",
        "**Multi-cabeza:** corre varias de estas en paralelo con Q/K/V aprendidas distintas, cada una libre de seguir una relación diferente (las cabezas que alternaste), luego las concatena. La **auto-atención** es cuando Q, K y V vienen de la misma secuencia — una oración leyéndose a sí misma.",
      ],
      maskTitle: "Por qué escala — y el detalle para los modelos de chat",
      maskBody: [
        "El enfoque anterior leía una oración palabra por palabra, así que la palabra 50 quedaba lejos de la 1. La atención conecta **cada token con cada otro en un solo paso** — los enlaces lejanos cuestan lo mismo que los cercanos — y cada una de esas comparaciones ocurre **en paralelo** en la GPU. Ese paralelismo es justo por qué los transformers se pudieron entrenar con todo el internet, y por qué se impusieron.",
        "Un detalle para los modelos que *generan* texto: al predecir la siguiente palabra solo pueden mirar **hacia atrás**, nunca palabras aún no escritas (una **máscara causal**). Y como la atención no tiene un sentido del orden propio, cada token también recibe una señal **posicional** para que “el perro muerde al hombre” y “el hombre muerde al perro” no sean la misma sopa.",
      ],
      bridgeLabel: "SIGUIENTE: CÓMO FUNCIONA EL ENTRENAMIENTO",
      bridgeBody: "Ya viste toda la máquina — tokens, embeddings, atención. Pero cada peso en ella empezó como un **número aleatorio**. La próxima lección es el motor que los ajustó: **pérdida, gradientes y retropropagación** — cómo billones de intentos convierten poco a poco el ruido en un modelo que sabe cosas.",
    },
    webScale: webScaleES,
    domains: domainsES,
    dedup: dedupES,
    recipe: recipeES,
    distill: distillES,
    dataPipeline: dataPipelineES,
    dataPipelineDeep: dataPipelineDeepES,
    backbone: backboneES,
    qualityFiltering: qualityFilteringES,
    tokenDictionary: tokenDictionaryES,
    embeddingMatrix: embeddingMatrixES,
    transformerBlock: transformerBlockES,
    nextToken: nextTokenES,
    autoregressiveLoop: autoregressiveLoopES,
    howModelsLearn: howModelsLearnES,
    baseVsAssistant: baseVsAssistantES,
    whyAlignment: whyAlignmentES,
    prefillVsDecode: prefillVsDecodeES,
    classifierScoring: classifierScoringES,
    multiTurnFormatting: multiTurnFormattingES,
    feedForward: feedForwardES,
    extractionParsing: extractionParsingES,
    safetyFiltering: safetyFilteringES,
    positionalEncoding: positionalEncodingES,
    specialTokens: specialTokensES,
    attentionMechanism: attentionMechanismES,
    samplingStrategies: samplingStrategiesES,
    piiScrubbing: piiScrubbingES,
    binPacking: binPackingES,
    ropeMath: ropeMathES,
    constrainedDecoding: constrainedDecodingES,
    reasoningTokens: reasoningTokensES,
    backpropagation: backpropagationES,
    supervisedFineTuning: supervisedFineTuningES,
    rewardModeling: rewardModelingES,
    flashAttention: flashAttentionES,
    testTimeSearch: testTimeSearchES,
    mixedPrecision: mixedPrecisionES,
    matrixOptimizers: matrixOptimizersES,
    parameterEfficientFinetuning: parameterEfficientFinetuningES,
    ppo: ppoES,
    grpo: grpoES,
    verifiableRewards: verifiableRewardsES,
    kvCacheSystems: kvCacheSystemsES,
    quantization: quantizationES,
    speculativeDecoding: speculativeDecodingES,
    kvCache: kvCacheES,
    syntheticData: syntheticDataES,
    optimizers: optimizersES,
    preferenceOptimization: preferenceOptimizationES,
    longContext: longContextES,
    mixtureOfExperts: mixtureOfExpertsES,
    toolCalling: toolCallingES,
    distributedTraining: distributedTrainingES,
    stage1List: [
      "La vida de un LLM",
      "Tokens",
      "Datos",
      "Sesgo",
      "Redes neuronales",
      "¿GPU o CPU?",
      "Embeddings",
      "Transformers",
      "Cómo funciona el entrenamiento",
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
export const GITHUB_URL = "https://github.com/libreai-dev/academy";

/** Overall roadmap progress shown in the header (illustrative for the MVP). */
export const OVERALL_PROGRESS = 3;
