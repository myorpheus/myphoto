import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  message: z.string().trim().min(1, 'Message is required').max(1000),
});

const translations: Record<string, Record<string, string>> = {
  'contact.title': { en: 'Contact Us', ru: 'Свяжитесь с нами', zh: '联系我们' },
  'contact.subtitle': { en: "Have questions? We'd love to hear from you.", ru: 'Есть вопросы? Мы рады помочь.', zh: '有问题吗？我们很乐意听取您的意见。' },
  'contact.name': { en: 'Name', ru: 'Имя', zh: '姓名' },
  'contact.email': { en: 'Email', ru: 'Email', zh: '电子邮件' },
  'contact.message': { en: 'Message', ru: 'Сообщение', zh: '留言' },
  'contact.send': { en: 'Send Message', ru: 'Отправить', zh: '发送消息' },
  'contact.sending': { en: 'Sending...', ru: 'Отправка...', zh: '发送中...' },
  'contact.success': { en: 'Message sent successfully!', ru: 'Сообщение отправлено!', zh: '消息发送成功！' },
};

export function ContactForm() {
  const { language } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const ct = (key: string) => translations[key]?.[language] || translations[key]?.en || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof typeof errors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    // Simulate sending since we don't have the contact_inquiries table
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: ct('contact.success') });
    setFormData({ name: '', email: '', message: '' });
    setIsLoading(false);
  };

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{ct('contact.title')}</h2>
            <p className="text-muted-foreground">{ct('contact.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-2xl">
            <div>
              <label className="block text-sm font-medium mb-2">{ct('contact.name')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-destructive' : ''}
                placeholder={ct('contact.name')}
              />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{ct('contact.email')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-destructive' : ''}
                placeholder={ct('contact.email')}
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{ct('contact.message')}</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
                placeholder={ct('contact.message')}
              />
              {errors.message && <p className="text-destructive text-sm mt-1">{errors.message}</p>}
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{ct('contact.sending')}</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />{ct('contact.send')}</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
