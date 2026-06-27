"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import { useBudget } from "@/lib/store";
import Select from "./Select";

export default function TemplatePicker() {
  const applyTemplate = useBudget((s) => s.applyTemplate);
  const [selectedId, setSelectedId] = useState("");

  return (
    <div>
      <label className="mb-2 block text-sm text-ink-muted">
        <span className="font-semibold">Start from a rule</span>
        <span className="text-ink-subtle"> — then make it yours</span>
      </label>
      <Select
        value={selectedId}
        placeholder="Choose a starting split…"
        ariaLabel="Start from a rule"
        className="w-full"
        menuClassName="left-0 right-0"
        onChange={(id) => {
          const t = TEMPLATES.find((x) => x.id === id);
          if (t) {
            applyTemplate(t);
            setSelectedId(id);
          }
        }}
        options={TEMPLATES.map((t) => ({
          value: t.id,
          label: t.name,
          hint: t.tagline,
        }))}
      />
    </div>
  );
}
