# ONCA — System Constitution & Build Instructions

This file defines how ONCA must be built, reasoned about, extended, and maintained.  
It is mirrored across AI environments to ensure consistent behavior, architecture, and decision-making.

You are not “building features.”  
You are operating a financial system.

Mistakes compound.  
Ambiguity causes silent failure.  
This document exists to prevent both.

---

## 1. What ONCA Is (Non-Negotiable Definition)

ONCA is an AI-first financial operating system for small and mid-sized businesses (SMEs).

### It is not:
- an accounting clone  
- a bank dashboard  
- a compliance filing tool  
- a chatbot wrapped around PDFs  

### ONCA exists to:
- unify fragmented financial data  
- reduce repetitive data entry  
- create continuity across financial workflows  
- explain financial reality in plain language  
- do so without owning or corrupting the source data  

ONCA is a layered system, not a monolith.

---

## 2. Who ONCA Is Built For (SME Only)

### Primary User:
-   Indian SMEs and small businesses
-   Solopreneurs / Freelancers with business income
-   Already tracking finances in:
    -   Google Sheets
    -   Excel
    -   PDFs (invoices, bills, statements)

### Explicitly Excluded:
-   Chartered Accountants (CAs) as admins
-   Demo / Test users
-   Personal finance (individual non-business users)
-   Direct bank integrations (for MVP)
-   Government filing APIs  

This focus is intentional:
- SMEs generate structured data  
- SMEs have willingness to pay  
- SMEs create repeatable workflows  
- SMEs allow steady, compounding growth (not hype-driven spikes)

---

## 3. ONCA’s Core Philosophy

### 3.1 Determinism > Intelligence

LLMs are probabilistic.  
Finance is not.

Therefore:
- AI never creates financial truth  
- AI never mutates core data  
- AI only explains, summarizes, and guides  

Truth is derived deterministically.

---

### 3.2 ONCA Does Not Replace Existing Tools

ONCA integrates with:
- Google Sheets  
- existing workflows  
- existing documents  

ONCA is a control plane, not a forced migration.

Users should never feel:

> “I must abandon my current system to use ONCA.”

---

### 3.3 Continuity Over Features

ONCA’s advantage is not feature count.  
It is memory + reuse + continuity.

Once data enters ONCA:
- it should never be re-entered  
- it should be reused everywhere  
- it should compound in value over time  

---

## 4. The 3-Layer Operating Model (Mandatory)

ONCA follows a strict separation of concerns.

### Layer 1: Directive (Intent)
- High-level goals  
- SOP-style instructions  
- Human-readable reasoning  
- Lives conceptually as what should happen  

### Layer 2: Orchestration (Decision-Making)
- This is the AI agent  
- Reads directives  
- Routes tasks  
- Sequences actions  
- Handles errors  
- Never performs heavy logic itself  

### Layer 3: Execution (Deterministic Work)
- Code only  
- No guessing  
- No interpretation  
- Idempotent and testable  

If logic becomes complex → it belongs in execution, not orchestration.

---

## 5. ONCA’s Layered System Architecture

You must reason about ONCA as a vertical stack:

Presentation Layer

Orchestration Layer

Intelligence Layer (AI)

Derivation & Logic Layer

Normalization Layer

Ingestion Layer

Source Layer (User-Owned Data)

Each layer:
- has one responsibility  
- communicates only with adjacent layers  
- can fail independently  

---

## 6. Data Flow (Canonical Path)

Every ONCA interaction follows this flow:

User Action
→ API Route
→ Ingestion
→ Normalization
→ Storage
→ Derivation
→ AI Interpretation
→ User Response

If a feature does not fit this flow, it is incorrectly designed.

---

## 7. Source Layer (User-Owned Data)

### What Lives Here
- Google Sheets  
- Uploaded PDFs  
- CSV files  
- Images of receipts/invoices  

### Rules
- ONCA never mutates source data  
- ONCA treats source data as immutable truth  
- ONCA stores references, not ownership  

This layer is outside ONCA’s control by design.

---

## 8. Ingestion Layer (Trust Boundary)

This is where external data becomes internal.

