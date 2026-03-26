"use client";

import {
  addDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowRight,
  Camera,
  MapPin,
  Music4,
  Sparkles,
  Trophy,
  UsersRound,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { CountdownCard } from "@/components/countdown-card";
import { GallerySection } from "@/components/gallery-section";
import { ParticipantList } from "@/components/participant-list";
import { SignupForm } from "@/components/signup-form";
import { ToastRegion } from "@/components/toast-region";
import { WeatherCard } from "@/components/weather-card";
import {
  db,
  getGalleryCollection,
  getParticipantsCollection,
  hasFirebaseConfig,
  storage,
} from "@/lib/firebase";
import type {
  GalleryItem,
  LoadState,
  Participant,
  ToastMessage,
} from "@/lib/types";
import { formatFestivalDate, slugifyFileName } from "@/lib/utils";

const FESTIVAL_DATE =
  process.env.NEXT_PUBLIC_FESTIVAL_DATE ?? "2026-07-18T12:00:00+02:00";

const highlights = [
  {
    icon: Waves,
    title: "Bading",
    description: "Morgendukkert, bryggeliv og korte pauser ved vannkanten.",
  },
  {
    icon: Trophy,
    title: "Konkurranser",
    description: "Laglek, quiz og uhoytidelige sommerdueller for alle aldre.",
  },
  {
    icon: UtensilsCrossed,
    title: "Mat og drikke",
    description: "Enkle festivalfavoritter, noe kaldt i glasset og langbordsstemning.",
  },
];

const pulseCards = [
  {
    label: "Lokasjon",
    value: "Fister, Rogaland",
    icon: MapPin,
  },
  {
    label: "Stemning",
    value: "Sol, saltvann og senkede skuldre",
    icon: Music4,
  },
];

function toParticipant(docId: string, data: Record<string, unknown>): Participant {
  return {
    id: docId,
    name: typeof data.name === "string" ? data.name : "Ukjent deltaker",
    createdAtMs:
      typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
  };
}

function toGalleryItem(docId: string, data: Record<string, unknown>): GalleryItem {
  return {
    id: docId,
    name: typeof data.name === "string" ? data.name : "Festivalbilde",
    url: typeof data.url === "string" ? data.url : "",
    storagePath:
      typeof data.storagePath === "string" ? data.storagePath : "gallery/unknown",
    createdAtMs:
      typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
  };
}

export function FestivalApp() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [participantsState, setParticipantsState] = useState<LoadState>(
    hasFirebaseConfig ? "loading" : "disabled",
  );
  const [galleryState, setGalleryState] = useState<LoadState>(
    hasFirebaseConfig ? "loading" : "disabled",
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function pushToast(toast: Omit<ToastMessage, "id">) {
    setToasts((current) => [
      ...current.slice(-2),
      {
        ...toast,
        id: crypto.randomUUID(),
      },
    ]);
  }

  useEffect(() => {
    if (!hasFirebaseConfig) {
      return;
    }

    const participantsRef = getParticipantsCollection();

    if (!participantsRef) {
      return;
    }

    const unsubscribe = onSnapshot(
      query(participantsRef, orderBy("createdAtMs", "desc")),
      (snapshot) => {
        startTransition(() => {
          setParticipants(
            snapshot.docs.map((documentSnapshot) =>
              toParticipant(documentSnapshot.id, documentSnapshot.data()),
            ),
          );
          setParticipantsState("ready");
        });
      },
      () => {
        setParticipantsState("error");
        pushToast({
          tone: "error",
          title: "Kunne ikke hente deltakere",
          description: "Sjekk Firestore-oppsett og regler i Firebase.",
        });
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      return;
    }

    const galleryRef = getGalleryCollection();

    if (!galleryRef) {
      return;
    }

    const unsubscribe = onSnapshot(
      query(galleryRef, orderBy("createdAtMs", "desc")),
      (snapshot) => {
        startTransition(() => {
          setGalleryItems(
            snapshot.docs
              .map((documentSnapshot) =>
                toGalleryItem(documentSnapshot.id, documentSnapshot.data()),
              )
              .filter((item) => item.url.length > 0),
          );
          setGalleryState("ready");
        });
      },
      () => {
        setGalleryState("error");
        pushToast({
          tone: "error",
          title: "Kunne ikke hente galleriet",
          description: "Sjekk Firestore- og Storage-oppsettet i Firebase.",
        });
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3_600);

    return () => window.clearTimeout(timeoutId);
  }, [toasts]);

  async function handleSignup(names: string[]) {
    const participantsRef = getParticipantsCollection();

    if (!db || !participantsRef) {
      throw new Error("Firebase er ikke konfigurert enda.");
    }

    const batch = writeBatch(db);
    const submittedAt = Date.now();

    names.forEach((name, index) => {
      batch.set(doc(participantsRef), {
        name,
        createdAtMs: submittedAt + index,
      });
    });

    await batch.commit();

    pushToast({
      tone: "success",
      title: "Paameldingen er registrert",
      description: `${names.length} ${
        names.length === 1 ? "deltaker er" : "deltakere er"
      } lagt til i festivaloversikten.`,
    });
  }

  async function handleGalleryUpload(files: File[]) {
    const galleryRef = getGalleryCollection();
    const festivalStorage = storage;

    if (!galleryRef || !festivalStorage) {
      throw new Error("Firebase Storage er ikke konfigurert enda.");
    }

    await Promise.all(
      files.map(async (file, index) => {
        const timestamp = Date.now() + index;
        const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const sanitizedName = slugifyFileName(file.name.replace(/\.[^.]+$/, ""));
        const storagePath = `gallery/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${fileExtension}`;

        const storageRef = ref(festivalStorage, storagePath);
        await uploadBytes(storageRef, file, {
          contentType: file.type,
        });

        const url = await getDownloadURL(storageRef);

        await addDoc(galleryRef, {
          name: file.name,
          url,
          storagePath,
          createdAtMs: timestamp,
        });
      }),
    );

    pushToast({
      tone: "success",
      title: "Bilder lastet opp",
      description: `${files.length} ${files.length === 1 ? "bilde er" : "bilder er"} lagt til i galleriet.`,
    });
  }

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="hero-glow absolute left-[-10rem] top-[-4rem] size-[20rem] rounded-full bg-[#ffe5b4]" />
      <div className="hero-glow absolute right-[-7rem] top-40 size-[22rem] rounded-full bg-[#8fd3ff]" />
      <div className="hero-glow absolute bottom-10 left-1/3 size-[18rem] rounded-full bg-[#b8f2d9]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pt-4 sm:px-6 lg:px-8">
        <header className="card-surface sticky top-4 z-30 mb-8 flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">
              Sommerfestival
            </p>
            <p className="font-display text-2xl text-slate-900">
              Fister-Festivalen
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <a
              href="#program"
              className="rounded-full px-4 py-2 transition hover:bg-white/70"
            >
              Festivalinfo
            </a>
            <a
              href="#signup"
              className="rounded-full px-4 py-2 transition hover:bg-white/70"
            >
              Paamelding
            </a>
            <a
              href="#gallery"
              className="rounded-full px-4 py-2 transition hover:bg-white/70"
            >
              Galleri
            </a>
          </nav>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          <section className="section-anchor grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="card-surface animate-fade-up overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0f766e]/10 px-4 py-2 text-sm font-semibold text-[#0f766e]">
                <Sparkles className="size-4" />
                Klar for sommerdag ved sjokanten
              </div>

              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-none text-slate-950 sm:text-6xl lg:text-7xl">
                Fister-Festivalen
              </h1>

              <p className="text-balance mt-5 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                En lett, leken og sosial festivaldag med bading, konkurranser,
                mat og drikke. Nettsiden er bygget for rask paamelding, live
                deltakeroversikt, vaerstatus og sommerbilder fra dagen.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Meld deg paa
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#gallery"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-white hover:bg-white"
                >
                  Se bildegalleriet
                  <Camera className="size-4" />
                </a>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {highlights.map((highlight) => {
                  const Icon = highlight.icon;

                  return (
                    <div
                      key={highlight.title}
                      className="rounded-[1.5rem] bg-white/75 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
                    >
                      <Icon className="size-5 text-[#0f766e]" />
                      <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        {highlight.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {highlight.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="card-surface animate-fade-up-delay rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Live festivalpuls
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      Alt du trenger foran deg
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#ff7a59]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a59]">
                    Live
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-slate-950 px-5 py-6 text-white shadow-[0_24px_50px_rgba(15,23,42,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                    Paameldte naa
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div className="text-5xl font-bold">
                      {participants.length}
                    </div>
                    <UsersRound className="size-10 text-[#f7d794]" />
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    {hasFirebaseConfig
                      ? "Tallet oppdateres automatisk fra Firestore."
                      : "Legg inn Firebase-oppsett for aa aktivere live paamelding."}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {pulseCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.label}
                        className="rounded-[1.35rem] bg-white/80 px-4 py-5"
                      >
                        <Icon className="size-4 text-[#0f766e]" />
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {card.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <WeatherCard />
              <CountdownCard festivalDate={FESTIVAL_DATE} />
            </div>
          </section>

          <section
            id="program"
            className="section-anchor card-surface rounded-[2rem] p-6 sm:p-8 lg:p-10"
          >
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                  Festivalinfo
                </p>
                <h2 className="mt-4 max-w-lg font-display text-4xl leading-tight text-slate-950 sm:text-5xl">
                  Sommerlig, lett aa bruke og bygget for raske oppdateringer
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Løsningen er mobilvennlig og laget for enkel drift: paamelding
                  i sanntid, opplasting av festivalbilder og vaerdata for Fister
                  pa samme side. Standarddatoen er satt til{" "}
                  {formatFestivalDate(FESTIVAL_DATE)}.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Live deltakerliste",
                    text: "Firestore driver liste og totalantall fortlopende uten manuell refresh.",
                  },
                  {
                    title: "Vaer rett pa forsiden",
                    text: "OpenWeather-data hentes via en server-route sa noekkelen ikke eksponeres i klienten.",
                  },
                  {
                    title: "Instagram-style galleri",
                    text: "Bilder lastes til Firebase Storage og dukker opp i et responsivt grid saa snart de er registrert.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] bg-gradient-to-br from-white/95 to-white/70 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="signup"
            className="section-anchor grid gap-6 lg:grid-cols-[0.88fr_1.12fr]"
          >
            <div className="card-surface rounded-[2rem] p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                Paamelding
              </p>
              <h2 className="mt-4 font-display text-4xl text-slate-950 sm:text-5xl">
                Meld paa hele gjengen
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Legg inn ett eller flere navn, send skjemaet og se
                deltakerlisten oppdatere seg automatisk. Skjemaet er laget for
                raske gruppepaameldinger fra mobil.
              </p>

              <div className="mt-6 rounded-[1.4rem] border border-dashed border-[#0f766e]/25 bg-[#0f766e]/5 px-4 py-4 text-sm leading-6 text-slate-700">
                {hasFirebaseConfig
                  ? "Firebase er aktiv. Nye deltakere skrives direkte til Firestore."
                  : "Firebase mangler miljoverdier. Bruk .env.example og README for aa aktivere paamelding og live data."}
              </div>

              <div className="mt-8">
                <SignupForm
                  disabled={!hasFirebaseConfig}
                  onSubmit={handleSignup}
                />
              </div>
            </div>

            <ParticipantList
              participants={participants}
              state={participantsState}
            />
          </section>

          <section id="gallery" className="section-anchor">
            <GallerySection
              items={galleryItems}
              state={galleryState}
              disabled={!hasFirebaseConfig}
              onUpload={handleGalleryUpload}
            />
          </section>
        </main>

        <footer className="mt-8 rounded-[1.75rem] border border-white/60 bg-white/60 px-5 py-5 text-sm leading-6 text-slate-600 backdrop-blur">
          Bygget med Next.js, Tailwind og Firebase for enkel deploy til Vercel
          eller Netlify. Oppsettet er gjort plug-and-play med placeholders i{" "}
          <code>.env.example</code> og egne Firebase-regler i prosjektet.
        </footer>
      </div>

      <ToastRegion toasts={toasts} />
    </div>
  );
}
