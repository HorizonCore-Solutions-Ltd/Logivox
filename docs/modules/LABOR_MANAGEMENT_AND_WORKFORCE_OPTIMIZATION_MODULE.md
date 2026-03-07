# 👥 Labor Management & Workforce Optimization Module

**Module**: 8 - Workforce Planning, Tracking & Optimization  
**Status**: ✅ Complete Specification  
**Type**: Advanced AI / Adminless / Human Performance Engine

---

## 📋 Executive Summary

This module serves as the **human performance engine** of LogiVox, ensuring the right people are in the right place at the right time. It transcends traditional "Time & Attendance" to become an **AI-driven labor orchestration system** capable of "Adminless" operations—where the system autonomously allocates labor, rebalances zones, and assigns tasks based on real-time SLAs and congestion.

---

## 1. Purpose and Scope

This module governs everything related to labor, workforce, skills, productivity, and real‑time optimization.

**Core Objectives:**

- **Allocate Labor Dynamically:** instant response to wave progress and bottlenecks.
- **Real-Time Productivity:** Live tracking of "True Productivity" (Task Time / Paid Time).
- **Adminless Operation:** Support modes where AI manages the floor, and humans only handle escalations.
- **Skill Management:** Deep tracking of certifications, cross-training, and expiration risks.
- **Coaching:** AI-driven micro-feedback to workers (e.g., "Scanning the location first saves 2 seconds").

---

## 2. Roles and Surfaces

### Roles

- **Shift Manager:** Oversees overall efficiency and cost.
- **Labor Planner:** Forecasts headcount needs weeks in advance.
- **Zone Lead:** Manages exceptions in a specific physical area.
- **HR/Training Manager:** Focuses on skills, compliance, and retention.
- **Floor Supervisor:** Mobile-first user handling real-time blockers.
- **Worker:** The end-user (Picker, Driver, QC, Packer, etc.).

### Surfaces

- **Labor Planning Console:** Desktop view for forecasting and shift templates.
- **Real-Time Labor Board:** "God Mode" view of the floor (Heatmaps, Idle Workers).
- **Worker Mobile App:** Personal dashboard for tasks, performance, and safety.
- **Supervisor Mobile App:** Triage tool for approving overtime or moving workers.
- **Training Dashboard:** Tracking certifications and automated refresher scheduling.

---

## 3. Worker Profiles & Skill Matrix

### Worker Profile

The digital twin of the employee, tracking:

- **Skills:** (Picking, Forklift, Reach Truck, Clamp, Hazmat, Cold Chain).
- **Certifications:** License numbers, expiry dates, and digital copies.
- **Experience Level:** Trainee, Proficient, Expert, Trainer.
- **Productivity History:** Rolling average of units/hour per task type.
- **Constraints:** Medical restrictions, union rules, max lift weight.
- **Voice Readiness:** Language preference, speed settings, voice profile.

### Skill Matrix

A 2D mapping driving the allocation engine:

- Defines **Proficiency Levels** (1-5) for every task type.
- Identifies **Cross-Training** candidates (e.g., "Worker is Level 5 in Picking, train in QC").
- Auto-blocks tasks if certifications are expired.

---

## 4. Real-Time Labor Visibility

### The Labor Board

- **Heatmaps:** Visual density of workers in aisles vs. order volume.
- **Status Indicators:**
  - 🟢 **Active:** Moving/Scanning.
  - 🟡 **Idle:** No scan for 2+ minutes.
  - 🔴 **Blocked:** Reported an exception/interruption.
- **Congestion Analysis:** Real-time alerts for "Traffic Jams" in high-velocity zones.

### Worker Telemetry

- **Travel vs. Productive:** Split analysis of time spent walking vs. working.
- **Fatigue Indicators:** Anomaly detection dropping picking rates toward end of shift.
- **Error Rates:** Spikes in short-picks or mis-scans triggering "Coaching Needed" alerts.

### Voice Integration & Intent Tracking

The **Voice Module** acts as the primary telemetry source for floor operations, providing granular data beyond simple task completion:

- **Session Persistence:** Every voice interaction is logged in `VoiceSession` (Postgres), capturing transcripts, intents (`PICK`, `SHORT_PICK`), and response times.
- **Exception Intelligence:**
  - **Short Picks:** Automatically recorded in `ExceptionRecord`.
  - **Adminless Resolution:** Small discrepancies (<3 units) are **auto-resolved** to keep flow moving.
  - **Escalation:** Large discrepancies (>3 units) trigger real-time alerts to Zone Leads.
- **Intent Analysis:** Tracks frequency of `HELP`, `REPEAT`, or `WHERE_IS` commands to identify training gaps or confusing warehouse signage.

---

## 5. Labor Allocation & Dynamic Rebalancing

### Allocation Engine

Assigns workers to zones based on a multi-variable score:

