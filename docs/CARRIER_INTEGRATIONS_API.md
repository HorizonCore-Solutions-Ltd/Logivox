# 📡 CARRIER INTEGRATIONS API
## LogiVox WMS - Shipping Carrier Integration

### Overview

LogiVox provides seamless integration with major shipping carriers for rate shopping, label generation, and real-time tracking. The carrier API provides a unified interface across FedEx, UPS, USPS, and DHL.

---

## 🚀 Supported Carriers

| Carrier | Rate Shopping | Label Generation | Tracking | Status |
|---------|---------------|------------------|----------|--------|
| **FedEx** | ✅ | ✅ | ✅ | Production Ready |
| **UPS** | ✅ | ⚠️ Framework | ✅ | Rates & Tracking Only |
| **USPS** | ✅ | ⚠️ Framework | ✅ | Rates & Tracking Only |
| **DHL** | 🔜 | 🔜 | 🔜 | Coming Soon |

---

## 📋 API Endpoints

### 1. Get Shipping Rates

**`POST /api/carriers/rates`**

Compare shipping rates across all carriers for a shipment.

#### Request Body

```json
{
  "origin": {
    "name": "ABC Warehouse",
    "street1": "123 Industrial Pkwy",
    "street2": "Building A",
    "city": "Memphis",
    "state": "TN",
    "postalCode": "38103",
    "country": "US",
    "phone": "901-555-0100"
  },
  "destination": {
    "name": "John Smith",
    "company": "Acme Corp",
    "street1": "456 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "phone": "212-555-0200",
    "email": "john@acme.com"
  },
  "packages": [
    {
      "weight": 10.5,
      "length": 12,
      "width": 8,
      "height": 6,
      "insuranceValue": 500
    }
  ]
}
```

#### Response

```json
{
  "origin": { ... },
  "destination": { ... },
  "packages": [ ... ],
  "rates": [
    {
      "carrier": "FedEx",
      "service": "FEDEX_GROUND",
      "rate": 12.45,
      "currency": "USD",
      "deliveryDays": 3,
      "deliveryDate": "2026-01-06T00:00:00Z"
    },
    {
      "carrier": "FedEx",
      "service": "FEDEX_2_DAY",
      "rate": 24.95,
      "currency": "USD",
      "deliveryDays": 2,
      "deliveryDate": "2026-01-05T00:00:00Z"
    },
    {
      "carrier": "UPS",
      "service": "03",
      "rate": 11.89,
      "currency": "USD",
      "deliveryDays": 3
    },
    {
      "carrier": "USPS",
      "service": "Priority Mail",
      "rate": 9.95,
      "currency": "USD"
    }
  ],
  "timestamp": "2026-01-03T10:30:00Z"
}
```

#### Rate Sorting

Rates are automatically sorted by price (lowest to highest). To choose the fastest service instead, sort by `deliveryDays` on the client side.

#### Error Responses

