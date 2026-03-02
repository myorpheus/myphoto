import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Shield, Clock } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export function CTASection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">{t('cta.badge')}</span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {t('cta.title1')}
            <br />
            <span className="gradient-text">{t('cta.title2')}</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
            {t('cta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Button 
              size="lg" 
              className="gradient-primary text-primary-foreground px-10 py-7 text-lg font-semibold shadow-lg hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/login')}
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-7 text-lg border-primary/30 hover:bg-primary/10"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('footer.pricing')}
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm">{t('cta.instant')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">{t('cta.protected')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm">{t('cta.available')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
