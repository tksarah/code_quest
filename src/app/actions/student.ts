"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeAnswer } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

function participantCookieName(sessionId: string) {
  return `cqa_p_${sessionId}`;
}

export async function joinSessionAction(
  _previousState: { error?: string } | undefined,
  formData: FormData
) {
  const joinCode = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!joinCode || !displayName) {
    return { error: "参加コードと名前を入力してください。" };
  }

  if (displayName.length > 40) {
    return { error: "名前は40文字以内で入力してください。" };
  }

  const session = await prisma.session.findUnique({
    where: { joinCode },
    include: { quest: true }
  });

  if (!session || session.status !== "running") {
    return { error: "参加できるセッションが見つかりません。" };
  }

  const participant = await prisma.participant.create({
    data: {
      sessionId: session.id,
      displayName
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(participantCookieName(session.id), participant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect(`/play/${session.id}`);
}

export async function submitAnswerAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const missionId = String(formData.get("missionId") ?? "");
  const answer = normalizeAnswer(String(formData.get("answer") ?? ""));
  const startedAt = Number(formData.get("startedAt") ?? Date.now());
  const cookieStore = await cookies();
  const participantId = cookieStore.get(participantCookieName(sessionId))?.value;

  if (!sessionId || !missionId || !participantId || !answer) {
    redirect("/join");
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      quest: {
        include: {
          items: {
            where: { missionId },
            include: { mission: true }
          }
        }
      }
    }
  });

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, sessionId }
  });

  const item = session?.quest.items[0];
  if (!session || session.status !== "running" || !item || !participant) {
    redirect("/join");
  }

  const isCorrect = normalizeAnswer(item.mission.correctAnswer) === answer;
  const responseTimeMs = Math.max(0, Math.min(Date.now() - startedAt, 60 * 60 * 1000));
  await prisma.response.upsert({
    where: {
      participantId_missionId: {
        participantId,
        missionId
      }
    },
    update: {
      answer,
      isCorrect,
      score: 0,
      responseTimeMs,
      submittedAt: new Date()
    },
    create: {
      sessionId,
      participantId,
      missionId,
      answer,
      isCorrect,
      score: 0,
      responseTimeMs
    }
  });

  await prisma.participant.update({
    where: { id: participantId },
    data: { lastActiveAt: new Date() }
  });

  redirect(`/play/${sessionId}?mission=${missionId}`);
}
