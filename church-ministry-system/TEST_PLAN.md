# Comprehensive Test Plan — Church Ministry System

## Environment
- Backend: `http://localhost:3000/api/v1`
- Mobile: React Native (Expo)
- DB: MySQL, Church ID = 1 (integer)
- Auth: JWT Bearer token, `X-Church-ID: 1` header on all requests
- Test users (see seeders): `priest@test.com`, `leader@test.com`, `servant@test.com`, `member@test.com`, `parent@test.com`

---

## 1. Authentication & Authorization (Backend)

### 1.1 Login
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| AUTH-01 | Login with email + valid password | `POST /auth/login` with `{email:"priest@test.com", password:"password123"}` | 201/200, returns `{token, refreshToken, user, memberId, roles, contexts}` |
| AUTH-02 | Login with phone + valid password | `POST /auth/login` with `{phone:"01000000001", password:"password123"}` | 201/200, returns token |
| AUTH-03 | Login with wrong password | `POST /auth/login` with wrong password | 401, error message |
| AUTH-04 | Login with non-existent email | `POST /auth/login` with unknown email | 401, error message |
| AUTH-05 | Login with missing password field | `POST /auth/login` with `{email:"..."}` only | 400 validation error |
| AUTH-06 | Login with missing email AND phone | `POST /auth/login` with `{password:"..."}` only | 400 validation error |
| AUTH-07 | Login without X-Church-ID header | `POST /auth/login` without header | 400/401 (TenantMiddleware requires it) |

### 1.2 Signup
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| AUTH-08 | Signup with fullName + email + password | `POST /auth/signup` with `{fullName:"Test", email:"new@test.com", password:"password123"}` | 201, returns token; User, ChurchMember, MemberProfile created; role = served_member |
| AUTH-09 | Signup with fullName + phone + password | `POST /auth/signup` with `{fullName:"Test", phone:"01099999999", password:"password123"}` | 201, success |
| AUTH-10 | Signup with duplicate email | Same email as existing user | 409 conflict |
| AUTH-11 | Signup with duplicate phone | Same phone as existing user | 409 conflict |
| AUTH-12 | Signup with missing fullName | `POST /auth/signup` without fullName | 400 validation error |
| AUTH-13 | Signup with password < 6 chars | `POST /auth/signup` with password "123" | 400 validation error |

### 1.3 Contexts & Switch Context
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| AUTH-14 | Get contexts for priest | `GET /auth/contexts` with priest JWT | Returns all possible contexts |
| AUTH-15 | Get contexts for served_member | `GET /auth/contexts` with served_member JWT | Returns served_member + parent if applicable |
| AUTH-16 | Switch context to valid role | `POST /auth/switch-context` with `{role:"servant", serviceId:1}` | 200, returns new JWT |
| AUTH-17 | Switch context to unauthorized role | `POST /auth/switch-context` with role the user doesn't have | 403 forbidden |
| AUTH-18 | Call endpoint without JWT | `GET /members/me` without Authorization header | 401 unauthorized |

### 1.4 Logout
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| AUTH-19 | Logout (mobile-side) | Call `useAuth().logout()` | AsyncStorage tokens cleared, Redux resets to initial state |
| AUTH-20 | Token reuse after logout | Use old token after logout in a request | 401 (token still valid until expiry, but accepted by design — client responsibility to discard) |

---

## 2. Church Structure (Backend)

### 2.1 Sectors
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| SCT-01 | List sectors | `GET /sectors` | 200, returns array of active sectors |
| SCT-02 | Get single sector | `GET /sectors/1` | 200, sector object |
| SCT-03 | Get non-existent sector | `GET /sectors/9999` | 404 |
| SCT-04 | Get services in sector | `GET /sectors/1/services` | 200, array of services in that sector |
| SCT-05 | Create sector (priest) | `POST /sectors` with `{name:"New Sector", type:"primary"}` | 201, sector created |
| SCT-06 | Create sector (served_member) | `POST /sectors` as served_member | 403 forbidden |
| SCT-07 | Create sector with missing name | `POST /sectors` with `{}` | 400 validation error |

### 2.2 Services
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| SCT-08 | List services | `GET /services` | 200, array of active services |
| SCT-09 | Get service with includes | `GET /services/1` | 200, includes stageGroups, classes |
| SCT-10 | Get service stage groups | `GET /services/1/stage-groups` | 200, array of stage groups ordered by stageOrder |
| SCT-11 | Get service classes | `GET /services/1/classes` | 200, array of active classes |
| SCT-12 | Create service (sector_leader) | `POST /services` | 201 |
| SCT-13 | Create service (servant) | `POST /services` as servant | 403 |

