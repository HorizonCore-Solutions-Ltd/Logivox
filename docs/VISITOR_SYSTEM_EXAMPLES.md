# Real-World Visitor System Examples

## Scenario 1: US Tech Company (Enterprise)

**Company**: TechCorp - Silicon Valley HQ
**Preset**: `ENTERPRISE`

### Their Requirements
- IP protection critical
- NDA required
- Background checks
- Escort mandatory
- CCTV everywhere

### How They Use LogiVox

**Setup** (2 minutes):
```bash
# Admin chooses ENTERPRISE preset
PUT /api/security/settings
{ "preset": "ENTERPRISE" }
```

**Daily Operations**:

**8:00 AM** - Visitor "Jane Smith" pre-registered yesterday
- ✅ Host approved
- ✅ Background check passed
- ✅ Arrival notification sent to host

**9:15 AM** - Jane arrives at gate
```
Security Guard:
1. Scans Jane's QR code → Auto check-in
2. Takes photo for badge
3. NDA signed digitally
4. Badge printed: VIS000042
5. Host "Mike" notified: "Jane is here"
```

**9:20 AM** - Mike escorts Jane to conference room
- Badge allows access only to approved zones
- System tracks: Jane + Mike + Conference Room B + 9:20 AM

**1:30 PM** - Jane still in building (4+ hours)
- ⚠️ Alert sent to security: "Visitor overdue"
- Security checks: Still in meeting with Mike ✓

**2:45 PM** - Jane leaves
- Badge returned
- Auto check-out
- Host notified: "Jane checked out"
- Badge VIS000042 deactivated

**Result**: Complete audit trail, IP protected, host always informed

---

## Scenario 2: Small Warehouse (SMB Casual)

**Company**: LocalParts Inc - 5,000 sq ft warehouse
**Preset**: `SMB_CASUAL`

### Their Requirements
- No bureaucracy
- Walk-ins welcome
- Fast turnaround
- Just basic tracking

### How They Use LogiVox

**Setup** (1 minute):
```bash
PUT /api/security/settings
{ "preset": "SMB_CASUAL" }
```

**Daily Operations**:

**10:30 AM** - Delivery driver walks in
```
Driver:
1. iPad at entrance: "Sign in"
2. Types: Name, Company, Purpose
3. Gets digital badge on screen
4. Shows badge to warehouse staff
5. Makes delivery
6. Taps "Check out" on iPad
7. Done
```

**No security guard. No physical badges. No pre-registration. No escort.**

Just a digital logbook that:
- Tracks who's on-site
- Keeps 90-day history
- Email summary to owner weekly

**Result**: Modern vs paper logbook, zero hassle, costs nothing extra

---

## Scenario 3: Car Manufacturing Plant (Safety-Critical)

**Company**: AutoBuild Motors - Detroit Plant
**Preset**: `MANUFACTURING`

### Their Requirements
- OSHA compliance
- Safety briefings mandatory
- Hard hats/PPE required
- Emergency contacts
- 1-year retention

### How They Use LogiVox

**Setup**:
```bash
PUT /api/security/settings
{ "preset": "MANUFACTURING" }
```

**Daily Operations**:

**7:00 AM** - Supplier rep "Carlos" visiting for quality audit
- Pre-registered with emergency contact

**7:30 AM** - Carlos arrives
```
Security Process:
1. Scan QR code → Check-in
2. Watch 15-min safety video
3. Sign: "I understand factory hazards"
4. Issue: Hard hat + safety glasses + vest
5. Photo with PPE for badge
6. Escort "Sarah" from Quality Dept assigned
```

**7:50 AM** - Sarah escorts Carlos through plant
- Badge allows access to Quality Lab only
- System logs: Carlos + Sarah + Quality Lab + 7:50 AM
- If Carlos tries restricted area → Badge denied + alert

**12:30 PM** - Audit complete
- Carlos returns PPE
- Check-out
- OSHA log updated: "Visitor - Carlos - 5 hours - No incidents"

