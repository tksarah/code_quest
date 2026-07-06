import { notFound } from "next/navigation";
import { RpgWindow } from "@/components/Rpg";
import { getSessionDashboard } from "@/lib/session-data";

export default async function PublicRankingDisplayPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const data = await getSessionDashboard(sessionId);
  if (!data) notFound();

  const { session, ranking, totalQuestions } = data;
  const completedCount = ranking.filter((entry) => entry.completedAt).length;
  const topRanking = ranking.slice(0, 5);

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero text-center">
        <p className="text-sm font-bold text-yellow-300">参加コード {session.joinCode}</p>
        <h1 className="rpg-title text-4xl md:text-6xl">Ranking Board</h1>
        <p className="mt-3 text-slate-200">{session.quest.title}</p>
      </header>

      {!session.showRanking ? (
        <RpgWindow title="Stand By">
          <p className="text-center text-xl font-bold text-slate-100">
            ランキングはまだ公開されていません。
          </p>
        </RpgWindow>
      ) : (
        <>
          <div className="rpg-card-grid">
            <RpgWindow title="Participants">
              <dl className="grid gap-3 text-lg">
                <div className="flex justify-between gap-4">
                  <dt>参加者</dt>
                  <dd className="font-black text-yellow-300">{ranking.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>完了者</dt>
                  <dd className="font-black text-sky-300">{completedCount}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>問題数</dt>
                  <dd>{totalQuestions}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>最大配点</dt>
                  <dd>{session.quest.maxScore}点</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>制限時間</dt>
                  <dd>{Math.ceil(session.quest.timeLimitSeconds / 60)}分</dd>
                </div>
              </dl>
            </RpgWindow>
          </div>

          <RpgWindow title="Top 5">
            <ol className="grid gap-3">
              {topRanking.map((entry) => (
                <li
                  className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-b border-white/10 pb-3 text-lg"
                  key={entry.participantId}
                >
                  <span className="font-black text-yellow-300">{entry.rank}位</span>
                  <span className="font-bold">{entry.displayName}</span>
                  <span>{entry.totalScore} pt</span>
                </li>
              ))}
              {topRanking.length === 0 ? (
                <li className="text-slate-300">まだ参加者はいません。</li>
              ) : null}
            </ol>
          </RpgWindow>
        </>
      )}
    </main>
  );
}
