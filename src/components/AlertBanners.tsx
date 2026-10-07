import React from 'react';
import { TelemetryPoint, AlertThresholds } from '../types/telemetry';
import { AlertOctagon, AlertTriangle, ShieldCheck, Zap, ArrowRight, Bot, Volume2, VolumeX } from 'lucide-react';

interface AlertBannersProps {
  current: TelemetryPoint;
  thresholds: AlertThresholds;
  onConsultAI: (reason: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AlertBanners: React.FC<AlertBannersProps> = ({
  current,
  thresholds,
  onConsultAI,
  soundEnabled,
  onToggleSound,
}) => {
  const alerts = [];

  // Check Radiation Threshold (> 0.50 mSv)
  if (current.radiation_exposure_mSv > thresholds.radiation_max_mSv) {
    alerts.push({
      id: 'rad-alert',
      type: 'critical',
      title: 'CRITICAL: Solar Particle Event / Ionizing Radiation Anomaly',
      metric: `${current.radiation_exposure_mSv.toFixed(2)} mSv`,
      threshold: `${thresholds.radiation_max_mSv.toFixed(2)} mSv`,
      message: `Active dosimeter exceeds safe ceiling by +${(((current.radiation_exposure_mSv - thresholds.radiation_max_mSv) / thresholds.radiation_max_mSv) * 100).toFixed(0)}%. Acute proton flux detected aboard current compartment.`,
      action: 'Execute Level-2 Storm Haven relocation to shielded core module. Seal non-essential hatches.',
      consultPrompt: `CRITICAL ALERT: Dosimeter reading spiked to ${current.radiation_exposure_mSv} mSv (safe threshold: 0.50 mSv). Provide urgent radiation sickness prophylaxis and module shielding protocol.`,
    });
  }

  // Check Stress Threshold (> 7.0)
  if (current.stress_level_1to10 > thresholds.stress_max) {
    alerts.push({
      id: 'stress-alert',
      type: 'warning',
      title: 'CAUTION: Neurological & Sympathetic Stress Threshold Breach',
      metric: `${current.stress_level_1to10.toFixed(1)} / 10`,
      threshold: `${thresholds.stress_max.toFixed(1)} / 10`,
      message: `High psychophysiological overload detected during ${current.activity_state || 'mission operation'}. Risk of cognitive tunneling, spatial disorientation, and arrhythmia.`,
      action: 'Initiate biofeedback pacing, confirm suit pCO2 levels < 3.0 mmHg, and enforce 15-minute operational pause.',
      consultPrompt: `ALERT: Astronaut stress level reached ${current.stress_level_1to10}/10 with heart rate at ${current.heart_rate_bpm} bpm. Diagnose possible hypercapnia, hypoxia, or acute EVA strain.`,
    });
  }

  // Check Hypoxia (< 95%)
  if (current.oxygen_saturation_pct < thresholds.oxygen_min_pct) {
    alerts.push({
      id: 'hypoxia-alert',
      type: 'critical',
      title: 'CRITICAL: Hypoxia Threat / Low Oxygen Saturation',
      metric: `${current.oxygen_saturation_pct}% SpO2`,
      threshold: `≥ ${thresholds.oxygen_min_pct}%`,
      message: `Peripheral oxygen saturation dropped below safe threshold. Check cabin partial pressure of O2 and verify breathing loop integrity.`,
      action: 'Switch to emergency 100% O2 metabolic mask. Inspect cabin atmospheric scrubbers.',
      consultPrompt: `URGENT: SpO2 dropped to ${current.oxygen_saturation_pct}%. Immediate hypoxia evaluation and breathing loop troubleshooting.`,
    });
  }

  // Check Severe Tachycardia (> 120 bpm at non-exercise state)
  if (current.heart_rate_bpm > 120 && !current.activity_state?.toLowerCase().includes('treadmill') && !current.activity_state?.toLowerCase().includes('exercise')) {
    alerts.push({
      id: 'tachycardia-alert',
      type: 'warning',
      title: 'ADVISORY: Tachycardia in Non-Exercise Operational Phase',
      metric: `${current.heart_rate_bpm} bpm`,
      threshold: `< 100 bpm resting`,
      message: `Sustained elevated heart rate outside of physical countermeasures. Correlates with elevated diastolic pressure (${current.diastolic_bp} mmHg).`,
      action: 'Assess hydration status, body temperature, and administer vagal breathing maneuver.',
      consultPrompt: `ADVISORY: Resting tachycardia at ${current.heart_rate_bpm} bpm with BP ${current.systolic_bp}/${current.diastolic_bp} mmHg. Investigate microgravity cardiovascular deconditioning.`,
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">
              Telemetry Status: Nominal Safety Envelope
            </h4>
            <p className="text-xs text-emerald-400/80">
              All biometrics, ionizing radiation rates, and psychophysiological markers are within NASA standard tolerances.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            title={soundEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isCritical = alert.type === 'critical';
        return (
          <div
            key={alert.id}
            className={`border rounded-xl p-4 shadow-xl transition-all duration-300 ${
              isCritical
                ? 'bg-rose-950/40 border-rose-500/70 shadow-rose-950/50'
                : 'bg-amber-950/40 border-amber-500/70 shadow-amber-950/50'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-lg border mt-0.5 shrink-0 ${
                    isCritical
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {isCritical ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm font-bold tracking-wide uppercase ${
                        isCritical ? 'text-rose-200' : 'text-amber-200'
                      }`}
                    >
                      {alert.title}
                    </h4>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-900/60 text-rose-200 border-rose-700/60'
                          : 'bg-amber-900/60 text-amber-200 border-amber-700/60'
                      }`}
                    >
                      Value: {alert.metric} (Limit: {alert.threshold})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-200">Protocol Action:</span>
                    <span className={isCritical ? 'text-rose-300' : 'text-amber-300'}>
                      {alert.action}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => onConsultAI(alert.consultPrompt)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-900/50'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Ask SpaceMed AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
