import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

export default async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Méthode non autorisée", { status: 405 });
  }

  // Adapted to match existing DB Schema: titre, contenu, auteur, user_id
  const { titre, contenu, auteur, user_id } = await request.json();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    // We send the fields expected by the database
    body: JSON.stringify({ titre, contenu, auteur, user_id }),
  });

  const newArticle = await response.json();

  return new Response(JSON.stringify(newArticle), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/create-article",
};
