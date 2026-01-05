import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const country = context.geo?.country?.name || "Inconnu";
  const city = context.geo?.city || "Inconnue";

  return new Response(
    `<h1>Bonjour depuis ${city}, ${country} ! 🌍</h1>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
};

export const config: Config = {
  path: "/api/geo"
};