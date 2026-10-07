import React, { useState } from 'react';
import { Code, Copy, Check, Download, FileText, X } from 'lucide-react';
import rawTelemetry from '../data/telemetryData.json';

interface BlueprintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlueprintExportModal: React.FC<BlueprintExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dataset' | 'dashboard' | 'route'>('dataset');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const datasetSnippet = JSON.stringify(rawTelemetry, null, 2);

  const routeSnippet = `// app/api/spacemed-ai/route.ts (Next.js App Router)
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client with AI Studio telemetry identifier
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" }
  }
});

const SPACEMED_SYSTEM_INSTRUCTION = \`You are 'SpaceMed AI', the autonomous Onboard Chief Medical Officer & Telemetry Intelligence System for NASA Deep Space exploration missions (Artemis Program, Deep Space Gateway, Mars Transit).

Your duty is to safeguard astronaut health in isolated, high-radiation, and microgravity environments.

CLINICAL SPACE MEDICINE CRITERIA:
1. Microgravity Fluid Shifts: Cephalad fluid redistribution causes venous engorgement, SANS (Spaceflight-Associated Neuro-ocular Syndrome), altered hemodynamics.
2. Radiation Threshold: Safe background < 0.20 mSv/hr. Dosimeter readings > 0.50 mSv trigger active Solar Particle Event (SPE) emergency shelters.
3. Stress Index: Scale 1-10. Values > 7.0 indicate acute operational or autonomic strain.
4. Hypoxia: SpO2 < 95% indicates life-support loop or suit scrubber anomalies.

RESPONSE FORMAT:
### 🩺 Triage Assessment
State Level: [NOMINAL | ADVISORY | CAUTION | CRITICAL]

### 🔍 Physiological Analysis
Root cause breakdown of biometrics under spaceflight dynamics.

### ⚡ Immediate Countermeasures
Actionable protocol steps for crew or Medical Officer.

### 📋 Flight Surgeon Mission Note
Operational restrictions, EVA clearance, or Earth telemetry sync.\`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, telemetry, astronaut } = await req.json();

    let telemetryContext = "";
    if (telemetry) {
      telemetryContext = \`
[CURRENT TELEMETRY SNAPSHOT]
- Timestamp: \${telemetry.timestamp}
- Heart Rate: \${telemetry.heart_rate_bpm} bpm
- BP: \${telemetry.systolic_bp}/\${telemetry.diastolic_bp} mmHg
- SpO2: \${telemetry.oxygen_saturation_pct}%
- Radiation: \${telemetry.radiation_exposure_mSv} mSv (Threshold: 0.50 mSv)
- Stress Level: \${telemetry.stress_level_1to10}/10 (Threshold: 7.0)
- Body Temp: \${telemetry.body_temp_C}°C
- Notes: \${telemetry.notes || "None"}\`;
    }

    const fullPrompt = \`\${telemetryContext}\\n\\n[ASTRONAUT INQUIRY / CHIEF COMPLAINT]\\n\${prompt}\`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: SPACEMED_SYSTEM_INSTRUCTION,
        temperature: 0.25,
      },
    });

    return NextResponse.json({
      success: true,
      response: response.text,
      model: "gemini-3.8-flash",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "SpaceMed diagnostic failed", details: error.message },
      { status: 500 }
    );
  }
}`;

  const dashboardSnippet = `// components/AstronautDashboard.tsx
import React, { useState } from 'react';
import telemetryData from '@/data/telemetryData.json';

export default function AstronautDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = telemetryData[selectedIndex];

  const isRadiationAnomaly = current.radiation_exposure_mSv > 0.50;
  const isStressAnomaly = current.stress_level_1to10 > 7.0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Alert Banners */}
      {isRadiationAnomaly && (
        <div className="mb-6 p-4 bg-rose-950/80 border border-rose-500 rounded-xl text-rose-200">
          <strong className="font-bold">CRITICAL RADIATION ALERT: </strong>
          Current exposure is {current.radiation_exposure_mSv} mSv (exceeds 0.50 mSv threshold).
          Initiate storm shelter protocol immediately.
        </div>
      )}

      {isStressAnomaly && (
        <div className="mb-6 p-4 bg-purple-950/80 border border-purple-500 rounded-xl text-purple-200">
          <strong className="font-bold">CAUTION: HIGH STRESS: </strong>
          Neurological stress index is {current.stress_level_1to10}/10 (exceeds 7.0 limit).
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Heart Rate</div>
          <div className="text-2xl font-bold text-rose-400">{current.heart_rate_bpm} bpm</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Oxygen Saturation</div>
          <div className="text-2xl font-bold text-cyan-400">{current.oxygen_saturation_pct}%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Radiation Exposure</div>
          <div className="text-2xl font-bold text-amber-400">{current.radiation_exposure_mSv} mSv</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Stress Index</div>
          <div className="text-2xl font-bold text-purple-400">{current.stress_level_1to10}/10</div>
        </div>
      </div>

      {/* Interactive Time-series selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h3 className="text-sm font-semibold mb-3">24-Hour Mission Telemetry Timeline</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {telemetryData.map((point, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={\`px-3 py-1.5 rounded text-xs whitespace-nowrap \${
                index === selectedIndex ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }\`}
            >
              {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}`;

  const currentCode =
    activeTab === 'dataset'
      ? datasetSnippet
      : activeTab === 'dashboard'
      ? dashboardSnippet
      : routeSnippet;

  const currentFilename =
    activeTab === 'dataset'
      ? 'telemetryData.json'
      : activeTab === 'dashboard'
      ? 'AstronautDashboard.tsx'
      : 'route.ts';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                NASA Space Apps Challenge Technical Blueprint
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-use production modules for astronaut health monitoring in deep space missions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection & actions */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'dataset'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. telemetryData.json (24h Array)
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. AstronautDashboard.tsx
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'route'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. route.ts (SpaceMed API)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/90 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="select-all">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Fully compliant with NASA Space Apps Challenge specifications & TypeScript standards.</span>
          <span className="font-semibold text-slate-400">{currentFilename}</span>
        </div>
      </div>
    </div>
  );
};
