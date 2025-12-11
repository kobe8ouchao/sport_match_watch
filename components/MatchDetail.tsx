import React, { useEffect, useState } from 'react';
import { fetchMatchDetails } from '../services/api';
import { MatchDetailData } from '../types';
import SoccerMatchDetail from './SoccerMatchDetail';
import BasketballMatchDetail from './BasketballMatchDetail';
import { Loader2 } from 'lucide-react';

interface MatchDetailProps {
  matchId: string;
  leagueId: string;
  onBack: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ matchId, leagueId, onBack }) => {
  const [matchData, setMatchData] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchMatchDetails(matchId, leagueId);
      setMatchData(data);
      setLoading(false);
    };
    loadData();
  }, [matchId, leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-500">
        <p className="text-xl font-bold mb-4">Match not found</p>
      </div>
    );
  }

  const isBasketball = leagueId === 'nba';
  const detail = isBasketball 
    ? <BasketballMatchDetail match={matchData} onBack={onBack} />
    : <SoccerMatchDetail match={matchData} onBack={onBack} />;

  return (
    <div className="max-w-6xl mx-auto">
      {detail}
    </div>
  );
};

export default MatchDetail;
