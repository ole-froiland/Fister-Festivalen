"use client";

import { CloudSun, RefreshCcw } from "lucide-react";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import type { WeatherPayload } from "@/lib/types";

const WEATHER_SYMBOLS: Record<string, string> = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "🌤️",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌦️",
  "09n": "🌦️",
  "10d": "🌧️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; data: WeatherPayload }
  | { status: "error"; message: string };

export function WeatherCard() {
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: "loading",
  });

  const loadWeather = useEffectEvent(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/weather", {
        signal,
      });
      const payload = (await response.json()) as WeatherPayload & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Vaerdata er utilgjengelig.");
      }

      if (signal.aborted) {
        return;
      }

      startTransition(() => {
        setWeatherState({
          status: "ready",
          data: payload,
        });
      });
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      setWeatherState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kunne ikke hente vaerdata.",
      });
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void loadWeather(controller.signal);

    return () => controller.abort();
  }, []);

  return (
    <div className="card-surface rounded-[2rem] p-6">
      <div className="flex items-center gap-3 text-slate-900">
        <CloudSun className="size-5 text-[#0f766e]" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Vaer i Fister
          </p>
          <h3 className="text-lg font-semibold">Temperatur akkurat naa</h3>
        </div>
      </div>

      {weatherState.status === "loading" ? (
        <div className="mt-6 rounded-[1.5rem] bg-white/80 px-5 py-6">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-12 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-48 animate-pulse rounded-full bg-slate-200" />
        </div>
      ) : null}

      {weatherState.status === "error" ? (
        <div className="mt-6 rounded-[1.5rem] bg-[#fff7ed] px-5 py-6 text-sm leading-6 text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <RefreshCcw className="size-4 text-[#ff7a59]" />
            Vaerkortet mangler data
          </div>
          <p className="mt-3">{weatherState.message}</p>
        </div>
      ) : null}

      {weatherState.status === "ready" ? (
        <div className="mt-6 rounded-[1.5rem] bg-white/80 px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {weatherState.data.location}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl">
                  {WEATHER_SYMBOLS[weatherState.data.icon] ?? "🌤️"}
                </span>
                <span className="text-5xl font-bold text-slate-950">
                  {weatherState.data.temperature}°
                </span>
              </div>
            </div>
            <div className="rounded-full bg-[#0f766e]/10 px-3 py-2 text-sm font-semibold text-[#0f766e]">
              Foles som {weatherState.data.feelsLike}°
            </div>
          </div>
          <p className="mt-4 text-base text-slate-700">
            {weatherState.data.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
