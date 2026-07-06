import Link from "next/link";
import { createQuestAction, deleteQuestAction } from "@/app/actions/admin";
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
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">Quest Builder</p>
          <h1 className="rpg-title text-4xl md:text-6xl">Quests</h1>
          <p className="mt-3 text-slate-200">複数のミッションを組み合わせ、授業で実施するクエストを作ります。</p>
        </div>
        <RpgLink href="/admin">ダッシュボードへ戻る</RpgLink>
      </header>

      <RpgWindow title="Create Quest">
        <form action={createQuestAction} className="grid gap-4">
          <Field label="タイトル">
            <TextInput name="title" required />
          </Field>
          <Field label="説明">
            <TextArea name="description" />
          </Field>
          <Field label="最大配点（1〜100点）">
            <TextInput name="maxScore" type="number" defaultValue={100} min={1} max={100} />
          </Field>
          <Field label="制限時間（分）">
            <TextInput name="timeLimitMinutes" type="number" defaultValue={10} min={1} />
          </Field>
          <RpgButton>クエスト作成</RpgButton>
        </form>
      </RpgWindow>

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

      <RpgWindow title="Quest List">
        <div className="rpg-card-grid">
          {filtered.map((quest) => (
            <article className="rpg-window grid gap-3" key={quest.id}>
              <h2 className="text-xl font-bold text-yellow-300">{quest.title}</h2>
              <p className="text-sm text-slate-300">{quest.description ?? "説明なし"}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt>言語</dt>
                <dd>{questLanguages(quest)}</dd>
                <dt>ミッション</dt>
                <dd>{quest.items.length}</dd>
                <dt>最大配点</dt>
                <dd>{quest.maxScore}点</dd>
                <dt>制限時間</dt>
                <dd>{Math.ceil(quest.timeLimitSeconds / 60)}分</dd>
                <dt>セッション</dt>
                <dd>{quest.sessions.length}</dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                <RpgLink href={`/admin/quests/${quest.id}`}>編集</RpgLink>
                <form action={deleteQuestAction}>
                  <input type="hidden" name="id" value={quest.id} />
                  <RpgButton className="rpg-danger">削除</RpgButton>
                </form>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6">
          <Link className="text-sm text-sky-300 underline" href="/admin">
            ダッシュボードへ戻る
          </Link>
        </div>
      </RpgWindow>
    </main>
  );
}
