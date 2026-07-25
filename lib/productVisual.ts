// Purely cosmetic category -> visual mapping for the storefront's product
// tiles, since there are no real product images.

export const CATEGORY_GRADIENT: Record<string, string> = {
  Electronics: "linear-gradient(135deg, #1f5f8b 0%, #0f2b3d 100%)",
  Home: "linear-gradient(135deg, #bd8d42 0%, #6d4217 100%)",
  Apparel: "linear-gradient(135deg, #a94d3d 0%, #4c2620 100%)",
  Fitness: "linear-gradient(135deg, #358864 0%, #133c33 100%)",
  Outdoor: "linear-gradient(135deg, #516e55 0%, #172b24 100%)",
};

export function gradientFor(category: string): string {
  return CATEGORY_GRADIENT[category] ?? "linear-gradient(135deg, #6f6858 0%, #443f34 100%)";
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export const PRODUCT_IMAGES: Record<string, string> = {
  p_1: "/products/earbuds.svg",
  p_2: "/products/mugs.svg",
  p_3: "/products/jacket.svg",
  p_4: "/products/bottle.svg",
  p_5: "/products/tent.svg",
  p_6: "/products/shoes.svg",
  p_7: "/products/speaker.svg",
  p_8: "/products/cookware.svg",
};

export function imageForProduct(productId: string): string {
  return PRODUCT_IMAGES[productId] ?? "/products/earbuds.svg";
}
