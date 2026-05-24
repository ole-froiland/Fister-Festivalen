import JSZip from "jszip";

import { getGalleryKey, getGalleryStore, listGalleryItems } from "@/lib/gallery-storage";

export const runtime = "nodejs";

const ARCHIVE_FILENAME = "fister-festivalen-bilder.zip";

export async function GET() {
  try {
    const store = getGalleryStore();
    const items = await listGalleryItems();

    if (items.length === 0) {
      return Response.json(
        {
          message: "Ingen bilder er lastet opp enda.",
        },
        { status: 404 },
      );
    }

    const archive = new JSZip();

    await Promise.all(
      items.map(async (item, index) => {
        const data = await store.get(getGalleryKey(item.id), {
          type: "arrayBuffer",
        });
        const safeName = item.name.replace(/[^\w.\- ]/g, "").trim() || item.id;

        archive.file(`${String(index + 1).padStart(2, "0")}-${safeName}`, data);
      }),
    );

    const archiveBuffer = await archive.generateAsync({
      compression: "DEFLATE",
      type: "nodebuffer",
    });

    return new Response(new Uint8Array(archiveBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="${ARCHIVE_FILENAME}"`,
        "Content-Type": "application/zip",
      },
    });
  } catch {
    return Response.json(
      {
        message: "Fant ikke bildefilen for nedlasting.",
      },
      { status: 404 },
    );
  }
}
