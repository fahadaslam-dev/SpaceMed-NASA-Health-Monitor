import React, { useState, useEffect } from 'react';
import { TelemetryPoint, AlertThresholds, AstronautProfile } from '../types/telemetry';
import initialTelemetryData from '../data/telemetryData.json';
import { ASTRONAUTS } from '../data/astronauts';
import { MetricCards } from './MetricCards';
import { TelemetryCharts } from './TelemetryCharts';
import { AlertBanners } from './AlertBanners';
import { SpaceMedChat } from './SpaceMedChat';
import { BlueprintExportModal } from './BlueprintExportModal';
import { soundFX } from '../utils/audio';
import {
  Rocket,
  Shield,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Flame,
  Activity,
  UserCheck,
  FileCode2,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Satellite,
  Compass,
  Sliders,
} from 'lucide-react';

export const AstronautDashboard: React.FC = () => {
  // Telemetry state (allow dynamic live mutation/simulation)
  const [telemetrySeries, setTelemetrySeries] = useState<TelemetryPoint[]>(initialTelemetryData);
  const [selectedIndex, setSelectedIndex] = useState<number>(7); // start at radiation anomaly for instant demonstration
  const [selectedAstronaut, setSelectedAstronaut] = useState<AstronautProfile>(ASTRONAUTS[0]);

  // Simulation controls
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);
  const [consultQuery, setConsultQuery] = useState<string>('');

  // Safety thresholds
  const thresholds: AlertThresholds = {
    radiation_max_mSv: 0.50,
    stress_max: 7.0,
    hr_min_bpm: 50,
    hr_max_bpm: 110,
    oxygen_min_pct: 95.0,
    systolic_max: 135,
    temp_max_C: 37.5,
  };

  const currentPoint = telemetrySeries[selectedIndex] || telemetrySeries[0];

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
    if (next) {
      soundFX.playHeartbeat(currentPoint.heart_rate_bpm);
    }
  };

  // Streaming timer simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => {
        const nextIndex = (prev + 1) % telemetrySeries.length;
        if (soundEnabled) {
          const pt = telemetrySeries[nextIndex];
          if (pt.radiation_exposure_mSv > thresholds.radiation_max_mSv || pt.stress_level_1to10 > thresholds.stress_max) {
            soundFX.playAlert();
          } else {
            soundFX.playHeartbeat(pt.heart_rate_bpm);
          }
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming, telemetrySeries, soundEnabled]);

  // Handle manual consultation from alert banners
  const handleConsultFromBanner = (prompt: string) => {
    setConsultQuery(prompt);
  };

  // Anomaly Injection 1: Solar Particle Event (SPE)
  const handleInjectSolarFlare = () => {
    const updated = [...telemetrySeries];
    const newPoint: TelemetryPoint = {
      ...updated[selectedIndex],
      timestamp: new Date().toISOString(),
      radiation_exposure_mSv: 0.88,
      stress_level_1to10: Math.max(updated[selectedIndex].stress_level_1to10, 6.8),
      heart_rate_bpm: Math.max(updated[selectedIndex].heart_rate_bpm, 92),
      activity_state: 'CRITICAL: Injected Solar Particle Event (SPE)',
      notes: 'SIMULATION: Active Coronal Mass Ejection proton flux alert. Shielding required.',
    };
    updated[selectedIndex] = newPoint;
    setTelemetrySeries(updated);
    if (soundEnabled) soundFX.playAlert();
  };

  // Anomaly Injection 2: EVA Physical Exertion Stress
  const handleInjectEVAStress = () => {
    const updated = [...telemetrySeries];
    const newPoint: TelemetryPoint = {
      ...updated[selectedIndex],
      timestamp: new Date().toISOString(),
      heart_rate_bpm: 134,
      systolic_bp: 145,
      diastolic_bp: 94,
      oxygen_saturation_pct: 95.4,
      stress_level_1to10: 8.9,
      body_temp_C: 37.8,
      activity_state: 'SIMULATED: EVA Airlock Distress & Suit Resistance',
      notes: 'SIMULATION: High metabolic workload during extravehicular robotics maneuver.',
    };
    updated[selectedIndex] = newPoint;
    setTelemetrySeries(updated);
    if (soundEnabled) soundFX.playAlert();
  };

  // Reset to original nominal telemetry
  const handleResetTelemetry = () => {
    setTelemetrySeries(initialTelemetryData);
    setSelectedIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Aerospace Mission Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Mission Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950 text-slate-950 font-black">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  NASA Space Apps Challenge
                </span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Telemetry Uplink Online
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                SpaceMed · Astronaut Onboard Health Monitoring
              </h1>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Astronaut profile switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                Crew:
              </span>
              {ASTRONAUTS.map((astro) => (
                <button
                  key={astro.id}
                  onClick={() => setSelectedAstronaut(astro)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedAstronaut.id === astro.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {astro.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Mute vitals beeper' : 'Enable vitals beeper sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Technical Blueprint Export Modal trigger */}
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Blueprint & Code Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Mission Control Body */}
      <main className="max-w-[1700px] mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Astronaut Profile Header Banner */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-inner">
              {selectedAstronaut.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-100">
                  {selectedAstronaut.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {selectedAstronaut.callsign}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300">
                  {selectedAstronaut.role}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Mission: <strong className="text-slate-200">{selectedAstronaut.mission}</strong></span>
                <span>·</span>
                <span>Days in Space: <strong className="text-slate-200">{selectedAstronaut.daysInSpace} days</strong></span>
                <span>·</span>
                <span>Cumulative Ionizing Dose: <strong className="text-amber-300">{selectedAstronaut.cumulativeRadiation_mSv} mSv</strong></span>
                <span>·</span>
                <span>Suit ID: <strong className="text-slate-200">{selectedAstronaut.suitId}</strong></span>
              </div>
            </div>
          </div>

          {/* Simulation & Anomaly Test Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Simulate:
            </span>

            {/* Auto Stream Play/Pause */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                isStreaming
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isStreaming ? 'Pause Stream' : 'Live Stream'}</span>
            </button>

            {/* Solar Flare Spike */}
            <button
              onClick={handleInjectSolarFlare}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Inject radiation spike above 0.50 mSv safe threshold"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Solar Flare Spike</span>
            </button>

            {/* EVA Stress Spike */}
            <button
              onClick={handleInjectEVAStress}
              className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/80 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Inject acute EVA cardiovascular and stress surge"
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>EVA Stress Surge</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetTelemetry}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset telemetry series to nominal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Dynamic Alert Banners Section */}
        <section>
          <AlertBanners
            current={currentPoint}
            thresholds={thresholds}
            onConsultAI={handleConsultFromBanner}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        </section>

        {/* Live Metric Cards Grid */}
        <section>
          <MetricCards
            current={currentPoint}
            thresholds={thresholds}
            baselineHR={selectedAstronaut.baselineVitals.restingHR}
          />
        </section>

        {/* Main 2-Column Split: Telemetry Analytics + SpaceMed AI Assistant */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column (7 Cols): Interactive Charts & Timeline */}
          <div className="xl:col-span-7 space-y-6">
            <TelemetryCharts
              data={telemetrySeries}
              selectedIndex={selectedIndex}
              onSelectIndex={(idx) => setSelectedIndex(idx)}
              radiationThreshold={thresholds.radiation_max_mSv}
              stressThreshold={thresholds.stress_max}
            />

            {/* 24-Hour Timeline Scrubbing Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60">
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                  24-Hour Mission Scrubbing Bar
                </span>
                <span className="text-xs text-slate-400">
                  Select index: <strong className="text-cyan-400">{selectedIndex + 1} of {telemetrySeries.length}</strong>
                </span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {telemetrySeries.map((point, index) => {
                  const isSelected = index === selectedIndex;
                  const isAnomaly =
                    point.radiation_exposure_mSv > thresholds.radiation_max_mSv ||
                    point.stress_level_1to10 > thresholds.stress_max;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                          : isAnomaly
                          ? 'bg-rose-950/30 border-rose-900/80 text-rose-300 hover:bg-rose-950/50'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-mono font-bold flex items-center gap-1">
                        {isAnomaly && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                        {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-[100px] truncate">
                        {point.activity_state || 'Nominal'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols): SpaceMed AI Assistant */}
          <div className="xl:col-span-5">
            <SpaceMedChat
              currentTelemetry={currentPoint}
              astronaut={selectedAstronaut}
              prefillQuery={consultQuery}
              onClearPrefill={() => setConsultQuery('')}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 mt-8">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>NASA Space Apps Challenge 2026</span>
            <span>·</span>
            <span>Astronaut Health Monitoring Software Blueprint</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini 3.8 Flash & @google/genai SDK</span>
            <span>·</span>
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="text-cyan-400 hover:underline font-medium"
            >
              View Blueprint Specs
            </button>
          </div>
        </div>
      </footer>

      {/* Blueprint & Code Export Modal */}
      <BlueprintExportModal
        isOpen={showBlueprintModal}
        onClose={() => setShowBlueprintModal(false)}
      />
    </div>
  );
};
