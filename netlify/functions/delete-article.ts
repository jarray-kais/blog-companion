import type { Config } from "@netlify/edge-functions";

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Config Error" }), { 
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    // Récupérer les headers d'authentification du client
    const userAuthHeader = request.headers.get("Authorization");
    const userApiKey = request.headers.get("apikey");

    if (!userAuthHeader || !userApiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Auth Headers" }), { 
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }

    // Lire le body de la requête
    const body = await request.text();

    // Forwarder la requête vers la Supabase Edge Function
    const supabaseFunctionUrl = `${SUPABASE_URL}/functions/v1/delete-article`;
    
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

  } catch (e: any) {
    console.error("Netlify Proxy Error:", e);
    return new Response(JSON.stringify({ error: "Erreur proxy", message: e.message }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/delete-article",
};
