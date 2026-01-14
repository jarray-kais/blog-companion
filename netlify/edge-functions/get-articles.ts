import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

export default async () => {
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
    return new Response(JSON.stringify(articles), {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config: Config = {
  path: "/api/articles",
  cache: "manual",
};
