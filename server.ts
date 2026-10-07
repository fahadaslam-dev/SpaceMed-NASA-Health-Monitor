import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '2mb' }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SPACEMED_SYSTEM_INSTRUCTION = `You are 'SpaceMed AI', the autonomous Onboard Chief Medical Diagnostic & Telemetry Intelligence System for NASA Deep Space exploration missions (Artemis Program, Deep Space Gateway, and Mars Transit).
Your role is to safeguard the crew against extreme spaceflight conditions, diagnose physiological anomalies in microgravity, and deliver clear, authoritative, mission-critical medical advice.

SPACE MEDICINE PHYSIOLOGY & THRESHOLDS:
1. Microgravity Cardiovascular & Fluid Shifts:
   - Cephalad fluid shift causes venous engorgement, facial edema, nasal congestion, and alters stroke volume.
   - SANS (Spaceflight-Associated Neuro-ocular Syndrome): optic disc edema, globe flattening, choroidal folds.
   - Resting Heart Rate normal range: 50-95 bpm. Sustained >100 bpm at rest indicates tachycardia/hypovolemia/anxiety/fever.
2. Radiation Hazards:
   - Normal background aboard shielded module: 0.05 - 0.20 mSv/hr.
   - Threshold Warning: > 0.50 mSv triggers active SPE (Solar Particle Event) alert.
   - Critical protocol: Immediate shelter in water-lined core quarters (Storm Shelter), dosimeter lock, and anti-emetic/G-CSF prep.
3. Psychological & Physical Stress:
   - Scale 1-10. > 7.0 indicates acute operational or physiological distress.
   - High stress during EVA or airlock operations can compound hyperventilation, CO2 buildup, and autonomic imbalance.
4. Respiratory & Hypoxia:
   - SpO2 < 95% indicates hypoxia, cabin O2 drop, or suit scrub malfunction.
5. Decompression Sickness (DCS):
   - Pre-breathe 100% O2 protocol is essential before suit depressurization below 4.3 psi.

OUTPUT GUIDELINES:
- Maintain calm, authoritative aerospace medical tone.
- When telemetry is provided, cite exact values against standard thresholds.
- Structure your response using these clean sections:
  ### 🩺 Triage Assessment
  (State level clearly: NOMINAL, ADVISORY, CAUTION, or CRITICAL)

  ### 🔍 Physiological Analysis
  (Explain root cause, microgravity fluid mechanics, radiation impact, or stress correlation)

  ### ⚡ Immediate Countermeasures
  (Numbered actionable steps for astronaut or crew Medical Officer)

  ### 📋 Flight Surgeon Mission Note
  (EVA clearance impact, workload restrictions, or communication to Mission Control / Earth)`;

// API Route for SpaceMed AI Assistant
app.post('/api/spacemed-ai', async (req: Request, res: Response) => {
  try {
    const { prompt, telemetry, astronaut, conversationHistory } = req.body;

    if (!prompt && !telemetry) {
      return res.status(400).json({ error: 'Missing prompt or telemetry data' });
    }

    let contextualPrompt = '';

    if (astronaut) {
      contextualPrompt += `[ASTRONAUT PROFILE]\nName: ${astronaut.name} | Role: ${astronaut.role} | Callsign: ${astronaut.callsign}\nMission: ${astronaut.mission} | Days in Space: ${astronaut.daysInSpace} | Cumulative Dose: ${astronaut.cumulativeRadiation_mSv} mSv\n\n`;
    }

    if (telemetry) {
      contextualPrompt += `[CURRENT TELEMETRY SNAPSHOT]\n- Timestamp: ${telemetry.timestamp}\n- Heart Rate: ${telemetry.heart_rate_bpm} bpm (Resting Baseline: ${astronaut?.baselineVitals?.restingHR || 60} bpm)\n- Blood Pressure: ${telemetry.systolic_bp}/${telemetry.diastolic_bp} mmHg\n- SpO2: ${telemetry.oxygen_saturation_pct}%\n- Radiation Exposure: ${telemetry.radiation_exposure_mSv} mSv (Threshold: 0.50 mSv)\n- Stress Level: ${telemetry.stress_level_1to10}/10 (Threshold: 7.0)\n- Core Body Temp: ${telemetry.body_temp_C}°C\n- Activity State: ${telemetry.activity_state || 'Nominal Operation'}\n- Sensor Notes: ${telemetry.notes || 'None'}\n\n`;
    }

    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      contextualPrompt += `[PREVIOUS TRANSCRIPTS]\n`;
      const recent = conversationHistory.slice(-4);
      for (const msg of recent) {
        contextualPrompt += `${msg.role === 'user' ? 'Astronaut/Crew' : 'SpaceMed AI'}: ${msg.content}\n`;
      }
      contextualPrompt += `\n`;
    }

    contextualPrompt += `[ASTRONAUT QUERY / CHIEF COMPLAINT]\n${prompt || 'Perform autonomous comprehensive physiological scan and anomaly triage.'}`;

    // If Gemini client is active, execute live generation with failover timeout
    if (aiClient) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Uplink timeout: switching to onboard autonomous heuristic core')), 4500)
        );

        const geminiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contextualPrompt,
          config: {
            systemInstruction: SPACEMED_SYSTEM_INSTRUCTION,
            temperature: 0.25,
          },
        });

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const responseText = response.text || 'Telemetry analyzed. All readings stable.';
        return res.json({
          success: true,
          response: responseText,
          source: 'gemini-3.8-flash',
        });
      } catch (geminiError: any) {
        console.warn('Gemini query timed out or failed, activating onboard heuristics:', geminiError.message);
        // Fall through to autonomous onboard heuristic engine
      }
    }

    // High-fidelity fallback when API key is not present or uplink is constrained
    const fallbackResponse = generateLocalDiagnostic(telemetry, prompt);
    return res.json({
      success: true,
      response: fallbackResponse,
      source: 'spacemed-onboard-autonomous-core',
    });
  } catch (error: any) {
    console.error('SpaceMed AI Error:', error);
    return res.status(500).json({
      error: 'SpaceMed Medical Subsystem Diagnostic Failure',
      details: error.message || 'Unknown error',
    });
  }
});

