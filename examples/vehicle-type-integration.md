/\*\*

- Example: Vehicle Type Integration with Load Optimization
-
- Shows how the vehicle-types library integrates with LoadOptimizationService
- to recommend appropriate vehicle sizes for orders.
  \*/

import { LoadOptimizationService } from "@/lib/services/load-optimization-service";
import { recommendVehicle, type VehicleType } from "@/lib/vehicle-types";

// ============================================================================
// EXAMPLE 1: Basic Vehicle Recommendation for Orders
// ============================================================================

export async function getVehicleForOrders(orderIds: string[]) {
// 1. Fetch orders
const orders = await prisma.order.findMany({
where: { id: { in: orderIds } },
include: { items: true },
});

// 2. Calculate total dimensions
const totalVolume = orders.reduce((sum, order) => {
return (
sum +
order.items.reduce((itemSum, item) => {
return (
itemSum +
(item.lengthInches _ item.widthInches _ item.heightInches) / 1728
); // Convert to cu ft
}, 0)
);
}, 0);

const totalWeight = orders.reduce((sum, order) => {
return (
sum +
order.items.reduce((itemSum, item) => {
return itemSum + item.weightLbs \* item.quantity;
}, 0)
);
}, 0);

const palletCount = orders.reduce(
(sum, order) => sum + (order.palletCount || 0),
0,
);

// 3. Get vehicle recommendation
const vehicle = recommendVehicle({
totalVolumeCubicFeet: totalVolume,
totalWeightLbs: totalWeight,
palletCount,
region: "UK", // or from warehouse.region
prioritize: "utilization",
});

if (!vehicle) {
throw new Error("No suitable vehicle found for these orders");
}

return {
vehicle,
loadMetrics: {
totalVolume,
totalWeight,
palletCount,
volumeUtilization: (totalVolume / vehicle.volumeCubicFeet) _ 100,
weightUtilization: (totalWeight / vehicle.maxWeightLbs) _ 100,
},
};
}

// ============================================================================
// EXAMPLE 2: Complete Load Planning with Vehicle Selection
// ============================================================================

export async function planLoadWithVehicle(params: {
orderIds: string[];
warehouseId: string;
}) {
const loadOptimizationService = new LoadOptimizationService();

// 1. Get orders
const orders = await prisma.order.findMany({
where: {
id: { in: params.orderIds },
warehouseId: params.warehouseId,
},
include: { items: true },
});

// 2. Calculate totals
const totals = calculateOrderTotals(orders);

// 3. Get warehouse region
const warehouse = await prisma.warehouse.findUnique({
where: { id: params.warehouseId },
});

// 4. Recommend vehicle
const vehicle = recommendVehicle({
totalVolumeCubicFeet: totals.volume,
totalWeightLbs: totals.weight,
palletCount: totals.pallets,
requiresTemperatureControl: orders.some((o) => o.requiresRefrigeration),
region: (warehouse?.region as VehicleType["region"]) || "UK",
prioritize: "utilization",
});

if (!vehicle) {
return {
success: false,
error: "No suitable vehicle found",
};
}

// 5. Run 3D bin packing with vehicle dimensions
const loadPlan = await loadOptimizationService.optimizeLoad({
warehouseId: params.warehouseId,
orderIds: params.orderIds,
vehicleDimensions: {
length:
vehicle.dimensions.usableLengthInches ||
vehicle.dimensions.lengthInches,
width:
vehicle.dimensions.usableWidthInches || vehicle.dimensions.widthInches,
height:
vehicle.dimensions.usableHeightInches ||
vehicle.dimensions.heightInches,
},
maxWeight: vehicle.maxWeightLbs,
});

return {
success: true,
vehicle: {
id: vehicle.id,
name: vehicle.name,
dimensions: vehicle.dimensions,
capacity: {
volume: vehicle.volumeCubicFeet,
weight: vehicle.maxWeightLbs,
pallets: vehicle.palletCapacity,
},
},
loadPlan: {
items: loadPlan.items,
utilization: {
volume: loadPlan.utilizationPercent,
weight: (totals.weight / vehicle.maxWeightLbs) _ 100,
},
totalItems: loadPlan.totalItems,
totalOrders: orders.length,
},
recommendation: {
isOptimal:
loadPlan.utilizationPercent >= 75 && loadPlan.utilizationPercent <= 95,
estimatedCost: vehicle.estimatedCostPerMile
? vehicle.estimatedCostPerMile _ loadPlan.estimatedDistance
: undefined,
},
};
}

