# HCMC Church Management System — API Endpoints Design

This document specifies the complete RESTful and Server-Sent Events (SSE) API contracts for the HCMC Church Management System, built with **NestJS + TypeScript**.

- **Base URL**: `/api/v1`
- **Default Format**: `application/json; charset=utf-8`
- **Streaming Format**: `text/event-stream; charset=utf-8`
- **Authentication**: JWT Bearer Token in `Authorization: Bearer <token>`
- **Timezone**: All timestamps formatted in ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`), business display in `Pacific/Auckland`.

---

## 1. Global Standards & Error Format

### 1.1 Standard Success Envelope
```typescript
interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    [key: string]: any;
  };
}
```

### 1.2 Standard Error Envelope
```typescript
interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
```

Common HTTP status codes:
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `202 Accepted`: Background task scheduled (e.g. re-indexing)
- `400 Bad Request`: Validation failure or invalid parameters
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Insufficient role or scope permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unhandled server exception

---

## 2. Scripture & RAG Module (`/api/v1/scripture`)

### 2.1 Hybrid Scripture Search (Keyword + Semantic)
Executes a fast hybrid search across Bible verses. If an exact book/chapter/verse format is detected (e.g. `约3:16` or `John 3:16`), returns exact match instantly. Otherwise, queries vector index + BM25 full-text index.

- **Endpoint**: `POST /api/v1/scripture/search`
- **Auth**: Public (Rate limit: 30 req/min per IP)
- **Request Body**:
```typescript
interface ScriptureSearchDto {
  query: string;               // e.g. "爱是恒久忍耐" or "约翰福音 3:16"
  version?: 'CUV' | 'CNV' | 'NIV' | 'ESV'; // Default: 'CUV' (和合本)
  testament?: 'ALL' | 'OT' | 'NT';         // Default: 'ALL'
  limit?: number;              // Default: 10, Max: 50
  offset?: number;             // Default: 0
}
```

- **Example Request**:
```json
{
  "query": "面对焦虑和恐惧时的平安",
  "version": "CUV",
  "testament": "ALL",
  "limit": 5,
  "offset": 0
}
```

- **Example Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "queryType": "SEMANTIC",
    "version": "CUV",
    "total": 5,
    "results": [
      {
        "id": "PHP.4.6",
        "bookCode": "PHP",
        "bookName": "腓立比书",
        "chapter": 4,
        "verse": 6,
        "text": "应当一无挂虑，只要凡事藉着祷告、祈求，和感谢，将你们所要的告诉神。",
        "score": 0.924,
        "highlight": "应当一无<em>挂虑</em>，只要凡事藉着祷告、祈求，和感谢..."
      },
      {
        "id": "PHP.4.7",
        "bookCode": "PHP",
        "bookName": "腓立比书",
        "chapter": 4,
        "verse": 7,
        "text": "神所赐出人意外的平安必在基督耶稣里保守你们的心怀意念。",
        "score": 0.918,
        "highlight": "神所赐出人意外的<em>平安</em>必在基督耶稣里保守你们的心怀意念。"
      },
      {
        "id": "JHN.14.27",
        "bookCode": "JHN",
        "bookName": "约翰福音",
        "chapter": 14,
        "verse": 27,
        "text": "我留下平安给你们；我将我的平安赐给你们。我所赐的，不像世人所赐的。你们心里不要忧愁，也不要胆怯。",
        "score": 0.895,
        "highlight": "我留下<em>平安</em>给你们...心里不要<em>忧愁</em>，也不要<em>胆怯</em>。"
      }
    ]
  }
}
```

---

### 2.2 RAG Faith & Scripture Q&A (SSE Streaming)
Interactively answers faith inquiries grounded exclusively in retrieved scripture passages using Server-Sent Events (SSE).

