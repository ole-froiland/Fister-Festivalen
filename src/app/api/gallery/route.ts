import { NextResponse } from "next/server";

import {
  createGalleryImageId,
  getGalleryItemFromMetadata,
  getGalleryKey,
  getGalleryStore,
  listGalleryItems,
} from "@/lib/gallery-storage";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;

export async function GET() {
  try {
    return NextResponse.json({ items: await listGalleryItems() });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente bildene." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Velg minst ett bilde." },
        { status: 400 },
      );
    }

    const invalidFile = files.find(
      (file) =>
        !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE_BYTES,
    );

    if (invalidFile) {
      return NextResponse.json(
        { error: "Bildene maa vaere under 12 MB og ha gyldig bildeformat." },
        { status: 400 },
      );
    }

    const store = getGalleryStore();
    const createdAtMs = Date.now();
    const uploadedItems = await Promise.all(
      files.map(async (file, index) => {
        const id = createGalleryImageId(file.name);
        const metadata = {
          id,
          name: file.name.slice(0, 120),
          contentType: file.type || "image/jpeg",
          createdAtMs: createdAtMs + index,
        };

        await store.set(getGalleryKey(id), await file.arrayBuffer(), {
          metadata,
        });

        return getGalleryItemFromMetadata(metadata);
      }),
    );

    return NextResponse.json(
      { items: uploadedItems.filter((item) => item !== null) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke laste opp bildene." },
      { status: 503 },
    );
  }
}
