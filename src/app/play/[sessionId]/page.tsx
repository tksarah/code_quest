import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitAnswerAction } from "@/app/actions/student";
import { RpgButton, RpgLink, RpgWindow } from "@/components/Rpg";
import { parseJsonList, scoreParticipant } from "@/lib/domain";
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
  const choices = parseJsonList(item.mission.choicesJson);
  const missionIndex =
    session.quest.items.findIndex((questItem) => questItem.id === item.id) + 1;
  const currentScore = scoreParticipant({
    participant: session.participants[0],
    responses: session.responses,
    quest: session.quest
  });
  const isLastMission = missionIndex >= session.quest.items.length;

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">{session.quest.title}</p>
          <h1 className="rpg-title text-4xl md:text-6xl">Mission {missionIndex}</h1>
          <p className="mt-3 text-slate-200">
            残り {Math.max(0, session.quest.items.length - session.responses.length)} 問
          </p>
        </div>
        <RpgWindow title="Status" className="min-w-56">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>スコア</dt>
              <dd className="font-bold text-yellow-300">{currentScore.totalScore}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>進捗</dt>
              <dd>
                {session.responses.length}/{session.quest.items.length}
              </dd>
            </div>
          </dl>
        </RpgWindow>
      </header>

      <RpgWindow title={`Mission ${missionIndex}`}>
        <div className="grid gap-5">
          <div>
            <p className="mt-4 whitespace-pre-wrap text-lg leading-8">{item.mission.prompt}</p>
          </div>
          {item.mission.codeSnippet ? (
            <pre className="rpg-code">
              <code>{item.mission.codeSnippet}</code>
            </pre>
          ) : null}

          {response ? (
            <div className="grid gap-4">
              <RpgWindow title={response.isCorrect ? "Clear" : "Check"}>
                <p className={response.isCorrect ? "text-green-300" : "text-rose-300"}>
                  {response.isCorrect ? "正解です！" : "今回は不正解です。"}
                </p>
                <p className="mt-2 text-sm text-slate-300">あなたの回答: {response.answer}</p>
                <p className="mt-2 text-sm text-yellow-300">正解: {item.mission.correctAnswer}</p>
                <p className="mt-4 leading-7">{item.mission.explanation}</p>
              </RpgWindow>
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
              <div className="grid gap-3">
                {choices.map((choice) => (
                  <label
                    className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 border-2 border-white bg-slate-950 p-4 hover:bg-yellow-300 hover:text-slate-950"
                    key={choice}
                  >
                    <input name="answer" type="radio" value={choice} required />
                    <span className="font-bold">{choice}</span>
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
