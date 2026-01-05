import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const ADMIN_TOKEN = Netlify.env.get("ADMIN_TOKEN");

  const authHeader = request.headers.get("authorization");
  const isAuthorized = authHeader === `Bearer ${ADMIN_TOKEN}`;

  const url = new URL(request.url);
  const isProtectedRoute =
    url.pathname === "/api/create-article" ||
    url.pathname === "/api/delete-article";

  if (isProtectedRoute && !isAuthorized) {
    return new Response("Accès refusé : token admin invalide", {
      status: 401,
    });
  }

  return context.next();
};

export const config: Config = {
  path: "/api/*",
  excludedPath: ["/api/articles"], // lecture publique sans auth
};
