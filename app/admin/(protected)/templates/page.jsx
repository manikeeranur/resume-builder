import Link from "next/link";
import { Plus } from "lucide-react";
import TemplatesTable from "@/components/admin/templates/TemplatesTable";

export default function AdminTemplatesPage() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl font-bold text-text">Templates</h1>
          <p className="text-sm text-text-secondary">
            Built-in templates ship with the app. Templates you create here go live for real users the moment you
            mark them Active — no deploy needed.
          </p>
        </div>
        <Link
          href="/admin/templates/editor/new"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus size={16} />
          New template
        </Link>
      </div>

      <TemplatesTable />
    </div>
  );
}
