import { useState, useEffect } from 'react';
import { Building2, Landmark, Stethoscope, Scale, Briefcase, GraduationCap, Camera, Palette, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  name: string;
  name_ru: string;
  name_zh: string;
  icon: string;
  color_from: string;
  color_to: string;
  generated_image_url: string | null;
  is_active: boolean;
  display_order: number;
}

const iconMap: Record<string, LucideIcon> = {
  Building2, Landmark, Stethoscope, Scale, Briefcase, GraduationCap, Camera, Palette,
};

const colorMap: Record<string, string> = {
  'blue-500': '#3b82f6', 'blue-700': '#1d4ed8',
  'emerald-500': '#10b981', 'emerald-700': '#047857',
  'red-500': '#ef4444', 'red-700': '#b91c1c',
  'amber-500': '#f59e0b', 'amber-700': '#b45309',
  'violet-500': '#8b5cf6', 'violet-700': '#6d28d9',
  'cyan-500': '#06b6d4', 'cyan-700': '#0e7490',
  'pink-500': '#ec4899', 'pink-700': '#be185d',
  'orange-500': '#f97316', 'orange-700': '#c2410c',
};

export function HeadshotShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const { language } = useTranslation();

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('templates' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (data) setTemplates(data as unknown as Template[]);
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templates.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % templates.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [templates.length]);

  const getTemplateName = (template: Template) => {
    if (language === 'ru') return template.name_ru;
    if (language === 'zh') return template.name_zh;
    return template.name;
  };

  if (templates.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Professional Templates</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {language === 'ru' ? 'Выберите идеальный шаблон для вашей профессии' :
             language === 'zh' ? '选择适合您职业的完美模板' :
             'Choose the perfect template for your profession'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {templates.map((template, index) => {
              const isActive = index === activeIndex;
              const Icon = iconMap[template.icon] || Building2;
              const templateName = getTemplateName(template);
              const fromColor = colorMap[template.color_from] || '#3b82f6';
              const toColor = colorMap[template.color_to] || '#1d4ed8';

              return (
                <div
                  key={template.id}
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    isActive ? 'scale-105 z-10' : 'scale-100 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className={`aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                    isActive
                      ? 'border-primary shadow-lg shadow-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}>
                    {template.generated_image_url ? (
                      <img src={template.generated_image_url} alt={templateName} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center p-4"
                        style={{ background: `linear-gradient(135deg, ${fromColor}20, ${toColor}20)` }}
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isActive ? 'animate-pulse' : ''}`}
                          style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-display font-semibold text-center text-sm">{templateName}</span>
                      </div>
                    )}
                  </div>

                  {template.generated_image_url && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="font-display font-semibold text-sm bg-background/80 backdrop-blur px-3 py-1 rounded-full">
                        {templateName}
                      </span>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {templates.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
