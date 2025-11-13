# ScheduleOS™ Migration & AI Upgrades

## 🎯 Overview
Comprehensive upgrade to ScheduleOS™ adding schedule migration via Gemini Vision AI and enhanced constraint-based scheduling with fairness metrics.

## 📦 New Features

### 1. Schedule Migration (NEW)
**Purpose**: Seamlessly import schedules from external apps (Deputy, WhenIWork, GetSling)

**How It Works**:
- User uploads PDF/screenshot of existing schedule
- Gemini Vision API (multimodal) extracts table data via OCR
- AI learns patterns from historical data (soft constraints, employee preferences)
- Preview extracted shifts with validation
- One-click import to AutoForce

**Files Added**:
- `server/services/scheduleMigration.ts` - Vision AI extraction service
- API Endpoint: `POST /api/scheduleos/migrate-schedule` - File upload & extraction
- Frontend: Migration UI integrated into ScheduleOS Smart page

**Features**:
- ✅ Multi-format support (PDF, PNG, JPEG)
- ✅ Pattern recognition (discovers scheduling rules from history)
- ✅ Confidence scoring per shift
- ✅ Extraction quality warnings
- ✅ Token usage billing via `usageMeteringService`

---

### 2. Enhanced Constraint System (UPGRADE)
**Purpose**: Weighted constraint optimization following best practices from attached guidance

**Changes to `server/services/scheduleSmartAI.ts`**:

#### Hard Constraints (Non-Negotiable)
```typescript
hardConstraints: {
  respectAvailability: boolean;     // Never schedule during unavailability
  preventDoubleBooking: boolean;    // One shift at a time per employee
  enforceRestPeriods: boolean;      // Min 8-12 hours between shifts
  respectTimeOffRequests: boolean;  // Honor approved time-off
}
```

#### Soft Constraints (Penalty-Based Optimization)
```typescript
softConstraints: {
  preferExperience: boolean;        // Prefer experienced employees
  balanceWorkload: boolean;         // Even distribution of shifts
  minimizeCommute: boolean;         // Reduce travel distance
  respectPreferences: boolean;      // Honor employee preferences
  avoidClopening: boolean;          // Avoid closing→opening shifts
}
```

#### Predictive Metrics
```typescript
predictiveMetrics: {
  enableReliabilityScoring: boolean;   // Use past performance data
  penalizeLateHistory: boolean;        // Weight tardiness history
  considerAbsenteeismRisk: boolean;    // Predict call-off likelihood
}
```

---

### 3. Fairness & Bias Detection (UPGRADE)
**Purpose**: Ensure equitable shift distribution and flag potential biases

**Enhanced Response Schema**:
```typescript
fairnessMetrics: {
  distributionScore: number;        // 0-100: Equity of undesirable shifts
  biasAlerts: string[];            // Warnings about unfair distribution
  weekendDistribution: object;      // Per-employee weekend shift counts
  closingShiftDistribution: object; // Per-employee closing shift counts
}
```

**Compliance Checks**:
- Rolling 3-month fairness window
- Statistical analysis of undesirable shift distribution
- Automated bias flagging if distribution >20% unequal
- Forced regeneration if fairness score <70%

---

### 4. Learning Loop (UPGRADE)
**Purpose**: Track post-approval edits to improve future AI generations

**Database Enhancements**:
```typescript
// Already in schema (schedule_proposals table):
editCount: integer;
editedAfterApproval: boolean;
shiftIdsCreated: text[]; // Track which shifts were created from this proposal
```

**Learning Workflow**:
1. User approves AI-generated schedule
2. User makes manual edits (reassignments, additions, deletions)
3. System tracks edit count and patterns
4. Future AI generations learn from edit patterns (planned)

---

## 🚀 API Endpoints Added

### POST /api/scheduleos/migrate-schedule
**Purpose**: Extract schedule from uploaded file via Gemini Vision

**Request**:
```json
{
  "fileData": "base64-encoded-image-or-pdf",
  "mimeType": "image/png | image/jpeg | application/pdf",
  "sourceApp": "Deputy | WhenIWork | GetSling | Other"
}
```

**Response**:
```json
{
  "shifts": [
    {
      "employeeName": "John Doe",
      "startDate": "2025-01-15",
      "startTime": "09:00",
      "endDate": "2025-01-15",
      "endTime": "17:00",
      "position": "Technician",
      "location": "Site A",
      "confidence": 0.98
    }
  ],
  "patterns": {
    "discovered": ["Jane avoids weekends", "Lead always has 5+ years exp"],
    "softConstraints": ["Balance workload", "Avoid clopening"]
  },
  "summary": "Extracted 24 shifts from Deputy export",
  "extractionConfidence": 95,
  "warnings": ["Row 12: End time partially obscured"]
}
```

