import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    
    if (!SUPABASE_URL) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Config Error" })
      };
    }

    // Récupérer les headers d'authentification du client
    const userAuthHeader = event.headers["authorization"];
    const userApiKey = event.headers["apikey"];

    if (!userAuthHeader || !userApiKey) {
      return {
        statusCode: 401,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized: Missing Auth Headers" })
      };
    }

    // Forwarder la requête vers la Supabase Edge Function
    const supabaseFunctionUrl = `${SUPABASE_URL}/functions/v1/delete-article`;
    
    const response = await fetch(supabaseFunctionUrl, {
      method: "POST",
      headers: {
        "Authorization": userAuthHeader,
        "apikey": userApiKey,
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    const responseBody = await response.text();
    
    return {
      statusCode: response.status,
      headers: { "content-type": "application/json" },
      body: responseBody
    };

  } catch (e: any) {
    console.error("Netlify Proxy Error:", e);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Erreur proxy", message: e.message })
    };
  }
};
