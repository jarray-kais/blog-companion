import type { Config } from "@netlify/edge-functions";

const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Missing Environment Variables");
      return new Response(JSON.stringify({ error: "Configuration serveur manquante (Env Vars)" }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response("Méthode non autorisée", { status: 405 });
    }

    // Adapted to match existing DB Schema: titre, contenu, auteur, user_id
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }
    const { titre, contenu, auteur, user_id } = body;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      // We send the fields expected by the database
      body: JSON.stringify({ titre, contenu, auteur, user_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase Error:", errorText);
      return new Response(JSON.stringify({ error: "Erreur Supabase", details: errorText }), {
        status: response.status,
        headers: { "content-type": "application/json" }
      });
    }

    const newArticle = await response.json();

    return new Response(JSON.stringify(newArticle), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/create-article",
};
