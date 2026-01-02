import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Super Admin User
  const hashedPassword = await bcrypt.hash('Admin@123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@logivox.ai' },
    update: {},
    create: {
      email: 'admin@logivox.ai',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created Super Admin:', admin.email)

  // Create Demo Organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company Ltd',
      slug: 'demo-company',
      domain: 'demo-company.com',
      logo: '/images/demo-logo.png',
      primaryColor: '#3b82f6',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      maxUsers: 50,
      maxWarehouses: 10,
      features: {
        analytics: true,
        api_access: true,
        custom_branding: true,
        priority_support: true,
      },
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      createdById: admin.id,
    },
  })

  console.log('✅ Created Demo Organization:', demoOrg.name)

  // Add Admin to Organization as Owner
  const adminMembership = await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      organizationId: demoOrg.id,
      role: 'OWNER',
      permissions: {
        manage_organization: true,
        manage_members: true,
        manage_warehouses: true,
        manage_inventory: true,
        manage_bookings: true,
        manage_suppliers: true,
        manage_customers: true,
        manage_integrations: true,
        view_analytics: true,
        export_data: true,
      },
    },
  })

  console.log('✅ Added Admin as Organization Owner')

  // Create Demo Manager User
  const managerPassword = await bcrypt.hash('Manager@123', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo-company.com' },
    update: {},
    create: {
      email: 'manager@demo-company.com',
      name: 'Demo Manager',
      password: managerPassword,
      role: 'MANAGER',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created Manager User:', manager.email)

  // Add Manager to Organization
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: manager.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: manager.id,
      organizationId: demoOrg.id,
      role: 'MANAGER',
      permissions: {
        manage_organization: false,
        manage_members: false,
        manage_warehouses: true,
        manage_inventory: true,
        manage_bookings: true,
        manage_suppliers: true,
        manage_customers: true,
        manage_integrations: false,
        view_analytics: true,
        export_data: true,
      },
    },
  })

  console.log('✅ Added Manager to Organization')

  // Create Main Warehouse
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      location: 'New York, NY',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      postalCode: '10001',
      phone: '+1-555-0100',
      email: 'warehouse@demo-company.com',
      capacity: 10000,
      isActive: true,
      organizationId: demoOrg.id,
      managerId: manager.id,
    },
  })

  console.log('✅ Created Main Warehouse:', mainWarehouse.name)

  // Create Categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      organizationId: demoOrg.id,
    },
  })

  const furniture = await prisma.category.create({
    data: {
      name: 'Furniture',
      description: 'Office and home furniture',
      organizationId: demoOrg.id,
    },
  })

  const supplies = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      description: 'Stationery and office essentials',
      organizationId: demoOrg.id,
    },
  })

  console.log('✅ Created Categories: Electronics, Furniture, Office Supplies')

  // Create Sample Inventory Items
  const laptop = await prisma.inventoryItem.create({
    data: {
      name: 'Dell Latitude Laptop',
      sku: 'LAPTOP-001',
      description: 'Dell Latitude 5420 - 14" FHD, Intel i5, 16GB RAM, 512GB SSD',
      barcode: '1234567890123',
      quantity: 50,
      reservedQuantity: 10,
      availableQuantity: 40,
      minStockLevel: 10,
      reorderPoint: 15,
      costPrice: 899.99,
      sellingPrice: 1299.99,
      unit: 'piece',
      status: 'ACTIVE',
      organizationId: demoOrg.id,
      warehouseId: mainWarehouse.id,
      categoryId: electronics.id,
    },
  })

  const desk = await prisma.inventoryItem.create({
    data: {
      name: 'Standing Desk',
      sku: 'DESK-001',
      description: 'Electric height-adjustable standing desk, 60x30 inches',
      quantity: 25,
      reservedQuantity: 5,
      availableQuantity: 20,
      minStockLevel: 5,
      reorderPoint: 10,
      costPrice: 399.99,
      sellingPrice: 599.99,
      unit: 'piece',
      status: 'ACTIVE',
      organizationId: demoOrg.id,
      warehouseId: mainWarehouse.id,
      categoryId: furniture.id,
    },
  })

  const pens = await prisma.inventoryItem.create({
    data: {
      name: 'Ballpoint Pens (Box of 50)',
      sku: 'PEN-001',
      description: 'Blue ballpoint pens, medium point',
      quantity: 200,
      reservedQuantity: 0,
      availableQuantity: 200,
      minStockLevel: 50,
      reorderPoint: 75,
      costPrice: 12.99,
      sellingPrice: 19.99,
      unit: 'box',
      status: 'ACTIVE',
      organizationId: demoOrg.id,
      warehouseId: mainWarehouse.id,
      categoryId: supplies.id,
    },
  })

  console.log('✅ Created Sample Inventory Items: Laptop, Desk, Pens')

  // Create Sample Supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Tech Supplies Inc',
      code: 'SUP-001',
      email: 'sales@techsupplies.com',
      phone: '+1-555-0200',
      website: 'https://techsupplies.com',
      address: '456 Supplier Ave',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postalCode: '94102',
      contactPerson: 'John Smith',
      paymentTerms: 'Net 30',
      isActive: true,
      organizationId: demoOrg.id,
    },
  })

  console.log('✅ Created Sample Supplier:', supplier.name)

  // Create Sample Customer
  const customer = await prisma.customer.create({
    data: {
      name: 'ABC Corporation',
      code: 'CUST-001',
      email: 'purchasing@abccorp.com',
      phone: '+1-555-0300',
      website: 'https://abccorp.com',
      address: '789 Customer Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'United States',
      postalCode: '60601',
      contactPerson: 'Jane Doe',
      paymentTerms: 'Net 60',
      isActive: true,
      organizationId: demoOrg.id,
    },
  })

  console.log('✅ Created Sample Customer:', customer.name)

  // Create Sample Booking
  const booking = await prisma.booking.create({
    data: {
      bookingNumber: 'BK-2024-001',
      status: 'CONFIRMED',
      priority: 'HIGH',
      requestedDate: new Date(),
      confirmedDate: new Date(),
      notes: 'Office equipment for new location setup',
      organizationId: demoOrg.id,
      customerId: customer.id,
      warehouseId: mainWarehouse.id,
      requestedById: manager.id,
      items: {
        create: [
          {
            inventoryItemId: laptop.id,
            quantity: 10,
            unitPrice: 1299.99,
            totalPrice: 12999.90,
            notes: 'For new employees',
          },
          {
            inventoryItemId: desk.id,
            quantity: 5,
            unitPrice: 599.99,
            totalPrice: 2999.95,
            notes: 'For office setup',
          },
        ],
      },
    },
  })

  console.log('✅ Created Sample Booking:', booking.bookingNumber)

  // Create Inventory Movements for Booking
  await prisma.inventoryMovement.create({
    data: {
      type: 'BOOKING',
      quantity: 10,
      reference: booking.bookingNumber,
      notes: 'Reserved for booking BK-2024-001',
      organizationId: demoOrg.id,
      inventoryItemId: laptop.id,
      warehouseId: mainWarehouse.id,
      userId: manager.id,
    },
  })

  await prisma.inventoryMovement.create({
    data: {
      type: 'BOOKING',
      quantity: 5,
      reference: booking.bookingNumber,
      notes: 'Reserved for booking BK-2024-001',
      organizationId: demoOrg.id,
      inventoryItemId: desk.id,
      warehouseId: mainWarehouse.id,
      userId: manager.id,
    },
  })

  console.log('✅ Created Inventory Movements')

  // Log Activity
  await prisma.activityLog.create({
    data: {
      action: 'DATABASE_SEEDED',
      entityType: 'SYSTEM',
      description: 'Database seeded with demo data',
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Script',
      organizationId: demoOrg.id,
      userId: admin.id,
    },
  })

  console.log('✅ Logged Activity')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Demo Credentials:')
  console.log('━'.repeat(50))
  console.log('Super Admin:')
  console.log('  Email: admin@logivox.ai')
  console.log('  Password: Admin@123')
  console.log('\nManager:')
  console.log('  Email: manager@demo-company.com')
  console.log('  Password: Manager@123')
  console.log('━'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