**Compliance**:
- ✅ Safety briefing: Recorded
- ✅ PPE issued: Logged
- ✅ Escort: Tracked
- ✅ Emergency contact: On file
- ✅ Retention: 365 days (OSHA requirement)

**Result**: OSHA-compliant, safety-first, full audit trail

---

## Scenario 4: Amazon-Style 3PL (Multi-Tenant)

**Company**: MegaFulfillment - 500,000 sq ft, 20 clients
**Preset**: `THREE_PL`

### Their Requirements
- 24/7 operations
- 100+ daily visitors
- Client-specific zones
- Fast gate processing
- No bottlenecks

### How They Use LogiVox

**Setup**:
```bash
PUT /api/security/settings
{ "preset": "THREE_PL" }
```

**Daily Operations**:

**2:30 AM** - Truck "ABC-123" arrives (Client: Nike)
```
Automated Gate:
1. LPR reads: ABC-123
2. System finds: Pre-registered for Nike dock
3. Gate opens automatically
4. Display: "Proceed to Dock 12 (Nike Zone)"
5. Driver badge printed at kiosk
6. No security guard needed
```

**2:35 AM** - Driver enters Nike zone
- Badge allows Nike zone only
- If tries Adidas zone → Denied + alert

**11:45 AM** - Client rep "Sarah" (Adidas) visiting
```
Walk-In Process:
1. Self-service kiosk
2. Select: "Adidas" from client list
3. Badge printed: Adidas access only
4. Enter Adidas zone
5. No escort needed (it's her client's space)
```

**3:00 PM** - 47 visitors currently on-site
- Dashboard shows:
  - Nike zone: 12 visitors
  - Adidas zone: 8 visitors
  - Unilever zone: 15 visitors
  - Common area: 12 visitors

**Scalability**:
- ✅ 24/7 automated gates (no night shift guards)
- ✅ 100+ daily visitors processed
- ✅ Client zones enforced automatically
- ✅ No bottlenecks

**Result**: Scales to high volume, client separation enforced, 24/7 automation

---

## Scenario 5: German Warehouse (EU GDPR)

**Company**: LogistikWerk GmbH - Hamburg
**Preset**: `EU_GDPR`

### Their Requirements
- GDPR strict compliance
- 30-day data retention max
- No biometric data without consent
- Right to erasure
- Explicit consent required

### How They Use LogiVox

**Setup**:
```bash
PUT /api/security/settings
{ "preset": "EU_GDPR" }
```

**Daily Operations**:

**9:00 AM** - Visitor "Hans" pre-registers
```
Pre-Registration Form:
☑️ "I consent to LogistikWerk storing my name, company, and visit details"
☑️ "I understand my data will be deleted after 30 days"
☑️ "I can request data deletion at any time"

[Submit]
```

**9:30 AM** - Hans arrives
- Badge issued (no photo - biometric data requires separate consent)
- Check-in: Name + Company + Purpose logged
- No photo capture
- No fingerprint scan

**Day 31** - Auto-deletion
- System automatically deletes Hans's data after 30 days
- GDPR compliant

**Visitor Rights**:
```bash
# Hans emails: "Delete my data per GDPR Article 17"
# Admin clicks: "Erase Hans's data"
# System immediately deletes all records
# Confirmation sent: "Your data has been erased"
```

**Compliance**:
- ✅ Explicit consent: Collected
- ✅ 30-day retention: Enforced
- ✅ Right to erasure: Honored
- ✅ No biometric data: Photo capture disabled
- ✅ GDPR Article 17: Compliant

**Result**: Full GDPR compliance, no legal risk

---

## Key Takeaway

**Same LogiVox system. Same codebase. 5 completely different workflows.**

- TechCorp: Enterprise security
- LocalParts: Simple logbook
- AutoBuild: Safety-first
- MegaFulfillment: High-volume 3PL
- LogistikWerk: GDPR compliance

**All achieved by choosing a preset** (or customizing 30+ settings).

No custom code. No separate builds. No integrations.

Just **one flexible platform that adapts to how organizations actually operate.**
