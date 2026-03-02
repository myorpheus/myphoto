

## Plan: Copy dzenphoto Landing Page UI to This Project

### Problem
The user wants the full landing page design from their **dzenphoto** project copied to this project's Index page.

### Key Differences Between Projects
The source project (dzenphoto) uses different hooks and components:
- `useLanguage()` → this project uses `useTranslation()` from `@/contexts/LanguageContext`
- `useAuth()` → this project uses `supabaseService.getCurrentUser()`
- `useAdminRole()` → this project has `AdminRoute` but no `useAdminRole` hook
- `AnimatedCounter` component → doesn't exist here, needs to be created
- `AdminBadge` component → not needed (admin links not in landing header)
- `useNewsArticles` hook → doesn't exist, NewsCarousel depends on a `news_articles` table
- `motion` (framer-motion) → this project has the `motion` package installed
- CSS utility classes (`glass`, `gradient-primary`, `gradient-text`, `gradient-hero`, etc.) → need to be added to `index.css`
- Fonts: Plus Jakarta Sans + Sora → need to be added

### Implementation Steps

#### 1. Update `index.html` — Add Google Fonts
Add Plus Jakarta Sans and Sora font imports.

#### 2. Update `tailwind.config.ts` — Add `font-display` family
Add `display: ['Sora', 'sans-serif']` to fontFamily config.

#### 3. Update `src/index.css` — Add CSS utility classes from dzenphoto
Add the gradient utilities (`gradient-primary`, `gradient-hero`, `gradient-card`, `gradient-text`, `glow`, `glow-text`, `glass`), animation keyframes (`float`, `pulse-glow`, `fade-up`), and CSS custom properties (gradient vars, shadow vars) from the source project. Merge with existing variables.

#### 4. Create `src/components/AnimatedCounter.tsx`
A simple counter component with intersection observer animation.

#### 5. Create landing page components (all under 350 lines)
Adapt each component from dzenphoto, replacing `useLanguage()` with `useTranslation()`, `Link to="/auth"` with `navigate('/login')`, and removing dependencies on missing hooks/data:

- **`src/components/landing/Header.tsx`** — Adapted header with language selector, theme toggle, sign in/get started buttons. Remove `useAuth`, `useAdminRole`, `AdminBadge`, `MobileMenu` (simplify for this project).
- **`src/components/landing/Hero.tsx`** — Hero with motion animations, animated stats, CTA buttons.
- **`src/components/landing/HowItWorks.tsx`** — 3-step process section.
- **`src/components/landing/Features.tsx`** — Templates + features grid.
- **`src/components/landing/Testimonials.tsx`** — Testimonials grid with ratings (hardcoded data, adapted for this project's language system).
- **`src/components/landing/Pricing.tsx`** — 3-tier pricing cards.
- **`src/components/landing/FAQ.tsx`** — Accordion FAQ section.
- **`src/components/landing/ContactForm.tsx`** — Contact form (simplified without `contact_inquiries` table — just show toast on submit).
- **`src/components/landing/CTASection.tsx`** — Final CTA section.
- **`src/components/landing/Footer.tsx`** — Simple footer.

**Skipping**: `NewsCarousel` (requires `news_articles` table + `useNewsArticles` hook) and `HeadshotShowcase` (requires `templates` table). These can be added later.

#### 6. Update `src/pages/Index.tsx`
Replace the current landing page with the new modular component structure, keeping the auth redirect logic.

#### 7. Add missing translation keys
Add new translation keys to `en.ts`, `ru.ts`, `zh.ts` for the new landing sections (howItWorks, testimonials, pricing, FAQ, CTA, contact, etc.).

### Files to Create
- `src/components/AnimatedCounter.tsx`
- `src/components/landing/Header.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/Pricing.tsx`
- `src/components/landing/FAQ.tsx`
- `src/components/landing/ContactForm.tsx`
- `src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx`

### Files to Modify
- `index.html` (fonts)
- `tailwind.config.ts` (font-display)
- `src/index.css` (CSS utilities + variables)
- `src/pages/Index.tsx` (new composition)
- `src/i18n/translations/en.ts` (new keys)
- `src/i18n/translations/ru.ts` (new keys)
- `src/i18n/translations/zh.ts` (new keys)

