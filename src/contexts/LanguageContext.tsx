import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'headshots-ai-language';

function detectDefaultLanguage(): Language {
  // 1. Check localStorage cache
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached && (cached === 'en' || cached === 'ru' || cached === 'zh')) {
    return cached as Language;
  }
  // 2. Check browser language
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'ru') return 'ru';
  if (browserLang === 'zh') return 'zh';
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectDefaultLanguage);

  // Load from DB on mount (for logged-in users)
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await (supabase as any)
          .from('user_preferences')
          .select('language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.language && ['en', 'ru', 'zh'].includes(data.language)) {
          setLanguageState(data.language as Language);
          localStorage.setItem(STORAGE_KEY, data.language);
        }
      } catch (e) {
        // Silently fail - use cached/default
      }
    };
    loadFromDb();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Save to DB for logged-in users
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from('user_preferences')
        .upsert(
          { user_id: user.id, language: lang, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    } catch (e) {
      // Silently fail - localStorage still works
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};
