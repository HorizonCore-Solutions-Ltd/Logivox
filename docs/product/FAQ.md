# Cognitive & Autonomous Supply Chain - FAQ

## General

### Q: What is the "Cognitive Engine"?
**A**: The Cognitive Engine is the "brain" of LogiVox. Unlike traditional WMS which only executes what users tell it to, the Cognitive Engine proactively monitors your network, predicts issues (like stockouts or missed SLAs), and autonomously executes corrective actions based on your business policies.

### Q: Is this just a "Digital Twin" simulation?
**A**: No. While it includes a powerful **Monte Carlo Simulation Service** to predict outcomes, the Cognitive Engine goes a step further by *acting* on those predictions. It doesn't just tell you "Carrier X might be late"; it automatically re-assigns the order to Carrier Y if the confidence score meets your threshold.

## Financial & Profitability

### Q: How does the system prevent unprofitable orders?
**A**: The **Financial Governor** module intercepts every order before allocation. It calculates the **Projected Margin** by subtracting Cost of Goods Sold (COGS), estimated labor, and shipping costs from the revenue. If the margin drops below your configured threshold (e.g., 10%), the order is placed on `FINANCIAL_HOLD` for review.

### Q: Can it handle billing between our own branches?
**A**: Yes. The **Inter-Organization Transfer** module automatically generates reciprocal invoices (Sale & Purchase) whenever stock moves between two legal entities in your network, ensuring your books are always balanced.

## Logistics & Operations

### Q: What is "Pass-Through" Cross-Docking?
**A**: This is a "Zero-Touch" flow for Hubs. When a pallet arrives at a central DC that is destined for a final branch, the system detects this upon the first scan. Instead of directing a worker to put it away on a shelf, it immediately directs them to the outbound lane for the next truck, eliminating unnecessary storage steps.

### Q: How does it manage warehouse congestion?
**A**: The **Network Load Balancer** monitors the queue of pending tasks at every Fulfillment Center. If one FC gets overwhelmed, the engine automatically routes new orders to a nearby FC with spare capacity, preventing bottlenecks during peak seasons.

## Technical

### Q: How do I integrate this with my ERP?
**A**: The system accepts standard Webhooks or API calls. You can trigger a decision cycle by POSTing to `/api/cognitive/decision-cycle` with event data (e.g., `ORDER_PLACED`).

### Q: Is it secure?
**A**: Yes. Every autonomous decision is logged in an immutable `DecisionLog`, including the AI's reasoning, the simulation confidence score, and the exact action taken.
