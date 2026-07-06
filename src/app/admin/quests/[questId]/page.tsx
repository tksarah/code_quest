import { notFound } from "next/navigation";
import {
  addQuestItemAction,
  removeQuestItemAction,
  startSessionAction,
  updateQuestAction,
  updateQuestItemAction
} from "@/app/actions/admin";
import { Field, RpgButton, RpgLink, RpgWindow, Select, TextArea, TextInput } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function languageLabel(language: string) {
  if (language === "python") return "Python";
  if (language === "php") return "PHP";
  return "共通";
}

export default async function QuestDetailPage({
  params
}: {
  params: Promise<{ questId: string }>;
}) {
  await requireAdmin();
  const { questId } = await params;
  const [quest, missions] = await Promise.all([
    prisma.quest.findUnique({
      where: { id: questId },
      include: {
        items: {
          include: { mission: true },
          orderBy: { order: "asc" }
        }
      }
    }),
    prisma.mission.findMany({ orderBy: { title: "asc" } })
  ]);
  if (!quest) notFound();

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">Quest Detail</p>
          <h1 className="rpg-title text-4xl md:text-6xl">{quest.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <RpgLink href="/admin">ダッシュボードへ戻る</RpgLink>
          <RpgLink href="/admin/quests">一覧へ</RpgLink>
        </div>
      </header>

      <div className="rpg-card-grid">
        <RpgWindow title="Quest Info">
          <form action={updateQuestAction} className="grid gap-4">
            <input type="hidden" name="id" value={quest.id} />
            <Field label="タイトル">
              <TextInput name="title" defaultValue={quest.title} required />
            </Field>
            <Field label="説明">
              <TextArea name="description" defaultValue={quest.description ?? ""} />
            </Field>
            <Field label="最大配点（1〜100点）">
              <TextInput
                name="maxScore"
                type="number"
                defaultValue={quest.maxScore}
                min={1}
                max={100}
              />
            </Field>
            <Field label="制限時間（分）">
              <TextInput
                name="timeLimitMinutes"
                type="number"
                defaultValue={Math.ceil(quest.timeLimitSeconds / 60)}
                min={1}
              />
            </Field>
            <RpgButton>保存</RpgButton>
          </form>
        </RpgWindow>

        <RpgWindow title="Start">
          <form action={startSessionAction} className="grid gap-4">
            <input type="hidden" name="questId" value={quest.id} />
            <Field label="セッション名">
              <TextInput name="title" defaultValue={`${quest.title} セッション`} />
            </Field>
            <RpgButton>このクエストで開始</RpgButton>
          </form>
        </RpgWindow>
      </div>

      <RpgWindow title="Add Mission">
        <form action={addQuestItemAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="questId" value={quest.id} />
          <Field label="ミッション">
            <Select name="missionId">
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  [{languageLabel(mission.language)}] {mission.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <RpgButton>追加</RpgButton>
          </div>
        </form>
      </RpgWindow>

      <RpgWindow title="Mission Order">
        <div className="grid gap-3">
          {quest.items.map((item) => (
            <form
              action={updateQuestItemAction}
              className="grid gap-3 border-b border-white/10 pb-3 md:grid-cols-[80px_1fr_auto_auto]"
              key={item.id}
            >
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="questId" value={quest.id} />
              <Field label="順番">
                <TextInput name="order" type="number" defaultValue={item.order} min={1} />
              </Field>
              <div>
                <p className="font-bold text-yellow-300">{item.mission.title}</p>
                <p className="text-sm text-slate-300">
                  {languageLabel(item.mission.language)} / {item.mission.type}
                </p>
              </div>
              <div className="flex items-end">
                <RpgButton>更新</RpgButton>
              </div>
              <div className="flex items-end">
                <button
                  className="rpg-button rpg-danger"
                  formAction={removeQuestItemAction}
                  type="submit"
                >
                  外す
                </button>
              </div>
            </form>
          ))}
          {quest.items.length === 0 ? <p>まだミッションがありません。</p> : null}
        </div>
      </RpgWindow>
    </main>
  );
}
