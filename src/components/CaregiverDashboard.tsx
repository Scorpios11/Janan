/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientProfile, VitalsRecord, Alert } from '../types.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ShieldAlert, Activity, Heart, Eye, CheckCircle2, MessageSquare, AlertTriangle, BellRing, HeartPulse } from 'lucide-react';

interface CaregiverDashboardProps {
  patient: PatientProfile;
  vitalsHistory: VitalsRecord[];
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string, notes: string) => void;
}

export default function CaregiverDashboard({
  patient,
  vitalsHistory,
  alerts,
  onAcknowledgeAlert
}: CaregiverDashboardProps) {
  const [ackNotes, setAckNotes] = useState<Record<string, string>>({});
  const [selectedAlertToAck, setSelectedAlertToAck] = useState<string | null>(null);

  // Filter alerts specifically for active warnings
  const activeAlerts = alerts.filter(a => a.status === "ACTIVE");
  const pastAlerts = alerts.filter(a => a.status !== "ACTIVE").slice(0, 5);

  const handleAckSubmit = (alertId: string) => {
    const notes = ackNotes[alertId] || "Acknowledged by family caregiver.";
    onAcknowledgeAlert(alertId, notes);
    setSelectedAlertToAck(null);
  };

  const getRecentReading = (): VitalsRecord | undefined => {
    return vitalsHistory ? vitalsHistory[0] : undefined;
  };

  const current = getRecentReading();

  // Format historical vitals in chronological order for Recharts (Recharts needs ascending chronological order!)
  const chartData = [...vitalsHistory]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-15) // last 15 readings
    .map(r => {
      const d = new Date(r.timestamp);
      return {
        ...r,
        formattedTime: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
        // Custom bounds for range shading
        sysHigh: patient.baselineSystolicBP + 15,
        sysLow: patient.baselineSystolicBP - 15,
        hrHigh: patient.baselineHeartRate + 15,
        hrLow: patient.baselineHeartRate - 15,
      };
    });

  // Safe baseline bounds
  const sysBaselineMax = patient.baselineSystolicBP + 15;
  const sysBaselineMin = patient.baselineSystolicBP - 15;
  const hrBaselineMax = patient.baselineHeartRate + 15;
  const hrBaselineMin = patient.baselineHeartRate - 15;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 space-y-4" id="caregiver-dashboard-container">
      
      {/* Brand Profile Overview */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded uppercase">Family Caregiver Dashboard</span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Personalized Telemetry Oversight</h1>
          <p className="text-xs text-slate-500 font-sans">
            Monitoring baselines for: <strong className="text-slate-900 font-bold">{patient.name}</strong>
          </p>
        </div>

        {activeAlerts.length > 0 ? (
          <div className="bg-rose-50 border border-rose-250 text-rose-700 px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 shadow-[0_0_10px_rgba(225,29,72,0.06)] shrink-0 animate-pulse">
            <BellRing className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-xs font-bold font-sans uppercase">Critical Action Required</p>
              <p className="text-[10px] font-mono text-rose-600 font-bold">{activeAlerts.length} Active System Alarm(s)</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 shrink-0">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs font-bold font-sans uppercase">Status: Protected</p>
              <p className="text-[10px] font-mono text-emerald-600 font-bold text-slate-500">All z-scores lie inside stable deviations</p>
            </div>
          </div>
        )}
      </div>

      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Pressure Card with highlight border inside deviations */}
        <div className="bg-white border border-rose-250 p-4 rounded-lg flex flex-col justify-between shadow-[0_0_10px_rgba(225,29,72,0.05)]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">Blood Pressure</p>
            <span className="p-1 px-1.5 bg-rose-50 border border-rose-200 text-[10px] text-rose-600 rounded font-mono font-bold">BP</span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-3">
            <p className="text-2xl md:text-3xl font-bold font-mono text-slate-900 leading-none">
              {current?.systolicBP || '--'}/{current?.diastolicBP || '--'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">mmHg</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Baseline Target</span>
            <span className="font-bold text-slate-700 font-mono">{patient.baselineSystolicBP}/{patient.baselineDiastolicBP}</span>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Heart Rate</p>
            <span className="p-1 px-1.5 bg-slate-50 border border-slate-200 text-[10px] text-slate-400 rounded font-mono font-bold">HR</span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-3">
            <p className="text-2xl md:text-3xl font-bold font-mono text-slate-900 leading-none">
              {current?.heartRate || '--'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">bpm</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Patient Mean</span>
            <span className="font-bold text-slate-700 font-mono">{patient.baselineHeartRate} bpm</span>
          </div>
        </div>

        {/* SpO2 Oxygen */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Oxygen SpO2</p>
            <span className="p-1 px-1.5 bg-slate-50 border border-slate-200 text-[10px] text-slate-400 rounded font-mono font-bold">O2</span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-3">
            <p className="text-2xl md:text-3xl font-bold font-mono text-slate-900 leading-none">
              {current?.spo2 || '--'}%
            </p>
            <p className="text-[10px] text-slate-400 font-mono">SpO2</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Threshold</span>
            <span className="font-bold text-slate-700 font-mono">&gt;{patient.baselineSpO2}%</span>
          </div>
        </div>

        {/* Core Temp */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Core Temp</p>
            <span className="p-1 px-1.5 bg-slate-50 border border-slate-200 text-[10px] text-slate-400 rounded font-mono font-bold">TMP</span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-3">
            <p className="text-2xl md:text-3xl font-bold font-mono text-slate-900 leading-none">
              {current?.temperature || '--'}°C
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Skin</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Ingest Source</span>
            <span className="font-bold text-slate-750 uppercase font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">{current?.rawDataSource || 'MANUAL'}</span>
          </div>
        </div>
      </div>

      {/* 2. SSE Telemetry Warnings Drawer */}
      {activeAlerts.length > 0 && (
        <section className="bg-rose-50/50 border border-rose-200 rounded-lg p-4 space-y-3 shadow-[0_0_10px_rgba(225,29,72,0.03)] animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            <h2 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Active Clinical Alert Dispatch Warnings</h2>
          </div>

          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-3.5 rounded border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5 md:flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded uppercase">
                      {alert.level}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Logged: {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{alert.message}</p>
                </div>

                <div className="shrink-0">
                  {selectedAlertToAck === alert.id ? (
                    <div className="flex items-stretch gap-1.5">
                      <input
                        type="text"
                        placeholder="Log compliance or caregiver actions..."
                        value={ackNotes[alert.id] || ""}
                        onChange={(e) => setAckNotes({ ...ackNotes, [alert.id]: e.target.value })}
                        className="text-xs border border-slate-200 p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 w-full md:w-60"
                      />
                      <button
                        onClick={() => handleAckSubmit(alert.id)}
                        className="bg-slate-900 text-white text-[10px] uppercase font-bold px-3.5 py-1.5 rounded hover:bg-slate-800"
                      >
                        File
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAlertToAck(alert.id)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Timeseries Interactive Charts panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Blood pressure range graph */}
        <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-850 uppercase tracking-tight">Blood Pressure Deviation Tracking</h3>
            <p className="text-[10px] text-slate-400 font-sans">Dotted bounds represent historical normal cardiovascular drift bounds (±15 mmHg)</p>
          </div>
          <div className="h-[280px]" id="systolic-band-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={9} className="font-mono" />
                <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                
                <ReferenceLine y={sysBaselineMax} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: `Max Base (${sysBaselineMax})`, fill: '#ef4444', fontSize: 8, position: 'insideBottomRight' }} />
                <ReferenceLine y={sysBaselineMin} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: `Min Base (${sysBaselineMin})`, fill: '#ef4444', fontSize: 8, position: 'insideTopRight' }} />

                <Line name="Systolic BP" type="monotone" dataKey="systolicBP" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 2 }} />
                <Line name="Diastolic BP" type="monotone" dataKey="diastolicBP" stroke="#f43f5e" strokeWidth={1} dot={{ r: 1 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Heart Rate graph with shaded baseline */}
        <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-855 uppercase tracking-tight">Heart Rate Variance Map</h3>
            <p className="text-[10px] text-slate-400 font-sans">Target baseline zone mapped against chronological telemetry records (±15 bpm)</p>
          </div>
          <div className="h-[280px]" id="heartrate-band-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={9} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />

                <ReferenceLine y={hrBaselineMax} stroke="#0284c7" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: `Max HR (${hrBaselineMax})`, fill: '#0284c7', fontSize: 8, position: 'insideBottomRight' }} />
                <ReferenceLine y={hrBaselineMin} stroke="#0284c7" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: `Min HR (${hrBaselineMin})`, fill: '#0284c7', fontSize: 8, position: 'insideTopRight' }} />

                <Line name="Pulse Rate (bpm)" type="monotone" dataKey="heartRate" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 4. Resolved Telemetry Alerts Log */}
      <section className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Historical Incident Logs (Past 5 Alerts)</h3>
          <span className="text-[9px] font-mono text-slate-400">Archival verification audits</span>
        </div>

        <div className="divide-y divide-slate-100 font-sans">
          {pastAlerts.length === 0 ? (
            <p className="text-xs italic text-slate-400 font-mono py-2">No historical incidents registered on this patient's segment.</p>
          ) : (
            pastAlerts.map(alert => (
              <div key={alert.id} className="py-2.5 first:pt-1 last:pb-1 flex justify-between flex-col md:flex-row items-start md:items-center gap-1.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {alert.status}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{alert.message}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Caregiver Acknowledgment: {alert.notes || "No actions logged."}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
