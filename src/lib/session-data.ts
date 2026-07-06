import { prisma } from "@/lib/prisma";
import { rankParticipants } from "@/lib/domain";

export async function getSessionDashboard(sessionId: string) {
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
      participants: { orderBy: { joinedAt: "asc" } },
      responses: true
    }
  });

  if (!session) return null;

  const totalQuestions = session.quest.items.length;
  const ranking = rankParticipants({
    participants: session.participants,
    responses: session.responses,
    quest: session.quest
  });

  const missionStats = session.quest.items.map((item, index) => {
    const responses = session.responses.filter(
      (response) => response.missionId === item.missionId
    );
    const correct = responses.filter((response) => response.isCorrect).length;
    const incorrect = responses.length - correct;
    return {
      index: index + 1,
      missionId: item.missionId,
      title: item.mission.title,
      correct,
      incorrect,
      responseCount: responses.length,
      correctRate:
        responses.length > 0 ? Math.round((correct / responses.length) * 100) : 0
    };
  });

  return { session, ranking, missionStats, totalQuestions };
}
