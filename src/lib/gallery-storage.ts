import { getStore } from "@netlify/blobs";

import type { GalleryItem } from "@/lib/types";
import { slugifyFileName } from "@/lib/utils";

export const GALLERY_STORE_NAME = "festival-gallery";
export const GALLERY_KEY_PREFIX = `groups/${
  process.env.NEXT_PUBLIC_FIREBASE_GROUP_ID || "fister-festivalen"
}/images/`;

type GalleryMetadata = {
  id: string;
  name: string;
  contentType: string;
  createdAtMs: number;
};

export function getGalleryStore() {
  return getStore(GALLERY_STORE_NAME, { consistency: "strong" });
}

export function getGalleryKey(imageId: string) {
  return `${GALLERY_KEY_PREFIX}${imageId}`;
}

export function getGalleryItemFromMetadata(
  metadata: Partial<GalleryMetadata> | null | undefined,
): GalleryItem | null {
  if (!metadata?.id || !metadata.name || !metadata.createdAtMs) {
    return null;
  }

  return {
    id: metadata.id,
    name: metadata.name,
    url: `/api/gallery/${metadata.id}`,
    storagePath: getGalleryKey(metadata.id),
    createdAtMs: metadata.createdAtMs,
  };
}

export async function listGalleryItems() {
  const store = getGalleryStore();
  const list = await store.list({ prefix: GALLERY_KEY_PREFIX });
  const items = await Promise.all(
    list.blobs.map(async (blob) => {
      const metadata = await store.getMetadata(blob.key);
      return getGalleryItemFromMetadata(
        metadata?.metadata as Partial<GalleryMetadata> | undefined,
      );
    }),
  );

  return items
    .filter((item): item is GalleryItem => item !== null)
    .sort((left, right) => right.createdAtMs - left.createdAtMs);
}

export function createGalleryImageId(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const safeExtension = extension && extension.length <= 5 ? extension : "jpg";
  const safeName = slugifyFileName(fileName.replace(/\.[^.]+$/, "")) || "bilde";

  return `${Date.now()}-${crypto.randomUUID()}-${safeName}.${safeExtension}`;
}
