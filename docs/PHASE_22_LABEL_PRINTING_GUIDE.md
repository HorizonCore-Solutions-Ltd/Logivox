# Phase 22: Label Template & Printing System - Implementation Guide

## 🎯 Overview

The LogiVox Label Template & Printing System is a **game-changing warehouse operations feature** that enables users to design, manage, and print professional labels with dynamic field mapping, batch processing, and multi-format export capabilities.

**Priority:** HIGH  
**Estimated Time:** 20-25 hours  
**Status:** Not Started

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Database Schema](#database-schema)
3. [Implementation Steps](#implementation-steps)
4. [Component Architecture](#component-architecture)
5. [API Endpoints](#api-endpoints)
6. [User Flows](#user-flows)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## 🛠 Tech Stack

### Frontend

- **Canvas Library:** `react-konva` (recommended) or `fabric.js`
- **Barcode Generation:** `jsbarcode` (Code128, Code39, EAN13)
- **QR Code Generation:** `qrcode` or `qrcode.react`
- **Barcode Scanning:** `@zxing/library` (mobile camera scanning)
- **Color Picker:** `react-colorful`
- **Drag & Drop:** Built into react-konva or use `react-dnd`

### Backend

- **PDF Generation:** `pdfkit` (Node.js) or `jsPDF` (client-side)
- **ZPL Generation:** `zpl-image` (Zebra Programming Language)
- **Image Processing:** `sharp` (resize, compress, convert)
- **Printer API:** `printnode` (cloud printing service)

### Database

- **ORM:** Prisma
- **Models:** `LabelTemplate`, `PrintJob`
- **Storage:** PostgreSQL for metadata, Vercel Blob/S3 for generated files

### Real-time Updates

- **Option 1:** Pusher (WebSocket service)
- **Option 2:** Socket.io (self-hosted)
- **Option 3:** Polling (simple, less efficient)

---

## 🗄 Database Schema

### Prisma Models

```prisma
// Add to prisma/schema.prisma

model LabelTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])

  // Label dimensions
  width           Float    // in mm
  height          Float    // in mm
  unit            String   @default("mm") // mm, cm, inch
  dpi             Int      @default(203) // 203, 300, 600
  orientation     String   @default("portrait") // portrait, landscape

  // Design data
  designData      Json     // Canvas JSON with elements
  thumbnail       String?  // URL to thumbnail image

  // Categorization
  isDefault       Boolean  @default(false)
  category        String?  // "Shipping", "Product", "Asset", "Compliance"
  tags            String[] // ["warehouse", "thermal", "barcode"]

  // Metadata
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  printJobs       PrintJob[]

  @@index([organizationId])
  @@index([createdBy])
  @@index([category])
  @@index([isDefault])
}

model PrintJob {
  id              String   @id @default(cuid())
  templateId      String
  template        LabelTemplate @relation(fields: [templateId], references: [id])
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])

  // Print settings
  status          String   @default("pending") // pending, processing, completed, failed, cancelled
  format          String   // "PDF", "ZPL", "PNG", "JPG"
  printerName     String?
  printerId       String?  // PrintNode printer ID
  quantity        Int      @default(1)
  copies          Int      @default(1)

  // Data
  data            Json     // Data for label fields (itemName, sku, etc.)
  outputUrl       String?  // URL to generated file

  // Error handling
  error           String?
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)

  // Metadata
  metadata        Json?    // Additional tracking data (IP, user agent, etc.)
  processingTime  Int?     // Time in milliseconds

  // Timestamps
  createdAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?

  @@index([organizationId])
  @@index([status])
  @@index([createdBy])
  @@index([createdAt])
  @@index([templateId])
}

model Printer {
  id              String   @id @default(cuid())
  name            String
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Printer details
  printerId       String   // PrintNode printer ID
  printerType     String   // "Thermal", "Inkjet", "Laser"
  manufacturer    String?  // "Zebra", "Brother", "Dymo"
  model           String?

  // Connection
  isOnline        Boolean  @default(false)
  isDefault       Boolean  @default(false)
  location        String?  // "Warehouse A", "Shipping Dock"

  // Capabilities
  supportedFormats String[] // ["ZPL", "PDF", "PNG"]
  maxWidth        Float?   // Max label width in mm
  maxHeight       Float?   // Max label height in mm

  // Metadata
  lastSeen        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, printerId])
  @@index([organizationId])
  @@index([isDefault])
}
```

### Migration Command

```bash
npx prisma migrate dev --name add_label_printing_system
```

---

## 🔧 Implementation Steps

### Step 1: Install Dependencies (30 minutes)

```bash
cd apps/web

# Canvas and drawing libraries
npm install react-konva konva

# Barcode and QR code generation
npm install jsbarcode qrcode
npm install --save-dev @types/qrcode

# PDF generation
npm install pdfkit
npm install --save-dev @types/pdfkit

# ZPL generation for Zebra printers
npm install zpl-image

# Barcode scanning (mobile)
npm install @zxing/library

# Printer integration
npm install printnode

# Image processing
npm install sharp

# Color picker
npm install react-colorful

# Real-time updates (choose one)
npm install pusher-js
# OR
npm install socket.io-client
```

### Step 2: Create Prisma Models (15 minutes)

1. Add models to `prisma/schema.prisma` (see schema above)
2. Run migration:
   ```bash
   npx prisma migrate dev --name add_label_printing_system
   ```
3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Step 3: Create Label Designer UI (6-8 hours)

#### File: `apps/web/src/app/(dashboard)/dashboard/labels/designer/page.tsx`

```typescript
"use client";

import { useState, useRef } from "react";
import { Stage, Layer, Rect, Text, Image, Line } from "react-konva";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Download, Eye, Printer } from "lucide-react";

interface LabelElement {
  id: string;
  type: "text" | "barcode" | "qrcode" | "image" | "rectangle" | "line";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  rotation?: number;
  fieldMapping?: string; // e.g., "{sku}", "{itemName}"
}

export default function LabelDesignerPage() {
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelDimensions, setLabelDimensions] = useState({
    width: 100, // mm
    height: 50, // mm
    dpi: 203,
  });

  const stageRef = useRef(null);

  // Convert mm to pixels (at given DPI)
  const mmToPx = (mm: number) => (mm * labelDimensions.dpi) / 25.4;

  const stageWidth = mmToPx(labelDimensions.width);
  const stageHeight = mmToPx(labelDimensions.height);

  const addTextElement = () => {
    const newElement: LabelElement = {
      id: `text-${Date.now()}`,
      type: "text",
      x: 50,
      y: 50,
      text: "Click to edit",
      fontSize: 14,
      fontFamily: "Arial",
      fill: "#000000",
    };
    setElements([...elements, newElement]);
  };

  const addBarcodeElement = () => {
    // Generate barcode using jsbarcode library
    const newElement: LabelElement = {
      id: `barcode-${Date.now()}`,
      type: "barcode",
      x: 50,
      y: 100,
      width: 200,
      height: 80,
      fieldMapping: "{sku}",
    };
    setElements([...elements, newElement]);
  };

  const saveTemplate = async () => {
    const templateData = {
      name: "My Label Template",
      width: labelDimensions.width,
      height: labelDimensions.height,
      dpi: labelDimensions.dpi,
      designData: elements,
    };

    const response = await fetch("/api/labels/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });

    if (response.ok) {
      alert("Template saved successfully!");
    }
  };

  const exportPDF = () => {
    // Export canvas to PDF using pdfkit
    // Implementation in next step
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Tools */}
      <Card className="w-64 p-4 space-y-4">
        <h2 className="text-lg font-bold">Tools</h2>

        <div className="space-y-2">
          <Button onClick={addTextElement} className="w-full">
            Add Text
          </Button>
          <Button onClick={addBarcodeElement} className="w-full">
            Add Barcode
          </Button>
          <Button className="w-full">Add QR Code</Button>
          <Button className="w-full">Add Image</Button>
          <Button className="w-full">Add Rectangle</Button>
          <Button className="w-full">Add Line</Button>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Label Size</h3>
          <div className="space-y-2">
            <div>
              <Label>Width (mm)</Label>
              <Input
                type="number"
                value={labelDimensions.width}
                onChange={(e) =>
                  setLabelDimensions({
                    ...labelDimensions,
                    width: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Height (mm)</Label>
              <Input
                type="number"
                value={labelDimensions.height}
                onChange={(e) =>
                  setLabelDimensions({
                    ...labelDimensions,
                    height: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Center - Canvas */}
      <div className="flex-1 p-8 bg-gray-50">
        <div className="bg-white border-2 border-gray-300 inline-block">
          <Stage
            width={stageWidth}
            height={stageHeight}
            ref={stageRef}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={stageWidth}
                height={stageHeight}
                fill="white"
              />

              {/* Render elements */}
              {elements.map((element) => {
                if (element.type === "text") {
                  return (
                    <Text
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      text={element.text}
                      fontSize={element.fontSize}
                      fontFamily={element.fontFamily}
                      fill={element.fill}
                      draggable
                      onClick={() => setSelectedId(element.id)}
                      onDragEnd={(e) => {
                        const newElements = elements.map((el) =>
                          el.id === element.id
                            ? { ...el, x: e.target.x(), y: e.target.y() }
                            : el
                        );
                        setElements(newElements);
                      }}
                    />
                  );
                }
                // Add other element types (barcode, qrcode, etc.)
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <Card className="w-64 p-4">
        <h2 className="text-lg font-bold mb-4">Properties</h2>

        {selectedId ? (
          <div className="space-y-4">
            {/* Properties for selected element */}
            <p>Selected: {selectedId}</p>
            {/* Add property editors here */}
          </div>
        ) : (
          <p className="text-gray-500">No element selected</p>
        )}
      </Card>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-2 justify-center">
          <Button onClick={saveTemplate}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Create Template Management (3-4 hours)

#### File: `apps/web/src/app/(dashboard)/dashboard/labels/templates/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash, Copy } from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  width: number;
  height: number;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const response = await fetch("/api/labels/templates");
    const data = await response.json();
    setTemplates(data);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Shipping", "Product", "Asset", "Compliance"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Label Templates</h1>
        <Link href="/dashboard/labels/designer">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="aspect-video bg-gray-100 rounded-md mb-2">
                {/* Template thumbnail */}
                <img
                  src={template.thumbnail || "/placeholder-label.png"}
                  alt={template.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <p className="text-sm text-gray-500">{template.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                <Badge variant="secondary">{template.category}</Badge>
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {template.width}mm × {template.height}mm
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Step 5: Create Print Generation Engine (4-5 hours)

#### File: `apps/web/src/lib/print-engine.ts`

```typescript
import PDFKit from "pdfkit";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Canvas } from "canvas";

interface LabelElement {
  type: "text" | "barcode" | "qrcode" | "image";
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fieldMapping?: string;
}

interface LabelData {
  itemName?: string;
  sku?: string;
  poNumber?: string;
  supplierName?: string;
  deliveryDate?: string;
  [key: string]: any;
}

export class PrintEngine {
  // Generate PDF from label template
  static async generatePDF(
    elements: LabelElement[],
    data: LabelData,
    width: number,
    height: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFKit({ size: [width, height], margin: 0 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Render each element
      elements.forEach((element) => {
        const resolvedText = this.resolveFieldMapping(
          element.text || element.fieldMapping || "",
          data,
        );

        if (element.type === "text") {
          doc
            .fontSize(element.fontSize || 12)
            .text(resolvedText, element.x, element.y);
        } else if (element.type === "barcode") {
          // Generate barcode and add to PDF
          const barcodeCanvas = this.generateBarcode(resolvedText);
          doc.image(barcodeCanvas.toBuffer(), element.x, element.y);
        } else if (element.type === "qrcode") {
          // Generate QR code and add to PDF
          QRCode.toDataURL(resolvedText).then((url) => {
            doc.image(url, element.x, element.y, { width: 100, height: 100 });
          });
        }
      });

      doc.end();
    });
  }

  // Generate ZPL for Zebra thermal printers
  static generateZPL(
    elements: LabelElement[],
    data: LabelData,
    width: number,
    height: number,
    dpi: number = 203,
  ): string {
    let zpl = `^XA\n`; // Start format
    zpl += `^FO0,0^GB${width},${height},2^FS\n`; // Border

    elements.forEach((element) => {
      const resolvedText = this.resolveFieldMapping(
        element.text || element.fieldMapping || "",
        data,
      );

      if (element.type === "text") {
        // ^FO: Field Origin (x, y position)
        // ^A0: Font (0 = default font)
        // ^FD: Field Data
        zpl += `^FO${element.x},${element.y}^A0N,${element.fontSize || 30},${element.fontSize || 30}^FD${resolvedText}^FS\n`;
      } else if (element.type === "barcode") {
        // ^BY: Bar Code Field Default (width, ratio, height)
        // ^BC: Code 128 Barcode
        zpl += `^FO${element.x},${element.y}^BY2,3,80^BC^FD${resolvedText}^FS\n`;
      } else if (element.type === "qrcode") {
        // ^BQ: QR Code
        zpl += `^FO${element.x},${element.y}^BQN,2,5^FDQA,${resolvedText}^FS\n`;
      }
    });

    zpl += `^XZ\n`; // End format
    return zpl;
  }

  // Generate barcode image
  private static generateBarcode(text: string): Canvas {
    const canvas = new Canvas(200, 80);
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: true,
      fontSize: 12,
    });
    return canvas;
  }

  // Resolve field mappings like {sku} → actual SKU value
  private static resolveFieldMapping(text: string, data: LabelData): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
```

### Step 6: Create API Endpoints (2-3 hours)

#### File: `apps/web/src/app/api/labels/templates/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/labels/templates - List all templates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.labelTemplate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

// POST /api/labels/templates - Create new template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const template = await prisma.labelTemplate.create({
    data: {
      ...body,
      organizationId: session.user.organizationId,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
```

#### File: `apps/web/src/app/api/labels/print/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintEngine } from "@/lib/print-engine";
import PrintNode from "printnode";

const printNodeClient = new PrintNode.Client({
  apiKey: process.env.PRINTNODE_API_KEY!,
});

// POST /api/labels/print - Submit print job
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { templateId, data, format, printerId, quantity } = body;

  // Get template
  const template = await prisma.labelTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Create print job
  const printJob = await prisma.printJob.create({
    data: {
      templateId,
      organizationId: session.user.organizationId,
      createdBy: session.user.id,
      status: "pending",
      format,
      printerId,
      quantity,
      data,
    },
  });

  // Generate label based on format
  let outputBuffer: Buffer;
  let contentType: string;

  if (format === "PDF") {
    outputBuffer = await PrintEngine.generatePDF(
      template.designData as any,
      data,
      template.width,
      template.height,
    );
    contentType = "application/pdf";
  } else if (format === "ZPL") {
    const zpl = PrintEngine.generateZPL(
      template.designData as any,
      data,
      template.width,
      template.height,
      template.dpi,
    );
    outputBuffer = Buffer.from(zpl, "utf-8");
    contentType = "text/plain";
  } else {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }

  // Send to PrintNode if printer specified
  if (printerId) {
    try {
      await printNodeClient.createPrintJob(parseInt(printerId), {
        title: `Label - ${printJob.id}`,
        contentType,
        content: outputBuffer.toString("base64"),
        source: "LogiVox",
      });

      await prisma.printJob.update({
        where: { id: printJob.id },
        data: { status: "completed", completedAt: new Date() },
      });
    } catch (error) {
      await prisma.printJob.update({
        where: { id: printJob.id },
        data: { status: "failed", error: (error as Error).message },
      });
    }
  }

  return NextResponse.json(printJob);
}
```

### Step 7: Create Mobile Scan-to-Print (2-3 hours)

#### File: `apps/web/src/app/(dashboard)/dashboard/labels/mobile/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Printer } from "lucide-react";

export default function MobileScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const startScan = async () => {
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();

    try {
      const result = await codeReader.decodeOnceFromVideoDevice(
        undefined,
        "video"
      );

      // Fetch item data based on scanned SKU
      const response = await fetch(`/api/inventory/by-sku/${result.getText()}`);
      const itemData = await response.json();

      setScannedData(itemData);
      setScanning(false);
    } catch (error) {
      console.error(error);
      setScanning(false);
    }
  };

  const printLabel = async () => {
    const response = await fetch("/api/labels/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: "default-product-label",
        data: scannedData,
        format: "ZPL",
        printerId: "default",
      }),
    });

    if (response.ok) {
      alert("Label sent to printer!");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Scan to Print</h1>

      {!scanning && !scannedData && (
        <Button onClick={startScan} className="w-full">
          <Camera className="mr-2 h-4 w-4" />
          Start Scanning
        </Button>
      )}

      {scanning && (
        <div>
          <video id="video" className="w-full rounded-lg" />
        </div>
      )}

      {scannedData && (
        <Card className="p-4">
          <h2 className="font-bold mb-2">Scanned Item</h2>
          <p>Name: {scannedData.name}</p>
          <p>SKU: {scannedData.sku}</p>
          <p>Stock: {scannedData.stockLevel}</p>

          <Button onClick={printLabel} className="w-full mt-4">
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </Button>
        </Card>
      )}
    </div>
  );
}
```

---

## 🔄 User Flows

### Flow 1: Desktop - Design and Print Label

1. User navigates to `/dashboard/labels/designer`
2. User drags text elements, barcodes, QR codes onto canvas
3. User maps dynamic fields: `{itemName}`, `{sku}`, `{poNumber}`
4. User sets label dimensions (100mm × 50mm, 203 DPI)
5. User clicks "Save Template" → saves to database
6. User selects item from inventory
7. User clicks "Print Label" → auto-fills template with item data
8. User previews label
9. User selects printer and clicks "Print" → sends to PrintNode
10. System shows toast: "Print job submitted successfully"

### Flow 2: Mobile - Scan and Print

1. User opens `/dashboard/labels/mobile` on phone
2. User taps "Start Scanning"
3. Camera activates, user scans barcode on product
4. System fetches item data from database
5. System displays item details (name, SKU, stock)
6. User taps "Print Label"
7. System selects default template and printer
8. Label prints automatically
9. Toast notification: "Label printed successfully"

### Flow 3: Batch Printing

1. User selects multiple items in inventory table (checkbox selection)
2. User clicks "Print Labels" bulk action
3. Modal opens: "Print 25 labels"
4. User selects template and printer
5. User clicks "Confirm"
6. System creates 25 print jobs in queue
7. Progress bar shows: "Printing 12 of 25..."
8. All labels print in sequence
9. Notification: "All labels printed successfully"

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// apps/web/src/lib/__tests__/print-engine.test.ts

import { PrintEngine } from "../print-engine";

describe("PrintEngine", () => {
  it("should generate PDF with text elements", async () => {
    const elements = [
      { type: "text", x: 10, y: 10, text: "Test Label", fontSize: 16 },
    ];
    const data = {};
    const pdf = await PrintEngine.generatePDF(elements, data, 100, 50);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should resolve field mappings", () => {
    const text = "Item: {itemName}, SKU: {sku}";
    const data = { itemName: "Widget", sku: "WDG-001" };
    const result = PrintEngine["resolveFieldMapping"](text, data);

    expect(result).toBe("Item: Widget, SKU: WDG-001");
  });

  it("should generate ZPL for barcode", () => {
    const elements = [{ type: "barcode", x: 50, y: 50, fieldMapping: "{sku}" }];
    const data = { sku: "123456789" };
    const zpl = PrintEngine.generateZPL(elements, data, 100, 50);

    expect(zpl).toContain("^XA");
    expect(zpl).toContain("^BC");
    expect(zpl).toContain("123456789");
    expect(zpl).toContain("^XZ");
  });
});
```

### E2E Tests

```typescript
// apps/web/e2e/label-printing.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Label Printing", () => {
  test("should create new label template", async ({ page }) => {
    await page.goto("/dashboard/labels/designer");

    // Add text element
    await page.click('button:has-text("Add Text")');
    await page.click("canvas");

    // Save template
    await page.click('button:has-text("Save Template")');
    await page.fill('input[name="name"]', "Test Template");
    await page.click('button:has-text("Save")');

    await expect(
      page.locator('text="Template saved successfully"'),
    ).toBeVisible();
  });

  test("should print label from inventory", async ({ page }) => {
    await page.goto("/dashboard/inventory");

    // Select first item
    await page.click("tr:first-child");

    // Click print button
    await page.click('button:has-text("Print Label")');

    // Preview should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Confirm print
    await page.click('button:has-text("Print")');

    await expect(page.locator('text="Print job submitted"')).toBeVisible();
  });
});
```

---

## 📦 Deployment Checklist

### Environment Variables

Add to `.env`:

```bash
# PrintNode API Key (sign up at https://www.printnode.com/)
PRINTNODE_API_KEY=your_api_key_here

# File Storage (Vercel Blob or AWS S3)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
# OR
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Real-time Updates (optional)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2
```

### Database Migration

```bash
npx prisma migrate deploy
```

### Verify Integrations

- [ ] PrintNode account created and API key added
- [ ] Test printer added to PrintNode dashboard
- [ ] Test print job sent successfully
- [ ] File storage configured (Vercel Blob or S3)
- [ ] Real-time updates working (if using Pusher/Socket.io)

### Performance Optimization

- [ ] Canvas rendering optimized (virtualization for large templates)
- [ ] PDF generation cached for repeated prints
- [ ] Print queue processed in background (worker thread or queue system)
- [ ] Thumbnails generated and cached for template library

### Security Checklist

- [ ] Only organization members can access their templates
- [ ] Print jobs scoped to organization
- [ ] File uploads validated (max size, file type)
- [ ] API endpoints rate-limited
- [ ] Printer credentials encrypted

---

## 🎉 Success Metrics

- **Print Success Rate:** >95%
- **Average Print Time:** <3 seconds (from click to printer)
- **Template Creation Time:** <5 minutes
- **Mobile Scan-to-Print:** <10 seconds end-to-end
- **Printer Support:** 10+ models (Zebra, Brother, Dymo, etc.)
- **Uptime:** 99.9% availability

---

## 📚 Additional Resources

- [PrintNode API Documentation](https://www.printnode.com/en/docs/api/curl)
- [Zebra ZPL Programming Guide](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf)
- [react-konva Documentation](https://konvajs.org/docs/react/)
- [jsbarcode Documentation](https://github.com/lindell/JsBarcode)
- [pdfkit Documentation](https://pdfkit.org/)

---

**Last Updated:** October 15, 2025  
**Status:** Ready for implementation  
**Priority:** HIGH - Game-changing feature for warehouse operations
