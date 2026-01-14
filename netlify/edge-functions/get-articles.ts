import type { Config } from "@netlify/edge-functions";


export default async () => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Configuration in get-articles");
      return new Response(JSON.stringify({ error: "Service Misconfigured" }), { 
        status: 500, 
        headers: { "content-type": "application/json" } 
      });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=*&order=date_creation.desc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
       const err = await response.text();
       console.error("Supabase Error:", err);
       return new Response(JSON.stringify({ error: "Failed to fetch articles", details: err }), { status: 500 });
    }

    const articles = await response.json();

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
