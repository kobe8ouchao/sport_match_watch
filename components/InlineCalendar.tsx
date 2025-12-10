import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, getMonthGrid, isSameDay } from '../utils';
import { Match } from '../types';

interface InlineCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  matches: Match[];
}

const InlineCalendar: React.FC<InlineCalendarProps> = ({ 
  selectedDate, 
  onSelectDate,
  matches 
}) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  // Sync view if selectedDate changes externally
  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const days = getMonthGrid(currentYear, currentMonth);

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const hasMatch = (day: Date) => matches.some(m => isSameDay(m.startTime, day));

  return (
    <div className="h-full glass-card rounded-2xl p-6 flex flex-col bg-white/60 dark:bg-zinc-900/60 transition-colors duration-300">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {MONTH_NAMES[currentMonth]} <span className="text-gray-400 font-normal ml-1">{currentYear}</span>
        </span>
        <div className="flex space-x-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                <ChevronLeft size={18} />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                <ChevronRight size={18} />
            </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {day}
              </div>
          ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1 flex-1 content-start">
          {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayHasMatch = hasMatch(day);

              return (
                  <button
                      key={day.toISOString()}
                      onClick={() => onSelectDate(day)}
                      className={`
                          relative h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-sm transition-all duration-300
                          ${isSelected 
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/20 dark:shadow-white/20 font-semibold transform scale-105' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                          }
                          ${isToday && !isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}
                      `}
                  >
                      {day.getDate()}
                      
                      {/* Match Dot */}
                      {dayHasMatch && (
                          <div className={`
                              absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full transition-colors
                              ${isSelected 
                                  ? 'bg-white dark:bg-black' 
                                  : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]'
                              }
                          `} />
                      )}
                  </button>
              );
          })}
      </div>

      {/* Bottom Info / Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Match Day</span>
          </div>
          <button 
              onClick={() => onSelectDate(new Date())}
              className="text-gray-900 dark:text-white hover:underline"
          >
              Today
          </button>
      </div>
    </div>
  );
};

export default InlineCalendar;