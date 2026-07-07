"use client";

import { FormEvent, useMemo, useState } from "react";
import { RpgButton, RpgWindow } from "@/components/Rpg";

export type AdminTestMission = {
  missionId: string;
  title: string;
  prompt: string;
  codeSnippet: string | null;
  choices: string[];
  correctAnswer: string;
  explanation: string;
};

export function AdminSessionTestClient({
  missions,
  questTitle,
  sessionTitle
}: {
  missions: AdminTestMission[];
  questTitle: string;
  sessionTitle: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const current = missions[currentIndex] ?? null;
  const currentAnswer = current ? answers[current.missionId] : undefined;
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () =>
      missions.filter((mission) => answers[mission.missionId] === mission.correctAnswer)
        .length,
    [answers, missions]
  );
  const progressPercent =
    missions.length === 0 ? 0 : Math.round((answeredCount / missions.length) * 100);

  function goToMission(index: number) {
    setCurrentIndex(index);
    setSelectedAnswer("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;

    const formData = new FormData(event.currentTarget);
    const answer = String(formData.get("answer") ?? "");
    if (!answer) return;

    setAnswers((previous) => ({
      ...previous,
      [current.missionId]: answer
    }));
    setSelectedAnswer("");
  }

  function resetTest() {
    setAnswers({});
    setCurrentIndex(0);
    setSelectedAnswer("");
  }

  if (!current) {
    return (
      <RpgWindow title="Test">
        <div className="admin-empty">
          <p>このセッションにはテストできるミッションがありません。</p>
        </div>
      </RpgWindow>
    );
  }

  const missionNumber = currentIndex + 1;
  const isAnswered = currentAnswer !== undefined;
  const isCorrect = currentAnswer === current.correctAnswer;
  const isLastMission = missionNumber >= missions.length;

  return (
    <div className="grid gap-6">
      <RpgWindow title="Test Status">
        <div className="grid gap-4">
          <div className="student-stat-grid">
            <div className="student-stat-card">
              <span className="student-stat-label">Session</span>
              <strong className="student-stat-value">{sessionTitle}</strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">Quest</span>
              <strong className="student-stat-value">{questTitle}</strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">Progress</span>
              <strong className="student-stat-value">
                {answeredCount}/{missions.length}
              </strong>
            </div>
            <div className="student-stat-card">
              <span className="student-stat-label">Correct</span>
              <strong className="student-stat-value student-stat-accent">
                {correctCount}
              </strong>
            </div>
          </div>
          <div className="student-progress-block">
            <div className="student-progress-meta">
              <span>テスト進捗</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="student-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <span
                className="student-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </RpgWindow>

      <RpgWindow className="student-mission-card" title={`Mission ${missionNumber}`}>
        <div className="grid gap-5">
          <div className="student-mission-header">
            <span className="student-step-token">Q{missionNumber}</span>
            <p className="student-mission-title">{current.title}</p>
          </div>

          <p className="student-prompt whitespace-pre-wrap">{current.prompt}</p>

          {current.codeSnippet ? (
            <pre className="rpg-code">
              <code>{current.codeSnippet}</code>
            </pre>
          ) : null}

          {isAnswered ? (
            <div className="grid gap-4">
              <div
                className={`student-feedback ${
                  isCorrect ? "student-feedback-correct" : "student-feedback-wrong"
                }`}
              >
                <p className="student-feedback-title">
                  {isCorrect ? "正解です" : "不正解です"}
                </p>
                <dl className="student-answer-summary">
                  <div>
                    <dt>選択した回答</dt>
                    <dd>{currentAnswer}</dd>
                  </div>
                  <div>
                    <dt>正解</dt>
                    <dd>{current.correctAnswer}</dd>
                  </div>
                </dl>
                <p className="leading-7">{current.explanation}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {currentIndex > 0 ? (
                  <RpgButton type="button" onClick={() => goToMission(currentIndex - 1)}>
                    前のミッション
                  </RpgButton>
                ) : null}
                {!isLastMission ? (
                  <RpgButton type="button" onClick={() => goToMission(currentIndex + 1)}>
                    次のミッション
                  </RpgButton>
                ) : (
                  <RpgButton type="button" onClick={resetTest}>
                    最初からテスト
                  </RpgButton>
                )}
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="student-choice-grid">
                {current.choices.map((choice, index) => (
                  <label className="student-choice" key={`${current.missionId}:${choice}`}>
                    <input
                      checked={selectedAnswer === choice}
                      name="answer"
                      onChange={() => setSelectedAnswer(choice)}
                      required
                      type="radio"
                      value={choice}
                    />
                    <span className="student-choice-marker">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="student-choice-text">{choice}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {currentIndex > 0 ? (
                  <RpgButton type="button" onClick={() => goToMission(currentIndex - 1)}>
                    前のミッション
                  </RpgButton>
                ) : null}
                <RpgButton>回答を確認</RpgButton>
              </div>
            </form>
          )}
        </div>
      </RpgWindow>
    </div>
  );
}
