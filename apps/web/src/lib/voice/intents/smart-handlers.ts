import { prisma } from "@/lib/prisma";

export async function handleCrateLookup(
  crateId: string,
  warehouseId?: string,
): Promise<string> {
  // Real DB Lookup
  const crate = await prisma.container.findFirst({
    where: {
      containerNumber: { contains: crateId }, // Flexible match
      status: { not: "SHIPPED" },
    },
    include: {
      loadSheet: {
        include: { bayDoor: true },
      },
      containerItems: true,
    },
  });

  if (!crate) {
    return `Crate ${crateId} not found in active inventory. Please check the label.`;
  }

  const loadSheet = crate.loadSheet;
  const bay = loadSheet?.bayDoor?.doorNumber || "Staging Area";
  const itemCount = crate.containerItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Capacity logic (assuming standard 20 unit box for now unless defined in metadata)
  const capacity = 20;
  const space = capacity - itemCount;

  if (space <= 0) {
    return `Crate ${crate.containerNumber} is full (${itemCount} items). Please close this crate and start a new one.`;
  }

  // Conversational response
  return `Crate ${crate.containerNumber} is located at Bay ${bay}. It contains ${itemCount} items, with space for ${space} more.`;
}

export async function handleExplainItem(sku: string): Promise<string> {
  const item = await prisma.inventoryItem.findFirst({
    where: {
      OR: [
        { sku: { contains: sku, mode: "insensitive" } },
        { name: { contains: sku, mode: "insensitive" } },
      ],
    },
    select: {
      description: true,
      name: true,
      category: { select: { name: true } },
    },
  });

  if (!item) return `I cannot find details for item ${sku}.`;

  // Construct description
  let desc = `It is a ${item.name}.`;
  if (item.description) desc += ` Look for: ${item.description}.`;
  if (item.category?.name)
    desc += ` It should be in the ${item.category.name} section.`;

  return desc;
}

export async function handleShortPick(
  sessionId: string,
  organizationId: string,
  quantityFound: number,
  expected: number,
): Promise<string> {
  const diff = expected - quantityFound;

  if (diff === 0) return "Count matches expected quantity.";

  // Create Exception Record in DB
  if (diff > 0) {
    await prisma.exceptionRecord.create({
      data: {
        organizationId: organizationId || "org_default",
        type: "PICKING_ERROR",
        severity: diff > 5 ? "HIGH" : "LOW",
        status: "OPEN",
        title: `Short Pick Detected: ${diff} units missing`,
        description: `User reported finding only ${quantityFound} of ${expected} items.`,
        resourceType: "VoiceSession",
        resourceId: sessionId,
        autoResolved: diff < 3, // Auto-resolve small discrepancies
      },
    });
  }

  if (diff < 3 && diff > 0) {
    return `Short pick of ${diff} units recorded and auto-authorized. Proceed to next item.`;
  } else if (diff > 0) {
    return `Discrepancy of ${diff} is too large. Supervisor notified. Please wait for authorization.`;
  } else {
    return `You found ${Math.abs(diff)} extra items. Please verify the count.`;
  }
}

export async function handlePickRequest(
  userId: string,
  quantity: number,
  sku?: string,
): Promise<string> {
  const task = await prisma.pickingTask.findFirst({
    where: {
      assignedToId: userId,
      status: "IN_PROGRESS",
    },
    include: { inventoryItem: true },
  });

  if (!task) return "No active picking task found. Please Ask for a new task.";

  if (
    sku &&
    task.inventoryItem?.sku &&
    task.inventoryItem.sku.toLowerCase() !== sku.toLowerCase()
  ) {
    return `Warning: You said ${sku}, but active task is for ${task.inventoryItem.sku}. Please verify item.`;
  }

  if (task.quantity && quantity > task.quantity) {
    return `Warning: You are picking ${quantity}, but only ${task.quantity} is required.`;
  }

  if (task.quantity === quantity) {
    return `Correct. Pick ${quantity}. Say 'Confirm' to complete task.`;
  }

  return `Acknowledged. Pick ${quantity}.`;
}

export async function handleTaskConfirmation(userId: string): Promise<string> {
  const task = await prisma.pickingTask.findFirst({
    where: { assignedToId: userId, status: "IN_PROGRESS" },
    include: { inventoryItem: true, fromLocation: true },
  });

  if (!task) return "No active task to confirm.";

  await prisma.pickingTask.update({
    where: { id: task.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      progress: 100,
    },
  });

  const nextTask = await prisma.pickingTask.findFirst({
    where: { assignedToId: userId, status: "PENDING" },
    orderBy: { priority: "desc" },
    include: { inventoryItem: true, fromLocation: true },
  });

  if (nextTask) {
    await prisma.pickingTask.update({
      where: { id: nextTask.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    const loc = nextTask.fromLocation?.name || "assigned location";
    const item = nextTask.inventoryItem?.sku || "item";
    return `Task completed. Next: Pick ${nextTask.quantity} of ${item} at ${loc}.`;
  }

  return "Task completed. No more tasks assigned.";
}

export async function handleScan(
  userId: string,
  barcode: string,
): Promise<string> {
  const task = await prisma.pickingTask.findFirst({
    where: { assignedToId: userId, status: "IN_PROGRESS" },
    include: { inventoryItem: true },
  });

  if (!task) return `Scanned ${barcode}. No active task involved.`;

  if (
    task.inventoryItem?.sku === barcode ||
    task.inventoryItem?.id === barcode
  ) {
    return "Correct item scanned. Proceed to pick.";
  }

  return `Incorrect item. Scanned ${barcode}, expected ${task.inventoryItem?.sku}.`;
}
