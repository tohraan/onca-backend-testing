# 🧪 ONCA Intelligence: End-to-End Testing Guide

This guide ensures that the **Multi-Currency Normalization**, **Standardization Bridge**, **Google Auth**, and **OCR Document Vault** systems are working perfectly.

---

## 🏗️ Phase 1: Preparation (One-Time Setup)

Before testing, ensure your database is ready for the new currency features.

1.  **Run SQL Migration**: Go to [Supabase SQL Editor](https://supabase.com/dashboard) and run the script in `db/migrations/006_currency_normalization.sql`.
    *   *Why?* The 500 error you saw happens because the code is trying to save "Source Amount" and "Source Currency" columns that don't exist in your database yet.
2.  **Clean State**: Logout of the ONCA app to test the new Landing Page entrance.

---

## 🚪 Phase 2: Authentication & Identity
**Goal**: Verify the "Front Gate" is professional and secure.

1.  **Landing Page**: Navigate to [localhost:3000](http://localhost:3000) (or your root URL). 
    *   You should see the **AI-First Financial OS** hero section.
2.  **Google Sign-In**: Click **Continue with Google**.
    *   Verify you are redirected to the Google consent screen.
    *   Verify you land on the **Dashboard** after success.
3.  **DNA Calibration**: Go to **Settings**.
    *   Select **USD** (US Dollar) as your Base Currency.
    *   Select your **Business Type** (e.g., SaaS).
    *   Click **Save**. *ONCA now knows how to interpret your money.*

---

## 📊 Phase 3: The Multi-Currency Sync
**Goal**: Verify that ONCA can "read" different currencies but "think" in your base currency.

1.  **Prepare Data**: Open your Google Sheet and add two distinct rows:
    *   **Row A**: `Description: "Cloud Servers", Amount: 1000, Currency: AED`
    *   **Row B**: `Description: "Marketing Audit", Amount: 50000, Currency: INR`
2.  **Trigger Sync**: Go to the **Google Sheets** page in ONCA.
3.  **Paste URL**: Paste your Sheet URL and click **Initialize Sync**.
4.  **Verification (The Step 3 Table)**:
    *   Check the **Amount** column.
    *   You should see **USD** values (the normalized truth).
    *   Look at the grey sub-text. It should say: `Original: AED 1,000 (@3.67)`.
    *   *This confirms the Frankfurter API performed a live conversion.*

---

## 📥 Phase 4: The Standardization Bridge
**Goal**: Verify that we don't corrupt your original data when giving it back to you.

1.  **Download CSV**: On the Sheets page, click **Download Standardized CSV**.
2.  **Inspect File**: Open the downloaded `.csv`.
3.  **Verification**: 
    *   The "Cloud Servers" row should show `1000` in the amount and `AED` in the currency.
    *   *This proves ONCA protects your source data even while the dashboard is showing USD.*

---

## 🧾 Phase 5: OCR & Document Vault (New)
**Goal**: Verify secure document ingestion, listing, and manual entry.

1.  **Navigate**: Go to **Document Vault** (`/documents`) via the sidebar.
2.  **Test Manual Entry**:
    *   Click the **"+ Manual Entry"** button (top right).
    *   Fill out the form:
        *   **Type**: Invoice
        *   **Category**: Payable
        *   **Amount**: 150.00
        *   **Vendor**: "Test Vendor Inc"
    *   Click **Save**.
    *   **Verify**: The modal closes, and the new entry immediately appears in the "All Documents" list.
3.  **Test File Upload**:
    *   Use the **Upload Panel** on the left.
    *   Select a tab (e.g., "Vendor Bill").
    *   Drag & drop a sample image/PDF or click to select one.
    *   **Verify**: 
        *   Upload progress bar appears.
        *   Success message is shown.
        *   The new file appears at the top of the list with status "Processing" (or "Queued").
4.  **Test Preview**:
    *   Click on any item in the `All Documents` list.
    *   **Verify**: The **Document Preview** modal opens, showing the metadata you entered/uploaded.

---

## � Phase 6: Manual Ledger (New)
**Goal**: Verify tracking of Payables and Receivables.

1.  **Navigate**: Go to **Ledger & Tracking** (`/ledger`) via the sidebar.
2.  **Add Entry**:
    *   Click **"+ New Entry"**.
    *   Select **Type**: Payable.
    *   **Counterparty**: "Landlord LLC".
    *   **Amount**: 2000.
    *   **Date**: Select a future date.
    *   Click **Save**.
3.  **Verify**:
    *   The entry appears in the "Payables" tab.
    *   Switch to "Receivables" tab -> Entry should NOT be there.
    *   The summary card for "Payables" should update (if implemented to be dynamic, otherwise just check the table).

---

## 🛡️ Phase 7: TDS Compliance (New)
**Goal**: Verify tax liability tracking.

1.  **Navigate**: Go to **TDS & Taxes** (`/taxes`) via the sidebar.
2.  **Verify Disclaimer**: Ensure the "Not a tax filing portal" banner is visible.
3.  **Record Liability**:
    *   Click **"+ Record Liability"**.
    *   **Vendor**: "Consultant Agency".
    *   **Payment Amount**: 10000.
    *   **TDS Rate**: 10.
    *   **Verify Calculation**: The modal should show a calculated liability of **$1,000.00**.
    *   Click **Record**.
4.  **Verify Dashboard**:
    *   "Pending Liability" card should increase by $1,000.
    *   The new entry appears in the table with status `PENDING`.

---

## � Phase 8: Cash Flow Tracking (New)
**Goal**: Verify cash position logic.

1.  **Navigate**: Go to **Cash Flow** (`/cash-flow`) via the sidebar.
2.  **Set Initial Cash**:
    *   Click **"Update Balance"**.
    *   Enter **50000**.
    *   Click **Update Snapshot**.
3.  **Verify Projection**:
    *   **Available Cash** should show **$50,000.00**.
    *   **Optimistic Projection** should equal: $50,000 + (Total Receivables from Phase 6) - (Total Payables from Phase 6).
    *   *Example*: If you added a $2,000 Payable earlier, Projection should be **$48,000**.

---

## 📒 Phase 9: Manual Ledger (System of Record)
**Goal**: Verify "Money In/Out" logic and immediate settlement.

1.  **Navigate**: Go to **Ledger & Tracking** (`/ledger`).
2.  **Log Cash Expense**:
    *   Click **"Add Entry"**.
    *   Select **Money Out** -> **Already Happened**.
    *   **Counterparty**: "Uber".
    *   **Amount**: 25.
    *   **Mode**: Cash.
    *   Click **Save**.
    *   *Verify*: Appears in table as `EXPENSE` with status `Settled` (or Checkmark).
3.  **Log Pending Invoice**:
    *   Click **"Add Entry"**.
    *   Select **Money Out** -> **Will Happen**.
    *   **Counterparty**: "AWS".
    *   **Amount**: 100.
    *   **Due Date**: Next week.
    *   Click **Save**.
    *   *Verify*: Appears in table as `PAYABLE` (Bill) with status `OPEN`.

---

## 🏦 Phase 10: Bank Statement Import
**Goal**: Verify controlled CSV ingestion with preview/confirm flow.

1.  **Navigate**: Go to **Banking & Reconciliation** (`/banking`).
2.  **Prepare Test CSV**: Create a file `test_statement.csv` with:
    ```
    date,description,debit,credit
    2024-01-15,Salary Deposit,,5000
    2024-01-16,Office Rent,1200,
    2024-01-17,Utility Bill,150,
    ```
3.  **Upload**:
    *   **Bank Name**: "Test Bank".
    *   **Statement Period**: "2024-01".
    *   **File**: Upload `test_statement.csv`.
    *   Click **Upload & Preview**.
4.  **Verify Preview**:
    *   Should show 3 transactions.
    *   Salary: CREDIT, $5,000.
    *   Rent: DEBIT, $1,200.
    *   Utility: DEBIT, $150.
5.  **Confirm**:
    *   Click **Confirm Import**.
    *   Success message should appear.
    *   Transactions are now in the database.

---

## 📄 Phase 11: Invoice System (Obligations)
**Goal**: Verify dedicated invoice system with Payable/Receivable tracking.

1.  **Navigate**: Go to **Invoices** (`/invoices`).
2.  **Create Receivable**:
    *   Click **Add Invoice**.
    *   **Type**: Receivable (Money In).
    *   **Counterparty**: "Client ABC".
    *   **Amount**: 5000.
    *   **Invoice Date**: Today.
    *   **Due Date**: 30 days from now.
    *   Click **Create Invoice**.
    *   *Verify*: Appears in Receivable tab with status UNPAID.
3.  **Create Payable**:
    *   Switch to **Payable** tab.
    *   Click **Add Invoice**.
    *   **Type**: Payable (Money Out).
    *   **Counterparty**: "Vendor XYZ".
    *   **Amount**: 1200.
    *   **Due Date**: 15 days from now.
    *   Click **Create Invoice**.
    *   *Verify*: Appears in Payable tab.
4.  **View Detail**:
    *   Click on the Receivable invoice.
    *   *Verify*: Detail page shows all fields.
    *   Click **Edit**, change counterparty name, click **Save**.
    *   *Verify*: Changes persist.
5.  **Mark as Paid**:
    *   Click **Mark as Paid** quick action.
    *   *Verify*: Status changes to PAID.

---

## 💰 Phase 12: Expense Tracking (Daily Spend)
**Goal**: Verify expense system for non-invoice spend tracking.

1.  **Navigate**: Go to **Expenses** (`/expenses`).
2.  **Create Expense**:
    *   Click **Add Expense**.
    *   **Vendor**: "Starbucks".
    *   **Amount**: 15.
    *   **Category**: Office.
    *   **Payment Method**: Card.
    *   Click **Create Expense**.
    *   *Verify*: Appears in All Expenses with UNRECONCILED status.
3.  **Filter by Month**:
    *   Click **This Month** tab.
    *   *Verify*: Shows only current month expenses.
4.  **View Detail**:
    *   Click on the expense.
    *   *Verify*: Detail page shows all fields.
    *   Click **Edit**, change vendor to "Coffee Shop", click **Save**.
    *   *Verify*: Changes persist.
5.  **Reconcile**:
    *   Click **Mark as Reconciled** quick action.
    *   *Verify*: Status changes to RECONCILED.
    *   Go back to main page, click **Unreconciled** tab.
    *   *Verify*: Expense no longer appears.

---

## 💸 Phase 13: Cashflow (Payables & Receivables)
**Goal**: Verify task-based financial commitment tracking.

1.  **Navigate**: Go to **Cash Flow** (`/cashflow`).
2.  **Create Payable**:
    *   Click **Add Payable**.
    *   **Counterparty**: "Vendor ABC".
    *   **Amount**: 12000.
    *   **Expected Date**: 7 days from now.
    *   **Notes**: "Verbal agreement, invoice pending".
    *   Click **Create Task**.
    *   *Verify*: Appears in Payables tab with PENDING status.
3.  **Create Receivable**:
    *   Switch to **Receivables** tab.
    *   Click **Add Receivable**.
    *   **Counterparty**: "Client XYZ".
    *   **Amount**: 50000.
    *   **Expected Date**: 5 days from now.
    *   Click **Create Task**.
    *   *Verify*: Appears in Receivables tab.
4.  **Check Net Position**:
    *   *Verify*: Summary shows correct Total Payables, Total Receivables, and Net Position (Receivables - Payables).
5.  **Mark as Paid**:
    *   Click **PAID** button on a task.
    *   *Verify*: Status changes to PAID.
6.  **Auto-Overdue**:
    *   Create a task with **Expected Date** in the past.
    *   *Verify*: Task shows OVERDUE status with red highlight.

---

## 🔗 Phase 14: Bank Reconciliation & Linking
**Goal**: Verify reconciliation view and transaction linking.

1.  **Upload Bank Statement**: Go to **Banking** (`/banking`) and upload a CSV with transactions.
2.  **Create Matching Task**:
    *   Go to **Cash Flow** (`/cashflow`).
    *   Create a Payable for $500 with counterparty "Vendor ABC".
3.  **Navigate to Reconciliation**:
    *   Click **Reconciliation** tab.
    *   *Verify*: Summary shows Bank Balance, Expected Cash, Unlinked Transactions count.
4.  **View Suggestions**:
    *   If a bank transaction matches the task (same amount, counterparty in description):
    *   *Verify*: Suggestion appears with confidence level (HIGH/MEDIUM).
    *   *Verify*: Shows transaction details → task details.
5.  **Approve Link**:
    *   Click **Approve Link** on a suggestion.
    *   *Verify*: Suggestion disappears from list.
    *   *Verify*: Unlinked count decreases.
6.  **Reject Link**:
    *   Click **Reject** on a suggestion.
    *   *Verify*: Suggestion is removed from UI.

---

## 📊 Phase 15: TDS Tracking & Obligations
**Goal**: Verify TDS tracking with due dates and reminders.

1.  **Navigate**: Go to **Taxes** (`/taxes`).
2.  **Create TDS Obligation**:
    *   Click **Add TDS Obligation**.
    *   **Vendor**: "ABC Contractors".
    *   **Payment Amount**: 10000.
    *   **TDS Rate**: 10.
    *   **Payment Date**: Today.
    *   **Due Date**: 5 days from now.
    *   *Verify*: Calculated TDS Amount shows $1,000.
    *   Click **Create Obligation**.
3.  **Check Summary**:
    *   *Verify*: "Upcoming (7 days)" count increases.
    *   *Verify*: "Total Payable (This Month)" shows correct amount.
4.  **Create Overdue Obligation**:
    *   Add another TDS with **Due Date** in the past.
    *   *Verify*: Shows OVERDUE status with red highlight.
    *   *Verify*: "Overdue" count increases.
5.  **Mark as Paid**:
    *   Click **PAID** button on an obligation.
    *   *Verify*: Status changes to PAID.
    *   *Verify*: Counts update accordingly.

---

## 🛠️ Troubleshooting the "500 Internal Server Error"
If you see a 500 Error during sync, check these:
*   **Database**: Ensure migration `006` was run. (Most common cause).
*   **Connection**: If the error says "Google Sheets not connected," go to the Sheets page and click **Connect Google Account**.
*   **Permissions**: Ensure your Google Sheet is set to "Anyone with the link can view" or shared with your Google account.
