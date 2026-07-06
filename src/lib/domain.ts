import type { Participant, QuestItem, Response } from "@prisma/client";
export type QuestScoringConfig = {
  maxScore: number;
  timeLimitSeconds: number;
  items: Array<Pick<QuestItem, "missionId" | "order">>;
};

export type RankingEntry = {
  participantId: string;
  displayName: string;
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

export function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
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

export function questPointMap(quest: QuestScoringConfig): Map<string, number> {
  const orderedItems = [...quest.items].sort((a, b) => a.order - b.order);
  const points = distributeQuestPoints(quest.maxScore, orderedItems.length);
  return new Map(orderedItems.map((item, index) => [item.missionId, points[index] ?? 0]));
}

export function calculateTimeBonus(input: {
  joinedAt: Date;
  completedAt: Date | null;
  timeLimitSeconds: number;
}): number {
  if (!input.completedAt) return 0;

  const limitMs = normalizeQuestTimeLimitSeconds(input.timeLimitSeconds) * 1000;
  const elapsedMs = Math.max(0, input.completedAt.getTime() - input.joinedAt.getTime());
  const remainingMs = Math.max(0, limitMs - elapsedMs);
  return Math.floor((20 * remainingMs) / limitMs);
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
    return a.averageResponseTimeMs - b.averageResponseTimeMs;
  });

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function normalizeAnswer(value: string): string {
  return value.trim();
}
