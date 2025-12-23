import { SEO_PAGES_DATA } from './seoPagesData';

export interface SEOPageData {
    slug: string;
    keyword: string;
    title: string;
    description: string;
    h1: string;
    content: string; // HTML content
    relatedLeagueId?: string; // Optional: to show specific league standings/matches
}

export const SEO_PAGES: SEOPageData[] = SEO_PAGES_DATA;
