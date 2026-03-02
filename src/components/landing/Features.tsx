import { Building2, Landmark, Stethoscope, Scale, Zap, Shield, Download, Palette } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export function Features() {
  const { t } = useTranslation();

  const templates = [
    { icon: Building2, name: t('features.office'), color: 'text-primary', description: t('features.officeDesc') },
    { icon: Landmark, name: t('features.banking'), color: 'text-yellow-400', description: t('features.bankingDesc') },
    { icon: Stethoscope, name: t('features.doctor'), color: 'text-green-400', description: t('features.doctorDesc') },
    { icon: Scale, name: t('features.lawyer'), color: 'text-purple-400', description: t('features.lawyerDesc') },
  ];

  const features = [
    { icon: Zap, title: t('features.fast'), description: t('features.fastDesc') },
    { icon: Shield, title: t('features.privacy'), description: t('features.privacyDesc') },
    { icon: Download, title: t('features.hd'), description: t('features.hdDesc') },
    { icon: Palette, title: t('features.styles'), description: t('features.stylesDesc') },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{t('features.templatesTitle')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {templates.map((template) => (
            <div
              key={template.name}
              className="group p-6 rounded-2xl gradient-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <div className={`w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 ${template.color}`}>
                <template.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-muted-foreground text-sm">{template.description}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl glass">
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
