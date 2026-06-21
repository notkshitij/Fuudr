import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

const parseTime24 = (value) => {
  if (!value) return null;
  const [h24, m] = value.split(':').map(Number);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = String(h24 % 12 || 12);
  const minute = MINUTES.includes(String(m).padStart(2, '0'))
    ? String(m).padStart(2, '0')
    : MINUTES.reduce((closest, option) =>
        Math.abs(Number(option) - m) < Math.abs(Number(closest) - m) ? option : closest
      );
  return { hour: hour12, minute, period };
};

const toTime24 = (hour, minute, period) => {
  if (!hour || !minute || !period) return '';
  let h = parseInt(hour, 10);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

const formatDisplay = (hour, minute, period) => {
  if (!hour || !minute || !period) return '';
  return `${hour}:${minute} ${period}`;
};

const triggerClasses =
  'w-full min-h-[42px] py-2 px-3 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-900 text-base font-semibold transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer flex items-center justify-between gap-1';

const TimeDropdown = ({
  value,
  placeholder,
  options,
  onSelect,
  isOpen,
  onToggle,
  scrollable = false,
  panelMinWidth = '100%',
}) => {
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) && isOpen) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!isOpen || !listRef.current || !value) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'center' });
  }, [isOpen, value]);

  return (
    <div ref={ref} className="relative flex-1 min-w-[60px]">
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className={`${triggerClasses} ${isOpen ? 'border-orange-500 bg-white' : 'hover:border-slate-300 hover:bg-white'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400 font-medium'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-500' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-[100] top-[calc(100%+4px)] left-0 bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden"
          style={{ minWidth: panelMinWidth, width: 'max(100%, 100px)' }}
        >
          <div
            ref={listRef}
            role="listbox"
            className={`py-1 ${scrollable ? 'max-h-[160px] overflow-y-auto overscroll-contain time-picker-scroll' : ''}`}
          >
            {options.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => {
                    onSelect(option);
                    onToggle(false);
                  }}
                  className={`w-full px-3 py-2 text-center text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SimpleTimePicker = ({ value, onChange, label, defaultPeriod = 'AM' }) => {
  const parsed = parseTime24(value);
  const [hour, setHour] = useState(parsed?.hour || '');
  const [minute, setMinute] = useState(parsed?.minute || '');
  const [period, setPeriod] = useState(parsed?.period || defaultPeriod);
  const [openField, setOpenField] = useState(null);

  useEffect(() => {
    const next = parseTime24(value);
    if (next) {
      setHour(next.hour);
      setMinute(next.minute);
      setPeriod(next.period);
    } else if (!value) {
      setHour('');
      setMinute('');
      setPeriod(defaultPeriod);
    }
  }, [value, defaultPeriod]);

  const setFieldOpen = (field) => (open) => {
    setOpenField(open ? field : null);
  };

  const emitIfReady = (h, m, p) => {
    if (h && m && p) onChange(toTime24(h, m, p));
  };

  const handleHour = (h) => {
    setHour(h);
    emitIfReady(h, minute, period);
  };

  const handleMinute = (m) => {
    setMinute(m);
    emitIfReady(hour, m, period);
  };

  const handlePeriod = (p) => {
    setPeriod(p);
    emitIfReady(hour, minute, p);
  };

  const isComplete = hour && minute && period;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      {label && (
        <label className="block text-xs font-bold mb-3 text-slate-700 uppercase tracking-wide">{label}</label>
      )}

      <div className="flex items-stretch gap-2">
        <div className="flex items-center justify-center w-9 shrink-0 rounded-lg bg-orange-50">
          <Clock className="text-orange-500" size={18} />
        </div>

        <TimeDropdown
          value={hour}
          placeholder="Hour"
          options={HOURS}
          onSelect={handleHour}
          isOpen={openField === 'hour'}
          onToggle={setFieldOpen('hour')}
          scrollable
          panelMinWidth="100px"
        />

        <span className="flex items-center text-slate-400 font-bold text-base">:</span>

        <TimeDropdown
          value={minute}
          placeholder="Min"
          options={MINUTES}
          onSelect={handleMinute}
          isOpen={openField === 'minute'}
          onToggle={setFieldOpen('minute')}
          panelMinWidth="100px"
        />

        <TimeDropdown
          value={period}
          placeholder="AM/PM"
          options={PERIODS}
          onSelect={handlePeriod}
          isOpen={openField === 'period'}
          onToggle={setFieldOpen('period')}
          panelMinWidth="110px"
        />
      </div>

      {isComplete && (
        <p className="mt-3 text-xs font-semibold text-orange-600 text-center">
          {formatDisplay(hour, minute, period)}
        </p>
      )}

      <style>{`
        .time-picker-scroll {
          scrollbar-width: thin;
          scrollbar-color: #fb923c #f1f5f9;
        }
        .time-picker-scroll::-webkit-scrollbar { width: 6px; }
        .time-picker-scroll::-webkit-scrollbar-track { background: #f8fafc; }
        .time-picker-scroll::-webkit-scrollbar-thumb { background: #fb923c; border-radius: 6px; }
      `}</style>
    </div>
  );
};

export default SimpleTimePicker;
