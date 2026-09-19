import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, Calendar, Clock, Tag, Home, Settings, Folders, X, Edit2 } from 'lucide-react';

function BottomNav({ activeTab, setActiveTab, darkMode, fabPressed, setFabPressed, showForm, setShowForm }) {
  const activeStyle = 'text-green-400';
  const inactiveStyle = darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
  const labelStyle = { fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 500 };

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg`}>
      <div className="max-w-md mx-auto px-2 py-3">
        <div className="flex justify-around items-center">

          <button type="button" onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${activeTab === 'home' ? activeStyle : inactiveStyle}`}>
            <Home size={24} />
            <span style={labelStyle}>Home</span>
          </button>

          <button type="button" onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${activeTab === 'categories' ? activeStyle : inactiveStyle}`}>
            <Folders size={24} />
            <span style={labelStyle}>Categories</span>
          </button>

          <button type="button" onClick={() => {
              setFabPressed(true);
              setTimeout(() => setFabPressed(false), 120);
              setShowForm(!showForm);
            }}
            className="flex flex-col items-center gap-1 -mt-6">
            <div className={`bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition ${fabPressed ? 'scale-95' : 'scale-100'}`}>
              <Plus size={28} />
            </div>
          </button>

          <button type="button" onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${activeTab === 'calendar' ? activeStyle : inactiveStyle}`}>
            <Calendar size={24} />
            <span style={labelStyle}>Calendar</span>
          </button>

          <button type="button" onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${activeTab === 'settings' ? activeStyle : inactiveStyle}`}>
            <Settings size={24} />
            <span style={labelStyle}>Settings</span>
          </button>

        </div>
      </div>
    </div>
  );
}

export default function ReminderApp() {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [recurrenceFilter, setRecurrenceFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [customCategories, setCustomCategories] = useState([]);
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [fabPressed, setFabPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [deleteConfirmState, setDeleteConfirmState] = useState({ show: false, reminder: null });
  const [importModalState, setImportModalState] = useState({ show: false, data: null, confirmReplace: false });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [skippedToday, setSkippedToday] = useState([]);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [skippedAllTime, setSkippedAllTime] = useState(0);
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null); // { name, color }
  const [categorySortAsc, setCategorySortAsc] = useState(true);
  const [dragState, setDragState] = useState({ type: null, index: null, overIndex: null });
  const [statsEditMode, setStatsEditMode] = useState(false);
  const [oneTimeRetention, setOneTimeRetention] = useState(30); // days, -1 = never
  const [retentionConfirm, setRetentionConfirm] = useState(null); // { newValue, label, count }
  const [statsConfig, setStatsConfig] = useState([
    { id: 'delivered', label: 'Reminders Delivered', visible: true },
    { id: 'skipped', label: 'Skipped All Time', visible: true },
    { id: 'topCategory', label: 'Most Active Category', visible: true },
    { id: 'busiestDay', label: 'Busiest Day', visible: true },
    { id: 'totalReminders', label: 'Total Reminders', visible: true },
    { id: 'categories', label: 'Categories', visible: true },
  ]);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    task: '',
    time: '12:00',
    days: [],
    category: undefined,
    recurrenceType: 'once',
    monthlyDays: [],
    intervalDays: 1,
    startDate: '',
    lastTriggered: null
  });

  const defaultCategories = [
    { name: 'Personal Care',    color: 'bg-blue-900 text-blue-300 border-blue-700',         default: true },
    { name: 'Home',             color: 'bg-indigo-900 text-indigo-300 border-indigo-700',   default: true },
    { name: 'Health & Wellness',color: 'bg-violet-900 text-violet-300 border-violet-700',   default: true },
    { name: 'Work / School',    color: 'bg-sky-900 text-sky-300 border-sky-700',             default: true },
    { name: 'Errands',          color: 'bg-cyan-900 text-cyan-300 border-cyan-700',          default: true },
    { name: 'Appointments',     color: 'bg-teal-900 text-teal-300 border-teal-700',          default: true },
    { name: 'Finance',          color: 'bg-emerald-900 text-emerald-300 border-emerald-700', default: true },
    { name: 'Habits',           color: 'bg-green-900 text-green-300 border-green-700',       default: true },
    { name: 'Pets',             color: 'bg-lime-900 text-lime-300 border-lime-700',          default: true }
  ];

  const customColors = [
    'bg-blue-900 text-blue-300 border-blue-700',
    'bg-sky-900 text-sky-300 border-sky-700',
    'bg-cyan-900 text-cyan-300 border-cyan-700',
    'bg-teal-900 text-teal-300 border-teal-700',
    'bg-emerald-900 text-emerald-300 border-emerald-700',
    'bg-green-900 text-green-300 border-green-700',
    'bg-indigo-900 text-indigo-300 border-indigo-700',
    'bg-violet-900 text-violet-300 border-violet-700',
    'bg-lime-900 text-lime-300 border-lime-700',
  ];

  const allCategories = [...defaultCategories, ...customCategories].filter(
    cat => !deletedDefaultCategories.includes(cat.name)
  ).sort((a, b) => {
    if (categoryOrder.length > 0) {
      const ai = categoryOrder.indexOf(a.name);
      const bi = categoryOrder.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.name.localeCompare(b.name);
  });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Parse YYYY-MM-DD as local time (not UTC) to avoid timezone off-by-one
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Get today's date as YYYY-MM-DD in local time
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    loadReminders();
    loadCustomCategories();
    loadDeletedCategories();
    loadDarkMode();
    loadCompletedToday();
    loadStats();
    loadCategoryOrder();
    loadRetentionSetting();
    loadTutorial();
    requestNotificationPermission();
  }, []);

  const anyModalOpen = showForm || showCategoryManager || deleteConfirmState.show || importModalState.show || showResetConfirm || !!categoryToDelete || (isProcessing && !importModalState.show && !showResetConfirm);

  useEffect(() => {
    // Track delivered: increment once per reminder per day when it appears on today's screen
    const trackDelivered = async () => {
      if (reminders.length === 0) return;
      const today = new Date().toDateString();
      try {
        const storedCount = await window.storage.get('stat-delivered');
        const currentCount = storedCount ? JSON.parse(storedCount.value) : 0;
        const result = await window.storage.get('delivered-today');
        const data = result ? JSON.parse(result.value) : { date: null, ids: [] };
        if (data.date !== today) {
          // New day — reset
          const todayIds = getTodaysReminders().map(r => r.id);
          await window.storage.set('delivered-today', JSON.stringify({ date: today, ids: todayIds }));
          const newCount = currentCount + todayIds.length;
          setDeliveredCount(newCount);
          await window.storage.set('stat-delivered', JSON.stringify(newCount));
        } else {
          // Same day — only count new ones not already tracked
          const todayIds = getTodaysReminders().map(r => r.id);
          const newIds = todayIds.filter(id => !data.ids.includes(id));
          if (newIds.length > 0) {
            const updatedIds = [...data.ids, ...newIds];
            await window.storage.set('delivered-today', JSON.stringify({ date: today, ids: updatedIds }));
            const newCount = currentCount + newIds.length;
            setDeliveredCount(newCount);
            await window.storage.set('stat-delivered', JSON.stringify(newCount));
          }
        }
      } catch {}
    };
    trackDelivered();
  }, [reminders]);

  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    // TODO: Future feature - Add snooze functionality to notifications
    // When notification fires, include snooze button options:
    // - Snooze 5 min
    // - Snooze 15 min
    // - Snooze 1 hour
    // Store snoozed reminders with new trigger time
    // Display snoozed reminders differently in UI (maybe with clock icon)

    // TODO: Future feature - Flexible timing relative to fluid events
    // A new recurrence type where reminder time is calculated relative to a dynamic anchor:
    // - Sunrise / sunset (via sunrise-sunset.org API + geolocation)
    // - Sports game start times ("remind me 15 min before the Broncos game")
    // - Weather events, tides, prayer times, etc.
    // Anchor time fetched fresh each day, offset applied at notification scheduling time.
    // Requires: geolocation permission, network access, daily recalculation logic.
  };

  const loadReminders = async () => {
    try {
      // Try new batched format first
      const result = await window.storage.get('reminders-all');
      if (result) {
        const loaded = JSON.parse(result.value);
        const cleaned = await cleanupExpiredReminders(oneTimeRetention, loaded);
        setReminders(cleaned);
        return;
      }
      // Fall back to old per-key format and migrate
      const list = await window.storage.list('reminder:');
      if (list && list.keys && list.keys.length > 0) {
        const loaded = (await Promise.all(
          list.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key);
              return data ? JSON.parse(data.value) : null;
            } catch { return null; }
          })
        )).filter(Boolean);
        setReminders(loaded);
        // Migrate to new format
        await window.storage.set('reminders-all', JSON.stringify(loaded));
        for (const key of list.keys) {
          try { await window.storage.delete(key); } catch {}
        }
      }
    } catch {}
  };

  const saveAllReminders = async (updatedReminders) => {
    try {
      await window.storage.set('reminders-all', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  };

  const loadCustomCategories = async () => {
    try {
      const result = await window.storage.get('custom-categories');
      if (result) {
        const paletteColors = [
          'bg-blue-900 text-blue-300 border-blue-700',
          'bg-sky-900 text-sky-300 border-sky-700',
          'bg-cyan-900 text-cyan-300 border-cyan-700',
          'bg-teal-900 text-teal-300 border-teal-700',
          'bg-emerald-900 text-emerald-300 border-emerald-700',
          'bg-green-900 text-green-300 border-green-700',
          'bg-indigo-900 text-indigo-300 border-indigo-700',
          'bg-violet-900 text-violet-300 border-violet-700',
          'bg-lime-900 text-lime-300 border-lime-700',
        ];
        const cats = JSON.parse(result.value);
        const migrated = cats.map((cat, i) => ({
          ...cat,
          color: paletteColors[i % paletteColors.length]
        }));
        setCustomCategories(migrated);
        await window.storage.set('custom-categories', JSON.stringify(migrated));
      }
    } catch (error) {
      // No custom categories yet
    }
  };

  const loadDeletedCategories = async () => {
    try {
      const result = await window.storage.get('deleted-categories');
      if (result) {
        setDeletedDefaultCategories(JSON.parse(result.value));
      }
    } catch (error) {
      // No deleted categories yet
    }
  };

  const loadDarkMode = async () => {
    try {
      const result = await window.storage.get('dark-mode');
      if (result) {
        setDarkMode(JSON.parse(result.value));
      }
    } catch (error) {
      // No dark mode preference saved
    }
  };

  const loadCompletedToday = async () => {
    try {
      const today = new Date().toDateString();
      const result = await window.storage.get('completed-today');
      if (result) {
        const data = JSON.parse(result.value);
        if (data.date === today) {
          setSkippedToday(data.ids);
        } else {
          setSkippedToday([]);
          await window.storage.delete('completed-today');
        }
      }
    } catch (error) {
      // No skipped items saved
    }
  };

  const loadStats = async () => {
    try {
      const delivered = await window.storage.get('stat-delivered');
      if (delivered) setDeliveredCount(JSON.parse(delivered.value));
    } catch {}
    try {
      const skipped = await window.storage.get('stat-skipped');
      if (skipped) setSkippedAllTime(JSON.parse(skipped.value));
    } catch {}
    try {
      const config = await window.storage.get('stats-config');
      if (config) setStatsConfig(JSON.parse(config.value));
    } catch {}
  };

  const saveStatsConfig = async (config) => {
    try {
      await window.storage.set('stats-config', JSON.stringify(config));
    } catch {}
  };

  const loadCategoryOrder = async () => {
    try {
      const result = await window.storage.get('category-order');
      if (result) setCategoryOrder(JSON.parse(result.value));
    } catch {}
  };

  const saveCategoryOrder = async (order) => {
    try {
      await window.storage.set('category-order', JSON.stringify(order));
    } catch {}
  };

  const loadRetentionSetting = async () => {
    try {
      const result = await window.storage.get('one-time-retention');
      if (result) setOneTimeRetention(JSON.parse(result.value));
    } catch {}
  };

  const loadTutorial = async () => {
    try {
      const result = await window.storage.get('tutorial-seen');
      if (!result) setShowTutorial(true);
    } catch {}
  };

  const dismissTutorial = async () => {
    setShowTutorial(false);
    try {
      await window.storage.set('tutorial-seen', 'true');
    } catch {}
  };

  const saveRetentionSetting = async (days) => {
    try {
      await window.storage.set('one-time-retention', JSON.stringify(days));
    } catch {}
  };

  const cleanupExpiredReminders = async (retention, currentReminders) => {
    if (retention === -1) return currentReminders; // never delete
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const updated = currentReminders.filter(r => {
      if (r.recurrenceType !== 'once' || !r.startDate) return true;
      const d = parseLocalDate(r.startDate);
      const daysPast = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      return daysPast < retention;
    });
    if (updated.length !== currentReminders.length) {
      await saveAllReminders(updated);
    }
    return updated;
  };

  const saveCategoryEdit = (oldName, newName, newColor) => {
    const trimmed = newName.trim() || oldName;
    // Update custom categories (name + color)
    const updatedCustom = customCategories.map(c =>
      c.name === oldName ? { ...c, name: trimmed, color: newColor } : c
    );
    setCustomCategories(updatedCustom);
    saveCustomCategories(updatedCustom);
    // Update category order
    if (trimmed !== oldName) {
      const updatedOrder = categoryOrder.map(n => n === oldName ? trimmed : n);
      setCategoryOrder(updatedOrder);
      saveCategoryOrder(updatedOrder);
      // Update reminders using old category name
      const updatedReminders = reminders.map(r =>
        r.category === oldName ? { ...r, category: trimmed } : r
      );
      setReminders(updatedReminders);
      saveAllReminders(updatedReminders);
    }
    setEditingCategory(null);
  };

  const markSkipped = async (reminderId) => {
    const today = new Date().toDateString();
    const updated = [...skippedToday, reminderId];
    setSkippedToday(updated);
    try {
      await window.storage.set('completed-today', JSON.stringify({ date: today, ids: updated }));
    } catch (error) {
      console.error('Failed to save skip:', error);
    }
    // Increment skipped all time
    const newSkipped = skippedAllTime + 1;
    setSkippedAllTime(newSkipped);
    try {
      await window.storage.set('stat-skipped', JSON.stringify(newSkipped));
    } catch {}
  };

  const isSkippedToday = (reminderId) => {
    return skippedToday.includes(reminderId);
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await window.storage.set('dark-mode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  const saveCustomCategories = async (categories) => {
    try {
      await window.storage.set('custom-categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  const saveDeletedCategories = async (categories) => {
    try {
      await window.storage.set('deleted-categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save deleted categories:', error);
    }
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    const randomColor = customColors[Math.floor(Math.random() * customColors.length)];
    const newCategory = {
      name: newCategoryName.trim(),
      color: randomColor,
      default: false
    };
    
    const updated = [...customCategories, newCategory];
    setCustomCategories(updated);
    saveCustomCategories(updated);
    setNewCategoryName('');
    setShowCategoryForm(false);
  };

  const deleteCustomCategory = (categoryName) => {
    const updated = customCategories.filter(c => c.name !== categoryName);
    setCustomCategories(updated);
    saveCustomCategories(updated);
  };

  const deleteCategory = (categoryName, isDefault) => {
    if (isDefault) {
      const updated = [...deletedDefaultCategories, categoryName];
      setDeletedDefaultCategories(updated);
      saveDeletedCategories(updated);
    } else {
      deleteCustomCategory(categoryName);
    }
    setCategoryToDelete(null);
  };




  const deleteReminder = async (id) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    setDeleteConfirmState({ show: true, reminder: reminder });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmState.reminder) return;
    const updated = reminders.filter(r => r.id !== deleteConfirmState.reminder.id);
    setReminders(updated);
    await saveAllReminders(updated);
    setDeleteConfirmState({ show: false, reminder: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmState({ show: false, reminder: null });
  };

  const handleSubmit = () => {
    if (!formData.task || !formData.time) {
      alert('Please fill in task and time');
      return;
    }

    if (formData.recurrenceType === 'weekly' && formData.days.length === 0) {
      alert('Please select at least one day for weekly reminders');
      return;
    }

    if (formData.recurrenceType === 'monthly' && formData.monthlyDays.length === 0) {
      alert('Please select at least one day of the month');
      return;
    }

    if (formData.recurrenceType === 'interval' && (!formData.intervalDays || !formData.startDate)) {
      alert('Please set interval days and start date');
      return;
    }

    if (formData.recurrenceType === 'once' && !formData.startDate) {
      alert('Please select a date for one-time reminder');
      return;
    }

    if (editingReminder) {
      const updatedReminder = {
        ...editingReminder,
        task: formData.task,
        time: formData.time,
        category: formData.category || 'None',
        recurrenceType: formData.recurrenceType,
        days: formData.days,
        monthlyDays: formData.monthlyDays,
        intervalDays: formData.intervalDays,
        startDate: formData.startDate,
        lastTriggered: formData.recurrenceType === 'interval' ? formData.startDate : editingReminder.lastTriggered
      };
      const updated = reminders.map(r => r.id === editingReminder.id ? updatedReminder : r);
      setReminders(updated);
      saveAllReminders(updated);
      setEditingReminder(null);
    } else {
      const newReminder = {
        id: Date.now().toString(),
        task: formData.task,
        time: formData.time,
        category: formData.category || 'None',
        recurrenceType: formData.recurrenceType,
        days: formData.days,
        monthlyDays: formData.monthlyDays,
        intervalDays: formData.intervalDays,
        startDate: formData.startDate,
        lastTriggered: formData.recurrenceType === 'interval' ? formData.startDate : null,
        enabled: true
      };
      const updated = [...reminders, newReminder];
      setReminders(updated);
      saveAllReminders(updated);
    }
    
    setFormData({ 
      task: '', 
      time: '12:00', 
      days: [], 
      category: undefined,
      recurrenceType: 'once',
      monthlyDays: [],
      intervalDays: 1,
      startDate: '',
      lastTriggered: null
    });
    setShowForm(false);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const toggleMonthlyDay = (day) => {
    setFormData(prev => ({
      ...prev,
      monthlyDays: prev.monthlyDays.includes(day)
        ? prev.monthlyDays.filter(d => d !== day)
        : [...prev.monthlyDays, day]
    }));
  };

  const getRecurrenceDescription = (reminder) => {
    if (reminder.recurrenceType === 'daily') return 'Every day';
    if (reminder.recurrenceType === 'weekly') {
      const dayNames = reminder.days.sort((a, b) => a - b).map(d => weekDays[d]).join(', ');
      return dayNames;
    }
    if (reminder.recurrenceType === 'monthly') {
      const days = reminder.monthlyDays.sort((a, b) => a - b).join(', ');
      return `Monthly: ${days}${reminder.monthlyDays.length === 1 ? (reminder.monthlyDays[0] === 1 ? 'st' : reminder.monthlyDays[0] === 2 ? 'nd' : reminder.monthlyDays[0] === 3 ? 'rd' : 'th') : ''}`;
    }
    if (reminder.recurrenceType === 'interval') return `Every ${reminder.intervalDays} days`;
    if (reminder.recurrenceType === 'once') return `Once: ${parseLocalDate(reminder.startDate).toLocaleDateString()}`;
    return '';
  };

  const getCategoryColor = (categoryName) => {
    if (!categoryName || categoryName === 'None') return 'bg-gray-100 text-gray-500 border-gray-200';
    const category = allCategories.find(c => c.name === categoryName);
    return category ? category.color : 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getTodaysReminders = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    
    return reminders.filter(r => {
      if (r.recurrenceType === 'daily') return true;
      if (r.recurrenceType === 'weekly') return r.days.includes(dayOfWeek);
      if (r.recurrenceType === 'monthly') return r.monthlyDays.includes(dayOfMonth);
      if (r.recurrenceType === 'interval') {
        if (!r.startDate) return false;
        const start = parseLocalDate(r.startDate);
        const lastTrig = r.lastTriggered ? parseLocalDate(r.lastTriggered) : start;
        const daysSinceLastTrigger = Math.floor((today - lastTrig) / (1000 * 60 * 60 * 24));
        return daysSinceLastTrigger >= r.intervalDays;
      }
      if (r.recurrenceType === 'once') {
        if (!r.startDate) return false;
        const reminderDate = parseLocalDate(r.startDate);
        return today.toDateString() === reminderDate.toDateString();
      }
      return false;
    });
  };

  const isReminderPassed = (reminder) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    
    let isForToday = false;
    
    if (reminder.recurrenceType === 'daily') {
      isForToday = true;
    } else if (reminder.recurrenceType === 'weekly') {
      isForToday = reminder.days.includes(dayOfWeek);
    } else if (reminder.recurrenceType === 'monthly') {
      isForToday = reminder.monthlyDays.includes(dayOfMonth);
    } else if (reminder.recurrenceType === 'interval') {
      if (!reminder.startDate) return false;
      const start = parseLocalDate(reminder.startDate);
      const lastTrig = reminder.lastTriggered ? parseLocalDate(reminder.lastTriggered) : start;
      const daysSinceLastTrigger = Math.floor((today - lastTrig) / (1000 * 60 * 60 * 24));
      isForToday = daysSinceLastTrigger >= reminder.intervalDays;
    } else if (reminder.recurrenceType === 'once') {
      if (!reminder.startDate) return false;
      const reminderDate = parseLocalDate(reminder.startDate);
      isForToday = today.toDateString() === reminderDate.toDateString();
    }
    
    if (!isForToday) return false;
    
    const [hours, minutes] = reminder.time.split(':');
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    return today > reminderTime;
  };

  const getRemindersForDate = (date) => {
    if (!date) return [];
    const targetDate = parseLocalDate(date);
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();
    
    return reminders.filter(r => {
      if (r.recurrenceType === 'daily') return true;
      if (r.recurrenceType === 'weekly') return r.days.includes(dayOfWeek);
      if (r.recurrenceType === 'monthly') return r.monthlyDays.includes(dayOfMonth);
      if (r.recurrenceType === 'once') {
        if (!r.startDate) return false;
        const reminderDate = parseLocalDate(r.startDate);
        return targetDate.toDateString() === reminderDate.toDateString();
      }
      // interval reminders intentionally excluded — future dates can't be predicted without tracking
      return false;
    });
  };

  const getRemindersByCategory = (categoryName) => {
    return reminders.filter(r => r.category === categoryName);
  };

  const generateCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendar = [];
    let week = new Array(firstDay).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      calendar.push(week);
    }
    
    return calendar;
  };

  const previousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const addReminderForDate = (dateStr) => {
    setFormData({
      task: '',
      time: '12:00',
      days: [],
      category: undefined,
      recurrenceType: 'once',
      monthlyDays: [],
      intervalDays: 1,
      startDate: dateStr,
      lastTriggered: null
    });
    setShowForm(true);
  };

  const exportData = () => {
    const exportData = {
      reminders: reminders,
      customCategories: customCategories,
      exportDate: new Date().toISOString(),
      version: '1.2'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reminders-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLongPressStart = (reminder) => {
    const timer = setTimeout(() => {
      // Open edit form with reminder data
      setFormData({
        task: reminder.task,
        time: reminder.time,
        days: reminder.days || [],
        category: reminder.category === 'None' ? null : reminder.category,
        recurrenceType: reminder.recurrenceType,
        monthlyDays: reminder.monthlyDays || [],
        intervalDays: reminder.intervalDays || 1,
        startDate: reminder.startDate || '',
        lastTriggered: reminder.lastTriggered
      });
      setEditingReminder(reminder);
      setShowForm(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleEditReminder = (reminder) => {
    setFormData({
      task: reminder.task,
      time: reminder.time,
      days: reminder.days || [],
      category: reminder.category === 'None' ? null : reminder.category,
      recurrenceType: reminder.recurrenceType,
      monthlyDays: reminder.monthlyDays || [],
      intervalDays: reminder.intervalDays || 1,
      startDate: reminder.startDate || '',
      lastTriggered: reminder.lastTriggered
    });
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.reminders || !Array.isArray(importData.reminders)) {
        setImportStatus('Invalid file format');
        setTimeout(() => setImportStatus(''), 3000);
        return;
      }

      // If no existing reminders, just import directly
      if (reminders.length === 0) {
        await handleDirectImport(importData);
      } else {
        // Show import modal to ask user
        setImportModalState({ show: true, data: importData, confirmReplace: false });
      }
    } catch (error) {
      setImportStatus('Error importing file. Please check the file format.');
      setTimeout(() => setImportStatus(''), 3000);
      console.error('Import error:', error);
    }
    
    event.target.value = '';
  };

  const handleDirectImport = async (importData) => {
    setIsProcessing(true);
    setProcessingMessage('Importing reminders...');
    try {
      await saveAllReminders(importData.reminders);
      setReminders(importData.reminders);
      if (importData.customCategories && Array.isArray(importData.customCategories)) {
        setCustomCategories(importData.customCategories);
        await saveCustomCategories(importData.customCategories);
      }
      setImportStatus(`Imported ${importData.reminders.length} reminders!`);
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('Error importing file.');
      setTimeout(() => setImportStatus(''), 3000);
    }
    setIsProcessing(false);
    setProcessingMessage('');
  };

  const handleImportReplace = async () => {
    const importData = importModalState.data;
    if (!importData) return;
    setIsProcessing(true);
    setProcessingMessage('Replacing reminders...');
    try {
      await saveAllReminders(importData.reminders);
      setReminders(importData.reminders);
      if (importData.customCategories && Array.isArray(importData.customCategories)) {
        setCustomCategories(importData.customCategories);
        await saveCustomCategories(importData.customCategories);
      }
      setImportStatus(`Replaced with ${importData.reminders.length} reminders!`);
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('Error importing file.');
      setTimeout(() => setImportStatus(''), 3000);
    }
    setIsProcessing(false);
    setProcessingMessage('');
    setImportModalState({ show: false, data: null, confirmReplace: false });
  };

  const handleImportAdd = async () => {
    const importData = importModalState.data;
    if (!importData) return;
    setIsProcessing(true);
    setProcessingMessage('Adding reminders...');
    try {
      const existingIds = new Set(reminders.map(r => r.id));
      const newReminders = importData.reminders.filter(r => !existingIds.has(r.id));
      const finalReminders = [...reminders, ...newReminders];
      await saveAllReminders(finalReminders);
      setReminders(finalReminders);
      if (importData.customCategories && Array.isArray(importData.customCategories)) {
        const existingNames = new Set(customCategories.map(c => c.name));
        const newCategories = importData.customCategories.filter(c => !existingNames.has(c.name));
        const mergedCategories = [...customCategories, ...newCategories];
        setCustomCategories(mergedCategories);
        await saveCustomCategories(mergedCategories);
      }
      setImportStatus(`Added ${newReminders.length} reminders!`);
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('Error importing file.');
      setTimeout(() => setImportStatus(''), 3000);
    }
    setIsProcessing(false);
    setProcessingMessage('');
    setImportModalState({ show: false, data: null, confirmReplace: false });
  };

  const cancelImport = () => {
    setImportModalState({ show: false, data: null, confirmReplace: false });
  };

  const resetApp = async () => {
    setIsProcessing(true);
    try {
      try { await window.storage.delete('reminders-all'); } catch {}
      // Also clean up old format keys if any remain
      const keys = ['reminders-all', 'custom-categories', 'deleted-categories', 'stat-delivered', 'stat-skipped', 'delivered-today', 'completed-today', 'stats-config', 'category-order', 'one-time-retention'];
      await Promise.all(keys.map(k => window.storage.delete(k).catch(() => {})));

      // Also clean up any old per-key reminders
      try {
        const oldKeys = await window.storage.list('reminder:');
        if (oldKeys?.keys?.length) await Promise.all(oldKeys.keys.map(k => window.storage.delete(k).catch(() => {})));
      } catch {}

      setReminders([]);
      setCustomCategories([]);
      setDeletedDefaultCategories([]);
      setDeliveredCount(0);
      setSkippedAllTime(0);
      setCategoryOrder([]);
      setOneTimeRetention(30);

      setImportStatus('App reset to default settings');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      console.error('Failed to reset app:', error);
      setImportStatus('Error resetting app: ' + error.message);
      setTimeout(() => setImportStatus(''), 5000);
    }
    setIsProcessing(false);
    setShowResetConfirm(false);
  };

  const toggleStatVisible = (id) => {
    const updated = statsConfig.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
    setStatsConfig(updated);
    saveStatsConfig(updated);
  };

  const moveStatUp = (index) => {
    if (index === 0) return;
    const updated = [...statsConfig];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setStatsConfig(updated);
    saveStatsConfig(updated);
  };

  const moveStatDown = (index) => {
    if (index === statsConfig.length - 1) return;
    const updated = [...statsConfig];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setStatsConfig(updated);
    saveStatsConfig(updated);
  };

  const getStatValue = (id) => {
    switch (id) {
      case 'delivered': return deliveredCount;
      case 'skipped': return skippedAllTime;
      case 'topCategory': {
        const counts = {};
        reminders.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : '—';
      }
      case 'busiestDay': {
        const counts = [0,0,0,0,0,0,0];
        reminders.forEach(r => {
          if (r.recurrenceType === 'daily') counts.forEach((_, i) => counts[i]++);
          else if (r.recurrenceType === 'weekly') r.days.forEach(d => counts[d]++);
        });
        const max = Math.max(...counts);
        return max === 0 ? '—' : weekDays[counts.indexOf(max)];
      }
      case 'totalReminders': return reminders.length;
      case 'categories': return allCategories.length;
      default: return '—';
    }
  };

  const handleDragStart = (type, index) => {
    setDragState({ type, index, overIndex: index });
  };

  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    setDragState(prev => ({ ...prev, overIndex }));
  };

  const handleDrop = (type, overIndex) => {
    const { index } = dragState;
    if (index === null || index === overIndex) {
      setDragState({ type: null, index: null, overIndex: null });
      return;
    }
    if (type === 'category') {
      const names = allCategories.map(c => c.name);
      const [moved] = names.splice(index, 1);
      names.splice(overIndex, 0, moved);
      setCategoryOrder(names);
      saveCategoryOrder(names);
    } else if (type === 'stat') {
      const updated = [...statsConfig];
      const [moved] = updated.splice(index, 1);
      updated.splice(overIndex, 0, moved);
      setStatsConfig(updated);
      saveStatsConfig(updated);
    }
    setDragState({ type: null, index: null, overIndex: null });
  };

  const handleTouchDrag = (type, list, setList, saveFn) => {
    let startY = 0;
    let currentIndex = 0;
    let itemHeight = 72;

    return {
      onTouchStart: (e, index) => {
        startY = e.touches[0].clientY;
        currentIndex = index;
        setDragState({ type, index, overIndex: index });
      },
      onTouchMove: (e, index) => {
        const deltaY = e.touches[0].clientY - startY;
        const newIndex = Math.max(0, Math.min(list.length - 1, Math.round(index + deltaY / itemHeight)));
        setDragState(prev => ({ ...prev, overIndex: newIndex }));
      },
      onTouchEnd: (e, index) => {
        const deltaY = e.changedTouches[0].clientY - startY;
        const newIndex = Math.max(0, Math.min(list.length - 1, Math.round(index + deltaY / itemHeight)));
        if (newIndex !== index) {
          const updated = [...list];
          const [moved] = updated.splice(index, 1);
          updated.splice(newIndex, 0, moved);
          setList(updated);
          saveFn(updated);
        }
        setDragState({ type: null, index: null, overIndex: null });
      }
    };
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      const todaysReminders = getTodaysReminders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const baseReminders = showAllReminders
        ? reminders.filter(r => {
            if (r.recurrenceType === 'once') {
              if (!r.startDate) return false;
              const d = parseLocalDate(r.startDate);
              return d >= today; // hide if before today
            }
            return true; // recurring reminders always show
          })
        : todaysReminders;
      const filterChips = [
        { value: 'all', label: 'All' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'break', label: '' },
        { value: 'interval', label: 'Every X Days' },
        { value: 'once', label: 'One Time' },
      ];
      const displayReminders = (recurrenceFilter === 'all'
        ? baseReminders
        : baseReminders.filter(r => r.recurrenceType === recurrenceFilter)
      ).sort((a, b) => a.time.localeCompare(b.time));
      
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>
              {showAllReminders ? 'All Reminders' : "Today's Reminders"}
            </h2>
            <button
              type="button"
              onClick={() => { setShowAllReminders(!showAllReminders); setRecurrenceFilter('all'); }}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
            >
              {showAllReminders ? 'Show Today' : 'View All'}
            </button>
          </div>

          {showAllReminders && (
            <div className="flex flex-wrap gap-2 mb-2">
              {filterChips.map(chip => chip.value === 'break' ? (
                <div key="break" className="w-full" />
              ) : (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setRecurrenceFilter(chip.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition border ${
                    recurrenceFilter === chip.value
                      ? 'bg-blue-900 text-white border-blue-600'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
          
          {displayReminders.length === 0 ? (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8 text-center`}>
              <Bell className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">
                {showAllReminders ? 'No reminders found' : 'No reminders for today'}
              </p>
            </div>
          ) : (
            displayReminders.map((reminder) => {
              const isPassed = isReminderPassed(reminder);
              const isSkipped = isSkippedToday(reminder.id);
              return (
                <div 
                  key={reminder.id} 
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 hover:shadow-lg transition ${
                    isPassed || isSkipped ? 'opacity-50' : ''
                  }`}
                  onTouchStart={() => handleLongPressStart(reminder)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(reminder)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(reminder.category)}`}>
                          {reminder.category}
                        </span>
                        {isPassed && !isSkipped && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                            Past
                          </span>
                        )}
                        {isSkipped && (
                          <span className="px-2 py-1 bg-orange-200 text-orange-700 rounded text-xs font-medium">
                            Skipped
                          </span>
                        )}
                      </div>
                      <h3 className={`font-semibold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'} ${isPassed || isSkipped ? 'line-through' : ''}`}>
                        {reminder.task}
                      </h3>
                      <div className={`flex items-center gap-2 text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Clock size={16} />
                        <span>{formatTime(reminder.time)}</span>
                      </div>
                      {showAllReminders && (
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {getRecurrenceDescription(reminder)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!isSkipped && (
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            markSkipped(reminder.id);
                          }} 
                          className="text-orange-500 hover:bg-orange-50 px-2 py-1 rounded-lg transition text-xs font-medium"
                        >
                          Skip
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReminder(reminder);
                        }} 
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReminder(reminder.id);
                        }} 
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (activeTab === 'categories') {
      const allColors = [
        'bg-pink-100 text-pink-700 border-pink-200',
        'bg-blue-100 text-blue-700 border-blue-200',
        'bg-green-100 text-green-700 border-green-200',
        'bg-purple-100 text-purple-700 border-purple-200',
        'bg-orange-100 text-orange-700 border-orange-200',
        'bg-red-100 text-red-700 border-red-200',
        'bg-emerald-100 text-emerald-700 border-emerald-200',
        'bg-cyan-100 text-cyan-700 border-cyan-200',
        'bg-amber-100 text-amber-700 border-amber-200',
        'bg-rose-100 text-rose-700 border-rose-200',
        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        'bg-violet-100 text-violet-700 border-violet-200',
        'bg-indigo-100 text-indigo-700 border-indigo-200',
        'bg-sky-100 text-sky-700 border-sky-200',
        'bg-teal-100 text-teal-700 border-teal-200',
        'bg-lime-100 text-lime-700 border-lime-200',
        'bg-yellow-100 text-yellow-700 border-yellow-200',
        'bg-slate-100 text-slate-700 border-slate-200',
      ];

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>Categories</h2>
            <div className="flex gap-2">
              {categoryEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    const names = allCategories.map(c => c.name);
                    const sorted = categorySortAsc
                      ? [...names].sort((a, b) => a.localeCompare(b))
                      : [...names].sort((a, b) => b.localeCompare(a));
                    setCategorySortAsc(!categorySortAsc);
                    setCategoryOrder(sorted);
                    saveCategoryOrder(sorted);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categorySortAsc ? "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" : "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"} />
                  </svg>
                  {categorySortAsc ? 'A→Z' : 'Z→A'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setCategoryEditMode(!categoryEditMode); setEditingCategory(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  categoryEditMode
                    ? 'bg-blue-900 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryEditMode ? 'Done' : 'Edit Order'}
              </button>
              {!categoryEditMode && (
                <button type="button" onClick={() => setShowCategoryManager(true)} className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition text-sm font-medium flex items-center gap-2 border border-blue-600">
                  <Plus size={18} />
                  <span>Add</span>
                </button>
              )}
            </div>
          </div>

          {allCategories.map((category, index) => {
            const categoryReminders = getRemindersByCategory(category.name);
            const isDragging = dragState.type === 'category' && dragState.index === index;
            const isOver = dragState.type === 'category' && dragState.overIndex === index && dragState.index !== index;
            const isEditing = editingCategory?.name === category.name;

            return (
              <div
                key={category.name}
                draggable={categoryEditMode}
                onDragStart={() => handleDragStart('category', index)}
                onDragOver={(e) => categoryEditMode && handleDragOver(e, index)}
                onDrop={() => categoryEditMode && handleDrop('category', index)}
                onMouseDown={() => {
                  if (categoryEditMode) return;
                  const t = setTimeout(() => setCategoryEditMode(true), 500);
                  setLongPressTimer(t);
                }}
                onMouseUp={() => { if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); } }}
                onMouseLeave={() => { if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); } }}
                onTouchStart={(e) => {
                  if (categoryEditMode) return;
                  const t = setTimeout(() => setCategoryEditMode(true), 500);
                  setLongPressTimer(t);
                }}
                onTouchEnd={() => { if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); } }}
                onTouchCancel={() => { if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); } }}
                className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-md p-4 transition-all select-none ${
                  isDragging ? 'opacity-40 scale-95' : ''
                } ${isOver ? 'ring-2 ring-indigo-400' : ''}`}
              >
                {/* Main row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {categoryEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 touch-none"
                        onTouchStart={(e) => {
                          const startY = e.touches[0].clientY;
                          const startIndex = index;
                          const itemHeight = 80;
                          const onMove = (ev) => {
                            const delta = ev.touches[0].clientY - startY;
                            const newIdx = Math.max(0, Math.min(allCategories.length - 1, Math.round(startIndex + delta / itemHeight)));
                            setDragState({ type: 'category', index: startIndex, overIndex: newIdx });
                          };
                          const cleanup = () => {
                            document.removeEventListener('touchmove', onMove);
                            document.removeEventListener('touchend', onEnd);
                            document.removeEventListener('touchcancel', cleanup);
                            setDragState({ type: null, index: null, overIndex: null });
                          };
                          const onEnd = (ev) => {
                            const delta = ev.changedTouches[0].clientY - startY;
                            const newIdx = Math.max(0, Math.min(allCategories.length - 1, Math.round(startIndex + delta / itemHeight)));
                            if (newIdx !== startIndex) {
                              const names = allCategories.map(c => c.name);
                              const [moved] = names.splice(startIndex, 1);
                              names.splice(newIdx, 0, moved);
                              setCategoryOrder(names);
                              saveCategoryOrder(names);
                            }
                            cleanup();
                          };
                          setDragState({ type: 'category', index, overIndex: index });
                          document.addEventListener('touchmove', onMove, { passive: true });
                          document.addEventListener('touchend', onEnd);
                          document.addEventListener('touchcancel', cleanup);
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    )}
                    <span className={`px-4 py-2 rounded-md text-sm font-semibold border ${category.color}`}>
                      {category.name}
                    </span>
                  </div>
                  {!categoryEditMode && (
                    <div className="flex items-center gap-1">
                      <span className={`text-sm mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{categoryReminders.length}</span>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(isEditing ? null : { name: category.name, newName: category.name, color: category.color })}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(category)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline edit panel */}
                {isEditing && !categoryEditMode && (
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                    <input
                      type="text"
                      value={editingCategory.newName}
                      onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                      placeholder="Category name"
                    />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {allColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, color })}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${color} ${
                            editingCategory.color === color ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          Aa
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCategoryEdit(category.name, editingCategory.newName, editingCategory.color)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition border border-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Reminder list */}
                {!categoryEditMode && !isEditing && categoryReminders.length > 0 && (
                  <div className="space-y-2 mt-3 pl-2 border-l-2 border-gray-100">
                    {categoryReminders.sort((a, b) => a.time.localeCompare(b.time)).map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{reminder.task}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTime(reminder.time)} • {getRecurrenceDescription(reminder)}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditReminder(reminder)}
                            className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReminder(reminder.id)}
                            className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'calendar') {
      const calendar = generateCalendar();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const now = new Date();
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </h2>
            
            <button
              type="button"
              onClick={nextMonth}
              className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className={`text-center text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {calendar.map((week, weekIdx) => (
                week.map((day, dayIdx) => {
                  if (!day) return <div key={`${weekIdx}-${dayIdx}`} className="aspect-square"></div>;
                  
                  const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayOfWeek = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay();
                  const hasReminders = reminders.some(r => {
                    if (r.recurrenceType === 'daily') return true;
                    if (r.recurrenceType === 'weekly') return r.days.includes(dayOfWeek);
                    if (r.recurrenceType === 'monthly') return r.monthlyDays.includes(day);
                    if (r.recurrenceType === 'once' && r.startDate) {
                      return parseLocalDate(dateStr).toDateString() === parseLocalDate(r.startDate).toDateString();
                    }
                    return false;
                  });
                  const isToday = day === now.getDate() && 
                                  calendarMonth.getMonth() === now.getMonth() && 
                                  calendarMonth.getFullYear() === now.getFullYear();
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <button
                      key={`${weekIdx}-${dayIdx}`}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition ${
                        isSelected ? 'bg-blue-900 text-white' :
                        isToday ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' :
                        darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{day}</span>
                      {hasReminders && !isSelected && <div className="w-1 h-1 bg-orange-500 rounded-full mt-1"></div>}
                    </button>
                  );
                })
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {parseLocalDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button
                  type="button"
                  onClick={() => addReminderForDate(selectedDate)}
                  className="bg-blue-900 text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition flex items-center gap-2 text-sm border border-blue-600"
                >
                  <Plus size={16} />
                  Add Reminder
                </button>
              </div>
              
              {getRemindersForDate(selectedDate).length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-6 text-center`}>
                  <Calendar className="mx-auto text-gray-300 mb-2" size={40} />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No reminders for this day</p>
                  <button
                    type="button"
                    onClick={() => addReminderForDate(selectedDate)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Add one now
                  </button>
                </div>
              ) : (
                getRemindersForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time)).map((reminder) => {
                  const selectedDateObj = parseLocalDate(selectedDate);
                  const now = new Date();
                  const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
                  const isPastDay = selectedDateObj < todayMidnight;
                  const isPastTime = selectedDateObj.toDateString() === now.toDateString() && (() => {
                    const [h, m] = reminder.time.split(':');
                    const t = new Date(); t.setHours(parseInt(h), parseInt(m), 0);
                    return now > t;
                  })();
                  const isPast = isPastDay || isPastTime;
                  return (
                  <div key={reminder.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 ${isPast ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(reminder.category)}`}>
                          {reminder.category}
                        </span>
                        {isPast && <span className={`px-2 py-1 rounded text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>Past</span>}
                        </div>
                        <h3 className={`font-semibold text-lg mt-2 ${darkMode ? 'text-white' : 'text-gray-800'} ${isPast ? 'line-through' : ''}`}>{reminder.task}</h3>
                        <div className={`flex items-center gap-2 text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock size={16} />
                          <span>{formatTime(reminder.time)}</span>
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {getRecurrenceDescription(reminder)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReminder(reminder);
                          }}
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReminder(reminder.id);
                          }}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-4`}>Settings</h2>
          
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-3`}>Appearance</h3>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dark Mode</p>
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-900' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-1`}>One-Time Reminders</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>Auto-delete past one-time reminders after:</p>
            <div className="flex gap-1.5 flex-nowrap justify-between">
              {[{ label: '1 day', value: 1 }, { label: '7 days', value: 7 }, { label: '30 days', value: 30 }, { label: '90 days', value: 90 }, { label: 'Never', value: -1 }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={async () => {
                    if (opt.value === oneTimeRetention) return;
                    // Count how many would be deleted
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const wouldDelete = opt.value === -1 ? 0 : reminders.filter(r => {
                      if (r.recurrenceType !== 'once' || !r.startDate) return false;
                      const d = parseLocalDate(r.startDate);
                      return Math.floor((today - d) / (1000 * 60 * 60 * 24)) >= opt.value;
                    }).length;
                    if (wouldDelete > 0) {
                      setRetentionConfirm({ newValue: opt.value, label: opt.label, count: wouldDelete });
                    } else {
                      setOneTimeRetention(opt.value);
                      await saveRetentionSetting(opt.value);
                    }
                  }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition text-center ${
                    oneTimeRetention === opt.value
                      ? 'bg-blue-900 text-white border-blue-600'
                      : darkMode ? 'bg-transparent text-gray-300 border-gray-500 hover:border-gray-400' : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-3`}>Categories</h3>
            <button 
              type="button" 
              onClick={() => setShowCategoryManager(true)} 
              className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 border border-blue-600"
            >
              <Folders size={20} />
              <span>Manage Categories</span>
            </button>
          </div>

          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-3`}>Backup & Restore</h3>
            <div className="space-y-3">
              <label className="block">
                <div className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Import Data</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={exportData}
                className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 border border-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Export All Data</span>
              </button>
              
              {importStatus && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  importStatus.includes('Error') || importStatus.includes('Invalid')
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {importStatus}
                </div>
              )}
              
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                Export your reminders and categories to transfer them to another device or create a backup.
              </p>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-3`}>Danger Zone</h3>
            <button 
              type="button" 
              onClick={() => setShowResetConfirm(true)} 
              className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              <span>Reset App to Default</span>
            </button>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
              This will delete all reminders, custom categories, and statistics. This cannot be undone.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}>Statistics</h3>
              <button
                type="button"
                onClick={() => setStatsEditMode(!statsEditMode)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition border ${
                  statsEditMode
                    ? 'bg-blue-900 text-white border-blue-600'
                    : darkMode ? 'bg-transparent text-gray-400 border-gray-500 hover:border-gray-400' : 'bg-transparent text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                {statsEditMode ? 'Done' : 'Edit'}
              </button>
            </div>

            {statsEditMode ? (
              <div className="space-y-2">
                {statsConfig.map((stat, index) => {
                  const isDragging = dragState.type === 'stat' && dragState.index === index;
                  const isOver = dragState.type === 'stat' && dragState.overIndex === index && dragState.index !== index;
                  return (
                    <div
                      key={stat.id}
                      draggable
                      onDragStart={() => handleDragStart('stat', index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop('stat', index)}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${isDragging ? 'opacity-40 scale-95' : ''} ${isOver ? 'ring-2 ring-indigo-400' : ''}`}
                    >
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 touch-none"
                        onTouchStart={(e) => {
                          const startY = e.touches[0].clientY;
                          const startIndex = index;
                          const itemHeight = 48;
                          const onMove = (ev) => {
                            const delta = ev.touches[0].clientY - startY;
                            const newIdx = Math.max(0, Math.min(statsConfig.length - 1, Math.round(startIndex + delta / itemHeight)));
                            setDragState({ type: 'stat', index: startIndex, overIndex: newIdx });
                          };
                          const cleanup = () => {
                            document.removeEventListener('touchmove', onMove);
                            document.removeEventListener('touchend', onEnd);
                            document.removeEventListener('touchcancel', cleanup);
                            setDragState({ type: null, index: null, overIndex: null });
                          };
                          const onEnd = (ev) => {
                            const delta = ev.changedTouches[0].clientY - startY;
                            const newIdx = Math.max(0, Math.min(statsConfig.length - 1, Math.round(startIndex + delta / itemHeight)));
                            if (newIdx !== startIndex) {
                              const updated = [...statsConfig];
                              const [moved] = updated.splice(startIndex, 1);
                              updated.splice(newIdx, 0, moved);
                              setStatsConfig(updated);
                              saveStatsConfig(updated);
                            }
                            cleanup();
                          };
                          setDragState({ type: 'stat', index, overIndex: index });
                          document.addEventListener('touchmove', onMove, { passive: true });
                          document.addEventListener('touchend', onEnd);
                          document.addEventListener('touchcancel', cleanup);
                        }}
                      >
                        <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <span className={`flex-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${!stat.visible ? 'opacity-40' : ''}`}>
                        {stat.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStatVisible(stat.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${stat.visible ? 'bg-indigo-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${stat.visible ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {statsConfig.filter(s => s.visible).map((stat) => {
                  const value = getStatValue(stat.id);
                  const stars = stat.id === 'delivered' && typeof value === 'number'
                    ? value >= 100000 ? 3 : value >= 50000 ? 2 : value >= 10000 ? 1 : 0
                    : 0;
                  const isEditable = false;
                  return (
                    <div key={stat.id} className="flex justify-between items-center">
                      <span>{stat.label}:</span>
                      {isEditable ? (
                        <input
                          type="number"
                          min="0"
                          defaultValue={value}
                          onBlur={async (e) => {
                            const n = parseInt(e.target.value) || 0;
                            if (stat.id === 'delivered') {
                              setDeliveredCount(n);
                              try { await window.storage.set('stat-delivered', JSON.stringify(n)); } catch {}
                            } else {
                              setSkippedAllTime(n);
                              try { await window.storage.set('stat-skipped', JSON.stringify(n)); } catch {}
                            }
                          }}
                          className={`w-28 px-2 py-0.5 rounded-lg border text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        />
                      ) : (
                        <span className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} flex items-center gap-1`}>
                          {stars > 0 && <span className="text-yellow-400">{'⭐'.repeat(Math.min(stars, 10))}</span>}
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Help</h3>
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 border border-blue-600"
            >
              <Bell size={20} />
              <span>View App Tutorial</span>
            </button>
          </div>

          <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-2`}>About</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Simple Reminders v0.8</p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>All data is stored locally on your device.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div
          className="rounded-2xl shadow-lg p-5 mb-4 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2f6b 60%, #0f2350 100%)' }}
          onClick={() => { setActiveTab('home'); setShowAllReminders(true); }}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&display=swap');
            h1,h2,h3,h4,button,button span,button div { font-family: 'Orbitron', sans-serif !important; letter-spacing: 0.03em; }
          `}</style>
          <div className="flex items-center gap-4">
            <div style={{ background: '#4CAF50' }} className="p-3 rounded-xl flex-shrink-0">
              <Bell className="text-white" size={26} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '1.32rem', letterSpacing: '0.18em', color: 'white', lineHeight: 1.1, textShadow: '0 0 20px rgba(61,184,74,0.4)' }}>
                SIMPLE REMINDERS
              </h1>
              <p style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.12em', color: '#4CAF50', marginTop: '3px' }}>
                ALPHA DELTA STUDIOS
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {reminders.length} active{reminders.length === 42 ? <span className="ml-1">🐋</span> : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Add Reminder Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full my-4 flex flex-col`}>
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h2>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditingReminder(null);
                }} className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="overflow-y-auto px-6 pb-6 flex-1">
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Task</label>
                  <input
                    type="text"
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    placeholder="e.g., Water plants"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
                  />
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Repeat</label>
                  <div className="mb-3">
                    <div className="flex gap-2 flex-wrap mb-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, recurrenceType: 'once' })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          formData.recurrenceType === 'once'
                            ? 'bg-blue-900 text-white'
                            : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        One Time
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'interval', label: 'Every X Days' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, recurrenceType: type.value })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            formData.recurrenceType === type.value
                              ? 'bg-blue-900 text-white'
                              : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.recurrenceType === 'weekly' && (
                    <div>
                      <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Select days:</label>
                      <div className="flex gap-2 flex-wrap">
                        {weekDays.map((day, idx) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              formData.days.includes(idx)
                                ? 'bg-blue-900 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recurrenceType === 'monthly' && (
                    <div>
                      <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Select day(s) of month:</label>
                      <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleMonthlyDay(day)}
                            className={`aspect-square rounded-lg font-medium text-sm transition ${
                              formData.monthlyDays.includes(day)
                                ? 'bg-blue-900 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recurrenceType === 'interval' && (
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Every how many days?</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.intervalDays}
                          onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) || 1 })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start date:</label>
                          <button type="button" onClick={() => setFormData({ ...formData, startDate: getTodayString() })} className="text-xs px-2 py-0.5 rounded-full border border-indigo-300 text-indigo-400 font-medium hover:bg-indigo-900 transition">Today</button>
                        </div>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                        />
                      </div>
                    </div>
                  )}

                  {formData.recurrenceType === 'once' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select date:</label>
                        <button type="button" onClick={() => setFormData({ ...formData, startDate: getTodayString() })} className="text-xs px-2 py-0.5 rounded-full border border-indigo-300 text-indigo-400 font-medium hover:bg-indigo-900 transition">Today</button>
                      </div>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Category</label>
                  <div className="flex gap-2 flex-wrap max-h-44 overflow-y-auto pr-1">
                    {allCategories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.name })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          formData.category === cat.name
                            ? cat.color + ' ring-2 ring-offset-1 ring-indigo-400'
                            : cat.color + ' opacity-50 hover:opacity-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: null })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        formData.category === null
                          ? 'bg-gray-200 text-gray-700 border-gray-300 ring-2 ring-offset-1 ring-indigo-400'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReminder(null);
                      setFormData({ 
                        task: '', 
                        time: '12:00', 
                        days: [], 
                        category: undefined,
                        recurrenceType: 'once',
                        monthlyDays: [],
                        intervalDays: 1,
                        startDate: '',
                        lastTriggered: null
                      });
                    }}
                    className={`px-6 py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition border border-blue-600"
                  >
                    {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-contain`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Manage Categories</h2>
                <button type="button" onClick={() => {
                  setShowCategoryManager(false);
                  setShowCategoryForm(false);
                }} className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <X size={24} />
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => setShowCategoryForm(true)} 
                className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 mb-4"
              >
                <Plus size={20} />
                <span>Add New Category</span>
              </button>

              {showCategoryForm && (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 mb-4`}>
                  <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>New Category</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'border-gray-200'}`}
                    />
                    <button type="button" onClick={() => {
                      addCustomCategory();
                      setShowCategoryForm(false);
                    }} className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition border border-blue-600">
                      Add
                    </button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} className={`px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>All Categories:</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allCategories.map((category) => (
                    <div key={category.name} className={`flex items-center justify-between p-3 rounded-lg transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <span className={`px-3 py-1 rounded-md text-sm font-semibold border ${category.color}`}>
                        {category.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(category)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Delete Confirmation Modal */}
        {deleteConfirmState.show && deleteConfirmState.reminder ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Delete Reminder?</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to delete "<strong>{deleteConfirmState.reminder.task}</strong>"?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Import Confirmation Modal */}
        {importModalState.show && importModalState.data ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Import Reminders</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Found <strong>{importModalState.data.reminders.length} reminders</strong> to import. 
                How would you like to proceed?
              </p>
              {isProcessing ? (
                <div className="flex flex-col items-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{processingMessage || 'Processing...'}</p>
                </div>
              ) : importModalState.confirmReplace ? (
                <div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                    This will permanently delete all <strong>{reminders.length} existing reminders</strong> and replace them. This cannot be undone.
                  </p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleImportReplace}
                      className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                    >
                      Yes, Replace Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportModalState({ ...importModalState, confirmReplace: false })}
                      className={`w-full py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleImportAdd}
                    className="w-full bg-blue-900 text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition border border-blue-600"
                  >
                    Add to Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportModalState({ ...importModalState, confirmReplace: true })}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                  >
                    Replace All Existing
                  </button>
                  <button
                    type="button"
                    onClick={cancelImport}
                    className={`w-full py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Category Delete Confirmation Modal */}
        {categoryToDelete ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Delete Category?</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to delete "<strong>{categoryToDelete.name}</strong>"? Reminders using this category will need to be reassigned.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => deleteCategory(categoryToDelete.name, categoryToDelete.default)}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Reset App Confirmation Modal */}
        {showResetConfirm ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Reset App?</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                This will permanently delete <strong>all {reminders.length} reminders</strong>, <strong>{customCategories.length} custom categories</strong>, and <strong>all statistics</strong> including your delivered count. 
                This action cannot be undone.
              </p>
              {isProcessing ? (
                <div className="flex flex-col items-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-3"></div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{processingMessage || 'Resetting app...'}</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetApp}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                  >
                    Reset App
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Retention Change Confirmation Modal */}
        {retentionConfirm ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Delete Old Reminders?</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Changing to <strong>"{retentionConfirm.label}"</strong> will permanently delete{' '}
                <strong>{retentionConfirm.count} one-time reminder{retentionConfirm.count !== 1 ? 's' : ''}</strong> that {retentionConfirm.count !== 1 ? 'are' : 'is'} past this limit. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setOneTimeRetention(retentionConfirm.newValue);
                    await saveRetentionSetting(retentionConfirm.newValue);
                    const cleaned = await cleanupExpiredReminders(retentionConfirm.newValue, reminders);
                    setReminders(cleaned);
                    setRetentionConfirm(null);
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
                >
                  Delete {retentionConfirm.count}
                </button>
                <button
                  type="button"
                  onClick={() => setRetentionConfirm(null)}
                  className={`flex-1 py-3 rounded-xl font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Processing Overlay for Direct Import */}
        {isProcessing && !importModalState.show && !showResetConfirm ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-hidden">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 max-w-sm w-full`}>
              <div className="flex flex-col items-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{processingMessage}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-sm w-full max-h-[85vh] flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500 p-2 rounded-xl">
                  <Bell className="text-white" size={20} />
                </div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Welcome!</h2>
              </div>
              <button type="button" onClick={dismissTutorial} className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={22} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-6 pb-6 space-y-5 flex-1">

              {/* Step 1 */}
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Adding a Reminder</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Tap the <span className="font-semibold text-indigo-500">+</span> button at the bottom to create a reminder. Give it a name, pick a category, set a time, and choose how often it repeats.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recurrence Types</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Choose how a reminder repeats: <span className="font-medium">Daily</span>, <span className="font-medium">Weekly</span> (pick specific days), <span className="font-medium">Monthly</span> (pick dates), <span className="font-medium">Every X Days</span>, or <span className="font-medium">One Time</span> for a single date.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-pink-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-pink-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Categories</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Organize reminders using the built-in categories or create your own. Visit the <span className="font-semibold">Categories</span> tab to see all reminders grouped by type, or manage them under Settings.
                </p>
              </div>

              {/* Step 4 */}
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Marking & Skipping</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  On the Home tab, tap the <span className="font-semibold text-green-600">✓</span> to mark a reminder done for today, or the <span className="font-semibold text-orange-500">⟳</span> to skip it. Completed and skipped reminders reset automatically the next day.
                </p>
              </div>

              {/* Step 5 */}
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Back Up Your Data</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your reminders are stored locally on this device. Use <span className="font-semibold">Settings → Export</span> to save a backup file, and <span className="font-semibold">Import</span> to restore it on any device.
                </p>
              </div>

            </div>

            {/* Footer button */}
            <div className="p-6 pt-4 flex-shrink-0 space-y-3">
              <button
                type="button"
                onClick={dismissTutorial}
                className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition border border-blue-600"
              >
                Got it, let's go!
              </button>
              <a
                href="https://alphadeltastudios.com/simple-reminders-help/"
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3 rounded-xl text-center text-sm transition border ${darkMode ? 'border-blue-800 text-blue-300 hover:bg-blue-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Full User Guide →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        fabPressed={fabPressed}
        setFabPressed={setFabPressed}
        showForm={showForm}
        setShowForm={setShowForm}
      />
    </div>
  );
}