---

## 🎨 Frontend Changes

### ScheduleOS Smart Page Enhancements
**File**: `client/src/pages/schedule-smart.tsx`

**New UI Elements**:
1. **Migration Tab** - Upload interface for schedule import
2. **Enhanced Constraints Panel** - Toggle hard/soft constraints
3. **Fairness Dashboard** - Visual distribution metrics
4. **Pattern Learning Display** - Show discovered scheduling patterns

**Migration Flow**:
1. User clicks "Import from Deputy/WhenIWork/Other"
2. Upload PDF/screenshot
3. AI extracts + displays preview with confidence scores
4. User reviews extracted shifts
5. One-click import → creates shifts in AutoForce
6. Detected patterns saved as workspace scheduling preferences

---

## 🧠 Enhanced AI Prompt Logic

**Weighted Constraint Scoring**:
```
Hard Constraint Violation = Schedule REJECTED (confidence = 0%)
Soft Constraint Penalty:
  - Preference violation: -5% confidence
  - Commute distance >30mi: -3% per occurrence  
  - Workload imbalance >20%: -10% confidence
  - Clopening: -8% per occurrence
```

**Fairness Checks**:
- Calculate weekend shift distribution variance
- Flag if any employee has >20% more undesirable shifts than others
- Require regeneration if fairness score <70%

---

## 💡 User Benefits

### For New Clients
1. **Seamless Onboarding**: Upload existing schedule → AutoForce learns patterns → Zero manual data entry
2. **Zero Learning Curve**: AI discovers existing scheduling rules automatically
3. **Instant Migration**: Deputy/WhenIWork/GetSling → AutoForce in <5 minutes

### For Existing Users
1. **Smarter Scheduling**: Weighted constraints ensure legal compliance first, preferences second
2. **Fairness Guarantee**: Automated bias detection prevents unfair shift distribution
3. **Continuous Improvement**: AI learns from your edits to improve future generations

---

## 🔗 Integration Points

### Connects To:
- **HelpOS™**: Uses same Gemini Vision infrastructure
- **BillOS™**: Migrated shifts automatically linked to payroll/invoicing
- **AuditOS™**: Full audit trail of migration source, edits, and approvals

### Billing Integration:
- Migration: `scheduleos_migration` feature key (vision token usage)
- Smart AI: `scheduleos_smart_ai` feature key (text token usage)
- Transparent usage tracking via existing `usageMeteringService`

---

## 📊 Success Metrics

**Migration Quality**:
- Target: >90% extraction confidence
- Goal: <5% manual corrections needed
- Benchmark: 2-5 minutes per full month migration

**Smart AI Quality**:
- Target: >95% auto-approval rate (high confidence)
- Goal: Fairness score >85% on all generations
- Benchmark: <2% post-approval edit rate

---

## 🎓 Best Practices (From Attached Guidance)

### Implemented From "Weighted Constraint Optimization":
✅ Hard constraints = non-negotiable (legal compliance)
✅ Soft constraints = penalty weights (preferences)
✅ Exponential penalties for undesirable behavior
✅ Optimizer seeks minimum total penalty score

### Implemented From "Advanced Logic & Fairness":
✅ Predictive absenteeism metrics
✅ Adaptive soft constraint weighting (planned)
✅ Formal fairness distribution scoring
✅ Equitable distribution of undesirable shifts
✅ Compliance audit mandate (rest breaks, max hours)

### Implemented From "Schedule Migration Protocol":
✅ Multimodal vision analysis (PDFs/images)
✅ OCR + table extraction
✅ Pattern recognition from historical data
✅ Structured JSON output with confidence scores
✅ Memory bank for discovered soft constraints

---

## 🔄 Next Steps (Future Enhancements)

1. **Adaptive Learning**: Auto-adjust soft constraint weights based on user edit patterns
2. **Multi-Source Migration**: Bulk import from multiple schedule sources
3. **Compliance Library**: Pre-built templates for industry-specific regulations (healthcare, construction)
4. **Fairness Analytics Dashboard**: Historical fairness trends over time
5. **Client Dislike Logic**: Track client feedback → exclude pairings with expiration

---

## 📝 Notes
- All features maintain existing AutoForce design patterns
- No new pages created - integrated into existing ScheduleOS Smart UI
- Backward compatible - existing schedules unaffected
- Progressive enhancement - all features optional/toggleable
