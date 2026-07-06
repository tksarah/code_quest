import { notFound } from "next/navigation";
import { updateMissionAction } from "@/app/actions/admin";
import { Field, RpgButton, RpgLink, RpgWindow, Select, TextArea, TextInput } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { parseJsonList } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function EditMissionPage({
  params
}: {
  params: Promise<{ missionId: string }>;
}) {
  await requireAdmin();
  const { missionId } = await params;
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) notFound();

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold text-yellow-300">Edit Mission</p>
          <h1 className="rpg-title text-4xl md:text-6xl">{mission.title}</h1>
        </div>
        <RpgLink href="/admin">ダッシュボードへ戻る</RpgLink>
      </header>
      <RpgWindow title="Mission Sheet">
        <form action={updateMissionAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={mission.id} />
          <Field label="タイトル">
            <TextInput name="title" defaultValue={mission.title} required />
          </Field>
          <Field label="種別">
            <Select name="type" defaultValue={mission.type}>
              <option value="output_prediction">output_prediction</option>
              <option value="variable_trace">variable_trace</option>
              <option value="branch_logic">branch_logic</option>
              <option value="loop_logic">loop_logic</option>
              <option value="bug_hunt">bug_hunt</option>
              <option value="concept_check">concept_check</option>
            </Select>
          </Field>
          <Field label="言語">
            <Select name="language" defaultValue={mission.language}>
              <option value="python">Python</option>
              <option value="php">PHP</option>
              <option value="generic">共通</option>
            </Select>
          </Field>
          <Field label="問題文">
            <TextArea name="prompt" defaultValue={mission.prompt} required />
          </Field>
          <Field label="コード断片">
            <TextArea name="codeSnippet" defaultValue={mission.codeSnippet ?? ""} />
          </Field>
          <Field label="選択肢（改行区切り）">
            <TextArea name="choices" defaultValue={parseJsonList(mission.choicesJson).join("\n")} required />
          </Field>
          <Field label="正解">
            <TextInput name="correctAnswer" defaultValue={mission.correctAnswer} required />
          </Field>
          <Field label="解説">
            <TextArea name="explanation" defaultValue={mission.explanation} />
          </Field>
          <Field label="タグ">
            <TextInput name="tags" defaultValue={parseJsonList(mission.tagsJson).join(", ")} />
          </Field>
          <Field label="難易度">
            <Select name="difficulty" defaultValue={mission.difficulty}>
              <option value="easy">easy</option>
              <option value="normal">normal</option>
              <option value="hard">hard</option>
            </Select>
          </Field>
          <div className="flex gap-3 md:col-span-2">
            <RpgButton>保存</RpgButton>
            <RpgLink href="/admin/missions">戻る</RpgLink>
          </div>
        </form>
      </RpgWindow>
    </main>
  );
}
