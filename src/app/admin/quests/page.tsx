import Link from "next/link";
import { createQuestAction, deleteQuestAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/AdminShell";
import { Field, RpgButton, RpgLink, RpgWindow, Select, TextArea, TextInput } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function languageLabel(language: string) {
  if (language === "python") return "Python";
  if (language === "php") return "PHP";
  return "共通";
}

function questLanguages(quest: {
  items: Array<{ mission?: { language: string } }>;
}) {
  const languages = [...new Set(quest.items.map((item) => item.mission?.language).filter(Boolean))];
  return languages.length > 0 ? languages.map((item) => languageLabel(String(item))).join(" / ") : "未設定";
}

export default async function QuestsPage({
  searchParams
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const language = params.language;
  const quests = await prisma.quest.findMany({
    include: { items: { include: { mission: true } }, sessions: true },
    orderBy: { updatedAt: "desc" }
  });
  const filtered = language
    ? quests.filter((quest) => quest.items.some((item) => item.mission.language === language))
    : quests;

  return (
    <AdminShell
      active="quests"
      actions={<RpgLink href="/admin/missions">ミッション管理</RpgLink>}
      description="複数のミッションを組み合わせ、授業で実施するクエストを作ります。"
      title="クエスト"
    >
      <RpgWindow title="Filter">
        <form className="grid gap-3 md:grid-cols-[220px_auto]">
          <Select name="language" defaultValue={language ?? ""}>
            <option value="">すべての言語</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
            <option value="generic">共通</option>
          </Select>
          <RpgButton>絞り込み</RpgButton>
        </form>
      </RpgWindow>

      <details className="admin-disclosure">
        <summary>新規クエスト作成</summary>
        <div className="admin-disclosure-body">
          <form action={createQuestAction} className="grid gap-4 md:grid-cols-2">
            <Field label="タイトル">
              <TextInput name="title" required />
            </Field>
            <Field label="最大配点（1〜100点）">
              <TextInput name="maxScore" type="number" defaultValue={100} min={1} max={100} />
            </Field>
            <Field label="時間ボーナス最大点（1〜50点）">
              <TextInput
                name="timeBonusMaxScore"
                type="number"
                defaultValue={20}
                min={1}
                max={50}
              />
            </Field>
            <Field label="制限時間（分）">
              <TextInput name="timeLimitMinutes" type="number" defaultValue={10} min={1} />
            </Field>
            <Field label="説明">
              <TextArea name="description" />
            </Field>
            <div className="md:col-span-2">
              <RpgButton>クエスト作成</RpgButton>
            </div>
          </form>
        </div>
      </details>

      <RpgWindow title="Quest List">
        <div className="admin-table-wrap">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>タイトル</th>
                <th>言語</th>
                <th>ミッション</th>
                <th>最大配点</th>
                <th>時間ボーナス</th>
                <th>制限時間</th>
                <th>セッション</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quest) => (
                <tr key={quest.id}>
                  <td>
                    <Link className="font-bold text-yellow-300" href={`/admin/quests/${quest.id}`}>
                      {quest.title}
                    </Link>
                    {quest.description ? <p className="admin-muted">{quest.description}</p> : null}
                  </td>
                  <td>{questLanguages(quest)}</td>
                  <td>{quest.items.length}</td>
                  <td>{quest.maxScore}点</td>
                  <td>{quest.timeBonusMaxScore}点</td>
                  <td>{Math.ceil(quest.timeLimitSeconds / 60)}分</td>
                  <td>{quest.sessions.length}</td>
                  <td>
                    <div className="admin-actions">
                      <RpgLink href={`/admin/quests/${quest.id}`}>編集</RpgLink>
                      <form action={deleteQuestAction}>
                        <input type="hidden" name="id" value={quest.id} />
                        <RpgButton className="rpg-danger">削除</RpgButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>条件に一致するクエストはありません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </RpgWindow>
    </AdminShell>
  );
}
