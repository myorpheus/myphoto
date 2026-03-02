import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';

export function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plans = [
    {
      name: t('pricing.starter'),
      price: t('pricing.free'),
      period: '',
      description: t('pricing.starterDesc'),
      features: [
        t('pricing.5headshots'),
        t('pricing.allTemplates'),
        t('pricing.1024'),
        t('pricing.png'),
        t('pricing.basicBg'),
      ],
      cta: t('common.getStarted'),
      featured: false,
    },
    {
      name: t('pricing.pro'),
      price: '$14.99',
      period: t('pricing.month'),
      description: t('pricing.proDesc'),
      features: [
        t('pricing.50headshots'),
        t('pricing.allTemplates'),
        t('pricing.2048'),
        t('pricing.allFormats'),
        t('pricing.premiumBg'),
        t('pricing.priority'),
        t('pricing.history'),
      ],
      cta: t('pricing.startTrial'),
      featured: true,
    },
    {
      name: t('pricing.enterprise'),
      price: '$79.99',
      period: t('pricing.month'),
      description: t('pricing.enterpriseDesc'),
      features: [
        t('pricing.unlimited'),
        t('pricing.allPro'),
        t('pricing.team'),
        t('pricing.api'),
        t('pricing.custom'),
        t('pricing.support'),
        t('pricing.whitelabel'),
      ],
      cta: t('pricing.contactSales'),
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{t('pricing.title')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                plan.featured
                  ? 'gradient-card border-2 border-primary glow'
                  : 'glass border border-border'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                  {t('pricing.mostPopular')}
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.featured ? 'gradient-primary text-primary-foreground' : ''}`}
                variant={plan.featured ? 'default' : 'outline'}
                onClick={() => navigate('/login')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
