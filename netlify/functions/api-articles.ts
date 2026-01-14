import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
   
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Configuration in get-articles");
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Service Misconfigured" })
      };
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=*&order=date_creation.desc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
       const err = await response.text();
       console.error("Supabase Error:", err);
       return {
         statusCode: 500,
         headers: { "content-type": "application/json" },
         body: JSON.stringify({ error: "Failed to fetch articles", details: err })
       };
    }

    const articles = await response.json();

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
      body: JSON.stringify(articles)
    };
  } catch (error: any) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
