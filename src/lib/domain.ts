import type { Participant, QuestItem, Response } from "@prisma/client";
export type QuestScoringConfig = {
  maxScore: number;
  timeBonusMaxScore?: number | null;
  timeLimitSeconds: number;
  items: Array<Pick<QuestItem, "missionId" | "order">>;
};

export type RankingEntry = {
  participantId: string;
  displayName: string;
  nickname: string;
  baseScore: number;
  timeBonus: number;
  totalScore: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
  averageResponseTimeMs: number;
  completedDurationMs: number | null;
  rank: number;
  completedAt: Date | null;
  joinedAt: Date;
  lastActiveAt: Date;
  isStalled: boolean;
};

export type ScoreSummary = {
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
};

export type ScoreHistogramBucket = {
  minScore: number;
  maxScore: number;
  count: number;
  barPercent: number;
};

export function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleListBySeed<T>(values: readonly T[], seed: string): T[] {
  const shuffled = [...values];
  const random = seededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function stringifyList(values: string[]): string {
  return JSON.stringify(values.map((value) => value.trim()).filter(Boolean));
}

export function linesToList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeQuestMaxScore(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.max(1, Math.min(100, Math.trunc(value)));
}

export function normalizeQuestTimeLimitSeconds(value: number): number {
  if (!Number.isFinite(value)) return 600;
  return Math.max(1, Math.trunc(value));
}

export function normalizeQuestTimeBonusMaxScore(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(Number(value))));
}

export function distributeQuestPoints(maxScore: number, totalQuestions: number): number[] {
  const safeQuestions = Math.max(0, Math.trunc(totalQuestions));
  if (safeQuestions === 0) return [];

  const safeMaxScore = normalizeQuestMaxScore(maxScore);
  const base = Math.floor(safeMaxScore / safeQuestions);
  const remainder = safeMaxScore % safeQuestions;
  return Array.from(
    { length: safeQuestions },
    (_value, index) => base + (index < remainder ? 1 : 0)
  );
}

export function summarizeScores(scores: number[]): ScoreSummary {
  const validScores = scores.filter(Number.isFinite);
  if (validScores.length === 0) {
    return {
      averageScore: null,
      minScore: null,
      maxScore: null
    };
  }

  const total = validScores.reduce((sum, score) => sum + score, 0);
  return {
    averageScore: total / validScores.length,
    minScore: Math.min(...validScores),
    maxScore: Math.max(...validScores)
  };
}

export function buildScoreHistogram(
  scores: number[],
  options: { maxScore: number; timeBonusMaxScore?: number | null; bucketSize?: number }
): ScoreHistogramBucket[] {
  const bucketSize = Math.max(1, Math.trunc(options.bucketSize ?? 20));
  const validScores = scores.filter(Number.isFinite);
  const plannedMaxScore =
    normalizeQuestMaxScore(options.maxScore) +
    normalizeQuestTimeBonusMaxScore(options.timeBonusMaxScore);
  const bucketCount = Math.max(1, Math.ceil(plannedMaxScore / bucketSize));
  const buckets = Array.from({ length: bucketCount }, (_value, index) => {
    const minScore = index * bucketSize;
    return {
      minScore,
      maxScore:
        index === bucketCount - 1
          ? plannedMaxScore
          : Math.min(minScore + bucketSize - 1, plannedMaxScore),
      count: 0,
      barPercent: 0
    };
  });

  for (const score of validScores) {
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(score / bucketSize))
    );
    buckets[bucketIndex].count += 1;
  }

  const maxCount = Math.max(0, ...buckets.map((bucket) => bucket.count));
  if (maxCount === 0) return buckets;

  return buckets.map((bucket) => ({
    ...bucket,
    barPercent: Math.round((bucket.count / maxCount) * 100)
  }));
}

export function questPointMap(quest: QuestScoringConfig): Map<string, number> {
  const orderedItems = [...quest.items].sort((a, b) => a.order - b.order);
  const points = distributeQuestPoints(quest.maxScore, orderedItems.length);
  return new Map(orderedItems.map((item, index) => [item.missionId, points[index] ?? 0]));
}

export function calculateTimeBonus(input: {
  joinedAt: Date;
  completedAt: Date | null;
  timeBonusMaxScore?: number | null;
  timeLimitSeconds: number;
}): number {
  if (!input.completedAt) return 0;

  const maxBonus = normalizeQuestTimeBonusMaxScore(input.timeBonusMaxScore);
  const limitMs = normalizeQuestTimeLimitSeconds(input.timeLimitSeconds) * 1000;
  const elapsedMs = Math.max(0, input.completedAt.getTime() - input.joinedAt.getTime());
  const remainingMs = Math.max(0, limitMs - elapsedMs);
  return Math.floor((maxBonus * remainingMs) / limitMs);
}

