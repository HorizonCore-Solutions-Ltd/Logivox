# Phase 22 Quick Start Guide

## 🎯 Goal
Build a professional label template & printing system for warehouse operations in **20-25 hours**.

---

## ⚡ Quick Setup (30 minutes)

### 1. Install Dependencies

```bash
cd apps/web

# Core dependencies
npm install react-konva konva jsbarcode qrcode pdfkit zpl-image printnode @zxing/library sharp react-colorful

# Type definitions
npm install --save-dev @types/qrcode @types/pdfkit
```

### 2. Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model LabelTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])
  width           Float    // mm
  height          Float    // mm
  unit            String   @default("mm")
  dpi             Int      @default(203)
  orientation     String   @default("portrait")
  designData      Json
  thumbnail       String?
  isDefault       Boolean  @default(false)
  category        String?
  tags            String[]
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  printJobs       PrintJob[]
  
  @@index([organizationId])
  @@index([createdBy])
  @@index([category])
}

model PrintJob {
  id              String   @id @default(cuid())
  templateId      String
  template        LabelTemplate @relation(fields: [templateId], references: [id])
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])
  status          String   @default("pending")
  format          String
  printerName     String?
  printerId       String?
  quantity        Int      @default(1)
  copies          Int      @default(1)
  data            Json
  outputUrl       String?
  error           String?
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  metadata        Json?
  processingTime  Int?
  createdAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  
  @@index([organizationId])
  @@index([status])
  @@index([templateId])
}

