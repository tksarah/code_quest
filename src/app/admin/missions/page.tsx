import Link from "next/link";
import { createMissionAction, deleteMissionAction } from "@/app/actions/admin";
import { Field, RpgButton, RpgLink, RpgWindow, Select, TextArea, TextInput } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { parseJsonList } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

type Difficulty = "easy" | "normal" | "hard";
type MissionType = "output_prediction";
type MissionLanguage = "python" | "php" | "generic";

function languageLabel(language: string) {
  if (language === "python") return "Python";
  if (language === "php") return "PHP";
  return "共通";
}

export default async function MissionsPage({
  searchParams
}: {
  searchParams: Promise<{ tag?: string; difficulty?: string; language?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tag = params.tag?.trim();
  const difficulty = params.difficulty as Difficulty | undefined;
  const language = params.language as MissionLanguage | undefined;
  const missions = await prisma.mission.findMany({
    where: {
      difficulty: difficulty || undefined,
      language: language || undefined
    },
    orderBy: { updatedAt: "desc" }
  });
  const filtered = tag
    ? missions.filter((mission) => parseJsonList(mission.tagsJson).includes(tag))
    : missions;

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">Mission Codex</p>
          <h1 className="rpg-title text-4xl md:text-6xl">Missions</h1>
          <p className="mt-3 text-slate-200">Python/PHP別に、授業で出す1問ずつの問題を準備します。</p>
        </div>
        <RpgLink href="/admin">ダッシュボードへ戻る</RpgLink>
      </header>

      <RpgWindow title="Create Mission">
        <form action={createMissionAction} className="grid gap-4 md:grid-cols-2">
          <Field label="タイトル">
            <TextInput name="title" required />
          </Field>
          <Field label="種別">
            <Select name="type" defaultValue={"output_prediction" satisfies MissionType}>
              <option value="output_prediction">output_prediction</option>
              <option value="variable_trace">variable_trace</option>
              <option value="branch_logic">branch_logic</option>
              <option value="loop_logic">loop_logic</option>
              <option value="bug_hunt">bug_hunt</option>
              <option value="concept_check">concept_check</option>
            </Select>
          </Field>
          <Field label="言語">
            <Select name="language" defaultValue="python">
              <option value="python">Python</option>
              <option value="php">PHP</option>
              <option value="generic">共通</option>
            </Select>
          </Field>
          <Field label="問題文">
            <TextArea name="prompt" required />
          </Field>
          <Field label="コード断片">
            <TextArea name="codeSnippet" />
          </Field>
          <Field label="選択肢（改行区切り）">
            <TextArea name="choices" required />
          </Field>
          <Field label="正解（選択肢と同じ文字列）">
            <TextInput name="correctAnswer" required />
          </Field>
          <Field label="解説">
            <TextArea name="explanation" />
          </Field>
          <Field label="タグ（改行またはカンマ区切り）">
            <TextInput name="tags" />
          </Field>
          <Field label="難易度">
            <Select name="difficulty" defaultValue="normal">
              <option value="easy">easy</option>
              <option value="normal">normal</option>
              <option value="hard">hard</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <RpgButton>作成</RpgButton>
          </div>
        </form>
      </RpgWindow>

      <RpgWindow title="Search">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <TextInput name="tag" placeholder="タグ検索" defaultValue={tag ?? ""} />
          <Select name="language" defaultValue={language ?? ""}>
            <option value="">すべての言語</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
            <option value="generic">共通</option>
          </Select>
          <Select name="difficulty" defaultValue={difficulty ?? ""}>
            <option value="">すべて</option>
            <option value="easy">easy</option>
            <option value="normal">normal</option>
            <option value="hard">hard</option>
          </Select>
          <RpgButton>検索</RpgButton>
        </form>
      </RpgWindow>

      <RpgWindow title="Mission List">
        <div className="overflow-x-auto">
          <table className="rpg-table">
            <thead>
              <tr>
                <th>タイトル</th>
                <th>言語</th>
                <th>種別</th>
                <th>難易度</th>
                <th>タグ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mission) => (
                <tr key={mission.id}>
                  <td className="font-bold text-yellow-300">{mission.title}</td>
                  <td>{languageLabel(mission.language)}</td>
                  <td>{mission.type}</td>
                  <td>{mission.difficulty}</td>
                  <td>{parseJsonList(mission.tagsJson).join(", ")}</td>
                  <td className="flex gap-2">
                    <Link className="rpg-button inline-flex" href={`/admin/missions/${mission.id}/edit`}>
                      編集
                    </Link>
                    <form action={deleteMissionAction}>
                      <input type="hidden" name="id" value={mission.id} />
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
