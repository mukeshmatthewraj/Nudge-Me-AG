'use client';

import React from 'react';
import { 
  Bell, 
  BellRing, 
  MapPin, 
  CloudRain, 
  Sun, 
  Cloud, 
  Snowflake, 
  Smartphone, 
  Maximize2 
} from 'lucide-react';
import { requestNotificationPermission } from '@/services/notifications';

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
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    onNotificationPermissionChange(granted);
  };

  const getWeatherIcon = () => {
    switch (currentWeather) {
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" />;
      case 'snow':
        return <Snowflake className="w-3.5 h-3.5 text-blue-300" />;
      case 'clouds':
        return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      case 'clear':
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/30">
            <span className="text-white font-black text-sm tracking-tighter">N</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                NudgeMe
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Mobile
              </span>
            </div>
          </div>
        </div>

        {/* Live Context Telemetry Chips */}
        <div className="flex items-center space-x-2">
          {/* GPS Chip */}
          <button 
            type="button"
            onClick={onUseRealGps}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
              isRealGps 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                : 'glass-pill text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={isRealGps ? 'Using Real Device GPS (Click to refresh)' : 'Simulated GPS (Click to detect Real Device GPS)'}
          >
            <MapPin className={`w-3 h-3 ${isRealGps ? 'text-emerald-400' : 'text-indigo-400'} shrink-0`} />
            <span className="truncate max-w-[70px]">
              {currentLat ? `${currentLat.toFixed(2)}, ${currentLng?.toFixed(2)}` : 'GPS'}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isRealGps ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </button>

          {/* Weather Chip */}
          <div 
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-[11px] font-medium glass-pill text-slate-300 capitalize"
            title={`Weather: ${currentWeather || 'Clear'}, ${currentTemp !== null && currentTemp !== undefined ? `${currentTemp}°C` : ''}`}
          >
            {getWeatherIcon()}
            <span>{currentTemp !== null && currentTemp !== undefined ? `${Math.round(currentTemp)}°` : '22°'}</span>
          </div>

          {/* Notification Permission Bell */}
          <button
            onClick={handleRequestPermission}
            title={hasNotificationPermission ? 'Native Notifications Enabled' : 'Enable Notifications'}
            className={`p-1.5 rounded-full transition-all ${
              hasNotificationPermission 
                ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' 
                : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 animate-pulse'
            }`}
          >
            {hasNotificationPermission ? (
              <BellRing className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {/* Device Frame View Switcher (Desktop preview convenience) */}
          <button
            onClick={onTogglePhoneFrame}
            title={isPhoneFrame ? 'Switch to Fullscreen' : 'Switch to Mobile Phone Shell'}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all hidden md:flex items-center justify-center"
          >
            {isPhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