### Responsibilities
- Authenticate source (e.g., Google OAuth)  
- Fetch or receive files  
- Validate format and size  
- Store raw artifacts securely  
- Record ingestion metadata  

### Why This Exists

Without ingestion:
- parsing errors leak downstream  
- debugging becomes impossible  
- reprocessing cannot happen safely  

Ingestion is a receipt, not a transformation.

---

## 9. Normalization Layer (Meaning Extraction)

Normalization converts files into financial primitives.

### Examples:
- PDF → Invoice  
- Sheet row → Expense  
- CSV → Transaction list  

### Key Rules
- Raw data is never modified  
- Normalization can fail safely  
- Normalization can be retried  
- Confidence and provenance are tracked  

This layer is where “documents” become “data.”

---

## 10. Storage Layer (System Memory)

ONCA maintains three classes of storage.

### 10.1 Raw Storage
- Encrypted files  
- Original documents  

**Purpose:** auditability, trust, reprocessing

---

### 10.2 Structured Financial Tables
- expenses  
- invoices  
- balances  
- counterparties  

**Purpose:** correctness, relationships, reporting

---

### 10.3 Derived / Cached Tables
- dashboards  
- summaries  
- aggregates  

**Purpose:** speed only  
These can always be recomputed.

---

## 11. Derivation & Logic Layer (Financial Truth Engine)

This layer:
- calculates totals  
- computes balances  
- generates reports  
- validates consistency  

### Constraints
- No AI  
- No raw documents  
- Deterministic logic only  

This is the source of truth.

---

## 12. Intelligence Layer (AI, Strictly Scoped)

AI exists to:
- explain results  
- surface insights  
- guide users  
- answer questions  

AI does not:
- create transactions  
- alter numbers  
- write to financial tables  

AI is an interpreter, never an author.

---

## 13. Orchestration Layer (Routing & Control)

This layer:
- sequences ingestion → normalization → derivation → AI  
- manages async jobs  
- enforces permissions  
- handles retries and failures  

It contains no business logic, only flow control.

---

## 14. Presentation Layer (Frontend)

### Frontend responsibilities:
- display state  
- collect intent  
- show progress  
- render explanations  

### Frontend never:
- computes truth  
- stores critical logic  

If the UI breaks, ONCA should still function.

---

## 15. Routing Philosophy (Critical Guardrail)

Routes map to system actions, not screens.

### Bad:

/getDashboard

### Good:

/ingest/google-sheet
/normalize/invoice
/derive/cash-balance
/ai/explain

UI changes.  
System actions persist.

---

## 16. Project Structure (Canonical)

/apps
/web          # Next.js frontend
/api          # Server entrypoints

/core
/ingestion
/normalization
/derivation
/intelligence
/orchestration

/db
schema.sql
migrations/

/lib
auth
encryption
logging

/config
env
constants

This structure is not aesthetic.  
It is defensive engineering.

---

## 17. Performance & Scalability Rules
- Heavy work is async  
- Parsing is queued  
- AI calls are downstream  
- Derived data is cached  
- Raw data is immutable  

Users should see:

> “Processing” — never freezing.

---

## 18. Security & Isolation
- Organization-level data isolation  
- Role-based access  
- Encryption at rest  
- Minimal AI data exposure  

AI never sees:
- credentials  
- raw documents  
- unnecessary identifiers  

---

## 19. MVP Reality Check (Expectations)

For MVP:
- Google Sheets integration  
- Document upload + parsing  
- Basic derivations (cash, expenses, P&L)  
- AI explanations  
- No bank sync  
- No government APIs  
- No filing  

This is intentional.  
Speed > completeness.

---

## 20. Final Operating Principles
- Data flows downward  
- Truth is deterministic  
- AI explains, never decides  
- Structure protects velocity  
- Simplicity enables scale  

If a decision violates these principles, it is wrong.

---

# BUILD DIRECTIVES — ONCA  
*(Authoritative Instruction Set for System Construction)*

---

## Directive 01: System Initialization & Repo Setup

### Objective
Initialize ONCA in a way that prevents architectural decay and allows incremental scaling without rewrites.

### Why This Exists
Most startups fail not because of features, but because:
- early shortcuts harden into constraints  
- logic leaks across layers  
- MVP code becomes production code by accident  

