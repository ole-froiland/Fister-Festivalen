"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useState } from "react";

import type { GalleryItem, LoadState } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

type GallerySectionProps = {
  disabled: boolean;
  items: GalleryItem[];
  onUpload: (files: File[]) => Promise<void>;
  state: LoadState;
};

export function GallerySection({
  disabled,
  items,
  onUpload,
  state,
}: GallerySectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const invalidType = files.find((file) => !file.type.startsWith("image/"));

    if (invalidType) {
      setMessage("Kun bildefiler er tillatt i galleriet.");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      setMessage("Hvert bilde maa vaere mindre enn 8 MB.");
      event.target.value = "";
      return;
    }

    setMessage(null);
    setIsUploading(true);

    try {
      await onUpload(files);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Opplastingen mislyktes. Prov igjen.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="card-surface rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
            Galleri
          </p>
          <h2 className="mt-4 font-display text-4xl text-slate-950 sm:text-5xl">
            Del sommerminnene
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Last opp festivalbilder og la dem dukke opp direkte i galleriet.
            Layouten er laget som et lett, kvadratisk foto-grid som fungerer
            godt pa mobil og desktop.
          </p>

          <label className="mt-8 flex cursor-pointer flex-col items-start gap-3 rounded-[1.5rem] border border-dashed border-[#0f766e]/35 bg-[#0f766e]/5 p-5 transition hover:border-[#0f766e]/55 hover:bg-[#0f766e]/10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800">
              <UploadCloud className="size-4 text-[#0f766e]" />
              Last opp bilder
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Velg ett eller flere bilder. Maks 8 MB per fil.
            </p>
            <input
              accept="image/*"
              className="sr-only"
              disabled={disabled || isUploading}
              multiple
              onChange={handleFileChange}
              type="file"
            />
          </label>

          <div className="mt-4 rounded-[1.35rem] bg-white/70 px-4 py-4 text-sm leading-6 text-slate-600">
            {disabled
              ? "Aktiver Firebase Storage og Firestore for aa skru paa opplasting."
              : "Bilder lagres i Firebase Storage og metadata speiles til Firestore for realtime galleri."}
          </div>

          {message ? (
            <p className="mt-4 text-sm font-medium text-[#b91c1c]">{message}</p>
          ) : null}
        </div>

        <div>
          {state === "loading" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-[1.5rem] bg-white/70"
                />
              ))}
            </div>
          ) : null}

          {state === "disabled" ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.75rem] bg-white/75 px-6 text-center">
              <ImagePlus className="size-8 text-[#0f766e]" />
              <p className="mt-4 text-lg font-semibold text-slate-900">
                Galleriet er klart, men ikke koblet til lagring enda
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Legg inn Firebase-konfigurasjon for aa aktivere bildeflyt i
                sanntid.
              </p>
            </div>
          ) : null}

          {state === "error" ? (
            <div className="rounded-[1.75rem] bg-[#fff1f2] px-6 py-8 text-sm leading-6 text-[#9f1239]">
              Kunne ikke laste galleriet. Sjekk Firebase-oppsett og regler.
            </div>
          ) : null}

          {state === "ready" && items.length === 0 ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.75rem] bg-white/75 px-6 text-center">
              {isUploading ? (
                <LoaderCircle className="size-8 animate-spin text-[#0f766e]" />
              ) : (
                <ImagePlus className="size-8 text-[#0f766e]" />
              )}
              <p className="mt-4 text-lg font-semibold text-slate-900">
                Ingen bilder enda
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Last opp de forste festivalbildene og fyll galleriet med
                sommerstemning.
              </p>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="relative aspect-square">
                    <Image
                      alt={item.name}
                      className="object-cover transition duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      src={item.url}
                    />
                  </div>
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {formatRelativeTime(item.createdAtMs)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
