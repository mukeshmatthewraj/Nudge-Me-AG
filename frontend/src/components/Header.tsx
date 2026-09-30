'use client';

import React from 'react';
import { 
  Bell, 
  BellRing, 
  MapPin, 
  CloudRain, 
  Sun, 
  Moon,
  Cloud, 
  Snowflake, 
  Smartphone, 
  Maximize2 
} from 'lucide-react';
import { requestNotificationPermission } from '@/services/notifications';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  currentLat?: number | null;
  currentLng?: number | null;
  currentWeather?: string | null;
  currentTemp?: number | null;
  hasNotificationPermission: boolean;
  onNotificationPermissionChange: (granted: boolean) => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onUseRealGps?: () => void;
  isRealGps?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLat,
  currentLng,
  currentWeather,
  currentTemp,
  hasNotificationPermission,
  onNotificationPermissionChange,
  isPhoneFrame,
  onTogglePhoneFrame,
  onUseRealGps,
  isRealGps,
}) => {
  const { theme, toggleTheme } = useTheme();

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    onNotificationPermissionChange(granted);
  };

  const getWeatherIcon = () => {
    switch (currentWeather) {
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5" />;
      case 'snow':
        return <Snowflake className="w-3.5 h-3.5" />;
      case 'clouds':
        return <Cloud className="w-3.5 h-3.5" />;
      case 'clear':
      default:
        return <Sun className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white/80 dark:bg-black/80 transition-colors">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-sm tracking-tighter border border-neutral-300 dark:border-neutral-700 shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                NudgeMe
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Live Context Telemetry & Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {/* GPS Chip */}
          <button 
            type="button"
            onClick={onUseRealGps}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              isRealGps 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent shadow-sm' 
                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
            title={isRealGps ? 'Using Real Device GPS (Tap to refresh)' : 'Simulated GPS (Tap to detect Real Device GPS)'}
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[65px]">
              {currentLat ? `${currentLat.toFixed(2)}, ${currentLng?.toFixed(2)}` : 'GPS'}
            </span>
          </button>

          {/* Weather Chip */}
          <div 
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 capitalize"
            title={`Weather: ${currentWeather || 'Clear'}, ${currentTemp !== null && currentTemp !== undefined ? `${currentTemp}°C` : ''}`}
          >
            {getWeatherIcon()}
            <span>{currentTemp !== null && currentTemp !== undefined ? `${Math.round(currentTemp)}°` : '22°'}</span>
          </div>

          {/* Notification Permission Bell */}
          <button
            onClick={handleRequestPermission}
            title={hasNotificationPermission ? 'Notifications Enabled' : 'Enable Notifications'}
            className={`p-1.5 rounded-full border transition-all ${
              hasNotificationPermission 
                ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white' 
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white bg-transparent animate-pulse'
            }`}
          >
            {hasNotificationPermission ? (
              <BellRing className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {/* Device Frame View Switcher (Desktop preview) */}
          <button
            onClick={onTogglePhoneFrame}
            title={isPhoneFrame ? 'Fullscreen' : 'Phone Shell'}
            className="p-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-900 transition-all hidden md:flex items-center justify-center"
          >
            {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
