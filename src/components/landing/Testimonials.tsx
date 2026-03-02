import { Star, Quote } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

const testimonials = [
  {
    name: 'Alexandra P.',
    content: {
      en: 'I needed a professional headshot for LinkedIn urgently. The results were amazing in minutes. My new photo got me 3x more profile views!',
      ru: 'Мне срочно нужен был профессиональный портрет для LinkedIn. Результаты были потрясающими за минуты. Мое новое фото принесло в 3 раза больше просмотров!',
      zh: '我急需LinkedIn的专业头像。几分钟内就获得了惊人的结果。我的新照片让个人资料浏览量增加了3倍！',
    },
    rating: 5,
    template: 'Corporate',
  },
  {
    name: 'Michael K.',
    content: {
      en: 'The medical template perfectly captured the professional yet approachable look I wanted. My patients commented on how trustworthy my new photo looks.',
      ru: 'Медицинский шаблон идеально передал профессиональный и доступный образ. Пациенты отмечают, как надежно выглядит мое новое фото.',
      zh: '医疗模板完美捕捉了我想要的专业而亲切的形象。患者们都说我的新照片看起来很值得信赖。',
    },
    rating: 5,
    template: 'Medical',
  },
  {
    name: 'David S.',
    content: {
      en: 'As a lawyer, image matters. The legal template gave me exactly the distinguished, authoritative look that commands respect. Highly recommended!',
      ru: 'Как юристу, мне важен имидж. Юридический шаблон дал именно тот солидный авторитетный вид, который вызывает уважение. Очень рекомендую!',
      zh: '作为律师，形象很重要。法律模板给了我正是那种令人尊敬的权威形象。强烈推荐！',
    },
    rating: 5,
    template: 'Legal',
  },
  {
    name: 'Catherine V.',
    content: {
      en: 'The banking template is perfect for finance professionals. It exudes trust and competence. Worth every penny for the quality you get.',
      ru: 'Банковский шаблон идеален для финансистов. Он излучает доверие и компетентность. Стоит каждого рубля за такое качество.',
      zh: '银行模板非常适合金融专业人士。它散发着信任和专业能力。物有所值。',
    },
    rating: 5,
    template: 'Banking',
  },
  {
    name: 'Andrew N.',
    content: {
      en: 'I was skeptical at first, but the results blew me away. Professional studio quality without the hassle of booking a photographer.',
      ru: 'Сначала я был скептичен, но результаты меня поразили. Профессиональное студийное качество без хлопот с поиском фотографа.',
      zh: '起初我持怀疑态度，但结果让我惊叹。专业的工作室品质，无需预约摄影师。',
    },
    rating: 5,
    template: 'Corporate',
  },
  {
    name: 'Olga F.',
    content: {
      en: 'We used this for our entire team. Consistent, professional results that made our company page look incredible. Saved us thousands!',
      ru: 'Мы использовали это для всей команды. Стабильные профессиональные результаты. Страница компании выглядит невероятно. Сэкономили тысячи!',
      zh: '我们为整个团队使用了这个服务。一致的专业结果使我们的公司页面看起来令人难以置信。节省了数千元！',
    },
    rating: 5,
    template: 'Corporate',
  },
];

export function Testimonials() {
  const { t, language } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            {t('testimonials.title').split(' ')[0]}{' '}
            <span className="gradient-text">{t('testimonials.title').split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] animate-fade-up relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.content[language as keyof typeof testimonial.content] || testimonial.content.en}"
              </p>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {testimonial.template}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">{t('testimonials.trusted')}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'].map((company) => (
              <span key={company} className="font-display font-bold text-lg text-muted-foreground">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
