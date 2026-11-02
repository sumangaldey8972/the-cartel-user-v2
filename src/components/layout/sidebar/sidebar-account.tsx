"use client";

import { LogIn, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiClientError, apiRequest } from "@/lib/api";

type SidebarAccountProps = { onNavigate?: () => void };

type SidebarUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  roles: string[];
};

type CurrentUserResponse = { data: { user: SidebarUser } };

function initials(user: SidebarUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}

function roleLabel(roles: string[]) {
  return roles.map((role) => role.charAt(0) + role.slice(1).toLowerCase()).join(" · ");
}

export function SidebarAccount({ onNavigate }: SidebarAccountProps) {
  const router = useRouter();
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const response = await apiRequest<CurrentUserResponse>(API_ENDPOINTS.AUTH.CURRENT_USER, { signal: controller.signal });
        setUser(response.data.user);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        if (!(requestError instanceof ApiClientError) || requestError.code !== "AUTHENTICATION_REQUIRED") {
          setError("Account status is temporarily unavailable.");
        }
        setUser(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCurrentUser();
    return () => controller.abort();
  }, []);

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await apiRequest(API_ENDPOINTS.AUTH.SIGN_OUT, { method: "POST" });
      setUser(null);
      onNavigate?.();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="left-rail__footer">
      {loading ? (
        <div className="sidebar-account-loading" aria-label="Loading account" aria-busy="true">
          <span />
          <div><span /><span /></div>
        </div>
      ) : user ? (
        <div className="sidebar-account-panel">
          <div className="account-preview">
            <span className="account-preview__avatar" aria-hidden="true">{initials(user)}</span>
            <span className="account-preview__identity">
              <strong>{user.firstName} {user.lastName}</strong>
              <small>@{user.username}</small>
              <small className="account-preview__email">{user.email}</small>
              <em>{roleLabel(user.roles)}</em>
            </span>
          </div>
          <button className="sidebar-signout" type="button" onClick={signOut} disabled={signingOut}>
            <LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : (
        <div className="sidebar-auth-actions">
          <Link href="/sign-in" onNavigate={onNavigate}><LogIn size={16} /> Sign in</Link>
          <Link href="/sign-up" onNavigate={onNavigate}><UserPlus size={16} /> Create account</Link>
        </div>
      )}
      {error && <p className="sidebar-account-error" role="status">{error}</p>}
      <div className="sidebar-legal">
        <Link href="/about" onNavigate={onNavigate}>About</Link>
        <Link href="/terms" onNavigate={onNavigate}>Terms</Link>
        <Link href="/privacy" onNavigate={onNavigate}>Privacy</Link>
        <span>© 2026 The Cartel</span>
      </div>
    </div>
  );
}
