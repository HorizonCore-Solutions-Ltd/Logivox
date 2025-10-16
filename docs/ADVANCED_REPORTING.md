# Advanced Reporting Dashboard

The FlowStock Advanced Reporting Dashboard provides enterprise-grade business intelligence with 50+ pre-built templates, a custom report builder, multi-format export, scheduled delivery, and interactive data visualization.

## 📊 Features

### 1. Pre-Built Report Templates (50+)

Access ready-to-use reports across five categories:

#### **Inventory Reports (8 templates)**
- **Inventory Summary**: Complete inventory overview with quantities and values
- **Low Stock Items**: Products below reorder point
- **Out of Stock**: Currently unavailable products
- **Inventory by Category**: Grouped by category with totals (Pie chart)
- **High Value Inventory**: Top 20 most valuable items
- **Inventory Turnover Analysis**: Movement patterns
- **Reorder Recommendations**: Products needing reorder
- **Total Inventory Valuation**: By category breakdown

#### **Sales Reports (8 templates)**
- **Sales Summary**: All sales transactions
- **Daily Sales**: Grouped by day (Line chart)
- **Sales by Product**: Total sales per product (Bar chart)
- **Sales by Customer**: Total sales per customer
- **Top 10 Selling Products**: Best performers
- **Monthly Revenue**: Revenue trends
- **Pending Bookings**: Awaiting confirmation
- **Completed Bookings**: Finished transactions

#### **Financial Reports (5 templates)**
- **Revenue Summary**: Total revenue and transaction count
- **Profit Margin Analysis**: Revenue vs cost
- **Cost of Goods Sold (COGS)**: Pie chart breakdown
- **Revenue by Category**: Category performance
- **Average Transaction Value**: Trends over time

#### **Customer Reports (5 templates)**
- **Customer List**: All customers
- **Top 20 Customers**: Highest spending (Bar chart)
- **New Customers**: Recently registered
- **Inactive Customers**: No recent bookings
- **Customer Lifetime Value**: Total value analysis

#### **Operations Reports (4 templates)**
- **Pickup Schedule**: Upcoming pickups
- **Booking Fulfillment Rate**: Completed vs cancelled (Pie chart)
- **Daily Operations Summary**: Bookings, pickups, revenue
- **Cancelled Bookings**: Details

### 2. Custom Report Builder

Create custom reports with drag-and-drop interface:

#### **Field Selection**
- Select from 27+ available fields
- Organized by category (Inventory, Sales, Customers)
- Multi-select with checkboxes
- "Select All" and "Clear" options

#### **Filtering (15 Operators)**
- **Comparison**: Equals, Not Equals, Greater Than, Less Than, Greater or Equal, Less or Equal
- **String**: Contains, Not Contains, Starts With, Ends With
- **List**: In, Not In
- **Range**: Between
- **Null**: Is Null, Is Not Null

#### **Sorting**
- Multi-field sorting
- Ascending or Descending
- Drag to reorder priority

#### **Grouping & Aggregations**
- Group by any field
- Add multiple aggregations:
  - **Sum**: Total values
  - **Average**: Mean values
  - **Count**: Number of records
  - **Min**: Minimum value
  - **Max**: Maximum value
  - **Distinct Count**: Unique values

#### **Chart Types**
- Table (default)
- Bar Chart
- Line Chart
- Pie Chart
- Area Chart
- Combo Chart (Bar + Line)

#### **Advanced Options**
- Limit results (Top N)
- Chart type selection
- Template loading

### 3. Export Formats

Export reports in four professional formats:

#### **PDF Export**
- Professional styling with FlowStock branding
- Headers and footers
- Summary statistics
- Print-friendly layout
- Portrait or landscape orientation

#### **Excel Export**
- Tab-delimited format (production uses XLSX library)
- Headers and metadata
- Summary calculations
- Compatible with Microsoft Excel, Google Sheets

#### **CSV Export**
- Comma-delimited format
- Proper CSV escaping
- Universal compatibility
- Easy import to any system

#### **JSON Export**
- Structured data format
- Complete metadata
- Execution statistics
- API-friendly

### 4. Scheduled Delivery

Automate report generation and email delivery:

#### **Schedule Types**
- **Daily**: Every day at specified time
- **Weekly**: Specific day of week
- **Monthly**: Specific day of month
- **Custom**: Advanced cron expressions

#### **Email Delivery**
- Professional email templates
- FlowStock branding
- Report attached in chosen format
- Summary statistics in email body
- Multiple recipients supported

#### **Schedule Management**
- Enable/disable schedules
- View next run time
- See last execution
- Edit recipients and format
- Timezone support

### 5. Data Visualization

Interactive charts powered by Recharts:

#### **Chart Features**
- Responsive sizing
- Interactive tooltips
- Color-coded data
- Legend support
- Grid lines and axes
- Professional styling

#### **Chart Types**
- **Bar Chart**: Compare categories
- **Line Chart**: Show trends over time
- **Pie Chart**: Show proportions
- **Area Chart**: Cumulative trends
- **Combo Chart**: Multiple metrics

## 🚀 Usage Guide

### Running a Pre-Built Report

1. Navigate to **Dashboard > Reports**
2. Browse templates by category or search
3. Click **"Run Report"** on desired template
4. View results in table and/or chart format
5. Export using the format dropdown

### Creating a Custom Report

