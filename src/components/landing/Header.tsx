import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">{t('app.name')}</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('footer.pricing')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <LanguageSelector />
          <ThemeToggle />
          <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
            {t('common.signIn')}
          </Button>
          <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/login')}>
            {t('common.getStarted')}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-border p-4 space-y-3">
          <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
            {t('footer.pricing')}
          </a>
        </div>
      )}
    </header>
  );
}
