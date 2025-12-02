// components/ParamCellEditor.tsx
'use client';

import { useState } from 'react';

type Props = {
  value: string;
  onSave: (newValue: string) => Promise<void>;
};

export function ParamCellEditor({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div
        className="cursor-pointer text-xs whitespace-pre-wrap break-all min-h-[1.5rem]"
        onClick={handleStartEdit}
      >
        {value ? value : <span className="text-slate-500">click to edit</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        className="w-full h-32 text-xs bg-slate-950 border border-slate-700 rounded p-1 font-mono"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 text-xs">
        <button
          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <span className="text-slate-500">
          Empty &amp; save = delete mapping
        </span>
      </div>
    </div>
  );
}