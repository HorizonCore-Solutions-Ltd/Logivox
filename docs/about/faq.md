# Frequently Asked Questions

## Product & Capabilities

**Q: How is LogiVox different from other WMS platforms?**

A: LogiVox combines three differentiators:
1. **Voice-first operations**: Built for hands-free, voice-guided picking, receiving, and cycle counting with 75% faster onboarding and 99.9% accuracy.
2. **True multi-tenant architecture**: Complete data isolation via Postgres RLS; no cross-tenant data leaks; built to scale (not bolted on).
3. **Unified platform**: Inventory, picking, shipping, returns, quality, analytics all in one system—no integration nightmare.

Compared to legacy WMS (SAP, Kinaxis): We implement in weeks, not months. Compared to modern point solutions: We're not fragmented. Compared to 3PL-focused systems: We support all verticals (retail, pharma, automotive, food).

**Q: Can LogiVox work for my specific industry?**

A: We support:
- Retail/e-commerce (high-volume picking, multi-channel shipping)
- 3PL/logistics (multi-tenant, cost-per-order optimisation)
- Pharma (DSCSA/SECURPHARM, cold-chain, recalls in minutes)
- Automotive (JIT, supplier quality, IATF compliance)
- Food & beverage (FEFO, lot tracking, recalls)

If your industry isn't listed, contact sales@logivox.ai. We can discuss vertical customisation.

**Q: Do you offer on-premises deployment?**

A: We are cloud-first (AWS). On-premises is on our roadmap for H2 2027 (enterprise customers only). In the meantime, we offer private cloud options (AWS dedicated account) and a secure hybrid model (cloud backend + on-prem edge cache for latency-sensitive operations).

**Q: What's your uptime SLA?**

A: 
- **Professional tier**: 99.5% (47 min downtime/month acceptable)
- **Enterprise tier**: 99.9% (4 min downtime/month); documented RTO/RPO; financial credits for breaches
- Our current status: 99.8% (2025 annualised). We're targeting 99.9% by Q2 2026.

---

## Implementation & Onboarding

**Q: How long does implementation take?**

A: Typically 3–4 weeks:
- Week 1: Setup, data migration (inventory, customer master, supplier lists)
- Week 2: Staff training, pilot location testing
- Week 3: Go-live with full operations (inventory, picking, shipping)
- Week 4: Optimization, advanced module enablement (voice, AI, compliance)

For multi-location rollouts, add 1–2 weeks per location.

**Q: What data do I need to bring?**

A: 
1. **Inventory**: Current stock levels, SKU master (description, UOM, location, tier)
2. **Customers**: Name, address, ship-to locations, pricing tier
3. **Suppliers**: Name, contact, lead times, quality metrics
4. **Historical picks**: Last 3 months (for analytics, forecasting calibration)
5. **Compliance docs**: Any existing audit trails, quality protocols (optional but helpful)

We provide CSV templates. Migration typically takes 2–3 days.

**Q: Will LogiVox work with my existing ERP?**

A: We have pre-built connectors for SAP, Oracle NetSuite, Microsoft Dynamics, Sage, and 20+ others. If your ERP isn't listed, we offer APIs and webhooks for custom integration (typically 1–2 weeks of work).

**Q: Can we run a pilot before full rollout?**

A: Yes. Most customers pilot one location for 2–4 weeks. Successful pilots lead to full network rollout. Ask about our **Pilot Success Program** (guided KPIs, weekly check-ins).

---

## Pricing & Commercial

**Q: What's the cost difference between Starter, Professional, and Enterprise tiers?**

A: 
- **Starter**: £200/month per location (5 users); core WMS (inventory, picking, shipping)
- **Professional**: £600/month per location (25 users); + voice ops, returns, quality, advanced analytics
- **Enterprise**: Custom pricing (unlimited users, dedicated support, SLA 99.9%, integration priority)

Most mid-market customers use Professional. Enterprise customers average £1,200–2,000/month across 3–5 locations.

**Q: Do you charge per user?**

A: No. We charge per location (warehouse/fulfillment center) regardless of user count. This removes per-seat licensing headaches and encourages adoption across your team.

**Q: Can I upgrade/downgrade mid-year?**

A: Yes. Changes take effect on your next billing cycle. We prorate charges.

**Q: What about overage fees?**

A: There are no surprise overage fees. Core features are unlimited (transactions, API calls). Optional paid add-ons (advanced AI forecasting, premium integrations, white-label app) are clearly priced and optional.

**Q: Do you offer discounts?**

A: Yes:
- Annual prepayment: 15% discount
- Multi-year contracts: 20% discount (3-year)
- Non-profit/charity: 30% discount
- Volume (3+ locations): 10% discount per location

**Q: Is there a setup fee or onboarding cost?**