```json
{
  "error": "Failed to get shipping rates",
  "message": "Origin postalCode is required"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing required fields)
- `401` - Unauthorized (no valid session)
- `500` - Server error (carrier API failure)

---

### 2. Create Shipment Label

**`POST /api/carriers/shipments`**

Generate a shipping label with the selected carrier and service.

#### Request Body

```json
{
  "carrier": "FedEx",
  "service": "FEDEX_GROUND",
  "origin": {
    "name": "ABC Warehouse",
    "street1": "123 Industrial Pkwy",
    "city": "Memphis",
    "state": "TN",
    "postalCode": "38103",
    "country": "US",
    "phone": "901-555-0100"
  },
  "destination": {
    "name": "John Smith",
    "company": "Acme Corp",
    "street1": "456 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "phone": "212-555-0200",
    "email": "john@acme.com"
  },
  "packages": [
    {
      "weight": 10.5,
      "length": 12,
      "width": 8,
      "height": 6,
      "insuranceValue": 500
    }
  ],
  "shipmentId": "ship_abc123"
}
```

#### Parameters

- **carrier** (required): Carrier code (`FedEx`, `UPS`, `USPS`)
- **service** (required): Service code (varies by carrier)
- **origin** (required): Shipping origin address
- **destination** (required): Shipping destination address
- **packages** (required): Array of package dimensions
- **shipmentId** (optional): Existing shipment ID to update

#### Response

```json
{
  "success": true,
  "label": {
    "trackingNumber": "794602467326",
    "labelUrl": "https://api.fedex.com/labels/794602467326.pdf",
    "labelFormat": "PDF",
    "carrier": "FedEx",
    "service": "FEDEX_GROUND",
    "cost": 12.45
  },
  "shipmentId": "ship_abc123"
}
```

#### Label Formats

- **PDF**: Standard 4x6 shipping label (default)
- **PNG**: Image format for thermal printers
- **ZPL**: Zebra Programming Language for Zebra printers

#### Linking to Shipment Record

If `shipmentId` is provided, the API will automatically:
1. Update the shipment with tracking number
2. Set carrier and service
3. Record shipping cost
4. Update status to `SHIPPED`
5. Set `shippedAt` timestamp
6. Create activity log entry

---

### 3. Track Shipment

**`GET /api/carriers/track/:trackingNumber?carrier=FedEx`**

Get real-time tracking information for a shipment.

#### Parameters

- **trackingNumber** (path, required): Tracking number
- **carrier** (query, required): Carrier name (`FedEx`, `UPS`, `USPS`)

#### Example Request

```
GET /api/carriers/track/794602467326?carrier=FedEx
```

#### Response

```json
{
  "trackingNumber": "794602467326",
  "carrier": "FedEx",
  "trackingInfo": {
    "trackingNumber": "794602467326",
    "carrier": "FedEx",
    "status": "in_transit",
    "estimatedDelivery": "2026-01-06T17:00:00Z",
    "actualDelivery": null,
    "events": [
      {
        "timestamp": "2026-01-03T08:30:00Z",
        "status": "Picked up",
        "location": "Memphis, TN",
        "description": "Package picked up at origin"
      },
      {
        "timestamp": "2026-01-03T14:45:00Z",
        "status": "In transit",
        "location": "Indianapolis, IN",
        "description": "Departed FedEx facility"
      },
      {
        "timestamp": "2026-01-04T06:15:00Z",
        "status": "In transit",
        "location": "Newark, NJ",
        "description": "Arrived at FedEx facility"
      }
    ]
  },
  "shipmentId": "ship_abc123"
}
```

#### Status Values

| Status | Description |
|--------|-------------|
| `pre_transit` | Label created, package not yet picked up |
| `in_transit` | Package is moving through carrier network |
| `out_for_delivery` | Package is on delivery vehicle |
| `delivered` | Package successfully delivered |
| `exception` | Delivery exception (e.g., address issue) |
| `returned` | Package returned to sender |

#### Automatic Updates

When tracking is queried, the API automatically:
1. Updates the local shipment record with current status
2. Creates tracking event records in database
3. Updates estimated/actual delivery dates
4. Triggers notifications if status changes

---

## 🔐 Authentication

All carrier API endpoints require authentication via NextAuth.js session.

**Headers:**
```
Cookie: next-auth.session-token=<session-token>
```

**403 Forbidden Example:**
```json
{
  "error": "Unauthorized"
}
```

---

## 🌍 International Shipping

### Address Requirements

**Domestic US:**
- Street address
- City, State, ZIP code
- Phone number (optional)

**International:**
- All domestic fields
- Country code (ISO 2-letter, e.g., `CA`, `GB`, `MX`)
- Customs information (for cross-border shipments)

### Customs Information

For international shipments, additional customs data is required:

```json
{
  "customsInfo": {
    "contents": "merchandise",
    "contentsExplanation": "Electronics parts",
    "customsValue": 500.00,
    "currency": "USD",
    "items": [
      {
        "description": "Circuit boards",
        "quantity": 10,
        "value": 50.00,
        "weight": 1.0,
        "hsCode": "8534.00.0000",
        "originCountry": "US"
      }
    ]
  }
}
```

---

## 📦 Package Specifications

### Weight Limits

| Carrier | Max Weight | Unit |
|---------|------------|------|
| FedEx Ground | 150 lbs | LBS |
| FedEx Express | 150 lbs | LBS |
| UPS Ground | 150 lbs | LBS |
| USPS Priority | 70 lbs | LBS |

### Dimension Limits

**Maximum Size:**
- FedEx/UPS: Length + (2 × Width) + (2 × Height) ≤ 165 inches
- USPS: Length + Girth ≤ 130 inches

**Units:**
- Weight: Pounds (LBS)
- Dimensions: Inches (IN)

---

## 💰 Service Codes

### FedEx Service Codes

| Code | Name | Transit Time |
|------|------|--------------|
| `FEDEX_GROUND` | FedEx Ground | 1-5 days |
| `FEDEX_2_DAY` | FedEx 2Day | 2 days |
| `STANDARD_OVERNIGHT` | Standard Overnight | Next day |
| `PRIORITY_OVERNIGHT` | Priority Overnight | Next day AM |
| `FIRST_OVERNIGHT` | First Overnight | Next day 8:00 AM |
| `FEDEX_EXPRESS_SAVER` | Express Saver | 3 days |
| `INTERNATIONAL_ECONOMY` | International Economy | 4-7 days |
| `INTERNATIONAL_PRIORITY` | International Priority | 1-3 days |

### UPS Service Codes

| Code | Name | Transit Time |
|------|------|--------------|
| `03` | UPS Ground | 1-5 days |
| `02` | UPS 2nd Day Air | 2 days |
| `01` | UPS Next Day Air | Next day |
| `13` | Next Day Air Saver | Next day PM |
| `14` | UPS Next Day Air Early | Next day 8:00 AM |
| `12` | UPS 3 Day Select | 3 days |
| `11` | UPS Standard (Canada) | 1-5 days |
| `08` | UPS Worldwide Expedited | 2-5 days |

### USPS Service Codes

| Code | Name | Transit Time |
|------|------|--------------|
| `Priority Mail` | USPS Priority Mail | 1-3 days |
| `Priority Mail Express` | Priority Mail Express | Overnight |
| `First-Class Mail` | First-Class Mail | 1-5 days |
| `Parcel Select` | Parcel Select Ground | 2-8 days |
| `Media Mail` | Media Mail | 2-8 days |

---

## 🧪 Testing

### Sandbox Environment

All carriers support sandbox/test environments for development:

**Environment Variables:**
```env
FEDEX_ENV=sandbox
UPS_ENV=sandbox
USPS_ENV=sandbox
```

### Test Addresses

**FedEx Test Address:**
```json
{
  "name": "Test Recipient",
  "street1": "1550 LIBERTY RIDGE DR STE 100",
  "city": "WAYNE",
  "state": "PA",
  "postalCode": "19087",
  "country": "US"
}
```

**UPS Test Address:**
```json
{
  "name": "Test Recipient",
  "street1": "1 UPS Way",
  "city": "Chino",
  "state": "CA",
  "postalCode": "91710",
  "country": "US"
}
```

### Test Tracking Numbers

**FedEx:** `794602467326`  
**UPS:** `1Z999AA10123456784`  
**USPS:** `9400111899562537883748`

---

## 🚨 Error Handling

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `INVALID_ADDRESS` | Address validation failed | Verify address fields |
| `OVERWEIGHT` | Package exceeds carrier limits | Split into multiple packages |
| `INVALID_ZIP` | ZIP code format invalid | Check postal code format |
| `NO_RATES_AVAILABLE` | No services available | Check origin/destination |
| `AUTHENTICATION_FAILED` | Carrier credentials invalid | Verify API keys |
| `INSUFFICIENT_FUNDS` | Carrier account has no credit | Add funds to carrier account |

### Retry Logic

The API implements automatic retry for transient carrier errors:
- **Network timeouts**: 3 retries with exponential backoff
- **Rate limits**: Automatic retry after delay
- **Temporary carrier outages**: 5 retries over 15 minutes

### Error Response Format

```json
{
  "error": "Failed to create shipment",
  "message": "INVALID_ADDRESS: Destination address cannot be validated",
  "code": "INVALID_ADDRESS",
  "details": {
    "field": "destination.street1",
    "suggestion": "123 MAIN ST"
  }
}
```

---

## 📊 Rate Shopping Best Practices

### 1. Cache Rates

Carrier rates can be cached for 15-30 minutes to reduce API calls:

```typescript
const cacheKey = `rates_${originZip}_${destZip}_${weight}`;
const cachedRates = cache.get(cacheKey);
if (cachedRates) return cachedRates;

