import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return new Response("Config Error", { status: 500 });

    const { id } = await request.json();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
        const err = await response.text();
        return new Response(err, { status: response.status });
    }

    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/delete-article",
};
