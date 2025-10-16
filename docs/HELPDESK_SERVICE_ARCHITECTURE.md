# HelpDesk Service Architecture (SupportOS™)
**Service Label:** `irc.wfos.chat`  
**Service Type:** Staff Workspace / Customer Support Service  
**Status:** Production-Ready

---

## Service Overview

**HelpDesk** is a staffed service workspace where platform support staff (Deputies, Assistants, Sysops) provide real-time customer support through IRC/MSN-style instant messaging.

### Service Classification
- **Service Name:** SupportOS™ / HelpDesk Service
- **Service URL Pattern:** `irc.wfos.chat` (future subdomain)
- **Service Category:** Platform Infrastructure Service
- **Billable Service:** YES - Staff hours tracked for payroll
- **Customer-Facing:** YES - Dual authentication (customers + staff)

---

## Staff Workspace Features

### Support Staff Roles (Platform RBAC)
- **Platform Admin** - Full system access, can monitor all tickets
- **Deputy Admin** - Senior support staff, all commands
- **Deputy Assistant** - Support staff, most commands
- **Sysop** - System operators, technical support

### Staff Hour Tracking
The HelpDesk service integrates with platform payroll tracking:
- Clock-in/Clock-out via chat presence
- Session duration tracking
- Ticket assignment = billable hours
- Service uptime monitoring

### Staff Workspace Tools
1. **Command System:** 11 slash commands for customer assistance
2. **Right-Click Menus:** Desktop quick actions (verify, auth, reset, kick, mute)
3. **Queue Management:** AI-powered priority assignment
4. **Transfer System:** Hand-off tickets to other staff
5. **Performance Metrics:** Reviews, ratings, ticket closure stats

---

## Service Operations

### Service Management
Like all WorkforceOS features, HelpDesk is:
- **Updateable:** Can deploy new features, commands, UI changes
- **Maintainable:** Can take offline for maintenance
- **Monitorable:** Admin dashboards track service health
- **Scalable:** Queue system handles multiple concurrent customers

### Service Endpoints
```
# Customer Access
POST /api/helpdesk/authenticate-ticket  - Ticket verification
GET  /api/helpdesk/conversations         - Chat history

# Staff Access
POST /api/helpdesk/authenticate-workid   - Staff login
WS   /ws                                  - WebSocket messaging

# Service Admin
GET  /api/helpdesk/reviews               - Training dashboard
GET  /api/helpdesk/testimonials          - Marketing showcase
POST /api/helpdesk/feedback              - Post-ticket reviews

# Future: Service Metrics
GET  /api/helpdesk/staff-hours           - Payroll integration
GET  /api/helpdesk/service-status        - Uptime monitoring
```

---

## File Organization (Clean Code Structure)

### Backend Service Files
```
server/
├── websocket.ts                    # HelpDesk WebSocket server
├── routes.ts                       # HelpDesk REST API (lines 4850-4950)
└── services/
    ├── helpOsQueue.ts             # AI queue management
    └── helpOsBot.ts               # AI assistant bot
```

### Frontend Service Files
```
client/src/
├── pages/
│   ├── live-chatroom.tsx          # HelpDesk customer/staff interface
│   ├── admin-ticket-reviews.tsx   # Staff training dashboard
│   └── testimonials.tsx           # Marketing showcase
└── components/
    ├── responsive-chat-layout.tsx # Platform detection
    ├── desktop-chat-layout.tsx    # IRC/MSN staff workspace
    ├── mobile-chat-layout.tsx     # Mobile staff workspace
    ├── user-context-menu.tsx      # Desktop staff quick-actions
    ├── support-command-drawer.tsx # Mobile staff commands
    └── feedback-modal.tsx         # Post-ticket reviews
```

### Shared Service Schema
```
shared/
├── schema.ts                      # chat_conversations, chat_messages tables
└── commands.ts                    # Command registry (11 commands)
```

---

## Service Integration Points

### Payroll Integration
```typescript
// Future: Track support staff billable hours
interface StaffSession {
  staffId: string;
  workId: string;
  clockIn: Date;
  clockOut: Date | null;
  ticketsHandled: number;
  activeMinutes: number;
  billableHours: number;
}
```

### Platform Monitoring
```typescript
// Service health tracking
interface ServiceStatus {
  serviceName: "HelpDesk" | "irc.wfos.chat";
  status: "online" | "maintenance" | "offline";
  activeStaff: number;
  queueLength: number;
  avgWaitTime: number;
  uptime: number;
}
```

---

## Proper Labeling & Documentation

### Why Proper Labeling Matters
1. **Easy File Location:** Search "HelpDesk" or "irc.wfos.chat" finds all related code
2. **Service-Oriented:** Treat as updatable/maintainable service module
3. **Cleaner Code:** Clear boundaries between services
4. **Payroll Integration:** Platform knows this is a staffed service with billable hours
5. **Future Scaling:** Can add more "chat.wfos.chat", "support.wfos.chat" services

### Naming Conventions
- **Code:** `HelpDesk`, `SupportOS`, `irc.wfos.chat`
- **Files:** Prefix with `helpdesk-` or group in `services/helpdesk/`
- **Database:** `chat_conversations`, `chat_messages` (clear service ownership)
- **API Routes:** `/api/helpdesk/*` (all service endpoints grouped)
- **Environment:** `HELPDESK_*` for service-specific config

---

## Service Deployment

### Production Checklist
- [ ] WebSocket server running (port auto-assigned)
- [ ] Database migrations applied (chat tables)
- [ ] Platform admin roles configured
- [ ] Staff work IDs registered
- [ ] Queue system initialized
- [ ] Feedback system active
- [ ] Monitoring dashboards accessible

### Service URL Structure
```
# Future subdomain deployment
irc.wfos.chat/              → Customer ticket entry
irc.wfos.chat/staff         → Staff workspace login
irc.wfos.chat/reviews       → Admin training dashboard
irc.wfos.chat/testimonials  → Public showcase
```

---

## Summary

**HelpDesk (irc.wfos.chat)** is a fully-featured, staffed platform service where support personnel provide customer assistance. It's tracked for payroll, managed like any OS module, and properly documented for easy maintenance and updates.

**Service Status:** ✅ Production Ready  
**Staff Workspace:** ✅ Complete  
**Payroll Integration:** 🔜 Coming Soon  
**Service Monitoring:** 🔜 Coming Soon

---

*Properly labeled and documented for clean, maintainable code architecture.*
