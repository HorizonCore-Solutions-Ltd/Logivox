"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { TrendingUp, Package, DollarSign } from "lucide-react";

interface ABCCategory {
  category: "A" | "B" | "C";
  products: Array<{
    productId: string;
    productName: string;
    value: number;
    percentageOfTotal: number;
  }>;
  totalValue: number;
  percentageOfTotal: number;
  count: number;
}

interface ABCAnalysisProps {
  categories: ABCCategory[];
}

const COLORS = {
  A: "hsl(var(--chart-1))",
  B: "hsl(var(--chart-2))",
  C: "hsl(var(--chart-3))",
};

export function ABCAnalysis({ categories }: ABCAnalysisProps) {
  const pieData = categories.map((cat) => ({
    name: `Category ${cat.category}`,
    value: cat.totalValue,
    count: cat.count,
    percentage: cat.percentageOfTotal,
  }));

  const getCategoryBadge = (category: "A" | "B" | "C") => {
    const variants = {
      A: "default",
      B: "secondary",
      C: "outline",
    } as const;
    return variants[category];
  };

  const getCategoryDescription = (category: "A" | "B" | "C") => {
    const descriptions = {
      A: "High-value items (70% of total value)",
      B: "Medium-value items (20% of total value)",
      C: "Low-value items (10% of total value)",
    };
    return descriptions[category];
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No ABC Analysis Data</p>
            <p className="text-muted-foreground mt-2">
              Insufficient sales data for classification
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.category}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Category {category.category}
                </CardTitle>
                <Badge variant={getCategoryBadge(category.category)}>
                  {category.category}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {getCategoryDescription(category.category)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Products
                  </span>
                  <span className="font-medium">{category.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Value
                  </span>
                  <span className="font-medium">
                    ${category.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    % of Total
                  </span>
                  <span className="font-medium">
                    {category.percentageOfTotal.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Value Distribution</CardTitle>
          <CardDescription>
            ABC classification based on annual value (80/20 rule)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) =>
                  `${name}: ${percentage.toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[categories[index]?.category || "C"]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Details */}
      {categories.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Category {category.category} Products
                  <Badge variant={getCategoryBadge(category.category)}>
                    {category.count} items
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {getCategoryDescription(category.category)}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${category.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {category.products.slice(0, 10).map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.percentageOfTotal.toFixed(2)}% of total value
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${product.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      annual value
                    </p>
                  </div>
                </div>
              ))}
              {category.products.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  + {category.products.length - 10} more products
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ABC Management Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Category A - Tight Control
            </p>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• Monitor daily and maintain accurate records</li>
              <li>• Frequent cycle counting and inventory reviews</li>
              <li>• Close supplier relationships for reliable supply</li>
              <li>• Consider safety stock for critical items</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="font-medium text-green-900 dark:text-green-100 mb-2">
              Category B - Moderate Control
            </p>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
              <li>• Weekly or bi-weekly monitoring</li>
              <li>• Standard reorder processes</li>
              <li>• Automated reorder alerts</li>
              <li>• Regular but less frequent cycle counts</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Category C - Simple Control
            </p>
            <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <li>• Monthly monitoring or periodic review</li>
              <li>• Bulk ordering to reduce transaction costs</li>
              <li>• Simple two-bin system may be sufficient</li>
              <li>• Annual or bi-annual cycle counts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
