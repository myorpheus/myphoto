import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import type { NewsArticle } from "@/hooks/useNewsArticles";

type ArticleForm = Omit<NewsArticle, "id" | "created_at" | "updated_at">;

const emptyForm: ArticleForm = {
  title: "", content: "", excerpt: "", image_url: "", category: "General",
  author: "Admin", published_at: new Date().toISOString(), is_published: false,
};

const AdminNews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingArticle, setEditingArticle] = useState<(ArticleForm & { id?: string }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["adminNewsArticles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles" as any).select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data as unknown as NewsArticle[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (article: ArticleForm & { id?: string }) => {
      const { id, ...rest } = article;
      if (id) {
        const { error } = await supabase.from("news_articles" as any).update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news_articles" as any).insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNewsArticles"] });
      queryClient.invalidateQueries({ queryKey: ["newsArticles"] });
      setDialogOpen(false);
      setEditingArticle(null);
      toast({ title: "Saved", description: "Article saved successfully." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_articles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNewsArticles"] });
      queryClient.invalidateQueries({ queryKey: ["newsArticles"] });
      toast({ title: "Deleted", description: "Article deleted." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => { setEditingArticle({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (a: NewsArticle) => { setEditingArticle({ ...a }); setDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <h1 className="text-2xl font-bold">News Articles</h1>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Article</Button>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No articles yet. Create your first one!</div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {article.image_url && (
                      <img src={article.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">{article.category} · {article.author} · {article.is_published ? "Published" : "Draft"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(article)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete this article?")) deleteMutation.mutate(article.id); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle?.id ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <ArticleFormFields
              article={editingArticle}
              onChange={setEditingArticle}
              onSave={() => saveMutation.mutate(editingArticle)}
              isSaving={saveMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ArticleFormFields({ article, onChange, onSave, isSaving }: {
  article: ArticleForm & { id?: string };
  onChange: (a: ArticleForm & { id?: string }) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const update = (field: string, value: any) => onChange({ ...article, [field]: value });

  return (
    <div className="space-y-4">
      <div><Label>Title</Label><Input value={article.title} onChange={(e) => update("title", e.target.value)} /></div>
      <div><Label>Excerpt</Label><Textarea value={article.excerpt} onChange={(e) => update("excerpt", e.target.value)} rows={2} /></div>
      <div><Label>Content</Label><Textarea value={article.content} onChange={(e) => update("content", e.target.value)} rows={8} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Category</Label><Input value={article.category} onChange={(e) => update("category", e.target.value)} /></div>
        <div><Label>Author</Label><Input value={article.author} onChange={(e) => update("author", e.target.value)} /></div>
      </div>
      <div><Label>Image URL</Label><Input value={article.image_url} onChange={(e) => update("image_url", e.target.value)} /></div>
      <div className="flex items-center gap-2">
        <Switch checked={article.is_published} onCheckedChange={(v) => update("is_published", v)} />
        <Label>Published</Label>
      </div>
      <Button onClick={onSave} disabled={isSaving || !article.title} className="w-full">
        {isSaving ? "Saving..." : "Save Article"}
      </Button>
    </div>
  );
}

export default AdminNews;
