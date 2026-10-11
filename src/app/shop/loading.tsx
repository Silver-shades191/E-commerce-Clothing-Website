export default function ShopLoading() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <div className="skeleton h-40 rounded-[var(--radius-card)]" />
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] rounded-[var(--radius-card)]" />
            <div className="skeleton mt-4 h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
