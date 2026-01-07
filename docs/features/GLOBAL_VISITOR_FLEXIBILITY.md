# Global Operations Flexibility - Visitor System

## 🌍 The Challenge

**Organizations operate differently across the globe:**

### Enterprise (USA/EU)

- Strict security protocols
- Background checks required
- Escorts mandatory
- Pre-approval needed
- GDPR/OSHA compliance

### SMB (Casual)

- Simple logbook replacement
- Walk-ins welcome
- Minimal bureaucracy
- Fast turnaround

### Manufacturing (Safety-Critical)

- Safety briefings required
- PPE enforcement
- Restricted zones
- OSHA compliance

### 3PL (Multi-Tenant)

- 24/7 operations
- Client-specific zones
- High volume visitors
- Fast processing

### Regional Differences

- **EU**: GDPR strict (30-day retention, right to erasure)
- **USA**: OSHA compliance for manufacturing
- **Asia**: Less paperwork, faster processing
- **Middle East**: Additional security layers

---

## ✅ Solution: Configurable Security Presets

### **5 Pre-Built Configurations**

#### 1. **ENTERPRISE** 🏢 (High Security)

```json
{
  "preRegistrationRequired": true,
  "walkInsAllowed": false,
  "photoIdRequired": true,
  "backgroundCheckRequired": true,
  "escortRequired": true,
  "hostApprovalRequired": true,
  "maximumVisitDuration": 8,
  "ndaRequired": true,
  "dataRetentionDays": 365
}
```

**Use Case**: Corporate headquarters, data centers, government facilities

**Workflow**:

1. Visitor pre-registers online (3 days advance)
2. Host approves
3. Background check runs
4. Visitor arrives → Photo ID + badge + NDA signature
5. Escort required at all times
6. Auto-alert after 4 hours

---

#### 2. **SMB_CASUAL** 🏪 (Relaxed)

```json
{
  "preRegistrationRequired": false,
  "walkInsAllowed": true,
  "photoIdRequired": false,
  "escortRequired": false,
  "hostRequired": false,
  "maximumVisitDuration": null,
  "dataRetentionDays": 90
}
```

**Use Case**: Small warehouses, retail, casual offices

**Workflow**:

1. Visitor walks in
2. Self-service kiosk → Name + Company + Purpose
3. Digital badge on phone
4. No escort needed
5. Check out whenever

---

#### 3. **MANUFACTURING** 🏭 (Safety-First)

```json
{
  "preRegistrationRequired": true,
  "safetyBriefingRequired": true,
  "escortRequired": true,
  "emergencyContactRequired": true,
  "oshaCompliance": true,
  "dataRetentionDays": 365
}
```

**Use Case**: Factories, chemical plants, construction sites

**Workflow**:

1. Pre-register with emergency contact
2. Arrive → Safety briefing (15 min)
3. PPE issued (hard hat, vest, goggles)
4. Escort through facility
5. OSHA-compliant log for 1 year

---

#### 4. **THREE_PL** 📦 (High Volume, Multi-Tenant)

```json
{
  "preRegistrationRequired": true,
  "walkInsAllowed": true,
  "allowedAreasEnforced": true,
  "companyRequired": true,
  "afterHoursAccessAllowed": true,
  "automatedGates": true
}
```

**Use Case**: 3PL warehouses, fulfillment centers

**Workflow**:

1. Client drivers pre-register OR walk-in
2. LPR auto-checks license plate
3. Assigned to client-specific zone
4. 24/7 access allowed
5. Zone restrictions enforced

---

#### 5. **EU_GDPR** 🇪🇺 (Privacy-Strict)

```json
{
  "photoCapture": false,
  "dataRetentionDays": 30,
  "consentRequired": true,
  "rightToErasure": true,
  "gdprCompliance": true
}
```

**Use Case**: EU-based operations

**Workflow**:

1. Explicit consent collected
2. No biometric data (photos require consent)
3. Data deleted after 30 days
4. Visitor can request data erasure anytime
5. GDPR-compliant audit log

---

## 🎛️ How It Works

### **Setup (One-Time)**

```typescript
// Administrator chooses preset for their organization
PUT /api/security/settings
{
  "preset": "MANUFACTURING"
}
```

### **Automatic Enforcement**

- All visitor APIs automatically check organization settings
- Reject walk-ins if `walkInsAllowed: false`
- Require pre-registration if `preRegistrationRequired: true`
- Enforce time limits if `maximumVisitDuration` set
- Auto-delete data per `dataRetentionDays`

### **Customization**

