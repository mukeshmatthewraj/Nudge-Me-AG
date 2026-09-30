'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { RemindersList } from '@/components/RemindersList';
import { RadarMap } from '@/components/RadarMap';
import { ContextSimulator } from '@/components/ContextSimulator';
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
  
  // Real-time or Simulated Context State
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
      // ignore
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

    // Try detecting device GPS if available
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Keep default if user is far or let user simulate, but record accuracy
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [loadReminders, fetchLiveWeather, userLat, userLng]);

  const activeRemindersCount = reminders.filter((r) => r.status === 'active').length;

  return (
    <main className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-indigo-500/30">
      {/* Mobile Handset Container Wrapper */}
      <div 
        className={`w-full transition-all duration-300 ${
          isPhoneFrame 
            ? 'max-w-md my-0 sm:my-6 min-h-screen sm:min-h-[844px] rounded-none sm:rounded-[44px] border-0 sm:border-[8px] sm:border-slate-800 shadow-2xl relative overflow-hidden bg-[#0a0f1d] flex flex-col' 
            : 'max-w-xl min-h-screen bg-[#0a0f1d] flex flex-col'
        }`}
      >
        {/* Device Dynamic Island / Speaker Notch (phone frame mode) */}
        {isPhoneFrame && (
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-slate-900/50">
            <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-slate-800"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500/40"></span>
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
        <div className="flex-1 p-4 overflow-y-auto">
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

          {activeTab === 'simulator' && (
            <ContextSimulator
              currentLat={userLat}
              currentLng={userLng}
              onUpdateLocation={(lat, lng) => {
                setUserLat(lat);
                setUserLng(lng);
                setIsRealGps(false);
                fetchLiveWeather(lat, lng);
              }}
              currentWeather={currentWeather}
              onUpdateWeather={setCurrentWeather}
              currentTemp={currentTemp}
              onUpdateTemp={setCurrentTemp}
              onRefreshReminders={loadReminders}
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
