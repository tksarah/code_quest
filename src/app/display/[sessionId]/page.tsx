import { notFound } from "next/navigation";
import { RankingAutoRefresh } from "@/components/RankingAutoRefresh";
import { RpgWindow } from "@/components/Rpg";
import { buildScoreHistogram, summarizeScores } from "@/lib/domain";
import type { RankingEntry } from "@/lib/domain";
import { getSessionDashboard } from "@/lib/session-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatScore(value: number | null) {
  if (value === null) return "-";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

type RankingScoreKey = "totalScore" | "baseScore" | "timeBonus";

type ScoreRankingEntry = {
  entry: RankingEntry;
  rank: number;
  score: number;
};

const TOP_RANKING_LIMIT = 8;

function completedDuration(entry: RankingEntry) {
  return entry.completedDurationMs ?? Number.MAX_SAFE_INTEGER;
}

function compareRankingEntry(a: RankingEntry, b: RankingEntry, scoreKey: RankingScoreKey) {
  if (b[scoreKey] !== a[scoreKey]) return b[scoreKey] - a[scoreKey];

  if (scoreKey === "baseScore") {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (completedDuration(a) !== completedDuration(b)) {
      return completedDuration(a) - completedDuration(b);
    }
  }

  if (scoreKey === "timeBonus") {
    if (completedDuration(a) !== completedDuration(b)) {
      return completedDuration(a) - completedDuration(b);
    }
    if (b.baseScore !== a.baseScore) return b.baseScore - a.baseScore;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  }

  if (scoreKey === "totalScore") {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (completedDuration(a) !== completedDuration(b)) {
      return completedDuration(a) - completedDuration(b);
    }
    if (a.averageResponseTimeMs !== b.averageResponseTimeMs) {
      return a.averageResponseTimeMs - b.averageResponseTimeMs;
    }
  }

  return a.displayName.localeCompare(b.displayName, "ja");
}

function buildTopRanking(entries: RankingEntry[], scoreKey: RankingScoreKey): ScoreRankingEntry[] {
  return [...entries]
    .sort((a, b) => compareRankingEntry(a, b, scoreKey))
    .slice(0, TOP_RANKING_LIMIT)
    .map((entry, index) => ({
      entry,
      rank: index + 1,
      score: entry[scoreKey]
    }));
}

function medalImage(rank: number) {
  if (rank === 1) return { alt: "1位", src: "/medals/medal-gold.png" };
  if (rank === 2) return { alt: "2位", src: "/medals/medal-silver.png" };
  if (rank === 3) return { alt: "3位", src: "/medals/medal-bronze.png" };
  return null;
}

export default async function PublicRankingDisplayPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const data = await getSessionDashboard(sessionId);
  if (!data) notFound();

  const { session, ranking } = data;
  if (session.status !== "running") notFound();

  const completedRanking = ranking.filter((entry) => entry.completedAt);
  const completedCount = completedRanking.length;
  const completedScores = completedRanking.map((entry) => entry.totalScore);
  const scoreSummary = summarizeScores(completedScores);
  const scoreHistogram = buildScoreHistogram(completedScores, {
    maxScore: session.quest.maxScore,
    timeBonusMaxScore: session.quest.timeBonusMaxScore
  });
  const rankingBoards = [
    {
      title: "Total Score",
      scoreLabel: "Total",
      entries: buildTopRanking(completedRanking, "totalScore")
    },
    {
      title: "Quest Score",
      scoreLabel: "Quest",
      entries: buildTopRanking(completedRanking, "baseScore")
    },
    {
      title: "Time Bonus",
      scoreLabel: "Time",
      entries: buildTopRanking(completedRanking, "timeBonus")
    }
  ];
  const completionPercent =
    ranking.length === 0 ? 0 : Math.round((completedCount / ranking.length) * 100);

  return (
    <main className="rpg-shell student-quest student-display-page grid gap-6">
      <RankingAutoRefresh />

      <header className="rpg-hero student-hero text-center">
        <div className="student-hero-copy">
          <p className="student-badge mx-auto">参加コード {session.joinCode}</p>
          <h1 className="rpg-title student-section-title">Ranking Board</h1>
          <p className="student-lead mx-auto">{session.quest.title}</p>
        </div>
      </header>

      {!session.showRanking ? (
        <RpgWindow title="Stand By">
          <div className="grid gap-3 text-center">
            <p className="student-feedback-title text-center">ランキング準備中</p>
            <p className="text-center text-lg font-bold">
              ランキングはまだ公開されていません。
            </p>
          </div>
        </RpgWindow>
      ) : (
        <>
          <section className="student-display-stats" aria-label="セッション状況">
            <div className="student-stat-card">
              <span className="student-stat-label">参加者</span>
              <strong className="student-stat-value student-stat-accent">
                {ranking.length}
              </strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">完了者</span>
              <strong className="student-stat-value">{completedCount}</strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">平均点</span>
              <strong className="student-stat-value">
                {formatScore(scoreSummary.averageScore)}
              </strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">最小値</span>
              <strong className="student-stat-value">
                {formatScore(scoreSummary.minScore)}
              </strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">最大値</span>
              <strong className="student-stat-value">
                {formatScore(scoreSummary.maxScore)}
              </strong>
            </div>
          </section>

          <RpgWindow title="Score Distribution">
            {completedScores.length === 0 ? (
              <p className="student-empty">まだ完了者はいません。</p>
            ) : (
              <div className="student-score-histogram" aria-label="完了者の得点分布">
                {scoreHistogram.map((bucket) => (
                  <div
                    className="student-histogram-column"
                    key={`${bucket.minScore}-${bucket.maxScore}`}
                  >
                    <span className="student-histogram-count">{bucket.count}人</span>
                    <span className="student-histogram-track" aria-hidden="true">
                      <span
                        className="student-histogram-bar"
                        style={{ height: `${bucket.barPercent}%` }}
                      />
                    </span>
                    <span className="student-histogram-label">
                      {bucket.minScore}-{bucket.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </RpgWindow>

          <RpgWindow title="Completion">
            <div className="student-progress-block">
              <div className="student-progress-meta">
                <span>完了率</span>
                <span>{completionPercent}%</span>
              </div>
              <div
                className="student-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercent}
              >
                <span
                  className="student-progress-bar"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </RpgWindow>

          <RpgWindow title="Top 8">
            <div className="student-rank-board-grid">
              {rankingBoards.map((board) => (
                <section className="student-rank-board" key={board.title}>
                  <h3 className="student-rank-board-title">{board.title}</h3>
                  <ol className="student-rank-list">
                    {board.entries.map(({ entry, rank, score }) => {
                      const medal = medalImage(rank);
                      return (
                        <li className="student-rank-row" key={entry.participantId}>
                          <span className="student-rank-place">
                            {medal ? (
                              <img
                                alt={medal.alt}
                                className="student-rank-medal"
                                height={128}
                                src={medal.src}
                                width={128}
                              />
                            ) : (
                              <span className="student-rank-number">{rank}位</span>
                            )}
                          </span>
                          <span className="student-rank-name">{entry.displayName}</span>
                          <span className="student-rank-score">
                            <span>{board.scoreLabel}</span>
                            <strong>{score} pt</strong>
                          </span>
                        </li>
                      );
                    })}
                    {board.entries.length === 0 ? (
                      <li className="student-empty">まだ完了者はいません。</li>
                    ) : null}
                  </ol>
                </section>
              ))}
            </div>
          </RpgWindow>
        </>
      )}
    </main>
  );
}
