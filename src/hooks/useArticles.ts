import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Article {
  id: string;
  titre: string;
  contenu: string;
  auteur: string;
  date_creation: string;
  user_id: string;
}

export interface CreateArticleData {
  titre: string;
  contenu: string;
  auteur: string;
}

// 1. Lire tous les articles (via Netlify Edge Function avec Cache)
export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const response = await fetch("/api/articles");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des articles");
      }
      return response.json() as Promise<Article[]>;
    },
  });
};

// 2. Lire un article par ID (on réutilise le cache global de la liste)
export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ["articles", id],
    queryFn: async () => {
      const response = await fetch("/api/articles");
      if (!response.ok) throw new Error("Erreur chargement");
      const articles = await response.json() as Article[];
      return articles.find((a) => a.id === id) || null;
    },
    enabled: !!id,
  });
};

// 3. Créer un article (via Netlify Edge Function + User Token)
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateArticleData) => {
      // Récupérer la session utilisateur réelle
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Vous devez être connecté pour publier.");
      }

      const response = await fetch("/api/create-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // On envoie le vrai token JWT de l'utilisateur
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        // Gestion robuste des erreurs (JSON ou Texte)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await response.json();
           throw new Error(err.error || "Erreur lors de la création");
        } else {
           const text = await response.text();
           throw new Error(text || "Erreur serveur");
        }
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article publié",
        description: "Votre article est en ligne ! 🚀",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Alerte",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

// 4. Supprimer un article (via Netlify Edge Function + User Token)
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté pour supprimer.");

      const response = await fetch("/api/delete-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await response.json();
           // On lance une erreur avec le message précis du backend (ex: "Tu n'as pas effacé...")
           throw new Error(err.error || "Erreur suppression");
        } else {
           const text = await response.text();
           throw new Error(text || "Erreur suppression");
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article supprimé",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Alerte",
        description: error.message, // Affichera le message spécifique du backend
        variant: "destructive",
      });
    }
  });
};
