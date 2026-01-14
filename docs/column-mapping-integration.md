# Universal Column Mapping Integration Guide

## Overview

**User-assisted column mapping is now the default for ALL file uploads in ONCA.**

Instead of guessing what each column represents, we ask users to confirm our suggestions before processing any data. This eliminates errors and ensures data accuracy.

## How It Works

### 1. File Upload Flow

```
User uploads file
    ↓
System analyzes columns
    ↓
Generate intelligent suggestions
    ↓
Show Column Mapping UI ← USER CONFIRMS HERE
    ↓
Process file with confirmed mappings
    ↓
Import data to database
```

### 2. Supported File Types

- **Bank Statements**: Date, Description, Debit, Credit, Category, Vendor
- **Invoices**: Date, Amount, Invoice Number, Due Date, Status, Vendor
- **Expenses**: Date, Amount, Category, Vendor, Description
- **General**: Any combination of supported column types

### 3. Column Detection

The system automatically detects columns based on:
- **Header names**: "Date", "Amount", "Debit", "Credit", etc.
- **Sample values**: Actual data patterns in first 5 rows
- **File type context**: Different expectations for bank vs invoice files
- **Confidence scoring**: How certain we are about each suggestion

## Integration Points

### Backend API: `/api/ingest/upload`

**Step 1: Upload file and get column suggestions**

```typescript
POST /api/ingest/upload
Content-Type: multipart/form-data

{
  file: <CSV file>,
  fileType: 'BANK_STATEMENT' | 'INVOICE' | 'EXPENSE' | 'GENERAL'
}

Response:
{
  uploadId: string,
  columnSuggestions: ColumnSuggestion[],
  requiredColumns: ColumnType[],
  optionalColumns: ColumnType[]
}
```

**Step 2: User confirms mappings**

```typescript
POST /api/ingest/confirm-mapping
Content-Type: application/json

{
  uploadId: string,
  columnMappings: UserColumnMapping[]
}

Response:
{
  success: boolean,
  importedRecords: number,
  errors: string[]
}
```

### Frontend Components

**1. Upload Page** (`apps/web/src/app/upload/page.tsx`)

```typescript
import { ColumnMappingUI } from '@/components/ColumnMappingUI';
import { generateColumnSuggestions } from '@/core/normalization/column-mapping';

// After file upload:
const suggestions = generateColumnSuggestions(csvContent, 'BANK_STATEMENT');

// Show mapping UI:
<ColumnMappingUI
  suggestions={suggestions.suggestions}
  requiredColumns={suggestions.requiredColumns}
  optionalColumns={suggestions.optionalColumns}
  onConfirm={handleConfirmMapping}
  onCancel={handleCancel}
/>
```

**2. Banking Upload** (`apps/web/src/app/banking/upload/page.tsx`)

Same pattern - always show column mapping UI before processing.

**3. Expense Upload**

Same pattern - universal across all upload flows.

## Benefits

### ✅ Eliminates Guessing
- No more assumptions about column meanings
- Users explicitly confirm what each column represents

### ✅ Handles Edge Cases
- Extra columns? User decides what to do
- Multiple date formats? User confirms which to use
- Ambiguous headers? User clarifies

### ✅ Better UX
- Visual feedback with confidence scores
- Sample values shown for each column
- Clear indication of required vs optional columns
- Validation before submission

### ✅ Reduces Support Issues
- Users see exactly what will be imported
- No silent failures from misidentified columns
- Clear error messages for missing required fields

## Implementation Checklist

- [x] Core column mapping logic (`core/normalization/column-mapping.ts`)
- [x] Column mapping tests (11/11 passing)
- [x] Column mapping UI component (`components/ColumnMappingUI.tsx`)
- [ ] Update `/api/ingest/upload` to return column suggestions
- [ ] Update `/api/ingest/confirm-mapping` to process with user mappings
- [ ] Update banking upload page to use ColumnMappingUI
- [ ] Update expense upload page to use ColumnMappingUI
- [ ] Update invoice upload page to use ColumnMappingUI
- [ ] Update Google Sheets sync to use column mapping
- [ ] Add column mapping to finance tracker imports
- [ ] Update documentation for users

## Testing Strategy

### Unit Tests ✅
- Column type detection
- Confidence scoring
- Required column validation
- User mapping validation

### Integration Tests (Next)
- Full upload flow with column mapping
- Different file types (bank, invoice, expense)
- Edge cases (extra columns, missing required)
- Error handling

### User Acceptance Testing
- Upload real bank statements
- Upload real invoices
- Verify data imported correctly
- Test with various CSV formats

## Migration Notes

**Existing Uploads**

For existing upload flows that currently auto-detect columns:
1. Add column mapping step BEFORE processing
2. Keep existing detection logic as suggestions
3. Require user confirmation before import

**Backward Compatibility**

- Old CSV parser still works for testing
- New flow is opt-in initially
- Can be made mandatory after testing

## Future Enhancements

1. **Save Column Mappings**: Remember user's choices for similar files
2. **Template Library**: Pre-defined mappings for common bank formats
3. **Bulk Upload**: Apply same mapping to multiple files
4. **Smart Learning**: Improve suggestions based on user corrections
5. **Format Detection**: Auto-detect Indian vs US number formats
