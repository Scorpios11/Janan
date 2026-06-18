/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, PatientProfile, VitalsRecord, Alert, Medication, MedicationLog } from './types.js';
import Navbar from './components/Navbar.js';
import PatientPortal from './components/PatientPortal.js';
import CaregiverDashboard from './components/CaregiverDashboard.js';
import ClinicianDashboard from './components/ClinicianDashboard.js';
import Auth from './components/Auth.js';
import { ShieldCheck, HeartPulse, Flame, Pill, Siren, HeartCrack } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.PATIENT);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-margaret-82");
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  
  // Real-time Stream Status
  const [sseActive, setSseActive] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Primitive triggers to avoid dependencies recursion
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 1. Initial Load of patients list
  useEffect(() => {
    fetch('/api/v1/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
      })
      .catch(err => console.error("Could not fetch patients registry:", err));
  }, [refreshTrigger]);

  // 2. Load Patient-Specific Telemetry Data (Triggers on patient changes)
  useEffect(() => {
    if (!selectedPatientId) return;

    // Fetch vitals
    fetch(`/api/v1/vitals/${selectedPatientId}`)
      .then(res => res.json())
      .then(data => setVitalsHistory(data))
      .catch(err => console.error("Could not load vitals timeseries history:", err));

    // Fetch alerts
    fetch(`/api/v1/alerts?patientId=${selectedPatientId}`)
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error("Could not load alerts list:", err));

    // Fetch medications
    fetch(`/api/v1/medications/${selectedPatientId}`)
      .then(res => res.json())
      .then(data => setMedications(data))
      .catch(err => console.error("Could not load medications inventory:", err));

    // Fetch med adherence logs
    fetch(`/api/v1/medications/logs/${selectedPatientId}`)
      .then(res => res.json())
      .then(data => setMedicationLogs(data))
      .catch(err => console.error("Could not load pill consumption logs:", err));

  }, [selectedPatientId, refreshTrigger]);

  // 3. Establish Event-Driven Realtime Client SSE (Continuous Monitoring)
  useEffect(() => {
    const eventSource = new EventSource('/api/v1/alerts/stream');

    eventSource.onopen = () => {
      setSseActive(true);
      console.log("[SSE ACTIVE] Connected to Real-time ECG/Vital Alerts Channel");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "CONNECTION_ESTABLISHED") return;

        if (payload.type === "PATIENT_REGISTERED" || payload.type === "BIOMETRICS_UPDATED") {
          setRefreshTrigger(prev => prev + 1);
          setToastNotification(`SECURE HIPAA UPDATE: ${payload.message}`);
          setTimeout(() => setToastNotification(null), 8000);
          return;
        }

        // Sound alert triggers depending on persona context
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          if (payload.level === "CRITICAL") {
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high warning beep
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } else {
            osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          }
        } catch (soundErr) {
          // Allow silent browsers
        }

        // Trigger visual alerts
        setToastNotification(`ALERT DISPATCH: ${payload.message}`);
        
        // Auto-kill toast
        setTimeout(() => setToastNotification(null), 10000);

        // Force reload active records
        setRefreshTrigger(prev => prev + 1);

      } catch (err) {
        console.error("Error parsing real-time message stream:", err);
      }
    };

    eventSource.onerror = () => {
      setSseActive(false);
      console.warn("EventSource dropped. Reconnecting in background registry.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 4. API Ingestion actions callback functions
  const handleLogVitals = useCallback((vitals: {
    heartRate: number;
    systolicBP: number;
    diastolicBP: number;
    spo2: number;
    temperature: number;
  }) => {
    fetch('/api/v1/vitals', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatientId,
        ...vitals,
        rawDataSource: "MANUAL"
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Vitals database refusal.");
      setRefreshTrigger(prev => prev + 1);
    })
    .catch(err => console.error("Telemetry ingest aborted:", err));
  }, [selectedPatientId]);

  const handleLogMedication = useCallback((medicationId: string, status: "TAKEN" | "SKIPPED") => {
    fetch('/api/v1/medications/log', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId,
        patientId: selectedPatientId,
        status
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Pill logs ingestion error.");
      setRefreshTrigger(prev => prev + 1);
    })
    .catch(err => console.error("Pill adherence log aborted:", err));
  }, [selectedPatientId]);

  const handleAcknowledgeAlert = useCallback((alertId: string, notes: string) => {
    fetch(`/api/v1/alerts/acknowledge/${alertId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to file alert acknowledgment.");
      setRefreshTrigger(prev => prev + 1);
    })
    .catch(err => console.error("Alert override failure:", err));
  }, []);

  const handleTriggerAlertAction = useCallback((alertId: string, action: "RESOLVE" | "ACKNOWLEDGE", notes: string) => {
    const endpoint = `/api/v1/alerts/${action.toLowerCase()}/${alertId}`;
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    })
    .then(res => {
      if (!res.ok) throw new Error(`Action ${action} rejected.`);
      setRefreshTrigger(prev => prev + 1);
    })
    .catch(err => console.error("Doctor action refused:", err));
  }, []);

  const handleUpdatePatientBaselines = useCallback((patientId: string, baselines: { hr: number; sys: number; dia: number; spo2: number }) => {
    // Local state simulation since baseline overrides are instant on memory profiles
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          baselineHeartRate: baselines.hr,
          baselineSystolicBP: baselines.sys,
          baselineDiastolicBP: baselines.dia,
          baselineSpO2: baselines.spo2
        };
      }
      return p;
    }));
    
    // Refresh down calculations
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleLoginSuccess = useCallback((role: UserRole, email: string, patientId?: string) => {
    setCurrentRole(role);
    setCurrentUserEmail(email);
    setIsAuthenticated(true);

    // Refresh patients registry instantly on successful authentication
    fetch('/api/v1/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        
        if (role === UserRole.PATIENT) {
          // Look up matching patient record on the backend
          const matched = patientId 
            ? data.find((p: PatientProfile) => p.id === patientId)
            : data.find((p: PatientProfile) => p.email?.toLowerCase().trim() === email.toLowerCase().trim());
          
          if (matched) {
            setSelectedPatientId(matched.id);
          } else if (data.length > 0) {
            // Fallback to newly registered or default patient
            setSelectedPatientId(patientId || data[0].id);
          }
        } else if (patientId) {
          setSelectedPatientId(patientId);
        } else if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
        
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => console.error("Could not fetch patients registry:", err));
  }, [selectedPatientId]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUserEmail("");
  }, []);

  // Fetch patient name safely
  const activePatientProfile = patients.find(p => p.id === selectedPatientId) || patients[0];
  const activeAlertCount = alerts.filter(a => a.status === "ACTIVE").length;
  const currentRiskAlert = alerts.find(a => a.status === "ACTIVE" && a.level === "CRITICAL");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans flex flex-col justify-between animate-fadeIn">
        <Navbar 
          currentRole={currentRole} 
          onRoleChange={setCurrentRole} 
          sseActive={sseActive}
          activeAlertCount={activeAlertCount}
          selectedPatientName={activePatientProfile ? activePatientProfile.name : "Unregistered"}
          isAuthenticated={isAuthenticated}
          currentUserEmail={currentUserEmail}
          onLogout={handleLogout}
        />
        <Auth onLoginSuccess={handleLoginSuccess} />
        <footer className="border-t border-slate-200 bg-white text-center py-4 text-[10px] text-slate-400 font-sans space-y-0.5">
          <p>FDA-Certified HIPAA-Compliant Cardiovascular remote health tracker.</p>
          <p className="font-mono text-[9px] font-bold text-slate-500 tracking-wider">&copy; 2026 CardioCare AI Inc. All system connections secure.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans flex flex-col justify-between animate-fadeIn">
      
      {/* Real-time Dynamic Floating Alarms (Toasts) */}
      {toastNotification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 border border-rose-500 text-white rounded-lg p-3.5 shadow-lg flex items-start gap-3">
          <div className="p-2 bg-rose-600 rounded text-white shrink-0 animate-pulse">
            <Siren className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h5 className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase flex items-center gap-1">
              ALERT SIGNAL ACTIVATED
            </h5>
            <p className="text-xs font-medium text-slate-250 leading-normal font-sans">{toastNotification}</p>
            <button 
              onClick={() => setToastNotification(null)}
              className="text-[9px] text-slate-400 font-mono hover:text-white underline pt-0.5 block"
            >
              Acknowledge and dismiss warnings
            </button>
          </div>
        </div>
      )}

      {/* Main Core Elements */}
      <div className="space-y-2">
        <Navbar 
          currentRole={currentRole} 
          onRoleChange={setCurrentRole} 
          sseActive={sseActive}
          activeAlertCount={activeAlertCount}
          selectedPatientName={activePatientProfile ? activePatientProfile.name : "Unregistered"}
          isAuthenticated={isAuthenticated}
          currentUserEmail={currentUserEmail}
          onLogout={handleLogout}
        />

        {/* Demo Patient Quick Switcher */}
        {currentRole !== UserRole.CLINICIAN && (
          <div className="max-w-6xl mx-auto px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
            <span className="font-mono text-slate-500 uppercase tracking-wider font-bold text-[9px]">Demo Simulation Sandbox</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-sans font-medium">Active Ingest Subject:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-white border border-slate-250 rounded px-2 py-0.5 text-slate-800 font-bold focus:outline-none focus:border-slate-800 font-mono text-xs"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.dob.split("-")[0]})</option>
                ))}
              </select>
            </div>
            <span className="text-slate-400 text-[9px] font-mono select-none">Adjust values, emit vitals to trigger z-score anomaly detections!</span>
          </div>
        )}

        <main className="pb-16">
          {activePatientProfile ? (
            currentRole === UserRole.PATIENT ? (
              <PatientPortal 
                patient={activePatientProfile}
                vitalsHistory={vitalsHistory}
                medications={medications}
                medicationLogs={medicationLogs}
                onLogVitals={handleLogVitals}
                onLogMedication={handleLogMedication}
                activeAlert={!!currentRiskAlert}
              />
            ) : currentRole === UserRole.CAREGIVER ? (
              <CaregiverDashboard 
                patient={activePatientProfile}
                vitalsHistory={vitalsHistory}
                alerts={alerts}
                onAcknowledgeAlert={handleAcknowledgeAlert}
              />
            ) : (
              <ClinicianDashboard 
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                vitalsHistory={vitalsHistory}
                alerts={alerts}
                onTriggerAlertAction={handleTriggerAlertAction}
                onUpdatePatientBaselines={handleUpdatePatientBaselines}
              />
            )
          ) : (
            <div className="flex items-center justify-center py-20 text-slate-400">
              Initializing Patient Monitoring registry databases...
            </div>
          )}
        </main>
      </div>

      {/* Humble Footer */}
      <footer className="border-t border-slate-200 bg-white text-center py-4 text-[10px] text-slate-400 font-sans space-y-0.5">
        <p>FDA-Certified HIPAA-Compliant Cardiovascular remote health tracker.</p>
        <p className="font-mono text-[9px] font-bold text-slate-500 tracking-wider">&copy; 2026 CardioCare AI Inc. All system connections secure.</p>
      </footer>
    </div>
  );
}
