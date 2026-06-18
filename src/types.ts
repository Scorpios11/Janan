/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  PATIENT = "PATIENT",
  CAREGIVER = "CAREGIVER",
  CLINICIAN = "CLINICIAN",
  ADMIN = "ADMIN"
}

export enum VitalsSource {
  MANUAL = "MANUAL",
  WEARABLE_API = "WEARABLE_API"
}

export enum AlertLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL"
}

export interface PatientProfile {
  id: string;
  name: string;
  email?: string;
  dob: string;
  gender: string;
  baselineHeartRate: number;
  baselineSystolicBP: number;
  baselineDiastolicBP: number;
  baselineSpO2: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  conditions: string[];
  allergies: string[];
  height?: number;
  weight?: number;
}

export interface VitalsRecord {
  id: string;
  patientId: string;
  timestamp: string; // ISO string
  heartRate: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  spo2: number | null;
  temperature: number | null;
  rawDataSource: VitalsSource;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  vitalsRecordId?: string;
  timestamp: string;
  level: AlertLevel;
  type: "HEART_RATE" | "BLOOD_PRESSURE" | "SPO2" | "TEMPERATURE" | "SYSTEM";
  message: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  notes?: string;
  cooldownUntil?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  scheduleTimes: string[]; // e.g. ["08:00", "20:00"]
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  patientId: string;
  takenAt: string; // ISO string
  status: "TAKEN" | "SKIPPED";
}

export interface ClinicalReport {
  id: string;
  patientId: string;
  generatedAt: string;
  summary: string;
  detailedAnalysis: string;
  recommendations: string[];
  metricsCompiled: {
    totalReadings: number;
    anomaliesCount: number;
    avgHR: number;
    avgBP: string;
  };
}
