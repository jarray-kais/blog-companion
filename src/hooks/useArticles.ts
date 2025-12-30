import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Représente la structure d'un article de blog.
 */
export interface Article {
  id: string;
  titre: string;
  contenu: string;
  auteur: string;
  date_creation: string;
}

/**
 * Données requises pour la création d'un nouvel article.
 */
export interface CreateArticleData {
  titre: string;
  contenu: string;
  auteur: string;
}

/**
 * Hook pour récupérer la liste de tous les articles.
 * Les articles sont triés par date de création décroissante.
 */
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

/**
 * Hook pour récupérer un article spécifique par son ID.
 * @param id L'identifiant unique de l'article.
 */
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

/**
 * Hook pour créer un nouvel article.
 * Utilise une Supabase Edge Function pour gérer la création de manière sécurisée.
 * Nécessite que l'utilisateur soit authentifié.
 */
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateArticleData) => {
      // Vérification de la session active avant l'appel
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Utilisateur non authentifié');
      }

      // Appel de l'Edge Function dédiée à la création d'articles
      const response = await fetch(
        "https://ddoocgpbnozlgazjojtf.supabase.co/functions/v1/create-article",
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        console.error('Edge function error:', err);
        throw new Error(err.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      return result.article as Article;
    },
    onSuccess: () => {
      // Invalidation du cache pour rafraîchir la liste des articles
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({
        title: 'Article créé',
        description: 'Votre article a été publié avec succès.',
      });
    },

    onError: (error) => {
      console.error('Error creating article:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'article. Veuillez réessayer.",
        variant: 'destructive',
      });
    },
  });
};


/**
 * Hook pour supprimer un article existant.
 * @param id L'ID de l'article à supprimer.
 */
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidation du cache pour mettre à jour l'affichage
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
        variant: "destructive",
      });
      console.error("Error deleting article:", error);
    },
  });
};
