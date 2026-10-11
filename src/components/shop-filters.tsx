import { formatMoney } from "@/lib/utils";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];
const PRICE_BANDS = [
  { value: "", label: "Any price" },
  { value: "0-10000", label: `Under ${formatMoney(10000)}` },
  { value: "10000-20000", label: `${formatMoney(10000)} – ${formatMoney(20000)}` },
  { value: "20000-", label: `${formatMoney(20000)} and up` },
];

// Plain GET form: works without JavaScript and keeps every filter shareable as a URL.
export function ShopFilters({
  defaults,
  categories,
  basePath,
}: {
  defaults: { q?: string; category?: string; size?: string; price?: string; sort?: string };
  categories: { slug: string; name: string }[];
  basePath: string;
}) {
  return (
    <form method="get" action={basePath} role="search" className="card grid gap-5 p-5 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end md:p-6">
      <div>
        <label htmlFor="q" className="field-label">Search</label>
        <input id="q" name="q" type="search" defaultValue={defaults.q} placeholder="Oxford, linen, polo…" className="input" />
      </div>

      {basePath === "/shop" && (
        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={defaults.category ?? ""} className="input">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="size" className="field-label">Size</label>
        <select id="size" name="size" defaultValue={defaults.size ?? ""} className="input">
          <option value="">Any size</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="field-label">Price</label>
        <select id="price" name="price" defaultValue={defaults.price ?? ""} className="input">
          {PRICE_BANDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sort" className="field-label">Sort by</label>
        <select id="sort" name="sort" defaultValue={defaults.sort ?? "featured"} className="input">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary md:col-span-full md:w-auto">Apply filters</button>
    </form>
  );
}

export function parsePriceBand(band?: string): { minPrice?: number; maxPrice?: number } {
  if (!band) return {};
  const [min, max] = band.split("-");
  return {
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
  };
}
