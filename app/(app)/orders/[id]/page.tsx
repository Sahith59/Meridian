"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, ShieldCheck, Truck } from "lucide-react";
import { statusFor } from "@/lib/orderStatus";
import StatusPill from "@/components/StatusPill";

type Order = {
  id: string;
  summary: string;
  note: string;
  customerId: string;
  storeId: string;
  createdAt: string;
  receipt: string;
  receiptPath?: string;
};

export default function OrderViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setOrder(null);
      setError(`${res.status}: ${body.error ?? "Could not load this order."}`);
      return;
    }
    const body = (await res.json()) as Order;
    setOrder(body);
    setNote(body.note);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveNote() {
    setBusy(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setBusy(false);
    if (res.ok) load();
  }

  async function cancelOrder() {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/orders");
  }

  return (
    <div className="container wide">
      <a className="back-link" href="/orders">
        <ArrowLeft size={15} /> My Orders
      </a>

      {error && (
        <div className="card error-card">
          <p className="error">{error}</p>
        </div>
      )}

      {order && (
        <div className="viewer-layout">
          <div className="viewer-main">
            <div className="viewer-title-row">
              <div>
                <p className="eyebrow">Order record</p>
                <h2>Order {order.id}</h2>
              </div>
              <span className="row compact-row">
                <StatusPill status={statusFor(order.id)} />
                <span className="pill">{order.summary.split(" - ")[1]}</span>
              </span>
            </div>

            <div className="order-strip">
              <div>
                <Truck size={16} />
                <span>Fulfillment</span>
                <strong>{statusFor(order.id)}</strong>
              </div>
              <div>
                <FileText size={16} />
                <span>Receipt</span>
                <strong>{order.receiptPath ?? "Attached"}</strong>
              </div>
              <div>
                <ShieldCheck size={16} />
                <span>Session</span>
                <strong>Signed cookie</strong>
              </div>
            </div>

            <div className="note-field">
              <label htmlFor="note">Delivery note</label>
              <input
                id="note"
                type="text"
                placeholder="e.g. Leave at the front door"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <pre className="receipt">{order.receipt}</pre>
          </div>

          <div className="viewer-rail">
            <div className="rail-badge">Private order</div>
            <div className="rail-field">
              <div className="rail-label">Customer</div>
              <div className="rail-value">{order.customerId}</div>
            </div>
            <div className="rail-field">
              <div className="rail-label">Store</div>
              <div className="rail-value">{order.storeId}</div>
            </div>
            <div className="rail-field">
              <div className="rail-label">Order id</div>
              <div className="rail-value mono">{order.id}</div>
            </div>

            <div className="rail-actions">
              <button onClick={saveNote} disabled={busy}>
                Save note
              </button>
              <button className="danger" onClick={cancelOrder} disabled={busy}>
                Cancel order
              </button>
              <a className="btn secondary" href={`/api/orders/${id}/receipt`} target="_blank" rel="noreferrer">
                Receipt link (no login required)
              </a>
              <a className="btn secondary" href={`/api/orders/${id}/invoice`} target="_blank" rel="noreferrer">
                Invoice (login required)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
