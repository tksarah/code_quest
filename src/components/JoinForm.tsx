"use client";

import { useActionState } from "react";
import { joinSessionAction } from "@/app/actions/student";
import { Field, RpgButton, TextInput } from "@/components/Rpg";

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinSessionAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="参加コード">
        <TextInput
          name="joinCode"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="例: ABC123"
          required
        />
      </Field>
      <Field label="表示名">
        <TextInput
          name="displayName"
          autoComplete="name"
          maxLength={40}
          placeholder="授業で呼ばれる名前"
          required
        />
      </Field>
      {state?.error ? <p className="text-sm font-bold text-rose-300">{state.error}</p> : null}
      <RpgButton>{pending ? "参加中..." : "クエストに参加"}</RpgButton>
    </form>
  );
}