- **Workload:** Volume of open tasks in the zone.
- **SLA Pressure:** Approaching cut-off times for carriers.
- **Skill Fit:** Matching "Expert" pickers to "Complex" orders.

### Dynamic Rebalancing (The "Adminless" Brain)

Automatically moves workers without human intervention when:

- **Returns Spike:** Pulls cross-trained pickers to the returns validation area.
- **Dock Congestion:** Shifts forklift drivers from Putaway to Loading.
- **Wave Completion:** Auto-releases pickers to the next active wave.

---

## 6. Task Assignment & Interleaving

### Intelligent Interleaving

Reduces deadhead travel by chaining dissimilar tasks:

1.  **Pick** items for Order A (Aisle 4).
2.  **Replenish** slot in Aisle 5 (nearby).
3.  **Cycle Count** slot in Aisle 6 (en route).
4.  **Drop** at Packing Station.

### Task Assignment Logic

- **Fatigue Aware:** Avoids giving "Heavy Lift" tasks continuously to the same worker.
- **Congestion Aware:** avoiding sending 3 pickers to the same narrow aisle simultaneously.

---

## 7. Productivity Tracking & Gamification

### Performance Scoring

- **Weighted Model:** `(Lines * A) + (Units * B) - (Errors * C)`. Customizable per client.
- **SLA Impact:** Bonus points for clearing "At Risk" orders.

### Gamification (Optional)

- **Leaderboards:** "Golden Scanner" award for top zone performer.
- **Shift Goals:** "Team unlock: Pizza party if we clear 10k units by 2 PM."
- **Badges:** "Speed Demon", "Accuracy Ace", "Safe Operator".

---

## 8. Forecasting & Planning

### AI Labor Forecasting

Predicts headcount needs by ingesting:

- **Historical Order Volume:** Last year's matching week.
- **Inbound ASN Data:** Incoming workload.
- **Marketing Events:** "Black Friday" multipliers.

### What-If Simulation

- "What if we add 5 temp workers?"
- "What if the sorting machine breaks?"
- "What if order volume doubles tomorrow?"

---

## 9. Training, Certification & Compliance

### Management System

- **Auto-Expiry:** Alerts supervisor 30 days before Forklift License expires.
- **Hard Blocks:** System refuses to assign a Forklift Task if license is expired.
- **Refresher Training:** Triggered automatically by high error rates in specific tasks.

---

## 10. Operating Modes

### 🟢 Admin-Controlled (Legacy)

- Planners assign workers to zones manually.
- Supervisors explicitly approve every move.

### 🟡 Admin-Assisted (Hybrid)

- System suggests moves ("Move 3 people to Shipping").
- Supervisor clicks "Approve" or "Reject".

### 🟣 Adminless (Autonomous)

- System allocates labor and rebalances zones automatically.
- Tasks are assigned and interleaved by AI.
- Breaks are auto-scheduled to maintain coverage.
- **Humans only handle escalations** (Safety incidents, hardware failure).

---

## 11. Optimization & Future Capabilities

### AI Coaching

- **Micro-Feedback:** "You are dwelling 15s at the slot. Try organizing your cart differently."
- **Safety Nudges:** "Slow down, corner approaching."

### Robotics Integration

- **Hybrid Work:** Assigns the "Long Walk" to AMRs and the "Dexterous Pick" to humans.
- **Cobot Pacing:** Adjusts robot speed to match the assigned human's fatigue level.

### Sustainability

- **Energy Tracking:** Optimizes forklift routes to save battery/charging cycles.
- **Movement:** Minimizes total human kilometers traveled per shift.

---

## 12. Technical Implementation Architecture

### Database Schema (Prisma)

- **`WorkerProfile`**: Extends `User`. Stores physical constraints and preferences.
- **`SkillMatrix`**: Link table `Worker` <-> `Skill` with `proficiencyLevel` (1-5).
- **`PickingTask`**: The core unit of work assignment. Links `User`, `InventoryItem`, and `Location`.
- **`VoiceSession`**: Captures raw interaction logs (transcript, intent, duration) for productivity analysis and training feedback.
- **`ExceptionRecord`**: Tracks operational anomalies (short picks, damaged goods) with severity levels and resolution status (`autoResolved` vs `escalated`).

### API Structure (`/api/labor`)

- `POST /allocation/rebalance`: Trigger the rebalancing engine manually.
- `GET /forecast`: Retrieve AI-predicted labor needs.
- `POST /sessions/analyze`: Process completed voice sessions for intent patterns and user coaching opportunities.
- `POST /exceptions/resolve`: Supervisor action on escalated discrepancies.

### Integration Points

- **Warehouse Brain:** Feeds "Congestion" data to the labor engine.
- **Voice System:** Feeds real-time task completion timestamps and intent logs directly into the labor metrics pipeline.
- **Inventory Service:** Validates pick quantities against `InventoryItem` records in real-time.
- **HRIS:** Syncs employee roster and leave data.