export function scoreParticipant(input: {
  participant: Participant;
  responses: Response[];
  quest: QuestScoringConfig;
}) {
  const pointsByMission = questPointMap(input.quest);
  const totalQuestions = pointsByMission.size;
  const questResponses = input.responses.filter((response) =>
    pointsByMission.has(response.missionId)
  );
  const answeredMissionIds = new Set(questResponses.map((response) => response.missionId));
  const correctCount = questResponses.filter((response) => response.isCorrect).length;
  const baseScore = questResponses.reduce((sum, response) => {
    if (!response.isCorrect) return sum;
    return sum + (pointsByMission.get(response.missionId) ?? 0);
  }, 0);
  const averageResponseTimeMs =
    questResponses.length > 0
      ? Math.round(
          questResponses.reduce((sum, response) => sum + response.responseTimeMs, 0) /
            questResponses.length
        )
      : Number.MAX_SAFE_INTEGER;
  const completedAt =
    totalQuestions > 0 && answeredMissionIds.size >= totalQuestions
      ? questResponses.reduce(
          (latest, response) =>
            response.submittedAt > latest ? response.submittedAt : latest,
          questResponses[0].submittedAt
        )
      : null;
  const latestActivity =
    questResponses.length > 0
      ? questResponses.reduce(
          (latest, response) =>
            response.submittedAt > latest ? response.submittedAt : latest,
          questResponses[0].submittedAt
        )
      : input.participant.lastActiveAt;
  const completedDurationMs = completedAt
    ? Math.max(0, completedAt.getTime() - input.participant.joinedAt.getTime())
    : null;
  const timeBonus = calculateTimeBonus({
    joinedAt: input.participant.joinedAt,
    completedAt,
    timeBonusMaxScore: input.quest.timeBonusMaxScore,
    timeLimitSeconds: input.quest.timeLimitSeconds
  });

  return {
    baseScore,
    timeBonus,
    totalScore: baseScore + timeBonus,
    correctCount,
    answeredCount: questResponses.length,
    totalQuestions,
    averageResponseTimeMs,
    completedAt,
    completedDurationMs,
    latestActivity
  };
}

export function createJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function rankParticipants(input: {
  participants: Participant[];
  responses: Response[];
  quest: QuestScoringConfig;
  now?: Date;
}): RankingEntry[] {
  const now = input.now ?? new Date();
  const responsesByParticipant = new Map<string, Response[]>();
  for (const response of input.responses) {
    const list = responsesByParticipant.get(response.participantId) ?? [];
    list.push(response);
    responsesByParticipant.set(response.participantId, list);
  }

  const entries = input.participants.map((participant) => {
    const responses = responsesByParticipant.get(participant.id) ?? [];
    const score = scoreParticipant({
      participant,
      responses,
      quest: input.quest
    });

    return {
      participantId: participant.id,
      displayName: participant.displayName,
      nickname: participant.nickname,
      baseScore: score.baseScore,
      timeBonus: score.timeBonus,
      totalScore: score.totalScore,
      correctCount: score.correctCount,
      answeredCount: score.answeredCount,
      totalQuestions: score.totalQuestions,
      averageResponseTimeMs: score.averageResponseTimeMs,
      rank: 0,
      completedAt: score.completedAt,
      completedDurationMs: score.completedDurationMs,
      joinedAt: participant.joinedAt,
      lastActiveAt: score.latestActivity,
      isStalled:
        score.answeredCount < score.totalQuestions &&
        now.getTime() - score.latestActivity.getTime() >= 3 * 60 * 1000
    };
  });

  entries.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    const aDuration = a.completedDurationMs ?? Number.MAX_SAFE_INTEGER;
    const bDuration = b.completedDurationMs ?? Number.MAX_SAFE_INTEGER;
    if (aDuration !== bDuration) return aDuration - bDuration;
    if (a.averageResponseTimeMs !== b.averageResponseTimeMs) {
      return a.averageResponseTimeMs - b.averageResponseTimeMs;
    }
    return a.nickname.localeCompare(b.nickname, "ja");
  });

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function normalizeAnswer(value: string): string {
  return value.trim();
}
