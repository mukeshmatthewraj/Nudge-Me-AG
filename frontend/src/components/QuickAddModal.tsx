'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  MapPin, 
  Clock, 
  CloudRain, 
  Sliders, 
  Check, 
  Loader2,
  Search,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/services/api';
import { voiceService } from '@/services/speech';
import { NLPParsingResponse, TriggerType, PriorityType, ReminderCreateInput } from '@/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentLat?: number | null;
  currentLng?: number | null;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  currentLat,
  currentLng,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extracted entities state
  const [parsedData, setParsedData] = useState<NLPParsingResponse | null>(null);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('time');
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const [timeText, setTimeText] = useState<string | null>(null);

  // Address geocode search results
  const [addressQuery, setAddressQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; latitude: number; longitude: number }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger parsing when inputText changes (debounced by 450ms)
  useEffect(() => {
    if (!inputText || inputText.trim().length < 4) {
      setParsedData(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsParsing(true);
      try {
        const res = await api.parseNLP(inputText, currentLat ?? undefined, currentLng ?? undefined);
        setParsedData(res);
        setTitle(res.title);
        setDetail(res.detail || '');
        setTriggerType(res.trigger_type);
        setPriority(res.priority);
        if (res.address) {
          setAddress(res.address);
          // If coords not returned by NLP, we can leave them for geocoding or user set
        }
        if (res.radius_meters) setRadiusMeters(res.radius_meters);
        if (res.weather_condition) setWeatherCondition(res.weather_condition);
        if (res.time_text) setTimeText(res.time_text);
      } catch (err) {
        console.warn('NLP parsing error', err);
      } finally {
        setIsParsing(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [inputText, currentLat, currentLng]);

  // Voice recognition toggle
  const toggleVoice = () => {
    if (isListening) {
      voiceService.stop();
      setIsListening(false);
    } else {
      const started = voiceService.start(
        (transcript) => {
          setInputText(transcript);
        },
        (error) => {
          console.warn('Voice error:', error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      setIsListening(started);
    }
  };

  // Search address geocoding
  const handleSearchAddress = async (q: string) => {
    setAddressQuery(q);
    if (!q || q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const results = await api.geocode(q);
      setSearchResults(results);
      setShowAddressDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = (item: { display_name: string; latitude: number; longitude: number }) => {
    setAddress(item.display_name.split(',')[0]);
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setShowAddressDropdown(false);
    setSearchResults([]);
    if (triggerType === 'time') {
      setTriggerType('location');
    }
  };

  // Preset location quick setter
  const setPresetLocation = (name: string, lat: number, lng: number) => {
    setAddress(name);
    setLatitude(lat);
    setLongitude(lng);
    if (triggerType === 'time') {
      setTriggerType('location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !inputText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: ReminderCreateInput = {
        title: title.trim() || inputText.trim().slice(0, 50),
        detail: detail.trim() || undefined,
        trigger_type: triggerType,
        priority,
        address: address || undefined,
        latitude: latitude ?? (triggerType === 'location' || triggerType === 'combined' ? (currentLat ?? 37.7749) : undefined),
        longitude: longitude ?? (triggerType === 'location' || triggerType === 'combined' ? (currentLng ?? -122.4194) : undefined),
        radius_meters: radiusMeters,
        weather_condition: weatherCondition || undefined,
        time_text: timeText || undefined,
      };

      await api.createReminder(payload);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
        });
      } catch {}

      // Reset modal state
      setInputText('');
      setParsedData(null);
      setTitle('');
      setDetail('');
      onCreated();
      onClose();
    } catch (err: any) {
      alert(`Error creating reminder: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-panel-elevated rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Smart Context Nudge
              </h2>
              <p className="text-[11px] text-slate-400">
                Gemini extracts time, geofence, and weather triggers
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Natural Language Voice & Text Input Box */}
          <div className="relative rounded-2xl bg-slate-900/80 border border-white/10 p-3 shadow-inner focus-within:border-indigo-500/60 transition-colors">
            <div className="flex items-start space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say or type e.g. 'Remind me to get milk when near Trader Joe's and it is raining ASAP'"
                rows={3}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  isListening 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse' 
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Input (Web Speech API)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Voice Waveform Visualizer & Parsing indicator */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px]">
              {isListening ? (
                <div className="flex items-center space-x-2 text-rose-400">
                  <span className="flex space-x-1 items-end h-4">
                    <span className="w-1 bg-rose-400 rounded-full wave-bar-1 inline-block"></span>
                    <span className="w-1 bg-rose-400 rounded-full wave-bar-2 inline-block"></span>
                    <span className="w-1 bg-rose-400 rounded-full wave-bar-3 inline-block"></span>
                    <span className="w-1 bg-rose-400 rounded-full wave-bar-4 inline-block"></span>
                    <span className="w-1 bg-rose-400 rounded-full wave-bar-5 inline-block"></span>
                  </span>
                  <span className="font-medium animate-pulse">Listening to voice...</span>
                </div>
              ) : (
                <div className="text-slate-500 flex items-center space-x-1">
                  <span>Press mic or type freely</span>
                </div>
              )}

              {isParsing && (
                <div className="flex items-center space-x-1.5 text-indigo-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Gemini NLP parsing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick NLP Sample Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-slate-500 shrink-0">Try:</span>
            <button
              type="button"
              onClick={() => setInputText("Buy oat milk near Trader Joe's if it's raining High priority")}
              className="px-2 py-1 rounded-full glass-pill hover:bg-white/10 text-slate-300 shrink-0 transition-colors"
            >
              🛒 Trader Joe's + Rain
            </button>
            <button
              type="button"
              onClick={() => setInputText("Pick up prescription at Walgreens pharmacy urgent!")}
              className="px-2 py-1 rounded-full glass-pill hover:bg-white/10 text-slate-300 shrink-0 transition-colors"
            >
              💊 Walgreens Pharmacy
            </button>
            <button
              type="button"
              onClick={() => setInputText("Outdoor workout at 6:00 pm if clear weather")}
              className="px-2 py-1 rounded-full glass-pill hover:bg-white/10 text-slate-300 shrink-0 transition-colors"
            >
              🏃 Workout + Clear
            </button>
          </div>

          {/* Extracted Entity Preview Card */}
          <div className="rounded-2xl glass-panel p-3.5 space-y-3 border border-indigo-500/20">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>Extracted Conditions</span>
              </span>
              {parsedData && (
                <span className="text-emerald-400 font-medium">
                  {Math.round(parsedData.confidence * 100)}% match
                </span>
              )}
            </div>

            {/* Title & Detail inputs */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Nudge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Buy Oat Milk"
                  className="w-full mt-0.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Notes / Detail (Optional)
                </label>
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="e.g. Unsweetened carton, Sumatra roast"
                  className="w-full mt-0.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Condition Badges Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Trigger Type Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                  className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="location">📍 Location Only</option>
                  <option value="time">⏰ Time Only</option>
                  <option value="weather">🌧️ Weather Only</option>
                  <option value="combined">⚡ Combined Rules</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Priority
                </label>
                <div className="flex space-x-1 mt-0.5">
                  {(['Low', 'Medium', 'High'] as PriorityType[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        priority === p
                          ? p === 'High'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                            : p === 'Medium'
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-800/80 text-slate-400 border border-white/5 hover:bg-slate-700/50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location & Radius settings if location or combined */}
            {(triggerType === 'location' || triggerType === 'combined') && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>Target Place / Address</span>
                  </span>
                  <span className="text-cyan-400 font-mono">Radius: {radiusMeters}m</span>
                </label>

                {/* Address Geocoding Search */}
                <div className="relative">
                  <div className="flex items-center space-x-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={addressQuery || address}
                        onChange={(e) => handleSearchAddress(e.target.value)}
                        placeholder="Search address or enter place name..."
                        className="w-full px-3 py-1.5 pr-8 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Geocode Search Results Dropdown */}
                  {showAddressDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl bg-slate-900 border border-white/15 shadow-2xl max-h-36 overflow-y-auto">
                      {searchResults.map((item, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => handleSelectAddress(item)}
                          className="w-full text-left px-3 py-2 text-[11px] text-slate-300 hover:bg-indigo-600/30 hover:text-white border-b border-white/5 last:border-b-0 truncate block"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Preset Places */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-slate-500 shrink-0">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Trader Joe's", 37.7749, -122.4194)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 shrink-0"
                  >
                    Trader Joe's
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Walgreens Pharmacy", 37.7760, -122.4150)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 shrink-0"
                  >
                    Walgreens
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Home", 37.7735, -122.4180)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 shrink-0"
                  >
                    Home
                  </button>
                </div>

                {/* Radius Slider */}
                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300 shrink-0 w-12 text-right">
                    {radiusMeters}m
                  </span>
                </div>
              </div>
            )}

            {/* Weather condition if weather or combined */}
            {(triggerType === 'weather' || triggerType === 'combined') && (
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                  <CloudRain className="w-3 h-3 text-cyan-400" />
                  <span>Weather Prerequisite</span>
                </label>
                <div className="flex space-x-1.5">
                  {['rain', 'clear', 'snow', 'clouds'].map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setWeatherCondition(weatherCondition === w ? null : w)}
                      className={`flex-1 py-1 rounded-lg text-xs capitalize transition-colors ${
                        weatherCondition === w
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold'
                          : 'bg-slate-800/80 text-slate-400 border border-white/5 hover:bg-slate-700/50'
                      }`}
                    >
                      {w === 'rain' ? '🌧️ Rain' : w === 'clear' ? '☀️ Clear' : w === 'snow' ? '❄️ Snow' : '⛅ Clouds'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!title.trim() && !inputText.trim())}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Nudge...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Smart Nudge</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