A: Onboarding is included in your first month's subscription. We also offer paid professional services (custom integrations, advanced training) at £150/hour.

---

## Security & Compliance

**Q: Are you GDPR compliant?**

A: Yes. We include a Data Processing Addendum (DPA) with all Enterprise plans. We're UK GDPR-ready, with data residency options in UK and EU. All data is encrypted in transit (TLS 1.3) and at rest (AES-256).

**Q: Do you perform penetration testing?**

A: Yes. We conduct annual pen tests (Q1 2026 scheduled). Results are shared with Enterprise customers under NDA. We also have a bug bounty program; report security issues to security@logivox.ai.

**Q: Can you support HIPAA (for healthcare/pharma)?**

A: Yes. We're working toward HIPAA compliance (target Q2 2026). Current pharma customers have BAA in place; we maintain strict audit logging and access controls required for FDA 21 CFR Part 11.

**Q: Where is my data stored?**

A: By default, AWS data centres in London (EU-West-2) or Frankfurt (EU-Central-1). You can specify your preferred region at sign-up. Backups are stored in a secondary region automatically.

**Q: Can I export my data?**

A: Yes. You can export inventory, picks, orders in CSV format anytime via the admin panel. Full data exports (including historical transactions) are available on request.

---

## Support & Technical

**Q: What support is included?**

A:
- **Starter**: Email support (24h response time)
- **Professional**: Email + phone support (4h response time, business hours)
- **Enterprise**: 24/7 phone + Slack support; dedicated success manager; 30min response SLA for critical issues

All tiers include access to our knowledge base and user community.

**Q: Do you have API documentation?**

A: Yes. Full API docs (283 endpoints) are available at https://docs.logivox.ai. We provide:
- OpenAPI schema
- Code examples (Python, JavaScript, cURL)
- Postman collection
- Rate limit guidelines
- Webhook events

**Q: Can I automate workflows via API?**

A: Yes. Most operations are API-driven (the web UI uses the same APIs). Common automations: scheduled reports, inbound order sync, inventory reconciliation, carrier integration.

**Q: What browsers does LogiVox support?**

A: We support all modern browsers (Chrome, Edge, Firefox, Safari) on desktop and tablet. Mobile app (iOS/Android) available Q2 2026.

---

## Migration & Decommissioning

**Q: What if we want to leave LogiVox?**

A: You own your data. We provide full data export in standard formats (CSV, JSON) on request. There are no exit fees. Your data is deleted within 30 days of account closure (unless you request longer retention for compliance).

**Q: Can we migrate from our old WMS to LogiVox?**

A: Yes. We handle migration of inventory, customers, orders, and historical analytics. Typical migration takes 1–2 weeks depending on data quality. We can also run parallel systems during the transition.

---

## Company & Relationship

**Q: Who are the founders?**

A: LogiVox was co-founded by supply chain engineers with 50+ years of combined experience in warehouse operations, ERP systems, and logistics. Our team includes ex-employees of Blue Yonder, Flexport, and DPD.

**Q: Is LogiVox venture-backed?**

A: We're bootstrapped and angel-funded. We're exploring Series A funding in H2 2026 to accelerate product development and geographic expansion.

**Q: Will LogiVox be acquired or discontinued?**

A: We're building a sustainable business with long-term customer commitment. In the unlikely event of acquisition, customer service and data protection are non-negotiable terms in any deal.

**Q: How can I stay updated on product changes?**

A: Subscribe to our product updates via email or Slack. We announce major releases 2 weeks in advance and provide migration guides for any breaking changes.

**Q: Can I request a feature?**

A: Absolutely. Email product@logivox.ai or submit via our user community. Your request is reviewed in our monthly product meeting. Top-voted features influence our roadmap.

---

## Getting Started

**Q: How do I request a demo?**

A: Visit https://logivox.ai/demo or email sales@logivox.ai. We offer 30-minute demos tailored to your industry (retail, 3PL, pharma, etc.).

**Q: Can I try LogiVox for free?**

A: We offer a 14-day free trial (full Professional features) on a dedicated test environment. No credit card required for signup.

**Q: What's the typical buying process?**

A: 
1. Demo or trial
2. Security & compliance Q&A (if Enterprise)
3. Proposal & statement of work
4. MSA signature
5. Onboarding kicks off
(Typically 2–4 weeks from first contact to go-live)

**Q: Who do I contact for sales?**

A: Email sales@logivox.ai or book a demo at https://logivox.ai/demo

**Q: Who handles support issues?**

A: Support team (support@logivox.ai or in-app chat). For urgent issues (production down), call the 24/7 support line (available to Enterprise customers).

---

**Still have questions?** Email hello@logivox.ai or visit our community forum at https://community.logivox.ai
