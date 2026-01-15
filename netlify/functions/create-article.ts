import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;

    if (!SUPABASE_URL) {
      console.error("Missing SUPABASE_URL");
      return new Response(JSON.stringify({ error: "Erreur de configuration", details: "Configuration serveur manquante" }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
        status: 405,
        headers: { "content-type": "application/json" }
      });
    }

    const userAuthHeader = req.headers.get("authorization");
    const userApiKey = req.headers.get("apikey");

    if (!userAuthHeader || !userApiKey) {
      return new Response(JSON.stringify({ error: "Authentification requise", details: "Headers d'authentification manquants" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }

    const supabaseFunctionUrl = `${SUPABASE_URL}/functions/v1/create-article`;
    
    const response = await fetch(supabaseFunctionUrl, {
      method: "POST",
      headers: {
        "Authorization": userAuthHeader,
        "apikey": userApiKey,
        "Content-Type": "application/json",
      },
      body: req.body,
      // @ts-ignore - Required for streaming bodies in Node.js 18+ (Netlify Functions)
      duplex: "half", 
    });

    // Try to parse JSON response, fallback to text
    let responseData: any;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = { message: await response.text() };
    }

    if (!response.ok) {
       console.error("Supabase Upstream Error:", response.status, responseData);
       return new Response(JSON.stringify({ 
         error: responseData.error || "Erreur distante", 
         details: responseData.details || responseData.message || "Erreur inconnue de Supabase" 
       }), {
         status: response.status,
         headers: { "content-type": "application/json" }
       });
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });

  } catch (err: any) {
    console.error("Netlify Proxy Error:", err);
    return new Response(JSON.stringify({ 
      error: "Erreur interne du serveur", 
      details: err.message 
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/create-article",
};
