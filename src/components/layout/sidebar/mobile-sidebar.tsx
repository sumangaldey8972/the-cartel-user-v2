"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { isRouteActive, mobileNavigation } from "./navigation";
import { Sidebar } from "./sidebar";

export function ResponsiveSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <>
      <header className="mobile-header">
        <BrandMark />
        <div className="mobile-header__actions">
          <button className="icon-button" aria-label="Search"><Search size={19} /></button>
          <button className="icon-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <Sidebar open={open} onNavigate={close} />
      {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={close} />}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "mobile-nav__active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={19} /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
