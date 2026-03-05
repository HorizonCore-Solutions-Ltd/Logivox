# LogiVox Internal Employee Handbook & Operations

Welcome to the team! This repository serves as your quick-start guide to the internal operations of LogiVox, our culture, and your onboarding checklist.

## 1. Our Mission
LogiVox exists to **modernize global fulfillment**. We believe that warehouse operators shouldn't have to choose between million-dollar legacy implementations or running on Excel. We build robust, AI-native API supply chains.

## 2. Secure Access & Tools
By the end of your first week, you should have access to:
* **Google Workspace:** For email, calendar, and internal drives.
* **GitHub (Enterprise):** To view the `/workspaces/Logivox` codebase.
* **Vercel / AWS / Postgres:** (Engineering only) Production environment controls.
* **Zendesk / Intercom:** (Sales/Support only) Customer communication hubs.

## 3. Engineering Operations
If you are an engineer or product manager, refer to the following operating rules:
*   **PR Review Policy:** All Pull Requests require at least ONE approval from a Lead Engineer before merging into `main`. No direct commits to `main`.
*   **Deployments:** We deploy continuously via Vercel for the web app, and Github Actions for containerized API updates.
*   **Incident Response:** Familiarize yourself with `docs/support/SUPER_ADMIN_MANUAL.md`. If PagerDuty goes off, the on-call engineer has 15 minutes to acknowledge.

## 4. Sales & Go-To-Market Operations
If you are on the business or sales team:
*   Use the `docs/sales/SALES_PLAYBOOK.md` to map customer pain points.
*   Do not distribute pricing variations outside the standardized SaaS bands without VP of Sales approval.
*   The primary goal is moving prospects from the **Demo Phase -> Architecture Scoping -> 60-Day Pilot**.

## 5. Security & Device Management
* Provide IT with your device MAC address for VPN whitelisting.
* Never share customer workload data (PII) on public Slack channels. Use anonymized UUIDs when discussing bugs.
