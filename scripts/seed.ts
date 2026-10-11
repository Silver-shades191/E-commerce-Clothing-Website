/* Seeds categories, products, variants, coupons and a demo admin account.
 * Run with: npm run db:seed
 * The demo passwords are for local development only and are printed once.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db, schema } from "../src/db";
import { eq } from "drizzle-orm";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const categories = [
  { slug: "dress-shirts", name: "Dress Shirts", description: "Crisp poplin and oxford cloth for the boardroom and beyond.", sortOrder: 1 },
  { slug: "casual-shirts", name: "Casual Shirts", description: "Relaxed weekend cuts in soft linen and chambray.", sortOrder: 2 },
  { slug: "t-shirts", name: "T-Shirts", description: "Heavyweight jersey tees with a clean, considered drape.", sortOrder: 3 },
];

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  material: string;
  fit: string;
  description: string;
  featured?: boolean;
  colors: { name: string; stock: number }[];
};

const products: SeedProduct[] = [
  {
    name: "Classic Poplin Dress Shirt",
    category: "dress-shirts",
    price: 14500,
    material: "100% long-staple cotton poplin, 120 count",
    fit: "Tailored",
    description: "A crisp, lightweight poplin with a soft collar and mother-of-pearl buttons. Cut for a clean line under a jacket.",
    featured: true,
    colors: [
      { name: "White", stock: 6 },
      { name: "Sky Blue", stock: 4 },
    ],
  },
  {
    name: "Oxford Button-Down",
    category: "dress-shirts",
    price: 16500,
    compareAt: 18500,
    material: "Brushed oxford cloth, 100% cotton",
    fit: "Regular",
    description: "Woven oxford with a roll-able button-down collar. Gets better with every wash.",
    featured: true,
    colors: [
      { name: "Navy", stock: 8 },
      { name: "Ecru", stock: 2 },
    ],
  },
  {
    name: "Linen Camp Collar Shirt",
    category: "casual-shirts",
    price: 12900,
    material: "100% European linen",
    fit: "Relaxed",
    description: "Breathable linen with a camp collar and a boxy, easy silhouette for warm afternoons.",
    featured: true,
    colors: [
      { name: "Sand", stock: 10 },
      { name: "Sage", stock: 5 },
    ],
  },
  {
    name: "Chambray Work Shirt",
    category: "casual-shirts",
    price: 11500,
    material: "Cotton chambray, mid-weight",
    fit: "Regular",
    description: "A dependable chambray with reinforced seams and a chest pocket. Built to be worn hard.",
    colors: [{ name: "Indigo", stock: 0 }],
  },
  {
    name: "Heavyweight Essential Tee",
    category: "t-shirts",
    price: 5900,
    material: "240 gsm combed cotton jersey",
    fit: "Classic",
    description: "A dense, structured tee with a ribbed crew neck and reinforced shoulders. Holds its shape.",
    featured: true,
    colors: [
      { name: "Black", stock: 14 },
      { name: "Bone", stock: 9 },
    ],
  },
  {
    name: "Pima Crew Tee",
    category: "t-shirts",
    price: 6900,
    compareAt: 7900,
    material: "Pima cotton, 180 gsm",
    fit: "Slim",
    description: "Soft, fine-gauge Pima cotton with a close-cut silhouette and a neat, flat seam.",
    colors: [
      { name: "Stone", stock: 12 },
      { name: "Forest", stock: 3 },
    ],
  },
];

async function main() {
  console.log("Seeding…");

  for (const c of categories) {
    await db
      .insert(schema.categories)
      .values({ id: crypto.randomUUID(), ...c })
      .onConflictDoNothing({ target: schema.categories.slug });
  }

  const catRows = await db.select().from(schema.categories);
  const catId = (slug: string) => catRows.find((c) => c.slug === slug)!.id;

  for (const p of products) {
    const existing = await db.query.products.findFirst({
      where: eq(schema.products.slug, p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
    });
    if (existing) continue;

    const productId = crypto.randomUUID();
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await db.insert(schema.products).values({
      id: productId,
      slug,
      name: p.name,
      categoryId: catId(p.category),
      description: p.description,
      material: p.material,
      fit: p.fit,
      priceCents: p.price,
      compareAtCents: p.compareAt ?? null,
      images: [],
      featured: Boolean(p.featured),
      published: true,
    });

    for (const color of p.colors) {
      for (const size of SIZES) {
        const skuBase = `${slug.toUpperCase().slice(0, 14)}-${color.name.toUpperCase().replace(/\s+/g, "").slice(0, 4)}-${size}`;
        await db.insert(schema.variants).values({
          id: crypto.randomUUID(),
          productId,
          sku: `${skuBase}-${productId.slice(0, 4)}`,
          size,
          color: color.name,
          stock: color.stock,
        });
      }
    }
  }

  await db
    .insert(schema.coupons)
    .values([
      { id: crypto.randomUUID(), code: "WELCOME10", type: "percent", value: 10, minSubtotalCents: 0, active: true },
      { id: crypto.randomUUID(), code: "SAVE20", type: "fixed", value: 2000, minSubtotalCents: 10000, active: true, maxUses: 100 },
    ])
    .onConflictDoNothing({ target: schema.coupons.code });

  // Demo accounts. Passwords are random per run and printed once, never stored in plain text.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@atelier.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(9).toString("base64url") + "A1";
  const existingAdmin = await db.query.users.findFirst({ where: eq(schema.users.email, adminEmail) });
  if (!existingAdmin) {
    await db.insert(schema.users).values({
      id: crypto.randomUUID(),
      name: "Store Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      emailVerified: new Date(),
      role: "admin",
    });
    console.log(`Admin created: ${adminEmail}`);
    console.log(`Password (shown once): ${adminPassword}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
