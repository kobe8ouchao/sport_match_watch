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
  variant?: 'modal' | 'popover';
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSelectDate,
  matches,
  calendarEntries,
  variant = 'modal'
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

  const content = (
    <div className={`
      relative z-10 w-full 
      bg-white dark:bg-zinc-900 
      rounded-3xl 
      shadow-2xl border border-gray-200 dark:border-white/10
      animate-in fade-in duration-200
      ${variant === 'modal' ? 'md:w-[400px] p-6 slide-in-from-bottom-10' : 'w-[320px] p-4'}
    `}>
      {/* Modal Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {MONTH_NAMES[currentMonth]} <span className="text-gray-400 font-normal">{currentYear}</span>
        </h2>
        
        {variant === 'modal' ? (
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        ) : (
          <div className="flex gap-1">
             <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
                <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
                <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Month Navigation (Only for modal, for popover we put it in header to save space) */}
      {variant === 'modal' && (
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
      )}

      {/* Days Grid Header */}
      <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                  {day}
              </div>
          ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasMatch = matchTypesForDay(day).length > 0;
              const matchTypes = matchTypesForDay(day);

              return (
                  <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                          relative h-9 w-9 rounded-full flex flex-col items-center justify-center text-sm transition-all
                          ${isSelected 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                              : isToday
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                          }
                      `}
                  >
                      <span>{day.getDate()}</span>
                      
                      {/* Icons for matches */}
                      {!isSelected && hasMatch && (
                          <div className="absolute -bottom-1 flex gap-0.5 scale-75">
                              {matchTypes.includes('basketball') && (
                                  <span>🏀</span>
                              )}
                              {matchTypes.includes('soccer') && (
                                  <span>⚽</span>
                              )}
                          </div>
                      )}
                  </button>
              );
          })}
      </div>
    </div>
  );

  if (variant === 'popover') {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {content}
    </div>
  );
};

export default CalendarModal;