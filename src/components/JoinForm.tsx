"use client";

import { useActionState } from "react";
import { joinSessionAction } from "@/app/actions/student";
import { Field, RpgButton, Select, TextInput } from "@/components/Rpg";

type AvailableSession = {
  joinCode: string;
  sessionTitle: string;
};

export function JoinForm({
  availableSessions,
  initialJoinCode
}: {
  availableSessions: AvailableSession[];
  initialJoinCode?: string;
}) {
  const [state, formAction, pending] = useActionState(joinSessionAction, undefined);
  const hasAvailableSessions = availableSessions.length > 0;
  const normalizedInitialJoinCode = initialJoinCode?.trim().toUpperCase();
  const selectedJoinCode = availableSessions.some(
    (session) => session.joinCode === normalizedInitialJoinCode
  )
    ? normalizedInitialJoinCode
    : undefined;

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="参加コード">
        <Select
          name="joinCode"
          disabled={!hasAvailableSessions || pending}
          defaultValue={selectedJoinCode ?? availableSessions[0]?.joinCode ?? ""}
          required
        >
          {hasAvailableSessions ? (
            availableSessions.map((session) => (
              <option key={session.joinCode} value={session.joinCode}>
                {session.sessionTitle}：#{session.joinCode}
              </option>
            ))
          ) : (
            <option value="">公開中のクエストなし</option>
          )}
        </Select>
      </Field>
      <Field label="名前">
        <TextInput
          name="displayName"
          autoComplete="name"
          disabled={!hasAvailableSessions || pending}
          maxLength={40}
          placeholder="名前"
          required
        />
      </Field>
      {!hasAvailableSessions ? (
        <p className="student-join-empty">
          今は参加できるクエストがありません。
        </p>
      ) : null}
      {state?.error ? <p className="text-sm font-bold text-rose-300">{state.error}</p> : null}
      <RpgButton disabled={!hasAvailableSessions || pending}>
        {pending ? "準備中..." : "クエスト開始"}
      </RpgButton>
    </form>
  );
}
