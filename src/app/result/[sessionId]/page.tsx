import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RpgLink, RpgWindow } from "@/components/Rpg";
import { scoreParticipant } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function participantCookieName(sessionId: string) {
  return `cqa_p_${sessionId}`;
}

export default async function ResultPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const participantId = cookieStore.get(participantCookieName(sessionId))?.value;
  if (!participantId) redirect("/join");

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      quest: {
        include: {
          items: { orderBy: { order: "asc" } }
        }
      },
      participants: true,
      responses: true
    }
  });

  if (!session) redirect("/join");
  if (session.status === "waiting") redirect("/join");
  const totalQuestions = session.quest.items.length;
  const participant = session.participants.find((entry) => entry.id === participantId);
  if (!participant) redirect("/join");

  const myResponses = session.responses.filter(
    (response) => response.participantId === participantId
  );
  const result = scoreParticipant({
    participant,
    responses: myResponses,
    quest: session.quest
  });
  const correctRate =
    totalQuestions === 0 ? 0 : Math.round((result.correctCount / totalQuestions) * 100);

  return (
    <main className="rpg-shell rpg-student-shell student-quest student-result-page grid gap-6">
      <header className="rpg-hero student-hero student-result-hero text-center">
        <div className="student-hero-copy">
          <h1 className="rpg-title student-section-title">Quest Clear</h1>
          <p className="student-lead mx-auto">{session.quest.title}</p>
        </div>
      </header>

      <RpgWindow title="Your Result" className="student-result-window">
        <div className="student-result-grid">
          <div className="student-stat-card">
            <span className="student-stat-label">Score</span>
            <strong className="student-stat-value student-result-score">
              {result.totalScore}
            </strong>
          </div>
          <div className="student-stat-card">
            <span className="student-stat-label">正答数</span>
            <strong className="student-stat-value">
              {result.correctCount}/{totalQuestions}
            </strong>
          </div>
          <div className="student-stat-card">
            <span className="student-stat-label">正答率</span>
            <strong className="student-stat-value">{correctRate}%</strong>
          </div>
        </div>
      </RpgWindow>

      <div className="student-result-actions flex flex-wrap justify-center gap-3">
        <RpgLink href="/join">Code Quest Arena ホームへ</RpgLink>
        <RpgLink href={`/display/${sessionId}`}>Ranking Board</RpgLink>
      </div>
    </main>
  );
}
