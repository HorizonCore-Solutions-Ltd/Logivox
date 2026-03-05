# Digital Twin & Simulation Engine

**Status**: ✅ Enterprise Turnkey  
**Type**: Predictive Modeling / Risk Assessment

---

## 📋 Module Overview
The Simulation Engine provides the "Predictive" capability to LogiVox. Instead of making decisions based on static rules, the system runs Monte Carlo simulations to forecast outcomes probabilistically.

## 🔑 Key Capabilities

### 1. Monte Carlo Simulation Service
- **Function**: Runs 1,000+ iterations of a scenario to determine success probability.
- **Use Case**: Determining if a carrier will meet an SLA given weather and traffic variance.

### 2. Operational "What-If" Analysis
- **Scenario**: "What if we route this order to Warehouse B?"
- **Output**: Predicts impact on Cost, Speed, and Carbon before execution.

### 3. Cognitive Integration
- **Role**: Serves as the validation layer for the **Cognitive Decision Engine**.
- **Data Flow**: `Governor` -> `SimulationService` -> `ConfidenceScore` -> `Decision`.

## 🛠️ Technical Implementation
- **Service**: `apps/web/src/lib/simulation/simulation-service.ts`
- **Algorithms**: Box-Muller Transform (Normal Distribution Generation), Statistical Variance Modeling.
- **Metrics**: `ON_TIME_PROBABILITY`, `FULFILLMENT_SPEED`.

## 🚀 Usage (Internal API)
```typescript
import { SimulationService } from "@/lib/simulation/simulation-service";

const result = await SimulationService.runSimulation("CARRIER_PERFORMANCE", {
    carrier: "FedEx",
    distance: 500
});

// Output: { metric: "ON_TIME_PROBABILITY", value: 98.5, risk: 1.5 }
```
