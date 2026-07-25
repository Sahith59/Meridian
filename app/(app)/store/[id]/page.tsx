"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Store as StoreIcon, UserRound } from "lucide-react";
import { statusFor } from "@/lib/orderStatus";
import StatusPill from "@/components/StatusPill";

type Order = {
  id: string;
  summary: string;
  customerId: string;
  storeId: string;
  createdAt: string;
  receipt: string;
};

export default function StoreOrderViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Same page-level gate as /store: order management is a staff tool, not
  // something a shopper browses. The API itself is unaffected by role.
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((body) => {
        if (body.role !== "staff") {
          router.push("/dashboard");
          return;
        }
        setStoreId(body.storeId ?? null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!storeId) return;
    setError(null);
    fetch(`/api/stores/${storeId}/orders/${id}`).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setOrder(null);
        setError(`${res.status}: ${body.error ?? "Could not load this order."}`);
        return;
      }
      setOrder(await res.json());
    });
  }, [storeId, id]);

  return (
    <div className="container wide">
      <a className="back-link" href="/store">
        <ArrowLeft size={15} /> Store
      </a>

      {error && <p className="error error-card">{error}</p>}

      {order && (
        <div className="viewer-layout">
          <div className="viewer-main">
            <div className="viewer-title-row">
              <div>
                <p className="eyebrow">Merchant record</p>
                <h2>Order {order.id}</h2>
              </div>
              <span className="row compact-row">
                <StatusPill status={statusFor(order.id)} />
                <span className="pill">{order.summary.split(" - ")[1]}</span>
              </span>
            </div>
            <div className="order-strip">
              <div>
                <UserRound size={16} />
                <span>Customer</span>
                <strong>{order.customerId}</strong>
              </div>
              <div>
                <StoreIcon size={16} />
                <span>Tenant</span>
                <strong>{order.storeId}</strong>
              </div>
              <div>
                <FileText size={16} />
                <span>Record</span>
                <strong>{order.id}</strong>
              </div>
            </div>
            <pre className="receipt">{order.receipt}</pre>
          </div>

          <div className="viewer-rail">
            <div className="rail-badge">Store workspace</div>
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
          </div>
        </div>
      )}
    </div>
  );
}
