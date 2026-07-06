import { JoinForm } from "@/components/JoinForm";
import { RpgWindow } from "@/components/Rpg";

export default function JoinPage() {
  return (
    <main className="rpg-shell rpg-student-shell">
      <section className="rpg-hero rpg-student-hero">
        <div className="grid gap-3 text-center">
          <p className="text-sm font-bold text-yellow-300">IT基礎 理解確認クエスト</p>
          <h1 className="rpg-title">Code Quest Arena</h1>
          <p className="mx-auto max-w-2xl text-slate-200">
            講師から伝えられた参加コードと名前を入力して、今日のクエストを開始してください。
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-xl gap-4">
          <RpgWindow title="Join" className="rpg-student-join">
            <JoinForm />
          </RpgWindow>
        </div>
      </section>
    </main>
  );
}
