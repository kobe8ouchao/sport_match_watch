import React, { useState, useEffect, useRef } from 'react';
import { fetchNews } from '../services/api';
import { Article } from '../types';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface NewsCarouselProps {
  className?: string;
}

const NewsCarousel: React.FC<NewsCarouselProps> = ({ className }) => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadMixedNews = async () => {
      try {
        setLoading(true);
        const [nbaNews, soccerNews, nflNews] = await Promise.all([
          fetchNews('nba'),
          fetchNews('eng.1'), // Premier League as representative for Soccer
          fetchNews('nfl'),
        ]);

        // Take top 2 from each
        const selectedNews = [
          ...nbaNews.slice(0, 2).map(n => ({ ...n, source: 'NBA' })),
          ...soccerNews.slice(0, 2).map(n => ({ ...n, source: 'Soccer' })),
          ...nflNews.slice(0, 2).map(n => ({ ...n, source: 'NFL' })),
        ];

        setNews(selectedNews);
      } catch (error) {
        console.error('Error loading carousel news:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMixedNews();
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (news.length > 0) {
        timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => 
            prevIndex === news.length - 1 ? 0 : prevIndex + 1
        );
        }, 6000); 
    }
    return () => resetTimeout();
  }, [currentIndex, news.length]);

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === news.length - 1 ? 0 : prev + 1);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => prev === 0 ? news.length - 1 : prev - 1);
  };

  if (loading) {
    return (
      <div className={`relative w-full h-48 md:h-56 rounded-3xl overflow-hidden shadow-sm bg-gray-100 dark:bg-white/5 animate-pulse flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (news.length === 0) return null;

  const currentArticle = news[currentIndex];
  const hasImage = currentArticle.images && currentArticle.images.length > 0 && currentArticle.images[0].url;
  const bgImage = hasImage ? currentArticle.images![0].url : '';
  
  // Tag Color based on source (injected manually above)
  const getTagColor = (source?: string) => {
      switch(source) {
          case 'NBA': return 'bg-orange-500';
          case 'NFL': return 'bg-blue-600';
          case 'Soccer': return 'bg-green-500';
          default: return 'bg-gray-500';
      }
  };

  // Safe cast for source property we added
  const source = (currentArticle as any).source || 'News';

  return (
    <div className={`relative w-full h-48 md:h-56 group rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl ${className}`}>
      
      {/* Background Layer */}
      <div className="absolute inset-0 transition-colors duration-500 bg-gray-200 dark:bg-gray-900">
        {hasImage ? (
           <>
             <img 
               src={bgImage}
               alt={currentArticle.headline}
               className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-linear transform scale-100 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
           </>
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
               {/* Decorative patterns */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           </div>
        )}
      </div>

      {/* Content Container */}
      <a 
        href={currentArticle.link} 
        target="_blank" 
        rel="noreferrer"
        className="relative h-full flex flex-col justify-end p-6 md:p-8 z-10 w-full"
      >
        
        {/* Source Badge */}
        <div className="absolute top-6 left-6 z-20">
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg text-white ${getTagColor(source)}`}>
                {source}
            </span>
        </div>

        {/* Text Content */}
        <div className="transform transition-transform duration-500 translate-y-0">
            <h3 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md mb-2">
                {currentArticle.headline}
            </h3>
            <p className="text-gray-300 text-xs md:text-sm line-clamp-1 max-w-[90%] font-medium">
                {currentArticle.description || 'Click to read full story...'}
            </p>
        </div>

        {/* External Link Icon */}
        <div className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20">
            <ExternalLink size={16} />
        </div>
      </a>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button 
            onClick={(e) => prevSlide(e)}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all transform hover:scale-110"
        >
            <ChevronLeft size={20} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <button 
            onClick={(e) => nextSlide(e)}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all transform hover:scale-110"
        >
            <ChevronRight size={20} />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 right-6 flex space-x-1.5 z-20">
        {news.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsCarousel;
