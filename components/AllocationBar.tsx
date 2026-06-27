"use client";

import { motion } from "motion/react";
import { useBudget, selectUnallocated } from "@/lib/store";
import { partitionColor } from "@/lib/colors";

export default function AllocationBar() {
  const partitions = useBudget((s) => s.partitions);
  const unallocated = selectUnallocated(partitions);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold text-ink-muted">
          How your 100% is split
        </span>
        <span className="num text-sm font-semibold text-ink-muted">
          {100 - unallocated}
          <span className="text-ink-subtle">/100</span>
        </span>
      </div>

      <div
        className="surface flex h-5 w-full overflow-hidden p-0"
        style={{ borderRadius: "var(--radius-pill)" }}
        role="img"
        aria-label={`${100 - unallocated}% allocated, ${unallocated}% unallocated`}
      >
        {partitions
          .filter((p) => p.percent > 0)
          .map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={false}
              animate={{ width: `${p.percent}%` }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 32,
              }}
              style={{ background: partitionColor(p.colorIndex) }}
              title={`${p.name} · ${p.percent}%`}
            />
          ))}
        {unallocated > 0 && (
          <motion.div
            layout
            initial={false}
            animate={{ width: `${unallocated}%` }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="bf-hatch"
            title={`Unallocated · ${unallocated}%`}
          />
        )}
      </div>
    </div>
  );
}
