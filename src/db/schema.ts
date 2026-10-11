import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

const ts = (name: string) => integer(name, { mode: "timestamp_ms" });
const now = () => new Date();

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: ts("email_verified"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["customer", "support", "admin"] }).notNull().default("customer"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: ts("locked_until"),
  createdAt: ts("created_at").notNull().$defaultFn(now),
});

// One-time tokens for email verification and password reset.
export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    tokenHash: text("token_hash").notNull(),
    kind: text("kind", { enum: ["verify", "reset"] }).notNull(),
    expires: ts("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.tokenHash] }), index("vt_identifier").on(t.identifier)],
);

export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  region: text("region"),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  heroImage: text("hero_image"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: text("category_id").notNull().references(() => categories.id),
    description: text("description").notNull(),
    material: text("material"),
    fit: text("fit"),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdAt: ts("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

// Each size/colour combination is a variant with its own stock count.
export const variants = sqliteTable(
  "variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size").notNull(),
    color: text("color").notNull(),
    stock: integer("stock").notNull().default(0),
    lowStockAt: integer("low_stock_at").notNull().default(5),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    createdAt: ts("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percent", "fixed"] }).notNull(),
  value: integer("value").notNull(), // percent (0-100) or cents
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  expiresAt: ts("expires_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: text("status", { enum: ["pending", "paid", "fulfilled", "cancelled", "refunded"] })
      .notNull()
      .default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    couponCode: text("coupon_code"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<Record<string, string>>().notNull(),
    paymentProvider: text("payment_provider", { enum: ["stripe", "demo"] }).notNull(),
    paymentRef: text("payment_ref"),
    createdAt: ts("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => variants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

export const wishlist = sqliteTable(
  "wishlist",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  target: text("target"),
  createdAt: ts("created_at").notNull().$defaultFn(now),
});
