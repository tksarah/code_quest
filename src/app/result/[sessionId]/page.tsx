import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RpgLink, RpgWindow } from "@/components/Rpg";
import { scoreParticipant } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function participantCookieName(sessionId: string) {
  return `cqa_p_${sessionId}`;
}

export default async function ResultPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const participantId = cookieStore.get(participantCookieName(sessionId))?.value;
  if (!participantId) redirect("/join");

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      quest: {
        include: {
          items: { orderBy: { order: "asc" } }
        }
      },
      participants: true,
      responses: true
    }
  });

  if (!session) redirect("/join");
  const totalQuestions = session.quest.items.length;
  const participant = session.participants.find((entry) => entry.id === participantId);
  if (!participant) redirect("/join");

  const myResponses = session.responses.filter(
    (response) => response.participantId === participantId
  );
  const result = scoreParticipant({
    participant,
    responses: myResponses,
    quest: session.quest
  });

  return (
    <main className="rpg-shell grid gap-6">
      <header className="rpg-hero text-center">
        <p className="text-sm font-bold text-yellow-300">Quest Clear</p>
        <h1 className="rpg-title text-4xl md:text-6xl">Quest Clear</h1>
      </header>

      <div className="mx-auto grid w-full max-w-xl">
        <RpgWindow title="Your Result" className="text-lg">
          <dl className="grid gap-4">
            <div className="flex justify-between gap-4">
              <dt>スコア</dt>
              <dd className="font-black text-yellow-300">{result.totalScore}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>正答数</dt>
              <dd>
                {result.correctCount}/{totalQuestions}
              </dd>
            </div>
          </dl>
        </RpgWindow>
      </div>

      <div className="flex justify-center">
        <RpgLink href="/join">Code Quest Arena ホームへ</RpgLink>
      </div>
    </main>
  );
}
