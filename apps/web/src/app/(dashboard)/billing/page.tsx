import { Suspense } from "react";
import BillingDashboardClient from "./BillingDashboardClient";
import {
  getBillingDashboardStats,
  getRecentTransactions,
  getActiveChargebacks,
  getRecentInvoices,
  getRecentVAS,
} from "@/lib/billing/server-actions";
import { getCurrentUser } from "@/lib/auth-helpers";

export const metadata = {
  title: "Billing | LogiVox",
  description: "Financial Command Center",
};

export default async function BillingPage() {
  const user = await getCurrentUser();
  // Server Actions handle auth checks internally too, but this is a good check.

  // Initialize with safe defaults
  let stats = {
    pendingRevenue: 0,
    invoicedThisMonth: 0,
    vasRevenue: 0,
    activeContracts: 0,
  };
  let transactions: any[] = [];
  let chargebacks: any[] = [];
  let invoices: any[] = [];
  let vasRequests: any[] = [];

  // Parallel data fetching for performance
  try {
    const results = await Promise.allSettled([
      getBillingDashboardStats(),
      getRecentTransactions(),
      getActiveChargebacks(),
      getRecentInvoices(),
      getRecentVAS(),
    ]);

    if (results[0].status === "fulfilled") stats = results[0].value;
    if (results[1].status === "fulfilled") transactions = results[1].value;
    if (results[2].status === "fulfilled") chargebacks = results[2].value;
    if (results[3].status === "fulfilled") invoices = results[3].value;
    if (results[4].status === "fulfilled") vasRequests = results[4].value;
  } catch (error) {
    console.error("Critical error fetching billing dashboard data:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center p-8 text-gray-500">
          Loading Financial Data...
        </div>
      }
    >
      <BillingDashboardClient
        stats={stats}
        transactions={transactions}
        chargebacks={chargebacks}
        invoices={invoices}
        vasRequests={vasRequests}
      />
    </Suspense>
  );
}