model Printer {
  id              String   @id @default(cuid())
  name            String
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  printerId       String
  printerType     String
  manufacturer    String?
  model           String?
  isOnline        Boolean  @default(false)
  isDefault       Boolean  @default(false)
  location        String?
  supportedFormats String[]
  maxWidth        Float?
  maxHeight       Float?
  lastSeen        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([organizationId, printerId])
  @@index([organizationId])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_label_printing_system
npx prisma generate
```

### 3. Add Environment Variables

Add to `.env`:

```bash
# PrintNode API (sign up at https://www.printnode.com/)
PRINTNODE_API_KEY=your_api_key_here

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

---

## 📂 File Structure

Create these files:

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── labels/
│   │           ├── page.tsx                    # Labels hub
│   │           ├── designer/
│   │           │   └── page.tsx                # Label designer
│   │           ├── templates/
│   │           │   └── page.tsx                # Template library
│   │           ├── print-queue/
│   │           │   └── page.tsx                # Print queue
│   │           └── mobile/
│   │               └── page.tsx                # Mobile scan-to-print
│   └── api/
│       └── labels/
│           ├── templates/
│           │   └── route.ts                    # Template CRUD
│           ├── print/
│           │   └── route.ts                    # Submit print job
│           └── printers/
│               └── route.ts                    # Printer management
├── components/
│   └── labels/
│       ├── label-canvas.tsx                    # Canvas component
│       ├── element-toolbar.tsx                 # Tools sidebar
│       ├── properties-panel.tsx                # Properties sidebar
│       ├── template-card.tsx                   # Template grid item
│       └── print-queue-item.tsx                # Queue item
└── lib/
    ├── print-engine.ts                         # PDF/ZPL generation
    ├── barcode.ts                              # Barcode generation
    └── print-node.ts                           # PrintNode client
```

---

## 🔨 Implementation Order

### Day 1: Core Designer (6-8 hours)

**Create:** `apps/web/src/app/(dashboard)/dashboard/labels/designer/page.tsx`

**Features:**
- Canvas with react-konva
- Add text elements
- Add barcode/QR code
- Drag & drop
- Properties panel
- Save template

**Quick Template:**
```typescript
"use client";

import { useState } from "react";
import { Stage, Layer, Text, Rect } from "react-konva";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LabelDesignerPage() {
  const [elements, setElements] = useState([]);
  const [labelWidth, setLabelWidth] = useState(100); // mm
  const [labelHeight, setLabelHeight] = useState(50); // mm

  // Convert mm to pixels at 203 DPI
  const mmToPx = (mm) => (mm * 203) / 25.4;

  const addText = () => {
    setElements([...elements, {
      id: Date.now(),
      type: 'text',
      x: 50,
      y: 50,
      text: 'Click to edit',
      fontSize: 14
    }]);
  };

  return (
    <div className="flex h-screen">
      {/* Tools Sidebar */}
      <Card className="w-64 p-4">
        <h2 className="font-bold mb-4">Tools</h2>
        <Button onClick={addText} className="w-full mb-2">
          Add Text
        </Button>
        <Button className="w-full mb-2">Add Barcode</Button>
        <Button className="w-full">Add QR Code</Button>
      </Card>

      {/* Canvas */}
      <div className="flex-1 p-8 bg-gray-50">
        <Stage width={mmToPx(labelWidth)} height={mmToPx(labelHeight)}>
          <Layer>
            <Rect x={0} y={0} width={mmToPx(labelWidth)} height={mmToPx(labelHeight)} fill="white" stroke="black" />
            {elements.map(el => (
              <Text key={el.id} {...el} draggable />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Properties Sidebar */}
      <Card className="w-64 p-4">
        <h2 className="font-bold">Properties</h2>
      </Card>
    </div>
  );
}
```

### Day 2: Template Management (3-4 hours)

**Create:** `apps/web/src/app/(dashboard)/dashboard/labels/templates/page.tsx`

**Features:**
- Grid of templates
- Search & filter
- Create/edit/delete
- Duplicate template
- Set as default

### Day 3: Print Engine (4-5 hours)

**Create:** `apps/web/src/lib/print-engine.ts`

**Features:**
- PDF generation with pdfkit
- ZPL generation for Zebra
- PNG/JPG export
- Field mapping resolver

**Quick Template:**
```typescript
import PDFKit from 'pdfkit';
import JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';

export class PrintEngine {
  static async generatePDF(elements, data, width, height) {
    return new Promise((resolve) => {
      const doc = new PDFKit({ size: [width, height], margin: 0 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      elements.forEach(el => {
        if (el.type === 'text') {
          const text = this.resolveFields(el.text, data);
          doc.fontSize(el.fontSize).text(text, el.x, el.y);
        } else if (el.type === 'barcode') {
          const canvas = new Canvas(200, 80);
          JsBarcode(canvas, data[el.fieldMapping] || '', { format: 'CODE128' });
          doc.image(canvas.toBuffer(), el.x, el.y);
        }
      });

      doc.end();
    });
  }

  static generateZPL(elements, data, width, height) {
    let zpl = '^XA\n';
    
    elements.forEach(el => {
      if (el.type === 'text') {
        const text = this.resolveFields(el.text, data);
        zpl += `^FO${el.x},${el.y}^A0N,${el.fontSize}^FD${text}^FS\n`;
      } else if (el.type === 'barcode') {
        const value = data[el.fieldMapping] || '';
        zpl += `^FO${el.x},${el.y}^BC^FD${value}^FS\n`;
      }
    });

    zpl += '^XZ\n';
    return zpl;
  }

  static resolveFields(text, data) {
    return text.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  }
}
```

### Day 4: Print Queue & API (3-4 hours)

**Create:** `apps/web/src/app/api/labels/print/route.ts`

**Features:**
- Submit print job
- Queue management
- PrintNode integration
- Status updates

### Day 5: Mobile Scan-to-Print (2-3 hours)

**Create:** `apps/web/src/app/(dashboard)/dashboard/labels/mobile/page.tsx`

**Features:**
- Camera barcode scanner
- Item lookup
- One-tap print
- Status toast

### Day 6: Advanced Features (3-4 hours)

**Features:**
- AI layout suggestions
- Conditional fields
- Multi-language
- GRN/Packing slip templates

---

## 🧪 Testing Checklist

- [ ] Create template with text and barcode
- [ ] Save template successfully
- [ ] Generate PDF from template
- [ ] Generate ZPL from template
- [ ] Print to local printer (if available)
- [ ] Print to PrintNode cloud printer
- [ ] Scan barcode with mobile camera
- [ ] Auto-populate label with item data
- [ ] Batch print 10 labels
- [ ] View print queue with status

---

## 📊 Success Metrics

After implementation, you should achieve:

✅ **Print Success Rate:** >95%  
✅ **Print Time:** <3 seconds from click to printer  
✅ **Template Creation:** <5 minutes for new template  
✅ **Mobile Scan-to-Print:** <10 seconds end-to-end  
✅ **Batch Print 100 labels:** <30 seconds  

---

## 🚀 Go Live Checklist

- [ ] Sign up for PrintNode account
- [ ] Add API key to environment variables
- [ ] Test with physical printer
- [ ] Create 3 default templates (Product, Shipping, Asset)
- [ ] Train warehouse staff on mobile app
- [ ] Deploy to production
- [ ] Monitor print queue for errors

---

## 📚 Resources

- **PrintNode Docs:** https://www.printnode.com/en/docs
- **ZPL Guide:** https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf
- **react-konva:** https://konvajs.org/docs/react/
- **jsbarcode:** https://github.com/lindell/JsBarcode
- **Full Implementation Guide:** `docs/PHASE_22_LABEL_PRINTING_GUIDE.md`

---

**Ready? Let's build!** 🎨🖨️📱
