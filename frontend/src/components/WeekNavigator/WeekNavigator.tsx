import React, { useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, getMonday, getTodayDate, isCurrentWeekMonday } from '../../utils/weekDates';
import styles from './WeekNavigator.module.css';

interface WeekNavigatorProps {
  currentDate: string;
  onWeekChange: (date: string) => void;
}

function isCurrentWeek(dateStr: string): boolean {
  return isCurrentWeekMonday(dateStr);
}

function formatWeekLabel(dateStr: string): string {
  if (isCurrentWeek(dateStr)) {
    return 'This Week';
  }
  const monday = getMonday(dateStr);
  const [year, month, day] = monday.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentDate, onWeekChange }) => {
  const isCurrentWk = useMemo(() => isCurrentWeek(currentDate), [currentDate]);
  const label = useMemo(() => formatWeekLabel(currentDate), [currentDate]);

  const handlePrev = useCallback(() => {
    onWeekChange(addDays(currentDate, -7));
  }, [currentDate, onWeekChange]);

  const handleNext = useCallback(() => {
    if (!isCurrentWk) {
      onWeekChange(addDays(currentDate, 7));
    }
  }, [currentDate, isCurrentWk, onWeekChange]);

  return (
    <div className={styles.container} data-testid="week-navigator">
      <button
        className={styles.chevron}
        onClick={handlePrev}
        type="button"
        aria-label="Previous week"
        data-testid="week-nav-prev"
      >
        <ChevronLeft size={16} />
      </button>
      <span className={styles.label}>{label}</span>
      <button
        className={`${styles.chevron} ${isCurrentWk ? styles.disabled : ''}`}
        onClick={handleNext}
        disabled={isCurrentWk}
        type="button"
        aria-label="Next week"
        data-testid="week-nav-next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
