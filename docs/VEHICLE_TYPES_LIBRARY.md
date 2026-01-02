# 📦 Vehicle Types Library for Load Optimization

## Overview

**Purpose**: Simple vehicle dimensions and capacity library for load optimization  
**Scope**: ONLY dimensions, weight, and capacity - NO fleet management  
**Coverage**: Global vehicle types (UK, EU, US, Asia)  

---

## What This Is

A lightweight library of vehicle dimensions used by `LoadOptimizationService` to:
1. Determine which vehicle size fits a set of orders
2. Calculate optimal load utilization
3. Recommend cost-effective vehicle choices

**This is NOT:**
- ❌ Fleet management system
- ❌ Vehicle tracking
- ❌ Insurance/compliance tracking
- ❌ Driver assignment
- ❌ GPS tracking
- ❌ Maintenance scheduling

**This IS:**
- ✅ Vehicle dimension library
- ✅ Load capacity reference
- ✅ Simple recommendation engine
- ✅ Global vehicle types (UK, EU, US, Asia)

---

## Vehicle Types Included

### UK Vehicles
```typescript
UK_ARTIC_53         - 53ft Articulated Lorry (3,800 cu ft, 26 pallets)
UK_RIGID_7.5T       - 7.5 Tonne Box Truck (1,400 cu ft, 9 pallets)
UK_LUTON_VAN        - Luton Van 3.5T (1,100 cu ft, 6 pallets)
UK_TRANSIT_LWB      - Ford Transit LWB (487 cu ft, 4 pallets)
UK_SPRINTER_LWB     - Mercedes Sprinter LWB (533 cu ft, 4 pallets)
```

### US Vehicles
```typescript
US_53FT_TRAILER     - 53ft Dry Van Trailer (3,900 cu ft, 26 pallets)
US_26FT_BOX         - 26ft Box Truck (1,700 cu ft, 12 pallets)
US_16FT_BOX         - 16ft Box Truck (800 cu ft, 6 pallets)
US_CARGO_VAN        - Cargo Van (350 cu ft, 2 pallets)
```

### EU Vehicles
```typescript
EU_13.6M_TRAILER    - 13.6m Mega Trailer (3,400 cu ft, 33 pallets)
EU_7.5T_TRUCK       - 7.5 Tonne Truck (1,400 cu ft, 9 pallets)
EU_3.5T_VAN         - 3.5 Tonne Panel Van (520 cu ft, 4 pallets)
```

### Asia Vehicles
```typescript
ASIA_20FT_CONTAINER - 20ft Container (1,165 cu ft, 10 pallets)
ASIA_40FT_CONTAINER - 40ft Container (2,350 cu ft, 20 pallets)
ASIA_LIGHT_TRUCK    - Light Truck 3T (480 cu ft, 4 pallets)
```

### Refrigerated
```typescript
REEFER_TRAILER_53   - 53ft Refrigerated Trailer (3,500 cu ft, 24 pallets)
REEFER_VAN          - Refrigerated Van (400 cu ft, 3 pallets)
```

---

## Usage

### 1. Get Vehicle Recommendation

```typescript
import { recommendVehicle } from '@/lib/vehicle-types';

// After calculating total order volume and weight
const vehicle = recommendVehicle({
  totalVolumeCubicFeet: 1200,
  totalWeightLbs: 8000,
  palletCount: 8,
  region: 'UK',
  prioritize: 'utilization', // or 'cost' or 'capacity'
});

console.log(vehicle);
// {
//   id: 'UK_RIGID_7.5T',
//   name: '7.5 Tonne Box Truck (UK)',
//   dimensions: { lengthInches: 240, widthInches: 96, heightInches: 96 },
//   volumeCubicFeet: 1400,
//   maxWeightLbs: 16535,
//   palletCapacity: 9
// }
```

### 2. Find All Suitable Vehicles

```typescript
import { findSuitableVehicles } from '@/lib/vehicle-types';

const suitable = findSuitableVehicles({
  totalVolumeCubicFeet: 800,
  totalWeightLbs: 5000,
  region: 'US',
});

// Returns array of vehicles sorted by size (smallest first)
```

### 3. Get Vehicles by Region

```typescript
import { getVehicleTypesByRegion } from '@/lib/vehicle-types';

const ukVehicles = getVehicleTypesByRegion('UK');
const usVehicles = getVehicleTypesByRegion('US');
const euVehicles = getVehicleTypesByRegion('EU');
```

### 4. Add Custom Vehicle Type

```typescript
import { addCustomVehicleType } from '@/lib/vehicle-types';

addCustomVehicleType({
  id: 'CUSTOM_MEGA_60',
  name: '60ft Mega Trailer',
  region: 'UK',
  category: 'TRAILER',
  dimensions: {
    lengthInches: 720,
    widthInches: 102,
    heightInches: 162,
    usableLengthInches: 710,
    usableWidthInches: 98,
    usableHeightInches: 158,
  },
  maxWeightLbs: 80000,
  volumeCubicFeet: 6500,
  palletCapacity: 44,
  estimatedCostPerMile: 2.50,
});
```

---

## API Endpoints

### GET /api/vehicle-types

Get all vehicle types (optionally filter by region)

