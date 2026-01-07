import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface AnalyticsData {
  overview: {
    totalInventoryItems: number;
    totalInventoryUnits: number;
    lowStockItems: number;
    totalBookings: number;
    totalRevenue: number;
  };
  charts: {
    dailyRevenue: Array<{ date: string; revenue: number }>;
    inventoryByCategory: Array<{ name: string; value: number }>;
    bookingsByStatus: Array<{ status: string; count: number }>;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    bookingsCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    userName: string;
    createdAt: string;
  }>;
}

export function exportToCSV(data: AnalyticsData, dateRange: string) {
  const csvRows = [];

  // Header
  csvRows.push("Stock Management Analytics Report");
  csvRows.push(`Date Range: Last ${dateRange} days`);
  csvRows.push(`Generated: ${new Date().toLocaleString()}`);
  csvRows.push("");

  // Overview Section
  csvRows.push("OVERVIEW");
  csvRows.push("Metric,Value");
  csvRows.push(`Total Inventory Items,${data.overview.totalInventoryItems}`);
  csvRows.push(`Total Inventory Units,${data.overview.totalInventoryUnits}`);
  csvRows.push(`Low Stock Items,${data.overview.lowStockItems}`);
  csvRows.push(`Total Bookings,${data.overview.totalBookings}`);
  csvRows.push(`Total Revenue,$${data.overview.totalRevenue.toLocaleString()}`);
  csvRows.push("");

  // Top Customers
  csvRows.push("TOP CUSTOMERS");
  csvRows.push("Name,Email,Total Revenue,Bookings Count");
  data.topCustomers.forEach((customer) => {
    csvRows.push(
      `"${customer.name}","${customer.email}",$${customer.totalRevenue.toLocaleString()},${customer.bookingsCount}`,
    );
  });
  csvRows.push("");

  // Daily Revenue
  csvRows.push("DAILY REVENUE");
  csvRows.push("Date,Revenue");
  data.charts.dailyRevenue.forEach((item) => {
    csvRows.push(`${item.date},$${item.revenue.toLocaleString()}`);
  });
  csvRows.push("");

  // Inventory by Category
  csvRows.push("INVENTORY BY CATEGORY");
  csvRows.push("Category,Count");
  data.charts.inventoryByCategory.forEach((item) => {
    csvRows.push(`"${item.name}",${item.value}`);
  });
  csvRows.push("");

  // Bookings by Status
  csvRows.push("BOOKINGS BY STATUS");
  csvRows.push("Status,Count");
  data.charts.bookingsByStatus.forEach((item) => {
    csvRows.push(`${item.status},${item.count}`);
  });

  // Download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `analytics-report-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: AnalyticsData, dateRange: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Stock Management Analytics Report", 14, 22);

  // Metadata
  doc.setFontSize(10);
  doc.text(`Date Range: Last ${dateRange} days`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

  let yPos = 50;

  // Overview Table
  doc.setFontSize(14);
  doc.text("Overview", 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Total Inventory Items", data.overview.totalInventoryItems.toString()],
      ["Total Inventory Units", data.overview.totalInventoryUnits.toString()],
      ["Low Stock Items", data.overview.lowStockItems.toString()],
      ["Total Bookings", data.overview.totalBookings.toString()],
      ["Total Revenue", `$${data.overview.totalRevenue.toLocaleString()}`],
    ],
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top Customers Table
  doc.setFontSize(14);
  doc.text("Top Customers", 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Name", "Email", "Revenue", "Bookings"]],
    body: data.topCustomers.map((customer) => [
      customer.name,
      customer.email,
      `$${customer.totalRevenue.toLocaleString()}`,
      customer.bookingsCount.toString(),
    ]),
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add new page if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Inventory by Category
  doc.setFontSize(14);
  doc.text("Inventory by Category", 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Category", "Count"]],
    body: data.charts.inventoryByCategory.map((item) => [
      item.name,
      item.value.toString(),
    ]),
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add new page if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Bookings by Status
  doc.setFontSize(14);
  doc.text("Bookings by Status", 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [["Status", "Count"]],
    body: data.charts.bookingsByStatus.map((item) => [
      item.status,
      item.count.toString(),
    ]),
  });

  // Save
  doc.save(`analytics-report-${Date.now()}.pdf`);
}

export function exportToExcel(data: AnalyticsData, dateRange: string) {
  const workbook = XLSX.utils.book_new();

  // Overview Sheet
  const overviewData = [
    ["Stock Management Analytics Report"],
    [`Date Range: Last ${dateRange} days`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["Metric", "Value"],
    ["Total Inventory Items", data.overview.totalInventoryItems],
    ["Total Inventory Units", data.overview.totalInventoryUnits],
    ["Low Stock Items", data.overview.lowStockItems],
    ["Total Bookings", data.overview.totalBookings],
    ["Total Revenue", data.overview.totalRevenue],
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

  // Top Customers Sheet
  const customersData = [
    ["Name", "Email", "Total Revenue", "Bookings Count"],
    ...data.topCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.totalRevenue,
      customer.bookingsCount,
    ]),
  ];
  const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
  XLSX.utils.book_append_sheet(workbook, customersSheet, "Top Customers");

  // Daily Revenue Sheet
  const revenueData = [
    ["Date", "Revenue"],
    ...data.charts.dailyRevenue.map((item) => [item.date, item.revenue]),
  ];
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, "Daily Revenue");

  // Inventory by Category Sheet
  const categoryData = [
    ["Category", "Count"],
    ...data.charts.inventoryByCategory.map((item) => [item.name, item.value]),
  ];
  const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(
    workbook,
    categorySheet,
    "Inventory by Category",
  );

  // Bookings by Status Sheet
  const statusData = [
    ["Status", "Count"],
    ...data.charts.bookingsByStatus.map((item) => [item.status, item.count]),
  ];
  const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
  XLSX.utils.book_append_sheet(workbook, statusSheet, "Bookings by Status");

  // Save
  XLSX.writeFile(workbook, `analytics-report-${Date.now()}.xlsx`);
}
