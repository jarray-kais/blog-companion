import type { Config } from "@netlify/edge-functions";

export default async (request: Request) => {
  try {
    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");
    
    // On récupère les headers envoyés par le client (User Token + Anon Key)
    const userAuthHeader = request.headers.get("Authorization");
    const userApiKey = request.headers.get("apikey");

    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Configuration serveur manquante" }), { status: 500 });
    }
    
    // Validation stricte des headers d'auth
    if (!userAuthHeader || !userApiKey) {
       return new Response(JSON.stringify({ error: "Authentification manquante (Token ou API Key)" }), { 
         status: 401, headers: { "content-type": "application/json" } 
       });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), { status: 405 });
    }

    // 1. Validation du token utilisateur auprès de Supabase Auth
    // On demande "Qui est cet utilisateur ?"
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,  // Clé publique requise pour parler à Auth
        Authorization: userAuthHeader, // Token de l'utilisateur
      }
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: "Token invalide ou expiré" }), { 
        status: 401, headers: { "content-type": "application/json" } 
      });
    }

    const userData = await userResponse.json();
    const user_id = userData.id; // L'ID réel sécurisé

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }
    const { titre, contenu, auteur } = body;

    // INSERTION via API Supabase en mode RLS
    // On injecte le user_id qu'on vient de récupérer, pour satisfaire la policy "WITH CHECK (auth.uid() = user_id)"
    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: "POST",
      headers: {
        "apikey": userApiKey,             // Clé publique
        "Authorization": userAuthHeader,  // Token utilisateur (Rôle Authenticated)
        "Content-Type": "application/json",
        "Prefer": "return=representation", // CRUCIAL pour savoir si on a touche quelque chose dans la base de données
      },
      // On envoie le user_id explicite. RLS va vérifier que ça matche le token.
      body: JSON.stringify({ titre, contenu, auteur, user_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase RLS Refused:", errorText);
      // On renvoie l'erreur brute pour que le front sache pourquoi (ex: RLS Violation)
      return new Response(JSON.stringify({ error: "Erreur Supabase (RLS)", details: errorText }), {
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
    console.error("Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/create-article",
};
