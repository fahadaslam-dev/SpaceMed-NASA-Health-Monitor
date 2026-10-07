import React, { useState } from 'react';
import { TelemetryPoint } from '../types/telemetry';
import { Activity, Radio, AlertTriangle, Flame, Clock } from 'lucide-react';

interface TelemetryChartsProps {
  data: TelemetryPoint[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  radiationThreshold?: number;
  stressThreshold?: number;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  data,
  selectedIndex,
  onSelectIndex,
  radiationThreshold = 0.50,
  stressThreshold = 7.0,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hr' | 'radiation' | 'stress'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Chart Dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scales
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;

  // Heart Rate scale (range: 50 - 150)
  const hrMin = 50;
  const hrMax = 150;
  const getHrY = (val: number) => {
    const clamped = Math.max(hrMin, Math.min(hrMax, val));
    return padding.top + innerHeight - ((clamped - hrMin) / (hrMax - hrMin)) * innerHeight;
  };

  // Radiation scale (range: 0 - 1.0 mSv)
  const radMin = 0;
  const radMax = 1.0;
  const getRadY = (val: number) => {
    const clamped = Math.max(radMin, Math.min(radMax, val));
    return padding.top + innerHeight - ((clamped - radMin) / (radMax - radMin)) * innerHeight;
  };

  // Stress scale (range: 0 - 10)
  const stressMin = 0;
  const stressMax = 10;
  const getStressY = (val: number) => {
    const clamped = Math.max(stressMin, Math.min(stressMax, val));
    return padding.top + innerHeight - ((clamped - stressMin) / (stressMax - stressMin)) * innerHeight;
  };

  // Helper for generating smooth or polyline path
  const makePath = (getY: (val: number) => number, key: keyof TelemetryPoint) => {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key] as number).toFixed(1)}`)
      .join(' ');
  };

  const makeArea = (getY: (val: number) => number, key: keyof TelemetryPoint) => {
    const linePath = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key] as number).toFixed(1)}`)
      .join(' ');
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const baselineY = padding.top + innerHeight;
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[selectedIndex];
  const activePointIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h3 className="text-base font-semibold text-slate-100 tracking-wide">
              Biometric & Environmental Time-Series (24-Hour Mission Window)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized telemetry with safety threshold monitoring. Click any node to inspect mission timestamp.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Vital Dual Axis
          </button>
          <button
            onClick={() => setActiveTab('hr')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'hr'
                ? 'bg-rose-950/60 text-rose-300 shadow-sm border border-rose-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Heart Rate (bpm)
          </button>
          <button
            onClick={() => setActiveTab('radiation')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'radiation'
                ? 'bg-amber-950/60 text-amber-300 shadow-sm border border-amber-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Radiation (mSv)
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'stress'
                ? 'bg-purple-950/60 text-purple-300 shadow-sm border border-purple-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stress Index
          </button>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ minWidth: '600px' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="radGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerHeight * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeOpacity="0.4"
                />
              </g>
            );
          })}

          {/* Threshold Lines */}
          {(activeTab === 'all' || activeTab === 'radiation') && (
            <g>
              {/* Radiation Safety Line: 0.50 mSv */}
              <line
                x1={padding.left}
                y1={getRadY(radiationThreshold)}
                x2={width - padding.right}
                y2={getRadY(radiationThreshold)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.8"
              />
              <text
                x={width - padding.right - 6}
                y={getRadY(radiationThreshold) - 5}
                fill="#f59e0b"
                fontSize="10"
                textAnchor="end"
                fontWeight="600"
              >
                RAD LIMIT (0.50 mSv)
              </text>
            </g>
          )}

          {(activeTab === 'all' || activeTab === 'stress') && (
            <g>
              {/* Stress Critical Line: 7.0 */}
              <line
                x1={padding.left}
                y1={getStressY(stressThreshold)}
                x2={width - padding.right}
                y2={getStressY(stressThreshold)}
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
              <text
                x={padding.left + 8}
                y={getStressY(stressThreshold) - 5}
                fill="#c084fc"
                fontSize="9"
                fontWeight="500"
              >
                STRESS LIMIT (7.0)
              </text>
            </g>
          )}

          {/* X Axis Time Labels */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 8}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
              >
                {formatTime(d.timestamp)}
              </text>
            );
          })}

          {/* Y Axis Left (Heart Rate) */}
          {(activeTab === 'all' || activeTab === 'hr') && (
            <g>
              {[60, 90, 120, 150].map((bpm) => (
                <text
                  key={bpm}
                  x={padding.left - 8}
                  y={getHrY(bpm) + 3}
                  fill="#f43f5e"
                  fontSize="10"
                  textAnchor="end"
                >
                  {bpm}
                </text>
              ))}
              <text
                x={padding.left - 8}
                y={padding.top - 10}
                fill="#f43f5e"
                fontSize="9"
                fontWeight="600"
                textAnchor="end"
              >
                HR (bpm)
              </text>
            </g>
          )}

          {/* Y Axis Right (Radiation) */}
          {(activeTab === 'all' || activeTab === 'radiation') && (
            <g>
              {[0.1, 0.4, 0.7, 1.0].map((mSv) => (
                <text
                  key={mSv}
                  x={width - padding.right + 6}
                  y={getRadY(mSv) + 3}
                  fill="#f59e0b"
                  fontSize="10"
                  textAnchor="start"
                >
                  {mSv.toFixed(1)}
                </text>
              ))}
              <text
                x={width - padding.right + 6}
                y={padding.top - 10}
                fill="#f59e0b"
                fontSize="9"
                fontWeight="600"
                textAnchor="start"
              >
                mSv
              </text>
            </g>
          )}

          {/* Y Axis for Stress when solo */}
          {activeTab === 'stress' && (
            <g>
              {[2, 4, 6, 8, 10].map((val) => (
                <text
                  key={val}
                  x={padding.left - 8}
                  y={getStressY(val) + 3}
                  fill="#a855f7"
                  fontSize="10"
                  textAnchor="end"
                >
                  {val}
                </text>
              ))}
              <text
                x={padding.left - 8}
                y={padding.top - 10}
                fill="#a855f7"
                fontSize="9"
                fontWeight="600"
                textAnchor="end"
              >
                STRESS (1-10)
              </text>
            </g>
          )}

          {/* AREA & LINE: Heart Rate */}
          {(activeTab === 'all' || activeTab === 'hr') && (
            <g>
              <path d={makeArea(getHrY, 'heart_rate_bpm')} fill="url(#hrGradient)" />
              <path
                d={makePath(getHrY, 'heart_rate_bpm')}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* AREA & LINE: Radiation */}
          {(activeTab === 'all' || activeTab === 'radiation') && (
            <g>
              <path d={makeArea(getRadY, 'radiation_exposure_mSv')} fill="url(#radGradient)" />
              <path
                d={makePath(getRadY, 'radiation_exposure_mSv')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* AREA & LINE: Stress */}
          {(activeTab === 'all' || activeTab === 'stress') && (
            <g>
              <path d={makeArea(getStressY, 'stress_level_1to10')} fill="url(#stressGradient)" />
              <path
                d={makePath(getStressY, 'stress_level_1to10')}
                fill="none"
                stroke="#c084fc"
                strokeWidth={activeTab === 'stress' ? '2.5' : '1.5'}
                strokeDasharray={activeTab === 'all' ? '2 2' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Scrubber Crosshair Line */}
          <line
            x1={getX(activePointIndex)}
            y1={padding.top}
            x2={getX(activePointIndex)}
            y2={padding.top + innerHeight}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Data Points / Interaction Nodes */}
          {data.map((d, i) => {
            const isAnomaly = d.radiation_exposure_mSv > radiationThreshold || d.stress_level_1to10 > stressThreshold;
            const isSelected = i === selectedIndex;
            const x = getX(i);
            const hrY = getHrY(d.heart_rate_bpm);
            const radY = getRadY(d.radiation_exposure_mSv);

            return (
              <g
                key={i}
                className="cursor-pointer"
                onClick={() => onSelectIndex(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible large hit area */}
                <rect
                  x={x - 12}
                  y={padding.top}
                  width="24"
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Heart Rate Node */}
                {(activeTab === 'all' || activeTab === 'hr') && (
                  <circle
                    cx={x}
                    cy={hrY}
                    r={isSelected ? 5.5 : 3.5}
                    fill={d.heart_rate_bpm > 115 ? '#ef4444' : '#f43f5e'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* Radiation Node */}
                {(activeTab === 'all' || activeTab === 'radiation') && (
                  <circle
                    cx={x}
                    cy={radY}
                    r={isSelected ? 5.5 : 3.5}
                    fill={d.radiation_exposure_mSv > radiationThreshold ? '#f97316' : '#f59e0b'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}

                {/* Anomaly Beacon on top */}
                {isAnomaly && (
                  <g transform={`translate(${x}, ${padding.top - 8})`}>
                    <polygon
                      points="0,-6 6,4 -6,4"
                      fill="#ef4444"
                      className="animate-pulse"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Timestamp Inspection Bar */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Mission Time: {new Date(activePoint.timestamp).toUTCString().slice(17, 22)} UTC</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Activity: <strong className="text-slate-200">{activePoint.activity_state || 'Nominal'}</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">HR:</span>
            <span className="font-semibold text-rose-400">{activePoint.heart_rate_bpm} bpm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">Rad:</span>
            <span className={`font-semibold ${activePoint.radiation_exposure_mSv > radiationThreshold ? 'text-amber-400 font-bold underline' : 'text-slate-200'}`}>
              {activePoint.radiation_exposure_mSv.toFixed(2)} mSv
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-slate-400">Stress:</span>
            <span className={`font-semibold ${activePoint.stress_level_1to10 > stressThreshold ? 'text-purple-400 font-bold underline' : 'text-slate-200'}`}>
              {activePoint.stress_level_1to10.toFixed(1)}/10
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SpO2:</span>
            <span className="font-semibold text-cyan-300">{activePoint.oxygen_saturation_pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
