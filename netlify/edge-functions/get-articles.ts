import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

export default async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=*&order=date_creation.desc`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
    },
  });

  const articles = await response.json();

  return new Response(JSON.stringify(articles), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, s-maxage=300", // cache 5 minutes sur le CDN
    },
  });
};

export const config: Config = {
  path: "/api/articles",
  cache: "manual",
};