1. Navigate to **Dashboard > Reports**
2. Click **"+ Create Custom Report"**
3. Enter report name and description
4. Select category (Inventory, Sales, Financial, etc.)
5. **Select Fields**:
   - Check fields to include
   - Use "Select All" for all fields
6. **Add Filters** (optional):
   - Click "+ Add Filter"
   - Choose field, operator, and value
   - Add multiple filters as needed
7. **Add Sorting** (optional):
   - Click "+ Add Sort"
   - Choose field and direction
   - Add multiple sorts for priority
8. **Configure Grouping** (optional):
   - Enable "Enable Grouping"
   - Choose group-by field
   - Add aggregations (Sum, Avg, Count, etc.)
9. **Advanced Options**:
   - Set result limit (Top N)
   - Choose chart type
10. Click **"Save Report"**

### Exporting Reports

1. Run or open a report
2. Select export format from dropdown:
   - PDF for presentations
   - Excel for analysis
   - CSV for imports
   - JSON for APIs
3. Click **"Export"**
4. File downloads automatically

### Scheduling Reports

1. Run or open a report
2. Click the **Calendar icon** (Schedule Report)
3. Configure schedule:
   - Choose frequency (Daily, Weekly, Monthly)
   - Set time
   - Select day (for Weekly/Monthly)
4. Enter recipient email addresses
5. Choose export format
6. Click **"Save Schedule"**
7. Reports will be emailed automatically

## 📋 Available Fields

### Inventory Fields
- Product Name
- SKU
- Category
- Quantity on Hand
- Reorder Point
- Reorder Quantity
- Unit Cost
- Unit Price
- Total Value
- Status

### Sales Fields
- Booking ID
- Customer Name
- Product Name
- Quantity Sold
- Unit Price
- Total Amount
- Booking Date
- Pickup Date
- Status

### Customer Fields
- Customer Name
- Email
- Phone
- Total Bookings
- Total Spent
- Last Booking Date
- Created At

## 🎯 Best Practices

### Report Design

1. **Start with Templates**: Use pre-built templates as starting points
2. **Meaningful Names**: Use descriptive report names
3. **Field Selection**: Only include necessary fields
4. **Filtering**: Apply filters to focus on relevant data
5. **Sorting**: Sort by most important field first
6. **Grouping**: Use for summary reports
7. **Chart Selection**: Choose appropriate chart type for data

### Performance

1. **Limit Results**: Use limits for large datasets
2. **Filter Early**: Apply filters to reduce data volume
3. **Index Fields**: Ensure filtered/sorted fields are indexed
4. **Avoid Over-Grouping**: Too many groups can slow execution

### Export

1. **PDF**: Best for presentations and sharing
2. **Excel**: Best for further analysis
3. **CSV**: Best for importing to other systems
4. **JSON**: Best for API integration

### Scheduling

1. **Off-Peak Hours**: Schedule during low-traffic times
2. **Appropriate Frequency**: Don't over-schedule
3. **Recipient Lists**: Keep lists updated
4. **Test First**: Run manually before scheduling

## 🔧 Technical Details

### Architecture

```
lib/reports/
├── report-types.ts       # Type definitions (573 lines)
├── report-templates.ts   # 50+ pre-built templates (500+ lines)
├── report-engine.ts      # Query execution engine (450+ lines)
├── report-exporter.ts    # Multi-format export (400+ lines)
└── report-scheduler.ts   # Scheduled delivery (400+ lines)

components/reports/
├── report-builder.tsx    # Custom report builder UI (800+ lines)
├── report-viewer.tsx     # Report display component (400+ lines)
└── charts.tsx           # Chart visualizations (400+ lines)

app/dashboard/reports/
├── page.tsx             # Reports dashboard (270 lines)
├── builder/page.tsx     # Builder page wrapper (30 lines)
└── view/page.tsx        # Viewer page wrapper (70 lines)
```

### Database Integration

- **Prisma ORM**: Type-safe database queries
- **Multi-tenant**: Automatic tenant filtering
- **Joins**: Automatic relationship resolution
- **Aggregations**: Built-in grouping and calculations

### Security

- **Multi-tenant Isolation**: Users only see their data
- **Input Sanitization**: All inputs validated
- **Type Safety**: Full TypeScript coverage
- **RBAC**: Role-based access control (coming soon)

## 📈 Roadmap

### Coming Soon

- [ ] **Report Scheduling UI**: Visual schedule management
- [ ] **Report Sharing**: Share reports with team members
- [ ] **Report Versioning**: Track report changes
- [ ] **Custom Formulas**: Calculated fields
- [ ] **Drill-Down**: Click to see details
- [ ] **Dashboard Widgets**: Embed reports in dashboard
- [ ] **API Access**: REST API for reports
- [ ] **Export to Cloud**: Save to Dropbox, Google Drive

## 🆘 Support

### Common Issues

**Q: Report is slow to execute**
- Add filters to reduce data volume
- Use limit for top-N reports
- Contact support for index optimization

**Q: Export fails**
- Check data volume (large exports may timeout)
- Try different format
- Contact support if issue persists

**Q: Schedule not delivering**
- Check email addresses are correct
- Verify schedule is enabled
- Check spam/junk folders
- Contact support for delivery logs

### Contact

- **Email**: support@flowstock.com
- **Documentation**: https://docs.flowstock.com
- **Community**: https://community.flowstock.com

---

**FlowStock Advanced Reporting Dashboard** - Enterprise-grade business intelligence for inventory management.
