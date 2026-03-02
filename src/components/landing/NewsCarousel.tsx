import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNewsArticles, NewsArticle } from "@/hooks/useNewsArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NewsCarousel() {
  const { data: articles, isLoading, error } = useNewsArticles(6);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const toggleAutoplay = useCallback(() => {
    const plugin = autoplayPlugin.current;
    if (!plugin) return;
    if (isPlaying) { plugin.stop(); setIsPlaying(false); }
    else { plugin.play(); setIsPlaying(true); }
  }, [isPlaying]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  if (error) return null;

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <BookOpen className="h-7 w-7 text-primary" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Latest News & Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our latest articles, tips, and photography insights
          </p>
        </div>

        {isLoading ? (
          <NewsCarouselSkeleton />
        ) : articles && articles.length > 0 ? (
          <>
            <div className="relative">
              <Carousel setApi={setApi} opts={{ align: "center", loop: true }} plugins={[autoplayPlugin.current]} className="w-full">
                <CarouselContent className="-ml-4">
                  {articles.map((article, index) => (
                    <CarouselItem key={article.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <NewsCard article={article} isActive={index === current} formatDate={formatDate} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              <div className="flex items-center justify-center gap-4 mt-8">
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-primary/20 hover:border-primary hover:bg-primary/10" onClick={scrollPrev}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex gap-2">
                  {Array.from({ length: count }).map((_, index) => (
                    <button key={index} onClick={() => api?.scrollTo(index)}
                      className={cn("h-2 rounded-full transition-all duration-300", current === index ? "w-8 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50")} />
                  ))}
                </div>
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-primary/20 hover:border-primary hover:bg-primary/10" onClick={toggleAutoplay} title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-primary/20 hover:border-primary hover:bg-primary/10" onClick={scrollNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button asChild variant="ghost" size="lg" className="group text-lg hover:bg-primary/10">
                <Link to="/blog"><span className="flex items-center">View All Articles <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></span></Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No articles available at the moment.</div>
        )}
      </div>
    </section>
  );
}

interface NewsCardProps { article: NewsArticle; isActive: boolean; formatDate: (date: string) => string; }

function NewsCard({ article, isActive, formatDate }: NewsCardProps) {
  return (
    <div className={cn("group relative h-[480px] rounded-2xl overflow-hidden transition-all duration-500", isActive ? "scale-100 opacity-100" : "scale-95 opacity-70")}>
      <div className="absolute inset-0">
        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-0 backdrop-blur-sm">{article.category}</Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />{formatDate(article.published_at)}
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">{article.title}</h3>
        <p className="text-muted-foreground line-clamp-2 mb-6">{article.excerpt}</p>
        <Button asChild variant="outline" className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group/btn">
          <Link to={`/blog/${article.id}`}><span className="flex items-center justify-center w-full">Read Article <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" /></span></Link>
        </Button>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
      </div>
    </div>
  );
}

function NewsCarouselSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[480px] rounded-2xl overflow-hidden bg-muted/50"><Skeleton className="w-full h-full" /></div>
      ))}
    </div>
  );
}
