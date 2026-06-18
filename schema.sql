-- SQL Schema Setup for Cardiovascular Remote Patient Monitoring (RPM)
-- Database: PostgreSQL + TimescaleDB Extension (for Timeseries Performance)

-- Enable TimescaleDB extension if not active
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enums
CREATE TYPE user_role AS ENUM ('PATIENT', 'CAREGIVER', 'CLINICIAN', 'ADMIN');
CREATE TYPE vital_source AS ENUM ('MANUAL', 'WEARABLE_API');
CREATE TYPE alert_level AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE medication_status AS ENUM ('TAKEN', 'SKIPPED');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Patient Profiles Table (Relational Meta)
CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    baseline_heart_rate INT DEFAULT 72,
    baseline_systolic_bp INT DEFAULT 120,
    baseline_diastolic_bp INT DEFAULT 80,
    baseline_spo2 DECIMAL(4,1) DEFAULT 98.0,
    emergency_contact_json JSONB NOT NULL, -- {name: "", relationship: "", phone: ""}
    medical_conditions TEXT[] DEFAULT '{}',
    medication_allergies TEXT[] DEFAULT '{}',
    caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    clinician_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Vitals Timeseries Table (TimescaleDB Hypertable)
CREATE TABLE vitals_timeseries (
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    heart_rate INT,
    systolic_bp INT,
    diastolic_bp INT,
    spo2 DECIMAL(4,1),
    temperature DECIMAL(4,1),
    raw_data_source vital_source NOT NULL DEFAULT 'MANUAL',
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_reason TEXT,
    PRIMARY KEY (patient_id, timestamp)
);

-- Turn vitals_timeseries into a TimescaleDB hypertable partitioned by timestamp (e.g. 7-day chunks)
SELECT create_hypertable('vitals_timeseries', 'timestamp', chunk_time_interval => INTERVAL '7 days');

-- Create indexing optimization for Timescale query performance over patient IDs
CREATE INDEX idx_vitals_patient_vitals ON vitals_timeseries (patient_id, timestamp DESC);

-- 4. Alerts Table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level alert_level NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'HEART_RATE', 'BLOOD_PRESSURE', 'SPO2', etc.
    message TEXT NOT NULL,
    status alert_status NOT NULL DEFAULT 'ACTIVE',
    clinician_notes TEXT,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_patient ON alerts (patient_id, timestamp DESC);

-- 5. Medications Definitions Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    scheduled_times VARCHAR(10)[] NOT NULL, -- e.g., ['08:00', '14:00', '20:00']
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Medication Adherence Logs (Timeseries Tracking)
CREATE TABLE medication_adherence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status medication_status NOT NULL DEFAULT 'TAKEN'
);

CREATE INDEX idx_med_adherence_patient ON medication_adherence_logs (patient_id, taken_at DESC);
