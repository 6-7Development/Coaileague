/**
 * TALENTOS™ - CAREER PATHING
 * 
 * Shows employees exactly what they need for their next promotion.
 * Generates visual skill gap reports that feed into LearnOS™.
 */

import { storage } from "../storage";

// ============================================================================
// SKILL GAP ANALYSIS
// ============================================================================

/**
 * Generate comprehensive skill gap analysis for employee
 */
export async function generateSkillGapAnalysis(
  employeeId: string,
  targetRoleId: string,
  workspaceId: string
): Promise<any> {
  const employee = await storage.getEmployee(employeeId, workspaceId);
  const targetRole = await storage.getRoleTemplate(targetRoleId, workspaceId);

  if (!employee || !targetRole) {
    throw new Error('Employee or target role not found');
  }

  // Extract current qualifications
  const currentSkills = (employee.skills as string[]) || [];
  const currentCertifications = (employee.certifications as string[]) || [];
  const currentTraining: string[] = []; // Placeholder for LearnOS™ integration

  // Extract requirements from target role
  const requiredSkills = (targetRole.requiredSkills as string[]) || [];
  const requiredCertifications = (targetRole.requiredCertifications as string[]) || [];
  const requiredTraining = (targetRole.requiredTrainingCourses as string[]) || [];

  // Calculate gaps
  const missingSkills = requiredSkills.filter(
    skill => !currentSkills.some(cs => 
      cs.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(cs.toLowerCase())
    )
  );

  const missingCertifications = requiredCertifications.filter(
    cert => !currentCertifications.some(cc =>
      cc.toLowerCase().includes(cert.toLowerCase()) ||
      cert.toLowerCase().includes(cc.toLowerCase())
    )
  );

  const missingTraining = requiredTraining.filter(
    training => !currentTraining.includes(training)
  );

  // Calculate readiness scores
  const skillsReadiness = requiredSkills.length > 0
    ? ((requiredSkills.length - missingSkills.length) / requiredSkills.length) * 100
    : 100;

  const certificationsReadiness = requiredCertifications.length > 0
    ? ((requiredCertifications.length - missingCertifications.length) / requiredCertifications.length) * 100
    : 100;

  const trainingReadiness = requiredTraining.length > 0
    ? ((requiredTraining.length - missingTraining.length) / requiredTraining.length) * 100
    : 100;

  // Check experience requirement
  const minimumMonths = targetRole.minimumTimeInCurrentRole || 0;
  const employeeMonthsInRole = calculateMonthsInCurrentRole(employee);
  const experienceReadiness = minimumMonths > 0
    ? Math.min((employeeMonthsInRole / minimumMonths) * 100, 100)
    : 100;

  // Overall readiness (weighted average)
  const readinessScore = (
    skillsReadiness * 0.3 +
    certificationsReadiness * 0.3 +
    trainingReadiness * 0.2 +
    experienceReadiness * 0.2
  );

  // Estimate time to ready
  const estimatedTimeToReady = calculateTimeToReady(
    missingSkills,
    missingCertifications,
    missingTraining
  );

  // Identify blockers
  const blockers: string[] = [];
  if (employeeMonthsInRole < minimumMonths) {
    blockers.push(`Needs ${minimumMonths - employeeMonthsInRole} more months in current role`);
  }
  if (missingCertifications.length > 0) {
    blockers.push(`Missing required certifications: ${missingCertifications.join(', ')}`);
  }

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(
    missingSkills,
    missingCertifications,
    missingTraining
  );

  // Create skill gap analysis
  const analysis = await storage.createSkillGapAnalysis({
    workspaceId,
    employeeId,
    targetRoleId,
    currentRole: employee.position || 'Unknown',
    currentSkills,
    currentCertifications,
    currentTrainingCompleted: currentTraining,
    missingSkills,
    missingCertifications,
    missingTraining,
    readinessScore: readinessScore.toFixed(2),
    skillsReadiness: skillsReadiness.toFixed(2),
    certificationsReadiness: certificationsReadiness.toFixed(2),
    trainingReadiness: trainingReadiness.toFixed(2),
    experienceReadiness: experienceReadiness.toFixed(2),
    estimatedTimeToReady,
    blockers,
    recommendedActions,
    totalActions: recommendedActions.length,
    actionsCompleted: 0,
    status: 'active',
  });

  return analysis;
}

/**
 * Calculate months in current role
 */
function calculateMonthsInCurrentRole(employee: any): number {
  const hireDate = employee.hireDate ? new Date(employee.hireDate) : new Date();
  const now = new Date();
  const monthsDiff = (now.getFullYear() - hireDate.getFullYear()) * 12 +
                     (now.getMonth() - hireDate.getMonth());
  return Math.max(0, monthsDiff);
}

/**
 * Estimate time to become ready (in months)
 */
function calculateTimeToReady(
  missingSkills: string[],
  missingCertifications: string[],
  missingTraining: string[]
): number {
  // Rough estimates:
  // - Each skill: 2 months of practice
  // - Each certification: 1 month (course + exam)
  // - Each training: 0.5 months
  
  const skillsTime = missingSkills.length * 2;
  const certsTime = missingCertifications.length * 1;
  const trainingTime = missingTraining.length * 0.5;

  return Math.ceil(skillsTime + certsTime + trainingTime);
}

/**
 * Generate prioritized action plan
 */
