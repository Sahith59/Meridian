import { Headphones, Home as HomeIcon, Shirt, Dumbbell, Mountain, Tag } from "lucide-react";
import type { CSSProperties } from "react";
import { store } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { categorySlug, gradientFor, imageForProduct } from "@/lib/productVisual";

const CATEGORY_ICON: Record<string, typeof Tag> = {
  Electronics: Headphones,
  Home: HomeIcon,
  Apparel: Shirt,
  Fitness: Dumbbell,
  Outdoor: Mountain,
};

export default async function StorefrontPage() {
  ensureSeeded();
  const featured = store.products[0];

  return (
    <div className="container wide">
      <div className="page-head editorial-head storefront-head">
        <div>
          <p className="eyebrow">New arrivals</p>
          <h1>Storefront</h1>
          <p className="page-sub">A curated public shelf of everyday goods from Meridian merchants.</p>
        </div>
        {featured && (
          <div className="storefront-feature">
            <img src={imageForProduct(featured.id)} alt={featured.name} />
            <div>
              <span>Featured drop</span>
              <strong>{featured.name}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="catalog-toolbar">
        <div>
          <span>Public catalog</span>
          <strong>{store.products.length} items live</strong>
        </div>
        <p>Fast-moving merchandise staged for customer browsing.</p>
      </div>

      <div className="product-grid">
        {store.products.map((p) => {
          const Icon = CATEGORY_ICON[p.category] ?? Tag;
          const slug = categorySlug(p.category);
          return (
            <div key={p.id} className={`product-card product-${slug}`}>
              <div className="product-tile" style={{ "--tile-bg": gradientFor(p.category) } as CSSProperties}>
                <img src={imageForProduct(p.id)} alt={p.name} className="product-image" />
                <span className="product-category-mark">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
              </div>
              <div className="product-body">
                <div>
                  <div className="product-topline">
                    <span className="product-code">{p.id.toUpperCase()}</span>
                    <span className="stock-dot">In stock</span>
                  </div>
                  <div className="product-name">{p.name}</div>
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
