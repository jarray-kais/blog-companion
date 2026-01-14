import type { Config } from "@netlify/edge-functions";

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Configuration serveur manquante" }), { 
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
    }

    // Récupérer les headers d'authentification du client
    const userAuthHeader = request.headers.get("Authorization");
    const userApiKey = request.headers.get("apikey");

    if (!userAuthHeader || !userApiKey) {
       return new Response(JSON.stringify({ error: "Authentification manquante" }), { 
         status: 401, 
         headers: { "content-type": "application/json" } 
       });
    }

    // Lire le body de la requête
    const body = await request.text();

    // Forwarder la requête vers la Supabase Edge Function
    const supabaseFunctionUrl = `${SUPABASE_URL}/functions/v1/create-article`;
    
    const response = await fetch(supabaseFunctionUrl, {
      method: "POST",
      headers: {
        "Authorization": userAuthHeader,
        "apikey": userApiKey,
        "Content-Type": "application/json",
      },
      body: body,
    });

    // Retourner la réponse de Supabase telle quelle
    const responseBody = await response.text();
    
    return new Response(responseBody, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });

  } catch (err: any) {
    console.error("Netlify Proxy Error:", err);
    return new Response(JSON.stringify({ error: "Erreur proxy", message: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/create-article",
};
