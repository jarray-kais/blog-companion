import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateArticle } from "@/hooks/useArticles";
import { PenLine, X } from "lucide-react";

interface CreateArticleFormProps {
  onClose: () => void;
  authorName: string;
}

export const CreateArticleForm = ({ onClose, authorName }: CreateArticleFormProps) => {
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  
  const createArticle = useCreateArticle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titre.trim() || !contenu.trim()) return;
    
    await createArticle.mutateAsync({ titre, contenu, auteur: authorName });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-2xl bg-card shadow-hover border-0 animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <PenLine className="w-6 h-6 text-accent" />
            Nouvel Article
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="titre" className="font-body font-medium">
                Titre
              </Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Un titre accrocheur..."
                className="font-body"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-body font-medium">
                Auteur
              </Label>
              <Input
                value={authorName}
                className="font-body bg-muted"
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contenu" className="font-body font-medium">
                Contenu
              </Label>
              <Textarea
                id="contenu"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                placeholder="Écrivez votre article ici..."
                className="font-body min-h-[200px] resize-none"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="accent"
                className="flex-1"
                disabled={createArticle.isPending}
              >
                {createArticle.isPending ? "Publication..." : "Publier"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