**Request:**
```http
GET /api/vehicle-types?region=UK
```

**Response:**
```json
{
  "success": true,
  "vehicleTypes": [...],
  "total": 5
}
```

---

### POST /api/vehicle-types/recommend

Get vehicle recommendation for a load

**Request:**
```json
{
  "totalVolumeCubicFeet": 1200,
  "totalWeightLbs": 8000,
  "palletCount": 8,
  "region": "UK",
  "prioritize": "utilization"
}
```

**Response:**
```json
{
  "success": true,
  "recommended": {
    "id": "UK_RIGID_7.5T",
    "name": "7.5 Tonne Box Truck (UK)",
    "volumeCubicFeet": 1400,
    "maxWeightLbs": 16535,
    "utilization": {
      "volumePercent": 85.7,
      "weightPercent": 48.4,
      "isOptimal": true
    }
  },
  "alternatives": [...],
  "totalSuitable": 3
}
```

---

### PUT /api/vehicle-types/custom

Add custom vehicle type

**Request:**
```json
{
  "id": "CUSTOM_MEGA_60",
  "name": "60ft Mega Trailer",
  "region": "UK",
  "category": "TRAILER",
  "dimensions": {
    "lengthInches": 720,
    "widthInches": 102,
    "heightInches": 162
  },
  "maxWeightLbs": 80000,
  "volumeCubicFeet": 6500,
  "palletCapacity": 44
}
```

**Response:**
```json
{
  "success": true,
  "message": "Custom vehicle type added",
  "vehicleType": {...}
}
```

---

## Integration with LoadOptimizationService

```typescript
import { LoadOptimizationService } from '@/lib/services/load-optimization-service';
import { recommendVehicle } from '@/lib/vehicle-types';

// 1. Calculate total dimensions and weight from orders
const totalVolume = orders.reduce((sum, o) => sum + o.volumeCubicFeet, 0);
const totalWeight = orders.reduce((sum, o) => sum + o.weightLbs, 0);
const palletCount = orders.reduce((sum, o) => sum + o.palletCount, 0);

// 2. Get vehicle recommendation
const vehicle = recommendVehicle({
  totalVolumeCubicFeet: totalVolume,
  totalWeightLbs: totalWeight,
  palletCount,
  region: warehouse.region,
  prioritize: 'utilization',
});

// 3. Use vehicle dimensions for 3D bin packing
const loadPlan = await loadOptimizationService.optimizeLoad({
  orders,
  containerDimensions: {
    length: vehicle.dimensions.usableLengthInches,
    width: vehicle.dimensions.usableWidthInches,
    height: vehicle.dimensions.usableHeightInches,
  },
  maxWeight: vehicle.maxWeightLbs,
});

// 4. Show recommendation to user
console.log(`Recommended: ${vehicle.name}`);
console.log(`Utilization: ${loadPlan.utilizationPercent}%`);
```

---

## Voice Commands

```
"Recommend vehicle for order 123"
"What vehicle fits 1000 cubic feet"
"Show UK vehicle types"
"Add custom vehicle mega trailer"
```

---

## Data Structure

```typescript
interface VehicleType {
  id: string;
  name: string;
  region: 'UK' | 'EU' | 'US' | 'ASIA' | 'GLOBAL';
  category: 'VAN' | 'TRUCK' | 'TRAILER' | 'CONTAINER';
  
  dimensions: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    usableLengthInches?: number;
    usableWidthInches?: number;
    usableHeightInches?: number;
  };
  
  maxWeightLbs: number;
  volumeCubicFeet: number;
  palletCapacity: number;
  
  features?: {
    hasLiftGate?: boolean;
    hasSideLoading?: boolean;
    hasTemperatureControl?: boolean;
    tempRangeMin?: number;
    tempRangeMax?: number;
  };
  
  estimatedCostPerMile?: number;
}
```

---

## Adding New Vehicle Types

Simply add to the `VEHICLE_TYPES` object in `lib/vehicle-types.ts`:

```typescript
export const VEHICLE_TYPES: Record<string, VehicleType> = {
  // ... existing types
  
  'YOUR_CUSTOM_TYPE': {
    id: 'YOUR_CUSTOM_TYPE',
    name: 'Your Vehicle Name',
    region: 'UK',
    category: 'TRUCK',
    dimensions: {
      lengthInches: 300,
      widthInches: 96,
      heightInches: 96,
    },
    maxWeightLbs: 20000,
    volumeCubicFeet: 1600,
    palletCapacity: 10,
  },
};
```

---

## Summary

**Simple, focused, purpose-built** for load optimization:

✅ 16+ pre-configured global vehicle types  
✅ Add unlimited custom types  
✅ Simple recommendation engine  
✅ Integration with LoadOptimizationService  
✅ No complex database models  
✅ No fleet management overhead  
✅ Voice command support  

**Total files:** 2 (vehicle-types.ts + API route)  
**Database tables:** 0 (just code)  
**Complexity:** Low  
**Purpose:** Load optimization ONLY  

---

**Files:**
- `/workspaces/Flowstock/lib/vehicle-types.ts` - Vehicle library
- `/workspaces/Flowstock/app/api/vehicle-types/route.ts` - API endpoints
