import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";

const PARTICIPANTS_STORE_NAME = "festival-participants";
const PARTICIPANTS_KEY_PREFIX = `groups/${
  process.env.NEXT_PUBLIC_FIREBASE_GROUP_ID || "fister-festivalen"
}/participants/`;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ participantId: string }> },
) {
  try {
    const { participantId } = await params;

    if (!participantId) {
      return NextResponse.json(
        { error: "Mangler deltaker-ID." },
        { status: 400 },
      );
    }

    const store = getStore(PARTICIPANTS_STORE_NAME);
    await store.delete(`${PARTICIPANTS_KEY_PREFIX}${participantId}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke slette deltakeren." },
      { status: 503 },
    );
  }
}
