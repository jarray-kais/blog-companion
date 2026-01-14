import type { Config } from "@netlify/edge-functions";

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    
    // Headers utilisateur
    const userAuthHeader = request.headers.get("Authorization");
    const userApiKey = request.headers.get("apikey");

    if (!SUPABASE_URL) return new Response(JSON.stringify({error: "Config Error"}), { status: 500 });
    if (!userAuthHeader || !userApiKey) return new Response(JSON.stringify({error: "Unauthorized: Missing Auth Headers"}), { status: 401 });

    const { id } = await request.json();

    // SUPPRESSION via API Supabase en mode RLS
    // On demande le retour des données supprimées ('return=representation') pour vérifier si ça a marché.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": userApiKey,
        "Authorization": userAuthHeader,
        "Content-Type": "application/json",
        "Prefer": "return=representation", // CRUCIAL pour savoir si on a delete quelque chose
      },
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Supabase DELETE Error:", errText);
        return new Response(JSON.stringify({ error: "Erreur Supabase", details: errText }), { 
          status: response.status,
          headers: { "content-type": "application/json" }
        });
    }

    const deletedRows = await response.json();

    // Si le tableau est vide, c'est que RLS a bloqué ou que l'ID n'existait pas
    if (deletedRows.length === 0) {
      return new Response(JSON.stringify({ error: "Tu n'as pas effacé cet article (soit il n'existe pas, soit ce n'est pas le tien)." }), {
        status: 403,
        headers: { "content-type": "application/json" }
      });
    }

    // Succès
    return new Response(JSON.stringify(deletedRows[0]), { 
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    console.error("Internal Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/delete-article",
};