This directive prevents that.

### Instructions
1. Initialize the repository with layer-first thinking, not feature-first.  
2. Enforce directory separation strictly:
   - UI code never contains business logic  
   - API routes never contain financial calculations  
   - AI logic never mutates data  
3. Configure environment variables before writing logic.  
4. Do not scaffold unused features “for later.”

### Guardrails
- No direct database calls from frontend  
- No AI calls from UI components  
- No logic duplication across layers  

---

## Directive 02: Authentication & Org Isolation

### Objective
Ensure every piece of data in ONCA is scoped to an organization and user role from day one.

### Why This Exists
Retrofitting auth and isolation later is expensive and dangerous—especially in finance.

### Instructions
1. Use Supabase Auth for user authentication.  
2. Every user belongs to:
   - exactly one organization (MVP constraint)  
3. Every table must include:
   - org_id  
   - created_at  
4. Enforce Row-Level Security (RLS) at the database level.

### Guardrails
- Never trust frontend role checks  
- Never expose cross-org data even to admins  
- Never bypass RLS “temporarily”  

---

## Directive 03: Data Source Integration (Google Sheets)

### Objective
Allow businesses to connect existing Google Sheets without changing their workflow.

### Why This Exists
ONCA must integrate, not replace.  
Google Sheets is the dominant SME financial tool in India.

### Instructions
1. Implement OAuth-based Google Drive access.  
2. Allow users to:
   - select specific Sheets  
   - map columns to financial concepts  
3. Store:
   - sheet metadata  
   - last sync timestamp  
   - column mappings  
4. Never copy entire Sheets into ONCA DB.

### Guardrails
- Read-only access for MVP  
- No auto-editing of user Sheets  
- All syncs must be idempotent  

---

## Directive 04: Document Upload & Vault

### Objective
Securely ingest financial documents without exposing raw files unnecessarily.

### Why This Exists
Documents are sensitive, large, and error-prone.  
They must be treated as immutable artifacts.

### Instructions
1. Accept uploads:
   - PDF  
   - CSV  
   - XLSX  
   - Image formats  
2. Encrypt files at rest.  
3. Store only references in DB.  
4. Record ingestion metadata:
   - source  
   - type  
   - timestamp  
   - status  

### Guardrails
- Never pass raw documents to AI  
- Never parse documents synchronously  
- Never overwrite raw files  

---

## Directive 05: Normalization Pipeline

### Objective
Convert raw inputs into structured financial primitives safely and repeatably.

### Why This Exists
Parsing fails. Normalization must be retryable and auditable.

### Instructions
1. Create normalization jobs per document/source.  
2. Extract:
   - dates  
   - amounts  
   - entities (vendor/customer)  
3. Apply schema validation.  
4. Store normalized outputs separately from raw data.

### Guardrails
- No silent failures  
- No assumptions about format  
- Normalization never modifies raw artifacts  

---

## Directive 06: Financial Derivation Engine

### Objective
Compute financial truth deterministically.

### Why This Exists
AI explanations are useless if numbers are unreliable.

### Instructions
1. Implement deterministic functions for:
   - cash balance  
   - expenses  
   - basic P&L  
2. Inputs must come only from structured tables.  
3. Cache derived results for dashboards.

### Guardrails
- No AI usage here  
- No frontend calculations  
- No hidden state  

---

## Directive 07: AI Intelligence Layer

### Objective
Explain and guide—never decide.

### Why This Exists
LLMs hallucinate. Finance cannot.

### Instructions
1. Feed AI:
   - structured data  
   - derived summaries  
   - metadata  
2. Use AI for:
   - explanations  
   - insights  
   - warnings  
3. Log AI inputs/outputs for auditability.

### Guardrails
- AI cannot write to DB  
- AI cannot change values  
- AI cannot bypass logic layers  

---

## Directive 08: AI Assistant (Conversational Interface)

### Objective
Provide a single conversational entry point into ONCA.

### Why This Exists
Users think in questions, not dashboards.

### Instructions
1. Assistant reads from:
   - derivation layer  
   - compliance rules  
2. Assistant routes requests to correct system action.  
3. Assistant explains why, not just what.

