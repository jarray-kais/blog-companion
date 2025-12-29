import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useArticles, useDeleteArticle } from "@/hooks/useArticles";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { CreateArticleForm } from "@/components/CreateArticleForm";
import { ArticleDetail } from "@/components/ArticleDetail";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();

  const { data: articles, isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();

  const handleDelete = (id: string) => {
    setArticleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (articleToDelete) {
      await deleteArticle.mutateAsync(articleToDelete);
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      navigate("/auth");
    } else {
      setShowCreateForm(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const authorName = profile?.full_name || user?.email?.split("@")[0] || "Anonyme";

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onCreateClick={handleCreateClick}
        user={user}
        onSignOut={handleSignOut}
        loading={authLoading}
      />

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6 shadow-card">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Articles récents
              </h2>
              <p className="text-muted-foreground font-body mt-1">
                {articles.length} article{articles.length > 1 ? "s" : ""} publié{articles.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  index={index}
                  onView={setSelectedArticleId}
                  onDelete={user ? handleDelete : undefined}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState onCreateClick={handleCreateClick} />
        )}
      </main>

      {showCreateForm && user && (
        <CreateArticleForm 
          onClose={() => setShowCreateForm(false)} 
          authorName={authorName}
        />
      )}

      {selectedArticleId && (
        <ArticleDetail
          articleId={selectedArticleId}
          onClose={() => setSelectedArticleId(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Supprimer cet article ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Cette action est irréversible. L'article sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
