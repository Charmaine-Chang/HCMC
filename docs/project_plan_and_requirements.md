# HCMC Church Management System — Project Plan (with RAG Scripture Search)

## 1. Project Overview
Hamilton Chinese Methodist Church (漢美頓懷恩堂, referred to as HCMC) will establish an integrated public website and internal management system to improve newcomer registration and follow-up, church calendar management, volunteer scheduling, automated email notifications, and **AI-powered scripture search and faith inquiry using Retrieval-Augmented Generation (RAG)**. The goal is to reduce repetitive communication and manual record-keeping while centralising activity, volunteer information, and spiritual study resources.

The project will also serve as a portfolio project for both developers, demonstrating the complete development process from stakeholder interviews, system design, and modern GenAI integration to collaboration, deployment, and handover.

| Item | Description |
| :--- | :--- |
| **Development team** | Kristen Dai, Charmaine Chang |
| **Target users** | Church deacons, pastors, volunteers, church members, seekers, and visitors/newcomers |
| **Frontend language** | TypeScript (React) |
| **Backend language** | TypeScript (NestJS) |
| **Database** | MySQL (Aiven Free Tier) + Vector Database (Pinecone Free Tier / Qdrant Cloud Free) |
| **AI / RAG Stack** | Google Gemini `text-embedding-004` (Embeddings), Google Gemini 1.5/2.0 Flash (LLM Generation) |
| **Deployment requirement** | Use platforms offering free plans and remain within their free-tier limits |
| **MVP priorities** | Newcomer registration, church calendar, volunteer scheduling, automated email notifications, and **RAG-based scripture & faith search** |
| **Document scope** | Project objectives, features, permissions, technical approach, AI/RAG design, and deliverables; development schedules and user stories are excluded |

---

## 2. Background & Problem
According to the interview with the chair of the church's board of deacons, the church currently coordinates its ministries through Excel, Google Sheets, email, messaging tools, and paper records. Contacting volunteers, preparing rosters, and organising activities take considerable time. Changes to activities or volunteer assignments do not always reach everyone involved promptly. Changes in personnel have also made historical information difficult to locate.

The existing website contains extensive church information. Its redesign should make a clearer distinction between information needed by first-time visitors and management functions needed by church staff and volunteers.

In addition, seekers and members frequently look for biblical guidance on daily challenges (e.g., peace during anxiety, interpersonal forgiveness, marriage advice), but conventional scripture search tools require knowing exact keywords or specific book/chapter/verse numbers. Seekers often do not know where to begin, while group leaders and pastors spend considerable time compiling topical scriptures for fellowship discussions.

| Current problem | Impact on the church | Proposed improvement |
| :--- | :--- | :--- |
| Activity information is scattered | It is difficult to identify scheduled activities and their organisers | A central church calendar |
| Rosters rely on spreadsheets and manual communication | Repetitive work and difficulty tracking confirmations | Volunteer scheduling and confirmation |
| Updates are not communicated promptly | Volunteers may continue using outdated arrangements | Change notifications and sending records |
| Newcomer reception relies on manual processes | Registration, introductions, and follow-up can become disconnected | Newcomer registration and follow-up |
| Information becomes difficult to find after personnel changes | Handover requires additional effort | Central records and account permission handover |
| The homepage contains too much information | Newcomers may struggle to find essential details | A simplified homepage and clear navigation |
| **Rigid scripture lookup & lack of faith exploration tools** | **Seekers struggle to find answers to life questions; group leaders spend excessive time gathering verses** | **RAG-based Scripture & Faith Search (Semantic search, topical exploration, and grounded biblical Q&A)** |

---

## 3. Project Objectives

### Church Objectives
1. Allow newcomers to register through a QR code on their phones and easily access church information.
2. Provide deacons, pastors, and authorised volunteers with a shared calendar.
3. Help coordinators identify who is responsible for each duty and whether they have confirmed.
4. Automatically send welcome emails, assignment notifications, reminders, and change notifications.
5. **Enable seekers and church members to search scriptures semantically and ask faith-related questions, receiving grounded, hallucination-free biblical answers with exact chapter/verse citations.**
6. Maintain central records for future reference and handover.
7. Protect personal information through role-based access.

