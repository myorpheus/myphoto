import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  category: string;
  author: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const fetchNewsArticles = async (limit?: number): Promise<NewsArticle[]> => {
  let query = supabase
    .from('news_articles' as any)
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as NewsArticle[]) || [];
};

export const useNewsArticles = (limit?: number) => {
  return useQuery({
    queryKey: ['newsArticles', limit],
    queryFn: () => fetchNewsArticles(limit),
  });
};
