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
  Copy,
  LoaderCircle,
  MapPin,
  Phone,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import { ToastRegion } from "@/components/toast-region";
import { db, getParticipantsCollection, hasFirebaseConfig } from "@/lib/firebase";
import type {
  LoadState,
  Participant,
  SharedAlbumContact,
  ToastMessage,
} from "@/lib/types";
import { formatParticipantLabel, getParticipantPartySize } from "@/lib/utils";

const PARTICIPANTS_API_PATH = "/api/participants";
const SHARED_ALBUM_CONTACTS_API_PATH = "/api/shared-album-contacts";

const festivalDetails = [
  {
    icon: MapPin,
    label: "Hvor",
    value: "Fistervegen 816",
  },
  {
    icon: CalendarDays,
    label: "Nar",
    value: "Andre halvdel av juli",
    note: "Datoen er ikke helt satt enda – vi kommer tilbake til den når det nærmer seg og været er mer satt.",
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
    }, isFinePointer ? 160 : 220);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <div className="mx-auto mt-8 w-full max-w-[28rem] sm:mt-12 lg:max-w-[70rem]">
      <div
        ref={containerRef}
        className={`mx-auto origin-center overflow-hidden border border-[#d9c5a5] bg-[#eddabd] will-change-transform transition-[border-radius,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:duration-500 ${
          isExpanded
            ? "w-full max-w-[28rem] rounded-[1.8rem] shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:max-w-[70rem] lg:rounded-full"
            : "w-full max-w-[22rem] rounded-full shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]"
        }`}
      >
        <div
          className={`relative transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:duration-[400ms] ${
            isExpanded ? "h-16 lg:h-20" : "h-12"
          }`}
        >
          <div
            aria-hidden={isExpanded}
            className={`absolute inset-0 transition-[opacity,transform] duration-200 ease-out ${
              isExpanded
                ? "pointer-events-none translate-y-0 scale-[0.99] opacity-0"
                : "translate-y-0 scale-100 opacity-100 delay-75"
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
            className={`absolute inset-0 grid grid-cols-[minmax(4.75rem,1fr)_minmax(4.5rem,5.25rem)_minmax(7.75rem,42%)] content-center items-center gap-1.5 px-2 py-2 transition-[opacity,transform] duration-[250ms] ease-out sm:grid-cols-[minmax(8rem,1fr)_auto_minmax(5.75rem,6.75rem)_minmax(10rem,12rem)] sm:gap-2.5 sm:px-3 lg:grid-cols-[minmax(9rem,1fr)_auto_7.25rem_minmax(13rem,14.5rem)] lg:gap-3 lg:px-5 lg:py-3 ${
              isExpanded
                ? "translate-y-0 opacity-100 delay-75"
                : "pointer-events-none translate-y-1 scale-[0.995] opacity-0"
            }`}
            onSubmit={handleSubmit}
          >
            <input
              className="h-12 w-full min-w-0 bg-transparent px-2 text-[0.9rem] font-medium text-slate-950 outline-none placeholder:text-[0.9rem] placeholder:font-medium placeholder:text-slate-950 placeholder:opacity-100 disabled:cursor-default sm:px-3 sm:text-base sm:placeholder:text-base lg:h-14 lg:px-5 lg:text-[0.92rem] lg:placeholder:text-[0.92rem]"
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
              className="hidden shrink-0 text-lg font-semibold text-slate-700 sm:block"
            >
              +
            </span>

            <div className="flex h-12 w-full min-w-0 shrink-0 items-center justify-between rounded-full bg-white/45 px-2.5 ring-1 ring-white/35 sm:px-3 lg:h-14">
              <div className="min-w-0 text-left">
                <p className="text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[0.56rem] sm:tracking-[0.18em]">
                  Ekstra
                </p>
                <p className="text-[1.05rem] font-semibold text-slate-900 sm:text-[1.15rem]">
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
              className="inline-flex h-12 w-full min-w-0 touch-manipulation items-center justify-center gap-1.5 overflow-hidden rounded-full bg-[#0d8a58] px-2.5 text-[0.68rem] leading-none font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_rgba(13,138,88,0.24)] ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-[#0b744b] hover:shadow-[0_14px_28px_rgba(13,138,88,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d8a58] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:gap-2 sm:px-3 sm:text-[0.78rem] md:text-[0.82rem] lg:h-14 lg:px-4 lg:text-[0.86rem]"
              disabled={!isExpanded || disabled || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <>
                  <UsersRound className="hidden size-4 shrink-0 sm:block" />
                  <span className="min-w-0">{submitLabel}</span>
                </>
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
  onSubmitSharedAlbumContact,
  onCopySharedAlbumContacts,
  signupDisabled = false,
  sharedAlbumContactDisabled = false,
  participants = [],
  sharedAlbumContacts = [],
  participantState = "ready",
  sharedAlbumContactState = "ready",
  totalParticipants = 0,
  deletingParticipantIds = new Set<string>(),
}: {
  tone?: "sand" | "green";
  onQuickSignup?: (entry: SignupEntry) => Promise<void>;
  onDeleteParticipant?: (participant: Participant) => Promise<void>;
  onSubmitSharedAlbumContact?: (phone: string) => Promise<void>;
  onCopySharedAlbumContacts?: () => Promise<void>;
  signupDisabled?: boolean;
  sharedAlbumContactDisabled?: boolean;
  participants?: Participant[];
  sharedAlbumContacts?: SharedAlbumContact[];
  participantState?: LoadState;
  sharedAlbumContactState?: LoadState;
  totalParticipants?: number;
  deletingParticipantIds?: ReadonlySet<string>;
}) {
  const isGreen = tone === "green";
  const sectionClasses = isGreen ? "bg-[#b9d7ae]" : "bg-[#eddabd]";
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isSharedAlbumContactListOpen, setIsSharedAlbumContactListOpen] =
    useState(false);
  const [sharedAlbumPhone, setSharedAlbumPhone] = useState("");
  const [isSubmittingSharedAlbumPhone, setIsSubmittingSharedAlbumPhone] =
    useState(false);
  const [sharedAlbumPhoneError, setSharedAlbumPhoneError] = useState<string | null>(
    null,
  );

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
                        {"note" in detail && detail.note ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                            {detail.note}
                          </p>
                        ) : null}
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

  async function handleSharedAlbumPhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSharedAlbumPhoneError(null);

    const phone = sharedAlbumPhone.trim();

    if (phone.length < 6) {
      setSharedAlbumPhoneError("Legg inn telefonnummeret ditt.");
      return;
    }

    if (!onSubmitSharedAlbumContact) {
      setSharedAlbumPhoneError("Telefonlisten er ikke klar enda.");
      return;
    }

    setIsSubmittingSharedAlbumPhone(true);

    try {
      await onSubmitSharedAlbumContact(phone);
      setSharedAlbumPhone("");
    } catch (error) {
      setSharedAlbumPhoneError(
        error instanceof Error
          ? error.message
          : "Kunne ikke lagre telefonnummeret.",
      );
    } finally {
      setIsSubmittingSharedAlbumPhone(false);
    }
  }

  return (
    <section id="signup" className="section-anchor">
      <div className="relative left-1/2 z-10 flex w-screen -translate-x-1/2 items-start justify-center overflow-hidden px-0 pt-0 pb-0 sm:px-0 sm:py-0 lg:min-h-[25.5rem] lg:px-8 lg:py-12">
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

              <div className="mt-8 flex flex-col items-center gap-4 sm:mt-12 sm:gap-5">
                <div className="w-full max-w-full text-center sm:w-[22rem]">
                  <p className="text-xl font-semibold text-slate-950">
                    Vil du bli med i delt album (iPhone)?
                  </p>

                  <form
                    className="mt-4 flex flex-col gap-3"
                    onSubmit={handleSharedAlbumPhoneSubmit}
                  >
                    <label className="sr-only" htmlFor="shared-album-phone">
                      Telefonnummer til delt album
                    </label>
                    <div className="flex h-14 min-w-0 items-center gap-3 rounded-full bg-white/80 px-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <Phone className="size-5 shrink-0 text-[#0d8a58]" />
                      <input
                        autoComplete="tel"
                        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-500"
                        disabled={
                          sharedAlbumContactDisabled ||
                          isSubmittingSharedAlbumPhone
                        }
                        id="shared-album-phone"
                        inputMode="tel"
                        onChange={(event) => {
                          setSharedAlbumPhone(event.target.value);
                          setSharedAlbumPhoneError(null);
                        }}
                        placeholder="Telefonnummer"
                        type="tel"
                        value={sharedAlbumPhone}
                      />
                    </div>

                    <button
                      className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#0d8a58] px-6 text-base font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition hover:bg-[#0b744b] disabled:cursor-not-allowed disabled:bg-[#7db79a]"
                      disabled={
                        sharedAlbumContactDisabled ||
                        isSubmittingSharedAlbumPhone
                      }
                      type="submit"
                    >
                      {isSubmittingSharedAlbumPhone ? (
                        <LoaderCircle className="size-5 animate-spin" />
                      ) : (
                        "Legg til nummer"
                      )}
                    </button>

                    {sharedAlbumPhoneError ? (
                      <p className="px-2 text-sm font-medium text-[#9f1239]">
                        {sharedAlbumPhoneError}
                      </p>
                    ) : null}
                  </form>

                  <div className="mt-6 overflow-hidden rounded-full border border-[#d9c5a5] bg-[#eddabd] shadow-[0_18px_36px_rgba(15,23,42,0.08)] transition-[border-radius] duration-300 ease-out data-[open=true]:rounded-[1.7rem]" data-open={isSharedAlbumContactListOpen}>
                    <button
                      aria-controls="shared-album-contact-list"
                      aria-expanded={isSharedAlbumContactListOpen}
                      className={`inline-flex h-14 w-full items-center justify-center gap-3 px-5 text-base font-semibold text-slate-900 transition hover:bg-[#e7d0ad] ${
                        isSharedAlbumContactListOpen
                          ? "border-b border-[#d9c5a5]"
                          : "border-b border-transparent"
                      }`}
                      onClick={() =>
                        setIsSharedAlbumContactListOpen((current) => !current)
                      }
                      type="button"
                    >
                      <UsersRound className="size-5 text-[#0d8a58]" />
                      <span>Albumliste</span>
                      <span className="rounded-full bg-white/65 px-3 py-1.5 text-sm font-bold text-slate-950">
                        {sharedAlbumContacts.length}
                      </span>
                      <ChevronDown
                        className={`size-5 text-slate-700 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isSharedAlbumContactListOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>

                    <div
                      aria-hidden={!isSharedAlbumContactListOpen}
                      id="shared-album-contact-list"
                      className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                        isSharedAlbumContactListOpen
                          ? "max-h-[24rem] opacity-100"
                          : "pointer-events-none max-h-0 opacity-0"
                      }`}
                    >
                      <div className="p-4">
                        {sharedAlbumContactState === "loading" ? (
                          <div className="flex min-h-20 items-center justify-center rounded-[1.1rem] bg-white/55">
                            <LoaderCircle className="size-6 animate-spin text-[#0f766e]" />
                          </div>
                        ) : null}

                        {sharedAlbumContactState !== "loading" &&
                        sharedAlbumContacts.length === 0 ? (
                          <div className="rounded-[1.1rem] bg-white/55 px-4 py-4 text-sm leading-6 text-slate-600">
                            Ingen telefonnumre er lagt inn enda.
                          </div>
                        ) : null}

                        {sharedAlbumContactState !== "loading" &&
                        sharedAlbumContacts.length > 0 ? (
                          <>
                            <button
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                              disabled={!onCopySharedAlbumContacts}
                              onClick={() => {
                                void onCopySharedAlbumContacts?.();
                              }}
                              type="button"
                            >
                              <Copy className="size-4" />
                              Kopier alle
                            </button>

                            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                              {sharedAlbumContacts.map((contact, index) => (
                                <li
                                  className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/70 px-3 py-2"
                                  key={contact.id}
                                >
                                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                                    {contact.phone}
                                  </span>
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    #{sharedAlbumContacts.length - index}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
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

function sortParticipants(participants: Participant[]) {
  return [...participants].sort((left, right) => right.createdAtMs - left.createdAtMs);
}

function toParticipantsFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const participants = (payload as { participants?: unknown }).participants;

  if (!Array.isArray(participants)) {
    return [];
  }

  return sortParticipants(
    participants.map((item) =>
      toParticipant(String(item?.id ?? crypto.randomUUID()), item),
    ),
  );
}

function mergeParticipants(
  currentParticipants: Participant[],
  nextParticipants: Participant[],
) {
  const participantsById = new Map(
    currentParticipants.map((participant) => [participant.id, participant]),
  );

  nextParticipants.forEach((participant) => {
    participantsById.set(participant.id, participant);
  });

  return sortParticipants([...participantsById.values()]);
}

function toSharedAlbumContact(docId: string, data: Record<string, unknown>) {
  return {
    id: docId,
    phone: typeof data.phone === "string" ? data.phone : "",
    createdAtMs:
      typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
  } satisfies SharedAlbumContact;
}

function sortSharedAlbumContacts(contacts: SharedAlbumContact[]) {
  return [...contacts].sort((left, right) => right.createdAtMs - left.createdAtMs);
}

function toSharedAlbumContactsFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const contacts = (payload as { contacts?: unknown }).contacts;

  if (!Array.isArray(contacts)) {
    return [];
  }

  return sortSharedAlbumContacts(
    contacts
      .map((item) =>
        item && typeof item === "object"
          ? toSharedAlbumContact(
              String((item as { id?: unknown }).id ?? crypto.randomUUID()),
              item as Record<string, unknown>,
            )
          : null,
      )
      .filter((contact): contact is SharedAlbumContact => Boolean(contact?.phone)),
  );
}

function mergeSharedAlbumContacts(
  currentContacts: SharedAlbumContact[],
  nextContacts: SharedAlbumContact[],
) {
  const contactsById = new Map(
    currentContacts.map((contact) => [contact.id, contact]),
  );

  nextContacts.forEach((contact) => {
    contactsById.set(contact.id, contact);
  });

  return sortSharedAlbumContacts([...contactsById.values()]);
}

async function fetchSharedParticipants() {
  const response = await fetch(PARTICIPANTS_API_PATH, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente deltakerlisten.");
  }

  return toParticipantsFromPayload(await response.json());
}

async function fetchSharedAlbumContacts() {
  const response = await fetch(SHARED_ALBUM_CONTACTS_API_PATH, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente telefonlisten.");
  }

  return toSharedAlbumContactsFromPayload(await response.json());
}

export function FestivalApp() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsState, setParticipantsState] = useState<LoadState>(
    hasFirebaseConfig ? "loading" : "disabled",
  );
  const [sharedAlbumContacts, setSharedAlbumContacts] = useState<
    SharedAlbumContact[]
  >([]);
  const [sharedAlbumContactState, setSharedAlbumContactState] =
    useState<LoadState>("loading");
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
    if (!hasFirebaseConfig) {
      let isActive = true;

      async function syncSharedParticipants({ silent = false } = {}) {
        try {
          if (!silent) {
            setParticipantsState("loading");
          }

          const sharedParticipants = await fetchSharedParticipants();

          if (!isActive) {
            return;
          }

          startTransition(() => {
            setParticipants(sharedParticipants);
            setParticipantsState("ready");
          });
        } catch {
          if (!isActive) {
            return;
          }

          setParticipantsState("error");

          if (!silent) {
            pushToast({
              tone: "error",
              title: "Kunne ikke hente deltakere",
              description: "Prov aa laste siden pa nytt.",
            });
          }
        }
      }

      void syncSharedParticipants();
      const intervalId = window.setInterval(() => {
        void syncSharedParticipants({ silent: true });
      }, 4_000);

      return () => {
        isActive = false;
        window.clearInterval(intervalId);
      };
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
    let isActive = true;

    async function syncSharedAlbumContacts({ silent = false } = {}) {
      try {
        if (!silent) {
          setSharedAlbumContactState("loading");
        }

        const contacts = await fetchSharedAlbumContacts();

        if (!isActive) {
          return;
        }

        startTransition(() => {
          setSharedAlbumContacts(contacts);
          setSharedAlbumContactState("ready");
        });
      } catch {
        if (!isActive) {
          return;
        }

        setSharedAlbumContactState("error");

        if (!silent) {
          pushToast({
            tone: "error",
            title: "Kunne ikke hente telefonliste",
            description: "Prov aa laste siden pa nytt.",
          });
        }
      }
    }

    void syncSharedAlbumContacts();
    const intervalId = window.setInterval(() => {
      void syncSharedAlbumContacts({ silent: true });
    }, 6_000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
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

    if (!hasFirebaseConfig || !db) {
      const response = await fetch(PARTICIPANTS_API_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries: normalizedEntries }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Kunne ikke lagre paameldingen.");
      }

      const submittedParticipants = toParticipantsFromPayload(await response.json());

      startTransition(() => {
        setParticipants((current) =>
          mergeParticipants(current, submittedParticipants),
        );
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

      return;
    }

    const submittedAt = Date.now();
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
        const response = await fetch(`${PARTICIPANTS_API_PATH}/${participant.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error || "Kunne ikke slette deltakeren.");
        }

        startTransition(() => {
          setParticipants((current) =>
            current.filter(
              (currentParticipant) => currentParticipant.id !== participant.id,
            ),
          );
          setParticipantsState("ready");
        });

        pushToast({
          tone: "success",
          title: "Deltaker slettet",
          description: `${formatParticipantLabel(participant)} ble fjernet fra festivaloversikten.`,
        });
        return;
      }

      const participantsRef = getParticipantsCollection();

      if (!participantsRef) {
        throw new Error("Kunne ikke finne deltakerlisten i Firebase.");
      }

      await deleteDoc(doc(participantsRef, participant.id));

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

  async function handleSubmitSharedAlbumContact(phone: string) {
    const response = await fetch(SHARED_ALBUM_CONTACTS_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error || "Kunne ikke lagre telefonnummeret.");
    }

    const submittedContacts = toSharedAlbumContactsFromPayload(
      await response.json(),
    );

    startTransition(() => {
      setSharedAlbumContacts((current) =>
        mergeSharedAlbumContacts(current, submittedContacts),
      );
      setSharedAlbumContactState("ready");
    });

    pushToast({
      tone: "success",
      title: "Nummeret er lagt til",
      description: "Jeg kan kopiere listen og invitere deg til delt album.",
    });
  }

  async function handleCopySharedAlbumContacts() {
    if (sharedAlbumContacts.length === 0) {
      return;
    }

    const text = sortSharedAlbumContacts(sharedAlbumContacts)
      .map((contact) => contact.phone)
      .join("\n");

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard er ikke tilgjengelig.");
      }

      await navigator.clipboard.writeText(text);

      pushToast({
        tone: "success",
        title: "Telefonlisten er kopiert",
        description: `${sharedAlbumContacts.length} nummer ligger pa utklippstavlen.`,
      });
    } catch {
      pushToast({
        tone: "error",
        title: "Kunne ikke kopiere listen",
        description: "Marker telefonnumrene i listen og kopier manuelt.",
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
              onCopySharedAlbumContacts={handleCopySharedAlbumContacts}
              onDeleteParticipant={handleDeleteParticipant}
              onQuickSignup={handleQuickSignup}
              onSubmitSharedAlbumContact={handleSubmitSharedAlbumContact}
              signupDisabled={false}
              sharedAlbumContactDisabled={false}
              sharedAlbumContacts={sharedAlbumContacts}
              sharedAlbumContactState={sharedAlbumContactState}
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
