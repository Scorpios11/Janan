/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../types.js';
import { HeartPulse, ShieldAlert, Users, HeartHandshake, RefreshCw, LogOut } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  sseActive: boolean;
  activeAlertCount: number;
  selectedPatientName: string;
  isAuthenticated?: boolean;
  currentUserEmail?: string;
  onLogout?: () => void;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  sseActive,
  activeAlertCount,
  selectedPatientName,
  isAuthenticated,
  currentUserEmail,
  onLogout
}: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      {/* Brand & Connection State */}
      <div className="flex items-center space-x-3 select-none">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
          C
        </div>
        <div>
          <h1 className="font-sans font-bold tracking-tight text-slate-900 text-sm md:text-base flex items-center gap-2">
            CardioCare AI <span className="text-[10px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded font-mono font-bold tracking-wider">RPM PRO</span>
          </h1>
          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${sseActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {sseActive ? 'REAL-TIME STREAM ACTIVE' : 'DISCONNECTED'}
          </p>
        </div>
      </div>

      {/* Core Persona Hub */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
        <button
          onClick={() => onRoleChange(UserRole.PATIENT)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
            currentRole === UserRole.PATIENT
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          id="btn-role-patient"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Patient Portal
        </button>
        <button
          onClick={() => onRoleChange(UserRole.CAREGIVER)}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
            currentRole === UserRole.CAREGIVER
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          id="btn-role-caregiver"
        >
          <Users className="w-3.5 h-3.5" />
          Caregiver Hub
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold animate-bounce shadow">
              {activeAlertCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onRoleChange(UserRole.CLINICIAN)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
            currentRole === UserRole.CLINICIAN
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          id="btn-role-clinician"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Doctor Console
        </button>
      </div>

      {/* Clock Status & Profile Indicator */}
      <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
        {currentUserEmail && (
          <div className="hidden sm:block text-right">
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-tight">Active Session</p>
            <p className="text-xs text-indigo-600 font-bold font-sans">{currentUserEmail}</p>
          </div>
        )}
        <div className="hidden lg:flex items-center gap-4">
          <div className="border-l border-slate-200 h-8" />
          <div className="text-right">
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-tight">Active Tracking</p>
            <p className="text-xs text-slate-800 font-bold font-sans">{selectedPatientName}</p>
          </div>
          <div className="border-l border-slate-200 h-8" />
          <div className="text-right">
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-tight">HIPAA System Time</p>
            <p className="text-xs text-slate-800 font-bold">15:27 UTC</p>
          </div>
        </div>
        
        {isAuthenticated && onLogout && (
          <>
            <div className="border-l border-slate-200 h-8" />
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-sans font-bold text-xs flex items-center gap-1.5 transition-all select-none cursor-pointer"
              id="btn-secure-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secure Lock</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
