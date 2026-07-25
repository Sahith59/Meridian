"use client";

// Deliberately reachable by ANY logged-in customer, not just staff - the
// sidebar link (components/Sidebar.tsx) is shown to everyone too. This
// mirrors how a real BFLA bug is usually found: nothing hides the door, and
// nothing checks who walks through it.

import { useEffect, useState } from "react";
import { Package, ShieldAlert } from "lucide-react";
import { statusFor } from "@/lib/orderStatus";
import StatusPill from "@/components/StatusPill";

type OrderRow = { id: string; summary: string; customerId: string; storeId: string };

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setOrders(null);
    fetch("/api/admin/orders").then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(`${res.status}: ${body.error ?? "Could not load the admin order list."}`);
        return;
      }
      const body = await res.json();
      setOrders(body.orders);
    });
  }, []);

  return (
    <div className="container wide">
      <div className="page-head command-head danger-head">
        <div>
          <p className="eyebrow">Admin console</p>
          <h1>All orders</h1>
          <p className="page-sub">Privileged order visibility across every customer and store.</p>
        </div>
        <div className="head-note">
          <span>Privileged route</span>
          <strong>/api/admin/orders</strong>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {orders && (
        <div className="card tight table-card">
          <div className="table-toolbar">
            <div>
              <p className="section-title">Administration</p>
              <h3>Global order register</h3>
            </div>
            <span className="doc-icon alert">
              <ShieldAlert size={15} />
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Status</th>
                <th>Id</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className="cell-title">
                      <span className="doc-icon">
                        <Package size={14} />
                      </span>
                      {o.summary}
                    </span>
                  </td>
                  <td>
                    <span className="cell-meta">{o.customerId}</span>
                  </td>
                  <td>
                    <span className="pill">{o.storeId}</span>
                  </td>
                  <td>
                    <StatusPill status={statusFor(o.id)} />
                  </td>
                  <td>
                    <span className="cell-id">{o.id}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
