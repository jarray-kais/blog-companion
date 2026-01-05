// netlify/edge-functions/hello.ts
import type { Config } from "@netlify/edge-functions";

export default async () => {
  return new Response("Hello world depuis Netlify Edge Functions ! 🎉", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

// Cette config définit sur quel chemin la fonction s'exécute
export const config: Config = {
  path: "/api/hello"  // Accès via ton-site.netlify.app/api/hello
};