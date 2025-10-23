import React, { useState, useEffect, useRef } from 'react';
import { Moon, Rocket, Clock, Play, Pause, Save, Settings } from 'lucide-react';

const PLANETS = {
  moon: {
    name: 'Moon',
    emoji: '🌕',
    totalKm: 384400,
    kmPerMinute: 10,
    totalMinutes: 38440,
    gradient: 'from-slate-900 via-blue-900 to-purple-900',
    accentColor: 'bg-blue-400',
    textColor: 'text-blue-300',
    description: 'A cozy short-term journey'
  },
  mars: {
    name: 'Mars',
    emoji: '🔴',
    totalKm: 225000000,
    kmPerMinute: 500,
    totalMinutes: 450000,
    gradient: 'from-gray-900 via-red-900 to-orange-900',
    accentColor: 'bg-red-400',
    textColor: 'text-red-300',
    description: 'An ambitious medium-term goal'
  },
  saturn: {
    name: 'Saturn',
    emoji: '🪐',
    totalKm: 1400000000,
    kmPerMinute: 3500,
    totalMinutes: 400000,
    gradient: 'from-indigo-950 via-purple-900 to-pink-900',
    accentColor: 'bg-purple-400',
    textColor: 'text-purple-300',
    description: 'The ultimate long-term odyssey'
  }
};

