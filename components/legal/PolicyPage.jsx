export default function PolicyPage({ title, updated, children }) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      {updated && <p className="mt-1 text-sm text-text-secondary">Last updated: {updated}</p>}
      <div className="policy-content mt-8 space-y-5 text-sm leading-6 text-text">{children}</div>
    </div>
  );
}
