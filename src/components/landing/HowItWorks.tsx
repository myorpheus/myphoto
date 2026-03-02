import { Upload, Palette, Download, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.desc'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      number: '02',
      icon: Palette,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.desc'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      number: '03',
      icon: Download,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.desc'),
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            {t('howItWorks.title').split(' ')[0]}{' '}
            <span className="gradient-text">{t('howItWorks.title').split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary via-accent to-green-400 opacity-30" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative group animate-fade-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className={`w-20 h-20 rounded-2xl ${step.bgColor} flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                        <Icon className={`w-10 h-10 ${step.color}`} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {step.number.slice(-1)}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center my-6">
                      <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
