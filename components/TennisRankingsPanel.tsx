import React, { useEffect, useState } from 'react';
import { Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { TennisRankingPlayer } from '../types';
import { fetchTennisRankings } from '../services/api';
import { DEFAULT_TENNIS_HEADSHOT } from '../constants';

interface RankingState {
  atp: TennisRankingPlayer[];
  wta: TennisRankingPlayer[];
}

const formatPoints = (points: number) => {
  return new Intl.NumberFormat('en-US').format(points);
};

const getRankChange = (player: TennisRankingPlayer) => {
  if (typeof player.previousRank !== 'number' || player.previousRank <= 0) {
    return { delta: 0, direction: 'same' as const };
  }

  const delta = player.previousRank - player.rank;
  if (delta > 0) return { delta, direction: 'up' as const };
  if (delta < 0) return { delta: Math.abs(delta), direction: 'down' as const };
  return { delta: 0, direction: 'same' as const };
};

const RankingCard: React.FC<{ title: string; players: TennisRankingPlayer[]; accentClass: string }> = ({ title, players, accentClass }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <span className={`w-1.5 h-6 rounded-full mr-3 ${accentClass}`}></span>
          {title}
        </h3>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Top {players.length}
        </span>
      </div>

      {players.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 font-medium border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="pb-2 pl-1 w-8">#</th>
                <th className="pb-2">Player</th>
                <th className="pb-2 text-center">Move</th>
                <th className="pb-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50 dark:divide-white/5">
              {players.map((player) => {
                const change = getRankChange(player);

                return (
                  <tr key={`${title}-${player.athleteId}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 pl-1 font-medium w-8 text-gray-500 dark:text-gray-400">
                      {player.rank}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-white shrink-0">
                          <img
                            src={player.headshot || DEFAULT_TENNIS_HEADSHOT}
                            alt={player.displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = DEFAULT_TENNIS_HEADSHOT;
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          {player.flag && (
                            <div className="h-4 w-4 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-white shrink-0">
                              <img
                                src={player.flag}
                                alt={`${player.displayName} flag`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-semibold truncate max-w-[132px] text-gray-900 dark:text-gray-100">
                            {player.shortName || player.displayName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      {change.direction === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-xs">
                          <TrendingUp size={14} />
                          +{change.delta}
                        </span>
                      ) : change.direction === 'down' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                          <TrendingDown size={14} />
                          -{change.delta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 font-semibold text-xs">
                          <Minus size={14} />
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-900 dark:text-white">
                      {formatPoints(player.points)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          No rankings available
        </div>
      )}
    </div>
  );
};

const RankingSkeleton: React.FC<{ title: string; accentClass: string }> = ({ title, accentClass }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <span className={`w-1.5 h-6 rounded-full mr-3 ${accentClass}`}></span>
          {title}
        </h3>
        <Loader2 className="animate-spin text-gray-400" size={18} />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={`${title}-skeleton-${index}`}
            className="flex items-center gap-3 px-1 py-2 animate-pulse border-b border-gray-50 dark:border-white/5 last:border-b-0"
          >
            <div className="w-5 h-4 rounded bg-gray-200 dark:bg-white/10"></div>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10"></div>
            </div>
            <div className="w-10 h-4 rounded bg-gray-200 dark:bg-white/10"></div>
            <div className="w-14 h-4 rounded bg-gray-200 dark:bg-white/10"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TennisRankingsPanel: React.FC<{ className?: string }> = ({ className }) => {
  const [data, setData] = useState<RankingState>({ atp: [], wta: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        const rankings = await fetchTennisRankings(20);
        setData(rankings);
      } catch (error) {
        console.error('Failed to load tennis rankings:', error);
        setData({ atp: [], wta: [] });
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  return (
    <div className={`${className || 'w-full'} space-y-6`}>
      {loading ? (
        <>
          <RankingSkeleton title="ATP Rankings" accentClass="bg-lime-500" />
          <RankingSkeleton title="WTA Rankings" accentClass="bg-fuchsia-500" />
        </>
      ) : (
        <>
          <RankingCard title="ATP Rankings" players={data.atp} accentClass="bg-lime-500" />
          <RankingCard title="WTA Rankings" players={data.wta} accentClass="bg-fuchsia-500" />
        </>
      )}
    </div>
  );
};

export default TennisRankingsPanel;