### Learning & Portfolio Objectives
1. Translate real stakeholder interviews into clear requirements and system designs.
2. Build a full-stack application using TypeScript and MySQL.
3. Practise collaborative development, code reviews, testing, and continuous integration.
4. Demonstrate access control, relational database design, and reliable email processing.
5. **Demonstrate modern GenAI engineering: vector indexing, semantic embeddings, hybrid retrieval, anti-hallucination prompt engineering, and Server-Sent Events (SSE) streaming.**
6. Deliver an accessible, demonstrable, and documented application with clear evidence of each developer's contributions.

---

## 4. Users & Permissions
The system will support six user categories. "Admin / Church Deacon" is provisionally treated as one administrative role. Specific permissions will be confirmed with the church.

| User category | MVP features and permissions |
| :--- | :--- |
| **Admin / Church Deacon** | Manage accounts and permissions, church-wide activities, rosters, newcomer registrations, notification settings, RAG index/corpus maintenance, and audit records |
| **Pastor** | View relevant activities and volunteer arrangements, manage assigned activities, access authorised newcomer follow-up information, and review scripture search queries/curated spiritual answers |
| **Volunteer** | View and confirm personal assignments; manage ministry activities, rosters, or newcomer reception when authorised |
| **Church Member** | View activities available to members, maintain personal details and notification preferences, and perform unlimited scripture search and RAG Q&A |
| **Seeker** | View public activities and activities available to seekers, maintain personal details, and use interactive scripture & faith Q&A |
| **Visitor / Newcomer** | Browse public information, register through a QR code, access welcome information without logging in, and perform public scripture queries (rate-limited by IP/session) |

### Permission Design Principles
- A person's church status and their responsibilities will be recorded separately.
  - Church status: Newcomer, seeker, or member.
  - Responsibilities: Volunteer, pastor, or admin.
  - Authorisation scope: Assigned ministry, activities, and newcomer reception responsibilities.
- A visitor is someone browsing without logging in and does not automatically require an account. Newcomer registration will not automatically grant membership or classify every non-member as a seeker.
- All access permissions will be enforced by the backend. Newcomer information will only be available to authorised reception and management personnel.
- **Scripture search is publicly accessible to support evangelism and seekers, but query rate limits (IP/Token-based) will prevent AI API quota exhaustion.**

---

## 5. MVP Scope

### 5.1 Newcomer Registration & Follow-up
- Newcomers can scan a QR code to open a mobile-friendly registration form without logging in.
- Suggested fields include name or preferred name, optional email, optional phone number, preferred language, fellowships of interest, and willingness to be contacted by a church volunteer.
- After successful registration:
  - A confirmation page displays essential church information.
  - A welcome email task is created if an email address was provided.
  - Authorised reception volunteers can view the registration.
  - Reception volunteers can assign a follow-up person and update the status to "Pending Follow-up," "Contacted," or "Completed."
  - Potential duplicate registrations are flagged rather than automatically merged.

### 5.2 Church Calendar
- Coordinators can create, edit, publish, and cancel activities, recording:
  - Activity name and description, start/end times, location, ministry, coordinator, visibility, and status (Draft, Published, Cancelled).
- The system will provide a monthly calendar and a mobile-friendly activity list. Public pages will display only public activities. Times will be displayed in New Zealand Pacific/Auckland time zone with daylight saving handled correctly.

### 5.3 Volunteer Scheduling
- Rosters will be linked to specific activities. Coordinators can define duties, assign volunteers, and view confirmation statuses: Pending, Accepted, or Declined.
- Supports assigning volunteers, viewing unfilled duties, accepting/declining assignments, checking for overlapping assignments for the same person, and copying previous activities and rosters.
- Copied assignments will require fresh confirmation, and conflicts will be checked again before publication.

### 5.4 Automated Email Notifications
- Transactional emails for: Welcome email (registration), Assignment notification (roster published), Volunteer reminder (48 hours before activity), and Change/cancellation notification.
- Database-backed task table for retries, deduplication, and sending status tracking.

