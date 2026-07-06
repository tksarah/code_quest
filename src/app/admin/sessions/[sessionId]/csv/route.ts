import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { buildSessionCsv } from "@/lib/csv";
import { rankParticipants } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      quest: {
        include: {
          items: {
            include: { mission: true },
            orderBy: { order: "asc" }
          }
        }
      },
      participants: true,
      responses: true
    }
  });

  if (!session) return new NextResponse("Not found", { status: 404 });

  const ranking = rankParticipants({
    participants: session.participants,
    responses: session.responses,
    quest: session.quest
  });

  const missionHeaders = session.quest.items.map(
    (_item, index) => `mission_${index + 1}_correct`
  );
  const correctnessByParticipant = new Map<string, boolean[]>();
  for (const entry of ranking) {
    correctnessByParticipant.set(
      entry.participantId,
      session.quest.items.map((item) => {
        const response = session.responses.find(
          (candidate) =>
            candidate.participantId === entry.participantId &&
            candidate.missionId === item.missionId
        );
        return Boolean(response?.isCorrect);
      })
    );
  }

  const csv = buildSessionCsv({
    sessionTitle: session.title,
    questTitle: session.quest.title,
    ranking,
    missionHeaders,
    correctnessByParticipant
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${session.joinCode}.csv"`
    }
  });
}
