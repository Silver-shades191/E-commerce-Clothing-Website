export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-page max-w-3xl py-20">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-4 text-xs text-muted">Last updated {updated}</p>
      <div className="prose-legal mt-12 space-y-5 text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-bone [&_strong]:text-gold-strong [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-gold">
        {children}
      </div>
    </article>
  );
}
