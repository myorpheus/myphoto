

## Plan: Add NewsCarousel and HeadshotShowcase to Landing Page

### Database Changes

**1. Create `news_articles` table**
- Columns: `id` (uuid), `title` (text), `content` (text), `excerpt` (text), `image_url` (text), `category` (text), `author` (text), `published_at` (timestamptz), `is_published` (boolean, default false), `created_at`, `updated_at`
- RLS: public SELECT for published articles; admin ALL

**2. Create `templates` table**
- Columns: `id` (uuid), `name` (text), `name_ru` (text), `name_zh` (text), `icon` (text), `color_from` (text), `color_to` (text), `generated_image_url` (text, nullable), `is_active` (boolean, default true), `display_order` (integer)
- RLS: public SELECT for active templates; admin ALL

**3. Seed both tables** with sample data so the sections aren't empty on first load.

### New Files

**`src/hooks/useNewsArticles.ts`** — React Query hook fetching published articles from `news_articles` table, with optional limit parameter.

**`src/components/landing/NewsCarousel.tsx`** — Adapted from dzenphoto. Auto-playing embla carousel with news cards, navigation dots, play/pause. Uses `useNewsArticles` hook. Links go to `/blog/{id}` (or `#` if no blog page exists yet).

**`src/components/landing/HeadshotShowcase.tsx`** — Adapted from dzenphoto. Fetches active templates from `templates` table. Auto-rotating showcase grid with dot indicators. Uses `useTranslation` instead of `useLanguage`.

### Modified Files

**`src/pages/Index.tsx`** — Import and render `NewsCarousel` between Features and Testimonials, and `HeadshotShowcase` between HowItWorks and Features (matching dzenphoto's layout order).

### Technical Notes
- Both components are well under 350 lines (NewsCarousel ~155 lines, HeadshotShowcase ~152 lines)
- `embla-carousel-autoplay` needs to be installed as a dependency for the carousel autoplay
- The `templates` table uses dynamic Tailwind classes for colors — these will use inline gradient styles as fallback since dynamic class names aren't compiled by Tailwind