### Guardrails
- Assistant never executes logic directly  
- Assistant never fabricates data  
- Assistant must surface uncertainty clearly  

---

## Directive 09: Compliance Simulation (MVP Scope)

### Objective
Simulate compliance understanding without filing or government APIs.

### Why This Exists
Regulatory APIs are expensive and slow to integrate.

### Instructions
1. Encode GST/TDS rules as:
   - static rules  
   - deterministic checks  
2. Compare user data against rules.  
3. Output:
   - warnings  
   - missing data  
   - preparation guidance  

### Guardrails
- No submission  
- No claims of legal filing  
- Always include disclaimers  

---

## Directive 10: Performance & UX Discipline

### Objective
Ensure ONCA feels fast, even when work is heavy.

### Why This Exists
Perceived slowness kills trust.

### Instructions
1. Use async jobs for:
   - parsing  
   - AI calls  
2. Show progress states.  
3. Cache derived data aggressively.

### Guardrails
- Never block UI on heavy tasks  
- Never re-parse unnecessarily  
- Never load unused data  

---

## Directive 11: MVP Discipline

### Objective
Ship something real in hours, not months.

### Why This Exists
ONCA must validate value before expanding scope.

### Instructions
1. Prioritize:
   - Sheets integration  
   - Document upload  
   - Cash + expense views  
   - AI explanations  
2. Defer:
   - bank sync  
   - filing  
   - CA workflows  
3. Build extensibility, not completeness.

### Guardrails
- No “future-proofing” bloat  
- No unused abstractions  
- No premature optimizations  

---

## Directive 12: OCR & Document Upload — Frontend & Backend

### Objective
Enable SMEs to upload invoices, bills, receipts, and expense documents, and optionally extract structured data via OCR for tracking payables, receivables, and expenses.

### Frontend Responsibilities

#### Why This Exists
Users need an intuitive interface to submit documents, verify OCR results, and categorize data without friction. A smooth UI reduces input errors and increases adoption.

#### Instructions
1.  **Upload Interface**
    -   Allow camera capture (mobile) and file selection (desktop).
    -   Supported formats: PDF, CSV, XLSX, JPG, PNG.
    -   Allow drag-and-drop functionality.
    -   Show upload progress and status for each file.
2.  **Document Categorization**
    -   Side-panel navigation with tabs:
        -   **Invoices**
        -   **Receivable** (invoices expected to be received)
        -   **Payable** (invoices to pay)
        -   **Bills / Receipts** (company expenses)
    -   Allow user to assign category before or after upload.
3.  **Preview & OCR Verification**
    -   After upload and OCR extraction:
        -   Highlight extracted fields: Date, Amount, Vendor/Customer, Document Number.
        -   Allow inline correction before saving.
        -   Provide error/warning indicators for missing or ambiguous fields.
4.  **Manual Entry Option**
    -   Users can add documents manually in case OCR fails or document is not digital.
    -   Fields: Amount, Date, Vendor / Customer, Invoice / Receipt Number, Notes.
5.  **Metadata & Traceability**
    -   Each document shows:
        -   Upload timestamp
        -   Upload source (manual / camera / file)
        -   OCR status (pending / success / failed)
6.  **UX & Performance**
    -   Async upload with non-blocking UI.
    -   Display progress bars and success/failure notifications.
    -   Ensure uploaded files do not freeze the interface.

#### Guardrails
-   No AI writes or overwrites user input.
-   OCR suggestions are editable; user edits take priority.
-   Uploads must be idempotent; re-uploading the same file does not create duplicates.
-   Files should be temporarily stored locally for preview but always sent to backend for persistent storage.

### Backend Responsibilities

#### Why This Exists
OCR processing, storage, and metadata management must be deterministic, secure, and auditable. AI may assist with extraction but cannot alter truth.

#### Instructions
1.  **File Storage**
    -   Encrypt files at rest.
    -   Store files in a secure cloud bucket or database reference.
    -   Maintain raw file immutability.
2.  **Ingestion & OCR**
    -   Receive uploaded files via API route (`/api/upload/document`).
    -   Validate file type, size, and integrity.
    -   Trigger OCR processing pipeline asynchronously:
        -   Extract fields: Date, Amount, Vendor/Customer, Invoice/Receipt number.
        -   Track confidence scores and provenance metadata.
