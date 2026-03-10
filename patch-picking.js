const fs = require("fs");
const path = "apps/web/src/app/api/picking-tasks/[id]/route.ts";
let code = fs.readFileSync(path, "utf8");

// Replace imports to include audit and outbox
code = code.replace(
  'import { prisma } from "@/lib/prisma";',
  'import { prisma } from "@/lib/prisma";\nimport { logAudit } from "../../../../../../../../lib/audit-service";\nimport { publishEvent } from "../../../../../../../../lib/event-service";',
);

// We need to get the request IP and User Agent, but the helpers don't take \`request\`.
// Wait, the handles don't have \`request\` passed in. Let's modify the handles to take \`request\`.

code = code.replace(
  "return handleAssignTask(",
  "return handleAssignTask(\n            request,\n            ",
);
code = code.replace(
  "return handleStartTask(params.id, session.user.id);",
  "return handleStartTask(request, params.id, session.user.id);",
);
code = code.replace(
  "return handleCompleteTask(params.id, session.user.id, updateData);",
  "return handleCompleteTask(request, params.id, session.user.id, updateData);",
);
code = code.replace(
  "return handleCancelTask(params.id, session.user.id);",
  "return handleCancelTask(request, params.id, session.user.id);",
);

// Now update the helper signatures and bodies

const oldAssign = `async function handleAssignTask(
  taskId: string,
  assignedToId: string,
  userId: string,
) {
  const task = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      assignedToId,
      assignedAt: new Date(),
      status: "ASSIGNED",
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(task);
}`;

const newAssign = `async function handleAssignTask(
  request: Request,
  taskId: string,
  assignedToId: string,
  userId: string,
) {
  const task = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      assignedToId,
      assignedAt: new Date(),
      status: "ASSIGNED",
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await logAudit({
    eventType: "TASK_ASSIGNED",
    userId,
    resource: "PickingTask",
    resourceId: taskId,
    action: \`Task assigned to user \${assignedToId}\`,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    success: true,
    changes: { assignedToId }
  });

  return NextResponse.json(task);
}`;

code = code.replace(oldAssign, newAssign);

const oldStart = `async function handleStartTask(taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, assignedToId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!["PENDING", "ASSIGNED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Task cannot be started from current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
      assignedToId: task.assignedToId || userId,
      assignedAt: task.assignedToId ? undefined : new Date(),
    },
  });

  return NextResponse.json(updated);
}`;

const newStart = `async function handleStartTask(request: Request, taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, assignedToId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!["PENDING", "ASSIGNED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Task cannot be started from current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
      assignedToId: task.assignedToId || userId,
      assignedAt: task.assignedToId ? undefined : new Date(),
    },
  });

  await logAudit({
    eventType: "TASK_STARTED",
    userId,
    resource: "PickingTask",
    resourceId: taskId,
    action: \`Picker started taking stock for task \${taskId}\`,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    success: true
  });

  return NextResponse.json(updated);
}`;

code = code.replace(oldStart, newStart);

const oldComplete = `async function handleCompleteTask(taskId: string, userId: string, data: any) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, startedAt: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Task must be in progress to complete" },
      { status: 400 },
    );
  }

  const completedAt = new Date();
  const duration = task.startedAt
    ? Math.floor((completedAt.getTime() - task.startedAt.getTime()) / 1000)
    : null;

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt,
      completedById: userId,
      duration,
      progress: 100,
      completionNotes: data.completionNotes,
    },
    include: {
      completedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}`;

const newComplete = `async function handleCompleteTask(request: Request, taskId: string, userId: string, data: any) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true, startedAt: true, warehouseId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Task must be in progress to complete" },
      { status: 400 },
    );
  }

  const completedAt = new Date();
  const duration = task.startedAt
    ? Math.floor((completedAt.getTime() - task.startedAt.getTime()) / 1000)
    : null;

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt,
      completedById: userId,
      duration,
      progress: 100,
      completionNotes: data.completionNotes,
    },
    include: {
      completedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await logAudit({
    eventType: "TASK_COMPLETED",
    userId,
    resource: "PickingTask",
    resourceId: taskId,
    action: \`Picker successfully handed off stock for task \${taskId}\`,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    success: true
  });

  // Outbox pattern for syncing down to central inventory/webhook dead-letter queue
  await publishEvent({
    eventType: "picking_task.completed",
    payload: { taskId, completedById: userId, warehouseId: task.warehouseId, duration },
    aggregateId: taskId,
    aggregateType: "PickingTask"
  });

  return NextResponse.json(updated);
}`;

code = code.replace(oldComplete, newComplete);

const oldCancel = `async function handleCancelTask(taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (["COMPLETED", "CANCELLED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Cannot cancel task in current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED",
    },
  });

  return NextResponse.json(updated);
}`;

const newCancel = `async function handleCancelTask(request: Request, taskId: string, userId: string) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: taskId },
    select: { status: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (["COMPLETED", "CANCELLED"].includes(task.status)) {
    return NextResponse.json(
      { error: "Cannot cancel task in current status" },
      { status: 400 },
    );
  }

  const updated = await prisma.pickingTask.update({
    where: { id: taskId },
    data: {
      status: "CANCELLED",
    },
  });
  
  await logAudit({
    eventType: "TASK_CANCELLED",
    userId,
    resource: "PickingTask",
    resourceId: taskId,
    action: \`Picker flow cancelled for task \${taskId}\`,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    success: true
  });

  return NextResponse.json(updated);
}`;

code = code.replace(oldCancel, newCancel);

fs.writeFileSync(path, code);
console.log("Done pitching picking tasks");
