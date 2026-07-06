import Link from "next/link";
import {
  deleteExpiredSessionsAction,
  deleteSessionAction,
  startSessionAction
} from "@/app/actions/admin";
import { logoutAction } from "@/app/actions/auth";
import { Field, RpgButton, RpgLink, RpgWindow, TextInput } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [quests, runningSessions, pastSessions] = await Promise.all([
    prisma.quest.findMany({
      include: { items: { include: { mission: true } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.session.findMany({
      where: { status: { in: ["waiting", "running"] } },
      include: { quest: true, participants: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.session.findMany({
      where: { status: "closed" },
      include: { quest: true, participants: true },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">Teacher Console</p>
          <h1 className="rpg-title text-4xl md:text-6xl">Quest Master</h1>
          <p className="mt-3 text-slate-200">{admin.name} としてログイン中</p>
        </div>
        <form action={logoutAction}>
          <RpgButton>ログアウト</RpgButton>
        </form>
      </header>

      <nav className="grid gap-3 md:grid-cols-3">
        <RpgLink href="/admin/missions">ミッション管理</RpgLink>
        <RpgLink href="/admin/quests">クエスト管理</RpgLink>
        <RpgLink href="/join">学生画面</RpgLink>
      </nav>

      <RpgWindow title="授業前の準備">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rpg-window">
            <h2 className="text-xl font-bold text-yellow-300">1. ミッションを準備</h2>
            <p className="mt-2 text-sm text-slate-300">
              Python/PHP別に、1問ずつの問題・選択肢・解説を作ります。
            </p>
            <div className="mt-4">
              <RpgLink href="/admin/missions">ミッション管理へ</RpgLink>
            </div>
          </div>
          <div className="rpg-window">
            <h2 className="text-xl font-bold text-yellow-300">2. クエストを組む</h2>
            <p className="mt-2 text-sm text-slate-300">
              ミッションを並べて、授業で実施するクエストを作ります。
            </p>
            <div className="mt-4">
              <RpgLink href="/admin/quests">クエスト管理へ</RpgLink>
            </div>
          </div>
        </div>
      </RpgWindow>

      <div className="rpg-card-grid">
        <RpgWindow title="3. 授業セッションを開始">
          <p className="mb-4 text-sm text-slate-300">
            クエストを選ぶと参加コードが発行されます。学生には `/join` と参加コードを伝えてください。
          </p>
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
        </RpgWindow>

        <RpgWindow title="5. 結果整理">
          <p className="text-sm text-slate-200">
            保持期限を過ぎたセッションを削除できます。CSV出力後の整理に使います。
          </p>
          <form action={deleteExpiredSessionsAction} className="mt-4">
            <RpgButton className="rpg-danger">期限切れデータ削除</RpgButton>
          </form>
        </RpgWindow>
      </div>

      <RpgWindow title="4. 実施中モニタリング">
        <p className="mb-4 text-sm text-slate-300">
          授業中は参加コードごとに `監視する` を開き、進捗・ランキング・停滞中の学生を確認します。
        </p>
        <div className="overflow-x-auto">
          <table className="rpg-table">
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
                    <Link className="font-bold text-yellow-300" href={`/admin/sessions/${session.id}`}>
                      {session.title}
                    </Link>
                  </td>
                  <td>{session.quest.title}</td>
                  <td className="font-bold text-sky-300">{session.joinCode}</td>
                  <td>{session.participants.length}</td>
                  <td>{session.status}</td>
                  <td className="flex flex-wrap gap-2">
                    <RpgLink href={`/admin/sessions/${session.id}`}>監視する</RpgLink>
                    <RpgLink href={`/display/${session.id}`}>表示</RpgLink>
                    <form action={deleteSessionAction}>
                      <input type="hidden" name="id" value={session.id} />
                      <RpgButton className="rpg-danger">削除</RpgButton>
                    </form>
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

      <RpgWindow title="クエスト一覧">
        <div className="rpg-card-grid">
          {quests.map((quest) => (
            <Link className="rpg-window block hover:border-yellow-300" key={quest.id} href={`/admin/quests/${quest.id}`}>
              <h3 className="font-bold text-yellow-300">{quest.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{quest.items.length} ミッション</p>
            </Link>
          ))}
        </div>
      </RpgWindow>

      <RpgWindow title="終了済みセッション / CSV">
        <div className="overflow-x-auto">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>セッション</th>
                <th>クエスト</th>
                <th>参加者</th>
                <th>終了</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pastSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <Link className="font-bold text-yellow-300" href={`/admin/sessions/${session.id}`}>
                      {session.title}
                    </Link>
                  </td>
                  <td>{session.quest.title}</td>
                  <td>{session.participants.length}</td>
                  <td>{session.endedAt?.toLocaleString("ja-JP") ?? "-"}</td>
                  <td className="flex flex-wrap gap-2">
                    <RpgLink href={`/admin/sessions/${session.id}`}>結果を見る</RpgLink>
                    <RpgLink href={`/display/${session.id}`}>表示</RpgLink>
                    <a className="rpg-button inline-flex" href={`/admin/sessions/${session.id}/csv`}>
                      CSV
                    </a>
                    <form action={deleteSessionAction}>
                      <input type="hidden" name="id" value={session.id} />
                      <RpgButton className="rpg-danger">削除</RpgButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RpgWindow>
    </main>
  );
}
