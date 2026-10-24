import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Calendar as CalendarIcon, 
  X, 
  Check, 
  Trash2, 
  Filter,
  MapPin,
  Tag,
  Ship,
  Wheat,
  ShieldCheck,
  Building,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

const FALLBACK_HOLIDAYS = [
  { id: 'HOL-001', name: "Vietnamese New Year (Tết)", date: '2026-01-28', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-002', name: "Republic Day", date: '2026-01-26', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-003', name: "Hùng Kings Festival", date: '2026-04-07', branch: 'Hanoi HQ', type: 'NATIONAL' },
  { id: 'HOL-004', name: "Liberation Day Vietnam", date: '2026-04-30', branch: 'Hanoi HQ', type: 'NATIONAL' },
  { id: 'HOL-005', name: "International Labor Day", date: '2026-05-01', branch: 'ALL', type: 'NATIONAL' },
  { id: 'HOL-006', name: "Independence Day India", date: '2026-08-15', branch: 'Kochi Terminal', type: 'NATIONAL' },
  { id: 'HOL-007', name: "UAE National Day", date: '2026-12-02', branch: 'Dubai Office', type: 'NATIONAL' },
  { id: 'HOL-008', name: "SOILEX Foundation Day", date: '2026-09-01', branch: 'ALL', type: 'COMPANY' },
];

const parseDateParts = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10)
      };
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate()
  };
};

const transformHolidayToEvent = (h) => {
  const parts = parseDateParts(h.date);
  if (!parts) return null;
  const cleanName = (h.name || 'Company Holiday').replace(/^🎉\s*Holiday:\s*/i, '').replace(/^🎉\s*/, '');
  return {
    id: h.id ? (String(h.id).startsWith('HOL-') ? h.id : `HOL-${h.id}`) : `HOL-${parts.year}-${parts.month}-${parts.day}`,
    title: `🎉 ${cleanName}`,
    rawTitle: cleanName,
    day: parts.day,
    month: parts.month,
    year: parts.year,
    dateStr: h.date,
    time: 'All Day',
    category: 'Holiday',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    tagColor: '#059669',
    location: (!h.branch || h.branch === 'ALL') ? 'All Facilities & Offices' : h.branch,
    description: `Official Corporate Holiday (${h.type || 'NATIONAL'}) for ${(!h.branch || h.branch === 'ALL') ? 'ALL' : h.branch} branch. Non-working day across company operations.`,
    isHoliday: true,
    holidayType: h.type || 'NATIONAL',
    _fromBackend: true,
  };
};

