import { JoinForm } from "@/components/JoinForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JoinPage() {
  const availableSessions = await prisma.session.findMany({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
    select: {
      joinCode: true,
      title: true
    }
  });

  return (
    <main className="rpg-shell rpg-student-shell student-quest">
      <section className="rpg-hero student-hero student-lobby">
        <div className="student-hero-copy text-center">
          <p className="student-badge mx-auto">IT基礎 理解確認クエスト</p>
          <h1 className="rpg-title student-main-title">Code Quest Arena</h1>
          <p className="student-lead mx-auto">
            参加するクエストを選び、名前を入力して、今日のクエストを開始してください。
          </p>
        </div>

        <div className="student-join-panel">
          <div className="student-panel-heading">
            <h2>Quest Board</h2>
          </div>
          <JoinForm
            availableSessions={availableSessions.map((session) => ({
              joinCode: session.joinCode,
              sessionTitle: session.title
            }))}
          />
        </div>
      </section>
    </main>
  );
}