function generateRecommendedActions(
  missingSkills: string[],
  missingCertifications: string[],
  missingTraining: string[]
): Array<{
  action: string;
  type: string;
  priority: string;
  estimatedTime: number;
  learnOsLinkId?: string;
}> {
  const actions: Array<{
    action: string;
    type: string;
    priority: string;
    estimatedTime: number;
    learnOsLinkId?: string;
  }> = [];

  // Certifications first (highest priority - usually hard blockers)
  missingCertifications.forEach(cert => {
    actions.push({
      action: `Obtain ${cert} certification`,
      type: 'certification',
      priority: 'high',
      estimatedTime: 30, // days
    });
  });

  // Required training second
  missingTraining.forEach(training => {
    actions.push({
      action: `Complete ${training} training course`,
      type: 'course',
      priority: 'high',
      estimatedTime: 15,
    });
  });

  // Skills last (can be developed on the job)
  missingSkills.forEach(skill => {
    actions.push({
      action: `Develop ${skill} skill`,
      type: 'skill_training',
      priority: 'medium',
      estimatedTime: 60,
    });
  });

  return actions;
}

// ============================================================================
// CAREER PATH VISUALIZATION
// ============================================================================

/**
 * Get complete career path for employee (current → target → future)
 */
export async function getCareerPathVisualization(
  employeeId: string,
  workspaceId: string
): Promise<{
  currentRole: any;
  nextRoles: any[];
  skillGaps: any[];
}> {
  const employee = await storage.getEmployee(employeeId, workspaceId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const currentRole = employee.position || 'Entry Level';

  // Find possible next roles based on current role
  const allRoles = await storage.getRoleTemplates(workspaceId);
  const nextRoles = allRoles.filter((role: any) =>
    role.fromRole?.toLowerCase() === currentRole.toLowerCase() ||
    role.roleLevel === ((employee.roleLevel as number) || 1) + 1
  );

  // Get existing skill gap analyses
  const skillGaps = await storage.getSkillGapAnalysesByEmployee(workspaceId, employeeId);

  return {
    currentRole: {
      name: currentRole,
      level: employee.roleLevel || 1,
      skills: employee.skills || [],
      certifications: employee.certifications || [],
    },
    nextRoles: nextRoles.map((role: any) => ({
      id: role.id,
      name: role.roleName,
      level: role.roleLevel,
      minSalary: role.minHourlyRate,
      maxSalary: role.maxHourlyRate,
      requiredSkills: role.requiredSkills || [],
      requiredCertifications: role.requiredCertifications || [],
    })),
    skillGaps,
  };
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Update skill gap progress when employee completes an action
 */
export async function updateSkillGapProgress(
  analysisId: string,
  workspaceId: string,
  completedAction: {
    action: string;
    type: string;
  }
): Promise<any> {
  const analysis = await storage.getSkillGapAnalysis(analysisId, workspaceId);
  if (!analysis) {
    throw new Error('Skill gap analysis not found');
  }

  const recommendedActions = (analysis.recommendedActions as any[]) || [];
  const matchingAction = recommendedActions.find((a: any) =>
    a.action === completedAction.action && a.type === completedAction.type
  );

  if (!matchingAction) {
    throw new Error('Action not found in recommended actions');
  }

  const actionsCompleted = (analysis.actionsCompleted || 0) + 1;
  const totalActions = analysis.totalActions || 0;

  // Recalculate readiness based on completion
  const employee = await storage.getEmployee(analysis.employeeId, workspaceId);
  const targetRole = await storage.getRoleTemplate(analysis.targetRoleId, workspaceId);

  if (!employee || !targetRole) {
    throw new Error('Employee or target role not found');
  }

  // Update employee's skills/certs if applicable
  if (completedAction.type === 'certification') {
    const currentCerts = (employee.certifications as string[]) || [];
    const certName = completedAction.action.replace('Obtain ', '').replace(' certification', '');
    if (!currentCerts.includes(certName)) {
      currentCerts.push(certName);
      await storage.updateEmployee(analysis.employeeId, workspaceId, {
        certifications: currentCerts,
      });
    }
  }

  if (completedAction.type === 'skill_training') {
    const currentSkills = (employee.skills as string[]) || [];
    const skillName = completedAction.action.replace('Develop ', '').replace(' skill', '');
    if (!currentSkills.includes(skillName)) {
      currentSkills.push(skillName);
      await storage.updateEmployee(analysis.employeeId, workspaceId, {
        skills: currentSkills,
      });
    }
  }

  // Regenerate full analysis to get updated readiness
  const updatedAnalysis = await generateSkillGapAnalysis(
    analysis.employeeId,
    analysis.targetRoleId,
    workspaceId
  );

  // Check if ready for promotion
  const readinessScore = parseFloat(updatedAnalysis.readinessScore);
  if (readinessScore >= 90) {
    await storage.updateSkillGapAnalysis(analysisId, workspaceId, {
      status: 'ready',
    });

    // Notify manager that employee is ready
    await createPromotionReadyAlert(employee, targetRole, readinessScore);
  }

  return updatedAnalysis;
}

/**
 * Create alert when employee becomes promotion-ready
 */
async function createPromotionReadyAlert(
  employee: any,
  targetRole: any,
  readinessScore: number
): Promise<void> {
  await storage.createAuditLog({
    workspaceId: employee.workspaceId,
    userId: employee.id,
    userName: `${employee.firstName} ${employee.lastName}`,
    userRole: employee.role || 'employee',
    action: 'promotion_ready',
    entityType: 'skill_gap_analysis',
    entityId: targetRole.id,
    entityDescription: `Employee is ready for promotion to ${targetRole.roleName}`,
    metadata: {
      type: 'talent_development',
      targetRole: targetRole.roleName,
      readinessScore,
      alertLevel: 'info',
      suggestedAction: 'Consider promoting employee to next role',
    },
  });

  console.log(`[TALENT DEVELOPMENT] Employee ${employee.id} is ready for promotion to ${targetRole.roleName} (${readinessScore}% ready)`);
}
