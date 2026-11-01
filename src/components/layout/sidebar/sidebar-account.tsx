import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

type SidebarAccountProps = { onNavigate?: () => void };

export function SidebarAccount({ onNavigate }: SidebarAccountProps) {
  return (
    <div className="left-rail__footer">
      <div className="sidebar-auth-actions">
        <Link href="/sign-in" onNavigate={onNavigate}><LogIn size={16} /> Sign in</Link>
        <Link href="/sign-up" onNavigate={onNavigate}><UserPlus size={16} /> Create account</Link>
      </div>
      <div className="sidebar-legal">
        <Link href="/about" onNavigate={onNavigate}>About</Link>
        <Link href="/terms" onNavigate={onNavigate}>Terms</Link>
        <Link href="/privacy" onNavigate={onNavigate}>Privacy</Link>
        <span>© 2026 The Cartel</span>
      </div>
    </div>
  );
}
