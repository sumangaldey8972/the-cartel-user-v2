"use client";

import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import Link from "next/link";
import { Plus } from "lucide-react";
import { networkNavigation, primaryNavigation } from "./navigation";
import { SidebarAccount } from "./sidebar-account";
import { SidebarNav } from "./sidebar-nav";

type SidebarProps = {
  open?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`left-rail ${open ? "left-rail--open" : ""}`}>
      <div className="left-rail__brand"><BrandMark /></div>
      <nav className="primary-nav" aria-label="Primary navigation">
        <SidebarNav label="" items={primaryNavigation} pathname={pathname} onNavigate={onNavigate} />
        <SidebarNav label="The network" items={networkNavigation} pathname={pathname} spaced onNavigate={onNavigate} />
      </nav>
      <Link className="sidebar-post-action" href="/compose" onNavigate={onNavigate}>Post to the feed <Plus size={20} strokeWidth={2.5} /></Link>
      <SidebarAccount onNavigate={onNavigate} />
    </aside>
  );
}
