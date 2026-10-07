import React, { useState, useRef, useEffect } from 'react';
import { TelemetryPoint, AstronautProfile, ChatMessage } from '../types/telemetry';
import { Bot, Send, User, Sparkles, RefreshCw, AlertCircle, ShieldAlert, CheckCircle, ChevronDown, Flame, Waves, ShieldCheck } from 'lucide-react';

interface SpaceMedChatProps {
  currentTelemetry: TelemetryPoint;
  astronaut: AstronautProfile;
  prefillQuery?: string;
  onClearPrefill?: () => void;
}

export const SpaceMedChat: React.FC<SpaceMedChatProps> = ({
  currentTelemetry,
  astronaut,
  prefillQuery,
  onClearPrefill,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 🩺 Onboard Chief Medical Intelligence Active
SpaceMed AI standing by for **${astronaut.name}** (${astronaut.callsign}) aboard ${astronaut.mission}.

Real-time microgravity telemetry feed synchronized. I monitor hemodynamic fluid shifts, radiation dosimetry, metabolic workload, and psychophysiological strain.

*You can query symptoms, trigger automated anomaly triage, or request EVA operational clearance.*`,
      timestamp: new Date().toISOString(),
      triageLevel: 'NOMINAL',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachTelemetry, setAttachTelemetry] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Handle incoming prefilled query from alert banner
  useEffect(() => {
    if (prefillQuery) {
      sendMessage(prefillQuery);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillQuery]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const parseTriageLevel = (text: string): 'NOMINAL' | 'ADVISORY' | 'CAUTION' | 'CRITICAL' => {
    const upper = text.toUpperCase();
    if (upper.includes('CRITICAL')) return 'CRITICAL';
    if (upper.includes('CAUTION')) return 'CAUTION';
    if (upper.includes('ADVISORY')) return 'ADVISORY';
    return 'NOMINAL';
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      telemetrySnapshot: attachTelemetry ? currentTelemetry : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/spacemed-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          telemetry: attachTelemetry ? currentTelemetry : null,
          astronaut: astronaut,
          conversationHistory: messages.slice(-5),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Medical diagnostic uplink failed');
      }

      const triage = parseTriageLevel(data.response);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        triageLevel: triage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `### ⚠️ SpaceMed Uplink Interruption\nUnable to reach primary neural model: ${err.message}.\n\nLocal Heuristic Recommendation: Immediately verify physical dosimeter and SpO2 pulse oximeter. In case of acute decompensation, contact Mission Control flight surgeon via UHF S-band backup.`,
        timestamp: new Date().toISOString(),
        triageLevel: 'CAUTION',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'Autonomous Anomaly Scan',
      icon: Sparkles,
      prompt: `Perform a comprehensive anomaly scan of current biometrics: Heart Rate ${currentTelemetry.heart_rate_bpm} bpm, Radiation ${currentTelemetry.radiation_exposure_mSv} mSv, Stress ${currentTelemetry.stress_level_1to10}/10, SpO2 ${currentTelemetry.oxygen_saturation_pct}%. Identify any mission risks.`,
    },
    {
      label: 'EVA Clearance Check',
      icon: ShieldCheck,
      prompt: `Evaluate astronaut ${astronaut.name} for upcoming Extravehicular Activity (EVA). Assess decompression sickness (DCS) risk, prebreathe readiness, and cardiovascular stability under microgravity suit pressures.`,
    },
    {
      label: 'Microgravity Fluid Shift & SANS',
      icon: Waves,
      prompt: `Analyze astronaut ${astronaut.name} (${astronaut.daysInSpace} days in space) for cephalad fluid shift, Spaceflight-Associated Neuro-ocular Syndrome (SANS), intracranial pressure, and optical disc swelling.`,
    },
    {
      label: 'Radiation Event Protocol',
      icon: Flame,
      prompt: `Dosimeter reading is currently ${currentTelemetry.radiation_exposure_mSv} mSv. What are the specific storm shelter containment protocols, water-wall positioning, and pharmacological countermeasures?`,
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col h-[650px] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                SpaceMed AI Assistant
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                GEMINI-3.8-FLASH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Aerospace Chief Medical Officer · Mission Flight Surgeon Link
            </p>
          </div>
        </div>

        {/* Telemetry attachment toggle */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none hover:text-white">
            <input
              type="checkbox"
              checked={attachTelemetry}
              onChange={(e) => setAttachTelemetry(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px]">Sync Live Vitals</span>
          </label>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
          Quick Triage:
        </span>
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700/80 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-950/60 border border-cyan-700/60 text-slate-100 shadow-md'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 shadow-xl'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60 text-[11px]">
                  <span className={`font-semibold flex items-center gap-1.5 ${isUser ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-cyan-400" />}
                    {isUser ? `${astronaut.name} (${astronaut.callsign})` : 'SpaceMed Onboard Medical Officer'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {msg.triageLevel && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          msg.triageLevel === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : msg.triageLevel === 'CAUTION'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : msg.triageLevel === 'ADVISORY'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {msg.triageLevel}
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  </div>
                </div>

                {/* Attached telemetry badge if present */}
                {msg.telemetrySnapshot && (
                  <div className="mb-2 p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-slate-300">
                    <div>HR: <strong className="text-rose-400">{msg.telemetrySnapshot.heart_rate_bpm} bpm</strong></div>
                    <div>Rad: <strong className="text-amber-400">{msg.telemetrySnapshot.radiation_exposure_mSv.toFixed(2)} mSv</strong></div>
                    <div>Stress: <strong className="text-purple-300">{msg.telemetrySnapshot.stress_level_1to10.toFixed(1)}/10</strong></div>
                    <div>SpO2: <strong className="text-cyan-300">{msg.telemetrySnapshot.oxygen_saturation_pct}%</strong></div>
                  </div>
                )}

                {/* Content rendering with line breaks / sections */}
                <div className="space-y-2 whitespace-pre-line text-slate-200">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Synthesizing microgravity biometrics and executing clinical triage...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Describe symptoms or ask SpaceMed AI (e.g. "I feel sinus pressure, headache, and nausea")...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
        >
          <span>Transmit</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
