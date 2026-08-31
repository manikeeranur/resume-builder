"use client";

import { useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";

let fallbackCounter = 0;
const genId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `row-${Date.now()}-${fallbackCounter++}`;

export default function RepeatableSection({ items, onChange, emptyItem, fields, itemLabel }) {
  const list = items || [];

  // Resumes created before drag-and-drop existed have no stable id per row.
  // Backfill once so Reorder has a stable key/value to track each card by.
  useEffect(() => {
    if (list.length && list.some((it) => !it._uid)) {
      onChange(list.map((it) => (it._uid ? it : { ...it, _uid: genId() })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const updateItem = (uid, key, value) => {
    onChange(list.map((it) => (it._uid === uid ? { ...it, [key]: value } : it)));
  };

  const addItem = () => onChange([...list, { ...emptyItem(), _uid: genId() }]);
  const removeItem = (uid) => onChange(list.filter((it) => it._uid !== uid));

  return (
    <div className="flex flex-col gap-4">
      <Reorder.Group
        as="div"
        axis="y"
        values={list}
        onReorder={onChange}
        className="flex flex-col gap-4"
      >
        {list.map((item, index) => (
          <SortableCard
            key={item._uid || index}
            item={item}
            index={index}
            fields={fields}
            itemLabel={itemLabel}
            onUpdate={updateItem}
            onRemove={removeItem}
          />
        ))}
      </Reorder.Group>

      <button type="button" onClick={addItem} className="btn-secondary self-start px-4 py-2 text-sm">
        + Add
      </button>
    </div>
  );
}

function SortableCard({ item, index, fields, itemLabel, onUpdate, onRemove }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      className="card p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="shrink-0 cursor-grab touch-none text-text-secondary hover:text-text active:cursor-grabbing"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          <p className="truncate text-sm font-semibold text-text">{itemLabel(item, index)}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item._uid)}
          className="shrink-0 text-xs font-medium text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" || f.full ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-xs font-medium text-text-secondary">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                className="input-field min-h-[80px]"
                value={item[f.key] || ""}
                onChange={(e) => onUpdate(item._uid, f.key, e.target.value)}
              />
            ) : f.type === "checkbox" ? (
              <label className="flex items-center gap-2 pt-1.5 text-sm text-text">
                <input
                  type="checkbox"
                  checked={Boolean(item[f.key])}
                  onChange={(e) => onUpdate(item._uid, f.key, e.target.checked)}
                />
                {f.checkboxLabel || "Current"}
              </label>
            ) : (
              <input
                className="input-field"
                type={f.type || "text"}
                value={item[f.key] || ""}
                onChange={(e) => onUpdate(item._uid, f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </Reorder.Item>
  );
}