3.  **Data Persistence**
    -   Store structured outputs in normalized tables (expenses, invoices, receipts).
    -   Link structured data to raw file reference.
    -   Keep record of: Source, Timestamp, Upload user, OCR confidence.
4.  **Error Handling & Retry**
    -   If OCR fails:
        -   Flag document as “needs review”.
        -   Allow manual correction by user via frontend.
        -   Retry OCR processing asynchronously if file format is corrected or improved.
5.  **APIs for Frontend**
    -   `GET /documents` — list all uploaded files with metadata, OCR status, categories.
    -   `GET /document/:id` — fetch raw and structured data for review or editing.
    -   `POST /document/:id/edit` — update structured fields manually; validate formats.
6.  **Audit & Traceability**
    -   All changes logged with: User ID, Timestamp, Field changed, Source (OCR/manual edit).
7.  **Integration with Financial Engine**
    -   Send normalized structured data downstream to derivation layer: cash balance, expenses, payables, receivables.
    -   Maintain source mapping to allow tracing back to original document.

#### Guardrails
-   **Never pass raw documents directly to AI.**
-   OCR results are suggestions only; must be verified by user.
Financial truth is derived from structured data. Manual entries must be stored securely, linked to organizations, and fed into the derivation engine without ambiguity.

#### Instructions
1.  **Data Model & Storage**
    -   Table: `manual_ledger_entries`
    -   Columns: `id`, `org_id`, `user_id`, `type` (payable/receivable), `amount`, `counterparty`, `due_date`, `invoice_number`, `category`, `linked_document_id` (nullable).
2.  **APIs for Frontend**
    -   `GET /ledger`: fetch all entries.
    -   `POST /ledger`: create new entry.
    -   `PATCH /ledger/:id`: update entry.
    -   `DELETE /ledger/:id`: soft delete entry.
3.  **Integration with Financial Derivation Layer**
    -   Send entries downstream for cash flow and outstanding metrics.
    -   Respect linked OCR documents to avoid double-counting.
4.  **Validation & Error Handling**
    -   Ensure amount > 0.
    -   Enforce org_id scoping.
    -   Log all user actions.

#### Guardrails
-   **No AI Modification**: Ledger entries cannot be modified by AI.
-   **Data Integrity**: Entries must never be silently dropped.
-   **Linking**: Manual entries can link to OCR documents, but linking is optional.

---

## Directive 14: Bank Statement Import (Manual)

### Objective
Allow users to import bank statements without connecting to APIs.

### Instructions
1.  Accept CSV or XLSX bank statements.
2.  Normalize data into transaction rows (date, description, amount, type).
3.  Allow manual mapping if column names differ.
4.  Integrate with:
    -   Cash balance
    -   Expense summaries

### Guardrails
-   **No automatic bank sync for MVP.**
-   Imported statements are immutable after ingestion.

---

## Directive 15: TDS / Tax Tracking

### Objective
Track monthly tax liabilities and generate reminders for TDS compliance.

### Instructions
1.  Enable tracking of tax liability per month.
2.  Generate reminders for due TDS payments.
3.  Store:
    -   Total tax liability
    -   Paid / unpaid status
    -   Reference documents (PDF invoices, bank statements)
4.  Provide dashboard summaries for quick user insight.

### Guardrails
-   **No government API integration.**
-   AI may provide guidance only; it cannot submit payments.
-   **Always surface disclaimer regarding legal compliance.**

---

## Directive 16: Investments Page (Dummy)

### Objective
Provide placeholder for SME investments tracking.

### Instructions
1.  Display an empty investments dashboard.
2.  Allow manual notes or uploads for future use.

### Guardrails
-   **No calculations or AI predictions for MVP.**
-   Placeholder only; keep simple.

---

## Directive 04: Cash Flow Tracking (Receivable & Payable–Centric)

### Objective
Give SMEs real-time clarity on cash position by tracking what money is available, expected to come in, and expected to go out.

### Conceptual Model
**Cash Flow = Available Cash + Expected Receivables - Expected Payables**

