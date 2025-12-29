import { Button } from "@/components/ui/button";
import { PenLine, BookOpen, LogIn, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  onCreateClick: () => void;
  user?: SupabaseUser | null;
  onSignOut?: () => void;
  loading?: boolean;
}

export const Header = ({ onCreateClick, user, onSignOut, loading }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              Mon Blog
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              Gestionnaire d'articles
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-body">{user.email}</span>
                  </div>
                  <Button onClick={onCreateClick} variant="accent" size="sm">
                    <PenLine className="w-4 h-4 mr-2" />
                    Nouvel article
                  </Button>
                  <Button onClick={onSignOut} variant="ghost" size="sm">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="accent" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Connexion
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
