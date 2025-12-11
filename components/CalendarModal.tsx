import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MONTH_NAMES, getMonthGrid, isSameDay } from '../utils';
import { Match } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  matches: Match[]; // To show dots
  calendarEntries?: { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[];
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSelectDate,
  matches,
  calendarEntries
}) => {
  // Simple state for browsing months inside the calendar
  // Initialize with selectedDate's month/year
  const [viewDate, setViewDate] = React.useState(new Date(selectedDate));

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const days = getMonthGrid(currentYear, currentMonth);

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const handleDateClick = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  // Helper to check if a day has matches
  const matchTypesForDay = (day: Date) => {
    const types = new Set<string>();
    if (calendarEntries && calendarEntries.length > 0) {
      calendarEntries.forEach(c => {
        if (isSameDay(c.date, day)) types.add(c.sport);
      });
    } else {
      matches.forEach(m => {
        if (isSameDay(m.startTime, day)) types.add('soccer'); // fallback
      });
    }
    return Array.from(types);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="
        relative z-10 w-full md:w-[400px] 
        bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl 
        rounded-t-3xl md:rounded-3xl 
        shadow-2xl border border-white/20 dark:border-white/10
        p-6 animate-in slide-in-from-bottom-10 fade-in duration-300
      ">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Select Date
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
                <ChevronLeft size={24} />
            </button>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} <span className="text-gray-400 font-normal">{currentYear}</span>
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
                <ChevronRight size={24} />
            </button>
        </div>

        {/* Days Grid Header */}
        <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {day}
                </div>
            ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2">
            {days.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />;
                
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayTypes = matchTypesForDay(day);

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => handleDateClick(day)}
                        className={`
                            relative h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm transition-all duration-200
                            ${isSelected 
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105 font-bold' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                            }
                            ${isToday && !isSelected ? 'text-blue-500 font-bold' : ''}
                        `}
                    >
                        {day.getDate()}
                        
                        {/* Match Day Indicator Dots */}
                        {dayTypes.length > 0 && (
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-0.5 text-[10px] leading-none">
                              {dayTypes.includes('soccer') && (
                                <span className={`${isSelected ? 'text-white/90 dark:text-black/80' : 'text-green-500'}`}>⚽</span>
                              )}
                              {dayTypes.includes('basketball') && (
                                <span className={`${isSelected ? 'text-white/90 dark:text-black/80' : 'text-orange-500'}`}>🏀</span>
                              )}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
            <button 
                onClick={() => handleDateClick(new Date())}
                className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400"
            >
                Jump to Today
            </button>
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;