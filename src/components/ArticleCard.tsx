import { Article } from "@/hooks/useArticles";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticleCardProps {
  article: Article;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  index: number;
}

export const ArticleCard = ({ article, onView, onDelete, index }: ArticleCardProps) => {
  const formattedDate = format(new Date(article.date_creation), "d MMMM yyyy", { locale: fr });
  
  return (
    <Card 
      className="group bg-card shadow-card hover:shadow-hover transition-all duration-300 border-0 overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader className="pb-3">
        <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-accent transition-colors duration-200 line-clamp-2">
          {article.titre}
        </h3>
      </CardHeader>
      
      <CardContent className="pb-4">
        <p className="text-muted-foreground font-body text-sm leading-relaxed line-clamp-3">
          {article.contenu}
        </p>
      </CardContent>
      
      <CardFooter className="pt-0 flex flex-col gap-4">
        <div className="flex items-center gap-4 w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span className="font-medium">{article.auteur}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => onView(article.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Lire
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(article.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
