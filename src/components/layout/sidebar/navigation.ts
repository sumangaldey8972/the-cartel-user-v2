import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Compass,
  Home,
  MessageSquareText,
  Newspaper,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  ai?: boolean;
  badge?: string;
  badgeTone?: "count" | "label";
};

export const primaryNavigation: NavigationItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Notifications", href: "/notifications", icon: Bell, badge: "3", badgeTone: "count" },
  { label: "Saved", href: "/saved", icon: Bookmark },
];

export const networkNavigation: NavigationItem[] = [
  { label: "Publishers", href: "/publishers", icon: Newspaper },
  { label: "Advertisers", href: "/advertisers", icon: BriefcaseBusiness },
  { label: "Consult with us", href: "/consult", icon: MessageSquareText },
  { label: "Cartel AI", href: "/cartel-ai", icon: Sparkles, ai: true, badge: "BETA", badgeTone: "label" },
];

export const mobileNavigation: NavigationItem[] = [
  primaryNavigation[0],
  primaryNavigation[1],
  { label: "Create", href: "/compose", icon: Sparkles },
  primaryNavigation[2],
  { label: "Profile", href: "/profile", icon: UserRound },
];

export function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
