import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { motion } from 'framer-motion';

export function Hero() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const minLabel = language === 'ru' ? 'мин' : language === 'zh' ? '分钟' : 'min';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container relative z-10 px-4 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('hero.badge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight"
          >
            <span className="text-foreground">{t('hero.title1')}</span>
            <br />
            <span className="gradient-text glow-text">{t('hero.title2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="gradient-primary text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-primary/40 transition-all duration-300 hover:scale-105" onClick={() => navigate('/login')}>
              {t('hero.cta')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-primary/30 hover:bg-primary/10" onClick={() => navigate('/login')}>
              {t('hero.tryDemo')}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">
                <AnimatedCounter end={50} suffix="K+" duration={2} />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('hero.stat1.label')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">
                <AnimatedCounter end={4.9} decimals={1} duration={1.5} />
                <span>/5</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('hero.stat2.label')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">
                <span>&lt;</span>
                <AnimatedCounter end={2} duration={1} />
                <span>{minLabel}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('hero.stat3.label')}</div>
            </div>
          </motion.div>
        </div>

        <div className="absolute -right-20 top-1/3 w-48 h-48 rounded-2xl gradient-card border border-primary/20 animate-float opacity-60 hidden lg:block" />
        <div className="absolute -left-16 top-1/2 w-32 h-32 rounded-xl gradient-card border border-accent/20 animate-float opacity-40 hidden lg:block" style={{ animationDelay: '1s' }} />
      </div>
    </section>
  );
}
