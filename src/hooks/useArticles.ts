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

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("date_creation", { ascending: false });
      
      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ["articles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Article | null;
    },
    enabled: !!id,
  });
};
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateArticleData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Vous devez être connecté pour créer un article.");
      }

      // Explicitly constructing the request to ensure headers are perfect
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(articleData),
        }
      );

      if (!response.ok) {
        // Log headers for debugging
        console.error("Failed Request Headers:", {
            "Authorization": `Bearer ${session.access_token.substring(0, 10)}...`,
            "apikey": "HIDDEN" 
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await response.json();
           throw new Error(err.error || "Erreur lors de la création de l'article");
        } else {
           const text = await response.text();
           console.error("Non-JSON error response:", text);
           throw new Error(`Erreur serveur (${response.status}): ${text}`);
        }
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({
        title: 'Article créé',
        description: 'Votre article a été publié avec succès.',
      });
    },
    onError: (error: any) => {
      console.error('Erreur création article:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de créer l'article.",
        variant: 'destructive',
      });
    }
  })
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Récupérer le JWT côté front
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Utilisateur non connecté");

      const accessToken = session.access_token;

      // Appel de l'Edge Function via fetch pour garantir les headers
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        // Tentative de parsing de l'erreur JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await response.json();
           const errorMsg = err.details ? `${err.error}: ${err.details}` : (err.error || "Erreur lors de la suppression de l'article");
           const error = new Error(errorMsg) as Error & { statusCode?: number };
           error.statusCode = response.status;
           throw error;
        } else {
           const text = await response.text();
           const error = new Error(`Erreur serveur (${response.status}): ${text}`) as Error & { statusCode?: number };
           error.statusCode = response.status;
           throw error;
        }
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès.",
      });
    },
    onError: (error: Error & { statusCode?: number }) => {
      let title = "Erreur";
      let description = "Impossible de supprimer l'article.";

      // Gérer les erreurs selon le code HTTP
      const statusCode = error.statusCode;
      
      if (statusCode === 401) {
        title = "Non autorisé";
        description = "Vous devez être connecté pour supprimer un article.";
      } else if (statusCode === 403) {
        title = "Accès refusé";
        description = "Vous n'avez pas les permissions pour supprimer cet article.";
      } else if (statusCode === 404) {
        title = "Article introuvable";
        description = "L'article n'existe pas.";
      } else if (error.message) {
        description = error.message;
      }

      toast({
        title,
        description,
        variant: "destructive",
      });
      console.error("Error deleting article:", error);
    },
  });
};