const LunaLog = () => {
  const [selectedPlanet, setSelectedPlanet] = useState('moon');
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSessionMinutes, setCurrentSessionMinutes] = useState(0);
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [mood, setMood] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [showAiMessage, setShowAiMessage] = useState(false);
  const timerRef = useRef(null);

  const planet = PLANETS[selectedPlanet];
  const progressKm = totalMinutes * planet.kmPerMinute;
  const progressPercent = Math.min((progressKm / planet.totalKm) * 100, 100);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await window.storage.get('lunalog-data');
        if (data) {
          const parsed = JSON.parse(data.value);
          setSelectedPlanet(parsed.selectedPlanet || 'moon');
          setTotalMinutes(parsed.totalMinutes || 0);
          setSessions(parsed.sessions || []);
        }
      } catch (error) {
        console.log('No previous data found, starting fresh');
      }
    };
    loadData();
  }, []);

  // Save data to storage
  const saveData = async (planet, minutes, sessionList) => {
    try {
      await window.storage.set('lunalog-data', JSON.stringify({
        selectedPlanet: planet,
        totalMinutes: minutes,
        sessions: sessionList
      }));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setCurrentSessionSeconds(prev => {
          if (prev === 59) {
            setCurrentSessionMinutes(m => m + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const completeSession = async (minutes, moodText) => {
    const newTotalMinutes = totalMinutes + minutes;
    const newSession = {
      id: Date.now(),
      minutes,
      mood: moodText,
      date: new Date().toISOString(),
      planet: selectedPlanet,
      kmTraveled: minutes * planet.kmPerMinute
    };
    
    const newSessions = [newSession, ...sessions].slice(0, 10);
    
    setTotalMinutes(newTotalMinutes);
    setSessions(newSessions);
    await saveData(selectedPlanet, newTotalMinutes, newSessions);
    
    // Generate AI message
    generateAIMessage(minutes, moodText, progressPercent);
    
    // Reset timer
    setCurrentSessionMinutes(0);
    setCurrentSessionSeconds(0);
    setMood('');
    setIsTimerRunning(false);
    setShowSessionForm(false);
  };

  const generateAIMessage = (minutes, moodText, progress) => {
    const messages = [
      `Beautiful work, space traveler! You've just journeyed ${(minutes * planet.kmPerMinute).toLocaleString()} km closer to ${planet.name}. ${progress.toFixed(1)}% of your voyage complete. The stars are proud of you. ✨`,
      `Another ${minutes} minutes of focused exploration! You're ${progress.toFixed(1)}% of the way to ${planet.name}. Every session brings you closer to your cosmic destination. Keep going! 🚀`,
      `What a stellar session! ${(minutes * planet.kmPerMinute).toLocaleString()} km traveled through the knowledge cosmos. You're making incredible progress toward ${planet.name}. ${moodText ? `Feeling ${moodText}? That's part of the journey!` : ''} 🌟`,
      `Your dedication lights up the universe! With ${progress.toFixed(1)}% of the journey complete, ${planet.name} is getting closer with each passing minute. You're doing amazing! 🌠`,
      `${minutes} more minutes of cosmic exploration logged! The path to ${planet.name} is illuminated by your consistent effort. Keep shining, astronaut! ✨`
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    setAiMessage(message);
    setShowAiMessage(true);
    
    setTimeout(() => setShowAiMessage(false), 8000);
  };

  const saveTimerSession = () => {
    if (currentSessionMinutes > 0 || currentSessionSeconds >= 30) {
      const totalMins = currentSessionMinutes + (currentSessionSeconds >= 30 ? 1 : 0);
      completeSession(totalMins, mood);
    }
  };

  const saveManualSession = () => {
    const mins = parseInt(manualMinutes);
    if (mins > 0) {
      completeSession(mins, mood);
      setManualMinutes('');
    }
  };

  const changePlanet = async (newPlanet) => {
    setSelectedPlanet(newPlanet);
    await saveData(newPlanet, totalMinutes, sessions);
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${planet.gradient} text-white p-6 relative overflow-hidden`}>
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center justify-center gap-3">
            <Moon className="w-10 h-10" />
            LunaLog
          </h1>
          <p className="text-gray-300 text-lg">Your cozy journey through the cosmos of knowledge</p>
        </div>

        {/* AI Message Toast */}
        {showAiMessage && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 max-w-md shadow-2xl animate-fade-in z-50">
            <p className="text-white text-center">{aiMessage}</p>
          </div>
        )}

        {/* Planet Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Choose Your Destination
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(PLANETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => changePlanet(key)}
                className={`p-4 rounded-2xl transition-all ${
                  selectedPlanet === key
                    ? 'bg-white/30 border-2 border-white scale-105'
                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="text-4xl mb-2">{p.emoji}</div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-gray-300 mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{planet.emoji}</div>
            <h2 className="text-3xl font-bold mb-2">Journey to {planet.name}</h2>
            <p className="text-gray-300">
              {progressKm.toLocaleString()} km / {planet.totalKm.toLocaleString()} km
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-8 bg-white/20 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full ${planet.accentColor} transition-all duration-500 flex items-center justify-end pr-3`}
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 5 && (
                <Rocket className="w-5 h-5 text-white animate-pulse" />
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold ${planet.textColor}">
              {progressPercent.toFixed(2)}% Complete
            </p>
            <p className="text-gray-300 mt-2">
              {totalMinutes.toLocaleString()} minutes studied · {(planet.totalMinutes - totalMinutes).toLocaleString()} minutes to go
            </p>
          </div>
        </div>

        {/* Timer/Session Logger */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Live Timer */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Live Timer
            </h3>
            
            <div className="text-5xl font-mono text-center my-8">
              {formatTime(currentSessionMinutes, currentSessionSeconds)}
            </div>

            <div className="flex gap-3 mb-4">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}
              
              <button
                onClick={saveTimerSession}
                disabled={currentSessionMinutes === 0 && currentSessionSeconds < 30}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Complete
              </button>
            </div>

            <input
              type="text"
              placeholder="How are you feeling? (optional)"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400"
            />
          </div>

          {/* Manual Entry */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Log Session Manually</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Minutes studied</label>
                <input
                  type="number"
                  placeholder="30"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl text-center"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Mood (optional)</label>
                <input
                  type="text"
                  placeholder="Focused and energized"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <button
                onClick={saveManualSession}
                disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Session
              </button>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Recent Voyages</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-2xl mr-2">{PLANETS[session.planet].emoji}</span>
                      <span className="font-semibold">{session.minutes} minutes</span>
                      <span className="text-gray-300 text-sm ml-2">
                        · {session.kmTraveled.toLocaleString()} km
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>
                  {session.mood && (
                    <p className="text-sm text-gray-300 italic">"{session.mood}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LunaLog;