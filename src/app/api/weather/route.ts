import { toTitleCase } from "@/lib/utils";

const FISTER_COORDINATES = {
  lat: 59.1764,
  lon: 6.0683,
};

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        message: "Legg inn OPENWEATHER_API_KEY for aa aktivere vaerkortet.",
      },
      { status: 503 },
    );
  }

  const searchParams = new URLSearchParams({
    lat: String(FISTER_COORDINATES.lat),
    lon: String(FISTER_COORDINATES.lon),
    appid: apiKey,
    units: "metric",
    lang: "no",
  });

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${searchParams.toString()}`,
      {
        next: { revalidate: 600 },
      },
    );

    if (!response.ok) {
      return Response.json(
        {
          message: "Kunne ikke hente vaerdata fra OpenWeather akkurat naa.",
        },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as {
      main?: { temp?: number; feels_like?: number };
      weather?: Array<{ description?: string; icon?: string }>;
    };

    return Response.json({
      location: "Fister, Rogaland",
      temperature: Math.round(payload.main?.temp ?? 0),
      feelsLike: Math.round(payload.main?.feels_like ?? 0),
      description: toTitleCase(payload.weather?.[0]?.description ?? "Ukjent"),
      icon: payload.weather?.[0]?.icon ?? "01d",
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        message: "Vaerdata er midlertidig utilgjengelig.",
      },
      { status: 502 },
    );
  }
}