### 5.5 Public Website & Internal Dashboard
- Public homepage: Church name, welcome message, service times and locations, newcomer registration, upcoming public activities, fellowship links, and contact map.
- Internal dashboard: Personal assignments, pending confirmations, upcoming activities, unfilled duties, newcomer follow-up, and email failure monitoring.

### 5.6 RAG-based Scripture & Faith Search (NEW)
- **Corpus & Bible Versions**:
  - Chinese Union Version (和合本 - CUV) as primary, with support for Chinese New Version (新译本 - CNV) and English NIV/ESV.
  - Pre-indexed ~31,102 verses with chapter/paragraph context chunking.
- **Hybrid Retrieval Strategy**:
  - *Direct Reference Match*: Instant regex match for exact verse requests (e.g., "约3:16", "约翰福音 3:16", "John 3:16") routing directly to standard SQL/cached lookup.
  - *Semantic Topic Search*: Vector embedding search for thematic queries (e.g., "面对焦虑的安慰", "如何化解人际冲突", "关于浸礼与重生的教导").
- **Grounded Answer Generation (RAG)**:
  - Contextual response generation constrained strictly to retrieved biblical texts.
  - Compulsory verse citations (e.g., `[腓立比书 4:6-7]`) displayed as clickable pills leading to full-chapter reading view.
  - Explicit system prompt instructions to prevent theological hallucination or speculative preaching.
- **Seeker & Member Experience**:
  - Topic chips / spiritual cards ("关于爱与饶恕", "面对工作压力", "何为洗礼").
  - Response streaming (Server-Sent Events) to minimize perceived latency on free-tier LLM models.
  - Context drawer: read previous/next verses and view cross-references.

---

## 6. Out of Scope
The following features are reserved for future development:
- Donations, finance, and accounting
- Comprehensive membership records and complex family relationships
- Attendance tracking and statistical reports
- Children's check-in
- Private prayer requests and pastoral care notes
- Automatic scheduling and volunteer-managed duty swaps
- WeChat, WhatsApp, and other messaging integrations
- Promotional email campaigns and automated promotional content
- Multi-modal audio/video sermon automatic transcription and indexing
- A song library or replacement for Proclaim
- Large-scale migration of historical content and records

---

## 7. Technical Approach
The project will use a modular monolithic architecture with separate frontend and backend applications, keeping development and maintenance manageable for two developers.

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript + Vite | Public website, management interface, and conversational scripture search UI |
| **Backend** | NestJS + TypeScript | APIs, authentication, permissions, email tasks, and RAG pipeline |
| **Data Access** | Prisma | Data models, relational queries, and migrations |
| **Database** | MySQL (Aiven Free Tier) | People, activities, assignments, notification records, scripture texts |
| **Vector Storage** | Pinecone Free Tier / Qdrant Cloud Free | High-dimensional vector index for ~31,100 Bible verses (CUV/NIV) |
| **LLM & Embeddings** | Google Gemini 1.5/2.0 Flash + `text-embedding-004` (Free Tier on AI Studio) | Semantic vector embeddings and grounded streaming answer synthesis |
| **Email** | Resend API | Transactional emails |
| **Scheduled Processing** | External scheduled requests (cron-job.org) + database task table | Due notifications and failed-task retries |
| **Version Control & CI** | Git + GitHub Actions | Collaboration, code review, automated builds and tests |

---

## 8. Free Deployment
The MVP will use the following proposed free services:

| Service | Platform | Free Tier Quotas & Constraints |
| :--- | :--- | :--- |
| **Frontend static website** | Render Static Site / Vercel | Global CDN, high bandwidth within hobby tier |
| **Backend API** | Render Free Web Service | May spin down after 15 min inactivity (cold start ~50s) |
| **MySQL database** | Aiven for MySQL Free | 1 CPU, 1 GB RAM, 5 GB storage |
| **Vector database** | Pinecone Starter / Qdrant Cloud Free | 1 index, up to 100k vectors, 1 GB cluster (Bible is ~31k verses, fits easily) |
| **LLM & Embeddings** | Google AI Studio (Gemini Free Tier) | 15 RPM, 1M TPM, 1,500 Requests/Day |
| **Email delivery** | Resend Free | 100 emails/day, 3,000 emails/month |
| **Scheduled triggers** | cron-job.org | Free external webhook ping every 5–15 minutes |