### 2.3 Stage Groups & Classes
| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| SCT-14 | Create stage group | `POST /stage-groups` | 201 |
| SCT-15 | Create class | `POST /classes` | 201 |
| SCT-16 | Create class with invalid serviceId | `POST /classes` with non-existent serviceId | 400/404 |

---

## 3. Users & Members (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| USR-01 | Get current user profile | `GET /members/me` | 200, returns user + roles |
| USR-02 | List all members | `GET /members` | 200, returns array of active members with user info |
| USR-03 | Update own profile | `PATCH /members/me` with `{fullName:"Updated"}` | 200, profile updated |
| USR-04 | Update profile wrong memberId via JWT | N/A (JWT-driven, so cannot) | N/A — JWT enforces memberId |
| USR-05 | Create member (public) | `POST /members` | 201, creates User + ChurchMember |
| USR-06 | Create member duplicate | `POST /members` with existing email | 409 |

---

## 4. Events (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| EVT-01 | List events | `GET /events` | 200, array (optional ?eventType filter works) |
| EVT-02 | Get event with registrations | `GET /events/1` | 200, includes registrations |
| EVT-03 | Create event (sector_leader) | `POST /events` | 201 |
| EVT-04 | Create event (served_member) | `POST /events` as served_member | 403 |
| EVT-05 | Register for event | `POST /events/1/register` | 201, registration created |
| EVT-06 | Register duplicate | `POST /events/1/register` again | 409 (already registered) |
| EVT-07 | Cancel registration | `DELETE /events/1/register` | 200, status changed to cancelled |
| EVT-08 | List registrations (sector_leader) | `GET /events/1/registrations` | 200, array |
| EVT-09 | List registrations (served_member) | `GET /events/1/registrations` as served_member | 403 |
| EVT-10 | Add payment installment | `POST /events/1/registrations/1/payments` | 201, paidAmount updated |
| EVT-11 | Get payment summary | `GET /events/1/payments/summary` | 200, total vs collected |
| EVT-12 | Register for full event | Register when maxCapacity reached | 400 "event full" |
| EVT-13 | Register after deadline | Register past registrationDeadline | 400 "deadline passed" |

---

## 5. Attendance (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| ATT-01 | Create session (servant) | `POST /attendance/sessions` | 201 |
| ATT-02 | Create session (served_member) | `POST /attendance/sessions` as served_member | 403 |
| ATT-03 | List sessions with filters | `GET /attendance/sessions?serviceId=1&from=2025-01-01&to=2025-12-31` | 200, filtered |
| ATT-04 | Get session with records | `GET /attendance/sessions/1` | 200, includes AttendanceRecord[] |
| ATT-05 | Record attendance (upsert) | `POST /attendance/sessions/1/records` with record array | 201, records created/updated |
| ATT-06 | Update individual record | `PUT /attendance/records/1` with `{status:"excused"}` | 200, status updated |
| ATT-07 | Get attendance report | `GET /attendance/report?memberId=1&from=...&to=...` | 200, grouped by status (present/absent/excused/late) counts |

---

## 6. Preparations (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| PREP-01 | Create preparation (servant) | `POST /preparations` | 201, status = "draft" |
| PREP-02 | Create preparation (served_member) | `POST /preparations` as served_member | 403 |
| PREP-03 | List preparations with filters | `GET /preparations?servantId=1&status=draft` | 200, filtered |
| PREP-04 | Get single preparation | `GET /preparations/1` | 200, includes files |
| PREP-05 | Update own preparation | `PATCH /preparations/1` | 200, updated |
| PREP-06 | Update another's preparation | `PATCH /preparations/1` as different servant | 403 (ownership check) |
| PREP-07 | Submit for review | `POST /preparations/1/submit` | 200, status = "submitted" |
| PREP-08 | Submit already submitted | `POST /preparations/1/submit` again | 400 (wrong workflow state) |
| PREP-09 | Review (approve) as sector_leader | `PATCH /preparations/1/review` with `{status:"approved"}` | 200, status = "approved", reviewerId set |
| PREP-10 | Review as servant | `PATCH /preparations/1/review` as servant | 403 |
| PREP-11 | Delete own draft | `DELETE /preparations/1` | 200, hard deleted |
| PREP-12 | Delete submitted preparation | `DELETE /preparations/1` when status=submitted | 400 (only drafts can be deleted) |

