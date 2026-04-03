import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const ARCHIVE_FILENAME = "fister-festivalen-bilder.zip";

export async function GET() {
  const archivePath = path.join(process.cwd(), "public", ARCHIVE_FILENAME);

  try {
    const archive = await readFile(archivePath);

    return new Response(archive, {
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
