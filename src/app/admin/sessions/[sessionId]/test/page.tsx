import { AdminSessionTestClient } from "@/components/AdminSessionTestClient";
import { AdminShell } from "@/components/AdminShell";
import { RpgLink, RpgWindow } from "@/components/Rpg";
import { requireAdmin } from "@/lib/auth";
import { parseJsonList } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminSessionTestPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireAdmin();
  const { sessionId } = await params;
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
      }
    }
  });

  if (!session) notFound();

  return (
    <AdminShell
      active="sessions"
      actions={<RpgLink href={`/admin/sessions/${session.id}`}>セッション詳細</RpgLink>}
      description={`${session.quest.title} / ${session.status}`}
      title={`${session.title} テスト`}
    >
      {session.status === "closed" ? (
        <RpgWindow title="Test Unavailable">
          <div className="grid gap-3">
            <p className="admin-muted">
              終了済みセッションはテストできません。公開中または停止中のセッションでテストしてください。
            </p>
            <RpgLink href={`/admin/sessions/${session.id}`}>セッション詳細へ戻る</RpgLink>
          </div>
        </RpgWindow>
      ) : (
        <AdminSessionTestClient
          missions={session.quest.items.map((item) => ({
            missionId: item.missionId,
            title: item.mission.title,
            prompt: item.mission.prompt,
            codeSnippet: item.mission.codeSnippet,
            choices: parseJsonList(item.mission.choicesJson),
            correctAnswer: item.mission.correctAnswer,
            explanation: item.mission.explanation
          }))}
          questTitle={session.quest.title}
          sessionTitle={session.title}
        />
      )}
    </AdminShell>
  );
}
