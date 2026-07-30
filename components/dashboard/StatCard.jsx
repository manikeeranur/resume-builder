export default function StatCard({ icon: Icon, value, label, tint }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tint.bg, color: tint.fg }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-text">{value}</p>
        <p className="truncate text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
