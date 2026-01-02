# LogiVox WMS - User Manual

**Version 1.0**  
**Last Updated: October 16, 2025**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Inventory Management](#inventory-management)
5. [Order Processing](#order-processing)
6. [Warehouse Operations](#warehouse-operations)
7. [Reporting & Analytics](#reporting--analytics)
8. [Mobile App Usage](#mobile-app-usage)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

Welcome to **LogiVox WMS** - your comprehensive warehouse management solution. This manual will guide you through all features and functionality to help you efficiently manage your inventory, orders, and warehouse operations.

### What is LogiVox WMS?

LogiVox WMS is a cloud-based warehouse management system designed to streamline inventory tracking, order fulfillment, and warehouse operations. It provides real-time visibility into your stock levels, automated reordering, and powerful analytics to optimize your supply chain.

### Key Features

- **Real-time Inventory Tracking**: Monitor stock levels across multiple warehouses
- **Order Management**: Process sales and purchase orders efficiently
- **Barcode Scanning**: Quick product identification and movement tracking
- **Multi-warehouse Support**: Manage inventory across multiple locations
- **Advanced Analytics**: Gain insights with comprehensive reports and dashboards
- **Mobile Access**: Manage operations on-the-go with our mobile app
- **Automated Alerts**: Receive notifications for low stock, order updates, and more
- **Role-based Access Control**: Secure your data with granular permissions

---

## Getting Started

### System Requirements

**Web Application:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Stable internet connection (minimum 5 Mbps recommended)
- Screen resolution: 1366x768 or higher

**Mobile Application:**
- iOS 14+ or Android 10+
- Camera for barcode scanning
- Internet connection (4G/5G or Wi-Fi)

### Logging In

1. Navigate to `https://your-company.logivox.ai`
2. Enter your **email address** and **password**
3. Complete two-factor authentication if enabled
4. Click **"Sign In"**

**First-time Login:**
- You'll receive a welcome email with temporary credentials
- Change your password immediately upon first login
- Set up two-factor authentication for enhanced security

### Password Requirements

Your password must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@, #, $, %, etc.)

### Forgot Password?

1. Click **"Forgot Password?"** on the login page
2. Enter your registered email address
3. Check your email for a password reset link (valid for 1 hour)
4. Click the link and create a new password
5. Log in with your new credentials

---

## Dashboard Overview

The dashboard is your command center, providing at-a-glance visibility into your warehouse operations.

### Dashboard Widgets

#### Inventory Summary
- **Total Products**: Count of unique SKUs in your system
- **Total Stock Value**: Monetary value of current inventory
- **Low Stock Alerts**: Products below reorder point
- **Out of Stock**: Products with zero quantity

#### Order Statistics
- **Pending Orders**: Orders awaiting processing
- **Today's Orders**: Orders created today
- **Shipped Orders**: Orders shipped this week
- **Order Value**: Total revenue from orders

#### Quick Actions
- Create new order
- Add product
- Perform stock adjustment
- Generate report
- Scan barcode

#### Recent Activity
- Latest orders placed
- Recent inventory movements
- User activity log
- System notifications

### Customizing Your Dashboard

1. Click the **settings icon** (⚙️) in the top right
2. Select **"Customize Dashboard"**
3. Toggle widgets on/off
4. Drag and drop to rearrange
5. Click **"Save Layout"**

---

## Inventory Management

### Adding Products

1. Navigate to **Inventory → Products**
2. Click **"+ Add Product"** button
3. Fill in product information:
   - **SKU**: Unique product identifier (auto-generated or manual)
   - **Name**: Product name
   - **Description**: Detailed product description
   - **Category**: Product category (create new if needed)
   - **Barcode**: Scan or enter manually
   - **Unit of Measure**: Each, Box, Pallet, etc.
   - **Unit Price**: Product cost
   - **Selling Price**: Retail price
   - **Reorder Level**: Minimum stock threshold
   - **Reorder Quantity**: Automatic reorder amount
4. Upload product image (optional but recommended)
5. Click **"Save Product"**

**Bulk Import:**
1. Navigate to **Inventory → Import**
2. Download the CSV template
3. Fill in product data following the template format
4. Upload your CSV file
5. Review the preview and fix any errors
6. Click **"Import Products"**

### Managing Stock Levels

#### Manual Stock Adjustment

1. Navigate to **Inventory → Stock Adjustment**
2. Search for the product
3. Click **"Adjust Stock"**
4. Select adjustment type:
   - **Increase**: Add stock (receiving, found inventory)
   - **Decrease**: Remove stock (damage, shrinkage, returns)
   - **Set**: Set exact quantity (physical count)
5. Enter quantity and reason
6. Select warehouse location
7. Add notes (optional)
8. Click **"Submit Adjustment"**

#### Stock Transfers

Transfer inventory between warehouses:

1. Navigate to **Inventory → Transfer**
2. Click **"+ New Transfer"**
3. Select **source warehouse**
4. Select **destination warehouse**
5. Add products and quantities
6. Review transfer details
7. Click **"Create Transfer"**
8. Track transfer status until completion

**Transfer Statuses:**
- **Draft**: Transfer created but not submitted
- **Pending**: Awaiting approval
- **In Transit**: Items shipped from source
- **Completed**: Items received at destination
- **Cancelled**: Transfer cancelled

### Product Categories

Organize products with categories:

1. Navigate to **Inventory → Categories**
2. Click **"+ Add Category"**
3. Enter category name and description
4. Set parent category (for subcategories)
5. Click **"Save Category"**

### Barcode Management

#### Generate Barcodes

1. Navigate to **Inventory → Products**
2. Select product(s)
3. Click **"Print Barcodes"**
4. Choose barcode format (Code 128, QR Code, etc.)
5. Select label size (30x20mm, 40x30mm, etc.)
6. Click **"Generate"**
7. Print labels using your label printer

#### Scan Barcodes

**Web Application:**
1. Click the barcode icon (📷) in the search bar
2. Allow camera access
3. Point camera at barcode
4. Product details will appear automatically

**Mobile App:**
1. Tap the **scan button** (📷)
2. Align barcode within the frame
3. Scan will happen automatically
4. View or edit product details

---

## Order Processing

### Creating Sales Orders

1. Navigate to **Orders → Sales Orders**
2. Click **"+ New Order"**
3. Select or create customer:
   - Enter customer name
   - Add contact information
   - Save shipping address
4. Add products to order:
   - Search by name, SKU, or scan barcode
   - Enter quantity
   - Price will auto-populate (editable)
5. Review order summary
6. Select shipping method
7. Add order notes (optional)
8. Click **"Create Order"**

### Order Fulfillment Workflow

#### Step 1: Order Confirmation
- Review order details
- Verify product availability
- Check shipping address
- Update order status to **"Confirmed"**

#### Step 2: Picking
1. Navigate to **Orders → Pick List**
2. Select orders to pick
3. Print pick list or use mobile app
4. Locate products in warehouse
5. Scan products to confirm
6. Mark items as picked

#### Step 3: Packing
1. Navigate to **Orders → Pack Station**
2. Select picked order
3. Verify items against order
4. Select packaging materials
5. Print packing slip
6. Generate shipping label
7. Mark as **"Packed"**

#### Step 4: Shipping
1. Navigate to **Orders → Ready to Ship**
2. Select packed orders
3. Assign to carrier
4. Enter tracking number
5. Mark as **"Shipped"**
6. Customer receives tracking notification

### Purchase Orders

Create orders to restock inventory:

1. Navigate to **Orders → Purchase Orders**
2. Click **"+ New Purchase Order"**
3. Select supplier
4. Add products and quantities
5. Enter expected delivery date
6. Review total cost
7. Click **"Create PO"**
8. Track PO status until delivery

#### Receiving Purchase Orders

1. Navigate to **Orders → Receive**
2. Select purchase order
3. Scan or enter received items
4. Enter quantity received
5. Note any discrepancies
6. Click **"Complete Receiving"**
7. Inventory automatically updates

### Return Management

#### Process Customer Returns

1. Navigate to **Orders → Returns**
2. Click **"+ New Return"**
3. Select original order
4. Select items being returned
5. Enter return reason
6. Choose refund method
7. Generate RMA number
8. Send RMA to customer
9. Process return when received
10. Update inventory and refund customer

---

## Warehouse Operations

### Location Management

Organize your warehouse efficiently:

#### Adding Locations

1. Navigate to **Warehouse → Locations**
2. Click **"+ Add Location"**
3. Enter location details:
   - **Zone**: (e.g., A, B, C)
   - **Aisle**: (e.g., 01, 02, 03)
   - **Rack**: (e.g., 1, 2, 3)
   - **Shelf**: (e.g., A, B, C, D)
   - **Bin**: (e.g., 01, 02, 03)
4. Example: `A-01-1-B-02` (Zone A, Aisle 01, Rack 1, Shelf B, Bin 02)
5. Set location type (Storage, Picking, Packing, Staging)
6. Click **"Save Location"**

#### Assigning Products to Locations

1. Navigate to **Warehouse → Product Locations**
2. Search for product
3. Click **"Assign Location"**
4. Select warehouse
5. Select or scan location
6. Enter quantity at location
7. Set as primary location (optional)
8. Click **"Save"**

### Cycle Counting

Regular inventory audits:

1. Navigate to **Warehouse → Cycle Count**
2. Click **"+ New Count"**
3. Select counting method:
   - **ABC Analysis**: Priority-based counting
   - **Random**: Random product selection
   - **Location-based**: Count specific zones
   - **Full Physical**: Complete warehouse count
4. Generate count list
5. Assign to staff member
6. Count products physically
7. Enter actual quantities
8. Review discrepancies
9. Approve adjustments
10. Update inventory

### Picking Strategies

Optimize order picking:

#### Single Order Picking
- Pick one order at a time
- Best for small orders or urgent shipments
- Enable: **Settings → Warehouse → Picking Strategy → Single**

#### Batch Picking
- Pick multiple orders simultaneously
- Efficient for similar orders
- Enable: **Settings → Warehouse → Picking Strategy → Batch**

#### Wave Picking
- Pick by zone in waves
- Best for large warehouses
- Enable: **Settings → Warehouse → Picking Strategy → Wave**

#### Zone Picking
- Assign pickers to specific zones
- Each picker fulfills their zone
- Enable: **Settings → Warehouse → Picking Strategy → Zone**

---

## Reporting & Analytics

### Standard Reports

#### Inventory Reports

1. **Stock Level Report**
   - Current quantity of all products
   - Location: Reports → Inventory → Stock Levels
   - Filters: Warehouse, category, low stock only
   - Export: PDF, Excel, CSV

2. **Inventory Valuation Report**
   - Total value of inventory
   - Cost and selling price breakdown
   - Location: Reports → Inventory → Valuation
   - Group by: Category, warehouse, supplier

3. **Stock Movement Report**
   - Track inventory transactions
   - See all adjustments, transfers, sales
   - Location: Reports → Inventory → Movement
   - Date range selection

4. **ABC Analysis**
   - Classify products by value/volume
   - Location: Reports → Inventory → ABC Analysis
   - Categories: A (high value), B (medium), C (low)

#### Order Reports

1. **Sales Report**
   - Total sales by period
   - Location: Reports → Orders → Sales
   - Metrics: Revenue, quantity, average order value
   - Charts: Line, bar, pie

2. **Order Fulfillment Report**
   - Fulfillment metrics and timing
   - Location: Reports → Orders → Fulfillment
   - Metrics: Pick time, pack time, ship time

3. **Customer Report**
   - Top customers by revenue
   - Location: Reports → Customers → Analysis
   - Metrics: Order count, total spent, average order

#### Warehouse Performance

1. **Picking Performance**
   - Staff productivity metrics
   - Location: Reports → Warehouse → Picking
   - Metrics: Items per hour, accuracy rate

2. **Space Utilization**
   - Warehouse capacity analysis
   - Location: Reports → Warehouse → Space
   - View: Heat map, utilization percentage

### Custom Reports

Build your own reports:

1. Navigate to **Reports → Custom**
2. Click **"+ New Report"**
3. Select data source (Orders, Products, Inventory, etc.)
4. Add fields to include
5. Apply filters
6. Choose grouping
7. Select chart type
8. Save report
9. Schedule automated email delivery (optional)

### Dashboards

Create custom analytics dashboards:

1. Navigate to **Analytics → Dashboards**
2. Click **"+ New Dashboard"**
3. Add widgets:
   - KPI cards
   - Line charts
   - Bar charts
   - Pie charts
   - Tables
4. Configure each widget
5. Arrange layout
6. Save dashboard
7. Set as default (optional)

---

## Mobile App Usage

### Installing the App

**iOS:**
1. Open App Store
2. Search "LogiVox WMS"
3. Tap "Get" then "Install"
4. Open app when installed

**Android:**
1. Open Google Play Store
2. Search "LogiVox WMS"
3. Tap "Install"
4. Open app when installed

### Mobile App Features

#### Quick Scan
- Instant barcode scanning
- View product details immediately
- Check stock levels on-the-go

#### Inventory Count
- Perform cycle counts anywhere
- Scan products to count
- Submit counts directly to system

#### Order Picking
- Access pick lists on mobile
- Scan to confirm picks
- Mark orders as picked

#### Stock Adjustment
- Adjust inventory from warehouse floor
- Scan product and enter new quantity
- Instant sync with main system

#### Receiving
- Process purchase orders on mobile
- Scan received items
- Note discrepancies immediately

### Mobile Best Practices

1. **Battery Management**
   - Charge device fully before shift
   - Use battery saver mode
   - Close unused apps

2. **Connectivity**
   - Stay connected to Wi-Fi when possible
   - Use cellular data for critical operations
   - App works offline with sync when reconnected

3. **Scanner Optimization**
   - Clean camera lens regularly
   - Ensure good lighting
   - Hold device steady when scanning

---

## Troubleshooting

### Common Issues

#### Cannot Log In

**Problem**: "Invalid credentials" error

**Solutions:**
1. Verify email and password are correct
2. Check Caps Lock is off
3. Clear browser cache
4. Try password reset
5. Contact your administrator

#### Barcode Won't Scan

**Problem**: Barcode scanner not reading labels

**Solutions:**
1. Clean barcode label (no damage or smudges)
2. Ensure good lighting
3. Hold scanner at correct distance (2-6 inches)
4. Try manual entry of barcode number
5. Regenerate barcode label if damaged

#### Stock Levels Incorrect

**Problem**: Displayed quantity doesn't match physical count

**Solutions:**
1. Check recent transactions for product
2. Verify stock adjustments were entered correctly
3. Check for transfers in progress
4. Perform cycle count to verify
5. Contact administrator to review audit logs

#### Order Not Appearing

**Problem**: Created order doesn't show in order list

**Solutions:**
1. Check order status filter (might be filtered out)
2. Verify order was saved (not left as draft)
3. Refresh the page
4. Check correct warehouse is selected
5. Contact support if issue persists

#### Slow Performance

**Problem**: Application loading slowly

**Solutions:**
1. Check internet connection speed
2. Clear browser cache and cookies
3. Disable browser extensions
4. Close unused tabs and applications
5. Try a different browser
6. Contact IT if problem persists

---

## FAQ

### General Questions

**Q: Can I use LogiVox WMS offline?**  
A: The mobile app has limited offline functionality. You can scan products and perform counts, which will sync when connection is restored. The web app requires internet connection.

**Q: How often is data backed up?**  
A: Automated backups run daily. Manual backups can be created anytime by administrators. Backups are retained for 30 days.

**Q: Can I integrate with my accounting software?**  
A: Yes! LogiVox integrates with QuickBooks, Xero, and other accounting platforms. Contact support to set up integrations.

**Q: How many users can access the system?**  
A: Unlimited users based on your subscription plan. Each user needs their own credentials.

**Q: Is training provided?**  
A: Yes! We offer onboarding training, video tutorials, and ongoing support. Contact your account manager.

### Inventory Questions

**Q: How do I handle expiring products?**  
A: Use batch number tracking with expiration dates. Run the "Expiring Products" report to identify items nearing expiration.

**Q: Can I track serial numbers?**  
A: Yes! Enable serial number tracking per product. Each item will have a unique serial number.

**Q: What happens when stock reaches reorder level?**  
A: The system generates a low stock alert. If auto-reorder is enabled, a draft purchase order is created automatically.

**Q: Can I manage multiple warehouses?**  
A: Yes! LogiVox supports unlimited warehouses with stock visibility across all locations.

### Order Questions

**Q: Can I modify an order after it's shipped?**  
A: Shipped orders cannot be modified. You'll need to process a return and create a new order.

**Q: How do I handle backorders?**  
A: Orders with insufficient stock are automatically marked as backorders. They'll be fulfilled when stock arrives.

**Q: Can customers track their orders?**  
A: Yes! Shipping confirmation emails include tracking links for customer visibility.

**Q: What payment methods are supported?**  
A: Cash, check, credit card, and custom payment terms. Payment processing integrates with Stripe.

---

## Getting Help

### Support Resources

**📚 Knowledge Base**: https://help.logivox.ai  
**📧 Email Support**: support@logivox.ai  
**📞 Phone Support**: 1-800-LOGIVOX  
**💬 Live Chat**: Available in-app (bottom right corner)  
**🎓 Video Tutorials**: https://learn.logivox.ai

### Support Hours

- **Standard**: Monday-Friday, 9 AM - 6 PM EST
- **Premium**: 24/7 support with 1-hour response time
- **Emergency**: Critical issues handled immediately

---

**Thank you for choosing LogiVox WMS!** 🚀

*This manual is regularly updated. Check for the latest version at https://docs.logivox.ai*