*Cold Start & Quota Mitigation*:
- Render cold starts will be handled via graceful frontend loading states and SSE heartbeats.
- RAG vector size for the entire Bible is only ~100MB, safely within limits.
- cron-job.org acts as both a scheduled task runner and an awake-pinger for the Render web service.

---

## 9. Team Collaboration — Proposed Division

| Allocation | Proposed responsibilities |
| :--- | :--- |
| **Developer A** | - Newcomer registration, follow-up, and public homepage<br>- Authentication, RBAC permissions, and shared UI component library<br>- **Scripture Search frontend UI (Search bar, topic chips, streaming answer card, verse citation pills, context drawer)** |
| **Developer B** | - Calendar, volunteer scheduling, and confirmation module<br>- Database schema migrations, cron email tasks, and deployment<br>- **RAG backend pipeline (Bible corpus ingestion, vector embeddings script, hybrid search engine, prompt engineering, NestJS SSE controller)** |
| **Shared** | Requirements, data models, API agreements, code reviews, integration testing, church acceptance, and handover documentation |

---

## 10. Quality, Safety & Data Protection
- Mobile responsiveness across all devices for registration, calendar, rosters, and scripture search.
- Backend enforcement of role and ministry-level permissions.
- Contact information and church status will not be exposed publicly.
- **Doctrinal Safety & Grounding**: LLM prompt enforces strict biblical fidelity; queries not related to scripture or Christian faith are politely declined.
- **Anti-Hallucination Constraints**: The system must explicitly state when no relevant biblical passage is found, rather than inventing verses or interpretation.
- **Abuse Prevention & Rate Limiting**: Limit public scripture queries (10 req/min/IP) to protect API quotas.
- Database backup and recovery procedures will be established and tested.
- Portfolio demonstrations will use fictional user data, isolated from real church information.

---

## 11. Validation & Success Criteria
1. A newcomer can register on a phone, their information is saved correctly, and providing an email triggers a welcome email task.
2. Authorised reception volunteers can view and follow up with newcomers; others cannot access without permission.
3. A coordinator can create an activity, assign duties, and publish a roster with conflict detection.
4. Volunteers can accept or decline assignments via email links or dashboard.
5. **A user can search by concept (e.g. "面对焦虑的安慰"), receiving relevant verses within 3 seconds, with clickable references that open the full chapter context.**
6. **Exact reference searches (e.g. "约翰福音 3:16", "John 3:16") return instantaneous exact matches without calling expensive LLM inference.**
7. The system operates stably within the free limits of Render, Aiven, Pinecone, Resend, and Gemini API.

---

## 12. Deliverables
1. An accessible public website and internal management system.
2. Complete full-stack source code with records of both developers' contributions.
3. A database relationship diagram (ERD) and Prisma migration files.
4. **Vector index creation scripts, Bible corpus dataset (CUV/CNV/NIV), and RAG evaluation benchmark of 30 common faith questions.**
5. Role and permission documentation.
6. API documentation (OpenAPI/Swagger) and key technical decisions.
7. Automated tests and test results.
8. Free deployment, configuration, backup, and recovery instructions.
9. User guides for church administrators and volunteers.
10. A portfolio demonstration using fictional data and church pilot feedback.

---

## 13. Items to Confirm
- The official project name and whether Admin and Church Deacon represent the same role.
- Activity visibility and personal information access for each role.
- Newcomer form fields, church status confirmation, and follow-up responsibilities.
- Default preferred Bible translation (和合本 CUV vs. 新译本 CNV).
- Ownership and administration of the church domain, sender address, and deployment accounts.
- The first pilot ministry and the church's acceptance contact.

---

## 14. Project References
- Church stakeholder interviews and requirements confirmed during project discussions.
- [HCMC's existing website](https://hcmc.nz/)
