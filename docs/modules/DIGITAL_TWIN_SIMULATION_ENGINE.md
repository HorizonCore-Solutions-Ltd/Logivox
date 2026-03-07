# Digital Twin & Simulation Engine

**Status**: ✅ Enterprise Turnkey (v2 Ready / v3 Capable)  
**Type**: Predictive Modeling / Physics-Accurate Simulation / Financial Foresight

---

## 📋 Module Overview

The **Digital Twin & Simulation Engine** allows LogiVox to move from _reactive_ operations to _predictive_ foresight. It maintains a live, physics-accurate model of the entire logistics network and runs high-fidelity simulations to predict bottlenecks, financial outcomes, and SLA risks before they happen.

## 🔑 Key Capabilities

### v2 (Current) — Production-Ready

1.  **Real-Time Operational Mirroring**:
    - Maintains a live in-memory graph of all Warehouses, Docks, Workers, and Inventory.
    - Updates in real-time via event stream (Webhooks/DB triggers).
2.  **Scenario Simulation ("What-If")**:
    - Users can simulate: "What if we add 5 temp workers?" or "What if Carrier X is 2 hours late?".
3.  **Bottleneck Prediction**:
    - Identifies specific zones or nodes (e.g., "Packing Station 3") that will become congested based on current task volume.
4.  **Financial Overlay**:
    - Every simulation calculates the projected P&L impact (Revenue - Cost) of the scenario.

### v3 (Leapfrog) — Future Architecture

1.  **Physics-Accurate Models**:
    - Simulates walking speeds, forklift acceleration, and conveyor belt mechanics.
2.  **Multi-Agent System**:
    - Models each worker and robot as an autonomous agent with fatigue, battery levels, and unique constraints.
3.  **Network-Wide Twin**:
    - Simulates interactions between multiple FCs, Yards, and Transport lanes simultaneously.

## 🛠️ Technical Architecture

### 1. The Twin State Core

- **Responsibility**: Loads the "Ground Truth" from the database and structures it into a traversable graph.
- **Entities**: `Site`, `Zone`, `Worker`, `Order`, `Task`.

### 2. Time-Step Engine

- **Logic**: Hybrid Discrete-Event + Time-Step simulation.
- **Granularity**: Configurable (e.g., minute-by-minute execution).

### 3. Scenario Generator

- **Input**: JSON configuration defining the "What-If" parameters.
- **Output**: `SimulationResult` containing Time-Series Metrics (QueueDepth, Cost, Throughput).

## 🚀 Usage

### Run a Simulation

```bash
POST /api/simulation/run
{
  "organizationId": "org_1",
  "scenarioType": "LABOR_STRESS_TEST",
  "parameters": {
    "extraWorkers": 5,
    "simulationDurationMinutes": 240
  }
}
```

### Response

```json
{
  "scenarioId": "SIM-123",
  "status": "COMPLETED",
  "metrics": {
    "throughput": 1500,
    "bottlenecks": ["PACKING_ZONE_A"],
    "projectedCost": 4500.5,
    "slaBreachProbability": 12.5
  }
}
```
