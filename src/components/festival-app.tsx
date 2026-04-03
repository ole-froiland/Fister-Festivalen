"use client";

import Image from "next/image";
import {
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CloudSun,
  Download,
  LoaderCircle,
  MapPin,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { ToastRegion } from "@/components/toast-region";
import { db, getParticipantsCollection, hasFirebaseConfig } from "@/lib/firebase";
import type { LoadState, Participant, ToastMessage } from "@/lib/types";
import { formatParticipantLabel, getParticipantPartySize } from "@/lib/utils";

const LOCAL_PARTICIPANTS_STORAGE_KEY = "fister-festivalen-local-participants";
const IMAGE_ARCHIVE_PATH = "/api/download-images";

const festivalDetails = [
  {
    icon: MapPin,
    label: "Hvor",
    value: "Fistervegen 816",
  },
  {
    icon: CalendarDays,
    label: "Nar",
    value: "TBA",
  },
  {
    icon: CloudSun,
    label: "Vaermelding",
    value: "TBA",
  },
] as const;

type MarqueePhoto = {
  src: string;
  alt: string;
  objectPosition?: string;
};

type SignupEntry = {
  name: string;
  companionCount: number;
};

function CompactSignupCta({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (entry: SignupEntry) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const [companionCount, setCompanionCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusInputRef = useRef(false);
  const totalToRegister = companionCount + 1;
  const submitLabel = `Meld inn ${totalToRegister} ${
    totalToRegister === 1 ? "person" : "personer"
  }`;

  function openSignup({ focusInput = false }: { focusInput?: boolean } = {}) {
    setError(null);
    shouldFocusInputRef.current = focusInput;
    setIsExpanded(true);
  }

  function closeSignup() {
    setError(null);
    setIsExpanded(false);
  }

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    if (!shouldFocusInputRef.current) {
      return;
    }

    shouldFocusInputRef.current = false;

    const isFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const focusTimeoutId = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, isFinePointer ? 220 : 320);

    return () => {
      window.clearTimeout(focusTimeoutId);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (containerRef.current?.contains(target)) {
        return;
      }

      closeSignup();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSignup();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setError("Skriv inn minst ett navn.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        companionCount,
      });
      setName("");
      setCompanionCount(0);
      closeSignup();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kunne ikke registrere paameldingen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-[28rem] sm:mt-12 sm:max-w-[58rem]">
      <div
        ref={containerRef}
        className={`mx-auto origin-center overflow-hidden border border-[#d9c5a5] bg-[#eddabd] will-change-[width,max-width,transform] transition-[width,max-width,border-radius,box-shadow,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded
            ? "w-full max-w-[28rem] rounded-[1.8rem] shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:max-w-[58rem] sm:rounded-full"
            : "w-full max-w-[22rem] rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
        }`}
      >
        <div
          className={`relative transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isExpanded ? "h-[12.75rem] sm:h-20" : "h-12"
          }`}
        >
          <div
            aria-hidden={isExpanded}
            className={`absolute inset-0 transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpanded
                ? "pointer-events-none translate-y-1 scale-[0.985] opacity-0 blur-[3px]"
                : "translate-y-0 scale-100 opacity-100 blur-0 delay-100"
            }`}
          >
            <button
              className="flex h-full w-full touch-manipulation items-center justify-center gap-2 px-5 text-[0.92rem] font-semibold text-slate-900 sm:text-[0.9rem]"
              onClick={() => openSignup({ focusInput: true })}
              type="button"
            >
              Meld deg p&aring;
              <ArrowRight className="size-5" />
            </button>
          </div>

          <form
            className={`absolute inset-0 flex flex-wrap items-center gap-2.5 px-3 py-3.5 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] xl:flex-nowrap xl:gap-3 xl:px-4 xl:py-3 ${
              isExpanded
                ? "translate-y-0 opacity-100 blur-0 delay-150"
                : "pointer-events-none translate-y-2 scale-[0.992] opacity-0 blur-[3px]"
            }`}
            onSubmit={handleSubmit}
          >
            <input
              className="order-1 h-12 w-full min-w-0 basis-full bg-transparent px-3 text-base font-medium text-slate-950 outline-none placeholder:text-base placeholder:font-medium placeholder:text-slate-950 placeholder:opacity-100 disabled:cursor-default sm:h-14 sm:px-5 xl:flex-1 xl:basis-auto xl:min-w-[13rem] xl:text-[0.92rem] xl:placeholder:text-[0.92rem]"
              autoComplete="name"
              disabled={!isExpanded || isSubmitting}
              enterKeyHint="done"
              maxLength={80}
              name="quick-signup-name"
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Navnet ditt"
              ref={inputRef}
              value={name}
            />

            <span
              aria-hidden="true"
              className="order-2 hidden shrink-0 pl-1 text-lg font-semibold text-slate-700 xl:block xl:translate-x-3"
            >
              +
            </span>

            <div className="order-3 flex h-12 w-full basis-full min-w-[8.5rem] shrink-0 items-center justify-between rounded-full bg-white/40 px-3 xl:ml-8 xl:h-14 xl:w-auto xl:basis-auto xl:rounded-none xl:bg-transparent xl:px-0 2xl:ml-12">
              <div className="min-w-0 text-left xl:min-w-[4.5rem] xl:text-center">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ekstra
                </p>
                <p className="text-[1.15rem] font-semibold text-slate-900">
                  {companionCount}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  className="rounded-full p-1 text-slate-600 transition hover:bg-white/35 hover:text-slate-900 disabled:opacity-40 touch-manipulation"
                  disabled={!isExpanded || isSubmitting}
                  onClick={() =>
                    setCompanionCount((current) => Math.min(current + 1, 20))
                  }
                  type="button"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  className="rounded-full p-1 text-slate-600 transition hover:bg-white/35 hover:text-slate-900 disabled:opacity-40 touch-manipulation"
                  disabled={!isExpanded || isSubmitting}
                  onClick={() =>
                    setCompanionCount((current) => Math.max(current - 1, 0))
                  }
                  type="button"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>

            <button
              className="order-4 inline-flex h-12 w-full basis-full touch-manipulation items-center justify-center rounded-full bg-[#0d8a58] px-5 text-[0.88rem] leading-none font-semibold whitespace-nowrap text-white transition hover:bg-[#0b744b] disabled:cursor-not-allowed disabled:opacity-50 xl:ml-auto xl:h-14 xl:w-auto xl:basis-auto xl:px-6 xl:text-[0.9rem]"
              disabled={!isExpanded || disabled || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                submitLabel
              )}
            </button>
          </form>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
          error ? "mt-3 max-h-16 translate-y-0 opacity-100" : "max-h-0 -translate-y-1 opacity-0"
        }`}
      >
        <p className="text-sm font-medium text-[#9f1239]">{error}</p>
      </div>
    </div>
  );
}

function FestivalInfoBand({
  tone = "sand",
  onQuickSignup,
  onDeleteParticipant,
  signupDisabled = false,
  participants = [],
  participantState = "ready",
  totalParticipants = 0,
  deletingParticipantIds = new Set<string>(),
}: {
  tone?: "sand" | "green";
  onQuickSignup?: (entry: SignupEntry) => Promise<void>;
  onDeleteParticipant?: (participant: Participant) => Promise<void>;
  signupDisabled?: boolean;
  participants?: Participant[];
  participantState?: LoadState;
  totalParticipants?: number;
  deletingParticipantIds?: ReadonlySet<string>;
}) {
  const isGreen = tone === "green";
  const sectionClasses = isGreen ? "bg-[#b9d7ae]" : "bg-[#eddabd]";
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);

  function openImagePicker() {
    imageUploadInputRef.current?.click();
  }

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }
    event.target.value = "";
  }

  if (!isGreen) {
    return (
      <section id="festivalinfo" className="section-anchor">
        <div
          className={`relative left-1/2 flex w-screen -translate-x-1/2 px-4 pt-8 pb-3 sm:px-10 sm:py-10 lg:py-12 ${sectionClasses}`}
        >
          <div className="mx-auto w-full max-w-5xl text-center">
            <p className="mb-4 font-display text-[2.2rem] font-semibold uppercase tracking-[0.14em] text-[#0d8a58] sm:-mt-3 sm:mb-7 sm:text-4xl">
              Info
            </p>
            <div className="mx-auto max-w-[21rem] space-y-4 text-[1.05rem] leading-8 text-slate-800 sm:max-w-4xl sm:space-y-4 sm:text-2xl sm:leading-9">
              <p>
                I tradisjon tro inviterer vi til Fister-festival ogs&aring; i
                &aring;r!
              </p>

              <p>
                Det blir servert god mat og drikke, og dagen fylles med
                aktiviteter som bading, bordtennis, fotball og ulike
                konkurranser.
              </p>

              <p>
                Det eneste dere trenger &aring; ta med er badekl&aelig;r,
                h&aring;ndkle og godt hum&oslash;r!
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-[22rem] gap-4 sm:max-w-4xl sm:gap-4 md:grid-cols-3">
              {festivalDetails.map((detail) => {
                const Icon = detail.icon;

                return (
                  <div
                    key={detail.label}
                    className="rounded-[1.55rem] border border-slate-900/10 bg-white/25 px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-[8px] sm:rounded-[1.5rem] sm:px-5 sm:py-5"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/75">
                        <Icon className="size-6 text-[#0d8a58]" />
                      </div>
                      <div className="mt-4 min-w-0">
                        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-slate-600">
                          {detail.label}
                        </p>
                        <p className="mt-2 text-[1.3rem] font-semibold text-slate-900 sm:text-xl">
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!onQuickSignup || !onDeleteParticipant) {
    return null;
  }

  return (
    <section id="signup" className="section-anchor">
      <div className="relative z-10 flex w-full items-start justify-center px-0 pt-0 pb-0 sm:px-0 sm:py-0 lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:overflow-hidden lg:min-h-[25.5rem] lg:px-8 lg:py-12">
        <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-[#b9d7ae]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[#eddabd]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl gap-0 lg:grid-cols-2 lg:gap-0">
          <div className="mx-auto flex w-full max-w-none flex-col items-center bg-[#b9d7ae] px-5 py-8 text-center sm:px-8 sm:py-10 lg:col-start-1 lg:max-w-[46rem] lg:-translate-y-4 lg:bg-transparent lg:px-8 lg:py-0">
            <h2 className="font-display text-4xl leading-none text-slate-950 sm:text-6xl lg:text-7xl">
              P&aring;melding
            </h2>

            <CompactSignupCta
              disabled={signupDisabled}
              onSubmit={onQuickSignup}
            />

            <div className="mt-5 flex w-full justify-center">
              <div
                className={`w-full overflow-hidden rounded-[1.7rem] border border-[#d9c5a5] bg-[#eddabd] shadow-[0_18px_36px_rgba(15,23,42,0.1)] transition-[max-width] duration-300 ease-out ${
                  isParticipantListOpen
                    ? "max-w-full sm:max-w-2xl"
                    : "max-w-full sm:max-w-[22rem]"
                }`}
              >
                <button
                  aria-controls="festival-inline-participants"
                  aria-expanded={isParticipantListOpen}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-900 transition-[background-color,border-color] duration-300 ease-out hover:bg-[#e7d0ad] sm:px-6 sm:text-base ${
                    isParticipantListOpen ? "border-b border-[#d9c5a5]" : "border-b border-transparent"
                  }`}
                  onClick={() => setIsParticipantListOpen((current) => !current)}
                  type="button"
                >
                  <UsersRound className="size-5 text-[#0d8a58]" />
                  <span className="sm:hidden">Deltakere</span>
                  <span className="hidden sm:inline">Antall deltakere</span>
                  <span className="rounded-full bg-white/65 px-2.5 py-1 text-sm font-bold text-slate-950">
                    {totalParticipants}
                  </span>
                  <ChevronDown
                    className={`size-5 text-slate-700 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isParticipantListOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  aria-hidden={!isParticipantListOpen}
                  id="festival-inline-participants"
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                    isParticipantListOpen
                      ? "max-h-[28rem] opacity-100"
                      : "pointer-events-none max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`text-left transition-transform duration-300 ease-out ${
                      isParticipantListOpen ? "translate-y-0" : "-translate-y-1"
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Alle p&aring;meldte
                      </p>

                      {participantState === "loading" ? (
                        <div className="mt-4 flex min-h-24 items-center justify-center rounded-[1.3rem] bg-white/55">
                          <LoaderCircle className="size-6 animate-spin text-[#0f766e]" />
                        </div>
                      ) : null}

                      {participantState !== "loading" &&
                      participants.length === 0 ? (
                        <div className="mt-4 rounded-[1.3rem] bg-white/55 px-4 py-5 text-sm leading-6 text-slate-600">
                          Ingen har meldt seg pa enda.
                        </div>
                      ) : null}

                      {participantState !== "loading" &&
                      participants.length > 0 ? (
                        <ul className="mt-4 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                          {participants.map((participant, index) => (
                            <li
                              key={participant.id}
                              className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-white/70 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                            >
                              <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
                                {formatParticipantLabel(participant)}
                              </span>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  #{participants.length - index}
                                </span>
                                <button
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-[#dc2626] px-3 text-xs font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:bg-[#fca5a5]"
                                  disabled={deletingParticipantIds.has(participant.id)}
                                  onClick={() => void onDeleteParticipant(participant)}
                                  type="button"
                                >
                                  {deletingParticipantIds.has(participant.id) ? (
                                    <LoaderCircle className="size-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-3.5" />
                                  )}
                                  Slett
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-none items-center justify-center bg-[#eddabd] px-5 py-8 text-center sm:px-8 sm:py-10 lg:col-start-2 lg:mt-0 lg:max-w-xl lg:-translate-y-4 lg:bg-transparent lg:px-8 lg:py-0">
            <div className="w-full max-w-[26rem]">
              <h2 className="font-display text-4xl leading-none text-slate-950 sm:text-6xl lg:text-7xl">
                Bilder
              </h2>

              <input
                accept="image/*"
                className="sr-only"
                multiple
                onChange={handleImageSelection}
                ref={imageUploadInputRef}
                type="file"
              />

              <div className="mt-8 flex flex-col items-center gap-4 sm:mt-12 sm:gap-5">
                <button
                  className="inline-flex h-12 w-full max-w-full items-center justify-center gap-2 rounded-full bg-[#0d8a58] px-5 text-base font-semibold text-white transition hover:bg-[#0b744b] sm:w-[20rem]"
                  onClick={openImagePicker}
                  type="button"
                >
                  <UploadCloud className="size-5" />
                  Last opp bilder
                </button>

                <a
                  className="inline-flex h-12 w-full max-w-full items-center justify-center gap-2 rounded-full bg-[#0d8a58] px-5 text-base font-semibold !text-white transition hover:bg-[#0b744b] visited:!text-white sm:w-[20rem]"
                  download="fister-festivalen-bilder.zip"
                  href={IMAGE_ARCHIVE_PATH}
                >
                  <Download className="size-5 text-white" />
                  Last ned bilder
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const marqueePhotos: ReadonlyArray<MarqueePhoto> = [
  {
    src: "/festival/marquee/C003451-R1-12-18.JPG",
    alt: "Bilde fra fjorarets Fister-festival ved bryggen.",
  },
  {
    src: "/festival/marquee/C003451-R1-17-23.JPG",
    alt: "Bilde fra fjorarets Fister-festival med aktivitet ute.",
  },
  {
    src: "/festival/marquee/C003451-R1-18-24.JPG",
    alt: "Bilde fra fjorarets Fister-festival i sommersol.",
  },
  {
    src: "/festival/marquee/C003451-R1-19-25.JPG",
    alt: "Bilde fra fjorarets Fister-festival ved fjorden.",
  },
  {
    src: "/festival/marquee/C003451-R1-20-26.JPG",
    alt: "Bilde fra fjorarets Fister-festival med bryggestemning.",
  },
  {
    src: "/festival/marquee/C003451-R1-22-28.JPG",
    alt: "Bilde fra fjorarets Fister-festival ved vannet.",
  },
  {
    src: "/festival/marquee/C003451-R1-23-29.JPG",
    alt: "Bilde fra fjorarets Fister-festival med folk pa bryggen.",
  },
  {
    src: "/festival/marquee/C003451-R1-25-31.JPG",
    alt: "Bilde fra fjorarets Fister-festival i kveldssol.",
  },
] as const;

const marqueeReversePhotos: ReadonlyArray<MarqueePhoto> = [
  {
    src: "/festival/marquee-reverse/IMG_0146.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 18%",
  },
  {
    src: "/festival/marquee-reverse/IMG_0155.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
  },
  {
    src: "/festival/marquee-reverse/IMG_0183.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
  },
  {
    src: "/festival/marquee-reverse/IMG_0209.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 18%",
  },
  {
    src: "/festival/marquee-reverse/IMG_3837.JPG",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
  },
  {
    src: "/festival/marquee-reverse/IMG_9866.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
  },
  {
    src: "/festival/marquee-reverse/IMG_9932.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 20%",
  },
  {
    src: "/festival/marquee-reverse/IMG_0191.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 18%",
  },
  {
    src: "/festival/marquee-reverse/IMG_9964.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 18%",
  },
  {
    src: "/festival/marquee-reverse/IMG_9973.jpeg",
    alt: "Bilde fra fjorarets Fister-festival i rullende galleri.",
    objectPosition: "center 8%",
  },
];

function toParticipant(docId: string, data: Record<string, unknown>): Participant {
  return {
    id: docId,
    name: typeof data.name === "string" ? data.name : "Ukjent deltaker",
    companionCount:
      typeof data.companionCount === "number" && data.companionCount > 0
        ? data.companionCount
        : 0,
    createdAtMs:
      typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
  };
}

export function FestivalApp() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsState, setParticipantsState] = useState<LoadState>(
    hasFirebaseConfig ? "loading" : "ready",
  );
  const [deletingParticipantIds, setDeletingParticipantIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const totalParticipants = participants.reduce(
    (sum, participant) => sum + getParticipantPartySize(participant),
    0,
  );

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
    if (hasFirebaseConfig) {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(
        LOCAL_PARTICIPANTS_STORAGE_KEY,
      );

      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue);

      if (!Array.isArray(parsedValue)) {
        return;
      }

      const parsedParticipants = parsedValue
        .map((item) => toParticipant(String(item?.id ?? crypto.randomUUID()), item))
        .sort((left, right) => right.createdAtMs - left.createdAtMs);

      const animationFrameId = window.requestAnimationFrame(() => {
        setParticipants(parsedParticipants);
      });

      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    } catch {
      const animationFrameId = window.requestAnimationFrame(() => {
        pushToast({
          tone: "error",
          title: "Kunne ikke lese lokal paamelding",
          description:
            "Lokal lagring i nettleseren feilet. Prov aa laste siden pa nytt.",
        });
      });

      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

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
    if (toasts.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3_600);

    return () => window.clearTimeout(timeoutId);
  }, [toasts]);

  async function submitSignupEntries(entries: SignupEntry[]) {
    const normalizedEntries = entries
      .map((entry) => ({
        name: entry.name.trim(),
        companionCount: Math.max(0, Math.floor(entry.companionCount)),
      }))
      .filter((entry) => entry.name.length > 0);

    if (normalizedEntries.length === 0) {
      throw new Error("Legg inn minst ett navn for aa sende paameldingen.");
    }

    const submittedAt = Date.now();
    const localParticipants = normalizedEntries.map((entry, index) => ({
      id: crypto.randomUUID(),
      name: entry.name,
      companionCount: entry.companionCount,
      createdAtMs: submittedAt + index,
    }));

    if (!hasFirebaseConfig || !db) {
      const updatedParticipants = [...localParticipants, ...participants].sort(
        (left, right) => right.createdAtMs - left.createdAtMs,
      );

      startTransition(() => {
        setParticipants(updatedParticipants);
        setParticipantsState("ready");
      });

      try {
        window.localStorage.setItem(
          LOCAL_PARTICIPANTS_STORAGE_KEY,
          JSON.stringify(updatedParticipants),
        );
      } catch {
        pushToast({
          tone: "error",
          title: "Kunne ikke lagre lokalt",
          description: "Paameldingen vises naa, men ble ikke lagret i nettleseren.",
        });
      }

      const totalAdded = normalizedEntries.reduce(
        (sum, entry) => sum + entry.companionCount + 1,
        0,
      );

      pushToast({
        tone: "success",
        title: "Paameldingen er registrert",
        description: `${totalAdded} ${
          totalAdded === 1 ? "person er" : "personer er"
        } lagt til lokalt i festivaloversikten.`,
      });

      return;
    }

    const participantsRef = getParticipantsCollection();

    if (!participantsRef) {
      throw new Error("Kunne ikke finne deltakerlisten i Firebase.");
    }

    const batch = writeBatch(db);
    const submittedParticipants = normalizedEntries.map((entry, index) => {
      const participantRef = doc(participantsRef);

      return {
        id: participantRef.id,
        ref: participantRef,
        name: entry.name,
        companionCount: entry.companionCount,
        createdAtMs: submittedAt + index,
      };
    });

    submittedParticipants.forEach((participant) => {
      batch.set(participant.ref, {
        name: participant.name,
        companionCount: participant.companionCount,
        createdAtMs: participant.createdAtMs,
      });
    });

    await batch.commit();

    startTransition(() => {
      setParticipants((current) => {
        const submittedIds = new Set(
          submittedParticipants.map((participant) => participant.id),
        );
        const optimisticParticipants = submittedParticipants
          .map((participant) => ({
            id: participant.id,
            name: participant.name,
            companionCount: participant.companionCount,
            createdAtMs: participant.createdAtMs,
          }))
          .sort((left, right) => right.createdAtMs - left.createdAtMs);

        return [
          ...optimisticParticipants,
          ...current.filter((participant) => !submittedIds.has(participant.id)),
        ];
      });
      setParticipantsState("ready");
    });

    const totalAdded = normalizedEntries.reduce(
      (sum, entry) => sum + entry.companionCount + 1,
      0,
    );

    pushToast({
      tone: "success",
      title: "Paameldingen er registrert",
      description: `${totalAdded} ${
        totalAdded === 1 ? "person er" : "personer er"
      } lagt til i festivaloversikten.`,
    });
  }

  async function handleQuickSignup(entry: SignupEntry) {
    await submitSignupEntries([entry]);
  }

  async function handleDeleteParticipant(participant: Participant) {
    setDeletingParticipantIds((current) => {
      const next = new Set(current);
      next.add(participant.id);
      return next;
    });

    try {
      if (!hasFirebaseConfig || !db) {
        const updatedParticipants = participants.filter(
          (currentParticipant) => currentParticipant.id !== participant.id,
        );

        startTransition(() => {
          setParticipants(updatedParticipants);
          setParticipantsState("ready");
        });

        try {
          window.localStorage.setItem(
            LOCAL_PARTICIPANTS_STORAGE_KEY,
            JSON.stringify(updatedParticipants),
          );
        } catch {
          pushToast({
            tone: "error",
            title: "Kunne ikke lagre sletting lokalt",
            description:
              "Deltakeren ble fjernet fra visningen, men lokal lagring feilet.",
          });
        }

        pushToast({
          tone: "success",
          title: "Deltaker slettet",
          description: `${formatParticipantLabel(participant)} ble fjernet fra listen.`,
        });
        return;
      }

      const participantsRef = getParticipantsCollection();

      if (!participantsRef) {
        throw new Error("Kunne ikke finne deltakerlisten i Firebase.");
      }

      await deleteDoc(doc(participantsRef, participant.id));

      startTransition(() => {
        setParticipants((current) =>
          current.filter((currentParticipant) => currentParticipant.id !== participant.id),
        );
        setParticipantsState("ready");
      });

      pushToast({
        tone: "success",
        title: "Deltaker slettet",
        description: `${formatParticipantLabel(participant)} ble fjernet fra festivaloversikten.`,
      });
    } catch (error) {
      pushToast({
        tone: "error",
        title: "Kunne ikke slette deltaker",
        description:
          error instanceof Error
            ? error.message
            : "Prov igjen om et oyeblikk.",
      });
    } finally {
      setDeletingParticipantIds((current) => {
        const next = new Set(current);
        next.delete(participant.id);
        return next;
      });
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="hero-glow absolute left-[-10rem] top-[-4rem] size-[20rem] rounded-full bg-[#ffe5b4]" />
      <div className="hero-glow absolute right-[-7rem] top-40 size-[22rem] rounded-full bg-[#8fd3ff]" />
      <div className="hero-glow absolute bottom-10 left-1/3 size-[18rem] rounded-full bg-[#b8f2d9]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <main className="flex flex-1 flex-col">
          <div className="flex flex-col gap-0">
            <section className="section-anchor">
              <div className="group relative left-1/2 h-[100svh] min-h-[100svh] w-screen -translate-x-1/2 overflow-hidden">
                <Image
                  alt="Stort festivalbilde fra Fister-Festivalen ved vannet."
                  className="object-cover object-[35%_56%] transition duration-700 group-hover:scale-105"
                  fill
                  priority
                  sizes="100vw"
                  src="/festival/hero-feature.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/18 via-transparent to-slate-950/36" />
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 sm:pt-16 lg:pt-20">
                  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-[22rem] px-2 py-2 text-center sm:max-w-3xl sm:px-0 sm:py-0">
                      <h1 className="font-display text-[clamp(2.1rem,10.5vw,3.45rem)] leading-[0.88] tracking-[-0.04em] text-[#0d8a58] drop-shadow-[0_10px_30px_rgba(255,255,255,0.35)] sm:text-6xl lg:text-7xl xl:text-8xl">
                        <span className="block whitespace-nowrap">Fister-Festivalen</span>
                        <span className="block">2026</span>
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <FestivalInfoBand />

            <section aria-hidden="true" className="section-anchor">
              <div className="pointer-events-none relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-0">
                <div className="space-y-0">
                  <div className="marquee-track">
                    {[0, 1].map((groupIndex) => (
                      <div
                        key={groupIndex}
                        aria-hidden={groupIndex === 1}
                        className="marquee-group"
                      >
                        {marqueePhotos.map((photo) => (
                          <article
                            key={`${groupIndex}-${photo.src}`}
                            className="relative h-40 w-[15rem] shrink-0 overflow-hidden sm:h-56 sm:w-[22rem] lg:h-72 lg:w-[28rem]"
                          >
                            <Image
                              alt={photo.alt}
                              className="object-cover"
                              fill
                              sizes="(max-width: 640px) 15rem, (max-width: 1024px) 22rem, 28rem"
                              src={photo.src}
                            />
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="marquee-track marquee-track-reverse">
                    {[0, 1].map((groupIndex) => (
                      <div
                        key={`reverse-${groupIndex}`}
                        aria-hidden={groupIndex === 1}
                        className="marquee-group"
                      >
                        {marqueeReversePhotos.map((photo) => (
                          <article
                            key={`reverse-${groupIndex}-${photo.src}`}
                            className="relative h-40 w-[15rem] shrink-0 overflow-hidden sm:h-56 sm:w-[22rem] lg:h-72 lg:w-[28rem]"
                          >
                            <Image
                              alt={photo.alt}
                              className="object-cover"
                              fill
                              sizes="(max-width: 640px) 15rem, (max-width: 1024px) 22rem, 28rem"
                              style={
                                photo.objectPosition
                                  ? ({
                                      objectPosition: photo.objectPosition,
                                    } satisfies CSSProperties)
                                  : undefined
                              }
                              src={photo.src}
                            />
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <FestivalInfoBand
              tone="green"
              deletingParticipantIds={deletingParticipantIds}
              onDeleteParticipant={handleDeleteParticipant}
              onQuickSignup={handleQuickSignup}
              signupDisabled={false}
              participants={participants}
              participantState={participantsState}
              totalParticipants={totalParticipants}
            />
          </div>
        </main>
      </div>

      <ToastRegion toasts={toasts} />
    </div>
  );
}
