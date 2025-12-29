import { Button } from "@/components/ui/button";
import { BookOpen, PenLine } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState = ({ onCreateClick }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
        Aucun article
      </h2>
      
      <p className="text-muted-foreground font-body max-w-md mb-8">
        Commencez par créer votre premier article. Partagez vos idées, histoires et réflexions avec le monde.
      </p>
      
      <Button onClick={onCreateClick} variant="accent" size="lg">
        <PenLine className="w-5 h-5 mr-2" />
        Créer mon premier article
      </Button>
    </div>
  );
};
