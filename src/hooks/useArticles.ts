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
      // Récupérer le JWT côté front
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Utilisateur non connecté");

      const accessToken = session.access_token;

      // Appel de l'Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('create-article', {
        body: articleData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (functionError) throw new Error(functionError.message || 'Erreur création article');

      return data.article as Article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Article créé', description: 'Votre article a été publié avec succès.' });
    },
    onError: (error) => {
      console.error('Erreur création article:', error);
      toast({ title: 'Erreur', description: "Impossible de créer l'article.", variant: 'destructive' });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Récupérer le JWT côté front
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Utilisateur non connecté");

      const accessToken = session.access_token;

      // Appel de l'Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('delete-article', {
        body: { id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur suppression article');
      }

      // Vérifier si la réponse indique une erreur
      if (!data || !data.success) {
        const error = new Error(data?.error || 'Erreur suppression article') as Error & { statusCode?: number };
        error.statusCode = data?.statusCode || 500;
        throw error;
      }

      return data;
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

      // Gérer les erreurs selon le code HTTP dans le body de la réponse
      const statusCode = error.statusCode;
      
      if (statusCode === 401) {
        title = "Non autorisé";
        description = "Vous devez être connecté pour supprimer un article.";
      } else if (statusCode === 403) {
        title = "Accès refusé";
        description = "Vous n'avez pas les permissions pour supprimer cet article. Vous ne pouvez supprimer que vos propres articles.";
      } else if (statusCode === 404) {
        title = "Article introuvable";
        description = "L'article que vous essayez de supprimer n'existe pas.";
      } else if (statusCode === 500) {
        title = "Erreur serveur";
        description = "Une erreur est survenue sur le serveur. Veuillez réessayer.";
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
