# Cognitive Orchestration & Autonomous Decision Engine

**Status**: ✅ Enterprise Turnkey  
**Type**: Artificial Intelligence / Central Nervous System

---

## 📋 Module Overview
The **Cognitive Engine** acts as the central brain of LogiVox. It sits above the operational modules (WMS, TMS, LMS) and orchestrates decisions using real-time data, predictive simulations, and governed policies.

## 🔑 Key Capabilities

### 1. The "Brain" Loop
- **Sense**: Ingests real-time events (Order Placed, Shift Start).
- **Predict**: Runs simulations to forecast outcomes.
- **Decide**: Arbitrates between conflicting goals (Cost vs. Speed) using `CognitivePolicy`.
- **Act**: Executes the best action autonomously (e.g., Change Carrier).
- **Learn**: Logs outcomes and confidence scores to `DecisionLog`.

### 2. Implemented Governors (The Lobes)
- **Carrier Governor**: Optimizes shipping method selection (Rate Shop + SLA).
- **Labor Governor**: Manages workforce capacity (Overtime vs Downtime).
- **Financial Governor**: Enforces profitability thresholds.
- **Inventory Governor**: Manages supply and transfers.
- **Network Governor**: Manages global load balancing.

### 3. Policy-Driven Execution
- **Policies**: Configurable rules (e.g., "Maximize Speed" for VIP clients, "Minimize Cost" for Standard).
- **Auditing**: Full transparency into *why* the AI made a specific decision.

## 🛠️ Technical Implementation
- **Engine**: `apps/web/src/lib/cognitive/engine.ts`
- **Governors**: `apps/web/src/lib/cognitive/governors/*.ts`
- **Database**: `DecisionLog`, `CognitivePolicy`, `AutonomousDecision`.

## 🚀 Usage
**Decision Cycle Trigger**:
```bash
POST /api/cognitive/decision-cycle
{ 
  "organizationId": "org_1", 
  "event": "PROFITABILITY_CHECK", 
  "metadata": { "orderId": "ORD-101" } 
}
```

## 📱 Mobile Control
The **Cognitive Engine** is fully accessible via the Flowstock Mobile App (Enterprise v1).
- **Location**: `More -> Cognitive`
- **Capabilities**:
    - **Trigger Decision Cycle**: Force an immediate evaluation (e.g., during a shift change).
    - **Run Simulations**: Launch digital twin scenarios directly from the warehouse floor.
    - **View Logs**: See real-time decision outputs.

