import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/contexts/LanguageContext';

const faqItems = [
  {
    question: { en: 'How does the headshot generation work?', ru: 'Как работает генерация портретов?', zh: '头像生成是如何工作的？' },
    answer: {
      en: 'Simply upload 3-5 clear photos of yourself from different angles. Our advanced technology analyzes your features and creates professional studio-quality headshots in your chosen template style within minutes.',
      ru: 'Просто загрузите 3-5 четких фотографий с разных ракурсов. Наша технология анализирует ваши черты и создает профессиональные студийные портреты в выбранном стиле за несколько минут.',
      zh: '只需上传3-5张不同角度的清晰照片。我们的先进技术会分析您的特征，并在几分钟内以您选择的模板风格创建专业的工作室品质头像。',
    },
  },
  {
    question: { en: 'What photo quality do I need to upload?', ru: 'Какого качества фото нужно загружать?', zh: '需要上传什么质量的照片？' },
    answer: {
      en: 'For best results, upload clear, well-lit photos where your face is clearly visible. Avoid heavy filters, sunglasses, or photos where your face is partially covered.',
      ru: 'Для лучших результатов загружайте четкие, хорошо освещенные фото, где ваше лицо хорошо видно. Избегайте сильных фильтров, солнечных очков или фото с частично закрытым лицом.',
      zh: '为获得最佳效果，请上传清晰、光线充足、面部清晰可见的照片。避免使用滤镜、太阳镜或面部被部分遮挡的照片。',
    },
  },
  {
    question: { en: 'How long does it take to generate a headshot?', ru: 'Сколько времени занимает создание портрета?', zh: '生成头像需要多长时间？' },
    answer: {
      en: 'Most headshots are generated within 1-2 minutes. Pro and Enterprise users get priority processing for even faster results.',
      ru: 'Большинство портретов создаются за 1-2 минуты. Пользователи Pro и Бизнес получают приоритетную обработку.',
      zh: '大多数头像在1-2分钟内生成。专业版和企业版用户享有优先处理。',
    },
  },
  {
    question: { en: 'Can I use the headshots commercially?', ru: 'Могу ли я использовать портреты в коммерческих целях?', zh: '我可以将头像用于商业用途吗？' },
    answer: {
      en: 'Yes! All generated headshots are yours to use however you like - LinkedIn, company websites, business cards, marketing materials, and more.',
      ru: 'Да! Все созданные портреты принадлежат вам и могут использоваться как угодно - LinkedIn, сайты компаний, визитки, маркетинговые материалы.',
      zh: '是的！所有生成的头像都归您所有，可以随意使用——LinkedIn、公司网站、名片、营销材料等。',
    },
  },
  {
    question: { en: 'What payment methods do you accept?', ru: 'Какие способы оплаты вы принимаете?', zh: '你们接受哪些付款方式？' },
    answer: {
      en: 'We accept all major credit cards and debit cards. Enterprise customers can also pay via invoice.',
      ru: 'Мы принимаем все основные кредитные и дебетовые карты. Корпоративные клиенты также могут оплатить по счету.',
      zh: '我们接受所有主要的信用卡和借记卡。企业客户也可以通过发票付款。',
    },
  },
];

export function FAQ() {
  const { language } = useTranslation();

  const title: Record<string, string> = { en: 'Frequently Asked Questions', ru: 'Часто задаваемые вопросы', zh: '常见问题' };
  const subtitle: Record<string, string> = { en: 'Everything you need to know about our service', ru: 'Все, что вам нужно знать о нашем сервисе', zh: '关于我们服务您需要了解的一切' };

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title[language] || title.en}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {subtitle[language] || subtitle.en}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {item.question[language as keyof typeof item.question] || item.question.en}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {item.answer[language as keyof typeof item.answer] || item.answer.en}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
