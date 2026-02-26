import { en } from './en';
import { ru } from './ru';
import { zh } from './zh';

export type Language = 'en' | 'ru' | 'zh';

export const translations: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  ru,
  zh,
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  zh: '中文',
};

export const languageFlags: Record<Language, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  zh: '🇨🇳',
};
