import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

export default async (request: Request) => {
  const { id } = await request.json();

  await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
    },
  });

  return new Response(null, { status: 204 });
};

export const config: Config = {
  path: "/api/delete-article",
};
