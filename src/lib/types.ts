export type Participant = {
  id: string;
  name: string;
  companionCount?: number;
  createdAtMs: number;
};

export type GalleryItem = {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  createdAtMs: number;
};

export type WeatherPayload = {
  location: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  updatedAt: string;
};

export type LoadState = "disabled" | "error" | "loading" | "ready";

export type ToastMessage = {
  id: string;
  tone: "error" | "info" | "success";
  title: string;
  description: string;
};
