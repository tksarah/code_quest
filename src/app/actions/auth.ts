"use server";

import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  _previousState: { error?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const ok = user && user.isActive && (await verifyPassword(password, user.passwordHash));

  if (!ok) {
    await prisma.auditLog.create({
      data: {
        action: "admin.login_failed",
        targetType: "AdminUser",
        detail: email
      }
    });
    return { error: "ログイン情報が正しくありません。" };
  }

  await createAdminSession(user.id);
  await prisma.auditLog.create({
    data: {
      adminUserId: user.id,
      action: "admin.login",
      targetType: "AdminUser",
      targetId: user.id
    }
  });
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