- **Endpoint**: `POST /api/v1/scripture/ask`
- **Auth**: Public (Rate limit: 10 req/min per IP; authenticated members have higher limit 60 req/min)
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: text/event-stream`
- **Request Body**:
```typescript
interface ScriptureAskDto {
  question: string;            // e.g. "当我遇到重大家庭矛盾时，圣经教导我们该如何饶恕？"
  version?: 'CUV' | 'CNV' | 'NIV'; // Default: 'CUV'
  conversationId?: string;     // Optional UUID for session continuity
}
```

- **SSE Stream Protocol**:
The server streams chunks using standard SSE events:
1. `event: citations`: Triggered as soon as vector retrieval finishes (contains verified Bible verses used as grounding context).
2. `event: token`: Emitted token-by-token during LLM synthesis.
3. `event: done`: Emitted when stream finishes with metadata (token usage, latency).
4. `event: error`: Emitted if pipeline encounters an error.

- **Example SSE Stream Event Flow**:
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: citations
data: {"citations":[{"id":"EPH.4.31-32","book":"以弗所书","chapter":4,"verses":"31-32","text":"一切苦毒、恼恨、忿怒、嚷闹、毁谤，并一切的恶毒，都当从你们中间除掉；并要以恩慈相待，存怜悯的心，彼此饶恕，正如神在基督里饶恕了你们一样。"},{"id":"COL.3.13","book":"歌罗西书","chapter":3,"verses":"13","text":"倘若这人与那人有嫌隙，总要彼此包容，彼此饶恕；主怎样饶恕了你们，你们也要怎样饶恕人。"}]}

event: token
data: {"text":"面对家庭中的摩擦与矛盾，圣经给出了以爱、忍耐与恩典为根基的明确指引：\n\n"}

event: token
data: {"text":"1. **以神的饶恕为榜样**\n在 [以弗所书 4:31-32] 中，使徒保罗劝勉我们要除掉一切苦毒、恼恨与忿怒，以恩慈相待，彼此饶恕，正如神在基督里饶恕了我们一样。饶恕不是否定受到的委屈，而是靠着神的恩典选择放下仇恨。"}

event: token
data: {"text":"\n\n2. **存包容与怜悯的心**\n[歌罗西书 3:13] 再次强调，『倘若这人与那人有嫌隙，总要彼此包容，彼此饶恕』。主动寻求和睦是活出基督品格的见证。"}

event: done
data: {"finishReason":"stop","conversationId":"b238f902-8d9e-4a6c-9df2-9b2f6ef32a10","tokens":{"prompt":365,"completion":180},"latencyMs":1420}
```

---

### 2.3 Scripture Passage Lookup (Full Chapter / Context)
Retrieves continuous scripture passages to support the frontend reading drawer when a user clicks on a verse citation pill.

- **Endpoint**: `GET /api/v1/scripture/passage`
- **Auth**: Public
- **Query Parameters**:
  - `book`: string (e.g. `JHN` or `约翰福音`)
  - `chapter`: number (e.g. `3`)
  - `startVerse`: number (optional, e.g. `16`)
  - `endVerse`: number (optional, e.g. `21`)
  - `version`: `'CUV' | 'CNV' | 'NIV'` (optional, default: `CUV`)
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "bookCode": "JHN",
    "bookName": "约翰福音",
    "chapter": 3,
    "version": "CUV",
    "verses": [
      {
        "verse": 16,
        "text": "神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。"
      },
      {
        "verse": 17,
        "text": "因为神差他的儿子降世，不是要定世人的罪，乃是要叫世人因他得救。"
      }
    ],
    "previousChapter": { "bookCode": "JHN", "chapter": 2 },
    "nextChapter": { "bookCode": "JHN", "chapter": 4 }
  }
}
```

---

### 2.4 Suggested Topics & Faith Prompts
Provides curated spiritual topics and sample prompts for homepage inspiration chips.

- **Endpoint**: `GET /api/v1/scripture/topics`
- **Auth**: Public
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "topic_anxiety",
      "category": "生活与心境",
      "label": "忧虑与重担",
      "prompt": "当我面对生活与工作的重担时，圣经有哪些关于平安与信靠的应许？",
      "icon": "HeartHandshake"
    },
    {
      "id": "topic_salvation",
      "category": "信仰探索",
      "label": "什么是恩典与救恩",
      "prompt": "基督信仰所说的『因信得救』和『重生』到底是什么含义？",
      "icon": "Cross"
    },
    {
      "id": "topic_forgiveness",
      "category": "人际与家庭",
      "label": "饶恕与和睦",
      "prompt": "受到不公与伤害时，耶稣教导我们如何去饶恕并化解怨恨？",
      "icon": "Users"
    }
  ]
}
```

---

### 2.5 RAG Answer Feedback (Quality Monitoring)
Enables users to provide helpful/unhelpful feedback on AI answers to fine-tune prompts and log missing scriptures.

