import { redirect } from "next/navigation";
import { Package, Store as StoreIcon } from "lucide-react";
import { getCurrentUserFromCookieStore } from "@/lib/session";
import { store } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { statusFor } from "@/lib/orderStatus";
import StatusPill from "@/components/StatusPill";

export default async function StorePage() {
  ensureSeeded();
  const user = await getCurrentUserFromCookieStore();
  if (!user) redirect("/login");
  // Order management is an internal tool, not something a shopper ever
  // sees - the page itself is gated the way a real store would gate it.
  // The API underneath (/api/stores/[storeId]/orders/[id]) is NOT gated by
  // role, which is deliberate: that route's bug is about the tenant check
  // being missing, independent of who's asking.
  if (user.role !== "staff") redirect("/dashboard");

  const home = store.stores.find((s) => s.id === user.storeId);
  const usersById = new Map(store.users.map((u) => [u.id, u]));
  const storeOrders = [...store.orders.filter((o) => o.storeId === user.storeId)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="container wide">
      <div className="page-head command-head">
        <div>
          <p className="eyebrow">Store</p>
          <h1>{home?.name ?? "No store"}</h1>
          <p className="page-sub">Staff order management for the active merchant workspace.</p>
        </div>
        <div className="head-note">
          <span>Store orders</span>
          <strong>{storeOrders.length}</strong>
        </div>
      </div>

      <div className="card tight table-card">
        <div className="table-toolbar">
          <div>
            <p className="section-title">Fulfillment queue</p>
            <h3>Merchant activity</h3>
          </div>
          <span className="doc-icon">
            <StoreIcon size={15} />
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {storeOrders.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No orders yet.</td>
              </tr>
            )}
            {storeOrders.map((o) => {
              const customer = usersById.get(o.customerId);
              return (
                <tr key={o.id} className="clickable">
                  <td>
                    <a href={`/store/${o.id}`} className="cell-title">
                      <span className="doc-icon">
                        <Package size={14} />
                      </span>
                      {o.summary}
                    </a>
                  </td>
                  <td>
                    <span className="row customer-chip">
                      <span className="avatar mini-avatar">
                        {(customer?.name ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="cell-meta">{customer?.name ?? o.customerId}</span>
                    </span>
                  </td>
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
      </div>
    </div>
  );
}
