"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, writeAuditLog } from "@/lib/auth";
import {
  createJoinCode,
  linesToList,
  normalizeQuestMaxScore,
  normalizeQuestTimeBonusMaxScore,
  normalizeQuestTimeLimitSeconds,
  stringifyList
} from "@/lib/domain";
import { prisma } from "@/lib/prisma";

type MissionType =
  | "output_prediction"
  | "variable_trace"
  | "branch_logic"
  | "loop_logic"
  | "bug_hunt"
  | "concept_check";
type Difficulty = "easy" | "normal" | "hard";
type MissionLanguage = "python" | "php" | "generic";

function stringValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function intValue(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function questMaxScoreValue(formData: FormData): number {
  return normalizeQuestMaxScore(intValue(formData, "maxScore") ?? 100);
}

function questTimeLimitSecondsValue(formData: FormData): number {
  const seconds = intValue(formData, "timeLimitSeconds");
  if (seconds !== null) return normalizeQuestTimeLimitSeconds(seconds);
  const minutes = intValue(formData, "timeLimitMinutes") ?? 10;
  return normalizeQuestTimeLimitSeconds(minutes * 60);
}

function questTimeBonusMaxScoreValue(formData: FormData): number {
  return normalizeQuestTimeBonusMaxScore(intValue(formData, "timeBonusMaxScore") ?? 20);
}

async function uniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const joinCode = createJoinCode();
    const existing = await prisma.session.findUnique({ where: { joinCode } });
    if (!existing) return joinCode;
  }
  throw new Error("参加コードを生成できませんでした。");
}

export async function createMissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = stringValue(formData, "title");
  const prompt = stringValue(formData, "prompt");
  const choices = linesToList(formData.get("choices"));
  const correctAnswer = stringValue(formData, "correctAnswer");

  if (!title || !prompt || choices.length < 2 || !correctAnswer) return;

  const mission = await prisma.mission.create({
    data: {
      type: stringValue(formData, "type") as MissionType,
      language: stringValue(formData, "language") as MissionLanguage,
      title,
      prompt,
      codeSnippet: stringValue(formData, "codeSnippet") || null,
      choicesJson: stringifyList(choices),
      correctAnswer,
      explanation: stringValue(formData, "explanation"),
      tagsJson: stringifyList(linesToList(formData.get("tags"))),
      difficulty: stringValue(formData, "difficulty") as Difficulty
    }
  });

  await writeAuditLog({
    adminUserId: admin.id,
    action: "mission.create",
    targetType: "Mission",
    targetId: mission.id
  });
  revalidatePath("/admin/missions");
}

export async function updateMissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  const title = stringValue(formData, "title");
  const prompt = stringValue(formData, "prompt");
  const choices = linesToList(formData.get("choices"));
  const correctAnswer = stringValue(formData, "correctAnswer");

  if (!id || !title || !prompt || choices.length < 2 || !correctAnswer) return;

  await prisma.mission.update({
    where: { id },
    data: {
      type: stringValue(formData, "type") as MissionType,
      language: stringValue(formData, "language") as MissionLanguage,
      title,
      prompt,
      codeSnippet: stringValue(formData, "codeSnippet") || null,
      choicesJson: stringifyList(choices),
      correctAnswer,
      explanation: stringValue(formData, "explanation"),
      tagsJson: stringifyList(linesToList(formData.get("tags"))),
      difficulty: stringValue(formData, "difficulty") as Difficulty
    }
  });

  await writeAuditLog({
    adminUserId: admin.id,
    action: "mission.update",
    targetType: "Mission",
    targetId: id
  });
  revalidatePath("/admin/missions");
  redirect("/admin/missions");
}

export async function deleteMissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  if (!id) return;
  await prisma.mission.delete({ where: { id } });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "mission.delete",
    targetType: "Mission",
    targetId: id
  });
  revalidatePath("/admin/missions");
}