- **Endpoint**: `POST /api/v1/scripture/feedback`
- **Auth**: Public
- **Request Body**:
```typescript
interface RAGFeedbackDto {
  conversationId: string;
  query: string;
  isHelpful: boolean;          // true = thumbs up, false = thumbs down
  feedbackCategory?: 'INACCURATE_CITATION' | 'NOT_RELEVANT' | 'HALLUCINATION' | 'OTHER';
  comment?: string;
}
```
- **Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "message": "Feedback submitted successfully"
}
```

---

### 2.6 Admin: Vector Re-indexing & Corpus Sync
Re-indexes the Bible corpus or syncs newly curated church sermon study notes.

- **Endpoint**: `POST /api/v1/admin/scripture/sync`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`)
- **Request Body**:
```typescript
interface ScriptureSyncDto {
  target: 'BIBLE_CORPUS' | 'SERMON_NOTES';
  version?: 'CUV' | 'CNV' | 'NIV';
  batchSize?: number;          // Default: 100
}
```
- **Response (`202 Accepted`)**:
```json
{
  "statusCode": 202,
  "data": {
    "taskId": "sync_task_20260914_001",
    "status": "QUEUED",
    "estimatedTimeSeconds": 45
  }
}
```

---

## 3. Newcomer Registration & Follow-up Module (`/api/v1/newcomers`)

### 3.1 Public Registration
Mobile-friendly registration via QR code without logging in.

- **Endpoint**: `POST /api/v1/newcomers/register`
- **Auth**: Public (Anti-abuse rate limit: 5 req/min per IP)
- **Request Body**:
```typescript
interface NewcomerRegisterDto {
  fullName: string;            // Required
  preferredName?: string;
  email?: string;              // Optional, creates welcome email task if present
  phone?: string;              // Optional
  preferredLanguage: 'CHINESE' | 'ENGLISH' | 'BILINGUAL';
  interestedFellowships?: string[]; // e.g. ["青年团契", "职场团契", "常青团契"]
  consentContact: boolean;     // Willing to be contacted by church volunteers
  subscribeUpdates?: boolean;
}
```

- **Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "data": {
    "id": "nc_cm7x82910f",
    "fullName": "张三",
    "welcomeMessage": "欢迎来到漢美頓懷恩堂！愿神的恩典与您同在。",
    "hasEmailTaskCreated": true,
    "serviceInfo": {
      "time": "主日 10:00 AM",
      "address": "55 Higgins Road, Frankton, Hamilton"
    }
  }
}
```

---

### 3.2 List Newcomer Registrations
- **Endpoint**: `GET /api/v1/newcomers`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`, `VOLUNTEER` with reception permission)
- **Query Parameters**:
  - `status`: `'PENDING_FOLLOWUP' | 'CONTACTED' | 'COMPLETED'`
  - `page`: number (default: 1)
  - `pageSize`: number (default: 20)
  - `search`: string (search by name/phone)
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "nc_cm7x82910f",
      "fullName": "张三",
      "email": "zhangsan@example.com",
      "phone": "021-1234567",
      "status": "PENDING_FOLLOWUP",
      "registeredAt": "2026-09-14T01:30:00.000Z",
      "assignedVolunteer": null,
      "isPotentialDuplicate": false
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 20 }
}
```

---

### 3.3 Update Follow-up Status & Assignee
- **Endpoint**: `PATCH /api/v1/newcomers/:id/followup`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`, authorized `VOLUNTEER`)
- **Request Body**:
```typescript
interface UpdateFollowupDto {
  status?: 'PENDING_FOLLOWUP' | 'CONTACTED' | 'COMPLETED';
  assignedVolunteerId?: string;
  notes?: string;
}
```
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "nc_cm7x82910f",
    "status": "CONTACTED",
    "assignedVolunteerId": "user_vol_007",
    "updatedAt": "2026-09-14T02:00:00.000Z"
  }
}
```

---

## 4. Calendar & Activity Management (`/api/v1/activities`)

### 4.1 List Activities (Calendar & Agenda View)
- **Endpoint**: `GET /api/v1/activities`
- **Auth**: Public (Returns only `visibility: 'PUBLIC'`), Bearer Token (Returns internal + public)
- **Query Parameters**:
  - `start`: ISO date string (e.g. `2026-09-01T00:00:00Z`)
  - `end`: ISO date string (e.g. `2026-09-30T23:59:59Z`)
  - `ministryId`: string (optional)
  - `status`: `'DRAFT' | 'PUBLISHED' | 'CANCELLED'` (authenticated only)
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "act_sun_worship_0920",
      "title": "主日崇拜 (Sunday Worship)",
      "description": "懷恩堂主日实体与在线联合崇拜",
      "startTime": "2026-09-20T10:00:00+12:00",
      "endTime": "2026-09-20T11:30:00+12:00",
      "location": "Main Sanctuary (大堂)",
      "ministry": "Worship Ministry",
      "visibility": "PUBLIC",
      "status": "PUBLISHED",
      "rosterSummary": {
        "totalDuties": 6,
        "confirmedDuties": 5,
        "unfilledDuties": 1
      }
    }
  ]
}
```