---

## 7. Tasks (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| TSK-01 | Create task (servant) | `POST /tasks` | 201 |
| TSK-02 | List tasks with filters | `GET /tasks?serviceId=1&taskType=memorization` | 200, filtered |
| TSK-03 | Get task with assignments | `GET /tasks/1` | 200, includes TaskAssignment[] |
| TSK-04 | Update task | `PATCH /tasks/1` | 200 |
| TSK-05 | Delete task | `DELETE /tasks/1` | 200 |
| TSK-06 | Assign task to members | `POST /tasks/1/assign` with `{memberIds:[1,2,3]}` | 201, assignments created |
| TSK-07 | Assign duplicate member | `POST /tasks/1/assign` with already-assigned memberId | 201 (skips duplicate, no error) |
| TSK-08 | Get my tasks | `GET /my-tasks` | 200, returns assigned tasks for current member |
| TSK-09 | Complete task (self) | `POST /tasks/1/complete` | 200, status = "completed" |
| TSK-10 | Verify task completion (servant) | `POST /tasks/1/verify/2` | 200, status = "completed", verifiedBy set |
| TSK-11 | Verify as served_member | `POST /tasks/1/verify/2` as served_member | 403 |

---

## 8. Taio Points & Store (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| TAIO-01 | Get own balance | `GET /taio/balance` | 200, `{balance: number}` |
| TAIO-02 | Get another member's balance | `GET /taio/balance/2` | 200, `{balance: number}` |
| TAIO-03 | Get transactions | `GET /taio/transactions` | 200, array (last 100) |
| TAIO-04 | Award points (servant) | `POST /taio/award` with `{churchMemberId:2, points:10, reason:"good work", sourceType:"task"}` | 201, transaction created |
| TAIO-05 | Award negative points | `POST /taio/award` with `{points:-10}` | 400 (award only positive) |
| TAIO-06 | Get leaderboard | `GET /taio/leaderboard?serviceId=1` | 200, top 50 by points |
| TAIO-07 | List store items | `GET /store/items` | 200, array of active items |
| TAIO-08 | Redeem item (sufficient balance) | `POST /store/redeem` with valid itemId + quantity | 201, redemption + negative transaction |
| TAIO-09 | Redeem item (insufficient balance) | `POST /store/redeem` when points < cost | 400 "insufficient balance" |
| TAIO-10 | Redeem item (out of stock) | `POST /store/redeem` when stockQuantity = 0 | 400 "out of stock" |
| TAIO-11 | Get my redemptions | `GET /store/redemptions` | 200, array with storeItem details |
| TAIO-12 | Fulfill redemption | `PATCH /store/redemptions/1/fulfill` | 200, status = "fulfilled", stock decremented |

---

## 9. Follow-ups (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| FLW-01 | Create follow-up family | `POST /follow-ups` | 201 |
| FLW-02 | List follow-ups | `GET /follow-ups` | 200, array with servant/service info |
| FLW-03 | Get single follow-up | `GET /follow-ups/1` | 200, with servant, service, assignments |
| FLW-04 | Update status | `PATCH /follow-ups/1/status` with `{status:"completed"}` | 200 |
| FLW-05 | Add activity log | `POST /follow-ups/1/activities` | 201, log entry created |
| FLW-06 | Get activity logs | `GET /follow-ups/1/activities` | 200, array ordered by date |
| FLW-07 | Delete follow-up | `DELETE /follow-ups/1` | 200, hard deleted |

---

## 10. Activities (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| ACT-01 | Create activity | `POST /activities` | 201 |
| ACT-02 | List activities (filtered) | `GET /activities?type=choir` | 200, filtered by activityType |
| ACT-03 | Get activity with sessions | `GET /activities/1` | 200, includes sessions |
| ACT-04 | Enroll in activity | `POST /activities/1/enroll` with `{churchMemberId:1}` | 201, membership created |
| ACT-05 | Enroll duplicate | `POST /activities/1/enroll` again | 200 (findOrCreate — returns existing) |
| ACT-06 | Unenroll | `DELETE /activities/1/unenroll` with `{churchMemberId:1}` | 200, membership removed |
| ACT-07 | Record attendance (auto-creates session) | `POST /activities/1/attendance` | 201, attendance records created |
| ACT-08 | Get attendance by date | `GET /activities/1/attendance?sessionDate=2025-01-15` | 200, filtered |

