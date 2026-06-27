"use client";

import { useState } from "react";
import {
  useBudget,
  parseBucketText,
  selectUnallocated,
} from "@/lib/store";

export default function BucketTextAdd() {
  const addFromText = useBudget((s) => s.addPartitionsFromText);
  const partitions = useBudget((s) => s.partitions);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseBucketText(text);
    if (parsed.length === 0) return;

    const room = selectUnallocated(partitions);
    const requested = parsed.reduce((t, p) => t + p.percent, 0);
    addFromText(text);
    setText("");

    const count = parsed.length;
    const noun = count === 1 ? "bucket" : "buckets";
    if (requested > room) {
      setNote(
        `Added ${count} ${noun} — trimmed to fit the ${room}% you had left.`,
      );
    } else {
      setNote(`Added ${count} ${noun}.`);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add by text — e.g. Rent 35, Food 15, Fun 5"
          aria-label="Add buckets by text"
          aria-describedby="text-add-hint"
          className="field min-w-0 flex-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-subtle"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn btn-ghost shrink-0 text-sm"
        >
          Add
        </button>
      </form>
      <p id="text-add-hint" className="mt-1.5 text-xs text-ink-subtle">
        {note ?? "Format: name then percent, separated by commas."}
      </p>
    </div>
  );
}
