import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, RefreshCw, Trash2, ChevronRight, ChevronLeft, Link as LinkIcon, Info, Clock, MapPin, BookOpen, AlertCircle, CalendarX } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useCalendarStore } from '@/stores/calendarStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function CalendarPage() {
  const { theme } = useTheme()
  const { icalUrl, events, isLoading, error, setIcalUrl, fetchCalendar, clearEvents } = useCalendarStore()
  const [urlInput, setUrlInput] = useState(icalUrl)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  useEffect(() => {
    if (icalUrl && events.length === 0 && !isLoading) {
      fetchCalendar()
    }
  }, [icalUrl, events.length, isLoading, fetchCalendar])

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (urlInput.trim()) {
      setIcalUrl(urlInput.trim())
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    )
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  if (!icalUrl) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mt-12 px-6">
        <div className="p-8 rounded-3xl backdrop-blur-[20px] shadow-2xl border"
          style={{ backgroundColor: theme.colors.surface + '70', borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}>
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>مزامنة تقويم Blackboard</h1>
              <p style={{ color: theme.colors.textMuted }}>ابقَ على اطلاع بمواعيد التسليم والاختبارات</p>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold block" style={{ color: theme.colors.text }}>رابط التقويم الخارجي (ICAL)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textMuted }} />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://lms.uqu.edu.sa/..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all border"
                  style={{ 
                    backgroundColor: theme.colors.bg + '50', 
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={!urlInput.trim() || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            >
              {isLoading ? <RefreshCw className="w-6 h-6 animate-spin mx-auto" /> : 'ربط التقويم'}
            </motion.button>
          </form>

          <div className="mt-8 p-6 rounded-2xl space-y-4 backdrop-blur-[20px]" style={{ backgroundColor: theme.colors.bg + '40', border: `1px dashed ${theme.colors.border}` }}>
            <div className="flex items-center gap-2 font-bold" style={{ color: theme.colors.accent }}>
              <Info className="w-5 h-5" />
              <span>كيف أحصل على الرابط؟</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
              <li>ادخل على Blackboard جامعة أم القرى.</li>
              <li>انتقل إلى صفحة "التقويم" (Calendar).</li>
              <li>اضغط على "الحصول على رابط تقويم خارجي" (Get External Calendar Link).</li>
              <li>قم بنسخ الرابط ولصقه هنا.</li>
            </ol>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-6 rounded-2xl backdrop-blur-[20px] border"
        style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>التقويم الأكاديمي</h1>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>مزامنة حية مع Blackboard</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchCalendar()}
            disabled={isLoading}
            className="p-3 rounded-xl transition-all hover:bg-white/10"
            style={{ color: theme.colors.text, backgroundColor: theme.colors.bg + '40' }}
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if(confirm('هل تريد فصل التقويم؟')) clearEvents() }}
            className="p-3 rounded-xl transition-all hover:bg-red-500/10 text-red-400"
            style={{ backgroundColor: theme.colors.bg + '40' }}
            title="فصل التقويم"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl flex items-center gap-3 border backdrop-blur-[20px]"
            style={{ backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error + '30', color: theme.colors.error }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">{error}</span>
            <button onClick={() => fetchCalendar()} className="underline mr-auto text-xs font-bold" style={{ color: theme.colors.accent }}>إعادة المحاولة</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 flex flex-col rounded-2xl backdrop-blur-[20px] border overflow-hidden"
          style={{ backgroundColor: theme.colors.surface + '40', borderColor: theme.colors.border }}>
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
              {currentMonth.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={handlePrevMonth}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                style={{ color: theme.colors.text, backgroundColor: theme.colors.bg + '40' }}>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={handleNextMonth}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                style={{ color: theme.colors.text, backgroundColor: theme.colors.bg + '40' }}>
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.border + '30' }}>
              {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
                <div key={day} className="p-2 sm:p-4 text-center text-xs sm:text-sm font-bold" style={{ backgroundColor: theme.colors.surface + '60', color: theme.colors.textMuted }}>
                  {day}
                </div>
              ))}
              {calendarDays.map((date, idx) => {
                const isSelected = selectedDate && date && 
                                  date.getDate() === selectedDate.getDate() && 
                                  date.getMonth() === selectedDate.getMonth();
                const dayEvents = date ? getEventsForDate(date) : [];
                const hasEvents = dayEvents.length > 0;
                const isToday = date && new Date().toDateString() === date.toDateString();

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.008 }}
                    onClick={() => date && setSelectedDate(date)}
                    className={`min-h-[55px] sm:min-h-[100px] p-1.5 transition-all cursor-pointer relative flex flex-col items-center justify-between rounded-xl`}
                    style={{ 
                      backgroundColor: isSelected ? `${theme.colors.accent}10` : 'transparent',
                      color: date ? theme.colors.text : 'transparent'
                    }}
                  >
                    {date && (
                      <>
                        <span className={`text-xs sm:text-sm font-extrabold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-transform ${isSelected ? 'scale-110' : ''}`}
                              style={{
                                backgroundColor: isToday ? theme.colors.accent : isSelected ? `${theme.colors.accent}25` : 'transparent',
                                color: isToday ? '#000' : isSelected ? theme.colors.accent : theme.colors.text,
                                border: isToday ? `1px solid ${theme.colors.accent}` : 'none',
                                boxShadow: isToday ? `0 0 10px ${theme.colors.accent}40` : 'none',
                              }}>
                          {date.getDate()}
                        </span>
                        
                        {/* Desktop Event list */}
                        {hasEvents && (
                          <div className="mt-2 space-y-1 hidden sm:block w-full">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div key={ev.id} className="text-[10px] px-1.5 py-0.5 rounded border truncate" style={{ backgroundColor: theme.colors.accent + '12', borderColor: theme.colors.accent + '20', color: theme.colors.accent }}>
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[9px] text-center font-bold" style={{ color: theme.colors.accent }}>
                                + {dayEvents.length - 2} المزيد
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Mobile Event dots */}
                        {hasEvents && (
                          <div className="pb-1 sm:hidden">
                             <span className="w-1.2 h-1.2 rounded-full block" style={{ backgroundColor: isToday ? '#000' : theme.colors.accent, boxShadow: `0 0 4px ${theme.colors.accent}` }} />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Side Panel */}
        <div className="flex flex-col gap-6 lg:h-full min-h-0">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col rounded-2xl backdrop-blur-[20px] border overflow-hidden"
            style={{ backgroundColor: theme.colors.surface + '40', borderColor: theme.colors.border }}>
            <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <Clock className="w-5 h-5" style={{ color: theme.colors.accent }} />
                <span>مواعيد {selectedDate?.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</span>
              </h3>
            </div>
            <div className="flex-1 p-4 overflow-auto space-y-4">
              <AnimatePresence mode="wait">
                {selectedEvents.length > 0 ? (
                  <motion.div
                    key={selectedDate?.toISOString()}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {selectedEvents.map((event, idx) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="p-4 rounded-xl border space-y-3 transition-all hover:shadow-lg hover:scale-[1.02] backdrop-blur-[20px]"
                        style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-sm leading-tight" style={{ color: theme.colors.text }}>{event.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.accent + '20', color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
                            {event.course}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{event.start.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center px-6 py-16"
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-[20px] border" style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
                      <CalendarX size={28} style={{ color: theme.colors.textMuted + '80' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>لا توجد مواعيد في هذا اليوم</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quick Stats/Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-[20px] border"
            style={{ backgroundColor: theme.colors.surface + '50', borderColor: theme.colors.border }}>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5" style={{ color: theme.colors.accent }} />
              <span className="font-bold text-sm" style={{ color: theme.colors.text }}>ملخص الشهر</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl backdrop-blur-[20px]" style={{ backgroundColor: theme.colors.bg + '30' }}>
                <span className="block text-2xl font-bold" style={{ color: theme.colors.accent }}>{events.length}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.colors.textMuted }}>إجمالي المواعيد</span>
              </div>
              <div className="text-center p-3 rounded-xl backdrop-blur-[20px]" style={{ backgroundColor: theme.colors.bg + '30' }}>
                <span className="block text-2xl font-bold" style={{ color: theme.colors.success }}>
                  {events.filter(e => e.start.getTime() < new Date().getTime() + 86400000 * 7).length}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: theme.colors.textMuted }}>هذا الأسبوع</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
