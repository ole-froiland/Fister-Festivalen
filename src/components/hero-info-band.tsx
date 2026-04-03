"use client";

import { CalendarDays, CloudSun, MapPin, RefreshCcw } from "lucide-react";
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

type HeroInfoBandProps = {
  festivalDate: string;
};

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; data: WeatherPayload }
  | { status: "error"; message: string };

function formatFestivalDay(dateString: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateString));
}

function formatFestivalTime(dateString: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatWeatherUpdatedAt(timestamp: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function HeroInfoBand({ festivalDate }: HeroInfoBandProps) {
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: "loading",
  });
  const hasValidFestivalDate = !Number.isNaN(Date.parse(festivalDate));

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
    <section className="section-anchor">
      <div className="relative left-1/2 w-screen -translate-x-1/2 border-y border-[#ddc7a3] bg-[#eddabd]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.75fr))] lg:px-8 lg:py-7">
          <div className="rounded-[1.75rem] bg-[#f4e6cf] px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
              Festivalinfo
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-slate-950 sm:text-4xl">
              Alt det viktigste samlet mellom bildene
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              Sommerdag med bryggeliv, bading, mat, musikk og folk. Her ligger
              den raske oversikten over sted, tidspunkt og vaeret akkurat naa.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <a
                className="rounded-full bg-white/70 px-4 py-2 transition hover:bg-white"
                href="#program"
              >
                Se festivalinfo
              </a>
              <a
                className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800"
                href="#signup"
              >
                Meld deg paa
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white/60 px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 text-slate-900">
              <MapPin className="size-5 text-[#0f766e]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Hvor
              </p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">
              Fister
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Rogaland, ved sjokanten og brygga.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-white/60 px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 text-slate-900">
              <CalendarDays className="size-5 text-[#ff7a59]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Nar
              </p>
            </div>
            {hasValidFestivalDate ? (
              <>
                <p className="mt-4 text-2xl font-semibold capitalize text-slate-950">
                  {formatFestivalDay(festivalDate)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Kl. {formatFestivalTime(festivalDate)} og utover.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-700">
                Oppdater `NEXT_PUBLIC_FESTIVAL_DATE` for aa vise festivaldato.
              </p>
            )}
          </div>

          <div className="rounded-[1.75rem] bg-white/60 px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 text-slate-900">
              <CloudSun className="size-5 text-[#0f766e]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Vaermelding
              </p>
            </div>

            {weatherState.status === "loading" ? (
              <div className="mt-4">
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-200" />
              </div>
            ) : null}

            {weatherState.status === "error" ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <RefreshCcw className="size-4 text-[#ff7a59]" />
                  Vaerdata mangler
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {weatherState.message}
                </p>
              </div>
            ) : null}

            {weatherState.status === "ready" ? (
              <div className="mt-4">
                <div className="flex items-end gap-3">
                  <span className="text-4xl">
                    {WEATHER_SYMBOLS[weatherState.data.icon] ?? "🌤️"}
                  </span>
                  <p className="text-3xl font-semibold text-slate-950">
                    {weatherState.data.temperature}°
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {weatherState.data.description}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Oppdatert {formatWeatherUpdatedAt(weatherState.data.updatedAt)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
