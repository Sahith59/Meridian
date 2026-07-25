"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Store as StoreIcon,
  ShieldAlert,
  Settings,
  LogOut,
  ShoppingBag,
  Compass,
} from "lucide-react";

export type NavUser = {
  id: string;
  name: string;
  role: "customer" | "staff";
} | null;

const SHOP_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/storefront", label: "Storefront", icon: Compass },
  { href: "/orders", label: "My Orders", icon: Package },
];

// "Store Activity" is an internal order-management view - real stores never
// let a customer browse it, so it's only ever shown to staff. "Admin
// Console" stays visible to everyone on purpose: it's the BFLA
// demonstration, and the whole point is that nothing in the UI hides the
// door - see app/(app)/admin/page.tsx.
const STAFF_ONLY_LINKS = [{ href: "/store", label: "Store Activity", icon: StoreIcon }];
const STORE_LINKS = [{ href: "/admin", label: "Admin Console", icon: ShieldAlert }];

const ACCOUNT_LINKS = [{ href: "/settings", label: "Settings", icon: Settings }];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Group({
  label,
  links,
  pathname,
}: {
  label: string;
  links: typeof SHOP_LINKS;
  pathname: string;
}) {
  return (
    <div className="sidebar-group">
      <div className="sidebar-group-label">{label}</div>
      {links.map(({ href, label: linkLabel, icon: Icon }) => (
        <Link key={href} href={href} className={"sidebar-link" + (pathname === href ? " active" : "")}>
          <Icon size={16} />
          {linkLabel}
        </Link>
      ))}
    </div>
  );
}

export default function Sidebar({ user }: { user: NavUser }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand">
        <span className="brand-mark">
          <ShoppingBag size={16} />
        </span>
        Meridian
      </Link>

      {user ? (
        <>
          <nav className="sidebar-nav">
            <Group label="Shop" links={SHOP_LINKS} pathname={pathname} />
            <Group
              label="Store"
              links={user.role === "staff" ? [...STAFF_ONLY_LINKS, ...STORE_LINKS] : STORE_LINKS}
              pathname={pathname}
            />
            <Group label="Account" links={ACCOUNT_LINKS} pathname={pathname} />
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user-row">
              <span className="avatar">{initials(user.name)}</span>
              <span className="sidebar-user-info">
                <strong>{user.name}</strong>
                {user.role === "staff" && <span className="badge admin">Staff</span>}
              </span>
            </div>
            <button className="sidebar-logout" onClick={logout}>
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </>
      ) : (
        <div className="sidebar-nav">
          <div className="sidebar-group">
            <Link href="/storefront" className="sidebar-link">
              <Compass size={16} />
              Storefront
            </Link>
            <Link href="/login" className="sidebar-link">
              Log in
            </Link>
            <Link href="/signup" className="sidebar-join">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
