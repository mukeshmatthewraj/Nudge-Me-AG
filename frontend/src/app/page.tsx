'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { RemindersList } from '@/components/RemindersList';
import { RadarMap } from '@/components/RadarMap';
import { HistoryArchive } from '@/components/HistoryArchive';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { QuickAddModal } from '@/components/QuickAddModal';
import { Reminder } from '@/types';
import { api } from '@/services/api';
import { dispatchNotification } from '@/services/notifications';

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('nudges');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Real-time Context State
  const [userLat, setUserLat] = useState<number>(37.7749);
  const [userLng, setUserLng] = useState<number>(-122.4194);
  const [isRealGps, setIsRealGps] = useState<boolean>(false);
  const [currentWeather, setCurrentWeather] = useState<string>('clear');
  const [currentTemp, setCurrentTemp] = useState<number>(21);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // Fetch live weather based on coordinates
  const fetchLiveWeather = useCallback(async (lat: number, lng: number) => {
    try {
      const w = await api.getWeather(lat, lng);
      if (w && w.condition) {
        setCurrentWeather(w.condition);
        setCurrentTemp(Math.round(w.temperature_c));
      }
    } catch {
      // quiet fail
    }
  }, []);

  // Detect real device / computer GPS location
  const handleDetectRealGps = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setIsRealGps(true);
          fetchLiveWeather(lat, lng);
        },
        (err) => {
          alert('Could not retrieve device location: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Geolocation is not supported by your browser/device.');
    }
  }, [fetchLiveWeather]);

  // Fetch reminders
  const loadReminders = useCallback(async () => {
    try {
      const data = await api.getReminders();
      if (data.length === 0) {
        // Auto-seed initial demo items so user has rich immediate context
        const seeded = await api.seedDemo();
        setReminders(seeded);
      } else {
        setReminders(data);
      }
    } catch (err) {
      console.warn('Failed to load reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Background context evaluation loop (runs periodically every 30s)
  useEffect(() => {
    const runBackgroundEvaluation = async () => {
      try {
        const result = await api.evaluateContext({
          latitude: userLat,
          longitude: userLng,
          weather_condition: currentWeather,
          temperature_c: currentTemp,
        }, true);

        if (result.triggered_count > 0) {
          result.triggered_reminders.forEach((r) => {
            const detail = result.trigger_details.find((d) => d.reminder_id === r.id);
            const reasonText = detail?.reasons.join(' • ') || 'Conditions met!';
            dispatchNotification(r.title, reasonText, r.id);
          });
          loadReminders();
        }
      } catch (err) {
        // quiet background fail
      }
    };

    const interval = setInterval(runBackgroundEvaluation, 30000);
    return () => clearInterval(interval);
  }, [userLat, userLng, currentWeather, currentTemp, loadReminders]);

  // Initial load
  useEffect(() => {
    loadReminders();
    fetchLiveWeather(userLat, userLng);

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }

    // Auto-detect GPS if available
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setIsRealGps(true);
          fetchLiveWeather(lat, lng);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [loadReminders, fetchLiveWeather, userLat, userLng]);

  const activeRemindersCount = reminders.filter((r) => r.status === 'active').length;

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-50 flex flex-col items-center justify-start antialiased transition-colors duration-200">
      {/* Mobile Handset Container Wrapper */}
      <div 
        className={`w-full transition-all duration-300 ${
          isPhoneFrame 
            ? 'max-w-md my-0 sm:my-6 min-h-screen sm:min-h-[844px] rounded-none sm:rounded-[44px] border-0 sm:border-[8px] sm:border-neutral-300 dark:sm:border-neutral-800 shadow-2xl relative overflow-hidden bg-white dark:bg-black flex flex-col' 
            : 'max-w-xl min-h-screen bg-white dark:bg-black flex flex-col'
        }`}
      >
        {/* Device Dynamic Island / Speaker Notch (phone frame mode) */}
        {isPhoneFrame && (
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-neutral-100 dark:bg-neutral-950">
            <div className="w-24 h-4 bg-neutral-200 dark:bg-neutral-900 rounded-full flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-700"></span>
              <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600"></span>
            </div>
          </div>
        )}

        {/* Top Header & Context Telemetry */}
        <Header
          currentLat={userLat}
          currentLng={userLng}
          currentWeather={currentWeather}
          currentTemp={currentTemp}
          hasNotificationPermission={hasNotificationPermission}
          onNotificationPermissionChange={setHasNotificationPermission}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          isRealGps={isRealGps}
          onUseRealGps={handleDetectRealGps}
        />

        {/* Dynamic Main View */}
        <div className="flex-1 p-4 pb-24 overflow-y-auto">
          {activeTab === 'nudges' && (
            <RemindersList
              reminders={reminders}
              currentLat={userLat}
              currentLng={userLng}
              onRefresh={loadReminders}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'radar' && (
            <RadarMap
              reminders={reminders}
              userLat={userLat}
              userLng={userLng}
              onSelectCoordinates={(lat, lng) => {
                setUserLat(lat);
                setUserLng(lng);
                setIsRealGps(false);
                fetchLiveWeather(lat, lng);
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryArchive
              reminders={reminders}
              onRefresh={loadReminders}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          activeNudgeCount={activeRemindersCount}
        />

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={loadReminders}
          currentLat={userLat}
          currentLng={userLng}
        />
      </div>
    </main>
  );
}
