In the context of the **HCMC Church Management System**, data governance is critical because churches handle sensitive personal data (newcomers' contact details, spiritual statuses, pastoral follow-up notes, and volunteer records). Furthermore, as the church operates in New Zealand, the system must comply with the **New Zealand Privacy Act 2020 (13 Information Privacy Principles / IPPs)**.

Here is a comprehensive framework showing how data governance is ensured across **regulatory compliance, system architecture, RAG/AI boundaries, data lifecycle, and portfolio safety**:

---

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          HCMC DATA GOVERNANCE PILLARS                         │
├──────────────────┬──────────────────┬────────────────────┬────────────────────┤
│  1. Regulatory   │   2. Access &    │   3. AI & RAG      │    4. Portfolio    │
│  (NZ Privacy Act)│  Architecture    │    Governance      │    Data Safety     │
├──────────────────┼──────────────────┼────────────────────┼────────────────────┤
│ • Purpose notice │ • Strict RBAC    │ • Zero-PII to LLM  │ • Seeded mock data │
│ • Consent split  │ • Field-masking  │ • Query anonymize  │ • DB isolation     │
│ • Right to erase │ • One-time tokens│ • Guarded prompts  │ • Secret masking   │
│ • Retention caps │ • Audit logging  │ • Truthful sources │ • Git sanitization │
└──────────────────┴──────────────────┴────────────────────┴────────────────────┘
```

---

### 1. Regulatory Alignment (New Zealand Privacy Act 2020)

| Privacy Principle (IPP) | How HCMC Implements It |
| :--- | :--- |
| **IPP 1 & 2: Purpose & Source** | Only collect what is directly necessary on the registration form (`fullName`, `preferredLanguage`, optional `email`/`phone`). No invasive spiritual history or financial data collected upfront. |
| **IPP 3: Collection Notice & Transparency** | The newcomer form includes a clear disclosure notice explaining exactly *who* will see the data (authorized reception volunteers) and *why* (welcome email & follow-up). |
| **IPP 4: Fair & Lawful Collection** | Explicit checkbox consent. **Separate opt-ins** for "pastoral contact" vs. "future church newsletters/promotions". |
| **IPP 5: Storage & Security** | TLS in transit (HTTPS/SSL), encrypted at rest in Aiven MySQL, bcrypt-hashed credentials, zero frontend database access. |
| **IPP 6 & 7: Access & Correction** | Members and newcomers can request view or correction of their personal profile via the deacon/admin portal. |
| **IPP 9: Retention Limits** | Stale newcomer records (e.g., registered but uncontacted after 12 months) are flagged for automated archival or pruning. |

---

### 2. Architectural & Access Governance (RBAC & Least Privilege)

#### A. Separation of Status vs. Responsibility
In the database schema, a person’s **church status** (`NEWCOMER`, `SEEKER`, `MEMBER`) is strictly decoupled from their **system responsibility** (`VOLUNTEER`, `PASTOR`, `ADMIN`):
- A visitor scanning a QR code is **not** granted an account.
- Being a church member does **not** grant access to other members' phone numbers or newcomer logs.

#### B. Field-Level Data Masking & API Guards
In NestJS, use interceptors and DTO serialization (`@Exclude()`, `@Expose()`) to prevent leaking PII:
- **Public endpoints** (e.g. `GET /api/v1/activities`) strip out all volunteer phone numbers and email addresses, returning only the public display names.
- **Newcomer endpoints** (`GET /api/v1/newcomers`) require the `@Roles('ADMIN', 'PASTOR', 'RECEPTION_LEAD')` guard.

#### C. Passwordless, Scoped Action Tokens for Volunteers
Instead of giving every volunteer an account or sending insecure open links:
- Email roster confirmation links use **short-lived HMAC-signed tokens** (e.g., `?token=eyJhbG...`).
- The token is cryptographically restricted to a single action: `ACCEPT` or `DECLINE` on that specific duty assignment. It cannot be reused to access any other church data.

#### D. Comprehensive Audit Logging (`AuditLog`)
Every mutation on sensitive records is recorded in an immutable audit table:
```typescript
interface AuditLog {
  id: string;
  actorId: string;       // User ID of Admin/Pastor
  action: 'VIEW_PII' | 'UPDATE_STATUS' | 'ASSIGN_VOLUNTEER' | 'DELETE_RECORD';
  entity: 'NEWCOMER' | 'USER' | 'ROSTER';
  entityId: string;
  ipAddress: string;
  timestamp: Date;
}
```

---

### 3. AI & RAG Data Governance (Zero-PII & Doctrinal Fidelity)

When integrating LLMs (Google Gemini) and vector databases, data leakage is a primary risk.

#### A. The "Zero-PII to LLM" Rule
* **The LLM is NEVER given access to church member databases.**
* The vector store (`Pinecone` / `Qdrant`) **only indexes public, canonical Bible texts** (CUV, CNV, NIV) and approved church sermon study outlines.
* Personal newcomer info, prayer requests, and contact rosters never enter the embedding or prompt generation pipeline.

#### B. Anonymized Query Logging
* Public users searching for scriptures generate an entry in `RagQueryLog`.
* The log records the query and retrieved verse IDs for quality evaluation, but **strips IP addresses and personal identifiers** after 30 days.

#### C. Theological Guardrails & Anti-Hallucination
* The system prompt strictly bounds the LLM:
  > *"Answer strictly from the provided Bible context. Every statement must cite a verse in brackets [Book Chapter:Verse]. If the verses do not address the question, decline to answer and direct the user to pastoral care."*
* Grounding evaluation: A test suite of 30 benchmark faith questions is verified during CI/CD to prevent theological drift or hallucinated citations.

---

### 4. Data Lifecycle Management & Deletion

1. **Soft Delete vs. Hard Delete**:
   - Deleting an activity or user marks `deletedAt: TIMESTAMP` so historical roster records don't break relational integrity (Foreign Key constraints).
   - If a newcomer invokes their **Right to be Forgotten**, a dedicated `anonymizeNewcomer(id)` service overwrites PII (`fullName = "Anonymous"`, `email = null`, `phone = null`) while preserving aggregate statistical counts for church ministry review.
2. **Automated Log Expiry**:
   - `EmailTask` success logs expire after 90 days.
   - Temporary email action tokens expire as soon as the activity starts.

---

### 5. Portfolio & Public Demo Isolation (Critical for Developers)

Because this project will be showcased on GitHub and in your personal portfolios:
1. **Strict Mock Data Seeders (`prisma/seed.ts`)**:
   - Never use real church members' names, phone numbers, or emails in development or demonstrations.
   - Use standardized fictional names (e.g., *"John Smith"*, *"张三"*, *"021-000-0000"*, `*@example.com`).
2. **Repository Sanitization (`.gitignore`)**:
   - All `.env`, `.env.production`, database connection strings, and Resend/Gemini API keys are strictly excluded from Git.
3. **Isolated Environments**:
   - `Development/Demo Database`: Free Aiven MySQL instance populated with synthetic seed data for interviews and portfolio viewers.
   - `Production Database`: Managed separately under the church’s own credentials upon handover.

---

### Summary Table for Stakeholder Discussions

| Risk Area | Governance Policy | Technical Enforcement |
| :--- | :--- | :--- |
| **Newcomer Privacy** | Strict need-to-know access | NestJS RBAC Guards + DTO field stripping |
| **Volunteer Links** | Prevent unauthorized duty tampering | Cryptographic short-lived HMAC action tokens |
| **AI Data Leakage** | No personal data sent to external AI | Vector DB stores only Bible texts; LLM prompt is isolated |
| **NZ Privacy Law** | IPP 1–13 compliance & consent clarity | Separate checkboxes for pastoral contact & news updates |
| **Developer Portfolio**| Zero real-world congregation exposure | Seeded fictional datasets + sanitized `.gitignore` |

These policies provide full assurance to the church deacons that congregation data is treated with utmost reverence, while demonstrating enterprise-grade engineering rigor in your portfolio.