```typescript
// Mix and match settings
PUT /api/security/settings
{
  "customSettings": {
    "visitorPolicy": {
      "preRegistrationRequired": true,
      "walkInsAllowed": true, // Allow both!
      "photoIdRequired": true,
      "escortRequired": false,
      "maximumVisitDuration": 6,
      // ... customize all 30+ settings
    }
  }
}
```

---

## 📊 Configuration Options

### **Visitor Policy** (30+ settings)

- Registration requirements
- Identification & verification
- Badge management
- Access control & escorts
- Time limits & restrictions
- Compliance & documentation
- Regional compliance (GDPR, etc.)
- Notification preferences

### **Gate Control** (8 settings)

- Automated vs manual gates
- Vehicle inspection requirements
- After-hours policies

### **Compliance** (9 settings)

- Report frequency
- Alert thresholds
- Compliance standards (OSHA, ISO, GDPR)

---

## 🌐 Regional Examples

### **🇺🇸 USA Enterprise**

- Preset: `ENTERPRISE`
- OSHA compliance ON
- Background checks required
- 365-day retention
- NDA required

### **🇪🇺 EU Warehouse**

- Preset: `EU_GDPR`
- 30-day data retention (GDPR minimum)
- No photo capture (biometric data requires consent)
- Right to erasure enforced
- Explicit consent required

### **🇨🇳 China 3PL**

- Preset: `THREE_PL`
- 24/7 operations
- High volume processing
- Minimal paperwork
- Zone-based access

### **🇦🇺 Australia Manufacturing**

- Preset: `MANUFACTURING`
- Safety briefings mandatory
- Emergency contacts required
- PPE tracking
- OSHA-equivalent compliance

### **🇮🇳 India SMB**

- Preset: `SMB_CASUAL`
- Walk-ins welcome
- Simple digital logbook
- No escort required
- Fast turnaround

---

## 💡 Benefits

### **For LogiVox**

✅ **One codebase, global operations** - No separate builds
✅ **Compliance built-in** - GDPR, OSHA, ISO pre-configured
✅ **No customization work** - Clients choose preset
✅ **Market to all segments** - Enterprise to SMB

### **For Customers**

✅ **Works their way** - Not forced into rigid workflow
✅ **Instant setup** - Choose preset, done in 2 minutes
✅ **Compliant by default** - GDPR/OSHA pre-configured
✅ **Can customize** - 30+ settings adjustable

---

## 🚀 API Usage

### **Get Current Settings**

```bash
GET /api/security/settings
```

Response:

```json
{
  "currentSettings": {
    /* Active config */
  },
  "availablePresets": [
    "ENTERPRISE",
    "SMB_CASUAL",
    "MANUFACTURING",
    "THREE_PL",
    "EU_GDPR"
  ],
  "presets": {
    /* All preset details */
  }
}
```

### **Apply Preset**

```bash
PUT /api/security/settings
{
  "preset": "MANUFACTURING"
}
```

### **Custom Configuration**

```bash
PUT /api/security/settings
{
  "customSettings": {
    "visitorPolicy": {
      "preRegistrationRequired": true,
      "walkInsAllowed": true,
      "maximumVisitDuration": 4
    }
  }
}
```

### **Visitor Check-In (Automatic Enforcement)**

```bash
POST /api/security/visitors
{
  "firstName": "John",
  "lastName": "Doe",
  "company": "ACME Corp",
  "purpose": "Delivery"
}
```

If organization has `walkInsAllowed: false`:

```json
{
  "error": "Walk-in visitors not allowed. Pre-registration required.",
  "status": 403
}
```

---

## 🔧 Implementation Status

✅ **Database schema** - `securitySettings` JSON field added
✅ **5 pre-built presets** - Enterprise, SMB, Manufacturing, 3PL, EU
✅ **Configuration API** - GET/PUT settings endpoints
✅ **Automatic enforcement** - Visitor API checks policies
✅ **Activity logging** - Configuration changes tracked

### **Next Steps** (Optional Enhancements)

- 🔲 UI for configuration (settings page)
- 🔲 Preset comparison tool
- 🔲 Compliance checker (validates against regional laws)
- 🔲 Multi-language support for regional operations
- 🔲 Time-based policy switching (strict during business hours, relaxed after)

---

## 📖 Summary

**Problem**: Organizations operate differently globally (enterprise vs SMB, USA vs EU, manufacturing vs 3PL)

**Solution**: 5 pre-built security presets + 30+ customizable settings

**Result**:

- ✅ Works for enterprise (strict) and SMB (casual)
- ✅ Compliant with GDPR, OSHA, ISO
- ✅ No code changes per customer
- ✅ 2-minute setup (choose preset)
- ✅ Fully customizable if needed

**LogiVox can now market globally** without building separate systems for different operational models.
