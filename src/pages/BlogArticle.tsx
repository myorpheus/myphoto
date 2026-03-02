import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User } from "lucide-react";
import type { NewsArticle } from "@/hooks/useNewsArticles";

const BlogArticle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["blogArticle", id],
    queryFn: async (): Promise<NewsArticle> => {
      const { data, error } = await supabase
        .from("news_articles" as any)
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as unknown as NewsArticle;
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-12 px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Article Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist or has been unpublished.</p>
          <Button onClick={() => navigate("/")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 hover:bg-primary/10">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>

        {article.image_url && (
          <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-0">{article.category}</Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />{formatDate(article.published_at)}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />{article.author}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">{article.title}</h1>
          {article.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>
          )}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {article.content.split("\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogArticle;
