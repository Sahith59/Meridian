import { redirect } from "next/navigation";
import { ArrowRight, Boxes, Package, ShieldCheck, ShoppingBag, Sparkles, Store as StoreIcon } from "lucide-react";
import { getCurrentUserFromCookieStore } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUserFromCookieStore();
  if (user) redirect("/dashboard");

  return (
    <main className="marketing-shell">
      <nav className="marketing-nav" aria-label="Primary">
        <a className="wordmark" href="/">
          <span className="brand-mark">
            <ShoppingBag size={18} />
          </span>
          Meridian
        </a>
        <div className="marketing-links">
          <a href="/storefront">Catalog</a>
          <a href="/login">Log in</a>
          <a className="btn btn-sm" href="/signup">
            Join Meridian
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Independent commerce, beautifully tracked</p>
          <h1>Order care for stores with a point of view.</h1>
          <p className="lead">
            Meridian gives shoppers, operators, and store teams one refined place to review purchases,
            follow receipts, and keep boutique commerce moving with confidence.
          </p>
          <div className="row">
            <a className="btn" href="/storefront">
              Browse collection <ArrowRight size={16} />
            </a>
            <a className="btn secondary" href="/login">
              Member login
            </a>
          </div>
          <div className="hero-proof">
            <span>11 active orders</span>
            <span>2 partner stores</span>
            <span>Same-day support desk</span>
          </div>
        </div>

        <div className="hero-board" aria-label="Meridian activity snapshot">
          <div className="board-top">
            <span className="doc-icon warm">
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Live order desk</strong>
              <p>Curated fulfillment snapshot</p>
            </div>
          </div>
          <div className="board-card primary">
            <span>Northwind Traders</span>
            <strong>$620.52</strong>
            <small>weekly order volume</small>
          </div>
          <div className="board-grid">
            <div>
              <Boxes size={18} />
              <strong>8</strong>
              <span>Northwind orders</span>
            </div>
            <div>
              <StoreIcon size={18} />
              <strong>3</strong>
              <span>Bluebird orders</span>
            </div>
          </div>
          <div className="board-line">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <div className="card feature-card">
          <span className="doc-icon">
            <Package size={16} />
          </span>
          <h3>Private order library</h3>
          <p>Every customer sees their purchases, receipts, delivery notes, and order state in one calm workspace.</p>
        </div>
        <div className="card feature-card">
          <span className="doc-icon">
            <StoreIcon size={16} />
          </span>
          <h3>Store operations</h3>
          <p>Store teams get a clean desk for recent activity, customer context, and fulfillment rhythm.</p>
        </div>
        <div className="card feature-card">
          <span className="doc-icon">
            <ShieldCheck size={16} />
          </span>
          <h3>Account controls</h3>
          <p>Members can update profile details while staff keep a close eye on commerce-wide workflows.</p>
        </div>
      </section>
    </main>
  );
}
