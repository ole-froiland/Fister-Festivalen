import { CheckCircle2, CircleAlert, Info } from "lucide-react";

import type { ToastMessage } from "@/lib/types";

type ToastRegionProps = {
  toasts: ToastMessage[];
};

export function ToastRegion({ toasts }: ToastRegionProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4">
      {toasts.map((toast) => {
        const Icon =
          toast.tone === "success"
            ? CheckCircle2
            : toast.tone === "error"
              ? CircleAlert
              : Info;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-[1.4rem] border border-white/60 bg-white/90 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <Icon
                className={`mt-0.5 size-5 ${
                  toast.tone === "success"
                    ? "text-[#0f766e]"
                    : toast.tone === "error"
                      ? "text-[#b91c1c]"
                      : "text-slate-700"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {toast.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