---

## 11. Achievements (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| ACH-01 | Create achievement definition | `POST /achievements` | 201 |
| ACH-02 | List definitions | `GET /achievements` | 200, array of active definitions |
| ACH-03 | Get my achievements | `GET /achievements/mine` | 200, array with definition info |
| ACH-04 | Check and award | `POST /achievements/check` | 201, returns newly awarded achievements |
| ACH-05 | Delete definition | `DELETE /achievements/1` | 200 |

---

## 12. Lesson Library (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| LIB-01 | Create lesson | `POST /lesson-library` | 201 |
| LIB-02 | List with pagination | `GET /lesson-library?page=1&limit=10` | 200, `{items[], total, page, limit}` |
| LIB-03 | List with search | `GET /lesson-library?search=bible` | 200, matches on title |
| LIB-04 | List with filters | `GET /lesson-library?category=bible&serviceId=1` | 200, filtered |
| LIB-05 | Get single lesson | `GET /lesson-library/1` | 200, with service/class/stageGroup |
| LIB-06 | Delete lesson | `DELETE /lesson-library/1` | 200 |

---

## 13. Service Year (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| SYR-01 | List service years | `GET /service-years` | 200, ordered by startDate DESC |
| SYR-02 | Get current service year | `GET /service-years/current` | 200, single object where isCurrent=true |
| SYR-03 | Create new service year (priest only) | `POST /service-years` | 201, new year is current, previous unset |
| SYR-04 | Create service year (non-priest) | `POST /service-years` as servant | 403 |
| SYR-05 | Promote members to new year | `POST /service-years/2/promote` | 200, enrollments + assignments copied |

---

## 14. Family (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| FAM-01 | Get my family | `GET /families/my` | 200, family with members |
| FAM-02 | Create family (priest) | `POST /families` | 201 |
| FAM-03 | Add member to family | `POST /families/1/members` | 201 |
| FAM-04 | List family members | `GET /families/1/members` | 200, array |
| FAM-05 | Get my children (parent) | `GET /my-children` | 200, array of children with user info |

---

## 15. Reports (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| RPT-01 | Attendance report | `GET /reports/attendance?from=...&to=...` | 200, status counts |
| RPT-02 | Engagement report | `GET /reports/engagement?serviceId=1` | 200, attendance + task stats per member |
| RPT-03 | Financial report | `GET /reports/financial?serviceId=1` | 200, totalAmount vs paidAmount |
| RPT-04 | Taio report | `GET /reports/taio?serviceId=1` | 200, points summary per member |
| RPT-05 | Servant performance report | `GET /reports/servant-performance?serviceId=1` | 200, prep stats per servant |
| RPT-06 | Report access (served_member) | Access any report as served_member | 403 |

---

## 16. Notifications (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| NTF-01 | Register device token | `POST /notifications/register-device` | 201, FCM token saved |
| NTF-02 | Unregister device token | `DELETE /notifications/unregister-device` | 200, isActive=false |
| NTF-03 | Get notifications | `GET /notifications` | 200, last 50 |
| NTF-04 | Get unread count | `GET /notifications/unread-count` | 200, `{count: number}` |
| NTF-05 | Mark one as read | `PATCH /notifications/1/read` | 200, isRead=true, readAt set |
| NTF-06 | Mark all as read | `PATCH /notifications/read-all` | 200, all unread updated |

---

## 17. Multi-Tenant Isolation (Backend)

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MTN-01 | Access church A data with church B header | Use church A JWT + X-Church-ID: 2 | 403/empty — records scoped to church 1 only |
| MTN-02 | Signup for church 2 | `POST /auth/signup` with `X-Church-ID: 2` | 201, creates member in church 2 |
| MTN-03 | Login to different church | Login from church 1 vs church 2 | Different churchIds, different data scopes |

---