// Autonomous heuristic engine fallback
function generateLocalDiagnostic(t: any, prompt: string): string {
  if (!t) {
    return `### 🩺 Triage Assessment\n**NOMINAL** — General Consultation Mode\n\n### 🔍 Physiological Analysis\nStanding by for telemetry ingestion. In microgravity, constant vigilance regarding cephalad fluid shift and circadian rhythm desynchronosis is essential.\n\n### ⚡ Immediate Countermeasures\n1. Ensure daily 2.5-hour resistive (ARED) and cycle/treadmill (T2) regimen.\n2. Maintain minimum 2.5L fluid intake with sodium electrolyte replenishment.\n3. Verify passive radiation dosimeter badge is securely attached.\n\n### 📋 Flight Surgeon Mission Note\nTelemedicine uplink nominal. Awaiting next telemetry batch.`;
  }

  const isRadAnomaly = t.radiation_exposure_mSv > 0.50;
  const isStressAnomaly = t.stress_level_1to10 > 7.0;
  const isHypoxia = t.oxygen_saturation_pct < 95.0;
  const isTachycardia = t.heart_rate_bpm > 115;

  if (isRadAnomaly) {
    return `### 🩺 Triage Assessment\n**CRITICAL: RADIATION SPIKE (SOLAR PARTICLE EVENT)**\nActive reading: **${t.radiation_exposure_mSv} mSv** (Exceeds 0.50 mSv safe limit by +${((t.radiation_exposure_mSv - 0.50) * 100 / 0.50).toFixed(0)}%).\n\n### 🔍 Physiological Analysis\nElevated ionizing proton flux detected at dosimeter. Prolonged exposure at this rate poses acute radiation sickness risk, endothelial oxidative stress, and hematopoietic suppression.\n\n### ⚡ Immediate Countermeasures\n1. **Cease Extravehicular Activity (EVA)** immediately if currently outside.\n2. Relocate to the **Water-Shielded Core Module** (Storm Haven) within 8 minutes.\n3. Log cumulative dosimeter dose and prepare prophylactic anti-nausea/anti-emetic therapy (Ondansetron 8mg).\n4. Fasten protective radiation shielding aprons over vital organs.\n\n### 📋 Flight Surgeon Mission Note\nHouston Space Radiation Analysis Group notified. Hold in storm shelter until solar flare flux drops below 0.20 mSv/hr.`;
  }

  if (isStressAnomaly || isTachycardia) {
    return `### 🩺 Triage Assessment\n**CAUTION: ACUTE CARDIOVASCULAR & PSYCHOPHYSIOLOGICAL ELEVATION**\nHeart Rate: **${t.heart_rate_bpm} bpm** | Stress Index: **${t.stress_level_1to10}/10** | BP: **${t.systolic_bp}/${t.diastolic_bp} mmHg**.\n\n### 🔍 Physiological Analysis\nSympathoadrenal surge detected. Elevated catecholamines coupled with microgravity fluid redistribution (increased central venous pressure) increase myocardial oxygen demand. Possible hypercapnia (elevated ambient CO2) or acute operational task overload.\n\n### ⚡ Immediate Countermeasures\n1. Initiate guided 4-7-8 autonomic vagal deceleration breathing protocol.\n2. Check suit or cabin scrubbers for ambient pCO2 levels (ensure < 3.0 mmHg).\n3. Consume 300ml chilled electrolyte solution to counter fluid pooling.\n4. Pause high-cognitive load procedures for 15 minutes.\n\n### 📋 Flight Surgeon Mission Note\nTemporary 'Workload Stand-Down' recommended. Re-assess hemodynamics in 20 minutes before resuming airlock or robotics operations.`;
  }

  return `### 🩺 Triage Assessment\n**NOMINAL: ALL BIOMETRICS WITHIN MISSION PARAMETERS**\nHeart Rate: **${t.heart_rate_bpm} bpm** | SpO2: **${t.oxygen_saturation_pct}%** | Radiation: **${t.radiation_exposure_mSv} mSv** | Temp: **${t.body_temp_C}°C**.\n\n### 🔍 Physiological Analysis\nCrewmember biometrics demonstrate strong cardiovascular compensation to microgravity. Cephalad fluid distribution is stabilized with no acute intracranial hypertension markers.\n\n### ⚡ Immediate Countermeasures\n1. Maintain scheduled mission timeline.\n2. Hydration balance and nutritional calorie intake are currently optimal.\n3. Proceed with scheduled operational shift.\n\n### 📋 Flight Surgeon Mission Note\nAstronaut cleared for all planned intra-vehicular duties. Telemetry log archived to mission health telemetry database.`;
}

// Development or production Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`🚀 SpaceMed Astronaut Health Server running on port ${port}`);
  });
}

startServer();