### Frontend Responsibilities
#### Cash Flow Overview Page
1.  **Available Cash**: Manual input field (editable). Shows "Last updated".
2.  **Accounts Receivable**: Grouped by due date buckets. Pulled from Ledger.
3.  **Accounts Payable**: Grouped by due date buckets. Pulled from Ledger.
4.  **Projected Cash Position**: Deterministically computed (Optimistic vs Conservative).

#### Manual Cash Inputs
-   Editable fields: Current available cash, Cash on hand.
-   Every edit creates a new snapshot record.

### Backend Responsibilities
#### Data Models
-   `cash_snapshots`: `id`, `org_id`, `available_cash`, `source`, `created_at`.
-   **Note**: Receivables/Payables are sourced from `manual_ledger_entries` (created in Phase 3).

#### Derivation Logic
-   `current_available_cash()`
-   `total_receivables(by_date_range)`
-   `total_payables(by_date_range)`
-   `projected_cash_position(mode)`

#### API Endpoints
-   `POST /cash/snapshot`
-   `GET /cash/current`
-   `GET /cash/projection`

### Guardrails
-   **No AI in calculations**.
-   **No overwriting cash history**.
-   **Strict derivation** from snapshots and ledger.

---

## Directive 05: Manual Ledger (System of Record)

### Objective
Introduce a manual ledger that acts as the human-verified backbone of ONCA’s financial system.

### Frontend Responsibilities
1.  **Entry Types**: Expense, Income, Receivable, Payable.
2.  **UX Principles**: One action = one entry. No accounting jargon.
3.  **Linking**: Allow attaching invoices later.

### Backend Responsibilities
1.  **Data Model**: `manual_ledger_entries` (Updated)
    -   `entry_type`: Expense, Income, Receivable, Payable.
    -   `transaction_date`: When it happened.
    -   `expected_date`: When money moves (for Pay/Rec).
    -   `status`: Open / Settled.
2.  **Immutability**: Entries are append-only. Updates must create a new state or be recorded as reconciliation.

### Guardrails
-   **Never auto-fill amounts**.
-   **No silent overwrites**.
-   **Ledger = Memory**, not just accounting.

---

## Directive 06: Manual Bank Statement Import

### Objective
Enable controlled ingestion of bank statements (PDF/CSV) to strengthen financial accuracy without risky automation.

### Frontend Responsibilities
1.  **Upload Flow**: Select bank label, period, upload file.
2.  **Transaction Preview**: Show extracted transactions before commit. User must confirm.

### Backend Responsibilities
1.  **Ingestion**: Store raw statement securely. Record bank name, period, timestamp.
2.  **Normalization**: Create `bank_transactions` table:
    -   `id`, `org_id`, `transaction_date`, `description`, `amount`, `direction`, `source_statement_id`.
3.  **Idempotency**: Detect duplicate imports by period + hash. Warn user.

### Guardrails
-   **No auto-commit**.
-   **No auto-categorization**.
-   **Bank data is evidence, not opinion**.

---

## Directive 18: Report Generation

### Objective
Provide SMEs with basic reports using client templates.

### Instructions
1.  Generate downloadable reports in PDF or Excel.
2.  Include:
    -   Cash balance
    -   Payables / Receivables
    -   Expenses
    -   Tax liability summary
3.  Use template-based layouts to reduce formatting complexity.

### Guardrails
-   Reports must only include deterministic data.
-   AI may generate plain-language explanations, not numeric values.

---

## Directive 18: Integration Logic

### Objective
Ensure seamless flow between all transaction sources.

### Instructions
1.  All invoice, bill, receipt, and manual ledger entries feed into:
    -   Cash balance computation
    -   Expense dashboards
    -   Receivables / Payables tracking
2.  AI uses this unified dataset to generate insights and explanations only.

### Guardrails
-   AI never modifies or generates new transactions.
-   Manual inputs override AI suggestions when conflicts arise.
-   Ensure every entry is traceable to source document or manual entry.

---

## Final Instruction

If a decision:
- increases coupling → reject it  
- blurs layer boundaries → reject it  
- makes AI authoritative → reject it  
- slows MVP delivery → question it  

ONCA must remain:  
**Simple, layered, deterministic, explainable.**