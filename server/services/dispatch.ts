/**
 * DispatchOS™ - Computer-Aided Dispatch Service Layer
 * Handles GPS tracking, unit status, incident management, and real-time updates
 */

import { db } from "../db";
import { eq, and, desc, sql, inArray, gte, lte, isNull } from "drizzle-orm";
import { 
  gpsLocations, 
  dispatchIncidents, 
  dispatchAssignments, 
  unitStatuses, 
  dispatchLogs,
  employees,
  shifts,
  clients,
  workspaces
} from "@shared/schema";

export interface GPSLocationUpdate {
  employeeId: string;
  workspaceId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  incidentId?: number | null;
  unitStatus?: string | null;
}

export interface CreateIncidentData {
  workspaceId: string;
  incidentNumber: string;
  priority: 'emergency' | 'urgent' | 'routine';
  incidentType: string;
  locationAddress: string;
  locationLat?: number;
  locationLng?: number;
  clientId?: string;
  callerName?: string;
  callerPhone?: string;
  callNotes?: string;
}

export interface AssignUnitData {
  incidentId: number;
  unitId: string;
  notes?: string;
}

export class DispatchService {
  /**
   * Record GPS location for mobile unit
   */
  async recordGPSLocation(data: GPSLocationUpdate) {
    const [location] = await db.insert(gpsLocations).values({
      employeeId: data.employeeId,
      workspaceId: data.workspaceId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || 10,
      incidentId: data.incidentId,
      unitStatus: data.unitStatus,
      timestamp: new Date(),
    }).returning();

    // Update unit status table with latest location
    await this.updateUnitLocation(data.employeeId, data.workspaceId, data.latitude, data.longitude);

    return location;
  }

  /**
   * Get all active units for a workspace with current status
   */
  async getActiveUnits(workspaceId: string) {
    const units = await db
      .select({
        id: unitStatuses.id,
        employeeId: unitStatuses.employeeId,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          phone: employees.phone,
        },
        status: unitStatuses.status,
        lastKnownLat: unitStatuses.lastKnownLat,
        lastKnownLng: unitStatuses.lastKnownLng,
        lastLocationUpdate: unitStatuses.lastLocationUpdate,
        currentIncidentId: unitStatuses.currentIncidentId,
        capabilities: unitStatuses.capabilities,
        certifications: unitStatuses.certifications,
        assignedZone: unitStatuses.assignedZone,
        equipmentAssigned: unitStatuses.equipmentAssigned,
        shiftId: unitStatuses.shiftId,
      })
      .from(unitStatuses)
      .leftJoin(employees, eq(unitStatuses.employeeId, employees.id))
      .where(eq(unitStatuses.workspaceId, workspaceId))
      .orderBy(unitStatuses.status, desc(unitStatuses.lastLocationUpdate));

