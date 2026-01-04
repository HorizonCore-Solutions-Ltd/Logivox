"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building2, MapPin, Phone } from "lucide-react";

interface CustomerInfo {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  customer: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
}

export default function AccountPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    fetchCustomerInfo();
  }, []);

  const fetchCustomerInfo = async () => {
    try {
      const response = await fetch("/api/portal/customer");
      if (response.ok) {
        const data = await response.json();
        setCustomerInfo(data);
      }
    } catch (error) {
      console.error("Error fetching customer info:", error);
      toast({
        title: "Error",
        description: "Failed to load account information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customerInfo) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Unable to load account information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-1">View your account and company information</p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600" />
            <CardTitle>User Information</CardTitle>
          </div>
          <CardDescription>Your login and personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="userName">Name</Label>
              <Input
                id="userName"
                value={customerInfo.user.name || "Not set"}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="userEmail"
                  value={customerInfo.user.email}
                  disabled
                  className="bg-gray-50 pl-10"
                />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              To update your login information, please contact your account manager or warehouse team.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-gray-600" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>Your company details and default shipping address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={customerInfo.customer.name}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerCode">Customer Code</Label>
              <Input
                id="customerCode"
                value={customerInfo.customer.code}
                disabled
                className="bg-gray-50 font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyEmail"
                  value={customerInfo.customer.email || "Not set"}
                  disabled
                  className="bg-gray-50 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyPhone"
                  value={customerInfo.customer.phone || "Not set"}
                  disabled
                  className="bg-gray-50 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Default Shipping Address
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>{customerInfo.customer.address || "No address on file"}</p>
              {customerInfo.customer.city && (
                <p>
                  {customerInfo.customer.city}
                  {customerInfo.customer.country && `, ${customerInfo.customer.country}`}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              To update your company information or shipping address, please contact your account manager.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common account-related tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto py-4" asChild>
              <a href="mailto:support@logivox.com">
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Contact Support</span>
                  <span className="text-xs text-gray-500 mt-1">
                    Get help with your account
                  </span>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <a href="/api/auth/signout">
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Sign Out</span>
                  <span className="text-xs text-gray-500 mt-1">
                    End your current session
                  </span>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
