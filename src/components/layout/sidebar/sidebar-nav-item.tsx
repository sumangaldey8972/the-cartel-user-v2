import Link from "next/link";
import type { NavigationItem } from "./navigation";
import { isRouteActive } from "./navigation";

type SidebarNavItemProps = {
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
};

export function SidebarNavItem({ item, pathname, onNavigate }: SidebarNavItemProps) {
  const active = isRouteActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`nav-item ${active ? "nav-item--active" : ""} ${item.ai ? "nav-item--ai" : ""}`}
      aria-current={active ? "page" : undefined}
      onNavigate={onNavigate}
    >
      <Icon size={19} strokeWidth={1.8} />
      <span>{item.label}</span>
      {item.badge && <span className={`nav-badge nav-badge--${item.badgeTone ?? "count"}`}>{item.badge}</span>}
    </Link>
  );
}
