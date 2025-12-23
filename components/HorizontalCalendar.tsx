import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, isSameDay } from '../utils';
import { Match } from '../types';

interface HorizontalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  matches: Match[]; // For dots
  calendarEntries?: { date: Date; sport: 'basketball' | 'soccer'; leagueId: string }[];
}

const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({
  selectedDate,
  onSelectDate,
  matches,
  calendarEntries
}) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  // Get all days for the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, currentMonth, i + 1));

  const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const matchTypesForDay = (day: Date) => {
    const types = new Set<string>();
    if (calendarEntries && calendarEntries.length > 0) {
      calendarEntries.forEach(c => {
        if (isSameDay(c.date, day)) types.add(c.sport);
      });
    } else {
      matches.forEach(m => {
        if (isSameDay(m.startTime, day)) types.add('soccer'); 
      });
    }
    return Array.from(types);
  };

  // Auto scroll to selected date on mount/change
  useEffect(() => {
    if (scrollRef.current) {
        const selectedBtn = scrollRef.current.querySelector('[data-selected="true"]');
        if (selectedBtn) {
            selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [selectedDate, viewDate]);

  return (
    <div className="relative w-full group">
       {/* Left Arrow (Prev Month) */}
       <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center pl-0 bg-gradient-to-r from-[#F0EEE9] via-[#F0EEE9]/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 w-16">
          <button 
              onClick={prevMonth} 
              className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all hover:scale-105 active:scale-95"
              title="Previous Month"
          >
              <ChevronLeft size={20} />
          </button>
       </div>

       {/* Right Arrow (Next Month) */}
       <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center pr-0 bg-gradient-to-l from-[#F0EEE9] via-[#F0EEE9]/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 w-16">
          <button 
              onClick={nextMonth} 
              className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all hover:scale-105 active:scale-95"
              title="Next Month"
          >
              <ChevronRight size={20} />
          </button>
       </div>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-2 px-16 scrollbar-hide w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Month Label as first item? Or just part of the flow? 
            Let's keep it clean: The days are listed. Maybe we show the Month Name at the start? 
            Or just rely on the date. Let's put a sticky label or just the days. 
            User said "calendar component", usually implies knowing the month.
            I'll insert a "Month Label" at the start of the list.
        */}
        <div className="flex flex-col items-center justify-center min-w-[80px] h-[72px] shrink-0 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest border-r border-gray-200 dark:border-white/10 mr-2">
            <span className="text-lg text-gray-900 dark:text-white">{MONTH_NAMES[currentMonth].substring(0, 3)}</span>
            <span>{currentYear}</span>
        </div>

        {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayTypes = matchTypesForDay(day);
            const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });

            return (
                <button
                    key={day.toISOString()}
                    data-selected={isSelected}
                    onClick={() => onSelectDate(day)}
                    className={`
                        relative group flex flex-col items-center justify-center min-w-[60px] h-[72px] shrink-0 rounded-xl transition-all duration-300 overflow-hidden
                        ${isSelected 
                            ? 'text-white shadow-lg shadow-blue-500/30' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                        }
                    `}
                >
                     {/* Active Background (Liquid style from LeagueNav) */}
                    {isSelected && (
                        <div className="absolute inset-0 bg-blue-600 dark:bg-blue-600 opacity-100" />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center">
                        <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-blue-100' : 'opacity-60'}`}>
                            {dayName}
                        </span>
                        <span className={`text-xl font-bold ${isSelected ? 'text-white' : ''}`}>
                            {day.getDate()}
                        </span>
                        
                        {/* Dots */}
                        <div className="flex gap-0.5 mt-1 h-1">
                            {dayTypes.map((type, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : type === 'basketball' ? 'bg-orange-500' : 'bg-green-500'}`}
                                />
                            ))}
                        </div>
                    </div>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default HorizontalCalendar;
