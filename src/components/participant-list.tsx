import { ListChecks, LoaderCircle, UsersRound } from "lucide-react";

import type { LoadState, Participant } from "@/lib/types";
import {
  formatParticipantLabel,
  formatRelativeTime,
  getParticipantPartySize,
} from "@/lib/utils";

type ParticipantListProps = {
  participants: Participant[];
  state: LoadState;
};

export function ParticipantList({
  participants,
  state,
}: ParticipantListProps) {
  const totalParticipants = participants.reduce(
    (sum, participant) => sum + getParticipantPartySize(participant),
    0,
  );

  return (
    <div className="card-surface rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
            Deltakerliste
          </p>
          <h2 className="mt-3 flex items-center gap-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
            <ListChecks className="size-6 text-[#0f766e]" />
            Alle paameldte
          </h2>
        </div>

        <div className="rounded-[1.35rem] bg-slate-950 px-4 py-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
            Totalt
          </p>
          <div className="mt-2 flex items-center gap-3">
            <UsersRound className="size-5 text-[#f7d794]" />
            <span className="text-3xl font-bold">{totalParticipants}</span>
          </div>
        </div>
      </div>

      {state === "loading" ? (
        <div className="mt-6 flex min-h-[18rem] items-center justify-center rounded-[1.6rem] bg-white/75">
          <LoaderCircle className="size-8 animate-spin text-[#0f766e]" />
        </div>
      ) : null}

      {state === "disabled" ? (
        <div className="mt-6 rounded-[1.6rem] bg-white/75 px-5 py-6 text-sm leading-6 text-slate-600">
          Firebase er ikke konfigurert enda. Nar du legger inn miljoverdiene,
          dukker deltakerlisten opp her i sanntid.
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-6 rounded-[1.6rem] bg-[#fff1f2] px-5 py-6 text-sm leading-6 text-[#9f1239]">
          Kunne ikke hente deltakerlisten. Kontroller Firestore-regler og
          miljoverdier.
        </div>
      ) : null}

      {state === "ready" && participants.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] bg-white/75 px-5 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">
            Ingen paameldte enda
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Vaer forst ute og legg inn de forste navnene.
          </p>
        </div>
      ) : null}

      {participants.length > 0 ? (
        <ul className="mt-6 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
          {participants.map((participant, index) => (
            <li
              key={participant.id}
              className="flex items-center justify-between rounded-[1.45rem] bg-white/80 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">
                  {formatParticipantLabel(participant)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {formatRelativeTime(participant.createdAtMs)}
                </p>
              </div>
              <div className="rounded-full bg-[#0f766e]/10 px-3 py-2 text-sm font-semibold text-[#0f766e]">
                #{participants.length - index}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
