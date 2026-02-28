"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Building,
  Search,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  Package,
  ClipboardList,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { purchaseOrders: number; inventoryItems: number };
}

export default function SuppliersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    website: "",
  });

  const fetchSuppliers = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/suppliers?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
      setTotal(data.pagination?.total || (data.suppliers || []).length);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleCreate = async () => {
    if (!form.name || !form.code) return;
    setCreating(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast({
        title: "Supplier created",
        description: `${form.name} added successfully.`,
      });
      setDialogOpen(false);
      setForm({
        name: "",
        code: "",
        email: "",
        phone: "",
        city: "",
        country: "",
        website: "",
      });
      fetchSuppliers(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your supplier directory for purchasing and receiving.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSuppliers(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Supplier</DialogTitle>
                  <DialogDescription>
                    Add a supplier to your organisation directory.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Name *</Label>
                      <Input
                        placeholder="Acme Supplies"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Code *</Label>
                      <Input
                        placeholder="ACME"
                        value={form.code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="orders@acme.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 555 000 0000"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input
                        placeholder="New York"
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Country</Label>
                      <Input
                        placeholder="US"
                        value={form.country}
                        onChange={(e) =>
                          setForm({ ...form, country: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Website</Label>
                    <Input
                      placeholder="https://acme.com"
                      value={form.website}
                      onChange={(e) =>
                        setForm({ ...form, website: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !form.name || !form.code}
                  >
                    {creating ? "Creating..." : "Add Supplier"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Suppliers",
              value: total,
              icon: Building,
              color: "text-blue-600",
            },
            {
              label: "Linked to POs",
              value: suppliers.reduce(
                (s, x) => s + (x._count.purchaseOrders > 0 ? 1 : 0),
                0,
              ),
              icon: ClipboardList,
              color: "text-purple-600",
            },
            {
              label: "With Stock Items",
              value: suppliers.reduce(
                (s, x) => s + (x._count.inventoryItems > 0 ? 1 : 0),
                0,
              ),
              icon: Package,
              color: "text-green-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "—" : s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, code or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>{total} suppliers</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No suppliers found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add First Supplier
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{supplier.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {supplier.code}
                        </Badge>
                        {!supplier.isActive && (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-500 text-xs"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        {supplier.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {supplier.phone}
                          </span>
                        )}
                        {(supplier.city || supplier.country) && (
                          <span>
                            {[supplier.city, supplier.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 text-right flex-shrink-0">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {supplier._count.purchaseOrders} PO
                          {supplier._count.purchaseOrders !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {supplier._count.inventoryItems} items
                        </p>
                      </div>
                      {supplier.website && (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  );
}