## 18. Mobile - Auth Flow

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-01 | Login Screen renders | Navigate to Login screen | Email/phone + password inputs, sign in button, signup link visible, English + Arabic |
| MOB-02 | Login success → navigate to correct stack | Enter valid credentials, tap Sign In | Token stored in AsyncStorage, Redux state populated, navigated to correct role-based stack |
| MOB-03 | Login failure shows error | Enter invalid credentials | Red error text displayed, no navigation |
| MOB-04 | Login loading state | Tap Sign In while request in progress | ActivityIndicator replaces button text, button disabled |
| MOB-05 | Signup Screen renders | Tap "Don't have an account? Sign up" link | fullName, email, phone, password inputs visible |
| MOB-06 | Signup success → navigate to app | Fill all fields, tap Create Account | Token stored, navigated to served_member dashboard (default role) |
| MOB-07 | Signup failure shows error | Enter duplicate email | Red error text displayed |
| MOB-08 | Logout from ContextSwitcher | Tap logout button | Navigated to login screen, AsyncStorage cleared, Redux reset |
| MOB-09 | Logout from dashboard | Tap logout button on dashboard | Same as MOB-08 |
| MOB-10 | Token expiry → auto-logout | Use expired JWT → API returns 401 | Interceptor clears tokens, navigates to Login |
| MOB-11 | RTL support in Login/Signup | Switch device language to Arabic | Text inputs align right, layout flips |

---

## 19. Mobile - Context Switching

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-12 | Context list shows all roles | Open ContextSwitcher | All available roles displayed with service/class info |
| MOB-13 | Switch to valid context | Tap a context card | Context switches, navigate to new stack for that role |
| MOB-14 | Active context highlighted | Open ContextSwitcher | Current active context shows "active" badge |
| MOB-15 | Switch back and forth | Switch to servant context → switch to priest context | Both work, JWT updated each time |
| MOB-16 | Context loading state | Wait for contexts to load | Cards disabled/shows loading indicator |

---

## 20. Mobile - Servant Dashboard

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-17 | Dashboard renders | Login as servant | Greeting with name, active role, quick actions card, logout button |
| MOB-18 | Attendance screen - create session | Fill date + type, tap create | Session appears in list |
| MOB-19 | Attendance screen - list sessions | View sessions | Pull-to-refresh works, session cards show date/type/count |
| MOB-20 | Tasks screen - list tasks | View tasks | Tasks displayed with title/type/due date |
| MOB-21 | Taio award screen - award points | Enter memberId + points + reason, tap Award | Success message, balance updates |
| MOB-22 | Achievements - check & award | Tap "Check Now" | New achievements awarded if criteria met |
| MOB-23 | Lesson Library - search | Enter search term, tap filter chip | Results filtered, pagination works on scroll |
| MOB-24 | Lesson Library - empty search | Search non-existent term | Empty state shown |
| MOB-25 | Notifications - empty list | View notifications | Empty state shown (or list if seeded) |

---

## 21. Mobile - Served Member & Parent Flows

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-26 | Served member dashboard | Login as served_member | Greeting, "no tasks" card, points card showing 0 |
| MOB-27 | Served member - my tasks | View tasks tab | Assigned tasks shown, "Mark Complete" works |
| MOB-28 | Taio balance screen | View balance tab | Large balance number, transaction history |
| MOB-29 | Store - redeem item | Tap Redeem on an item | If sufficient balance: success alert. If not: error alert |
| MOB-30 | Parent - children list | Login as parent | List of children cards displayed, tap navigates to detail |
| MOB-31 | Parent - child detail | Tap a child card | Shows attendance %, taio balance, task count, recent activity |
| MOB-32 | Parent - child detail loading | Wait for all 4 API calls | Full-screen loading, then content per-section |
| MOB-33 | Parent - events list | View events tab | Events listed with register button |

---

## 22. Mobile - Leader Screens

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-34 | Leader - reviews list | Login as sector_leader | Submitted preparations listed, approve/reject buttons |
| MOB-35 | Leader - approve preparation | Tap Approve | Status changes to approved |
| MOB-36 | Leader - reject preparation | Tap Reject | Status changes to rejected |
| MOB-37 | Leader - reports | Tap each report button | Report data displayed in card (or placeholder) |

---

## 23. Mobile - Follow-up Full Flow

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| MOB-38 | Follow-up list | Open FollowUp tab | List of follow-up families with status badges |
| MOB-39 | Create follow-up | Tap FAB, fill form, save | New follow-up appears in list |
| MOB-40 | View follow-up detail | Tap a follow-up item | Detail screen with status toggle, activity list |
| MOB-41 | Update follow-up status | Toggle status | Status changes, badge updates |
| MOB-42 | Add activity to follow-up | Tap "Add Activity", fill form, save | Activity appears in log |

---

