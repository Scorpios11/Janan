/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatientProfile, VitalsRecord, Alert, ClinicalReport } from '../types.js';
import { 
  ShieldCheck, AlertCircle, FileSpreadsheet, Plus, HelpCircle, Activity, 
  Sparkles, Printer, Sliders, ChevronRight, Check, Pill, FileText, FlaskConical, Droplet 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ClinicianDashboardProps {
  patients: PatientProfile[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  vitalsHistory: VitalsRecord[];
  alerts: Alert[];
  onTriggerAlertAction: (alertId: string, action: "RESOLVE" | "ACKNOWLEDGE", notes: string) => void;
  onUpdatePatientBaselines: (patientId: string, baselines: { hr: number; sys: number; dia: number; spo2: number }) => void;
}

// Default medical, structural, and behavioral background details for preseeded patients
const DEFAULT_PATIENT_BACKGROUNDS: Record<string, {
  pastSurgeries: string[];
  smokeAlcoholHabits: string;
  maritalStatus: string;
  numberOfChildren: number;
  cardiacFamilyHistory: string;
  occupation: string;
  bloodType: string;
}> = {
  "pat-margaret-82": {
    pastSurgeries: ["جراحی کیسه صفرا (Cholecystectomy - 1998)", "تعویض مفصل ران چپ (2015)"],
    smokeAlcoholHabits: "غیرسیگاری، بدون مصرف الکل",
    maritalStatus: "بیوه (Widowed)",
    numberOfChildren: 2,
    cardiacFamilyHistory: "پدر دارای فیبریلاسیون دهلیزی شدید، مادر مبتلا به سکته مغزی حاد در سنین بالا",
    occupation: "معلم بازنشسته دبستان",
    bloodType: "A-Positive"
  },
  "pat-arthur-76": {
    pastSurgeries: ["آپاندکتومی (1968)", "جراحی پیوند بای پس عروق کرونر (CABG - 2020)"],
    smokeAlcoholHabits: "سیگاری قبلی (سال ۲۰۱۰ داوطلبانه ترک کرده)، مصرف الکل تفریحی دوره‌ای بسیار محدود",
    maritalStatus: "متاهل (Married)",
    numberOfChildren: 3,
    cardiacFamilyHistory: "سابقه بیماری کرونر قلبی و تنگی عضلانی عروق در نسل مادری",
    occupation: "مهندس هوانوردی بازنشسته وزارت ترابری",
    bloodType: "O-Negative"
  },
  "pat-sarah-69": {
    pastSurgeries: ["دو مورد عمل سزارین زایمان (1985, 1988)"],
    smokeAlcoholHabits: "غیرسیگاری، بدون مصرف مشروبات الکلی",
    maritalStatus: "متاهل (Married)",
    numberOfChildren: 3,
    cardiacFamilyHistory: "بدون اختلالات حاد قلبی-تنباکویی یا ریوی در خویشاوندان درجه اول",
    occupation: "کتابدار بازنشسته دانشگاه علوم پزشکی",
    bloodType: "B-Positive"
  },
  "pat-james-84": {
    pastSurgeries: ["آرتروسکوپی زانوی راست (2012)"],
    smokeAlcoholHabits: "سیگاری سنگین سابق (۴۰ سال مصرف روزانه، از سال ۲۰۰۵ کلاً قطع کرده است)",
    maritalStatus: "بیوه (Widowed)",
    numberOfChildren: 1,
    cardiacFamilyHistory: "برادر بزرگتر دچار سکته حاد قلبی ناگهانی در سن ۶۲ سالگی",
    occupation: "نجار بازنشسته کارگاه سنتی صنایع چوب",
    bloodType: "A-Negative"
  },
  "pat-maria-71": {
    pastSurgeries: ["هیسترکتومی شکمی کامل (2004)"],
    smokeAlcoholHabits: "غیرسیگاری، بدون استفاده از قلیان و دخانیات",
    maritalStatus: "متاهل (Married)",
    numberOfChildren: 4,
    cardiacFamilyHistory: "خواهر بیمار دچار دیابت شیرین تیپ ۲ و نارسایی کلیه ثانویه است",
    occupation: "خانه‌دار سنتی بومی",
    bloodType: "O-Positive"
  },
  "pat-robert-79": {
    pastSurgeries: ["نصب ضربان‌ساز دو حفره‌ای قلب (2025)", "ترمیم فتق کشاله ران (2019)"],
    smokeAlcoholHabits: "مصرف گهگاهی سیگار برگ سنتی، مصرف محدود تفریحی شراب سنتی",
    maritalStatus: "متاهل (Married)",
    numberOfChildren: 2,
    cardiacFamilyHistory: "پدر بر اثر ایست مغزی و نارسایی قلبی و عروقی فوت کرده است",
    occupation: "مهندس معمار و طراح بازنشسته ساختمان",
    bloodType: "AB-Positive"
  }
};

export default function ClinicianDashboard({
  patients,
  selectedPatientId,
  onSelectPatient,
  vitalsHistory,
  alerts,
  onTriggerAlertAction,
  onUpdatePatientBaselines
}: ClinicianDashboardProps) {
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  
  // Tab control inside clinician console
  const [activeTab, setActiveTab] = useState<"clinical" | "ai">("clinical");
  
  // Height & Weight editable local biometrics state for doc
  const [docHeight, setDocHeight] = useState<string>("170");
  const [docWeight, setDocWeight] = useState<string>("70");

  // Patient History states DB
  const [patientBackgrounds, setPatientBackgrounds] = useState<Record<string, {
    pastSurgeries: string[];
    smokeAlcoholHabits: string;
    maritalStatus: string;
    numberOfChildren: number;
    cardiacFamilyHistory: string;
    occupation: string;
    bloodType: string;
  }>>(DEFAULT_PATIENT_BACKGROUNDS);

  // States to edit background history in UI
  const [editNumChildren, setEditNumChildren] = useState<number>(0);
  const [editMaritalStatus, setEditMaritalStatus] = useState<string>("");
  const [editPastSurgeries, setEditPastSurgeries] = useState<string>("");
  const [editSmokeAlcohol, setEditSmokeAlcohol] = useState<string>("");
  const [editCardiacFamily, setEditCardiacFamily] = useState<string>("");
  const [editOccupation, setEditOccupation] = useState<string>("");
  const [editBloodType, setEditBloodType] = useState<string>("");
  const [historySuccessMsg, setHistorySuccessMsg] = useState<string | null>(null);

  // Patient Clinical Visits logs state
  const [clinicalVisits, setClinicalVisits] = useState<Record<string, Array<{
    id: string;
    date: string;
    complaint: string;
    diagnostician: string;
    status: string;
    treatmentPlan: string;
  }>>>({
    "pat-margaret-82": [
      {
        id: "v-1",
        date: "2026-05-15",
        complaint: "تپش قلب ناشی از پیاده‌روی سبک سربالایی و افزایش خستگی صبحگاهی تجمعی",
        diagnostician: "دکتر سهرابی (متخصص قلب و عروق)",
        status: "بهبود نسبی زیر مانیتورینگ RPM",
        treatmentPlan: "افزایش دوز داروی لیسینوپریل به میزان ۵ میلی‌گرم روزانه دوز صبح و ثبت مستمر فشار خون"
      },
      {
        id: "v-2",
        date: "2026-03-10",
        complaint: "تنگی نفس حاد شبانه با سرفه‌های خشک و افت شدید SpO2 به زیر ۹۴٪",
        diagnostician: "دکتر سهرابی (متخصص قلب)",
        status: "بحرانی برطرف‌شده در اورژانس مجهز",
        treatmentPlan: "کاهش موقتی مصرف مایعات، تجویز کوتاه‌مدت فورزماید و پایش روزانه تغییرات وزن برای رد خیز قلبی"
      },
      {
        id: "v-3",
        date: "2026-01-20",
        complaint: "بررسی دوره‌ای باطری ضربان‌ساز قلب مصنوعی و آزمایش خون دیابت",
        diagnostician: "دکتر احمدی (طب داخلی کلینیک)",
        status: "پایدار و رضایت‌بخش کلی",
        treatmentPlan: "تایید عملکرد باطری ضربان‌ساز، توصیه به حفظ رژیم کم‌نمک مدیترانه‌ای به ویژه در وعده شام"
      }
    ],
    "pat-arthur-76": [
      {
        id: "v-4",
        date: "2026-05-20",
        complaint: "درد خفیف قفسه سینه در حین تمرین تپش‌آور تردمیل تحت شرایط سنگین",
        diagnostician: "دکتر رضایی (فوق‌تخصص عروق کرونر)",
        status: "نیازمند پایش مستمر در منزل",
        treatmentPlan: "تجویز تست ورزش جدید و آنژیوگرافی احتیاطی، ادامه مصرف آسپرین بچه ۸۰ میلی‌گرم جهت ممانعت ترومبوز"
      },
      {
        id: "v-5",
        date: "2026-04-02",
        complaint: "ثبت آریتمی قلبی فیبریلاسیون دهلیزی دوره‌ای (Paroxysmal A-Fib)",
        diagnostician: "دکتر سهرابی (متخصص قلب)",
        status: "بهبود یافته و مرخص شده",
        treatmentPlan: "تنظیم سطح و غلظت داروی ضد انعقاد خون و مانیتور تداخل دارویی با گریپ‌فروت"
      }
    ],
    "pat-sarah-69": [
      {
        id: "v-6",
        date: "2026-05-10",
        complaint: "نوسانات شدید قند خون ناشتا به همراه احتباس آب و ورم ساق پای راست",
        diagnostician: "دکتر مهدوی (غدد و متابولیسم)",
        status: "تحت مانیتورینگ کلیوی و کلی سطحی",
        treatmentPlan: "تغییر ساعات مصرف انسولین لانتوس شبانه، ارجاع سریع به سونوگرافی داپلر رنگی اندام تحتانی"
      }
    ],
    "pat-james-84": [
      {
        id: "v-7",
        date: "2026-05-28",
        complaint: "سرفه‌های شدید همراه با خلط غلیظ و کاهش محسوس تحمل پیاده‌روی مسافت کوتاه",
        diagnostician: "دکتر ابراهیمی (فوق‌تخصص ریه)",
        status: "تحت درمان انسداد ریوی مزمن COPD",
        treatmentPlan: "افزایش تعداد پاف اسپری‌های تنفسی سالبوتامول، سفارش کپسول اکسیژن پرتابل برای فعالیت خارج خانه"
      }
    ]
  });

  // States to add new visit (encounter) in UI
  const [newVisitDate, setNewVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newVisitComplaint, setNewVisitComplaint] = useState<string>("");
  const [newVisitDoc, setNewVisitDoc] = useState<string>("دکتر سهرابی (متخصص قلب)");
  const [newVisitStatus, setNewVisitStatus] = useState<string>("تحت نظر در بخش پورتال از دور (RPM)");
  const [newVisitTreatment, setNewVisitTreatment] = useState<string>("");
  const [newVisitSuccess, setNewVisitSuccess] = useState<string | null>(null);

  // Baseline inputs state
  const [editBaselines, setEditBaselines] = useState({ hr: 72, sys: 120, dia: 80, spo2: 98 });
  const [reportData, setReportData] = useState<ClinicalReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Notes state for alert resolution
  const [actionNotes, setActionNotes] = useState<string>("");

  // States for medication management
  const [medsList, setMedsList] = useState<any[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTimes, setNewMedTimes] = useState("08:00, 20:00");
  const [prescribeSuccess, setPrescribeSuccess] = useState<string | null>(null);

  // States for Lab Report Analyzer
  const [labText, setLabText] = useState("");
  const [labType, setLabType] = useState("lipids");
  const [analyzingLab, setAnalyzingLab] = useState(false);
  const [labAnalysisResult, setLabAnalysisResult] = useState<any | null>(null);

  // Sync medications list when current patient switches
  useEffect(() => {
    if (selectedPatient) {
      fetch(`/api/v1/medications/${selectedPatient.id}`)
        .then(res => res.json())
        .then(data => setMedsList(data))
        .catch(err => console.error("Error loading medications:", err));
    }
  }, [selectedPatient]);

  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newMedName || !newMedDosage) return;

    try {
      const resp = await fetch('/api/v1/clinician/medications', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          name: newMedName,
          dosage: newMedDosage,
          scheduleTimes: newMedTimes.split(',').map(s => s.trim())
        })
      });

      if (!resp.ok) throw new Error("Backend reject");
      const savedMed = await resp.json();

      setMedsList(prev => [...prev, savedMed]);
      setPrescribeSuccess(`Prescribed ${newMedName} successfully!`);
      setNewMedName("");
      setNewMedDosage("");
      setTimeout(() => setPrescribeSuccess(null), 5000);
    } catch (err) {
      console.error("Prescribe medication failed:", err);
    }
  };

  const handleRunLabAnalysis = async () => {
    if (!selectedPatient) return;
    setAnalyzingLab(true);
    setLabAnalysisResult(null);

    try {
      const resp = await fetch('/api/v1/lab-analysis', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          textContent: labText,
          testType: labType
        })
      });

      if (!resp.ok) throw new Error("Lab Analysis endpoint failure");
      const result = await resp.json();
      setLabAnalysisResult(result);
    } catch (err) {
      console.error("Lab Report Analysis failed:", err);
    } finally {
      setAnalyzingLab(false);
    }
  };

  useEffect(() => {
    const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
    if (currentPatient) {
      setSelectedPatient(currentPatient);
      setEditBaselines({
        hr: currentPatient.baselineHeartRate,
        sys: currentPatient.baselineSystolicBP,
        dia: currentPatient.baselineDiastolicBP,
        spo2: currentPatient.baselineSpO2
      });
      setReportData(null); // Clear report on patient switch
      setDocHeight(currentPatient.height ? String(currentPatient.height) : "170");
      setDocWeight(currentPatient.weight ? String(currentPatient.weight) : "70");

      // Sync editable history inputs
      const bg = patientBackgrounds[currentPatient.id] || {
        pastSurgeries: [],
        smokeAlcoholHabits: "غیرسیگاری",
        maritalStatus: "متاهل",
        numberOfChildren: 0,
        cardiacFamilyHistory: "بدون سابقه قبلی در خانواده",
        occupation: "نامشخص",
        bloodType: "O+"
      };
      setEditNumChildren(bg.numberOfChildren);
      setEditMaritalStatus(bg.maritalStatus);
      setEditPastSurgeries(bg.pastSurgeries.join(", "));
      setEditSmokeAlcohol(bg.smokeAlcoholHabits);
      setEditCardiacFamily(bg.cardiacFamilyHistory);
      setEditOccupation(bg.occupation);
      setEditBloodType(bg.bloodType);
    }
  }, [selectedPatientId, patients, patientBackgrounds]);

  // Support for patient Medical Background editing & saving
  const handleUpdateHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setPatientBackgrounds(prev => ({
      ...prev,
      [selectedPatient.id]: {
        pastSurgeries: editPastSurgeries.split(',').map(s => s.trim()).filter(Boolean),
        smokeAlcoholHabits: editSmokeAlcohol,
        maritalStatus: editMaritalStatus,
        numberOfChildren: editNumChildren,
        cardiacFamilyHistory: editCardiacFamily,
        occupation: editOccupation,
        bloodType: editBloodType
      }
    }));
    setHistorySuccessMsg("پیشینه و جزییات شخصی/خانوادگی بیمار مکرراً آپدیت گردید.");
    setTimeout(() => setHistorySuccessMsg(null), 5000);
  };

  // Support to fetch existing clinical visits
  const getPatientVisits = (patientId: string) => {
    return clinicalVisits[patientId] || [];
  };

  // Support to record a new clinical visit (encounter)
  const handleAddNewVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newVisit = {
      id: "v-new-" + Date.now(),
      date: newVisitDate,
      complaint: newVisitComplaint,
      diagnostician: newVisitDoc,
      status: newVisitStatus,
      treatmentPlan: newVisitTreatment
    };

    setClinicalVisits(prev => ({
      ...prev,
      [selectedPatient.id]: [newVisit, ...(prev[selectedPatient.id] || [])]
    }));

    setNewVisitComplaint("");
    setNewVisitTreatment("");
    setNewVisitSuccess("گزارش معاینه بالینی جدید بیمار با موفقیت در لیست تعاملات ثبت گردید.");
    setTimeout(() => setNewVisitSuccess(null), 5000);
  };

  // Compute calculated risk score for patients to sort them by emergency severity
  const getPatientRiskScore = (patientId: string): { score: number; label: string; activeAlertsCount: number } => {
    const patientAlerts = alerts.filter(a => a.patientId === patientId && a.status === "ACTIVE");
    const activeCount = patientAlerts.length;
    
    // Calculate metric deviation based on current reading
    const patientVitals = vitalsHistory.filter(v => v.patientId === patientId).sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = patientVitals[0];

    let score = activeCount * 40; // High weight for active alarms
    
    if (latest) {
      if (latest.spo2 && latest.spo2 < 90) score += 30;
      if (latest.heartRate && (latest.heartRate > 115 || latest.heartRate < 52)) score += 20;
      if (latest.systolicBP && (latest.systolicBP > 165 || latest.systolicBP < 95)) score += 20;
    }

    let label = "Stable Baseline";
    if (score >= 60) label = "CRITICAL / ESCALATE";
    else if (score >= 20) label = "Moderate Deviation";

    return { score, label, activeAlertsCount: activeCount };
  };

  // Sort patients list by risk score descending
  const sortedPatients = [...patients].sort((a, b) => {
    return getPatientRiskScore(b.id).score - getPatientRiskScore(a.id).score;
  });

  const handleUpdateBaselineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    onUpdatePatientBaselines(selectedPatient.id, editBaselines);
    
    // Save height and weight to backend database
    try {
      const resp = await fetch('/api/v1/patients/update-biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          height: docHeight,
          weight: docWeight
        })
      });
      if (resp.ok) {
        selectedPatient.height = parseFloat(docHeight);
        selectedPatient.weight = parseFloat(docWeight);
      }
    } catch (err) {
      console.error("Failed to commit inline biometric updates:", err);
    }

    setSuccessMsg("تنظیمات فیزیولوژیکی و اندازه قد و وزن بیمار با موفقیت ذخیره گردید. 📈");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleGenerateReport = async () => {
    if (!selectedPatient) return;
    setGeneratingReport(true);
    setReportError(null);
    setReportData(null);

    try {
      const res = await fetch('/api/v1/reports/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatient.id })
      });

      if (!res.ok) throw new Error("Failed to request generating report");
      
      const parsed = await res.json();
      setReportData(parsed);
    } catch (err: any) {
      setReportError(err.message || "An error occurred compiling medical reports.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 px-6 py-4" id="clinician-dashboard-container">
      {/* LEFT COLUMN: Patient Triage Queue (Grid span 4) */}
      <div className="xl:col-span-4 space-y-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm space-y-1.5 text-left">
          <h2 className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-500">Telemetry Triage Roster</h2>
          <p className="text-xs text-slate-400 font-sans leading-snug">Order is calculated dynamically by cumulative cardiovascular anomalies risk score</p>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[640px] pr-1">
          {sortedPatients.map(p => {
            const risk = getPatientRiskScore(p.id);
            const isSelected = selectedPatient?.id === p.id;
            
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex justify-between items-center ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="space-y-1 select-none text-left">
                  <h3 className="font-bold text-sm tracking-tight">{p.name}</h3>
                  <p className={`text-[10px] font-mono font-bold ${isSelected ? 'text-slate-350' : 'text-slate-400'}`}>
                    DOB: {p.dob} • Risk Score: {risk.score}
                  </p>
                  <p className="text-[9px] font-mono flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      risk.score >= 60 ? 'bg-rose-500 animate-pulse' : risk.score >= 20 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`} />
                    {risk.label}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Details, Overrides & AI Summarizer (Grid span 8) */}
      <div className="xl:col-span-8 space-y-4">
        {selectedPatient ? (
          <>
            {/* 1. Header & Roster Info */}
            <div className="bg-white border-t-2 border-t-rose-500 border-x border-b border-slate-200 p-5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1 w-full md:w-auto">
                <span className="text-[10px] font-mono font-bold tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-sm uppercase tracking-widest inline-block mb-1.5 shadow-xs">
                  پرونده بهداشت قلبی و عروقی (Cardiovascular Medical Record)
                </span>
                
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPatient.name}</h1>
                
                {/* 🌟 PROMINENT HIGH-VISIBILITY DIAGNOSIS SECTION (بخش دایاگنوسیس در چشم پزشک) */}
                <div className="p-4 bg-rose-50/70 border-r-4 border-l-0 border-rose-600 rounded-lg shadow-md my-3 space-y-1 text-right" dir="rtl">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-5 h-5 text-rose-650 animate-pulse" />
                    <span className="text-xs font-black text-rose-800 tracking-wide">تشخیص بالینی فعال بیمار (Primary Clinician Diagnoses)</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-950 select-all tracking-tight leading-relaxed">
                    {selectedPatient.conditions.join(" ، ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2 font-sans">
                  <span>قد (Height): <strong className="text-slate-800 font-bold text-sm">{selectedPatient.height ? `${selectedPatient.height} cm` : "170 cm (Default)"}</strong></span>
                  <span className="text-slate-300 select-none">•</span>
                  <span>وزن (Weight): <strong className="text-slate-800 font-bold text-sm">{selectedPatient.weight ? `${selectedPatient.weight} kg` : "70 kg (Default)"}</strong></span>
                  <span className="text-slate-300 select-none">•</span>
                  <span>شاخص توده بدنی (BMI): <strong className="text-indigo-600 font-extrabold text-sm">
                    {selectedPatient.height && selectedPatient.weight 
                      ? (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)).toFixed(1)
                      : "24.2"
                    }
                  </strong></span>
                </div>
                {selectedPatient.allergies.length > 0 && (
                  <p className="text-[10px] text-rose-600 font-mono mt-1 font-bold">
                    Allergies: {selectedPatient.allergies.join(", ")}
                  </p>
                )}
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded p-4.5 shrink-0 text-[10px] text-rose-800 flex items-start gap-3 w-full md:w-64 shadow-xs" dir="rtl">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-1 leading-normal text-right w-full">
                  <strong className="block font-black uppercase tracking-wider text-rose-950 text-[11px] mb-1">تماس اضطراری سوپروایزر</strong>
                  <p className="text-slate-700">نام مخاطب: <strong className="text-rose-950 font-black">{selectedPatient.emergencyContact.name}</strong></p>
                  <p className="text-slate-700">شماره تماس ثابت: <strong className="text-rose-950 font-black underline">{selectedPatient.emergencyContact.phone}</strong></p>
                  <p className="text-slate-500 text-[9px] mt-1">رابطه فامیلی: {selectedPatient.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>

            {/* 🏥 CLINICIAN TABS NAVIGATION (تب‌های جداگانه هوش مصنوعی و درمان بالینی) */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-1.5 shadow-xs">
              <button
                onClick={() => setActiveTab("clinical")}
                className={`flex-1 py-3 text-xs uppercase tracking-wider font-extrabold rounded-md transition-all flex items-center justify-center gap-2 ${
                  activeTab === "clinical"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                پرونده و درمان کلینیکی (Clinical Records)
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-3 text-xs uppercase tracking-wider font-extrabold rounded-md transition-all flex items-center justify-center gap-2 ${
                  activeTab === "ai"
                    ? "bg-indigo-650 text-white shadow-sm"
                    : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50"
                }`}
              >
                <Sparkles className="w-4.5 h-4.5" />
                تحلیل‌ها و ابزار هوش مصنوعی (AI Assistant Hub)
              </button>
            </div>

            {/* 3. CONDITIONAL TABS RENDERING */}
            {activeTab === "clinical" ? (
              /* TAB 1: CLINICAL overview, baselines, medications, history & visits */
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Overrides Card with Height and Weight editing integrated! */}
                  <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Sliders className="w-4.5 h-4.5 text-slate-700" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">تنظیم اهداف قلبی و قد و وزن بیمار</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans">
                      پزشک معالج می‌تواند در این بخش اهداف قلبی-عروقی و اندازه قد و وزن فعلی بیمار را ویرایش کند تا زنگ خطرها دوباره سنجش شوند.
                    </p>

                    {successMsg && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        {successMsg}
                      </div>
                    )}

                    <form onSubmit={handleUpdateBaselineSubmit} className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">Target HR (bpm)</label>
                          <input
                            type="number"
                            value={editBaselines.hr}
                            onChange={(e) => setEditBaselines({ ...editBaselines, hr: parseInt(e.target.value) })}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-800 rounded font-mono text-slate-800"
                            min="50"
                            max="110"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">Target Systolic BP (mmHg)</label>
                          <input
                            type="number"
                            value={editBaselines.sys}
                            onChange={(e) => setEditBaselines({ ...editBaselines, sys: parseInt(e.target.value) })}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-800 rounded font-mono text-slate-800"
                            min="100"
                            max="160"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">Target Diastolic BP (mmHg)</label>
                          <input
                            type="number"
                            value={editBaselines.dia}
                            onChange={(e) => setEditBaselines({ ...editBaselines, dia: parseInt(e.target.value) })}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-800 rounded font-mono text-slate-800"
                            min="60"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">Target SpO2 (%)</label>
                          <input
                            type="number"
                            value={editBaselines.spo2}
                            onChange={(e) => setEditBaselines({ ...editBaselines, spo2: parseInt(e.target.value) })}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-800 rounded font-mono text-slate-800"
                            min="88"
                            max="100"
                          />
                        </div>
                      </div>

                      {/* 🔄 Height and Weight editing fields directly inside doctor overrides panel */}
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2.5">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">قد جدید (Height cm)</label>
                          <input
                            type="number"
                            value={docHeight}
                            onChange={(e) => setDocHeight(e.target.value)}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-205 focus:outline-none focus:border-slate-900 rounded font-mono text-slate-800"
                            min="100"
                            max="250"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight mb-0.5">وزن جدید (Weight kg)</label>
                          <input
                            type="number"
                            value={docWeight}
                            onChange={(e) => setDocWeight(e.target.value)}
                            className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-205 focus:outline-none focus:border-slate-900 rounded font-mono text-slate-800"
                            min="30"
                            max="250"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white font-sans font-bold text-[10px] py-2.5 rounded transition-all uppercase tracking-wider shadow-sm mt-1 cursor-pointer"
                      >
                        ذخیره اهداف و شاخص توده بدنی (Save & Recalculate)
                      </button>
                    </form>
                  </section>

                  {/* Clinician Medication Prescriptor */}
                  <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Pill className="w-4.5 h-4.5 text-indigo-650" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
                          بخش نسخه و داروهای فعال (Clinician Medication Prescriptor)
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans pt-1">
                        ثبت مستقیم نسخه‌های دارویی بیمار. بیمار فوراً هشدارهای دوزهای تجویز شده را در کارتابل خود دریافت می‌کند.
                      </p>

                      <div className="space-y-2 mt-3 max-h-[140px] overflow-y-auto">
                        {medsList.length === 0 ? (
                          <p className="text-xs italic text-slate-400 font-mono">No active medications registered.</p>
                        ) : (
                          medsList.map(m => (
                            <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">{m.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono ml-2">({m.dosage})</span>
                              </div>
                              <span className="text-[9px] text-indigo-650 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded font-mono">
                                {m.scheduleTimes?.join(', ') || "No schedule info"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <form onSubmit={handlePrescribeSubmit} className="space-y-2.5 pt-2 border-t border-slate-100">
                      {prescribeSuccess && (
                        <div className="p-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded font-mono">
                          ✓ {prescribeSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="نام دارو (مثلا متفورمین)"
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="text-xs p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-850 rounded text-slate-800 font-semibold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="مقدار دوز (مثلا ۵۰۰ میلی‌گرم)"
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          className="text-xs p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-850 rounded text-slate-800 font-semibold"
                          required
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="ساعات مصرف (مثلا 08:00, 20:00)"
                          value={newMedTimes}
                          onChange={(e) => setNewMedTimes(e.target.value)}
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-850 rounded font-mono text-slate-850"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-4 py-2.5 rounded transition-all uppercase tracking-wide shrink-0 cursor-pointer"
                        >
                          Prescribe
                        </button>
                      </div>
                    </form>
                  </section>
                </div>

                {/* 🌟 NEW COMPREHENSIVE HISTORY SECTION (جایگزین دو بخش هوش مصنوعی - سابقه بیمار، تعداد بچه‌ها و غیره) */}
                <section className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-slate-400">PATIENT HEALTH BACKGROUND</span>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                      🩺 سابقه پزشکی و خانوادگی کامل بیمار (History & Physical)
                    </h3>
                  </div>

                  {historySuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg font-sans">
                      {historySuccessMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Display Columns */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100" dir="rtl">
                      <h4 className="text-xs font-black text-indigo-900 border-b border-indigo-100 pb-1 flex items-center gap-1">
                        <span>پس‌زمینه ساختاری و خانوادگی</span>
                      </h4>
                      <div className="text-xs space-y-2 text-slate-700 leading-relaxed font-sans text-right">
                        <p>تعداد فرزندان (Children): <strong className="text-slate-900 font-extrabold text-sm text-[13px]">
                          {patientBackgrounds[selectedPatient.id]?.numberOfChildren ?? 0} فرزند
                        </strong></p>
                        <p>وضعیت تاهل (Marital Status): <strong>{patientBackgrounds[selectedPatient.id]?.maritalStatus || "نامشخص"}</strong></p>
                        <p>شغل و حرفه (Occupation): <strong>{patientBackgrounds[selectedPatient.id]?.occupation || "نامشخص"}</strong></p>
                        <p>گروه خونی با فاکتور: <strong className="text-rose-650 font-bold">{patientBackgrounds[selectedPatient.id]?.bloodType || "O+"}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100" dir="rtl">
                      <h4 className="text-xs font-black text-indigo-900 border-b border-indigo-100 pb-1 flex items-center gap-1">
                        <span>سوابق جراحی و عوارض مزمن</span>
                      </h4>
                      <div className="text-xs text-slate-700 space-y-1.5 font-sans text-right leading-relaxed">
                        <strong className="block text-slate-500 text-[10px]">سوابق جراحی مکرر:</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-800">
                          {patientBackgrounds[selectedPatient.id]?.pastSurgeries?.map((s, idx) => (
                            <li key={idx} className="text-[11px]">{s}</li>
                          )) || <li className="italic text-slate-400">سابقه‌ای ثبت نگردیده</li>}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100" dir="rtl">
                      <h4 className="text-xs font-black text-indigo-900 border-b border-indigo-100 pb-1 flex items-center gap-1">
                        <span>فاکتورهای قلبی و سبک زندگی</span>
                      </h4>
                      <div className="text-xs space-y-2 text-slate-700 font-sans text-right leading-relaxed">
                        <p>عادات دخانیات و الکل: <strong className="text-slate-900">{patientBackgrounds[selectedPatient.id]?.smokeAlcoholHabits || "بدون سابقه"}</strong></p>
                        <p className="border-t border-slate-200/60 pt-1.5 mt-1.5 text-[11px] text-slate-650">
                          <strong className="text-slate-500 block text-[10px] mb-0.5">سابقه بیماری قلبی بستگان:</strong>
                          {patientBackgrounds[selectedPatient.id]?.cardiacFamilyHistory || "موردی گزارش نشده"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✏️ EDIT HISTORY FORM FOR CLINICIAN */}
                  <form onSubmit={handleUpdateHistorySubmit} className="bg-slate-50/50 border border-slate-200/80 p-4.5 rounded-lg space-y-4 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                      ویرایش سوابق و جزییات خانواده بیمار (Edit Patient Background History)
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">تعداد فرزندان (Kids Count)</label>
                        <input
                          type="number"
                          value={editNumChildren}
                          onChange={(e) => setEditNumChildren(parseInt(e.target.value) || 0)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                          min="0"
                          max="15"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">وضعیت تاهل (Marital Status)</label>
                        <input
                          type="text"
                          value={editMaritalStatus}
                          onChange={(e) => setEditMaritalStatus(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="متاهل، مجرد، بیوه..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">شغل بیمار (Occupation)</label>
                        <input
                          type="text"
                          value={editOccupation}
                          onChange={(e) => setEditOccupation(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="مثلا کارمند بازنشسته"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">گروه خونی (Blood Type)</label>
                        <input
                          type="text"
                          value={editBloodType}
                          onChange={(e) => setEditBloodType(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="O+, A-, AB+..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">سوابق جراحی مکرر (جدا شده با کاما)</label>
                        <input
                          type="text"
                          value={editPastSurgeries}
                          onChange={(e) => setEditPastSurgeries(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="کیسه صفرا (1998)، مفصل ران (2015)"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">سبک زندگی و عادات (Habits)</label>
                        <input
                          type="text"
                          value={editSmokeAlcohol}
                          onChange={(e) => setEditSmokeAlcohol(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="غیرسیگاری، مصرف اندک قهوه"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-sans font-bold">سابقه بیماری قلبی در بستگان (Family Cardiac Risk)</label>
                        <input
                          type="text"
                          value={editCardiacFamily}
                          onChange={(e) => setEditCardiacFamily(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-220 rounded font-semibold text-slate-800 focus:outline-none"
                          placeholder="پدر فیبریلاسیون دهلیزی شدید داشته..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-650 hover:bg-slate-900 text-white font-bold text-xs py-2 px-6 rounded transition-all cursor-pointer shadow-sm shadow-indigo-100"
                      >
                        ثبت و به روز رسانی پیشینه بیمار (Commit Family Background)
                      </button>
                    </div>
                  </form>
                </section>

                {/* 🌟 NEW PATIENT LOGS OF CLINICAL VISITS TIMELINE (لاگ مراجعه‌های قبلی بیمار بجای هشدارهای متواتر خام) */}
                <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                      📅 تاریخچه مراجعه‌های قبلی بیمار به کلینیک (Clinical Visit Encounters Log)
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">SOAP Encampments database records</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    این لاگ شامل ارزیابی‌های حضوری و معاینه‌های پیشین قلبی بیمار در مرکز درمانی است تا پزشکان بتوانند روند بهبودی را به صورت تاریخی پایش کنند.
                  </p>

                  {/* visits timeline log */}
                  <div className="space-y-4.5 max-h-[350px] overflow-y-auto pr-1">
                    {getPatientVisits(selectedPatient.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-5">هیچ معاینه بالینی ثبت نگردیده است.</p>
                    ) : (
                      getPatientVisits(selectedPatient.id).map((visit, index) => (
                        <div key={visit.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-lg shadow-xs flex flex-col md:flex-row gap-3 relative md:items-start transition-all hover:border-slate-300">
                          <div className="shrink-0 flex md:flex-col items-center gap-1.5 bg-slate-900 text-white p-2 md:p-2.5 rounded text-center md:w-28 shadow-xs md:mt-1">
                            <span className="text-[10px] font-mono block tracking-tight">{visit.date}</span>
                            <span className="text-[9px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest block font-sans">
                              معاینه بالینی
                            </span>
                          </div>

                          <div className="space-y-2 flex-1 text-right" dir="rtl">
                            <div className="flex md:flex-row-reverse justify-between items-center border-b border-dashed border-slate-200 pb-1">
                              <span className="text-[11px] text-slate-500">پزشک معالج: <strong className="text-slate-800 font-bold">{visit.diagnostician}</strong></span>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">{visit.status}</span>
                            </div>
                            <div className="text-xs space-y-1.5 leading-relaxed text-slate-700">
                              <p><strong className="text-indigo-900 font-extrabold block text-[11px] mb-0.5">علائم و علت مراجعه بیمار (Chief Complaints):</strong> {visit.complaint}</p>
                              <p className="border-t border-slate-200/50 pt-1 mt-1 text-[11px] text-slate-650">
                                <strong className="text-emerald-850 font-extrabold block text-[11px] mb-0.5">برنامه تشخیصی و درمانی (Treatment Clinical Plan):</strong> {visit.treatmentPlan}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ✏️ ADD NEW VISIT FORM */}
                  <div className="bg-indigo-50/30 border border-indigo-120 p-4.5 rounded-lg space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span>ثبت معاینه بالینی جدید بیمار (Record New Clinical SOAP Encounter)</span>
                    </h4>

                    {newVisitSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg font-sans">
                        {newVisitSuccess}
                      </div>
                    )}

                    <form onSubmit={handleAddNewVisitSubmit} className="space-y-3 font-sans">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold">تاریخ مراجعه (Date)</label>
                          <input
                            type="date"
                            value={newVisitDate}
                            onChange={(e) => setNewVisitDate(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-semibold text-slate-850"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold">پزشک معاین (Physician)</label>
                          <input
                            type="text"
                            value={newVisitDoc}
                            onChange={(e) => setNewVisitDoc(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-semibold text-slate-850"
                            placeholder="دکتر سهرابی"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold">وضعیت پایانی (Clinical Status)</label>
                          <input
                            type="text"
                            value={newVisitStatus}
                            onChange={(e) => setNewVisitStatus(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-semibold text-slate-850"
                            placeholder="ترخیص با داروی جدید"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-right" dir="rtl">
                        <label className="block text-[10px] text-slate-500 font-bold text-right">شکایات بالینی علائم بیمار (Chief Complaint)</label>
                        <textarea
                          rows={2}
                          value={newVisitComplaint}
                          onChange={(e) => setNewVisitComplaint(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-650"
                          placeholder="توضیح دهید مثلا: بیمار شکایت دارد از سوزش ناگهانی پشت سینه..."
                          required
                        />
                      </div>

                      <div className="space-y-1 text-right" dir="rtl">
                        <label className="block text-[10px] text-slate-500 font-bold text-right">طرح درمان پزشک و تجویزها (Treatment Plan)</label>
                        <textarea
                          rows={2}
                          value={newVisitTreatment}
                          onChange={(e) => setNewVisitTreatment(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-650"
                          placeholder="مثلا تجویز قرص آتورواستاتین، توصیه به پرهیز از کارهای ثانویه سنگین..."
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-slate-900 border border-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-lg transition-all cursor-pointer shadow-xs shadow-indigo-100"
                        >
                          ثبت نهایی گزارش معاینه بیمار
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              </div>
            ) : (
              /* TAB 2: AI HOUSING (AI Generative Clinical Synthesis & Lab analyzer) */
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
                  {/* AI Generative Synthesis Card */}
                  <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
                          سنتز تحلیل هوش مصنوعی (AI Clinical Synthesis)
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans pt-1">
                        گزارشات و هشدارهای قلبی دریافتی از راه دور، فایلهای بایوسنسور و پایبندی دارویی بیمار را تالیف نموده و تحلیل همه‌جانبه ارائه می‌دهد.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-sans font-bold text-[10px] py-3 px-4 rounded flex items-center justify-center gap-1.5 shadow-sm transition-all uppercase tracking-wider cursor-pointer"
                        id="btn-trigger-ai-synthesis"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        {generatingReport ? "Synthesizing Clinical Logs..." : "Compile Gemini Diagnostics"}
                      </button>
                    </div>
                  </section>

                  {/* Lab Analysis Workspace */}
                  <section className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <FlaskConical className="w-4.5 h-4.5 text-indigo-650" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
                        آنالیزور هوشمند آزمایش خون (AI Lab Analyzer)
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans pt-1">
                      آزمایش‌های بالینی و نشانگرهای استخراج شده بیمار را بررسی نموده و یادداشت پزشکی (Doctor) و یادداشت تسکین‌بخش خانواده (Caregiver) تولید می‌کند.
                    </p>

                    <div className="flex gap-2">
                      <select
                        value={labType}
                        onChange={(e) => setLabType(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-xs font-bold focus:outline-none text-slate-800 font-mono select-none"
                      >
                        <option value="lipids">Preset: Lipid Profile Anomaly</option>
                        <option value="diabetic">Preset: Glycemic/Diabetic Panel</option>
                        <option value="renal">Preset: Renal Clearence Impairment</option>
                        <option value="custom">Preset: Normal Baseline Readings</option>
                      </select>

                      <button
                        onClick={handleRunLabAnalysis}
                        disabled={analyzingLab}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-[10px] px-4 py-2 rounded uppercase tracking-wider transition-all cursor-pointer"
                      >
                        {analyzingLab ? "Analyzing..." : "Analyze Lab Sheet"}
                      </button>
                    </div>
                  </section>
                </div>

                {/* AI Lab Analysis Results Panel */}
                {labAnalysisResult && (
                  <section className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm animate-fadeIn">
                    <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase mb-1">Dual-View AI Synthesis</span>
                        <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight mt-1">Compiled Laboratory Test Breakdown</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplet className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-500 font-mono">BILINGUAL TRANSLATION COMPLIANT</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Doctor view - clinical & technical */}
                      <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          Clinician Technical Assessment
                        </h4>
                        <div className="markdown-body text-[11px] text-slate-700 space-y-1 leading-relaxed">
                          <ReactMarkdown>{labAnalysisResult.doctor_brief}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Caregiver/Family view - soft and reassuring in English */}
                      <div className="bg-emerald-50/40 border border-emerald-250 p-4 rounded-lg shadow-sm space-y-2 text-left" dir="ltr">
                        <h4 className="text-xs font-bold text-emerald-900 tracking-tight border-b border-emerald-100 pb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Family & Caregiver Reassurance Summary
                        </h4>
                        <div className="markdown-body text-[11px] text-emerald-950 space-y-1 leading-relaxed font-med">
                          <ReactMarkdown>{labAnalysisResult.family_brief}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight font-mono">extracted lab biomarkers</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {labAnalysisResult.biomarkers?.map((b: any, i: number) => (
                          <div key={i} className="p-2.5 border border-slate-150 rounded bg-slate-50 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono leading-tight">{b.name}</p>
                              <p className="text-xs font-bold text-slate-800 font-mono">
                                {b.value} <span className="text-[10px] font-normal text-slate-500">{b.unit}</span>
                              </p>
                            </div>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              b.status === 'CRITICAL' 
                                ? 'bg-rose-50 border-rose-300 text-rose-700' 
                                : b.status === 'DISCUSS' 
                                ? 'bg-amber-50 border-amber-300 text-amber-700' 
                                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* AI Generate Clinical Summary Display panel */}
                {reportData && (
                  <section className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm relative animate-fadeIn" id="clinical-pdf-summary">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[8px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">DIGITAL ARTIFACT</span>
                        <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">Diagnostic-Grade PDF/HTML Summary</h3>
                      </div>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1 bg-white text-slate-800 text-[10px] font-bold px-2.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded transition-all shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Summary
                      </button>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div className="space-y-3">
                        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-sm">
                          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Physician Assessment</h4>
                          <div className="markdown-body text-xs text-slate-750 font-medium space-y-1">
                            <ReactMarkdown>{reportData.summary}</ReactMarkdown>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-sm">
                          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Deep Telemetry & Anomaly Analysis</h4>
                          <div className="markdown-body text-xs text-slate-755 font-medium space-y-1">
                            <ReactMarkdown>{reportData.detailedAnalysis}</ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-sm">
                        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Actionable Care Recommendations</h4>
                        <ul className="list-disc leading-relaxed text-xs text-slate-800 list-inside space-y-1">
                          {reportData.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Core Metrics Compiled */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1.5">
                        <div className="bg-white border border-slate-200 p-2.5 rounded text-center">
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Total Telemetries</span>
                          <strong className="text-xs font-bold text-slate-900 font-mono">{reportData.metricsCompiled.totalReadings} docs</strong>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded text-center">
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Active Anomalies</span>
                          <strong className="text-xs font-bold text-rose-600 font-mono">{reportData.metricsCompiled.anomaliesCount} flags</strong>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded text-center">
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Telemetry Avg HR</span>
                          <strong className="text-xs font-bold text-slate-900 font-mono">{reportData.metricsCompiled.avgHR} bpm</strong>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded text-center">
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Telemetry Avg BP</span>
                          <strong className="text-xs font-bold text-slate-900 font-mono">{reportData.metricsCompiled.avgBP} mmHg</strong>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-slate-200 p-12 text-center rounded-lg text-slate-400 text-xs font-sans">
            Select a patient from the telemetry queue to examine clinical data streams.
          </div>
        )}
      </div>
    </div>
  );
}
