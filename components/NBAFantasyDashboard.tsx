import React, { useState, useEffect } from 'react';
import { 
  Calendar, Info
} from 'lucide-react';
import { 
  fetchScheduleForWeeks, 
  TeamScheduleInfo
} from '../services/fantasyService';

const NBAFantasyDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([21, 22, 23]);
  const [scheduleData, setScheduleData] = useState<TeamScheduleInfo[]>([]);

  const AVAILABLE_WEEKS = [19, 20, 21, 22, 23, 24];

  useEffect(() => {
    loadData();
  }, [selectedWeeks]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Schedule for selected weeks
      const { teamSchedules } = await fetchScheduleForWeeks(selectedWeeks);
      setScheduleData(teamSchedules);
    } catch (e) {
      console.error("Error loading playoff data", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (week: number) => {
    if (selectedWeeks.includes(week)) {
      setSelectedWeeks(selectedWeeks.filter(w => w !== week));
    } else {
      setSelectedWeeks([...selectedWeeks, week].sort());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <Calendar className="text-blue-600" size={32} />
          Playoff Primer (2026)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
            Plan your championship run. Analyze schedule volume for the fantasy playoffs.
        </p>

        {/* Week Selector */}
        <div className="mt-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Playoff Weeks</label>
            <div className="flex flex-wrap gap-2">
                {AVAILABLE_WEEKS.map(week => (
                    <button
                        key={week}
                        onClick={() => toggleWeek(week)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            selectedWeeks.includes(week)
                                ? 'bg-black text-white shadow-md scale-105'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Week {week}
                    </button>
                ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
                Selected: {selectedWeeks.length > 0 ? `Weeks ${selectedWeeks.join(', ')}` : 'None'}
            </div>
        </div>
      </div>
      
      {/* Legend / Annotation */}
      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm">
        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Info size={16} />
            Understanding the Data
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <span className="font-bold text-gray-900 dark:text-white">Total Games:</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Total number of games a team plays during the selected weeks. More is generally better.</p>
            </div>
            <div>
                <span className="font-bold text-green-600">Off-Nights (Quality Games):</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Games played on low-volume days (usually &lt; 8 games). These players are less likely to sit on your bench.</p>
            </div>
            <div>
                <span className="font-bold text-red-500">B2Bs (Back-to-Backs):</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Games played on consecutive days. High risk of rest/injury for stars.</p>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduleData.sort((a, b) => b.totalGames - a.totalGames).map(team => (
                <div key={team.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={team.logo} alt={team.abbrev} className="w-10 h-10 object-contain" />
                        <div>
                            <div className="font-bold text-lg">{team.abbrev}</div>
                            <div className="text-xs text-gray-500">{team.totalGames} Games</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center px-2">
                            <div className="text-xs text-gray-400 uppercase">Off-Nights</div>
                            <div className={`font-bold ${team.qualityGames > (selectedWeeks.length * 2) ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {team.qualityGames}
                            </div>
                        </div>
                        <div className="text-center px-2">
                            <div className="text-xs text-gray-400 uppercase">B2Bs</div>
                            <div className={`font-bold ${team.b2b && team.b2b > 2 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {team.b2b || 0}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NBAFantasyDashboard;
