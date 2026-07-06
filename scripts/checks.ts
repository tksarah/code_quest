import assert from "node:assert/strict";
import {
  calculateTimeBonus,
  distributeQuestPoints,
  rankParticipants
} from "../src/lib/domain";

assert.deepEqual(distributeQuestPoints(100, 10), [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
assert.deepEqual(distributeQuestPoints(100, 6), [17, 17, 17, 17, 16, 16]);

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

console.log("Domain checks passed.");
