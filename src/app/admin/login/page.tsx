import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { RpgLink, RpgWindow } from "@/components/Rpg";
import { getCurrentAdmin } from "@/lib/auth";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="rpg-shell">
      <section className="rpg-hero mx-auto grid max-w-xl gap-6">
        <div>
          <p className="text-sm font-bold text-yellow-300">Teacher Gate</p>
          <h1 className="rpg-title text-4xl md:text-6xl">Admin</h1>
        </div>
        <RpgWindow title="Login">
          <LoginForm />
        </RpgWindow>
        <RpgLink href="/join">学生参加画面へ</RpgLink>
      </section>
    </main>
  );
}
