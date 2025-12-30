import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Article {
  id: string;
  titre: string;
  contenu: string;
  auteur: string;
  date_creation: string;
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log(session);

      if (sessionError || !session) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await fetch(
        "https://grtnlwrhmgasaeegnkti.supabase.co/functions/v1/create-article",
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        }
      );
      console.log(response);
      if (!response.ok) {
        const err = await response.json();
        console.error('Edge function error:', err);
        throw new Error(err.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      return result.article as Article;
    },
    onSuccess: () => {
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