## 24. Edge Cases & Security

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| SEC-01 | SQL injection attempt | POST with injection strings in inputs | Validation rejects or ORM escapes |
| SEC-02 | JWT tampering | Modify token payload | 401 invalid signature |
| SEC-03 | Access another user's data | Change `memberId` in request params | 403/404 — scoped to JWT's memberId |
| SEC-04 | X-Church-ID tampering | Change header to another church | 403/empty — church scoped |
| SEC-05 | Mass assignment protection | POST extra fields not in DTO | Extra fields ignored |
| SEC-06 | Concurrent duplicate signup | Send 2 identical signup requests simultaneously | One succeeds, one fails (unique constraint) |
| SEC-07 | Empty request body | POST /sectors with `{}` | 400 validation error |
| SEC-08 | Negative numbers in numeric fields | POST with `{capacity: -1}` | 400 validation or clamped |
| SEC-09 | Very long strings | POST with 10KB string | 400 (MaxLength validation if set) |
| SEC-10 | XSS attempt | POST with `<script>alert(1)</script>` in name field | Stored as-is (ORM doesn't strip), but rendered safely in mobile (no dangerouslySetInnerHTML) |

---

## 25. Offline & Network Resilience

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| OFF-01 | Network timeout | Kill backend, make API call | Appropriate error message, no crash |
| OFF-02 | Slow network | Throttle network | Loading indicators show, request completes eventually |
| OFF-03 | Rapid context switching | Switch context 10 times rapidly | Last request wins, no stale state |
| OFF-04 | Rapid form submission | Double-tap signup button | Only one request sent (button disabled after first tap) |

---

## 26. Data Integrity Validation

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| INT-01 | Delete referenced record | Delete sector that has services | FK constraint prevents (or cascade if configured) |
| INT-02 | Create orphan record | Create class with non-existent serviceId | FK constraint error (400/500) |
| INT-03 | Duplicate unique field | Create two users with same email | Unique constraint violation (409) |
| INT-04 | Audit log after mutation | Create/update/delete any entity | AuditLog entry created with before/after snapshots |

---

## 27. Mobile Arabic RTL Audit

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| RTL-01 | All screens in Arabic | Set device language to Arabic | Text displayed in Arabic, layout flips RTL |
| RTL-02 | No LTR-specific hardcoded styles | Scroll through all screens | No `marginLeft`/`paddingLeft` where `marginStart`/`paddingStart` should be used |
| RTL-03 | Arrow direction in ChildrenScreen | View children list in Arabic | Arrow points left (←) in Arabic, right (→) in English |
| RTL-04 | Notifications border fix | View notifications in Arabic | Border on correct side |

---

## 28. Mobile Performance

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| PERF-01 | Large preparation list | Create 100 preparations, load list | Renders within 2 seconds |
| PERF-02 | Child detail with many records | Child has 50 attendance/50 tasks | Sections limit to 5, page loads within 3 seconds |
| PERF-03 | Store with many items | Create 50 store items | 2-column grid renders, scrolls smoothly |
| PERF-04 | Backend - leaderboard with many members | 1000 members with taio points | Top 50 query executes under 500ms |

---

## 29. Regression Test Suite (Smoke)

Run these before every release:

| Priority | Test IDs |
|---|---|
| P0 (must pass) | AUTH-01, AUTH-08, AUTH-18, SCT-01, SCT-08, USR-01, ATT-01, PREP-01, TSK-01, TAIO-04, FLW-01, ACH-01, LIB-01, SYR-02, NTF-01, FAM-01, MOB-01, MOB-02, MOB-08, MOB-12, MOB-13, SEC-02, SEC-04 |
| P1 (high) | AUTH-14, AUTH-16, EVT-01, EVT-05, ACT-01, ACT-04, RPT-01, MOB-17, MOB-26, MOB-30, MOB-34, MOB-38, RTL-01 |
| P2 (medium) | All remaining AUTH, ATT, TSK, TAIO tests |
| P3 (low) | Performance, edge cases, offline |

---

## 30. Tools & Automation

| Tool | Purpose |
|---|---|
| Jest / Supertest | Backend API integration tests |
| React Native Testing Library | Mobile component tests |
| Postman / Bruno | Manual API testing and collection sharing |
| Detox / Maestro | Mobile E2E tests (future) |
| Thunder Client (VS Code) | Quick API validation during dev |

### Recommended Runner Scripts

```json
{
  "test:api": "npx jest --testMatch=\"**/*.api-test.ts\"",
  "test:unit": "npx jest --testMatch=\"**/*.spec.ts\"",
  "test:e2e": "npx detox test",
  "test:smoke": "npx jest --testPathPattern=\"smoke\""
}
```
