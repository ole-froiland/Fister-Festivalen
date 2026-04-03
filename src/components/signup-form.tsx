"use client";

import { LoaderCircle, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";

type SignupFormProps = {
  disabled: boolean;
  onSubmit: (names: string[]) => Promise<void>;
};

export function SignupForm({ disabled, onSubmit }: SignupFormProps) {
  const [fields, setFields] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(index: number, value: string) {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? value : field,
      ),
    );
  }

  function addField() {
    setFields((current) => [...current, ""]);
  }

  function removeField(index: number) {
    setFields((current) =>
      current.length === 1
        ? [""]
        : current.filter((_, fieldIndex) => fieldIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const names = fields.map((field) => field.trim()).filter(Boolean);

    if (names.length === 0) {
      setError("Legg inn minst ett navn for aa sende paameldingen.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(names);
      setFields([""]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Paameldingen kunne ikke sendes. Prov igjen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {fields.map((field, index) => (
        <div
          key={`${index}-${fields.length}`}
          className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <label
              className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
              htmlFor={`participant-${index}`}
            >
              Navn {index + 1}
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || isSubmitting || fields.length === 1}
              onClick={() => removeField(index)}
              type="button"
            >
              <Trash2 className="size-4" />
              Fjern
            </button>
          </div>

          <input
            className="mt-3 w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            disabled={disabled || isSubmitting}
            id={`participant-${index}`}
            maxLength={80}
            onChange={(event) => updateField(index, event.target.value)}
            placeholder="Navnet ditt"
            value={field}
          />
        </div>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isSubmitting}
          onClick={addField}
          type="button"
        >
          <Plus className="size-4" />
          Legg til navn
        </button>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Meld paa
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-[#b91c1c]">{error}</p>
      ) : null}
    </form>
  );
}