---

### 4.2 Create Activity
- **Endpoint**: `POST /api/v1/activities`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`, ministry coordinator)
- **Request Body**:
```typescript
interface CreateActivityDto {
  title: string;
  description?: string;
  startTime: string;           // ISO-8601
  endTime: string;             // ISO-8601
  location: string;
  ministryId: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  status: 'DRAFT' | 'PUBLISHED';
}
```
- **Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "data": { "id": "act_midweek_prayer", "status": "PUBLISHED" }
}
```

---

## 5. Volunteer Scheduling & Rostering (`/api/v1/rosters`)

### 5.1 Get Roster for Activity
- **Endpoint**: `GET /api/v1/rosters/activity/:activityId`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`, `VOLUNTEER`)
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "activityId": "act_sun_worship_0920",
    "assignments": [
      {
        "id": "asgn_01",
        "dutyName": "主席 (Leader)",
        "volunteerId": "usr_kristen",
        "volunteerName": "Kristen Dai",
        "status": "ACCEPTED",
        "confirmedAt": "2026-09-15T09:12:00Z"
      },
      {
        "id": "asgn_02",
        "dutyName": "司琴 (Pianist)",
        "volunteerId": "usr_charmaine",
        "volunteerName": "Charmaine Chang",
        "status": "PENDING",
        "confirmedAt": null
      }
    ]
  }
}
```

---

### 5.2 Confirm / Decline Assignment
Called when a volunteer clicks the confirmation link in their email or toggles status in their mobile portal.

- **Endpoint**: `POST /api/v1/rosters/assignments/:id/respond`
- **Auth**: Public with secure one-time action token OR Bearer Token
- **Request Body**:
```typescript
interface AssignmentRespondDto {
  token?: string;              // Action token from email link
  action: 'ACCEPT' | 'DECLINE';
  declineReason?: string;      // Optional reason if declining
}
```
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "assignmentId": "asgn_02",
    "status": "ACCEPTED",
    "updatedAt": "2026-09-15T10:00:00Z"
  }
}
```

---

### 5.3 Copy Previous Roster (Template Feature)
Duplicates duty slots and volunteer assignments from a past activity to reduce manual entry.

- **Endpoint**: `POST /api/v1/rosters/copy`
- **Auth**: Bearer Token (Roles: `ADMIN`, `PASTOR`, coordinator)
- **Request Body**:
```typescript
interface CopyRosterDto {
  sourceActivityId: string;
  targetActivityId: string;
  copyVolunteers: boolean;     // If true, populates volunteers in PENDING state
}
```
- **Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "data": {
    "copiedDutiesCount": 6,
    "assignedVolunteersCount": 6,
    "conflictWarnings": []
  }
}
```

---

## 6. Background Scheduled Tasks (`/api/v1/tasks`)

### 6.1 Process Due Notification Emails (External Cron Webhook)
Called by `cron-job.org` every 10 minutes to process due reminders and retry failed transactions.

- **Endpoint**: `POST /api/v1/tasks/process-emails`
- **Auth**: Secret Webhook Header (`x-cron-secret: <CRON_SECRET_TOKEN>`)
- **Response (`200 OK`)**:
```json
{
  "statusCode": 200,
  "data": {
    "processedWelcomeEmails": 2,
    "processedVolunteerReminders": 8,
    "failedRetried": 1,
    "executionTimeMs": 620
  }
}
```
