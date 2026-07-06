import {
  closeSessionAction,
  deleteSessionAction,
  toggleRankingAction
} from "@/app/actions/admin";
import { AdminShell } from "@/components/AdminShell";
import { CopyJoinCodeButton } from "@/components/CopyJoinCodeButton";
import { RpgButton, RpgLink, RpgWindow } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { getSessionDashboard } from "@/lib/session-data";
import { notFound } from "next/navigation";

function formatDurationMs(value: number | null) {
  if (value === null) return "-";
  const totalSeconds = Math.round(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${seconds.toString().padStart(2, "0")}秒`;
}

export default async function AdminSessionPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireAdmin();
  const { sessionId } = await params;
  const data = await getSessionDashboard(sessionId);
  if (!data) notFound();
  const { session, ranking, missionStats, totalQuestions } = data;
  const completedCount = ranking.filter((entry) => entry.completedAt).length;

  return (
    <AdminShell
      active="sessions"
      actions={<RpgLink href="/admin#sessions">セッション一覧</RpgLink>}
      description={
        <>
          {session.quest.title} / 参加コード:{" "}
          <CopyJoinCodeButton joinCode={session.joinCode} />
        </>
      }
      title={session.title}
    >

      <div className="rpg-card-grid">
        <RpgWindow title="Session Status">
          <dl className="grid gap-3">
            <div className="flex justify-between gap-4">
              <dt>状態</dt>
              <dd className="font-bold text-yellow-300">{session.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>参加者</dt>
              <dd>{session.participants.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>完了者</dt>
              <dd>{completedCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>ランキング公開</dt>
              <dd>{session.showRanking ? "ON" : "OFF"}</dd>
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
              <dt>時間ボーナス最大点</dt>
              <dd>{session.quest.timeBonusMaxScore}点</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>制限時間</dt>
              <dd>{Math.ceil(session.quest.timeLimitSeconds / 60)}分</dd>
            </div>
          </dl>
        </RpgWindow>

        <RpgWindow title="Controls">
          <div className="grid gap-3">
            <form action={toggleRankingAction}>
              <input type="hidden" name="id" value={session.id} />
              <input
                type="hidden"
                name="showRanking"
                value={session.showRanking ? "false" : "true"}
              />
              <RpgButton>{session.showRanking ? "ランキングOFF" : "ランキングON"}</RpgButton>
            </form>
            <RpgLink
              href={`/display/${session.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              表示用ランキングを開く
            </RpgLink>
            <a className="rpg-button inline-flex" href={`/admin/sessions/${session.id}/csv`}>
              CSV出力
            </a>
            {session.status !== "closed" ? (
              <form action={closeSessionAction}>
                <input type="hidden" name="id" value={session.id} />
                <RpgButton>セッション終了</RpgButton>
              </form>
            ) : null}
            <form action={deleteSessionAction}>
              <input type="hidden" name="id" value={session.id} />
              <RpgButton className="rpg-danger">セッション削除</RpgButton>
            </form>
          </div>
        </RpgWindow>
      </div>

      <RpgWindow title="参加コード別ランキング / 進捗モニタリング">
        <p className="mb-4 text-sm text-slate-300">
          同じクエストでも参加コードが違えば別ランキングです。授業中はこの表で進捗と順位を逐次確認できます。
        </p>
        <div className="admin-table-wrap">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>名前</th>
                <th>進捗</th>
                <th>スコア</th>
                <th>基礎点</th>
                <th>時間ボーナス</th>
                <th>正答</th>
                <th>完了時間</th>
                <th>平均時間</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.participantId}>
                  <td>{entry.rank}</td>
                  <td className="font-bold text-yellow-300">{entry.displayName}</td>
                  <td>
                    {entry.answeredCount}/{entry.totalQuestions}
                  </td>
                  <td>{entry.totalScore}</td>
                  <td>{entry.baseScore}</td>
                  <td>{entry.timeBonus}</td>
                  <td>{entry.correctCount}</td>
                  <td>{formatDurationMs(entry.completedDurationMs)}</td>
                  <td>
                    {entry.averageResponseTimeMs === Number.MAX_SAFE_INTEGER
                      ? "-"
                      : `${Math.round(entry.averageResponseTimeMs / 1000)}秒`}
                  </td>
                  <td
                    className={
                      entry.completedAt
                        ? "font-bold text-sky-300"
                        : entry.isStalled
                          ? "font-bold text-rose-300"
                          : "text-green-300"
                    }
                  >
                    {entry.completedAt ? "完了" : entry.isStalled ? "停滞中" : "進行中"}
                  </td>
                </tr>
              ))}
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={10}>まだ参加者はいません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </RpgWindow>

      <RpgWindow title="Mission Accuracy">
        <div className="admin-table-wrap">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ミッション</th>
                <th>回答数</th>
                <th>正答</th>
                <th>誤答</th>
                <th>正答率</th>
              </tr>
            </thead>
            <tbody>
              {missionStats.map((stat) => (
                <tr key={stat.missionId}>
                  <td>{stat.index}</td>
                  <td>{stat.title}</td>
                  <td>{stat.responseCount}</td>
                  <td>{stat.correct}</td>
                  <td>{stat.incorrect}</td>
                  <td>{stat.correctRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RpgWindow>
    </AdminShell>
  );
}
