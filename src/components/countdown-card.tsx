"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { formatFestivalDate } from "@/lib/utils";

type CountdownCardProps = {
  festivalDate: string;
};

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function getCountdownState(targetTimestamp: number): CountdownState {
  const remaining = Math.max(0, targetTimestamp - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isComplete: remaining === 0,
  };
}

export function CountdownCard({ festivalDate }: CountdownCardProps) {
  const targetTimestamp = Date.parse(festivalDate);
  const [countdown, setCountdown] = useState(() =>
    getCountdownState(targetTimestamp),
  );

  const updateCountdown = useEffectEvent(() => {
    setCountdown(getCountdownState(targetTimestamp));
  });

  useEffect(() => {
    if (Number.isNaN(targetTimestamp)) {
      return;
    }

    updateCountdown();
    const intervalId = window.setInterval(() => {
      updateCountdown();
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [targetTimestamp]);

  if (Number.isNaN(targetTimestamp)) {
    return (
      <div className="card-surface rounded-[2rem] p-6">
        <div className="flex items-center gap-3 text-slate-900">
          <Clock3 className="size-5 text-[#0f766e]" />
          <h3 className="text-lg font-semibold">Countdown utilgjengelig</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Oppdater `NEXT_PUBLIC_FESTIVAL_DATE` i miljofilen med en gyldig dato.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-[2rem] p-6">
      <div className="flex items-center gap-3 text-slate-900">
        <CalendarDays className="size-5 text-[#ff7a59]" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Countdown
          </p>
          <h3 className="text-lg font-semibold">Tid til festivalstart</h3>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {[
          { label: "Dager", value: countdown.days },
          { label: "Timer", value: countdown.hours },
          { label: "Min", value: countdown.minutes },
          { label: "Sek", value: countdown.seconds },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.35rem] bg-white/80 px-3 py-4 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {String(item.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">
        {countdown.isComplete
          ? "Festivalen er i gang. Nyt dagen i Fister."
          : `Vi teller ned mot ${formatFestivalDate(festivalDate)}.`}
      </p>
    </div>
  );
}
