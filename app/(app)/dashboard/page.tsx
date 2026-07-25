import { redirect } from "next/navigation";
import { ArrowRight, Package, ReceiptText, Store as StoreIcon, UsersRound, WalletCards } from "lucide-react";
import { getCurrentUserFromCookieStore } from "@/lib/session";
import { store } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { ordersByWeek } from "@/lib/chart";
import { statusFor } from "@/lib/orderStatus";
import BarChart from "@/components/BarChart";
import StatusPill from "@/components/StatusPill";

function orderTotal(summary: string): number {
  return Number(summary.split("$")[1] ?? 0);
}

export default async function DashboardPage() {
  ensureSeeded();
  const user = await getCurrentUserFromCookieStore();
  if (!user) redirect("/login");

  const home = store.stores.find((s) => s.id === user.storeId);
  const isStaff = user.role === "staff";

  // Customers only ever see their OWN orders and spend here - a real store
  // never shows a shopper store-wide numbers. Staff get the store-wide view
  // (member count, total revenue, a weekly trend, everyone's recent orders),
  // which is a legitimate internal reporting view for their own store only.
  const myOrders = store.orders.filter((o) => o.customerId === user.id);
  const mySpend = myOrders.reduce((sum, o) => sum + orderTotal(o.summary), 0);

  const storeOrders = store.orders.filter((o) => o.storeId === user.storeId);
  const teammateCount = store.users.filter((u) => u.storeId === user.storeId).length;
  const storeRevenue = storeOrders.reduce((sum, o) => sum + orderTotal(o.summary), 0);

  const scopedOrders = isStaff ? storeOrders : myOrders;
  const recent = [...scopedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const usersById = new Map(store.users.map((u) => [u.id, u]));
  const chartData = ordersByWeek(scopedOrders);

  return (
    <div className="container wide">
      <div className="page-head command-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome back, {user.name}</h1>
          <p className="page-sub">{home?.name ?? "No store"} order desk and account activity.</p>
        </div>
        <div className="head-note">
          <span>{isStaff ? "Operator session" : "Customer session"}</span>
          <strong>{user.id}</strong>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <ReceiptText size={18} />
          <div className="stat-label">Your orders</div>
          <div className="stat-value">{myOrders.length}</div>
        </div>
        <div className="stat-card gold">
          <WalletCards size={18} />
          <div className="stat-label">Your spend</div>
          <div className="stat-value">${mySpend.toFixed(0)}</div>
        </div>
        {isStaff && (
          <>
            <div className="stat-card">
              <UsersRound size={18} />
              <div className="stat-label">Store members</div>
              <div className="stat-value">{teammateCount}</div>
            </div>
            <div className="stat-card info">
              <StoreIcon size={18} />
              <div className="stat-label">Store revenue</div>
              <div className="stat-value">${storeRevenue.toFixed(0)}</div>
            </div>
          </>
        )}
      </div>

      <div className="workspace-grid">
        <section className="card analytics-card">
          <div className="card-kicker">Order cadence</div>
          <h3>Weekly movement{isStaff ? ` at ${home?.name ?? "your store"}` : ""}</h3>
          <BarChart data={chartData} />
        </section>

        <section className="card action-card">
          <div className="card-kicker">Next step</div>
          <h3>{isStaff ? "Review store queue" : "Open your receipts"}</h3>
          <p className="hint">
            {isStaff
              ? "Monitor recent orders, customer handoffs, and internal fulfillment state."
              : "Check receipts, delivery notes, and protected invoice access from your account."}
          </p>
          <a className="btn" href={isStaff ? "/store" : "/orders"}>
            Continue <ArrowRight size={15} />
          </a>
        </section>
      </div>

      <section className="card tight table-card">
        <div className="table-toolbar">
          <div>
            <p className="section-title">{isStaff ? `Recent at ${home?.name ?? "your store"}` : "Your recent orders"}</p>
            <h3>Activity feed</h3>
          </div>
          <a className="btn secondary btn-sm" href="/orders">
            View all
          </a>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              {isStaff && <th>Customer</th>}
              <th>Status</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr className="empty-row">
                <td colSpan={isStaff ? 4 : 3}>No orders yet.</td>
              </tr>
            )}
            {recent.map((o) => {
              const customer = usersById.get(o.customerId);
              const href = o.customerId === user.id ? `/orders/${o.id}` : `/store/${o.id}`;
              return (
                <tr key={o.id} className="clickable">
                  <td>
                    <a href={href} className="cell-title">
                      <span className="doc-icon">
                        <Package size={14} />
                      </span>
                      {o.summary}
                    </a>
                  </td>
                  {isStaff && (
                    <td>
                      <span className="cell-meta">{customer?.name ?? o.customerId}</span>
                    </td>
                  )}
                  <td>
                    <StatusPill status={statusFor(o.id)} />
                  </td>
                  <td>
                    <span className="cell-meta">{new Date(o.createdAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="row page-actions">
        <a className="btn" href="/orders">
          Go to My Orders
        </a>
        {isStaff && (
          <a className="btn secondary" href="/store">
            Go to Store
          </a>
        )}
      </p>
    </div>
  );
}
