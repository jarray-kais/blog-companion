import { useArticle } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleDetailProps {
  articleId: string;
  onClose: () => void;
}

export const ArticleDetail = ({ articleId, onClose }: ArticleDetailProps) => {
  const { data: article, isLoading } = useArticle(articleId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-card shadow-hover border-0">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card shadow-hover border-0 text-center p-8">
          <p className="text-muted-foreground mb-4">Article introuvable</p>
          <Button onClick={onClose} variant="outline">
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  const formattedDate = format(new Date(article.date_creation), "d MMMM yyyy 'à' HH:mm", { locale: fr });

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <Card className="w-full max-w-3xl bg-card shadow-hover border-0 my-8 animate-scale-in">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                {article.titre}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{article.auteur}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="w-16 h-1 bg-accent rounded-full mb-6" />
          
          <article className="prose prose-lg max-w-none">
            <p className="font-body text-foreground/90 leading-relaxed whitespace-pre-wrap text-lg">
              {article.contenu}
            </p>
          </article>
        </CardContent>
      </Card>
    </div>
  );
};
