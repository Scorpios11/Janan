/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types.js';
import { 
  Lock, Mail, Key, Shield, ShieldCheck, HeartPulse, User, Users, 
  Stethoscope, Info, Sparkles, Check, ChevronRight, Fingerprint
} from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (role: UserRole, email: string, patientId?: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  // Login vs Sign Up tabs
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'CAREGIVER' | 'CLINICIAN'>('PATIENT');
  
  // Form fields
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  
  // Onboarding fields (shows up after Sign Up is clicked to provide a smooth medical flow)
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [age, setAge] = useState<string>("75");
  const [gender, setGender] = useState<string>("Female");
  const [primaryCondition, setPrimaryCondition] = useState<string>("Hypertension");
  const [medicationsInput, setMedicationsInput] = useState<string>("Lisinopril 10mg morning, Atorvastatin 20mg night");
  const [height, setHeight] = useState<string>("165");
  const [weight, setWeight] = useState<string>("65");
  
  // Validation, errors & states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [biometricSecuring, setBiometricSecuring] = useState<boolean>(false);

  // Suggested quick-fill options for the reviewer / tester
  const PRESET_USER_CREDENTIALS = [
    { email: "patient@cardiocare.org", password: "password123", role: 'PATIENT' as const, label: "Demo Patient (Margaret)" },
    { email: "doctor@cardiocare.org", password: "password123", role: 'CLINICIAN' as const, label: "Cardiologist Console" },
    { email: "family@cardiocare.org", password: "password123", role: 'CAREGIVER' as const, label: "Family / Caregiver Hub" }
  ];

  const handlePresetClick = (preset: typeof PRESET_USER_CREDENTIALS[number]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setSelectedRole(preset.role);
    setValidationError(null);
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError("Please fill out all security credentials.");
      return;
    }

    if (!validateEmail(email)) {
      setValidationError("Please enter a valid clinical domain or personal email address.");
      return;
    }

    if (password.length < 5) {
      setValidationError("Password must be at least 5 characters for medical database integrity.");
      return;
    }

    setIsAuthenticating(true);

    // Simulate secure HIPAA connection latency
    setTimeout(() => {
      let targetRole: UserRole;
      if (selectedRole === 'PATIENT') targetRole = UserRole.PATIENT;
      else if (selectedRole === 'CLINICIAN') targetRole = UserRole.CLINICIAN;
      else targetRole = UserRole.CAREGIVER;

      if (isSignUp) {
        if (selectedRole === 'PATIENT') {
          setIsAuthenticating(false);
          if (!isOnboarding) {
            // Advance to Patient Profile Setup Onboarding
            setIsOnboarding(true);
          }
        } else {
          // Doctor or Caregiver signup - register on backend directly
          fetch('/api/v1/patients/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fullName || email.split('@')[0],
              email: email,
              role: selectedRole
            })
          })
          .then(async (res) => {
            if (!res.ok) throw new Error("Registry error");
            setIsAuthenticating(false);
            onLoginSuccess(targetRole, email);
          })
          .catch((err) => {
            setIsAuthenticating(false);
            setValidationError("Backend registry connection dropped. Acknowledged simulator login.");
            onLoginSuccess(targetRole, email);
          });
        }
      } else {
        // Standard Sign In login flow
        setIsAuthenticating(false);
        onLoginSuccess(targetRole, email);
      }
    }, 1200);
  };

  const handleBiometricLogin = () => {
    setBiometricSecuring(true);
    setValidationError(null);
    
    // Simulate FaceID / Fingerprint touch latency
    setTimeout(() => {
      setBiometricSecuring(false);
      let targetRole: UserRole;
      if (selectedRole === 'PATIENT') targetRole = UserRole.PATIENT;
      else if (selectedRole === 'CLINICIAN') targetRole = UserRole.CLINICIAN;
      else targetRole = UserRole.CAREGIVER;

      // Assign appropriate demo email
      const fallbackEmail = selectedRole === 'PATIENT' ? "patient@cardiocare.org" : selectedRole === 'CLINICIAN' ? "doctor@cardiocare.org" : "family@cardiocare.org";
      onLoginSuccess(targetRole, fallbackEmail);
    }, 1400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4" id="auth-flow-wrapper">
      <div className="w-full max-w-lg bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
        
        {/* Banner with secure indicators */}
        <div className="bg-slate-950 text-white p-6 text-center space-y-2 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-600/30 border border-emerald-500 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono select-none tracking-widest uppercase">
            <Shield className="w-3 h-3 text-emerald-400" />
            SECURED HIPAA VIEW
          </div>
          
          <div className="w-12 h-12 bg-blue-500 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-black shadow-md mt-2">
            C
          </div>

          <h2 className="text-xl font-bold font-sans tracking-tight">CardioCare AI Portal login</h2>
          <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
            Providing high-definition z-score vital logs, alarm filters, and direct family synchronizations.
          </p>
        </div>

        {/* Dynamic Step Container */}
        {isOnboarding ? (
          /* PHASE 2: PATIENT ONBOARDING FORM */
          <div className="p-6 space-y-5 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-600">
                Onboarding Step 2 of 2
              </span>
              <h3 className="text-lg font-black text-slate-900 font-sans">Set Up Medical Profile</h3>
              <p className="text-xs text-slate-500">
                To activate z-score threshold alerts, tell us about your baseline physiology.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Physiological Sex</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 165"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Primary Conditions</label>
                <input
                  type="text"
                  value={primaryCondition}
                  onChange={(e) => setPrimaryCondition(e.target.value)}
                  placeholder="e.g. Hypertension, previous Myocardial Infarction..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Medications Log</label>
                <textarea
                  value={medicationsInput}
                  onChange={(e) => setMedicationsInput(e.target.value)}
                  placeholder="e.g. Atorvastatin 20mg morning, Lisinopril 10mg night"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Unique invite code preview */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-xs">
                <span className="font-extrabold text-[10px] uppercase text-indigo-700 font-sans tracking-wide block">
                  🛡️ Patient Unique Synchronous Link
                </span>
                <p className="text-[11px] text-slate-600">
                  Doctor & family can automatically view your live vitals. Invite Code:
                </p>
                <div className="flex bg-white items-center justify-between border border-indigo-200 rounded px-2.5 py-1.5 font-mono text-sm font-bold text-slate-800">
                  <span>CARE-82-MARG</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    AUTO GENERATED
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAuthenticating(true);
                const birthYear = 2026 - (parseInt(age) || 75);
                const dob = `${birthYear}-01-01`;
                
                fetch('/api/v1/patients/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: fullName || "New Patient Client",
                    email: email || "onboarding-user@cardiocare.org",
                    dob,
                    gender,
                    conditions: primaryCondition,
                    medications: medicationsInput,
                    role: 'PATIENT',
                    height,
                    weight
                  })
                })
                .then(async (res) => {
                  const data = await res.json();
                  setIsAuthenticating(false);
                  
                  let spawnedPatientId = undefined;
                  if (data && data.patient && data.patient.id) {
                    spawnedPatientId = data.patient.id;
                  }
                  
                  onLoginSuccess(UserRole.PATIENT, email || "onboarding-user@cardiocare.org", spawnedPatientId);
                })
                .catch((err) => {
                  setIsAuthenticating(false);
                  console.error("Failed to register patient profile on backend:", err);
                  onLoginSuccess(UserRole.PATIENT, email || "onboarding-user@cardiocare.org");
                });
              }}
              disabled={isAuthenticating}
              className="w-full bg-indigo-600 hover:bg-slate-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-md select-none text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <span className="animate-pulse">Registering Medical Profile on Secure HIPAA Database...</span>
              ) : (
                <>
                  Activate Shield & Finish Onboarding
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* STANDARD SECURE AUTHENTICATOR */
          <div className="p-6 space-y-5">
            
            {/* Tab switchers: Sign In vs Sign Up */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setValidationError(null);
                }}
                className={`flex-1 text-xs font-black pb-3 select-none text-center border-b-2 transition-all cursor-pointer ${
                  !isSignUp ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In securely
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setValidationError(null);
                }}
                className={`flex-1 text-xs font-black pb-3 select-none text-center border-b-2 transition-all cursor-pointer ${
                  isSignUp ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Create New Account
              </button>
            </div>

            {/* Validation Display */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs font-semibold animate-shake">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Toggle Switcher */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <label className="block text-[11px] font-sans font-bold text-slate-700">
                  {isSignUp ? "Select registering role (Patient, Caregiver or Doctor):" : "Secure Sign-In Core Role:"}
                </label>
                
                {/* Visual role toggles */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('PATIENT')}
                    className={`p-3 rounded-lg border-2 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedRole === 'PATIENT'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10.5px] font-extrabold tracking-tight">Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('CLINICIAN')}
                    className={`p-3 rounded-lg border-2 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedRole === 'CLINICIAN'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-5 h-5 shrink-0" />
                    <span className="text-[10.5px] font-extrabold tracking-tight">Doctor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('CAREGIVER')}
                    className={`p-3 rounded-lg border-2 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedRole === 'CAREGIVER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-[10.5px] font-extrabold tracking-tight">Caretaker / Family</span>
                  </button>
                </div>
              </div>

              {/* Input details */}
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Full Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Margaret Sterling"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">Security Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => alert("Password recovery instruction sent to registered secure medical storage.")}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Active logging action buttons */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-indigo-600 hover:bg-slate-950 text-white font-bold py-3.5 rounded-xl transition-all shadow-md select-none text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <span className="animate-pulse">Checking credentials & establishing secure channel...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {isSignUp ? "Continue to Onboarding Data" : "Secure Electronic Login"}
                  </>
                )}
              </button>
            </form>

            {/* Electronic biometrics setup (FaceID / TouchID option) */}
            {!isSignUp && (
              <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  OR USE BIOMETRICS FOR RETURNING USER
                </p>
                
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricSecuring}
                  className="mx-auto bg-slate-50 hover:bg-slate-100 hover:border-slate-350 active:scale-95 text-slate-700 font-bold text-xs py-2.5 px-4.5 rounded-lg border-2 border-slate-200 transition-all flex items-center justify-center gap-2 select-none cursor-pointer"
                >
                  <Fingerprint className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
                  {biometricSecuring ? "Matching Fingerprint..." : "Use Biometric FaceID / Fingerprint"}
                </button>
              </div>
            )}

            {/* Simulation Preset Assist Drawer */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-fadeIn">
              <span className="text-[9.5px] font-mono tracking-widest font-extrabold uppercase text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                SIMULATION CREDENTIAL ASSISTANCE (DEMO BYPASS)
              </span>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Instantly bypass typing by selecting a registered electronic testing account below:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_USER_CREDENTIALS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`p-2 border rounded-lg text-left transition-all active:scale-98 select-none text-[10px] bg-white hover:border-indigo-400 hover:bg-indigo-50/20 font-sans ${
                      email === preset.email ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-250'
                    }`}
                  >
                    <p className="font-bold text-slate-800">{preset.label}</p>
                    <p className="font-mono text-slate-400 text-[9px] truncate">{preset.email}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