export async function createQuestAction(formData: FormData) {
  const admin = await requireAdmin();
  const title = stringValue(formData, "title");
  if (!title) return;

  const quest = await prisma.quest.create({
    data: {
      title,
      description: stringValue(formData, "description") || null,
      maxScore: questMaxScoreValue(formData),
      timeBonusMaxScore: questTimeBonusMaxScoreValue(formData),
      timeLimitSeconds: questTimeLimitSecondsValue(formData)
    }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest.create",
    targetType: "Quest",
    targetId: quest.id
  });
  revalidatePath("/admin/quests");
  redirect(`/admin/quests/${quest.id}`);
}

export async function updateQuestAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  const title = stringValue(formData, "title");
  if (!id || !title) return;

  await prisma.quest.update({
    where: { id },
    data: {
      title,
      description: stringValue(formData, "description") || null,
      maxScore: questMaxScoreValue(formData),
      timeBonusMaxScore: questTimeBonusMaxScoreValue(formData),
      timeLimitSeconds: questTimeLimitSecondsValue(formData)
    }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest.update",
    targetType: "Quest",
    targetId: id
  });
  revalidatePath(`/admin/quests/${id}`);
}

export async function deleteQuestAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  if (!id) return;
  await prisma.quest.delete({ where: { id } });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest.delete",
    targetType: "Quest",
    targetId: id
  });
  revalidatePath("/admin/quests");
}

export async function addQuestItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const questId = stringValue(formData, "questId");
  const missionId = stringValue(formData, "missionId");
  if (!questId || !missionId) return;

  const count = await prisma.questItem.count({ where: { questId } });
  await prisma.questItem.create({
    data: {
      questId,
      missionId,
      order: count + 1
    }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest_item.add",
    targetType: "Quest",
    targetId: questId
  });
  revalidatePath(`/admin/quests/${questId}`);
}

export async function updateQuestItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  const questId = stringValue(formData, "questId");
  if (!id || !questId) return;
  await prisma.questItem.update({
    where: { id },
    data: {
      order: intValue(formData, "order") ?? 1
    }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest_item.update",
    targetType: "QuestItem",
    targetId: id
  });
  revalidatePath(`/admin/quests/${questId}`);
}

export async function removeQuestItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  const questId = stringValue(formData, "questId");
  if (!id || !questId) return;
  await prisma.questItem.delete({ where: { id } });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "quest_item.remove",
    targetType: "QuestItem",
    targetId: id
  });
  revalidatePath(`/admin/quests/${questId}`);
}

export async function startSessionAction(formData: FormData) {
  const admin = await requireAdmin();
  const questId = stringValue(formData, "questId");
  const title = stringValue(formData, "title");
  if (!questId) return;
  const session = await prisma.session.create({
    data: {
      questId,
      title: title || "授業クエスト",
      joinCode: await uniqueJoinCode(),
      status: "running",
      startedAt: new Date()
    }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "session.start",
    targetType: "Session",
    targetId: session.id
  });
  redirect(`/admin/sessions/${session.id}`);
}

export async function toggleRankingAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  const showRanking = stringValue(formData, "showRanking") === "true";
  if (!id) return;
  await prisma.session.update({
    where: { id },
    data: { showRanking }
  });
  await writeAuditLog({
    adminUserId: admin.id,
    action: showRanking ? "session.ranking_on" : "session.ranking_off",
    targetType: "Session",
    targetId: id
  });
  revalidatePath(`/admin/sessions/${id}`);
}

export async function pauseSessionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  if (!id) return;

  const result = await prisma.session.updateMany({
    where: { id, status: "running" },
    data: { status: "waiting" }
  });

  if (result.count > 0) {
    await writeAuditLog({
      adminUserId: admin.id,
      action: "session.pause",
      targetType: "Session",
      targetId: id
    });
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/sessions/${id}`);
}

export async function resumeSessionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  if (!id) return;

  const result = await prisma.session.updateMany({
    where: { id, status: "waiting" },
    data: { status: "running" }
  });

  if (result.count > 0) {
    await writeAuditLog({
      adminUserId: admin.id,
      action: "session.resume",
      targetType: "Session",
      targetId: id
    });
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/sessions/${id}`);
}

export async function deleteSessionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = stringValue(formData, "id");
  if (!id) return;
  await prisma.session.delete({ where: { id } });
  await writeAuditLog({
    adminUserId: admin.id,
    action: "session.delete",
    targetType: "Session",
    targetId: id
  });
  redirect("/admin");
}
