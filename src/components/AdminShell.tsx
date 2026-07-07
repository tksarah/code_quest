import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";

type AdminNavKey = "dashboard" | "missions" | "quests";

const navItems: Array<{
  key?: AdminNavKey;
  href: string;
  label: string;
  target?: "_blank";
}> = [
  { key: "dashboard", href: "/admin", label: "ダッシュボード" },
  { key: "missions", href: "/admin/missions", label: "ミッション" },
  { key: "quests", href: "/admin/quests", label: "クエスト" },
  { href: "/join", label: "学生参加画面", target: "_blank" }
];

function AdminNavLinks({ active }: { active: AdminNavKey }) {
  return (
    <>
      {navItems.map((item) => (
        <Link
          className={`admin-nav-link ${item.key && item.key === active ? "is-active" : ""}`}
          href={item.href}
          key={item.href}
          rel={item.target ? "noopener noreferrer" : undefined}
          target={item.target}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logoutAction} className={compact ? "admin-mobile-logout" : "admin-logout"}>
      <button className="admin-nav-link admin-logout-button" type="submit">
        ログアウト
      </button>
    </form>
  );
}

export function AdminShell({
  active,
  actions,
  children,
  description,
  title
}: {
  active: AdminNavKey;
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: string;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="管理メニュー">
        <div className="admin-brand">
          <span className="admin-brand-kicker">Code Quest</span>
          <span className="admin-brand-title">Admin</span>
        </div>
        <nav className="admin-nav">
          <AdminNavLinks active={active} />
        </nav>
        <LogoutButton />
      </aside>

      <main className="admin-main">
        <nav className="admin-mobile-menu" aria-label="管理メニュー">
          <AdminNavLinks active={active} />
          <LogoutButton compact />
        </nav>

        <header className="admin-page-header">
          <div>
            <p className="admin-page-kicker">管理画面</p>
            <h1>{title}</h1>
            {description ? <p className="admin-page-description">{description}</p> : null}
          </div>
          {actions ? <div className="admin-page-actions">{actions}</div> : null}
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
