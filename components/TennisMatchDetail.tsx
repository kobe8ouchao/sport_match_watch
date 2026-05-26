import React, { useMemo, useState } from 'react';
import { MatchDetailData } from '../types';
import { DEFAULT_TENNIS_HEADSHOT } from '../constants';
import { CalendarDays, Clock3, ExternalLink, Loader2, MapPin, Newspaper, Trophy } from 'lucide-react';
import NewsSection from './NewsSection';

interface TennisMatchDetailProps {
  match: MatchDetailData;
  onBack: () => void;
}

const TennisMatchDetail: React.FC<TennisMatchDetailProps> = ({ match }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'news'>('overview');
  const isLive = match.status === 'LIVE' || match.status === 'HT';
  const isScheduled = match.status === 'SCHEDULED';
  const isFinished = match.status === 'FINISHED';

  const liveLabel = useMemo(() => {
    if (!isLive) return match.statusDetail || match.status;
    const currentSet = typeof match.minute === 'number'
      ? match.minute
      : typeof match.minute === 'string'
        ? parseInt(match.minute, 10)
        : NaN;
    return Number.isFinite(currentSet) && currentSet > 0 ? `LIVE | Set ${currentSet}` : 'LIVE';
  }, [isLive, match.minute, match.status, match.statusDetail]);

  const statusLabel = isLive
    ? liveLabel
    : isFinished
      ? 'Final'
      : match.statusDetail || match.status;

  const formattedDateTime = match.startTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const tabs: { key: 'overview' | 'stats' | 'news'; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'stats', label: 'Stats' },
    { key: 'news', label: 'News' },
  ];

  const renderPlayerCard = (
    side: 'home' | 'away',
    player: MatchDetailData['homeTeam'],
    score: number
  ) => {
    const isWinner = !isScheduled && (
      side === 'home' ? match.homeScore > match.awayScore : match.awayScore > match.homeScore
    );

    return (
      <div
        className={`rounded-3xl p-5 border transition-all ${
          isWinner
            ? 'bg-white/90 dark:bg-white/10 border-emerald-200 dark:border-emerald-500/20 shadow-lg'
            : 'bg-white/70 dark:bg-white/5 border-gray-100 dark:border-white/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 bg-white shrink-0">
            <img
              src={player.headshot || DEFAULT_TENNIS_HEADSHOT}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_TENNIS_HEADSHOT;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {side === 'home' ? 'Player 1' : 'Player 2'}
            </div>
            <div className="mt-1 flex items-center gap-2 min-w-0">
              {player.logo && (
                <img
                  src={player.logo}
                  alt={`${player.name} flag`}
                  className="h-4 w-4 rounded-full object-cover shrink-0"
                />
              )}
              <div className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {player.name}
              </div>
            </div>
            {player.link && (
              <a
                href={player.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Player Card
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="text-4xl font-black font-mono text-gray-900 dark:text-white">
            {isScheduled ? '-' : score}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 dark:border-white/5 bg-gradient-to-br from-lime-500 via-emerald-600 to-teal-700 text-white shadow-2xl mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_45%)]" />
        <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wide">
              {match.leagueId === 'tennis.wta' ? 'WTA' : 'ATP'}
            </span>
            {match.tournamentName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
                <Trophy size={12} className="mr-1.5" />
                {match.tournamentName}
              </span>
            )}
            {match.roundName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/15 border border-white/10 text-xs font-semibold">
                {match.roundName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {renderPlayerCard('home', match.homeTeam, match.homeScore)}

            <div className="flex flex-col items-center justify-center text-center px-2">
              <div className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide border ${
                isLive
                  ? 'bg-red-500/20 border-red-300/30'
                  : 'bg-white/10 border-white/15'
              }`}>
                {statusLabel}
              </div>
              <div className="mt-3 text-sm text-white/85 flex items-center gap-2">
                <Clock3 size={14} />
                <span>{formattedDateTime}</span>
              </div>
              {isFinished && match.matchDuration && (
                <div className="mt-2 text-xs text-white/80">
                  Duration: {match.matchDuration}
                </div>
              )}
              {match.bestOf && (
                <div className="mt-2 text-xs text-white/70">
                  Best of {match.bestOf}
                </div>
              )}
            </div>

            {renderPlayerCard('away', match.awayTeam, match.awayScore)}
          </div>

          {match.summaryNote && (
            <div className="mt-6 rounded-2xl bg-black/15 border border-white/10 px-4 py-3 text-sm text-white/90">
              {match.summaryNote}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full overflow-x-auto py-2">
          <div className="flex space-x-3 min-w-max items-center justify-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-200 dark:border-white/10 shadow-sm'
                      : 'bg-white/40 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white/70 dark:hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center">
              <span className="w-1 h-6 bg-lime-500 rounded-full mr-3"></span>
              Set Score
            </h3>
            {match.setScores && match.setScores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                      <th className="py-3 pr-4">Player</th>
                      {match.setScores.map((_, index) => (
                        <th key={`set-${index + 1}`} className="py-3 text-center min-w-[64px]">
                          Set {index + 1}
                        </th>
                      ))}
                      <th className="py-3 text-center min-w-[64px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-white/5">
                      <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">{match.homeTeam.shortName}</td>
                      {match.setScores.map((setScore, index) => (
                        <td key={`home-set-${index}`} className="py-4 text-center font-mono text-gray-700 dark:text-gray-300">
                          {setScore.home}
                        </td>
                      ))}
                      <td className="py-4 text-center font-black text-gray-900 dark:text-white">{match.homeScore}</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">{match.awayTeam.shortName}</td>
                      {match.setScores.map((setScore, index) => (
                        <td key={`away-set-${index}`} className="py-4 text-center font-mono text-gray-700 dark:text-gray-300">
                          {setScore.away}
                        </td>
                      ))}
                      <td className="py-4 text-center font-black text-gray-900 dark:text-white">{match.awayScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No set-by-set score available yet.</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center">
                <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                Match Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Start Time</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{formattedDateTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Venue</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{match.stadium || 'Unknown Venue'}</div>
                    {match.court && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{match.court}</div>
                    )}
                  </div>
                </div>
                {match.roundName && (
                  <div className="flex items-start gap-3">
                    <Trophy size={16} className="mt-0.5 text-gray-400" />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Round</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{match.roundName}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center">
                <span className="w-1 h-6 bg-fuchsia-500 rounded-full mr-3"></span>
                Match Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{statusLabel}</div>
                </div>
                <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Format</div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                    {match.bestOf ? `Best of ${match.bestOf}` : 'Unavailable'}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                    {isFinished ? (match.matchDuration || 'Unavailable') : 'In Progress'}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Winner</div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                    {isFinished ? (match.homeScore > match.awayScore ? match.homeTeam.shortName : match.awayTeam.shortName) : 'In Progress'}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/70 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sets Played</div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                    {match.setScores?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center">
            <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
            Match Stats
          </h3>
          {match.stats.length > 0 ? (
            <div className="space-y-5">
              {match.stats.map((stat) => {
                const homeVal = parseFloat(String(stat.homeValue).replace('%', '')) || 0;
                const awayVal = parseFloat(String(stat.awayValue).replace('%', '')) || 0;
                const total = stat.isPercentage ? 100 : homeVal + awayVal;
                const homePercent = total > 0 ? (homeVal / total) * 100 : 0;
                const awayPercent = total > 0 ? (awayVal / total) * 100 : 0;

                return (
                  <div key={stat.name} className="space-y-2">
                    <div className="flex justify-between items-end gap-3">
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stat.homeValue}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">{stat.name}</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stat.awayValue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-end">
                        <div className="h-full bg-lime-500 rounded-full" style={{ width: `${homePercent}%` }} />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${awayPercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-5 py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                <Loader2 size={20} className="text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                ESPN tennis summary currently has no detailed stat split for this match.
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className="glass-card rounded-3xl p-6 backdrop-blur-md bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
            Match News
            <Newspaper size={18} className="ml-2 text-gray-400" />
          </h3>
          <NewsSection
            leagueId={match.leagueId}
            matchId={match.id}
            hideHeader
            className="!p-0 !bg-transparent !shadow-none !border-none"
          />
        </div>
      )}
    </div>
  );
};

export default TennisMatchDetail;
