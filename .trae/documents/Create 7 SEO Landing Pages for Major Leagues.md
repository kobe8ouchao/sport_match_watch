# Create 7 SEO Landing Pages

## 1. Create Shared Landing Page Component
Create `components/LeagueLandingPage.tsx` which will serve as the template for all 7 pages.
- **Features:**
  - Dynamic H1 Title and SEO-rich description.
  - "View Live Dashboard" CTA button linking to homepage with league filter.
  - Integration of `StandingsWidget` for immediate value.
  - League-specific background/theme styling.
  - Keyword-rich footer section specific to the page.

## 2. Update App Routing
Modify `App.tsx` to include 7 new routes with specific props for `LeagueLandingPage`:
- `/nba-live-scores` (NBA)
- `/champions-league-results` (UEFA Champions League)
- `/premier-league-fixtures` (Premier League)
- `/la-liga-standings` (La Liga)
- `/bundesliga-scores` (Bundesliga)
- `/ligue-1-match-stats` (Ligue 1)
- `/serie-a-live-football` (Serie A)

## 3. SEO Optimization
- Update `components/SEO.tsx` to generate unique, keyword-heavy titles for these new routes.
- Ensure metadata (description) matches the page content.

## 4. Update Sitemap
- Add the 7 new URLs to `sitemap.xml` with appropriate priority and change frequency.

## 5. Verification
- Verify navigation to new pages.
- Check title tags and content rendering.
- Verify "Go to Dashboard" links work correctly.