    return units;
  }

  /**
   * Get GPS trail for a unit (last 50 locations)
   */
  async getUnitGPSTrail(employeeId: string, workspaceId: string, limit: number = 50) {
    const trail = await db
      .select()
      .from(gpsLocations)
      .where(and(
        eq(gpsLocations.employeeId, employeeId),
        eq(gpsLocations.workspaceId, workspaceId)
      ))
      .orderBy(desc(gpsLocations.timestamp))
      .limit(limit);

    return trail.reverse(); // Return chronologically
  }

  /**
   * Update unit status and location
   */
  async updateUnitLocation(employeeId: string, workspaceId: string, lat: number, lng: number) {
    const [existing] = await db
      .select()
      .from(unitStatuses)
      .where(and(
        eq(unitStatuses.employeeId, employeeId),
        eq(unitStatuses.workspaceId, workspaceId)
      ))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(unitStatuses)
        .set({
          lastKnownLat: lat,
          lastKnownLng: lng,
          lastLocationUpdate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(unitStatuses.id, existing.id))
        .returning();
      return updated;
    }

    // Create new unit status if doesn't exist
    const [created] = await db.insert(unitStatuses).values({
      workspaceId,
      employeeId,
      status: 'offline',
      lastKnownLat: lat,
      lastKnownLng: lng,
      lastLocationUpdate: new Date(),
      capabilities: [],
      certifications: [],
      equipmentAssigned: [],
    }).returning();

    return created;
  }

  /**
   * Change unit status (available/en route/on scene/offline)
   */
  async updateUnitStatus(employeeId: string, workspaceId: string, newStatus: string, incidentId?: number) {
    const [existing] = await db
      .select()
      .from(unitStatuses)
      .where(and(
        eq(unitStatuses.employeeId, employeeId),
        eq(unitStatuses.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!existing) {
      throw new Error("Unit status not found");
    }

    const [updated] = await db
      .update(unitStatuses)
      .set({
        status: newStatus,
        currentIncidentId: incidentId || null,
        updatedAt: new Date(),
      })
      .where(eq(unitStatuses.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Create a new dispatch incident
   */
  async createIncident(data: CreateIncidentData) {
    const [incident] = await db.insert(dispatchIncidents).values({
      workspaceId: data.workspaceId,
      incidentNumber: data.incidentNumber,
      priority: data.priority,
      incidentType: data.incidentType,
      locationAddress: data.locationAddress,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      clientId: data.clientId,
      callerName: data.callerName,
      callerPhone: data.callerPhone,
      callNotes: data.callNotes,
      callReceivedAt: new Date(),
      status: 'pending',
    }).returning();

    // Log incident creation
    await this.logDispatchAction(data.workspaceId, incident.id, null, 'incident_created', {
      incidentNumber: incident.incidentNumber,
      priority: incident.priority,
      type: incident.incidentType,
    });

    return incident;
  }

  /**
   * Get active incidents for a workspace
   */
  async getActiveIncidents(workspaceId: string) {
    const incidents = await db
      .select({
        id: dispatchIncidents.id,
        incidentNumber: dispatchIncidents.incidentNumber,
        priority: dispatchIncidents.priority,
        incidentType: dispatchIncidents.incidentType,
        locationAddress: dispatchIncidents.locationAddress,
        locationLat: dispatchIncidents.locationLat,
        locationLng: dispatchIncidents.locationLng,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
        },
        callerName: dispatchIncidents.callerName,
        callerPhone: dispatchIncidents.callerPhone,
        callNotes: dispatchIncidents.callNotes,
        callReceivedAt: dispatchIncidents.callReceivedAt,
        dispatchedAt: dispatchIncidents.dispatchedAt,
        enRouteAt: dispatchIncidents.enRouteAt,
        arrivedAt: dispatchIncidents.arrivedAt,
        clearedAt: dispatchIncidents.clearedAt,
        status: dispatchIncidents.status,
        responseTimeSeconds: dispatchIncidents.responseTimeSeconds,
        travelTimeSeconds: dispatchIncidents.travelTimeSeconds,
        sceneTimeSeconds: dispatchIncidents.sceneTimeSeconds,
      })
      .from(dispatchIncidents)
      .leftJoin(clients, eq(dispatchIncidents.clientId, clients.id))
      .where(and(
        eq(dispatchIncidents.workspaceId, workspaceId),
        inArray(dispatchIncidents.status, ['pending', 'assigned', 'en_route', 'on_scene'])
      ))
      .orderBy(
        sql`CASE 
          WHEN ${dispatchIncidents.priority} = 'emergency' THEN 1 
          WHEN ${dispatchIncidents.priority} = 'urgent' THEN 2 
          ELSE 3 
        END`,
        dispatchIncidents.callReceivedAt
      );

    return incidents;
  }

  /**
   * Assign unit to incident
   */
  async assignUnit(data: AssignUnitData, dispatcherId?: string) {
    const [assignment] = await db.insert(dispatchAssignments).values({
      incidentId: data.incidentId,
      unitId: data.unitId,
      assignedAt: new Date(),
      assignmentStatus: 'assigned',
      notes: data.notes,
    }).returning();

    // Update incident status
    await db
      .update(dispatchIncidents)
      .set({
        status: 'assigned',
        dispatchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dispatchIncidents.id, data.incidentId));

    // Update unit status
    const [incident] = await db
      .select()
      .from(dispatchIncidents)
      .where(eq(dispatchIncidents.id, data.incidentId))
      .limit(1);

    if (incident) {
      await this.updateUnitStatus(data.unitId, incident.workspaceId, 'dispatched', data.incidentId);

      // Log assignment
      await this.logDispatchAction(incident.workspaceId, data.incidentId, dispatcherId, 'unit_assigned', {
        unitId: data.unitId,
        incidentNumber: incident.incidentNumber,
      });
    }

    return assignment;
  }

  /**
   * Unit accepts/rejects assignment
   */
  async respondToAssignment(incidentId: number, unitId: string, response: 'accepted' | 'rejected', reason?: string) {
    const [assignment] = await db
      .select()
      .from(dispatchAssignments)
      .where(and(
        eq(dispatchAssignments.incidentId, incidentId),
        eq(dispatchAssignments.unitId, unitId)
      ))
      .limit(1);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const now = new Date();
    const [updated] = await db
      .update(dispatchAssignments)
      .set({
        assignmentStatus: response,
        acknowledgedAt: now,
        acceptedAt: response === 'accepted' ? now : null,
        rejectedAt: response === 'rejected' ? now : null,
        rejectionReason: reason,
      })
      .where(eq(dispatchAssignments.id, assignment.id))
      .returning();

    // Update unit status if accepted
    if (response === 'accepted') {
      const [incident] = await db
        .select()
        .from(dispatchIncidents)
        .where(eq(dispatchIncidents.id, incidentId))
        .limit(1);

      if (incident) {
        await this.updateUnitStatus(unitId, incident.workspaceId, 'dispatched', incidentId);
      }
    }

    return updated;
  }

  /**
   * Update incident status with timeline tracking
   */
  async updateIncidentStatus(incidentId: number, newStatus: string, dispatcherId?: string) {
    const [incident] = await db
      .select()
      .from(dispatchIncidents)
      .where(eq(dispatchIncidents.id, incidentId))
      .limit(1);

    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = new Date();
    const updates: any = {
      status: newStatus,
      updatedAt: now,
    };

    // Track timeline
    switch (newStatus) {
      case 'en_route':
        updates.enRouteAt = now;
        if (incident.dispatchedAt) {
          updates.responseTimeSeconds = Math.floor((now.getTime() - new Date(incident.dispatchedAt).getTime()) / 1000);
        }
        break;
      case 'on_scene':
        updates.arrivedAt = now;
        if (incident.enRouteAt) {
          updates.travelTimeSeconds = Math.floor((now.getTime() - new Date(incident.enRouteAt).getTime()) / 1000);
        }
        break;
      case 'cleared':
        updates.clearedAt = now;
        if (incident.arrivedAt) {
          updates.sceneTimeSeconds = Math.floor((now.getTime() - new Date(incident.arrivedAt).getTime()) / 1000);
        }
        break;
    }

    const [updated] = await db
      .update(dispatchIncidents)
      .set(updates)
      .where(eq(dispatchIncidents.id, incidentId))
      .returning();

    // Log status change
    await this.logDispatchAction(incident.workspaceId, incidentId, dispatcherId, 'status_changed', {
      oldStatus: incident.status,
      newStatus,
      incidentNumber: incident.incidentNumber,
    });

    return updated;
  }

  /**
   * Log dispatcher action for audit trail
   */
  async logDispatchAction(
    workspaceId: string, 
    incidentId: number | null, 
    dispatcherId: string | null, 
    action: string, 
    details: any
  ) {
    await db.insert(dispatchLogs).values({
      workspaceId,
      incidentId,
      dispatcherId,
      action,
      details,
    });
  }

  /**
   * Get on-shift units only (ScheduleOS™ integration)
   */
  async getOnShiftUnits(workspaceId: string) {
    const now = new Date();
    
    // Get current shifts
    const activeShifts = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.workspaceId, workspaceId),
        lte(shifts.startTime, now),
        gte(shifts.endTime, now)
      ));

    const onShiftEmployeeIds = activeShifts.map(s => s.employeeId).filter(Boolean) as string[];

    if (onShiftEmployeeIds.length === 0) {
      return [];
    }

    // Get unit statuses for on-shift employees only
    const units = await db
      .select({
        id: unitStatuses.id,
        employeeId: unitStatuses.employeeId,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          phone: employees.phone,
        },
        status: unitStatuses.status,
        lastKnownLat: unitStatuses.lastKnownLat,
        lastKnownLng: unitStatuses.lastKnownLng,
        lastLocationUpdate: unitStatuses.lastLocationUpdate,
        currentIncidentId: unitStatuses.currentIncidentId,
        capabilities: unitStatuses.capabilities,
        certifications: unitStatuses.certifications,
        assignedZone: unitStatuses.assignedZone,
        shiftId: unitStatuses.shiftId,
      })
      .from(unitStatuses)
      .leftJoin(employees, eq(unitStatuses.employeeId, employees.id))
      .where(and(
        eq(unitStatuses.workspaceId, workspaceId),
        inArray(unitStatuses.employeeId, onShiftEmployeeIds)
      ))
      .orderBy(unitStatuses.status);

    return units;
  }
}

export const dispatchService = new DispatchService();
