import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";

import type { Participant } from "@/lib/types";

const PARTICIPANTS_STORE_NAME = "festival-participants";
const PARTICIPANTS_KEY_PREFIX = `groups/${
  process.env.NEXT_PUBLIC_FIREBASE_GROUP_ID || "fister-festivalen"
}/participants/`;

type SignupEntryPayload = {
  name?: unknown;
  companionCount?: unknown;
};

function getParticipantsStore() {
  return getStore(PARTICIPANTS_STORE_NAME, { consistency: "strong" });
}

function toParticipant(docId: string, data: unknown): Participant | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const value = data as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    id: docId,
    name,
    companionCount:
      typeof value.companionCount === "number" && value.companionCount > 0
        ? value.companionCount
        : 0,
    createdAtMs:
      typeof value.createdAtMs === "number" ? value.createdAtMs : Date.now(),
  };
}

function normalizeEntry(entry: SignupEntryPayload) {
  const name = typeof entry.name === "string" ? entry.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    name: name.slice(0, 80),
    companionCount:
      typeof entry.companionCount === "number"
        ? Math.min(20, Math.max(0, Math.floor(entry.companionCount)))
        : 0,
  };
}

export async function GET() {
  try {
    const store = getParticipantsStore();
    const list = await store.list({ prefix: PARTICIPANTS_KEY_PREFIX });
    const participants = (
      await Promise.all(
        list.blobs.map(async (blob) => {
          const data = await store.get(blob.key, { type: "json" });
          return toParticipant(blob.key.replace(PARTICIPANTS_KEY_PREFIX, ""), data);
        }),
      )
    )
      .filter((participant): participant is Participant => participant !== null)
      .sort((left, right) => right.createdAtMs - left.createdAtMs);

    return NextResponse.json({ participants });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente deltakerlisten." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entries?: SignupEntryPayload[];
      name?: unknown;
      companionCount?: unknown;
    };
    const requestedEntries = Array.isArray(body.entries)
      ? body.entries
      : [{ name: body.name, companionCount: body.companionCount }];
    const entries = requestedEntries
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is NonNullable<ReturnType<typeof normalizeEntry>> =>
        entry !== null,
      );

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Legg inn minst ett navn for aa sende paameldingen." },
        { status: 400 },
      );
    }

    const store = getParticipantsStore();
    const submittedAt = Date.now();
    const participants = entries.map((entry, index) => ({
      id: crypto.randomUUID(),
      name: entry.name,
      companionCount: entry.companionCount,
      createdAtMs: submittedAt + index,
    }));

    await Promise.all(
      participants.map((participant) =>
        store.setJSON(`${PARTICIPANTS_KEY_PREFIX}${participant.id}`, {
          name: participant.name,
          companionCount: participant.companionCount,
          createdAtMs: participant.createdAtMs,
        }),
      ),
    );

    return NextResponse.json({ participants }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke lagre paameldingen." },
      { status: 503 },
    );
  }
}
