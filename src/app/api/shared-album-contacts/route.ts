import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";

import type { SharedAlbumContact } from "@/lib/types";

const CONTACTS_STORE_NAME = "festival-shared-album-contacts";
const CONTACTS_KEY_PREFIX = `groups/${
  process.env.NEXT_PUBLIC_FIREBASE_GROUP_ID || "fister-festivalen"
}/contacts/`;

function getContactsStore() {
  return getStore(CONTACTS_STORE_NAME, { consistency: "strong" });
}

function normalizePhone(phone: unknown) {
  if (typeof phone !== "string") {
    return "";
  }

  return phone.replace(/[^\d+ ]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}

function toContact(docId: string, data: unknown): SharedAlbumContact | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const value = data as Record<string, unknown>;
  const phone = normalizePhone(value.phone);

  if (!phone) {
    return null;
  }

  return {
    id: docId,
    phone,
    createdAtMs:
      typeof value.createdAtMs === "number" ? value.createdAtMs : Date.now(),
  };
}

export async function GET() {
  try {
    const store = getContactsStore();
    const list = await store.list({ prefix: CONTACTS_KEY_PREFIX });
    const contacts = (
      await Promise.all(
        list.blobs.map(async (blob) => {
          const data = await store.get(blob.key, { type: "json" });
          return toContact(blob.key.replace(CONTACTS_KEY_PREFIX, ""), data);
        }),
      )
    )
      .filter((contact): contact is SharedAlbumContact => contact !== null)
      .sort((left, right) => right.createdAtMs - left.createdAtMs);

    return NextResponse.json({ contacts });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente telefonlisten." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown };
    const phone = normalizePhone(body.phone);

    if (phone.length < 6) {
      return NextResponse.json(
        { error: "Legg inn et gyldig telefonnummer." },
        { status: 400 },
      );
    }

    const store = getContactsStore();
    const list = await store.list({ prefix: CONTACTS_KEY_PREFIX });
    const existingContacts = (
      await Promise.all(
        list.blobs.map(async (blob) => {
          const data = await store.get(blob.key, { type: "json" });
          return toContact(blob.key.replace(CONTACTS_KEY_PREFIX, ""), data);
        }),
      )
    ).filter((contact): contact is SharedAlbumContact => contact !== null);
    const existingContact = existingContacts.find(
      (contact) => contact.phone.replace(/\s+/g, "") === phone.replace(/\s+/g, ""),
    );

    if (existingContact) {
      return NextResponse.json({ contacts: [existingContact] });
    }

    const contact = {
      id: crypto.randomUUID(),
      phone,
      createdAtMs: Date.now(),
    } satisfies SharedAlbumContact;

    await store.setJSON(`${CONTACTS_KEY_PREFIX}${contact.id}`, {
      phone: contact.phone,
      createdAtMs: contact.createdAtMs,
    });

    return NextResponse.json({ contacts: [contact] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke lagre telefonnummeret." },
      { status: 503 },
    );
  }
}
