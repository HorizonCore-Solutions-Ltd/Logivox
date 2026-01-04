/**
 * Container Items API
 * Manage items within containers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/containers/items - Add item to container
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      containerId,
      salesOrderId,
      inventoryItemId,
      sku,
      productName,
      quantity,
      unitOfMeasure = 'EA',
      weight,
      volume,
      pickLocation,
      organizationId,
    } = body;
    
    if (!containerId || !sku || !productName || !quantity) {
      return NextResponse.json(
        { error: 'Container ID, SKU, product name, and quantity are required' },
        { status: 400 }
      );
    }
    
    // Get container
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: { containerItems: true },
    });
    
    if (!container) {
      return NextResponse.json(
        { error: 'Container not found' },
        { status: 404 }
      );
    }
    
    // Check capacity limits
    if (container.maxWeight) {
      const currentWeight = container.containerItems.reduce((sum, item) => 
        sum + (item.weight || 0), 0
      );
      if (weight && (currentWeight + weight) > container.maxWeight) {
        return NextResponse.json(
          { error: 'Container weight limit exceeded' },
          { status: 400 }
        );
      }
    }
    
    // Add item to container
    const containerItem = await prisma.containerItem.create({
      data: {
        containerId,
        salesOrderId,
        inventoryItemId,
        sku,
        productName,
        quantity,
        unitOfMeasure,
        weight,
        volume,
        pickedBy: session.user.id,
        pickedAt: new Date(),
        pickLocation,
        organizationId: organizationId || container.organizationId,
      },
      include: {
        salesOrder: true,
        inventoryItem: true,
      },
    });
    
    // Update container weight and volume
    const newWeight = (container.weight || 0) + (weight || 0);
    const newVolume = (container.volume || 0) + (volume || 0);
    
    const updatedContainer = await prisma.container.update({
      where: { id: containerId },
      data: {
        weight: newWeight,
        volume: newVolume,
        status: container.status === 'EMPTY' ? 'IN_PROGRESS' : container.status,
      },
    });
    
    // Create event
    await prisma.containerEvent.create({
      data: {
        containerId,
        eventType: 'ITEM_ADDED',
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        eventData: {
          sku,
          productName,
          quantity,
          weight,
          volume,
        },
        organizationId: container.organizationId,
      },
    });
    
    // Update load sheet if container is assigned to one
    if (container.loadSheetId) {
      await updateLoadSheetFromContainer(container.loadSheetId, updatedContainer);
    }
    
    return NextResponse.json({
      success: true,
      containerItem,
      container: updatedContainer,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Add container item error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add item' },
      { status: 500 }
    );
  }
}

// GET /api/containers/items?containerId=xxx - Get items in container
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get('containerId');
    
    if (!containerId) {
      return NextResponse.json(
        { error: 'Container ID is required' },
        { status: 400 }
      );
    }
    
    const items = await prisma.containerItem.findMany({
      where: { containerId },
      include: {
        salesOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json({
      items,
      count: items.length,
      totalWeight: items.reduce((sum, item) => sum + (item.weight || 0), 0),
      totalVolume: items.reduce((sum, item) => sum + (item.volume || 0), 0),
    });
    
  } catch (error) {
    console.error('Get container items error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve items' },
      { status: 500 }
    );
  }
}

// DELETE /api/containers/items - Remove item from container
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    const item = await prisma.containerItem.findUnique({
      where: { id: itemId },
      include: { container: true },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Update container weight/volume
    const newWeight = Math.max(0, (item.container.weight || 0) - (item.weight || 0));
    const newVolume = Math.max(0, (item.container.volume || 0) - (item.volume || 0));
    
    await prisma.container.update({
      where: { id: item.containerId },
      data: {
        weight: newWeight,
        volume: newVolume,
      },
    });
    
    // Delete item
    await prisma.containerItem.delete({
      where: { id: itemId },
    });
    
    // Create event
    await prisma.containerEvent.create({
      data: {
        containerId: item.containerId,
        eventType: 'ITEM_REMOVED',
        userId: session.user.id,
        userName: session.user.name || 'Unknown',
        eventData: {
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
        },
        organizationId: item.organizationId,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Item removed from container',
    });
    
  } catch (error) {
    console.error('Remove container item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    );
  }
}

// Helper function to update load sheet when container changes
async function updateLoadSheetFromContainer(loadSheetId: string, container: any) {
  // Get all containers in load sheet
  const containers = await prisma.container.findMany({
    where: { loadSheetId },
    include: { containerItems: true },
  });
  
  // Calculate totals
  const totalWeight = containers.reduce((sum, c) => sum + (c.weight || 0), 0);
  const totalVolume = containers.reduce((sum, c) => sum + (c.volume || 0), 0);
  const totalItems = containers.reduce((sum, c) => sum + c.containerItems.length, 0);
  const totalOrders = new Set(
    containers.flatMap(c => c.containerItems.map(i => i.salesOrderId).filter(Boolean))
  ).size;
  
  // Update load sheet
  await prisma.loadSheet.update({
    where: { id: loadSheetId },
    data: {
      totalContainers: containers.length,
      totalWeight,
      totalVolume,
      totalItems,
      totalOrders,
      updatedAt: new Date(),
    },
  });
}
