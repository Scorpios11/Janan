# -*- coding: utf-8 -*-
"""
@license
SPDX-License-Identifier: Apache-2.0
AI-Powered Adaptive Alert Engine for Cardiovascular Risk Detection
Removes alarm fatigue by using an Adaptive Baseline Model instead of static thresholds.
"""

from typing import Dict, List, Optional, Tuple
import datetime
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

# Define Request Objects
class VitalReading(BaseModel):
    patient_id: str
    timestamp: datetime.datetime
    heart_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    raw_data_source: str = "MANUAL"

class AlertLevel:
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class AnomalyResult(BaseModel):
    is_anomaly: bool
    alert_level: Optional[str] = None
    message: str
    category: str  # HEART_RATE, BLOOD_PRESSURE, SPO2
    z_score: Optional[float] = None


class AdaptiveAlertEngine:
    def __init__(self, z_score_threshold: float = 2.5, min_history_records: int = 5):
        """
        Initialize the Alert Engine.
        :param z_score_threshold: Number of standard deviations away from baseline before anomaly detection.
        :param min_history_records: Minimum historical clean samples required to compute dynamic Z-scores.
        """
        self.z_score_threshold = z_score_threshold
        self.min_history_records = min_history_records

        # Static Safety Fallback Thresholds (To protect patients when no baseline exists yet)
        self.safety_limits = {
            "heart_rate": {"critical_high": 120, "critical_low": 50},
            "systolic_bp": {"critical_high": 180, "critical_low": 90},
            "spo2": {"critical_low": 90.0, "hypoxia_limit": 85.0} # Hypoxia is always critical
        }

    def evaluate_reading(
        self, 
        current_reading: VitalReading, 
        historical_clean_readings: List[Dict],
        active_alerts: List[Dict]
    ) -> List[AnomalyResult]:
        """
        Core pipeline balancing rule-based safety ranges and a personalized dynamic z-score baseline.
        
        :param current_reading: Under-evaluation VitalReading object
        :param historical_clean_readings: List of past clean readings (without recorded anomalies) over past 7 days
        :param active_alerts: Currently active alert states for cooldown and deduplication checks
        :return: List of evaluated anomalies
        """
        anomalies: List[AnomalyResult] = []
        df_history = pd.DataFrame(historical_clean_readings)

        # 1. EVALUATE BLOOD PRESSURE (Systolic Focus)
        if current_reading.systolic_bp is not None:
            bp_anomaly = self._evaluate_metric(
                metric_name="systolic_bp",
                current_val=current_reading.systolic_bp,
                df_history=df_history,
                safety_high=self.safety_limits["systolic_bp"]["critical_high"],
                safety_low=self.safety_limits["systolic_bp"]["critical_low"],
                category="BLOOD_PRESSURE",
                unit="mmHg"
            )
            if bp_anomaly:
                anomalies.append(bp_anomaly)

        # 2. EVALUATE HEART RATE
        if current_reading.heart_rate is not None:
            hr_anomaly = self._evaluate_metric(
                metric_name="heart_rate",
                current_val=current_reading.heart_rate,
                df_history=df_history,
                safety_high=self.safety_limits["heart_rate"]["critical_high"],
                safety_low=self.safety_limits["heart_rate"]["critical_low"],
                category="HEART_RATE",
                unit="bpm"
            )
            if hr_anomaly:
                anomalies.append(hr_anomaly)

        # 3. EVALUATE SPO2 (Special criteria for hypoxia safety)
        if current_reading.spo2 is not None:
            spo2_val = current_reading.spo2
            if spo2_val < self.safety_limits["spo2"]["hypoxia_limit"]:
                # Hypoxia is an absolute clinical emergency
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    alert_level=AlertLevel.CRITICAL,
                    message=f"CRITICAL: Extreme Hypoxia detected at SpO2 {spo2_val}%! Prompt escalation required.",
                    category="SPO2"
                ))
            elif spo2_val < self.safety_limits["spo2"]["critical_low"]:
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    alert_level=AlertLevel.WARNING,
                    message=f"WARNING: Mild Hypoxia detected at SpO2 {spo2_val}%. Ensure supplemental flows.",
                    category="SPO2"
                ))
            else:
                # Dynamic model checks for SpO2 drops
                spo2_anomaly = self._evaluate_metric(
                    metric_name="spo2",
                    current_val=spo2_val,
                    df_history=df_history,
                    safety_high=100.0,
                    safety_low=self.safety_limits["spo2"]["critical_low"],
                    category="SPO2",
                    unit="%"
                )
                if spo2_anomaly and spo2_anomaly.is_anomaly:
                    # SpO2 dropping below patient baseline is always crucial
                    spo2_anomaly.alert_level = AlertLevel.CRITICAL
                    anomalies.append(spo2_anomaly)

        # 4. DUPLICATION DE-DUPLICATION / COOLDOWN (15-Minute Threshold)
        filtered_anomalies = self._apply_cooldown(anomalies, active_alerts)
        return filtered_anomalies

    def _evaluate_metric(
        self,
        metric_name: str,
        current_val: float,
        df_history: pd.DataFrame,
        safety_high: float,
        safety_low: float,
        category: str,
        unit: str
    ) -> Optional[AnomalyResult]:
        """
        Evaluate a single metric against static boundaries and adaptive Z-Score.
        """
        # A. Core Static Override Rules (Preempts everything for patient preservation)
        if current_val >= safety_high:
            return AnomalyResult(
                is_anomaly=True,
                alert_level=AlertLevel.CRITICAL,
                message=f"CRITICAL HIGH: Patient {metric_name} is {current_val} {unit}, exceeding absolute safety limit ({safety_high} {unit}).",
                category=category
            )
        if current_val <= safety_low:
            return AnomalyResult(
                is_anomaly=True,
                alert_level=AlertLevel.CRITICAL,
                message=f"CRITICAL LOW: Patient {metric_name} is {current_val} {unit}, lower than absolute safety limit ({safety_low} {unit}).",
                category=category
            )

        # B. Fallback check: Minimum historical readings required
        if df_history.empty or len(df_history) < self.min_history_records or metric_name not in df_history.columns:
            # Baseline doesn't exist yet, standard static bounds check for alerts (softer warning thresholds)
            warning_high = safety_high * 0.85
            warning_low = safety_low * 1.15
            if current_val >= warning_high:
                return AnomalyResult(
                    is_anomaly=True,
                    alert_level=AlertLevel.WARNING,
                    message=f"WARNING: Baseline unestablished. Metric {metric_name} is elevated at {current_val} {unit}.",
                    category=category
                )
            return None # Status is green

        # C. AI-driven Adaptive Baseline Model (Rolling Standard Deviation / Z-Score)
        try:
            # Extract historical column series, clean nulls
            history_series = df_history[metric_name].dropna()
            if len(history_series) < self.min_history_records:
                return None

            mean_val = float(history_series.mean())
            std_val = float(history_series.std(ddof=1)) # Sample standard deviation

            # Handle zero standard deviation gracefully (patients with highly regular heart rate, e.g., pacemaker patients)
            if std_val < 0.05 * mean_val:
                std_val = 0.05 * mean_val

            z_score = abs(current_val - mean_val) / std_val

            if z_score >= self.z_score_threshold:
                direction = "elevated" if current_val > mean_val else "collapsed"
                level = AlertLevel.CRITICAL if z_score >= 3.5 else AlertLevel.WARNING
                
                return AnomalyResult(
                    is_anomaly=True,
                    alert_level=level,
                    message=f"ADAPTIVE ANOMALY: Patient baseline {metric_name} is {direction} at {current_val} {unit} "
                            f"(baseline standard mean: {mean_val:.1f} {unit}, z-score: {z_score:.2f}σ).",
                    category=category,
                    z_score=z_score
                )
        except Exception as e:
            # Shield calculations from runtime interruptions, fallback to normal state
            print(f"Error computing Z-Score: {str(e)}")
            
        return None

    def _apply_cooldown(
        self, 
        current_anomalies: List[AnomalyResult], 
        active_alerts: List[Dict]
    ) -> List[AnomalyResult]:
        """
        Check existing active alerts and suppress duplicates within 15 mins
        unless the severity of the alert increases.
        """
        retained_anomalies: List[AnomalyResult] = []
        for anomaly in current_anomalies:
            duplicate_active = False
            for alert in active_alerts:
                if alert["category"] == anomaly.category:
                    # Check if created within past 15 minutes (900 seconds)
                    alert_ts = alert.get("timestamp")
                    if isinstance(alert_ts, str):
                        try:
                            alert_ts = datetime.datetime.fromisoformat(alert_ts.replace("Z", "+00:00"))
                        except ValueError:
                            pass
                    
                    if isinstance(alert_ts, datetime.datetime):
                        time_diff = (datetime.datetime.now(datetime.timezone.utc) - alert_ts).total_seconds()
                        if time_diff < 900: # 15 minutes cooldown.
                            # Check severity: if old was WARNING but new is CRITICAL, trigger escalation
                            if alert["level"] == AlertLevel.WARNING and anomaly.alert_level == AlertLevel.CRITICAL:
                                # Escalate! Do not suppress.
                                anomaly.message += " [ESCALATION ALERT]"
                            else:
                                duplicate_active = True
                                break
            
            if not duplicate_active:
                retained_anomalies.append(anomaly)
                
        return retained_anomalies
