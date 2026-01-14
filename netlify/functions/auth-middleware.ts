import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const authHeader = request.headers.get("authorization");
  
  // On vérifie juste la présence d'un token Bearer
  // La validation réelle se fera par Supabase RLS quand on forwardera le token
  const hasToken = authHeader && authHeader.startsWith("Bearer ") && authHeader.length > 20;

  const url = new URL(request.url);
  const isProtectedRoute =
    url.pathname === "/api/create-article" ||
    url.pathname === "/api/delete-article";

  if (isProtectedRoute && !hasToken) {
    return new Response(JSON.stringify({ error: "Authentification requise" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  return context.next();
};

export const config: Config = {
  path: "/api/*",
  excludedPath: ["/api/articles"], // lecture publique sans auth
};
