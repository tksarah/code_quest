"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { RpgButton, Field, TextInput } from "@/components/Rpg";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="メールアドレス">
        <TextInput name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="パスワード">
        <TextInput
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {state?.error ? <p className="text-sm font-bold text-rose-300">{state.error}</p> : null}
      <RpgButton>{pending ? "ログイン中..." : "管理画面へ"}</RpgButton>
    </form>
  );
}
