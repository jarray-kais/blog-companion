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
      // Pour la lecture, on utilise l'API REST standard de Supabase (plus simple/rapide)
      // Pas besoin de Netlify Functions pour ça
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("date_creation", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
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
        .single();

      if (error) throw error;
      return data as Article;
    },
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateArticleData) => {
      // 1. Authentification Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Vous devez être connecté pour publier.");
      }

      // 2. Appel direct à la Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-article', {
        body: articleData,
      });

      if (error) {
        // Le message d'erreur est souvent dans error.context.statusText ou error.message
        // Supabase JS wrapper errors can be tricky, we try to extract details
        let details = error.message;
        
        // Si la fonction a renvoyé un JSON d'erreur structuré
        if (error instanceof Error && 'context' in error) {
            // @ts-ignore
            const context = error.context as Response;
            if (context) {
              try {
                const json = await context.json();
                details = json.error || json.message || details;
              } catch (e) { /* ignore json parse error */ }
            }
        }
        throw new Error(details || "Impossible de créer l'article");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article publié",
        description: "Votre article est en ligne ! 🚀",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté pour supprimer.");

      const { data, error } = await supabase.functions.invoke('delete-article', {
        body: { id },
      });

      if (error) {
        let details = error.message;
        // Tenter de parser le message JSON renvoyé par la fonction
         // @ts-ignore
         if (error && error.context) {
             try {
               // @ts-ignore
               const json = await error.context.json();
               details = json.error || json.message || details;
             } catch(e) {}
         }
        throw new Error(details || "Erreur lors de la suppression");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article supprimé",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
