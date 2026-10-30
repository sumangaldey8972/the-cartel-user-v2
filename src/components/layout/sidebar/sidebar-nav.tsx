import type { NavigationItem } from "./navigation";
import { SidebarNavItem } from "./sidebar-nav-item";

type SidebarNavProps = {
  label: string;
  items: NavigationItem[];
  pathname: string;
  spaced?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ label, items, pathname, spaced = false, onNavigate }: SidebarNavProps) {
  return (
    <div>
      {label && <p className={`nav-label ${spaced ? "nav-label--spaced" : ""}`}>{label}</p>}
      {items.map((item) => (
        <SidebarNavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