const rates = await carrierService.getAllRates(...);
cache.set(cacheKey, rates, 900); // 15 minutes
```

### 2. Parallel vs Sequential

The API calls all carriers in parallel for fastest response:

```typescript
const rates = await Promise.allSettled([
  fedex.getRates(...),
  ups.getRates(...),
  usps.getRates(...)
]);
```

### 3. Fallback Strategy

If a carrier fails, show available rates from successful carriers:

```typescript
const rates = results
  .filter(r => r.status === 'fulfilled')
  .flatMap(r => r.value);
```

---

## 🔗 Webhooks

Carriers can send webhook notifications for tracking updates:

**FedEx Webhooks:**
```json
{
  "trackingNumber": "794602467326",
  "event": "DELIVERED",
  "timestamp": "2026-01-06T15:30:00Z",
  "location": "New York, NY"
}
```

**Configuration:**
Set up webhooks in carrier portals:
- FedEx: https://developer.fedex.com/webhooks
- UPS: https://developer.ups.com/webhooks
- USPS: Not currently supported

---

## 📈 Usage Limits

### API Rate Limits

| Carrier | Requests/Minute | Daily Limit |
|---------|-----------------|-------------|
| FedEx | 100 | 10,000 |
| UPS | 250 | 25,000 |
| USPS | 60 | 5,000 |

### Cost Per Request

Carrier APIs are typically free for label generation (charges apply to shipping only). Rate shopping APIs may have limits based on account type.

---

## 🛠️ Setup Guide

### 1. Get Carrier Credentials

**FedEx:**
1. Register at https://developer.fedex.com
2. Create production application
3. Note API Key, API Secret, Account Number, Meter Number

**UPS:**
1. Register at https://developer.ups.com
2. Create OAuth 2.0 credentials
3. Note Client ID, Client Secret, Account Number

**USPS:**
1. Register at https://www.usps.com/business/web-tools-apis/
2. Request Web Tools account
3. Note User ID and Password

### 2. Configure Environment

Add credentials to `.env.local`:

```env
# FedEx
FEDEX_API_KEY=your-api-key
FEDEX_API_SECRET=your-api-secret
FEDEX_ACCOUNT_NUMBER=123456789
FEDEX_METER_NUMBER=987654321
FEDEX_ENV=production

# UPS
UPS_CLIENT_ID=your-client-id
UPS_CLIENT_SECRET=your-client-secret
UPS_ACCOUNT_NUMBER=ABC123
UPS_ENV=production

# USPS
USPS_USER_ID=123ABCDE4567
USPS_PASSWORD=your-password
USPS_ENV=production
```

### 3. Test Connection

```bash
curl -X POST http://localhost:3000/api/carriers/rates \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"street1": "123 Test St", "city": "Memphis", "state": "TN", "postalCode": "38103", "country": "US"},
    "destination": {"street1": "456 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "US"},
    "packages": [{"weight": 10, "length": 12, "width": 8, "height": 6}]
  }'
```

---

## 📞 Support

**Carrier API Issues:**
- FedEx: https://developer.fedex.com/support
- UPS: https://developer.ups.com/support
- USPS: https://www.usps.com/business/web-tools-apis/

**LogiVox Integration:**
- Email: support@logivox.com
- Documentation: https://docs.logivox.com
- Slack: #carrier-integrations

---

**Last Updated:** January 3, 2026  
**API Version:** 1.0  
**Status:** Production Ready (FedEx), Framework Ready (UPS/USPS)
