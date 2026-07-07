import Link from "next/link";
import {
  deleteSessionAction,
  pauseSessionAction,
  resumeSessionAction,
  startSessionAction
} from "@/app/actions/admin";
import { AdminShell } from "@/components/AdminShell";
import { CopyJoinCodeButton } from "@/components/CopyJoinCodeButton";
import { Field, RpgButton, RpgLink, RpgWindow, TextInput } from "@/components/Rpg";
import { SessionQrButton } from "@/components/SessionQrButton";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function joinUrlFor(joinCode: string) {
  const path = `/join?code=${encodeURIComponent(joinCode)}`;
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return path;

  try {
    return new URL(path, appUrl).toString();
  } catch {
    return path;
  }
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [quests, runningSessions] = await Promise.all([
    prisma.quest.findMany({
      include: { items: { include: { mission: true } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.session.findMany({
      where: { status: { in: ["waiting", "running"] } },
      include: { quest: true, participants: true },
      orderBy: { createdAt: "desc" }
    })
  ]);
  const runningParticipants = runningSessions.reduce(
    (total, session) => total + session.participants.length,
    0
  );

  return (
    <AdminShell
      active="dashboard"
      description={`${admin.name} としてログイン中`}
      title="ダッシュボード"
    >
      <section className="admin-stat-grid" aria-label="管理状況">
        <div className="admin-stat-card">
          <span className="admin-stat-label">実施中セッション</span>
          <strong className="admin-stat-value">{runningSessions.length}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">参加中の学生</span>
          <strong className="admin-stat-value">{runningParticipants}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">クエスト</span>
          <strong className="admin-stat-value">{quests.length}</strong>
        </div>
      </section>

      <div className="admin-work-grid">
        <RpgWindow title="セッション開始">
          {quests.length > 0 ? (
            <form action={startSessionAction} className="grid gap-3">
              <Field label="クエスト">
                <select className="rpg-input" name="questId" required>
                  {quests.map((quest) => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title} ({quest.items.length}問)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="セッション名">
                <TextInput name="title" placeholder="例: 1限 変数確認" />
              </Field>
              <RpgButton>セッション開始</RpgButton>
            </form>
          ) : (
            <div className="admin-empty">
              <p>まだクエストがありません。授業を開始する前にクエストを作成してください。</p>
              <div className="mt-3">
                <RpgLink href="/admin/quests">クエスト管理へ</RpgLink>
              </div>
            </div>
          )}
        </RpgWindow>

        <section id="sessions">
          <RpgWindow title="実施中モニタリング">
            <div className="admin-table-wrap">
              <table className="rpg-table admin-session-table">
                <colgroup>
                  <col className="admin-session-col-title" />
                  <col className="admin-session-col-quest" />
                  <col className="admin-session-col-code" />
                  <col className="admin-session-col-participants" />
                  <col className="admin-session-col-status" />
                  <col className="admin-session-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>セッション</th>
                    <th>クエスト</th>
                    <th>参加コード</th>
                    <th>参加者</th>
                    <th>状態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {runningSessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <Link
                          className="admin-session-title-link font-bold text-yellow-300"
                          href={`/admin/sessions/${session.id}`}
                          title={session.title}
                        >
                          {session.title}
                        </Link>
                      </td>
                      <td>
                        <span className="admin-session-quest-name" title={session.quest.title}>
                          {session.quest.title}
                        </span>
                      </td>
                      <td>
                        <div className="admin-session-join-tools">
                          <CopyJoinCodeButton joinCode={session.joinCode} />
                          <SessionQrButton
                            joinCode={session.joinCode}
                            joinUrl={joinUrlFor(session.joinCode)}
                            sessionTitle={session.title}
                          />
                        </div>
                      </td>
                      <td>{session.participants.length}</td>
                      <td>{session.status}</td>
                      <td>
                        <div className="admin-actions">
                          <RpgLink href={`/admin/sessions/${session.id}`}>監視</RpgLink>
                          <RpgLink href={`/admin/sessions/${session.id}/test`}>
                            テスト
                          </RpgLink>
                          {session.status === "running" ? (
                            <form action={pauseSessionAction}>
                              <input type="hidden" name="id" value={session.id} />
                              <RpgButton>停止</RpgButton>
                            </form>
                          ) : null}
                          {session.status === "waiting" ? (
                            <form action={resumeSessionAction}>
                              <input type="hidden" name="id" value={session.id} />
                              <RpgButton>開始</RpgButton>
                            </form>
                          ) : null}
                          {session.status === "running" ? (
                            <RpgLink
                              href={`/display/${session.id}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              表示
                            </RpgLink>
                          ) : null}
                          <form action={deleteSessionAction}>
                            <input type="hidden" name="id" value={session.id} />
                            <RpgButton className="rpg-danger">削除</RpgButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {runningSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>実施中セッションはありません。</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </RpgWindow>
        </section>
      </div>

      <details className="admin-disclosure">
        <summary>クエスト一覧</summary>
        <div className="admin-disclosure-body admin-table-wrap">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>クエスト</th>
                <th>ミッション</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {quests.map((quest) => (
                <tr key={quest.id}>
                  <td>
                    <Link className="font-bold text-yellow-300" href={`/admin/quests/${quest.id}`}>
                      {quest.title}
                    </Link>
                  </td>
                  <td>{quest.items.length}</td>
                  <td>
                    <RpgLink href={`/admin/quests/${quest.id}`}>編集</RpgLink>
                  </td>
                </tr>
              ))}
              {quests.length === 0 ? (
                <tr>
                  <td colSpan={3}>クエストはまだありません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </details>

    </AdminShell>
  );
}
