# Handover API Documentation

The Handover API provides a comprehensive "chain of custody" and manifest for any Load Sheet, designed to be consumed by external systems (e.g., Driver App, Customer Portal, or ERP).

## Endpoint

`GET /api/operations/handover?loadSheetId={id}`
or
`GET /api/operations/handover?loadSheetNumber={number}`

## Sample Response

This JSON response answers:
- **Who loaded it?** (`custody.startedBy`, `custody.approvedBy`)
- **Is it safe?** (`quality.status`, `quality.incidents`)
- **Where are items loaded?** (`manifest[].position`)
- **What is on it?** (`manifest[].contents`)

```json
{
  "loadSheet": {
    "id": "ls_12345",
    "number": "LS-20241022",
    "carrier": "FedEx Express",
    "vehicle": {
      "type": "53ft Dry Van",
      "length": "16.15m",
      "maxWeight": 20000
    },
    "destination": "Target DC - Chicago",
    "status": "DEPARTED",
    "metrics": {
      "totalWeight": 14500,
      "totalContainers": 42
    }
  },
  "custody": {
    "startedBy": "John Doe",
    "startedAt": "2024-10-22T08:00:00Z",
    "completedBy": "Jane Smith",
    "completedAt": "2024-10-22T10:30:00Z",
    "approvedBy": "Mike Manager (Green Light)",
    "approvedAt": "2024-10-22T10:45:00Z"
  },
  "quality": {
    "status": "SAFE",
    "activeAlerts": 0,
    "incidents": []
  },
  "manifest": [
    {
      "id": "PLt-001",
      "type": "PALLET",
      "position": "Row 1, Left",
      "weight": 450,
      "contents": "50x SKU-123 (Widgets), 20x SKU-999 (Bearings)...",
      "customFields": {
        "temp": "Ambient",
        "stackable": true
      }
    },
    {
      "id": "CRT-005",
      "type": "CRATE",
      "position": "Row 1, Right",
      "weight": 200,
      "contents": "12x SKU-555 (Monitors)",
      "customFields": {
        "fragile": true,
        "orientation": "Up"
      }
    }
  ]
}
```

## Integration Guide

1. **Trigger**: When a Load Sheet status changes to `DEPARTED` (or via button click), your external system can poll this endpoint.
2. **Custom Fields**: Any metadata stored on containers is automatically exposed in `manifest[].customFields`.
3. **Safety Check**: Always check `quality.status` before accepting handover. If `ATTENTION_REQUIRED`, review `quality.incidents`.
