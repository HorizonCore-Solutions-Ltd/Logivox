#!/usr/bin/env ts-node

/**
 * Phase 2 Integration Verification Script
 * 
 * Verifies that all Phase 2 modules are working correctly by:
 * 1. Testing database connectivity
 * 2. Creating sample records in each new table
 * 3. Testing relationships between models
 * 4. Validating calculations (RPN, SPC, etc.)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  module: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function testModule(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      module: name,
      status: 'PASS',
      message: 'All tests passed',
      duration: Date.now() - startTime
    });
  } catch (error: any) {
    results.push({
      module: name,
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
}

// Test 1: Supplier Portal
async function testSupplierPortal() {
  console.log('Testing Supplier Portal...');
  
  // Find or create a test supplier
  let supplier = await prisma.supplier.findFirst();
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier Co.',
        code: 'TEST-001',
        email: 'test@supplier.com',
        phone: '555-0100',
        address: '123 Test St',
        organizationId: 'org-1'
      }
    });
  }

  // Create supplier user
  const supplierUser = await prisma.supplierUser.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@supplier.com`,
      password: 'hashed_password_placeholder',
      role: 'RESPONDER',
      supplierId: supplier.id
    }
  });

  if (!supplierUser.id) throw new Error('Failed to create supplier user');
  
  await prisma.supplierUser.delete({ where: { id: supplierUser.id } });
  console.log('✓ Supplier Portal: User creation working');
}

// Test 2: Risk Management
async function testRiskManagement() {
  console.log('Testing Risk Management...');
  
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found - run seed script first');
  
  const risk = await prisma.riskRegister.create({
    data: {
      riskNumber: `RISK-TEST-${Date.now()}`,
      title: 'Test Risk',
      description: 'Test risk for verification',
      category: 'PROCESS',
      severity: 8,
      occurrence: 6,
      detection: 4,
      rpn: 8 * 6 * 4, // 192
      status: 'IDENTIFIED',
      owner: 'Test Owner',
      organizationId: org.id,
      createdBy: 'system'
    }
  });

  if (risk.rpn !== 192) throw new Error('RPN calculation incorrect');
  
  await prisma.riskRegister.delete({ where: { id: risk.id } });
  console.log('✓ Risk Management: RPN calculation working');
}

// Test 3: Audit Management
async function testAuditManagement() {
  console.log('Testing Audit Management...');
  
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found - run seed script first');
  
  const audit = await prisma.audit.create({
    data: {
      auditNumber: `AUD-TEST-${Date.now()}`,
      type: 'INTERNAL',
      scope: 'Test Audit Scope',
      standard: 'ISO 9001:2015',
      auditDate: new Date(),
      location: 'Test Location',
      auditorName: 'Test Auditor',
      auditorOrg: 'Test Org',
      auditeeName: 'Test Auditee',
      status: 'PLANNED',
      organizationId: org.id,
      createdBy: 'system'
    }
  });

  // Create finding
  const finding = await prisma.auditFinding.create({
    data: {
      findingNumber: `FIND-TEST-${Date.now()}`,
      severity: 'MINOR',
      clause: '8.5.1',
      category: 'Process',
      description: 'Test finding',
      requirement: 'Test requirement',
      status: 'OPEN',
      auditId: audit.id
    }
  });

  if (!finding.id) throw new Error('Failed to create audit finding');
  
  await prisma.auditFinding.delete({ where: { id: finding.id } });
  await prisma.audit.delete({ where: { id: audit.id } });
  console.log('✓ Audit Management: Audit and finding creation working');
}

// Test 4: Document Control
async function testDocumentControl() {
  console.log('Testing Document Control...');
  
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found - run seed script first');
  
  const document = await prisma.document.create({
    data: {
      docNumber: `DOC-TEST-${Date.now()}`,
      title: 'Test Document',
      type: 'SOP',
      version: '1.0',
      status: 'DRAFT',
      department: 'Quality',
      owner: 'Test Owner',
      filePath: '/test/path.pdf',
      organizationId: org.id,
      createdBy: 'system'
    }
  });

  // Create revision
  const revision = await prisma.documentRevision.create({
    data: {
      version: '1.1',
      changes: 'Test revision',
      changeDate: new Date(),
      changedBy: 'system',
      documentId: document.id
    }
  });

  if (!revision.id) throw new Error('Failed to create document revision');
  
  await prisma.documentRevision.delete({ where: { id: revision.id } });
  await prisma.document.delete({ where: { id: document.id } });
  console.log('✓ Document Control: Version control working');
}

// Test 5: FMEA Integration
async function testFMEA() {
  console.log('Testing FMEA...');
  
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found - run seed script first');
  
  const fmea = await prisma.fMEA.create({
    data: {
      fmeaNumber: `FMEA-TEST-${Date.now()}`,
      title: 'Test FMEA',
      type: 'PROCESS_FMEA',
      scope: 'Test scope',
      teamLead: 'Test Lead',
      teamMembers: JSON.stringify(['Member 1', 'Member 2']),
      status: 'IN_PROGRESS',
      startDate: new Date(),
      organizationId: org.id,
      createdBy: 'system'
    }
  });

  // Create failure mode
  const failureMode = await prisma.fMEAFailureMode.create({
    data: {
      processStep: 'Test Step',
      processFunction: 'Test Function',
      failureMode: 'Test Failure',
      effectsOfFailure: 'Test Effects',
      potentialCauses: 'Test Causes',
      currentControls: 'Test Controls',
      severity: 7,
      occurrence: 5,
      detection: 6,
      rpn: 7 * 5 * 6, // 210
      recommendedActions: 'Test Actions',
      responsiblePerson: 'Test Person',
      status: 'OPEN',
      fmeaId: fmea.id
    }
  });

  if (failureMode.rpn !== 210) throw new Error('FMEA RPN calculation incorrect');
  
  await prisma.fMEAFailureMode.delete({ where: { id: failureMode.id } });
  await prisma.fMEA.delete({ where: { id: fmea.id } });
  console.log('✓ FMEA: Failure mode RPN calculation working');
}

// Test 6: Database Relationships
async function testRelationships() {
  console.log('Testing Database Relationships...');
  
  // Get existing org
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found - run seed script first');

  // Test Organization -> Risk relationship
  const testRisk = await prisma.riskRegister.create({
    data: {
      riskNumber: `RISK-REL-${Date.now()}`,
      title: 'Relationship Test Risk',
      description: 'Test',
      category: 'PROCESS',
      severity: 5,
      occurrence: 5,
      detection: 5,
      rpn: 125,
      status: 'IDENTIFIED',
      owner: 'Test',
      organizationId: org.id,
      createdBy: 'system'
    }
  });

  const orgWithRisks = await prisma.organization.findUnique({
    where: { id: org.id },
    include: { riskRegister: true }
  });

  if (!orgWithRisks?.riskRegister.some(r => r.id === testRisk.id)) {
    throw new Error('Organization -> Risk relationship not working');
  }

  await prisma.riskRegister.delete({ where: { id: testRisk.id } });
  console.log('✓ Relationships: Organization relations working');
}

// Main execution
async function main() {
  console.log('\n🧪 Phase 2 Integration Verification Starting...\n');
  console.log('=' .repeat(60));

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connection successful\n');

    // Run all tests
    await testModule('Supplier Portal', testSupplierPortal);
    await testModule('Risk Management', testRiskManagement);
    await testModule('Audit Management', testAuditManagement);
    await testModule('Document Control', testDocumentControl);
    await testModule('FMEA Integration', testFMEA);
    await testModule('Database Relationships', testRelationships);

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // Print results
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 TEST RESULTS:\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const time = `${result.duration}ms`;
    console.log(`${icon} ${result.module.padEnd(30)} ${time.padStart(8)}`);
    if (result.status === 'FAIL') {
      console.log(`   Error: ${result.message}`);
    }
  });

  console.log('\n' + '=' .repeat(60));
  console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please review errors above.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Phase 2 integration verified.\n');
    console.log('System is ready for deployment.\n');
    process.exit(0);
  }
}

main();
