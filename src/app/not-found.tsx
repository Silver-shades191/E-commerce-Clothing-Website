import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-5xl">This page has left the building.</h1>
      <p className="mt-5 max-w-md text-muted">The link may be out of date. The collection is still here.</p>
      <div className="mt-10 flex gap-3">
        <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
        <Link href="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  );
}
