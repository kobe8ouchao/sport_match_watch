import React, { useEffect, useState } from 'react';
import { Building2, CalendarDays, CircleDot, HelpCircle, Leaf, Loader2, MapPin, Mountain, Trophy } from 'lucide-react';
import { TennisTourEvent } from '../types';
import { fetchMonthlyTennisTourEvents } from '../services/api';

interface TourState {
  atp: TennisTourEvent[];
  wta: TennisTourEvent[];
}

interface TennisTourPanelProps {
  className?: string;
  filterStatuses?: TennisTourEvent['status'][];
  maxEventsPerLeague?: number;
  visibleLeagues?: TennisTourEvent['league'][];
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

const statusClassMap: Record<TennisTourEvent['status'], string> = {
  LIVE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  ONGOING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

const surfaceConfig: Record<TennisTourEvent['surface'], { label: string; className: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  hard: {
    label: 'Hard',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
    icon: CircleDot,
  },
  clay: {
    label: 'Clay',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    icon: Mountain,
  },
  grass: {
    label: 'Grass',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    icon: Leaf,
  },
  'indoor-hard': {
    label: 'Indoor',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
    icon: Building2,
  },
  unknown: {
    label: 'Tour',
    className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
    icon: HelpCircle,
  },
};

const levelClassName = (level: string) => {
  if (level === 'Grand Slam') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
  if (level.includes('1000')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300';
  if (level.includes('500')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300';
  if (level.includes('250')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300';
  if (level.includes('Finals')) return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300';
  return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300';
};

const surfaceBackgroundClass: Record<TennisTourEvent['surface'], string> = {
  hard: 'bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800',
  clay: 'bg-gradient-to-br from-orange-700 via-amber-700 to-red-800',
  grass: 'bg-gradient-to-br from-green-700 via-emerald-700 to-lime-800',
  'indoor-hard': 'bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-800',
  unknown: 'bg-gradient-to-br from-slate-700 via-gray-700 to-zinc-800',
};

const LeagueTourCard: React.FC<{ title: string; accentClass: string; events: TennisTourEvent[]; emptyText?: string }> = ({ title, accentClass, events, emptyText }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
        <span className={`w-1.5 h-6 rounded-full mr-3 ${accentClass}`}></span>
        {title}
      </h3>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {events.length} events
      </span>
    </div>

    {events.length === 0 ? (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        {emptyText || 'No scheduled tour events this month'}
      </div>
    ) : (
      <div className="space-y-3">
        {events.map((event) => {
          const surface = surfaceConfig[event.surface];
          const SurfaceIcon = surface.icon;

          return (
            <div
              key={`${title}-${event.id}`}
              className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 p-4 bg-gray-50/60 dark:bg-white/5"
            >
              <div className={`absolute inset-0 ${surfaceBackgroundClass[event.surface]}`} />
              {event.backgroundImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${event.backgroundImage})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/70" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${levelClassName(event.level)}`}>
                        {event.isMajor && <Trophy size={12} />}
                        {event.level}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${surface.className}`}>
                        <SurfaceIcon size={12} />
                        {surface.label}
                      </span>
                    </div>
                    <h4 className="font-bold text-white truncate text-base">
                      {event.name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                      <CalendarDays size={13} />
                      <span>{formatDateRange(event.startDate, event.endDate)}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${statusClassMap[event.status]}`}>
                    {event.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-white/85">
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-white/70" />
                      <span>{event.location}{event.court ? ` · ${event.court}` : ''}</span>
                    </div>
                  )}
                  <div className="text-xs text-white/70">
                    Singles matches: {event.singlesMatchCount}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const TennisTourSkeleton: React.FC<{ title: string; accentClass: string }> = ({ title, accentClass }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
        <span className={`w-1.5 h-6 rounded-full mr-3 ${accentClass}`}></span>
        {title}
      </h3>
      <Loader2 className="animate-spin text-gray-400" size={18} />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`${title}-${index}`} className="rounded-2xl border border-gray-100 dark:border-white/5 p-4 animate-pulse">
          <div className="h-4 w-36 rounded bg-gray-200 dark:bg-white/10 mb-3"></div>
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10 mb-2"></div>
          <div className="h-3 w-32 rounded bg-gray-200 dark:bg-white/10"></div>
        </div>
      ))}
    </div>
  </div>
);

const TennisTourPanel: React.FC<TennisTourPanelProps> = ({
  className,
  filterStatuses,
  maxEventsPerLeague,
  visibleLeagues,
}) => {
  const [data, setData] = useState<TourState>({ atp: [], wta: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourEvents = async () => {
      setLoading(true);
      try {
        const result = await fetchMonthlyTennisTourEvents();
        setData(result);
      } catch (error) {
        console.error('Failed to load tennis tour events:', error);
        setData({ atp: [], wta: [] });
      } finally {
        setLoading(false);
      }
    };

    loadTourEvents();
  }, []);

  const filterEvents = (events: TennisTourEvent[]) => {
    const filtered = filterStatuses?.length
      ? events.filter((event) => filterStatuses.includes(event.status))
      : events;

    return typeof maxEventsPerLeague === 'number'
      ? filtered.slice(0, maxEventsPerLeague)
      : filtered;
  };

  const atpEvents = filterEvents(data.atp);
  const wtaEvents = filterEvents(data.wta);
  const showAtp = !visibleLeagues?.length || visibleLeagues.includes('atp');
  const showWta = !visibleLeagues?.length || visibleLeagues.includes('wta');
  const isOngoingOnly = Boolean(filterStatuses?.length) && filterStatuses.every((status) => status === 'LIVE' || status === 'ONGOING');
  const atpTitle = isOngoingOnly ? 'ATP Ongoing This Month' : 'ATP Tour This Month';
  const wtaTitle = isOngoingOnly ? 'WTA Ongoing This Month' : 'WTA Tour This Month';
  const emptyText = isOngoingOnly ? 'No ongoing tour events right now' : 'No scheduled tour events this month';

  return (
    <div className={`${className || 'w-full'} space-y-6`}>
      {loading ? (
        <>
          <TennisTourSkeleton title={atpTitle} accentClass="bg-lime-500" />
          <TennisTourSkeleton title={wtaTitle} accentClass="bg-fuchsia-500" />
        </>
      ) : (
        <>
          {showAtp && <LeagueTourCard title={atpTitle} accentClass="bg-lime-500" events={atpEvents} emptyText={emptyText} />}
          {showWta && <LeagueTourCard title={wtaTitle} accentClass="bg-fuchsia-500" events={wtaEvents} emptyText={emptyText} />}
        </>
      )}
    </div>
  );
};

export default TennisTourPanel;
