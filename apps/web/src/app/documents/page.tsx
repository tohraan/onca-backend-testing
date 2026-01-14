'use client';

import { useState } from 'react';
import { Upload, FileText, Plus, FolderOpen, ArrowLeft } from 'lucide-react';
import { UploadPanel } from './components/UploadPanel';
import { DocumentList } from './components/DocumentList';
import { DocumentPreview } from './components/DocumentPreview';
import { ManualEntryForm } from './components/ManualEntryForm';
import { ColumnMappingPanel } from './components/ColumnMappingPanel';
import DocumentReviewPanel from './components/DocumentReviewPanel';

type ViewMode = 'LIST' | 'CREATE' | 'REVIEW';

export default function DocumentVaultPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);

    // View State Management
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');

    // Data State
    const [mappingData, setMappingData] = useState<any>(null);
    const [reviewData, setReviewData] = useState<any>(null);
    const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

    const handleUploadComplete = (data?: any) => {
        if (data?.columnSuggestions && data.columnSuggestions.length > 0) {
            // CSV Flow -> Inline CSV Mapping
            setMappingData(data);
            // Stay in CREATE mode, the component handles its own display
        } else if (data?.extractedData || (data?.signedUrl && !data.isManualRequired)) {
            // AI Classification / Extraction Flow (Success or Auto-verified)
            setReviewData({
                file: { name: data.fileName, type: data.fileType },
                previewUrl: data.signedUrl,
                extractedData: data.extractedData,
                uploadId: data.uploadId
            });
            setViewMode('REVIEW');
        } else if (data?.isManualRequired && data?.signedUrl) {
            // Fallback: AI failed or Manual Entry explicitly required (e.g. PDF)
            setReviewData({
                file: { name: data.fileName, type: data.fileType },
                previewUrl: data.signedUrl,
                extractedData: null, // No data, but we show the form
                uploadId: data.uploadId
            });
            setViewMode('REVIEW');
        } else if (data?.status === 'needs_manual_entry') {
            // Legacy Fallback
            if (data.signedUrl) {
                setReviewData({
                    file: { name: data.fileName, type: data.fileType },
                    previewUrl: data.signedUrl,
                    extractedData: null,
                    uploadId: data.uploadId
                });
                setViewMode('REVIEW');
            } else {
                setPendingUploadId(data.uploadId);
            }
        } else {
            // Success (Direct upload / CSV auto-processed)
            setRefreshKey(prev => prev + 1);
            setViewMode('LIST');
        }
    };

    const handleReviewConfirm = async (formData: any) => {
        try {
            const res = await fetch('/api/documents/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    uploadId: reviewData.uploadId
                })
            });

            if (!res.ok) throw new Error('Failed to save document');

            setReviewData(null);
            setRefreshKey(prev => prev + 1);
            setViewMode('LIST');
        } catch (err) {
            console.error(err);
            alert('Failed to save document');
        }
    };

    const handleMappingConfirm = async (mapping: any) => {
        try {
            const res = await fetch('/api/ingest/confirm-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadId: mapping.uploadId,
                    columnMappings: mapping.mappings,
                    fileType: mappingData.fileType
                })
            });

            if (!res.ok) throw new Error('Failed to save mapping');

            setMappingData(null);
            setRefreshKey(prev => prev + 1);
            setViewMode('LIST');
        } catch (err) {
            console.error(err);
            alert('Failed to save mapping');
        }
    };

    // Render Helpers
    const renderList = () => (
        <>
            <div className="action-bar">
                <div className="action-bar-left">
                    <h2 className="page-title">Documents</h2>
                </div>
                <div className="action-bar-right">
                    <button
                        onClick={() => setViewMode('CREATE')}
                        className="btn btn-primary"
                    >
                        <Plus size={16} />
                        Add Document
                    </button>
                </div>
            </div>

            <div className="table-container">
                <div className="card-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FolderOpen size={16} />
                    <span>All Documents</span>
                </div>
                <div style={{ padding: '16px' }}>
                    <DocumentList
                        refreshTrigger={refreshKey}
                        onSelect={setSelectedDocument}
                    />
                </div>
            </div>
        </>
    );

    const renderCreate = () => (
        <>
            <div className="action-bar">
                <div className="action-bar-left">
                    <button onClick={() => setViewMode('LIST')} className="btn btn-secondary btn-sm">
                        <ArrowLeft size={14} /> Back
                    </button>
                    <h2 className="page-title">Add New Document</h2>
                </div>
            </div>

            {/* Inline Column Mapping Panel overrides everything if active */}
            {mappingData ? (
                <div className="card">
                    <ColumnMappingPanel
                        fileData={mappingData}
                        onConfirm={handleMappingConfirm}
                        onCancel={() => setMappingData(null)}
                    />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                    {/* Upload Section */}
                    <div>
                        <h3 style={{ marginBottom: '16px' }}>Upload File</h3>
                        <div className="card">
                            <UploadPanel onUploadComplete={handleUploadComplete} />
                        </div>
                    </div>

                    {/* Manual Entry Section */}
                    <div>
                        <h3 style={{ marginBottom: '16px' }}>Manual Entry</h3>
                        <ManualEntryForm
                            pendingUploadId={pendingUploadId}
                            onClose={() => {
                                setPendingUploadId(null);
                                setViewMode('LIST');
                            }}
                            onSuccess={() => {
                                setPendingUploadId(null);
                                setRefreshKey(prev => prev + 1);
                                setViewMode('LIST');
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div style={{ maxWidth: '100%' }}>
            {selectedDocument && (
                <DocumentPreview
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            )}

            {viewMode === 'LIST' && renderList()}

            {viewMode === 'CREATE' && renderCreate()}

            {viewMode === 'REVIEW' && reviewData && (
                <DocumentReviewPanel
                    file={reviewData.file}
                    previewUrl={reviewData.previewUrl}
                    extractedData={reviewData.extractedData}
                    onConfirm={handleReviewConfirm}
                    onCancel={() => {
                        setReviewData(null);
                        setViewMode('CREATE');
                    }}
                />
            )}
        </div>
    );
}
