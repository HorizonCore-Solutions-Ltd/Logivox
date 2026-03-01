"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Search,
  Package,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = "ALL" | "INVOICE" | "PACKING_SLIP";

interface PortalDocument {
  id: string;
  type: "INVOICE" | "PACKING_SLIP";
  title: string;
  reference: string;
  date: string;
  amount: number | null;
  currency: string;
  status: string;
  downloadUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  "INVOICE" | "PACKING_SLIP",
  { label: string; color: string }
> = {
  INVOICE: { label: "Invoice", color: "bg-blue-100 text-blue-800" },
  PACKING_SLIP: {
    label: "Packing Slip",
    color: "bg-purple-100 text-purple-800",
  },
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  OVERDUE: "bg-red-200 text-red-900",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<DocType>("ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ── Fetch documents ───────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/portal/documents?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load documents");
      }
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch (err: any) {
      setError(err.message || "Unable to load documents");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, from, to]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── Open document in new tab (printable HTML) ─────────────────────────────
  const openDocument = (doc: PortalDocument) => {
    window.open(doc.downloadUrl, "_blank", "noopener,noreferrer");
  };

  // ─────────────────────────────────────────────────────────────────────────

  const invoiceCount = documents.filter((d) => d.type === "INVOICE").length;
  const packingCount = documents.filter(
    (d) => d.type === "PACKING_SLIP",
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-500 mt-1">
          Download invoices and packing slips for your orders. All documents can
          be printed or saved as PDF directly from your browser.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-blue-100">
          <CardContent className="pt-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {invoiceCount}
                </p>
                <p className="text-sm text-gray-500">Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="pt-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {packingCount}
                </p>
                <p className="text-sm text-gray-500">Packing Slips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Type filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as DocType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="INVOICE">Invoices only</SelectItem>
                <SelectItem value="PACKING_SLIP">Packing Slips only</SelectItem>
              </SelectContent>
            </Select>

            {/* Date from */}
            <div className="space-y-0.5">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="From date"
              />
            </div>

            {/* Date to */}
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="To date"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDocuments}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {loading
              ? "Loading…"
              : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 space-x-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading your documents…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Failed to load documents</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchDocuments}
                  className="text-sm underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && documents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No documents found</p>
              <p className="text-sm mt-1">
                {typeFilter !== "ALL" || search || from || to
                  ? "Try adjusting your filters."
                  : "Invoices and packing slips will appear here once your orders are shipped."}
              </p>
            </div>
          )}

          {/* Document rows */}
          {!loading && !error && documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => {
                const typeConf = TYPE_CONFIG[doc.type];
                const paymentColor =
                  PAYMENT_STATUS_COLOR[doc.status] ??
                  "bg-gray-100 text-gray-700";

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon + info */}
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          doc.type === "INVOICE" ? "bg-blue-50" : "bg-purple-50"
                        }`}
                      >
                        {doc.type === "INVOICE" ? (
                          <FileText
                            className={`h-5 w-5 ${
                              doc.type === "INVOICE"
                                ? "text-blue-600"
                                : "text-purple-600"
                            }`}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-purple-600" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {doc.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {formatDate(doc.date)}
                          </span>
                          <span className="text-gray-300">·</span>
                          <Badge
                            className={`${typeConf.color} text-xs py-0 px-2`}
                          >
                            {typeConf.label}
                          </Badge>
                          {doc.type === "INVOICE" && doc.status && (
                            <Badge
                              className={`${paymentColor} text-xs py-0 px-2`}
                            >
                              {doc.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount + actions */}
                    <div className="flex items-center space-x-4">
                      {doc.amount !== null && (
                        <p className="text-sm font-semibold text-gray-900 hidden sm:block">
                          {doc.currency} {doc.amount.toFixed(2)}
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocument(doc)}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Open</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
