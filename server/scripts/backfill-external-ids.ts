#!/usr/bin/env tsx

/**
 * Backfill External IDs Script
 * 
 * Populates NULL employee_number and client_code values from the externalIdentifiers table.
 * This script is idempotent and can be run multiple times safely.
 * 
 * Usage: tsx server/scripts/backfill-external-ids.ts
 */

import { db } from "../db";
import { employees, clients, externalIdentifiers } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

async function backfillEmployeeNumbers() {
  console.log('\n📋 Starting employee_number backfill...');
  
  try {
    // Find all employees with NULL employee_number
    const employeesWithoutNumber = await db
      .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
      .from(employees)
      .where(isNull(employees.employeeNumber));
    
    console.log(`Found ${employeesWithoutNumber.length} employees with NULL employee_number`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const employee of employeesWithoutNumber) {
      // Look up external ID from externalIdentifiers table
      const externalId = await db
        .select({ externalId: externalIdentifiers.externalId })
        .from(externalIdentifiers)
        .where(
          and(
            eq(externalIdentifiers.entityType, 'employee'),
            eq(externalIdentifiers.entityId, employee.id),
            eq(externalIdentifiers.isPrimary, true)
          )
        )
        .limit(1);
      
      if (externalId.length === 0) {
        console.log(`  ⚠️  No external ID found for employee: ${employee.firstName} ${employee.lastName} (${employee.id})`);
        notFound++;
        continue;
      }
      
      // Update employee_number with external ID
      await db
        .update(employees)
        .set({ employeeNumber: externalId[0].externalId })
        .where(eq(employees.id, employee.id));
      
      console.log(`  ✅ Updated employee ${employee.firstName} ${employee.lastName}: ${externalId[0].externalId}`);
      updated++;
    }
    
    console.log(`\n✅ Employee backfill complete: ${updated} updated, ${notFound} not found`);
    return { updated, notFound };
  } catch (error) {
    console.error('❌ Error during employee backfill:', error);
    throw error;
  }
}

async function backfillClientCodes() {
  console.log('\n📋 Starting client_code backfill...');
  
  try {
    // Find all clients with NULL client_code
    const clientsWithoutCode = await db
      .select({ id: clients.id, firstName: clients.firstName, lastName: clients.lastName })
      .from(clients)
      .where(isNull(clients.clientCode));
    
    console.log(`Found ${clientsWithoutCode.length} clients with NULL client_code`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const client of clientsWithoutCode) {
      // Look up external ID from externalIdentifiers table
      const externalId = await db
        .select({ externalId: externalIdentifiers.externalId })
        .from(externalIdentifiers)
        .where(
          and(
            eq(externalIdentifiers.entityType, 'client'),
            eq(externalIdentifiers.entityId, client.id),
            eq(externalIdentifiers.isPrimary, true)
          )
        )
        .limit(1);
      
      if (externalId.length === 0) {
        console.log(`  ⚠️  No external ID found for client: ${client.firstName} ${client.lastName} (${client.id})`);
        notFound++;
        continue;
      }
      
      // Update client_code with external ID
      await db
        .update(clients)
        .set({ clientCode: externalId[0].externalId })
        .where(eq(clients.id, client.id));
      
      console.log(`  ✅ Updated client ${client.firstName} ${client.lastName}: ${externalId[0].externalId}`);
      updated++;
    }
    
    console.log(`\n✅ Client backfill complete: ${updated} updated, ${notFound} not found`);
    return { updated, notFound };
  } catch (error) {
    console.error('❌ Error during client backfill:', error);
    throw error;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  🔧 EXTERNAL ID BACKFILL SCRIPT                ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    // Backfill employees
    const employeeResults = await backfillEmployeeNumbers();
    
    // Backfill clients
    const clientResults = await backfillClientCodes();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  ✅ BACKFILL COMPLETE                          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`\nEmployees: ${employeeResults.updated} updated, ${employeeResults.notFound} not found`);
    console.log(`Clients: ${clientResults.updated} updated, ${clientResults.notFound} not found`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backfill script failed:', error);
    process.exit(1);
  }
}

main();
