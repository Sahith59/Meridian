import { Headphones, Home as HomeIcon, Shirt, Dumbbell, Mountain, Tag } from "lucide-react";
import type { CSSProperties } from "react";
import { store } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { categorySlug, gradientFor } from "@/lib/productVisual";

const CATEGORY_ICON: Record<string, typeof Tag> = {
  Electronics: Headphones,
  Home: HomeIcon,
  Apparel: Shirt,
  Fitness: Dumbbell,
  Outdoor: Mountain,
};

export default async function StorefrontPage() {
  ensureSeeded();

  return (
    <div className="container wide">
      <div className="page-head editorial-head">
        <div>
          <p className="eyebrow">New arrivals</p>
          <h1>Storefront</h1>
          <p className="page-sub">A public collection of essentials from Meridian merchants.</p>
        </div>
        <div className="head-note">
          <span>Public catalog</span>
          <strong>{store.products.length} items live</strong>
        </div>
      </div>

      <div className="product-grid">
        {store.products.map((p) => {
          const Icon = CATEGORY_ICON[p.category] ?? Tag;
          const slug = categorySlug(p.category);
          return (
            <div key={p.id} className={`product-card product-${slug}`}>
              <div className="product-tile" style={{ "--tile-bg": gradientFor(p.category) } as CSSProperties}>
                <span className="product-scene" />
                <Icon size={34} strokeWidth={1.5} />
              </div>
              <div className="product-body">
                <div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-code">{p.id.toUpperCase()}</div>
                </div>
                <div className="product-meta">
                  <span className="pill">{p.category}</span>
                  <span className="product-price">${p.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
