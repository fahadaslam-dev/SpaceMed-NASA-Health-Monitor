export interface TelemetryPoint {
  timestamp: string;
  heart_rate_bpm: number;
  systolic_bp: number;
  diastolic_bp: number;
  oxygen_saturation_pct: number;
  radiation_exposure_mSv: number;
  stress_level_1to10: number;
  body_temp_C: number;
  activity_state?: string;
  notes?: string;
}

export interface AstronautProfile {
  id: string;
  name: string;
  role: string;
  callsign: string;
  mission: string;
  daysInSpace: number;
  suitId: string;
  bloodType: string;
  avatarSeed: string;
  cumulativeRadiation_mSv: number;
  baselineVitals: {
    restingHR: number;
    baselineBP: string;
    baselineSpO2: number;
  };
}

export interface AlertThresholds {
  radiation_max_mSv: number;
  stress_max: number;
  hr_min_bpm: number;
  hr_max_bpm: number;
  oxygen_min_pct: number;
  systolic_max: number;
  temp_max_C: number;
}

export interface MetricAlert {
  id: string;
  metric: 'radiation' | 'stress' | 'heart_rate' | 'oxygen' | 'blood_pressure' | 'temp';
  severity: 'critical' | 'warning' | 'caution';
  title: string;
  description: string;
  value: number | string;
  threshold: number | string;
  timestamp: string;
  suggestedAction: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  telemetrySnapshot?: TelemetryPoint;
  triageLevel?: 'NOMINAL' | 'ADVISORY' | 'CAUTION' | 'CRITICAL';
}
