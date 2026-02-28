-- Migration: Add enterprise integration providers and categories
-- Date: 2026-02-27
-- Part of WMS + CAPA + Voice Integration Playbook

-- ── IntegrationProvider: ERP additions ─────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SAP_S4HANA';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ORACLE_ERP';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'MICROSOFT_DYNAMICS_365';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ODOO';

-- ── IntegrationProvider: Carriers ───────────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ROYAL_MAIL';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'DPD';

-- ── IntegrationProvider: HR & Workforce ─────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'WORKDAY';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SAP_SUCCESSFACTORS';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'UKG';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'BAMBOOHR';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'HIBOB';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ADP';

-- ── IntegrationProvider: SSO / Identity ─────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ENTRA_ID';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'OKTA';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_WORKSPACE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'AUTH0';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ONELOGIN';

-- ── IntegrationProvider: Access Control ─────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'PAXTON_NET2';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GALLAGHER';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'HID_ORIGO';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'LENELS2';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'BRIVO';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GENETEC';

-- ── IntegrationProvider: Warehouse Hardware ──────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ZEBRA';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'HONEYWELL_SCANNER';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'DATALOGIC';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'IMPINJ_RFID';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ZEBRA_PRINTER';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SIEMENS_PLC';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ALLEN_BRADLEY';

-- ── IntegrationProvider: Robotics & Automation ───────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'AUTOSTORE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'DEMATIC';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'LOCUS_ROBOTICS';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GEEK_PLUS';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'FETCH_ROBOTICS';

-- ── IntegrationProvider: TMS & YMS ───────────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'FLEETOPS360';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'SAMSARA';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'WEBFLEET';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'TRAILER_YARD_SYSTEMS';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'TRIMBLE_TMS';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'MERCURYGATE';

-- ── IntegrationProvider: QMS ─────────────────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'IAUDITOR';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ECOONLINE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'MASTERCONTROL';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ETQ_RELIANCE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'VEEVA_VAULT';

-- ── IntegrationProvider: Voice Hardware ──────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'HONEYWELL_VOCOLLECT';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'LYDIA_VOICE';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'ANDROID_HEADSET';

-- ── IntegrationProvider: BI & Analytics ──────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'POWER_BI';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'TABLEAU';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'LOOKER';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'QLIK';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'DOMO';

-- ── IntegrationProvider: IoT Cloud ───────────────────────────────────────────
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'AWS_IOT';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'AZURE_IOT';
ALTER TYPE "IntegrationProvider" ADD VALUE IF NOT EXISTS 'GOOGLE_IOT';

-- ── IntegrationCategory: New categories ──────────────────────────────────────
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'ERP';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'HR';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'SSO';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'ACCESS_CONTROL';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'HARDWARE';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'ROBOTICS';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'TMS_YMS';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'QMS';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'BI';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'IOT_CLOUD';
ALTER TYPE "IntegrationCategory" ADD VALUE IF NOT EXISTS 'VOICE_HARDWARE';
