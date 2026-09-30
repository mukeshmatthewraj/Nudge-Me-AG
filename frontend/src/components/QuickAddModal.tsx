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

  // Voice speech-to-text toggle
  const toggleVoice = () => {
    if (isListening) {
      voiceService.stop();
      setIsListening(false);
    } else {
      voiceService.start(
        (transcript: string, isFinal: boolean) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
          }
        },
        (error: string) => {
          console.warn('Speech recognition error:', error);
          setIsListening(false);
        }
      );
      setIsListening(true);
    }
  };

  // Debounced NLP Parse trigger when user finishes speaking or typing
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 4) {
      setParsedData(null);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setIsParsing(true);
      try {
        const res = await api.parseNLP(
          inputText,
          currentLat || undefined,
          currentLng || undefined
        );
        setParsedData(res);
        
        // Auto-fill editable fields with AI predictions
        if (res.title) setTitle(res.title);
        if (res.detail) setDetail(res.detail);
        if (res.trigger_type) setTriggerType(res.trigger_type);
        if (res.priority) setPriority(res.priority);
        if (res.address) setAddress(res.address);
        if (res.latitude) setLatitude(res.latitude);
        if (res.longitude) setLongitude(res.longitude);
        if (res.radius_meters) setRadiusMeters(res.radius_meters);
        if (res.weather_condition) setWeatherCondition(res.weather_condition);
        if (res.time_text) setTimeText(res.time_text);
      } catch (err) {
        console.warn('NLP parsing error:', err);
      } finally {
        setIsParsing(false);
      }
    }, 700);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [inputText, currentLat, currentLng]);

  // Geocoding search handler for manual address input
  const handleSearchAddress = async (q: string) => {
    setAddressQuery(q);
    setAddress(q);
    if (!q || q.length < 3) {
      setSearchResults([]);
      setShowAddressDropdown(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const results = await api.geocode(q);
      setSearchResults(results);
      setShowAddressDropdown(results.length > 0);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = (item: { display_name: string; latitude: number; longitude: number }) => {
    setAddress(item.display_name);
    setAddressQuery(item.display_name);
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setShowAddressDropdown(false);
  };

  const setPresetLocation = (name: string, lat: number, lng: number) => {
    setAddress(name);
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !inputText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: ReminderCreateInput = {
        title: title.trim() || inputText.trim(),
        detail: detail.trim() || undefined,
        trigger_type: triggerType,
        priority,
        address: address || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        radius_meters: radiusMeters,
        weather_condition: weatherCondition || undefined,
        time_text: timeText || undefined,
      };

      await api.createReminder(payload);

      // Celebrate creation with subtle confetti
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#000000', '#71717a', '#ffffff']
        });
      } catch {
        // quiet ignore
      }

      // Reset form
      setInputText('');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                Smart Context Nudge
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Natural language & deterministic rule engine
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Natural Language Voice & Text Input Box */}
          <div className="relative rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 shadow-inner focus-within:border-black dark:focus-within:border-white transition-colors">
            <div className="flex items-start space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Say or type e.g. 'Remind me to buy groceries when near store and it is raining High priority'"
                rows={3}
                className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  isListening 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse' 
                    : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90'
                }`}
                title={isListening ? 'Stop Listening' : 'Voice Input (Web Speech API)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Voice Waveform Visualizer & Parsing indicator */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
              {isListening ? (
                <div className="flex items-center space-x-2 text-rose-500 font-medium">
                  <span className="flex space-x-1 items-end h-4">
                    <span className="w-1 bg-rose-500 rounded-full wave-bar-1 inline-block"></span>
                    <span className="w-1 bg-rose-500 rounded-full wave-bar-2 inline-block"></span>
                    <span className="w-1 bg-rose-500 rounded-full wave-bar-3 inline-block"></span>
                    <span className="w-1 bg-rose-500 rounded-full wave-bar-4 inline-block"></span>
                    <span className="w-1 bg-rose-500 rounded-full wave-bar-5 inline-block"></span>
                  </span>
                  <span className="animate-pulse">Listening to voice...</span>
                </div>
              ) : (
                <div className="text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <span>Speak or type freely</span>
                </div>
              )}

              {isParsing && (
                <div className="flex items-center space-x-1.5 text-neutral-900 dark:text-neutral-100 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Parsing rules...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick NLP Sample Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-neutral-400 dark:text-neutral-500 shrink-0">Try:</span>
            <button
              type="button"
              onClick={() => setInputText("Buy oat milk near Trader Joe's if it's raining High priority")}
              className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors"
            >
              🛒 Trader Joe's + Rain
            </button>
            <button
              type="button"
              onClick={() => setInputText("Pick up prescription at Walgreens pharmacy urgent!")}
              className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors"
            >
              💊 Walgreens Pharmacy
            </button>
            <button
              type="button"
              onClick={() => setInputText("Outdoor workout at 6:00 pm if clear weather")}
              className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors"
            >
              🏃 Workout + Clear
            </button>
          </div>

          {/* Extracted Entity Preview Card */}
          <div className="rounded-2xl p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center space-x-1">
                <Tag className="w-3 h-3" />
                <span>Extracted Conditions</span>
              </span>
              {parsedData && (
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {Math.round(parsedData.confidence * 100)}% match
                </span>
              )}
            </div>

            {/* Title & Detail inputs */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  Nudge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Buy Oat Milk"
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-black dark:focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  Notes / Detail (Optional)
                </label>
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="e.g. Unsweetened carton"
                  className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>
            </div>

            {/* Condition Badges Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Trigger Type Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                  className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-black dark:focus:border-white"
                >
                  <option value="location">📍 Location Only</option>
                  <option value="time">⏰ Time Only</option>
                  <option value="weather">🌧️ Weather Only</option>
                  <option value="combined">⚡ Combined Rules</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                  Priority
                </label>
                <div className="flex space-x-1 mt-0.5">
                  {(['Low', 'Medium', 'High'] as PriorityType[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        priority === p
                          ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location & Radius settings */}
            {(triggerType === 'location' || triggerType === 'combined') && (
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>Target Place / Address</span>
                  </span>
                  <span className="font-mono">Radius: {radiusMeters}m</span>
                </label>

                {/* Address Geocoding Search */}
                <div className="relative">
                  <div className="flex items-center space-x-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={addressQuery || address}
                        onChange={(e) => handleSearchAddress(e.target.value)}
                        placeholder="Search address or place name..."
                        className="w-full px-3 py-1.5 pr-8 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-50 focus:outline-none focus:border-black dark:focus:border-white"
                      />
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Geocode Search Results Dropdown */}
                  {showAddressDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-36 overflow-y-auto">
                      {searchResults.map((item, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => handleSelectAddress(item)}
                          className="w-full text-left px-3 py-2 text-[11px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 truncate block"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Preset Places */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-neutral-400 shrink-0">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Trader Joe's", 37.7749, -122.4194)}
                    className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0"
                  >
                    Trader Joe's
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Walgreens Pharmacy", 37.7760, -122.4150)}
                    className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0"
                  >
                    Walgreens
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("Home", 37.7735, -122.4180)}
                    className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0"
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
                    className="w-full accent-black dark:accent-white h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300 shrink-0 w-12 text-right">
                    {radiusMeters}m
                  </span>
                </div>
              </div>
            )}

            {/* Weather condition */}
            {(triggerType === 'weather' || triggerType === 'combined') && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider flex items-center space-x-1">
                  <CloudRain className="w-3 h-3" />
                  <span>Weather Prerequisite</span>
                </label>
                <div className="flex space-x-1.5">
                  {['rain', 'clear', 'snow', 'clouds'].map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setWeatherCondition(weatherCondition === w ? null : w)}
                      className={`flex-1 py-1.5 rounded-xl text-xs capitalize transition-colors border ${
                        weatherCondition === w
                          ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-bold'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
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
            className="w-full py-3 px-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all hover:opacity-90 disabled:opacity-50"
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