// ============================================================================
// EXAMPLE 3: API Endpoint for Order Vehicle Recommendation
// ============================================================================

export async function POST_recommend_vehicle(req: NextRequest) {
try {
const body = await req.json();
const { orderIds, warehouseId } = body;

    const result = await planLoadWithVehicle({
      orderIds,
      warehouseId,
    });

    return NextResponse.json(result);

} catch (error) {
console.error("Vehicle recommendation error:", error);
return NextResponse.json(
{ error: "Failed to recommend vehicle" },
{ status: 500 },
);
}
}

// ============================================================================
// EXAMPLE 4: Voice Command Integration
// ============================================================================

export const vehicleVoiceCommands = {
// "Recommend vehicle for order 123"
"recommend vehicle for order \*orderNumber": async (orderNumber: string) => {
const result = await getVehicleForOrders([orderNumber]);

    return {
      speak: `Recommended ${result.vehicle.name}. ${Math.round(result.loadMetrics.volumeUtilization)}% utilization.`,
      action: "SHOW_VEHICLE_RECOMMENDATION",
      data: result,
    };

},

// "What vehicle fits 1000 cubic feet"
"what vehicle fits _volume cubic feet": async (volume: string) => {
const volumeNumber = parseFloat(volume);
const vehicle = recommendVehicle({
totalVolumeCubicFeet: volumeNumber,
totalWeightLbs: volumeNumber _ 10, // Estimate
region: "UK",
});

    if (!vehicle) {
      return {
        speak: `No vehicle found for ${volume} cubic feet.`,
        action: "SHOW_ERROR",
      };
    }

    return {
      speak: `${vehicle.name} can fit ${volume} cubic feet. Total capacity ${vehicle.volumeCubicFeet} cubic feet.`,
      action: "SHOW_VEHICLE_INFO",
      data: vehicle,
    };

},
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateOrderTotals(orders: any[]) {
return {
volume: orders.reduce((sum, order) => {
return (
sum +
order.items.reduce((itemSum: number, item: any) => {
const volumeCuFt =
(item.lengthInches _ item.widthInches _ item.heightInches) / 1728;
return itemSum + volumeCuFt \* item.quantity;
}, 0)
);
}, 0),

    weight: orders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce((itemSum: number, item: any) => {
          return itemSum + item.weightLbs * item.quantity;
        }, 0)
      );
    }, 0),

    pallets: orders.reduce((sum, order) => sum + (order.palletCount || 0), 0),

};
}

// ============================================================================
// USAGE IN ADMIN UI
// ============================================================================

export function VehicleRecommendationButton({
orderIds,
}: {
orderIds: string[];
}) {
const [recommendation, setRecommendation] = useState(null);
const [loading, setLoading] = useState(false);

const getRecommendation = async () => {
setLoading(true);
try {
const response = await fetch("/api/orders/recommend-vehicle", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ orderIds }),
});
const data = await response.json();
setRecommendation(data);
} finally {
setLoading(false);
}
};

return (

<div>
<button onClick={getRecommendation} disabled={loading}>
{loading ? "Calculating..." : "Recommend Vehicle"}
</button>

      {recommendation && (
        <div className="vehicle-recommendation">
          <h3>{recommendation.vehicle.name}</h3>
          <p>
            Volume utilization: {recommendation.loadPlan.utilization.volume}%
          </p>
          <p>
            Weight utilization: {recommendation.loadPlan.utilization.weight}%
          </p>
          <p>Total items: {recommendation.loadPlan.totalItems}</p>

          {recommendation.recommendation.isOptimal ? (
            <span className="badge-success">Optimal load</span>
          ) : (
            <span className="badge-warning">
              Consider larger/smaller vehicle
            </span>
          )}
        </div>
      )}
    </div>

);
}