export default function RealtimeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 5)); // September 5, 2026 (Local Context)
  const [todayDate] = useState(new Date(2026, 8, 5)); // Today reference
  const [liveTime, setLiveTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('MONTH'); // 'MONTH' | 'WEEK' | 'DAY'
  const [selectedDay, setSelectedDay] = useState(5);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form state for adding new events
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2026-09-05',
    time: '10:00 AM',
    category: 'Shipment',
    location: 'Port of Nhava Sheva / Lab',
    description: ''
  });

  // Preloaded realistic SOILEX Life Science trade & operations events
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Container Loading (12 FCL Anise Cigar)',
      day: 2,
      month: 8,
      year: 2026,
      time: '09:00 AM',
      category: 'Shipment',
      color: 'bg-blue-100 text-[#1E40AF] border-blue-200',
      tagColor: '#1E40AF',
      location: 'Warehouse Dock 4',
      description: 'Loading 12 containers destined for Hamburg port. Temperature controlled.'
    },
    {
      id: 2,
      title: 'ISO 22000 & HACCP Audit Inspection',
      day: 5,
      month: 8,
      year: 2026,
      time: '11:30 AM',
      category: 'Compliance',
      color: 'bg-amber-100 text-[#B45309] border-amber-200',
      tagColor: '#D97706',
      location: 'Bio-Hub QA Lab',
      description: 'Annual certification review by international inspection body.'
    },
    {
      id: 3,
      title: 'BOG Quarterly Sales Signoff',
      day: 9,
      month: 8,
      year: 2026,
      time: '02:00 PM',
      category: 'Meeting',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      tagColor: '#6B21A8',
      location: 'Executive Boardroom',
      description: 'Review Q3 commercial contracts and approval for 6 pending trade orders.'
    },
    {
      id: 4,
      title: 'Perfumed Rice DT 8 Quality Sampling',
      day: 14,
      month: 8,
      year: 2026,
      time: '10:00 AM',
      category: 'Agro',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      tagColor: '#15803D',
      location: 'Milling & Testing Center',
      description: 'Moisture and aroma testing before bulk bagging.'
    },
    {
      id: 5,
      title: 'Black Pepper Grade A Dispatch',
      day: 18,
      month: 8,
      year: 2026,
      time: '03:30 PM',
      category: 'Shipment',
      color: 'bg-blue-100 text-[#1E40AF] border-blue-200',
      tagColor: '#1E40AF',
      location: 'Export Terminal',
      description: 'Consignment SOLEX-EXP-001 departure for Los Angeles.'
    },
    {
      id: 6,
      title: 'Supplier Negotiation - Darjeeling Tea',
      day: 23,
      month: 8,
      year: 2026,
      time: '04:00 PM',
      category: 'Procurement',
      color: 'bg-amber-100 text-[#B45309] border-amber-200',
      tagColor: '#D97706',
      location: 'Virtual Conference',
      description: 'Contract terms renewal with Nilgiris & Dooars plantation consortium.'
    }
  ]);

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch calendar events and holidays from backend + localStorage
  const loadAllEventsAndHolidays = useCallback(async () => {
    try {
      const [calendarData, holidaysData] = await Promise.all([
        api.getCalendarEvents().catch(() => []),
        api.getHolidays().catch(() => [])
      ]);

      // Also read localStorage holidays
      let localHolidays = [];
      try {
        const stored = localStorage.getItem('soilex_holidays');
        if (stored) {
          localHolidays = JSON.parse(stored);
        }
      } catch (err) {}

      // Combine holidays from backend and local
      const allHolidays = [...(Array.isArray(holidaysData) && holidaysData.length > 0 ? holidaysData : FALLBACK_HOLIDAYS)];
      if (Array.isArray(localHolidays)) {
        localHolidays.forEach(lh => {
          if (!allHolidays.some(h => h.id === lh.id || (h.name === lh.name && h.date === lh.date))) {
            allHolidays.push(lh);
          }
        });
      }

      const CATEGORY_STYLES = {
        'SHIPMENT': { color: 'bg-blue-100 text-[#1E40AF] border-blue-200', tagColor: '#1E40AF' },
        'INSPECTION': { color: 'bg-amber-100 text-[#B45309] border-amber-200', tagColor: '#D97706' },
        'MEETING': { color: 'bg-purple-100 text-purple-800 border-purple-200', tagColor: '#6B21A8' },
        'TRAINING': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', tagColor: '#15803D' },
        'HOLIDAY': { color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', tagColor: '#059669' },
      };

      const backendEvents = (Array.isArray(calendarData) ? calendarData : []).map(ev => {
        const parts = parseDateParts(ev.start_time);
        const isHol = ev.event_type === 'HOLIDAY' || (ev.title && ev.title.includes('Holiday'));
        const styles = CATEGORY_STYLES[ev.event_type] || (isHol ? CATEGORY_STYLES['HOLIDAY'] : CATEGORY_STYLES['MEETING']);
        return {
          id: ev.id,
          title: ev.title,
          day: parts ? parts.day : 1,
          month: parts ? parts.month : 8,
          year: parts ? parts.year : 2026,
          dateStr: ev.start_time ? ev.start_time.slice(0, 10) : '',
          time: isHol ? 'All Day' : (parts ? '10:00 AM' : '10:00 AM'),
          category: isHol ? 'Holiday' : ev.event_type === 'SHIPMENT' ? 'Shipment' : ev.event_type === 'INSPECTION' ? 'Compliance' : ev.event_type === 'TRAINING' ? 'Agro' : 'Meeting',
          location: ev.location || '',
          description: ev.description || '',
          ...styles,
          isHoliday: isHol,
          _fromBackend: true,
        };
      });

      // Holiday events
      const holidayEvents = allHolidays
        .map(transformHolidayToEvent)
        .filter(Boolean);

      setEvents(prev => {
        const baseStatic = prev.filter(e => !e._fromBackend);
        const merged = [...baseStatic];
        const seen = new Set();

        baseStatic.forEach(e => {
          seen.add(`${e.title}-${e.day}-${e.month}-${e.year}`);
          seen.add(String(e.id));
        });

        backendEvents.forEach(e => {
          const key = `${e.title}-${e.day}-${e.month}-${e.year}`;
          if (!seen.has(key) && !seen.has(String(e.id))) {
            merged.push(e);
            seen.add(key);
            seen.add(String(e.id));
          }
        });

        holidayEvents.forEach(e => {
          const key = `${e.title}-${e.day}-${e.month}-${e.year}`;
          const rawKey = `🎉 Holiday: ${e.rawTitle}-${e.day}-${e.month}-${e.year}`;
          if (!seen.has(key) && !seen.has(rawKey) && !seen.has(String(e.id))) {
            merged.push(e);
            seen.add(key);
            seen.add(rawKey);
            seen.add(String(e.id));
          }
        });

        return merged;
      });
    } catch (e) {
      console.warn('Error loading calendar events:', e);
    }
  }, []);

  useEffect(() => {
    loadAllEventsAndHolidays();

    const handleHolidayAdded = (e) => {
      if (e.detail) {
        const holEvent = transformHolidayToEvent(e.detail);
        if (holEvent) {
          setEvents(prev => {
            if (prev.some(x => x.id === holEvent.id || (x.day === holEvent.day && x.month === holEvent.month && x.year === holEvent.year && (x.title === holEvent.title || x.rawTitle === holEvent.rawTitle)))) {
              return prev;
            }
            return [...prev, holEvent];
          });
        }
      }
      loadAllEventsAndHolidays();
    };

    window.addEventListener('soilex-holiday-added', handleHolidayAdded);
    window.addEventListener('storage', handleHolidayAdded);

    return () => {
      window.removeEventListener('soilex-holiday-added', handleHolidayAdded);
      window.removeEventListener('storage', handleHolidayAdded);
    };
  }, [loadAllEventsAndHolidays]);

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 5));
    setSelectedDay(5);
  };

  // Days calculations
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Create grid cells (42 cells: 6 weeks x 7 days)
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPrev: true
    });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const isToday = 
      day === todayDate.getDate() && 
      currentMonth === todayDate.getMonth() && 
      currentYear === todayDate.getFullYear();

    const isSelected = day === selectedDay;

    calendarCells.push({
      dayNumber: day,
      isCurrentMonth: true,
      isToday,
      isSelected
    });
  }

  // Next month leading days
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      dayNumber: i,
      isCurrentMonth: false,
      isNext: true
    });
  }

  // Filtered and computed events
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'ALL') return events;
    if (categoryFilter === 'Holiday') return events.filter(e => e.isHoliday || e.category === 'Holiday');
    return events.filter(e => (e.category || '').toLowerCase() === categoryFilter.toLowerCase());
  }, [events, categoryFilter]);

  const upcomingHolidays = useMemo(() => {
    return events
      .filter(e => e.isHoliday || e.category === 'Holiday')
      .sort((a, b) => {
        const da = new Date(a.year, a.month, a.day);
        const db = new Date(b.year, b.month, b.day);
        return da - db;
      });
  }, [events]);

  const nextHoliday = useMemo(() => {
    const todayNum = todayDate.getFullYear() * 10000 + (todayDate.getMonth() + 1) * 100 + todayDate.getDate();
    const futureHols = upcomingHolidays.filter(h => {
      const hNum = h.year * 10000 + (h.month + 1) * 100 + h.day;
      return hNum >= todayNum;
    });
    return futureHols[0] || upcomingHolidays[0] || null;
  }, [upcomingHolidays, todayDate]);

  // Handle adding an event (including corporate holidays)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const parts = parseDateParts(newEvent.date);
    const day = parts ? parts.day : selectedDay;
    const month = parts ? parts.month : currentMonth;
    const year = parts ? parts.year : currentYear;

    const isHolidayCategory = newEvent.category === 'Holiday';
    const cleanTitle = newEvent.title.replace(/^🎉\s*Holiday:\s*/i, '').replace(/^🎉\s*/, '');
    const displayTitle = isHolidayCategory ? `🎉 ${cleanTitle}` : newEvent.title;

    const created = {
      id: Date.now(),
      title: displayTitle,
      rawTitle: cleanTitle,
      day,
      month,
      year,
      dateStr: newEvent.date,
      time: isHolidayCategory ? 'All Day' : newEvent.time,
      category: newEvent.category,
      location: newEvent.location || 'All Corporate Facilities',
      description: newEvent.description || (isHolidayCategory ? 'Official Corporate Holiday for all staff and plant personnel.' : ''),
      color: 
        isHolidayCategory ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' :
        newEvent.category === 'Shipment' ? 'bg-blue-100 text-[#1E40AF] border-blue-200' :
        newEvent.category === 'Compliance' ? 'bg-amber-100 text-[#B45309] border-amber-200' :
        newEvent.category === 'Agro' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
        'bg-purple-100 text-purple-800 border-purple-200',
      tagColor:
        isHolidayCategory ? '#059669' :
        newEvent.category === 'Shipment' ? '#1E40AF' :
        newEvent.category === 'Compliance' ? '#D97706' :
        newEvent.category === 'Agro' ? '#15803D' : '#6B21A8',
      isHoliday: isHolidayCategory,
      holidayType: 'NATIONAL',
      _fromBackend: true
    };

    if (isHolidayCategory) {
      try {
        const holRes = await api._request('POST', '/attendance/holidays', {
          name: cleanTitle,
          date: newEvent.date,
          branch: newEvent.location || 'ALL',
          type: 'NATIONAL'
        });
        if (holRes && holRes.data) {
          created.id = holRes.data.id;
        }
        // Save to localStorage soilex_holidays
        const stored = JSON.parse(localStorage.getItem('soilex_holidays') || '[]');
        stored.push({
          id: created.id,
          name: cleanTitle,
          date: newEvent.date,
          branch: newEvent.location || 'ALL',
          type: 'NATIONAL'
        });
        localStorage.setItem('soilex_holidays', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('soilex-holiday-added', { detail: created }));
      } catch (err) {}
    } else {
      const eventTypeMap = { 'Shipment': 'SHIPMENT', 'Compliance': 'INSPECTION', 'Agro': 'TRAINING', 'Meeting': 'MEETING', 'Procurement': 'MEETING' };
      const result = await api.createCalendarEvent({
        title: newEvent.title,
        event_type: eventTypeMap[newEvent.category] || 'MEETING',
        start_time: `${newEvent.date}T${newEvent.time.replace(' AM', ':00').replace(' PM', ':00')}`,
        end_time: `${newEvent.date}T${newEvent.time.replace(' AM', ':00').replace(' PM', ':00')}`,
        location: newEvent.location || 'SOILEX Bio-Hub',
        description: newEvent.description || '',
      });
      if (result) {
        created.id = result.id;
      }
    }

    setEvents(prev => [...prev, created]);
    setNewEvent({
      title: '',
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
      time: '10:00 AM',
      category: 'Shipment',
      location: 'Bio-Hub',
      description: ''
    });
    setShowAddModal(false);
  };

  const handleDeleteEvent = async (id) => {
    const ev = events.find(e => e.id === id);
    if (ev) {
      if (ev.isHoliday) {
        try {
          const rawId = String(ev.id).replace('HOL-', '').replace('EVT-', '');
          await api._request('DELETE', `/attendance/holidays/${rawId}`).catch(() => {});
          const stored = JSON.parse(localStorage.getItem('soilex_holidays') || '[]');
          const updated = stored.filter(h => h.id !== ev.id && h.id !== rawId && h.name !== ev.rawTitle);
          localStorage.setItem('soilex_holidays', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('soilex-holiday-added', { detail: { deletedId: ev.id } }));
        } catch (err) {}
      }
      if (ev._fromBackend) {
        await api.deleteCalendarEvent(id).catch(() => {});
      }
    }
    setEvents(events.filter(ev => ev.id !== id));
    setSelectedEvent(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Real-time Sub-Header Banner */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Real-Time Scientific & Logistics Calendar</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-[#B45309] border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
                <span>Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Coordinated shipping windows, QA testing, customs clearances, and executive board reviews.
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Quick Add Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 shadow-inner">
            <Clock className="w-4 h-4 text-[#1E40AF]" />
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-800">
                {liveTime.toLocaleTimeString()}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {liveTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setNewEvent(prev => ({
                ...prev,
                date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
              }));
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-[#FDE68A]" />
            <span>ADD EVENT</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills & Live Metric Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'Holiday', label: '🎉 Holidays', count: events.filter(e => e.isHoliday || e.category === 'Holiday').length },
            { id: 'Shipment', label: 'Shipments', count: events.filter(e => e.category === 'Shipment').length },
            { id: 'Compliance', label: 'Compliance & Audits', count: events.filter(e => e.category === 'Compliance').length },
            { id: 'Meeting', label: 'Meetings', count: events.filter(e => e.category === 'Meeting').length },
            { id: 'Agro', label: 'Agro & QA', count: events.filter(e => e.category === 'Agro').length },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1.5 ${
                categoryFilter === cat.id
                  ? 'bg-[#1E40AF] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-[#E2E8F0]'
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  categoryFilter === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span>🎉</span>
          <span>{events.filter(e => e.isHoliday || e.category === 'Holiday').length} Official Company Holidays Scheduled</span>
        </div>
      </div>

      {/* Main Calendar Container (Replicating CALENDER.png structure) */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
        {/* Header Bar matching CALENDER.png dark bar with navy/slate gradient */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
          {/* Left Controls: Arrows & TODAY */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button 
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={handleToday}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              TODAY
            </button>
          </div>

          {/* Center Title: MONTH YEAR */}
          <div className="text-base sm:text-lg font-black tracking-widest text-center uppercase">
            {monthNames[currentMonth]} {currentYear}
          </div>

          {/* Right View Switcher: MONTH / WEEK / DAY */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded border border-slate-700 text-xs font-bold">
            {['MONTH', 'WEEK', 'DAY'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded transition-all ${
                  viewMode === mode
                    ? 'bg-[#1E40AF] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View Container */}
        {viewMode === 'MONTH' ? (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#FAFAFA] text-center text-xs font-bold text-slate-600 py-2.5 uppercase tracking-wider">
              {daysOfWeek.map((dayName, idx) => (
                <div key={idx} className={idx === 0 || idx === 6 ? 'text-slate-400' : ''}>
                  {dayName}
                </div>
              ))}
            </div>

            {/* Month Days Grid (6 rows of 7 days) */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#E2E8F0] bg-white">
              {calendarCells.map((cell, idx) => {
                const cellEvents = cell.isCurrentMonth
                  ? filteredEvents.filter(e => e.day === cell.dayNumber && e.month === currentMonth && e.year === currentYear)
                  : [];

                const hasHoliday = cellEvents.some(e => e.isHoliday || e.category === 'Holiday');
                const isSelectedOrToday = (cell.isToday || cell.isSelected) && cell.isCurrentMonth;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setSelectedDay(cell.dayNumber);
                      }
                    }}
                    className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                      !cell.isCurrentMonth ? 'bg-slate-50/50 text-slate-300' :
                      hasHoliday ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/80' :
                      isSelectedOrToday ? 'bg-[#FEFCE8]' : 'hover:bg-blue-50/20'
                    }`}
                  >
                    {/* Day Number in top-right corner with Holiday / Today badge */}
                    <div className="flex items-center justify-between">
                      {hasHoliday ? (
                        <span className="text-[11px] font-black" title="Corporate Holiday">🎉</span>
                      ) : cell.isToday ? (
                        <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                      ) : <span />}
                      <span className={`ml-auto text-xs font-bold ${
                        !cell.isCurrentMonth ? 'text-slate-300' :
                        cell.isToday ? 'text-[#1E40AF] bg-blue-100 px-1.5 py-0.5 rounded' :
                        hasHoliday ? 'text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded font-black' :
                        'text-slate-700'
                      }`}>
                        {cell.dayNumber}
                      </span>
                    </div>

                    {/* Events in cell */}
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {cellEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded truncate border flex items-center space-x-1 ${ev.color} hover:opacity-90 transition-opacity`}
                          title={`${ev.time} - ${ev.title}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.tagColor }}></span>
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                      {cellEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1 block">
                          +{cellEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'WEEK' ? (
          /* WEEK VIEW */
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-7 gap-3">
              {daysOfWeek.map((day, dIdx) => {
                const dayNum = selectedDay - (new Date(currentYear, currentMonth, selectedDay).getDay() - dIdx);
                const dayEvents = filteredEvents.filter(e => e.day === dayNum && e.month === currentMonth && e.year === currentYear);
                const hasHoliday = dayEvents.some(e => e.isHoliday || e.category === 'Holiday');
                return (
                  <div key={dIdx} className={`rounded-lg border p-3 flex flex-col min-h-[360px] ${hasHoliday ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-[#E2E8F0]'}`}>
                    <div className="text-center pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">{day}</span>
                      <span className={`text-base font-black ${hasHoliday ? 'text-emerald-800' : 'text-slate-900'}`}>{dayNum > 0 ? dayNum : '-'}</span>
                      {hasHoliday && <span>🎉</span>}
                    </div>
                    <div className="mt-3 space-y-2 flex-1">
                      {dayEvents.map(ev => (
                        <div 
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`p-2 rounded text-xs font-medium border cursor-pointer ${ev.color}`}
                        >
                          <p className="font-bold text-[11px] truncate">{ev.title}</p>
                          <span className="text-[10px] opacity-80 mt-1 block">{ev.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* DAY VIEW */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Agenda for {monthNames[currentMonth]} {selectedDay}, {currentYear}
                </h3>
                <p className="text-xs text-slate-500">Scheduled operations, inspections, and consignments.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-[#1E40AF] text-white text-xs font-bold rounded shadow-sm hover:bg-blue-800"
              >
                + Schedule Task
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredEvents.filter(e => e.day === selectedDay && e.month === currentMonth && e.year === currentYear).length > 0 ? (
                filteredEvents
                  .filter(e => e.day === selectedDay && e.month === currentMonth && e.year === currentYear)
                  .map(ev => (
                    <div key={ev.id} className="py-4 flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-16 text-xs font-mono font-bold text-[#1E40AF] pt-1">
                          {ev.time}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                            {ev.isHoliday && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Official Holiday
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{ev.description}</p>
                          <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{ev.location}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded font-semibold ${ev.color}`}>
                              {ev.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No events or trade shipments scheduled for this date.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Event Summary Cards - 4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
              <span>🎉</span>
              <span>NEXT COMPANY HOLIDAY</span>
            </span>
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              {nextHoliday ? nextHoliday.holidayType || 'NATIONAL' : 'OFFICIAL'}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900 mt-2 truncate">
            {nextHoliday ? nextHoliday.title : 'No upcoming holidays'}
          </p>
          <span className="text-[11px] font-semibold text-emerald-700 block truncate">
            {nextHoliday ? `${nextHoliday.dateStr || ''} • ${nextHoliday.location} (All Staff)` : 'Regular company operations'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">NEXT SHIPMENT DISPATCH</span>
            <Ship className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2">Sep 18 • Black Pepper 12 FCL</p>
          <span className="text-[11px] font-semibold text-[#1E40AF]">Departure to Port of Los Angeles</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">QUALITY AUDIT</span>
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2">Sep 5 • ISO 22000 Inspection</p>
          <span className="text-[11px] font-semibold text-[#D97706]">FSSAI certified microbiology lab</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">AGRO BATCH SAMPLING</span>
            <Wheat className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2">Sep 14 • Perfumed Rice DT 8</p>
          <span className="text-[11px] font-semibold text-emerald-700">Aroma & moisture inspection</span>
        </div>
      </div>

      {/* Add Event Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">Schedule Event or Add Holiday</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event / Holiday Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Diwali Festival / ISO Audit / Container Loading"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input 
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time</label>
                  <input 
                    type="text"
                    disabled={newEvent.category === 'Holiday'}
                    value={newEvent.category === 'Holiday' ? 'All Day' : newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select 
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    <option value="Holiday">🎉 Official Company Holiday</option>
                    <option value="Shipment">Shipment / Freight</option>
                    <option value="Compliance">Quality & Compliance</option>
                    <option value="Agro">Agro & Spices Sampling</option>
                    <option value="Meeting">Executive Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch / Location</label>
                  <input 
                    type="text"
                    placeholder="ALL / Hanoi HQ / Kochi Terminal"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea 
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Official notice, branch applicability, or instructions..."
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 focus:outline-none focus:border-[#1E40AF] font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-md text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E40AF] text-white rounded-md font-semibold hover:bg-blue-800 shadow-sm"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${selectedEvent.color}`}>
                    {selectedEvent.category}
                  </span>
                  {selectedEvent.isHoliday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Corporate Paid Holiday
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedEvent.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4 text-[#1E40AF]" />
                <span className="font-semibold">{selectedEvent.time} • Day {selectedEvent.day} {monthNames[selectedEvent.month]} {selectedEvent.year}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <MapPin className="w-4 h-4 text-[#D97706]" />
                <span>{selectedEvent.location}</span>
              </div>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                {selectedEvent.description || (selectedEvent.isHoliday ? 'Official company-wide non-working day for all staff members.' : 'No additional remarks provided.')}
              </p>
              {selectedEvent.isHoliday && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Applies to all employees across designated facilities. Does not deduct from personal leave quota.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedEvent.isHoliday ? 'Holiday' : 'Event'}</span>
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
