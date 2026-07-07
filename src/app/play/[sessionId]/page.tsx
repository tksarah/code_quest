import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitAnswerAction } from "@/app/actions/student";
import { RpgButton, RpgLink, RpgWindow } from "@/components/Rpg";
import { parseJsonList, scoreParticipant, shuffleListBySeed } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

function participantCookieName(sessionId: string) {
  return `cqa_p_${sessionId}`;
}

export default async function PlayPage({
  params,
  searchParams
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ mission?: string }>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const participantId = cookieStore.get(participantCookieName(sessionId))?.value;
  if (!participantId) redirect("/join");

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
      participants: {
        where: { id: participantId }
      },
      responses: {
        where: { participantId }
      }
    }
  });

  if (!session || session.participants.length === 0) redirect("/join");
  if (session.status === "closed") redirect(`/result/${sessionId}`);
  if (session.status !== "running") redirect("/join");

  const answeredMissionIds = new Set(session.responses.map((response) => response.missionId));
  const requestedItem = query.mission
    ? session.quest.items.find((item) => item.missionId === query.mission)
    : null;
  const item =
    requestedItem ??
    session.quest.items.find((questItem) => !answeredMissionIds.has(questItem.missionId));

  if (!item) redirect(`/result/${sessionId}`);

  const response = session.responses.find(
    (existing) => existing.missionId === item.missionId
  );
  const choices = shuffleListBySeed(
    parseJsonList(item.mission.choicesJson),
    `${sessionId}:${participantId}:${item.missionId}`
  );
  const missionIndex =
    session.quest.items.findIndex((questItem) => questItem.id === item.id) + 1;
  const totalMissions = session.quest.items.length;
  const answeredCount = session.responses.length;
  const remainingCount = Math.max(0, totalMissions - answeredCount);
  const progressPercent =
    totalMissions === 0 ? 0 : Math.round((answeredCount / totalMissions) * 100);
  const currentScore = scoreParticipant({
    participant: session.participants[0],
    responses: session.responses,
    quest: session.quest
  });
  const isLastMission = missionIndex >= totalMissions;

  return (
    <main className="rpg-shell student-quest student-play-page grid gap-6">
      <header className="rpg-hero student-hero student-play-hero">
        <div className="student-hero-copy">
          <p className="student-badge">{session.quest.title}</p>
          <h1 className="rpg-title student-section-title">Mission {missionIndex}</h1>
          <p className="student-lead">残り {remainingCount} 問</p>
        </div>

        <aside className="student-status-panel" aria-label="現在のステータス">
          <div className="student-stat-grid">
            <div className="student-stat-card">
              <span className="student-stat-label">Score</span>
              <strong className="student-stat-value student-stat-accent">
                {currentScore.totalScore}
              </strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">Progress</span>
              <strong className="student-stat-value">
                {answeredCount}/{totalMissions}
              </strong>
            </div>
          </div>
          <div className="student-progress-block">
            <div className="student-progress-meta">
              <span>クエスト進捗</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="student-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <span
                className="student-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </aside>
      </header>

      <RpgWindow className="student-mission-card">
        <div className="grid gap-5">
          <div className="student-mission-header">
            <span className="student-step-token">Q{missionIndex}</span>
            <p className="student-mission-title">{item.mission.title}</p>
          </div>

          <p className="student-prompt whitespace-pre-wrap">{item.mission.prompt}</p>

          {item.mission.codeSnippet ? (
            <pre className="rpg-code">
              <code>{item.mission.codeSnippet}</code>
            </pre>
          ) : null}

          {response ? (
            <div className="grid gap-4">
              <div
                className={`student-feedback ${
                  response.isCorrect ? "student-feedback-correct" : "student-feedback-wrong"
                }`}
              >
                <p className="student-feedback-title">
                  {response.isCorrect ? "Clear! 正解です" : "Check! 今回は不正解です"}
                </p>
                <dl className="student-answer-summary">
                  <div>
                    <dt>あなたの回答</dt>
                    <dd>{response.answer}</dd>
                  </div>
                  <div>
                    <dt>正解</dt>
                    <dd>{item.mission.correctAnswer}</dd>
                  </div>
                </dl>
                <p className="leading-7">{item.mission.explanation}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isLastMission ? (
                  <RpgLink href={`/result/${sessionId}`}>結果へ進む</RpgLink>
                ) : (
                  <RpgLink href={`/play/${sessionId}`}>次のミッションへ</RpgLink>
                )}
              </div>
            </div>
          ) : (
            <form action={submitAnswerAction} className="grid gap-4">
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="missionId" value={item.missionId} />
              <input type="hidden" name="startedAt" value={Date.now()} />
              <div className="student-choice-grid">
                {choices.map((choice, index) => (
                  <label className="student-choice" key={choice}>
                    <input name="answer" type="radio" value={choice} required />
                    <span className="student-choice-marker">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="student-choice-text">{choice}</span>
                  </label>
                ))}
              </div>
              <RpgButton>回答する</RpgButton>
            </form>
          )}
        </div>
      </RpgWindow>
    </main>
  );
}
