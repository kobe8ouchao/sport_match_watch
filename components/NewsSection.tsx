import React, { useEffect, useState } from 'react';
import { fetchNews } from '../services/api';
import { Article } from '../types';

interface NewsSectionProps {
  leagueId: string;
  matchId?: string;
  hideHeader?: boolean;
  className?: string;
  limit?: number;
  compact?: boolean;
  sidebar?: boolean; // New prop
}

const NewsSection: React.FC<NewsSectionProps> = ({ leagueId, matchId, hideHeader, className, limit, compact, sidebar }) => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const articles = await fetchNews(leagueId, matchId);
        setNews(limit ? articles.slice(0, limit) : articles);
      } catch (e) {
        console.error(e);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [leagueId, matchId, limit]);

  if (loading) {
    return (
        <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
    );
  }

  if (news.length === 0) {
      return (
        <div className={`flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl ${className || ''}`}>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No news available at the moment.
          </p>
        </div>
      );
  }

  const gridClass = sidebar 
    ? 'grid-cols-1' 
    : compact 
        ? 'grid-cols-1' 
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`animate-slide-up ${className || ''}`}>
        {!hideHeader && (
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center px-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            {matchId ? 'Match News' : 'Latest News'}
          </h3>
        )}
        <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
            {news.map((a: Article) => {
              const img = a.images?.[0]?.url;
              return (
                <a key={a.headline || Math.random()} href={a.link} target="_blank" rel="noreferrer" className="group relative block w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-white/10">
                  
                  {/* Background Image Layer */}
                  <div className="absolute inset-0 z-0">
                    {img ? (
                      <img src={img} alt={a.headline || ''} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-4xl opacity-30">📰</div>
                    )}
                    {/* Dark gradient overlay for entire card */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                  </div>

                  {/* Content Overlay - Minimalist Frosted Glass */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-3 px-3 transition-all duration-300">
                    <div className="text-[18px] font-bold text-white line-clamp-2 leading-relaxed drop-shadow-md mb-0.5">
                      {a.headline}
                    </div>
                    <div className="text-[12px] text-gray-300 font-medium opacity-80">
                      {new Date(a.published).toLocaleDateString()}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
    </div>
  );
};

export default NewsSection;
