import assert from "node:assert/strict";
import {
  buildScoreHistogram,
  calculateTimeBonus,
  distributeQuestPoints,
  normalizeQuestTimeBonusMaxScore,
  rankParticipants,
  shuffleListBySeed,
  summarizeScores
} from "../src/lib/domain";

assert.deepEqual(distributeQuestPoints(100, 10), [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
assert.deepEqual(distributeQuestPoints(100, 6), [17, 17, 17, 17, 16, 16]);

assert.deepEqual(summarizeScores([]), {
  averageScore: null,
  minScore: null,
  maxScore: null
});

const scoreSummary = summarizeScores([0, 21, 41]);
assert.equal(scoreSummary.averageScore, 62 / 3);
assert.equal(scoreSummary.minScore, 0);
assert.equal(scoreSummary.maxScore, 41);

assert.equal(normalizeQuestTimeBonusMaxScore(undefined), 20);
assert.equal(normalizeQuestTimeBonusMaxScore(0), 1);
assert.equal(normalizeQuestTimeBonusMaxScore(25.8), 25);
assert.equal(normalizeQuestTimeBonusMaxScore(99), 50);

assert.deepEqual(buildScoreHistogram([0, 19, 20, 39, 40, 120], { maxScore: 100 }), [
  { minScore: 0, maxScore: 19, count: 2, barPercent: 100 },
  { minScore: 20, maxScore: 39, count: 2, barPercent: 100 },
  { minScore: 40, maxScore: 59, count: 1, barPercent: 50 },
  { minScore: 60, maxScore: 79, count: 0, barPercent: 0 },
  { minScore: 80, maxScore: 99, count: 0, barPercent: 0 },
  { minScore: 100, maxScore: 120, count: 1, barPercent: 50 }
]);

assert.deepEqual(buildScoreHistogram([121, 999], { maxScore: 100 }), [
  { minScore: 0, maxScore: 19, count: 0, barPercent: 0 },
  { minScore: 20, maxScore: 39, count: 0, barPercent: 0 },
  { minScore: 40, maxScore: 59, count: 0, barPercent: 0 },
  { minScore: 60, maxScore: 79, count: 0, barPercent: 0 },
  { minScore: 80, maxScore: 99, count: 0, barPercent: 0 },
  { minScore: 100, maxScore: 120, count: 2, barPercent: 100 }
]);

const originalChoices = ["A", "B", "C", "D"];
const shuffledChoices = shuffleListBySeed(originalChoices, "session-a:participant-a:mission-a");
assert.deepEqual(
  shuffleListBySeed(originalChoices, "session-a:participant-a:mission-a"),
  shuffledChoices
);
assert.notDeepEqual(
  shuffleListBySeed(originalChoices, "session-a:participant-b:mission-a"),
  shuffledChoices
);
assert.deepEqual(originalChoices, ["A", "B", "C", "D"]);
assert.deepEqual([...shuffledChoices].sort(), originalChoices);

assert.equal(
  calculateTimeBonus({
    joinedAt: new Date("2026-07-05T00:00:00.000Z"),
    completedAt: new Date("2026-07-05T00:05:00.000Z"),
    timeLimitSeconds: 600
  }),
  10
);

assert.equal(
  calculateTimeBonus({
    joinedAt: new Date("2026-07-05T00:00:00.000Z"),
    completedAt: new Date("2026-07-05T00:05:00.000Z"),
    timeBonusMaxScore: 50,
    timeLimitSeconds: 600
  }),
  25
);

assert.equal(
  calculateTimeBonus({
    joinedAt: new Date("2026-07-05T00:00:00.000Z"),
    completedAt: new Date("2026-07-05T00:11:00.000Z"),
    timeLimitSeconds: 600
  }),
  0
);

const now = new Date("2026-07-05T00:00:00.000Z");
const missionOneAt = new Date("2026-07-05T00:01:00.000Z");
const missionTwoFastAt = new Date("2026-07-05T00:03:00.000Z");
const missionTwoSlowAt = new Date("2026-07-05T00:04:00.000Z");
const ranking = rankParticipants({
  now,
  quest: {
    maxScore: 100,
    timeLimitSeconds: 600,
    items: [
      { missionId: "m1", order: 1 },
      { missionId: "m2", order: 2 }
    ]
  },
  participants: [
    {
      id: "a",
      sessionId: "s",
      displayName: "A",
      joinedAt: now,
      lastActiveAt: now
    },
    {
      id: "b",
      sessionId: "s",
      displayName: "B",
      joinedAt: now,
      lastActiveAt: now
    }
  ],
  responses: [
    {
      id: "r1",
      sessionId: "s",
      participantId: "a",
      missionId: "m1",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 5_000,
      submittedAt: missionOneAt
    },
    {
      id: "r2",
      sessionId: "s",
      participantId: "a",
      missionId: "m2",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 6_000,
      submittedAt: missionTwoFastAt
    },
    {
      id: "r3",
      sessionId: "s",
      participantId: "b",
      missionId: "m1",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 8_000,
      submittedAt: missionOneAt
    },
    {
      id: "r4",
      sessionId: "s",
      participantId: "b",
      missionId: "m2",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 9_000,
      submittedAt: missionTwoSlowAt
    }
  ]
});

assert.equal(ranking[0].participantId, "a");
assert.equal(ranking[0].rank, 1);
assert.equal(ranking[0].baseScore, 100);
assert.equal(ranking[0].timeBonus, 14);
assert.equal(ranking[0].totalScore, 114);

const customBonusRanking = rankParticipants({
  now,
  quest: {
    maxScore: 100,
    timeBonusMaxScore: 50,
    timeLimitSeconds: 600,
    items: [
      { missionId: "m1", order: 1 },
      { missionId: "m2", order: 2 }
    ]
  },
  participants: ranking.map((entry) => ({
    id: entry.participantId,
    sessionId: "s",
    displayName: entry.displayName,
    joinedAt: entry.joinedAt,
    lastActiveAt: entry.lastActiveAt
  })),
  responses: [
    {
      id: "r1",
      sessionId: "s",
      participantId: "a",
      missionId: "m1",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 5_000,
      submittedAt: missionOneAt
    },
    {
      id: "r2",
      sessionId: "s",
      participantId: "a",
      missionId: "m2",
      answer: "x",
      isCorrect: true,
      score: 0,
      responseTimeMs: 6_000,
      submittedAt: missionTwoFastAt
    }
  ]
});

assert.equal(customBonusRanking[0].timeBonus, 35);
assert.equal(
  customBonusRanking[0].totalScore,
  customBonusRanking[0].baseScore + customBonusRanking[0].timeBonus
);

console.log("Domain checks passed.");
