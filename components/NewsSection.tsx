import React, { useEffect, useState } from 'react';

interface NewsSectionProps {
  leagueId: string;
}

const NewsSection: React.FC<NewsSectionProps> = ({ leagueId }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        if (leagueId === 'nba') {
          endpoint = 'basketball/nba';
        } else if (leagueId === 'top') {
          endpoint = 'soccer/eng.1'; // Default to Premier League for Top
        } else {
          endpoint = `soccer/${leagueId}`;
        }
        
        const url = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/news`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch news');
        const data = await resp.json();
        const articles = Array.isArray(data?.articles) ? data.articles : [];
        setNews(articles);
      } catch (e) {
        console.error(e);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [leagueId]);

  if (loading) {
    return (
        <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
    );
  }

  if (news.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No news available at the moment.
          </p>
        </div>
      );
  }

  return (
    <div className="animate-slide-up">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center px-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
          Latest News
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((a: any) => {
              const img = a.images?.[0]?.url;
              const link = a.links?.web?.href || a.links?.web?.self?.href || a.links?.api?.self?.href;
              return (
                <a key={a.headline || Math.random()} href={link} target="_blank" rel="noreferrer" className="group rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 shadow-sm hover:shadow-md transition-all hover:bg-white/20 dark:hover:bg-white/10 glass-card">
                  <div className="aspect-video bg-gray-100/10 dark:bg-white/5 overflow-hidden">
                    {img ? (
                      <img src={img} alt={a.headline || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📰</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug min-h-[2.5rem]">
                      {a.headline}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
