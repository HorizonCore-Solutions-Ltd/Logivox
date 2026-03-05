# LogiVox Privacy Policy & B2B Data Mandate

**Last Updated:** March 2026

LogiVox Solutions, Inc. ("LogiVox", "We", "Us") operates as a B2B SaaS provider. This Privacy Policy details how we handle information, particularly distinguishing between "Customer Data" (which our users input into the platform) and "Account Data" (which we collect to manage the business relationship).

## 1. The Data We Process

### A. Account Data
*   **What it is:** Names, business email addresses, phone numbers, and payment details of the administrators purchasing or managing the LogiVox account.
*   **How we use it:** To provide support, handle billing (via our payment processor), and communicate system update messages.

### B. Customer Workload Data
*   **What it is:** End-consumer PII (shipping addresses, names) uploaded by the Customer into LogiVox for the purpose of printing shipping labels, routing packages, and managing inventory.
*   **LogiVox's Role:** LogiVox acts strictly as a **Data Processor** for this information under frameworks like GDPR and CCPA. We do *not* sell, market, or independently monetize the end-consumer data processed within the platform.

## 2. Sub-Processors & Integrations
To provide the system's core capabilities, LogiVox securely transmits necessary fragments of Customer Workload Data to authorized sub-processors:
*   **Cloud Hosting:** Vercel / Amazon Web Services (AWS)
*   **Database Management:** Supabase / Vercel Postgres / RDS
*   **Carrier Shipping Integrations:** EasyPost, Shippo, or native carrier APIs (FedEx, UPS, USPS).

## 3. Data Retention and Deletion
If a Customer terminates their LogiVox subscription, their active tenant instance is decommissioned. 
*   **Soft Deletion:** Workload data is held securely for 60 days following termination for recovery purposes.
*   **Hard Deletion:** Following the 60-day window, all associated Workload Data is permanently purged from production databases. Audit logs devoid of PII may be retained for up to 12 months for compliance purposes.
