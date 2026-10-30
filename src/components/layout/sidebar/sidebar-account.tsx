import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

type SidebarAccountProps = { onNavigate?: () => void };

export function SidebarAccount({ onNavigate }: SidebarAccountProps) {
  return (
    <div className="left-rail__footer">
      <Link className="account-preview" href="/profile" onNavigate={onNavigate}>
        <span className="account-preview__avatar">SD</span>
        <span><strong>Suman Dey</strong><small>@sumandey</small></span>
        <MoreHorizontal size={17} />
      </Link>
      <div className="sidebar-legal">
        <Link href="/about" onNavigate={onNavigate}>About</Link>
        <Link href="/terms" onNavigate={onNavigate}>Terms</Link>
        <Link href="/privacy" onNavigate={onNavigate}>Privacy</Link>
        <span>© 2026 The Cartel</span>
      </div>
    </div>
  );
}
