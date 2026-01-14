/**
 * Column Mapping UI Component (React)
 * 
 * User interface for confirming column mappings before file upload.
 * Shows suggestions and allows users to correct any misidentified columns.
 */

import React, { useState } from 'react';
import { ColumnSuggestion, ColumnType, UserColumnMapping } from '@core/normalization/column-mapping';

interface ColumnMappingUIProps {
  suggestions: ColumnSuggestion[];
  requiredColumns: ColumnType[];
  optionalColumns: ColumnType[];
  onConfirm: (mappings: UserColumnMapping[]) => void;
  onCancel: () => void;
}

export function ColumnMappingUI({
  suggestions,
  requiredColumns,
  optionalColumns,
  onConfirm,
  onCancel,
}: ColumnMappingUIProps) {
  const [mappings, setMappings] = useState<UserColumnMapping[]>(
    suggestions.map(s => ({
      columnIndex: s.columnIndex,
      headerName: s.headerName,
      userSelectedType: s.suggestedType,
    }))
  );

  const handleColumnTypeChange = (columnIndex: number, newType: ColumnType) => {
    setMappings(prev =>
      prev.map(m =>
        m.columnIndex === columnIndex
          ? { ...m, userSelectedType: newType }
          : m
      )
    );
  };

  const getMappedColumns = () => {
    return new Set(mappings.map(m => m.userSelectedType));
  };

  const getMissingRequired = () => {
    const mapped = getMappedColumns();
    return requiredColumns.filter(req => !mapped.has(req));
  };

  const canConfirm = getMissingRequired().length === 0;

  return (
    <div className="column-mapping-ui">
      <div className="header">
        <h2>Confirm Column Mapping</h2>
        <p>Please verify that we've correctly identified each column in your file.</p>
      </div>

      <div className="required-columns">
        <h3>Required Columns</h3>
        <div className="column-tags">
          {requiredColumns.map(col => {
            const isMapped = getMappedColumns().has(col);
            return (
              <span
                key={col}
                className={`column-tag ${isMapped ? 'mapped' : 'missing'}`}
              >
                {col} {isMapped ? '✓' : '✗'}
              </span>
            );
          })}
        </div>
      </div>

      <div className="column-list">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.columnIndex} className="column-row">
            <div className="column-info">
              <div className="column-header">
                <strong>{suggestion.headerName}</strong>
                <span className="confidence">
                  {Math.round(suggestion.confidence * 100)}% confident
                </span>
              </div>
              <div className="sample-values">
                Sample: {suggestion.sampleValues.join(', ')}
              </div>
              <div className="reasoning">{suggestion.reasoning}</div>
            </div>

            <div className="column-selector">
              <select
                value={mappings[index].userSelectedType}
                onChange={e =>
                  handleColumnTypeChange(
                    suggestion.columnIndex,
                    e.target.value as ColumnType
                  )
                }
                className={
                  suggestion.confidence < 0.7 ? 'low-confidence' : ''
                }
              >
                <option value="DATE">Date</option>
                <option value="DESCRIPTION">Description</option>
                <option value="AMOUNT">Amount</option>
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
                <option value="CATEGORY">Category</option>
                <option value="VENDOR">Vendor/Payee</option>
                <option value="INVOICE_NUMBER">Invoice Number</option>
                <option value="DUE_DATE">Due Date</option>
                <option value="STATUS">Status</option>
                <option value="CURRENCY">Currency</option>
                <option value="TAX_RATE">Tax Rate</option>
                <option value="IGNORE">Ignore this column</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {!canConfirm && (
        <div className="validation-error">
          ⚠️ Missing required columns: {getMissingRequired().join(', ')}
        </div>
      )}

      <div className="actions">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(mappings)}
          disabled={!canConfirm}
          className="btn-primary"
        >
          Confirm & Upload
        </button>
      </div>

      <style jsx>{`
        .column-mapping-ui {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .header {
          margin-bottom: 24px;
        }

        .header h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .header p {
          color: #666;
        }

        .required-columns {
          margin-bottom: 24px;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .required-columns h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .column-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .column-tag {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .column-tag.mapped {
          background: #d4edda;
          color: #155724;
        }

        .column-tag.missing {
          background: #f8d7da;
          color: #721c24;
        }

        .column-list {
          margin-bottom: 24px;
        }

        .column-row {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .column-info {
          flex: 1;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .confidence {
          font-size: 12px;
          color: #666;
        }

        .sample-values {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }

        .reasoning {
          font-size: 12px;
          color: #999;
          font-style: italic;
        }

        .column-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 180px;
        }

        .column-selector select.low-confidence {
          border-color: #ffc107;
          background: #fff3cd;
        }

        .validation-error {
          padding: 12px;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-secondary,
        .btn-primary {
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }

        .btn-secondary {
          background: #fff;
          border: 1px solid #ddd;
          color: #333;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
