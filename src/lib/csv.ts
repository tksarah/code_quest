import type { RankingEntry } from "@/lib/domain";

function escapeCsv(value: string | number | Date | null | undefined): string {
  const raw = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/[",\r\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export function buildSessionCsv(input: {
  sessionTitle: string;
  questTitle: string;
  ranking: RankingEntry[];
  missionHeaders: string[];
  correctnessByParticipant: Map<string, boolean[]>;
}): string {
  const headers = [
    "sessionTitle",
    "questTitle",
    "participantName",
    "rank",
    "totalScore",
    "baseScore",
    "timeBonus",
    "correctCount",
    "totalQuestions",
    "completedDurationMs",
    "averageResponseTimeMs",
    "joinedAt",
    "completedAt",
    ...input.missionHeaders
  ];

  const rows = input.ranking.map((entry) => {
    const missionValues = input.correctnessByParticipant
      .get(entry.participantId)
      ?.map((value) => (value ? "1" : "0")) ?? [];
    return [
      input.sessionTitle,
      input.questTitle,
      entry.displayName,
      entry.rank,
      entry.totalScore,
      entry.baseScore,
      entry.timeBonus,
      entry.correctCount,
      entry.totalQuestions,
      entry.completedDurationMs ?? "",
      entry.averageResponseTimeMs === Number.MAX_SAFE_INTEGER
        ? ""
        : entry.averageResponseTimeMs,
      entry.joinedAt,
      entry.completedAt,
      ...missionValues
    ].map(escapeCsv);
  });

  return [headers.map(escapeCsv), ...rows].map((row) => row.join(",")).join("\r\n");
}
