import { and, asc, avg, count, desc, eq, inArray, like, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { products, variants, categories, reviews } = schema;

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name";

export type CatalogQuery = {
  q?: string;
  category?: string;
  size?: string;
  minPrice?: number; // cents
  maxPrice?: number; // cents
  sort?: SortKey;
  page?: number;
};

export const PAGE_SIZE = 12;

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({ where: eq(categories.slug, slug) });
}

export async function getStockSummary(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { stock: number; sizes: string[]; colors: string[] }>();
  const rows = await db.select().from(variants).where(inArray(variants.productId, productIds));
  const map = new Map<string, { stock: number; sizes: string[]; colors: string[] }>();
  for (const v of rows) {
    const entry = map.get(v.productId) ?? { stock: 0, sizes: [], colors: [] };
    entry.stock += v.stock;
    if (v.stock > 0 && !entry.sizes.includes(v.size)) entry.sizes.push(v.size);
    if (v.stock > 0 && !entry.colors.includes(v.color)) entry.colors.push(v.color);
    map.set(v.productId, entry);
  }
  return map;
}

export async function searchProducts(query: CatalogQuery) {
  const page = Math.max(1, query.page ?? 1);
  const conditions = [eq(products.published, true)];

  if (query.q?.trim()) conditions.push(like(products.name, `%${query.q.trim()}%`));
  if (query.minPrice !== undefined) conditions.push(gte(products.priceCents, query.minPrice));
  if (query.maxPrice !== undefined) conditions.push(lte(products.priceCents, query.maxPrice));

  if (query.category) {
    const cat = await getCategoryBySlug(query.category);
    if (cat) conditions.push(eq(products.categoryId, cat.id));
    else conditions.push(sql`0`);
  }

  if (query.size) {
    conditions.push(
      inArray(
        products.id,
        db.select({ id: variants.productId }).from(variants).where(eq(variants.size, query.size)),
      ),
    );
  }

  const orderBy = {
    featured: [desc(products.featured), desc(products.createdAt)],
    "price-asc": [asc(products.priceCents)],
    "price-desc": [desc(products.priceCents)],
    newest: [desc(products.createdAt)],
    name: [asc(products.name)],
  }[query.sort ?? "featured"];

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(products).where(where);
  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderBy)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const stock = await getStockSummary(rows.map((r) => r.id));
  return {
    items: rows.map((p) => ({ ...p, summary: stock.get(p.id) ?? { stock: 0, sizes: [], colors: [] } })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getFeaturedProducts(limit = 4) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.published, true), eq(products.featured, true)))
    .limit(limit);
  const stock = await getStockSummary(rows.map((r) => r.id));
  return rows.map((p) => ({ ...p, summary: stock.get(p.id) ?? { stock: 0, sizes: [], colors: [] } }));
}

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!product || !product.published) return null;

  const [category, productVariants, reviewRows, rating] = await Promise.all([
    db.query.categories.findFirst({ where: eq(categories.id, product.categoryId) }),
    db.select().from(variants).where(eq(variants.productId, product.id)).orderBy(asc(variants.size)),
    db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, product.id))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
    db.select({ avg: avg(reviews.rating), n: count() }).from(reviews).where(eq(reviews.productId, product.id)),
  ]);

  return {
    ...product,
    category,
    variants: productVariants,
    reviews: reviewRows,
    rating: { average: Number(rating[0]?.avg ?? 0), count: Number(rating[0]?.n ?? 0) },
  };
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 3) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.published, true), sql`${products.id} != ${productId}`))
    .limit(limit);
  const stock = await getStockSummary(rows.map((r) => r.id));
  return rows.map((p) => ({ ...p, summary: stock.get(p.id) ?? { stock: 0, sizes: [], colors: [] } }));
}
