export default function RepeatableSection({ items, onChange, emptyItem, fields, itemLabel }) {
  const list = items || [];

  const updateItem = (index, key, value) => {
    const next = list.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    onChange(next);
  };

  const addItem = () => onChange([...list, emptyItem()]);
  const removeItem = (index) => onChange(list.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-4">
      {list.map((item, index) => (
        <div key={index} className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">{itemLabel(item, index)}</p>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-xs font-medium text-red-600 hover:underline"
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
                    onChange={(e) => updateItem(index, f.key, e.target.value)}
                  />
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 pt-1.5 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={Boolean(item[f.key])}
                      onChange={(e) => updateItem(index, f.key, e.target.checked)}
                    />
                    {f.checkboxLabel || "Current"}
                  </label>
                ) : (
                  <input
                    className="input-field"
                    type={f.type || "text"}
                    value={item[f.key] || ""}
                    onChange={(e) => updateItem(index, f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem} className="btn-secondary self-start px-4 py-2 text-sm">
        + Add
      </button>
    </div>
  );
}
