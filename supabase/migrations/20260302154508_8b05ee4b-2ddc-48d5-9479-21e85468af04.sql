INSERT INTO public.news_articles (title, excerpt, content, image_url, category, author, published_at, is_published) VALUES
('AI Headshots Revolution: How Technology is Changing Professional Photography', 'Discover how AI-powered headshot generation is transforming the way professionals present themselves online.', 'Full article content here...', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'Technology', 'Admin', now() - interval '1 day', true),
('5 Tips for the Perfect LinkedIn Profile Photo', 'Your LinkedIn photo is your first impression. Here are expert tips to make it count.', 'Full article content here...', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800', 'Tips', 'Admin', now() - interval '3 days', true),
('The Future of Corporate Photography', 'How AI and machine learning are reshaping corporate photography standards worldwide.', 'Full article content here...', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800', 'Industry', 'Admin', now() - interval '5 days', true),
('Behind the Scenes: How Our AI Model Works', 'A deep dive into the technology that powers our AI headshot generator.', 'Full article content here...', 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800', 'Technology', 'Admin', now() - interval '7 days', true),
('Professional Headshots for Every Industry', 'From tech startups to law firms, discover how AI headshots adapt to every professional context.', 'Full article content here...', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800', 'Guide', 'Admin', now() - interval '10 days', true),
('Studio Quality Photos Without the Studio', 'Save time and money with AI-generated headshots that rival professional studio photography.', 'Full article content here...', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800', 'Tips', 'Admin', now() - interval '14 days', true);

INSERT INTO public.templates (name, name_ru, name_zh, icon, color_from, color_to, display_order) VALUES
('Corporate', 'Корпоративный', '企业', 'Building2', 'blue-500', 'blue-700', 1),
('Finance', 'Финансы', '金融', 'Landmark', 'emerald-500', 'emerald-700', 2),
('Medical', 'Медицина', '医疗', 'Stethoscope', 'red-500', 'red-700', 3),
('Legal', 'Юридический', '法律', 'Scale', 'amber-500', 'amber-700', 4),
('Business', 'Бизнес', '商务', 'Briefcase', 'violet-500', 'violet-700', 5),
('Education', 'Образование', '教育', 'GraduationCap', 'cyan-500', 'cyan-700', 6),
('Photography', 'Фотография', '摄影', 'Camera', 'pink-500', 'pink-700', 7),
('Creative', 'Творческий', '创意', 'Palette', 'orange-500', 'orange-700', 8);