import { NextResponse } from "next/server";

import { getGalleryKey, getGalleryStore } from "@/lib/gallery-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return NextResponse.json({ error: "Mangler bilde-ID." }, { status: 400 });
    }

    const store = getGalleryStore();
    const result = await store.getWithMetadata(getGalleryKey(imageId), {
      type: "arrayBuffer",
    });

    if (!result) {
      return NextResponse.json({ error: "Fant ikke bildet." }, { status: 404 });
    }

    const metadata = result.metadata as {
      contentType?: string;
      name?: string;
    };

    return new Response(result.data, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${metadata.name || imageId}"`,
        "Content-Type": metadata.contentType || "image/jpeg",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente bildet." },
      { status: 503 },
    );
  }
}
