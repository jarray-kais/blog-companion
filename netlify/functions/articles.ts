import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
   
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return new Response(JSON.stringify({ error: "Configuration Error", details: "Server configuration missing" }), {
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
       const errText = await response.text();
       console.error("Supabase REST Error:", errText);
       
       let errorDetails;
       try {
         errorDetails = JSON.parse(errText);
       } catch {
         errorDetails = { message: errText };
       }

       return new Response(JSON.stringify({ 
         error: "Failed to fetch articles", 
         details: errorDetails 
       }), {
         status: response.status || 500,
         headers: { "content-type": "application/json" }
       });
    }

    const articles = await response.json();

    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  } catch (error: any) {
    console.error("Internal Function Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error.message 
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/articles",
};
