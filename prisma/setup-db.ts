import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exec(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${table}")`
  );
  return columns.some((item) => item.name === column);
}

async function main() {
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await exec("PRAGMA foreign_keys = ON");

  await exec(`
    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'TEACHER',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "AdminSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AdminSession_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "Mission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "language" TEXT NOT NULL DEFAULT 'generic',
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL UNIQUE,
      "prompt" TEXT NOT NULL,
      "codeSnippet" TEXT,
      "choicesJson" TEXT NOT NULL,
      "correctAnswer" TEXT NOT NULL,
      "explanation" TEXT NOT NULL,
      "tagsJson" TEXT NOT NULL,
      "difficulty" TEXT NOT NULL DEFAULT 'normal',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!(await columnExists("Mission", "language"))) {
    await exec(`ALTER TABLE "Mission" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'generic'`);
  }

  await exec(`
    CREATE TABLE IF NOT EXISTS "Quest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "maxScore" INTEGER NOT NULL DEFAULT 100,
      "timeBonusMaxScore" INTEGER NOT NULL DEFAULT 20,
      "timeLimitSeconds" INTEGER NOT NULL DEFAULT 600,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!(await columnExists("Quest", "maxScore"))) {
    await exec(`ALTER TABLE "Quest" ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 100`);
  }

  if (!(await columnExists("Quest", "timeBonusMaxScore"))) {
    await exec(`ALTER TABLE "Quest" ADD COLUMN "timeBonusMaxScore" INTEGER NOT NULL DEFAULT 20`);
  }

  if (!(await columnExists("Quest", "timeLimitSeconds"))) {
    await exec(`ALTER TABLE "Quest" ADD COLUMN "timeLimitSeconds" INTEGER NOT NULL DEFAULT 600`);
    await exec(`
      UPDATE "Quest"
      SET "timeLimitSeconds" = MAX(
        60,
        COALESCE(
          (
            SELECT COUNT(*)
            FROM "QuestItem"
            WHERE "QuestItem"."questId" = "Quest"."id"
          ),
          1
        ) * 60
      )
    `);
  }

  await exec(`
    CREATE TABLE IF NOT EXISTS "QuestItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "questId" TEXT NOT NULL,
      "missionId" TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      CONSTRAINT "QuestItem_questId_fkey"
        FOREIGN KEY ("questId") REFERENCES "Quest" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "QuestItem_missionId_fkey"
        FOREIGN KEY ("missionId") REFERENCES "Mission" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "questId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "joinCode" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL DEFAULT 'running',
      "showRanking" BOOLEAN NOT NULL DEFAULT false,
      "startedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_questId_fkey"
        FOREIGN KEY ("questId") REFERENCES "Quest" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "Participant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Participant_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "Session" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "Response" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionId" TEXT NOT NULL,
      "participantId" TEXT NOT NULL,
      "missionId" TEXT NOT NULL,
      "answer" TEXT NOT NULL,
      "isCorrect" BOOLEAN NOT NULL,
      "score" INTEGER NOT NULL,
      "responseTimeMs" INTEGER NOT NULL,
      "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Response_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "Session" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Response_participantId_fkey"
        FOREIGN KEY ("participantId") REFERENCES "Participant" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Response_missionId_fkey"
        FOREIGN KEY ("missionId") REFERENCES "Mission" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "adminUserId" TEXT,
      "action" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT,
      "detail" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_adminUserId_fkey"
        FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Response_participantId_missionId_key" ON "Response" ("participantId", "missionId")'
  );
  await exec('CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession" ("expiresAt")');
  await exec('CREATE INDEX IF NOT EXISTS "AdminSession_userId_idx" ON "AdminSession" ("userId")');
  await exec('CREATE INDEX IF NOT EXISTS "Mission_language_idx" ON "Mission" ("language")');
  await exec('CREATE INDEX IF NOT EXISTS "Mission_type_idx" ON "Mission" ("type")');
  await exec('CREATE INDEX IF NOT EXISTS "Mission_difficulty_idx" ON "Mission" ("difficulty")');
  await exec('CREATE INDEX IF NOT EXISTS "QuestItem_questId_order_idx" ON "QuestItem" ("questId", "order")');
  await exec('CREATE INDEX IF NOT EXISTS "QuestItem_missionId_idx" ON "QuestItem" ("missionId")');
  await exec('CREATE INDEX IF NOT EXISTS "Session_questId_idx" ON "Session" ("questId")');
  await exec('CREATE INDEX IF NOT EXISTS "Session_status_idx" ON "Session" ("status")');
  await exec('CREATE INDEX IF NOT EXISTS "Participant_sessionId_idx" ON "Participant" ("sessionId")');
  await exec('CREATE INDEX IF NOT EXISTS "Response_sessionId_idx" ON "Response" ("sessionId")');
  await exec('CREATE INDEX IF NOT EXISTS "Response_missionId_idx" ON "Response" ("missionId")');
  await exec('CREATE INDEX IF NOT EXISTS "AuditLog_adminUserId_idx" ON "AuditLog" ("adminUserId")');
  await exec('CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt")');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("SQLite schema is ready.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
