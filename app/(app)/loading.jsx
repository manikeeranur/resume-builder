// Shown instantly while a page in this group loads on the server (session +
// DB queries), instead of the old page staying frozen until the response
// arrives. The dashboard shell (navbar/sidebar) from layout.jsx stays visible.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse p-4 sm:p-6" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 rounded-lg bg-black/5" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-black/5" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
