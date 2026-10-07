import React from 'react';
import { TelemetryPoint, AlertThresholds } from '../types/telemetry';
import { Activity, Wind, Radio, Brain, Thermometer, HeartPulse, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface MetricCardsProps {
  current: TelemetryPoint;
  thresholds: AlertThresholds;
  baselineHR?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ current, thresholds, baselineHR = 62 }) => {
  // Evaluation logic
  const isRadCritical = current.radiation_exposure_mSv > thresholds.radiation_max_mSv;
  const isStressCritical = current.stress_level_1to10 > thresholds.stress_max;
  const isHypoxia = current.oxygen_saturation_pct < thresholds.oxygen_min_pct;
  const isHrElevated = current.heart_rate_bpm > thresholds.hr_max_bpm;
  const isHrLow = current.heart_rate_bpm < thresholds.hr_min_bpm;
  const isBpElevated = current.systolic_bp > thresholds.systolic_max;
  const isTempElevated = current.body_temp_C > thresholds.temp_max_C;

  const metrics = [
    {
      id: 'hr',
      label: 'Heart Rate',
      value: `${current.heart_rate_bpm}`,
      unit: 'bpm',
      icon: Activity,
      color: isHrElevated ? 'rose' : isHrLow ? 'amber' : 'emerald',
      status: isHrElevated ? 'Elevated' : isHrLow ? 'Bradycardia' : 'Nominal',
      detail: `Resting Baseline: ${baselineHR} bpm`,
      isAlert: isHrElevated || isHrLow,
      subtext: isHrElevated ? `+${current.heart_rate_bpm - baselineHR} bpm over baseline` : 'Cardiovascular steady state',
    },
    {
      id: 'spo2',
      label: 'Oxygen Saturation',
      value: `${current.oxygen_saturation_pct}`,
      unit: '% SpO2',
      icon: Wind,
      color: isHypoxia ? 'red' : 'cyan',
      status: isHypoxia ? 'Hypoxia Warning' : 'Optimal',
      detail: `Safe limit: ≥ ${thresholds.oxygen_min_pct}%`,
      isAlert: isHypoxia,
      subtext: isHypoxia ? 'Suit/Cabin O2 scrubber inspection required' : 'Tissue oxygenation nominal',
    },
    {
      id: 'radiation',
      label: 'Radiation Exposure',
      value: `${current.radiation_exposure_mSv.toFixed(2)}`,
      unit: 'mSv',
      icon: Radio,
      color: isRadCritical ? 'amber' : 'sky',
      status: isRadCritical ? 'SPE ALERT (>0.50)' : 'Shielded',
      detail: `Threshold: ${thresholds.radiation_max_mSv} mSv`,
      isAlert: isRadCritical,
      subtext: isRadCritical ? 'Solar Particle Event flux detected' : 'Standard galactic background',
    },
    {
      id: 'stress',
      label: 'Neurological Stress',
      value: `${current.stress_level_1to10.toFixed(1)}`,
      unit: '/ 10',
      icon: Brain,
      color: isStressCritical ? 'purple' : 'indigo',
      status: isStressCritical ? 'Acute Distress (>7)' : 'Nominal Coping',
      detail: `Threshold: ${thresholds.stress_max} / 10`,
      isAlert: isStressCritical,
      subtext: isStressCritical ? 'Autonomic sympathovagal imbalance' : 'Mental fatigue metrics balanced',
    },
    {
      id: 'bp',
      label: 'Blood Pressure',
      value: `${current.systolic_bp} / ${current.diastolic_bp}`,
      unit: 'mmHg',
      icon: HeartPulse,
      color: isBpElevated ? 'amber' : 'teal',
      status: isBpElevated ? 'Hypertensive' : 'Normotensive',
      detail: `Upper limit: ${thresholds.systolic_max} mmHg`,
      isAlert: isBpElevated,
      subtext: isBpElevated ? 'Microgravity cephalad pressure surge' : 'Vascular compliance nominal',
    },
    {
      id: 'temp',
      label: 'Core Body Temp',
      value: `${current.body_temp_C.toFixed(1)}`,
      unit: '°C',
      icon: Thermometer,
      color: isTempElevated ? 'rose' : 'emerald',
      status: isTempElevated ? 'Hyperthermia' : 'Euthermic',
      detail: `Baseline: 36.5 - 37.2°C`,
      isAlert: isTempElevated,
      subtext: isTempElevated ? 'Metabolic or suit thermoregulation spike' : 'Thermoregulation balanced',
    },
  ];

  const getColorClasses = (color: string, isAlert: boolean) => {
    if (isAlert) {
      if (color === 'red' || color === 'rose') {
        return {
          border: 'border-rose-500/60 shadow-rose-950/40',
          bg: 'bg-rose-950/20',
          badgeText: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 border-rose-500/30',
          valColor: 'text-rose-400',
          iconColor: 'text-rose-400',
        };
      }
      if (color === 'amber') {
        return {
          border: 'border-amber-500/60 shadow-amber-950/40',
          bg: 'bg-amber-950/20',
          badgeText: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 border-amber-500/30',
          valColor: 'text-amber-400',
          iconColor: 'text-amber-400',
        };
      }
      if (color === 'purple') {
        return {
          border: 'border-purple-500/60 shadow-purple-950/40',
          bg: 'bg-purple-950/20',
          badgeText: 'text-purple-400',
          badgeBg: 'bg-purple-500/10 border-purple-500/30',
          valColor: 'text-purple-300',
          iconColor: 'text-purple-400',
        };
      }
    }
    return {
      border: 'border-slate-800 shadow-slate-950/50',
      bg: 'bg-slate-900/70',
      badgeText: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
      valColor: 'text-slate-100',
      iconColor: 'text-cyan-400',
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {metrics.map((m) => {
        const Icon = m.icon;
        const styles = getColorClasses(m.color, m.isAlert);

        return (
          <div
            key={m.id}
            className={`relative rounded-xl p-4 border transition-all duration-200 backdrop-blur-md shadow-lg ${styles.bg} ${styles.border}`}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {m.label}
              </span>
              <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 ${styles.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle: Big Value */}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight font-mono ${styles.valColor}`}>
                {m.value}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {m.unit}
              </span>
            </div>

            {/* Status indicator row */}
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {m.isAlert ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className={`font-semibold ${styles.badgeText}`}>
                  {m.status}
                </span>
              </div>
            </div>

            {/* Bottom context / Subtext */}
            <p className="mt-2 text-[11px] text-slate-400 leading-tight border-t border-slate-800/60 pt-2 truncate" title={m.subtext}>
              {m.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
