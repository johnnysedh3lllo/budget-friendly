"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Partition } from "@/lib/types";
import { useBudget, selectUnallocated } from "@/lib/store";
import { partitionColor, PALETTE_SIZE } from "@/lib/colors";
import { formatMoney } from "@/lib/format";

export default function PartitionRow({
  partition,
  index,
}: {
  partition: Partition;
  index: number;
}) {
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const partitions = useBudget((s) => s.partitions);
  const setPercent = useBudget((s) => s.setPercent);
  const renamePartition = useBudget((s) => s.renamePartition);
  const removePartition = useBudget((s) => s.removePartition);
  const recolorPartition = useBudget((s) => s.recolorPartition);
  const fillUnallocated = useBudget((s) => s.fillUnallocated);
  const lastAddedId = useBudget((s) => s.lastAddedId);
  const clearLastAdded = useBudget((s) => s.clearLastAdded);

  const [pickerOpen, setPickerOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // When this row is the freshly added bucket, focus its name for quick typing.
  useEffect(() => {
    if (lastAddedId === partition.id && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
      clearLastAdded();
    }
  }, [lastAddedId, partition.id, clearLastAdded]);

  const color = partitionColor(partition.colorIndex);
  const room = selectUnallocated(partitions);
  const sliceAmount = amount * (partition.percent / 100);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.16, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      className="surface p-3 sm:p-4"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-center gap-2.5">
        {/* Colour picker toggle */}
        <button
          onClick={() => setPickerOpen((o) => !o)}
          aria-label={`Change colour for ${partition.name}`}
          aria-expanded={pickerOpen}
          className="size-7 shrink-0 rounded-full border-2"
          style={{
            background: color,
            borderColor: "var(--surface)",
            outline: "1px solid var(--border)",
          }}
        />

        {/* Name */}
        <label className="sr-only" htmlFor={`name-${partition.id}`}>
          Name for bucket {index + 1}
        </label>
        <input
          id={`name-${partition.id}`}
          ref={nameRef}
          value={partition.name}
          onChange={(e) => renamePartition(partition.id, e.target.value)}
          placeholder="Name this bucket"
          maxLength={28}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-subtle"
        />

        {/* Amount for this slice */}
        <span className="num shrink-0 text-base font-semibold text-ink">
          {formatMoney(sliceAmount, currency)}
        </span>

        {/* Remove */}
        <button
          onClick={() => removePartition(partition.id)}
          aria-label={`Remove ${partition.name}`}
          className="btn-ghost btn shrink-0 !px-2 !py-2"
          title="Remove bucket"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Slider row */}
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={partition.percent}
          onChange={(e) => setPercent(partition.id, Number(e.target.value))}
          className="bf-range"
          style={{ "--bf-accent": color } as React.CSSProperties}
          aria-label={`${partition.name} percentage`}
          aria-valuetext={`${partition.percent} percent, ${formatMoney(
            sliceAmount,
            currency,
          )}`}
        />

        <div className="flex shrink-0 items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={partition.percent}
            onChange={(e) => setPercent(partition.id, Number(e.target.value))}
            aria-label={`${partition.name} percent value`}
            className="field num w-14 px-2 py-1 text-right text-sm font-semibold text-ink"
          />
          <span className="num text-sm text-ink-muted">%</span>
        </div>
      </div>

      {pickerOpen && (
        <div
          className="mt-3 flex flex-wrap gap-2 border-t pt-3"
          role="group"
          aria-label={`Colour for ${partition.name}`}
        >
          {Array.from({ length: PALETTE_SIZE }).map((_, i) => (
            <button
              key={i}
              aria-label={`Colour ${i + 1}`}
              aria-pressed={i === partition.colorIndex}
              onClick={() => {
                recolorPartition(partition.id, i);
                setPickerOpen(false);
              }}
              className="size-7 rounded-full"
              style={{
                background: partitionColor(i),
                outline:
                  i === partition.colorIndex
                    ? "2px solid var(--ink)"
                    : "1px solid var(--border)",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      )}

      {room > 0 && (
        <button
          onClick={() => fillUnallocated(partition.id)}
          className="mt-2 text-xs font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          + Add the remaining {room}% here
        </button>
      )}
    </motion.li>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
