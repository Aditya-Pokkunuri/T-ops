import { useState, useRef } from 'react';
import { Upload, FileText, Download, Eye, RotateCw, X, File } from 'lucide-react';
import { useToast } from '../Common/Toast';
import { useData } from '../../context/DataContext';

const ResumeCard = ({ candidate }) => {
    const { uploadResume } = useData();
    const { success, error } = useToast();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleUpload(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleUpload = async (file) => {
        // Validate
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            error('Invalid file type. Please upload PDF, DOC, or DOCX.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            error('File is too large (max 5MB).');
            return;
        }

        setIsUploading(true);
        try {
            await uploadResume(file, candidate.id);
            success('Resume uploaded successfully!');
        } catch (err) {
            console.error(err);
            error('Failed to upload resume.');
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const hasResume = !!candidate.resumeUrl;

    return (
        <div className="resume-card glass-card">
            <div className="card-header">
                <h3>Resume</h3>
                {hasResume && (
                    <button
                        className="btn-icon"
                        onClick={() => fileInputRef.current.click()}
                        title="Replace Resume"
                    >
                        <RotateCw size={16} />
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
            />

            {hasResume ? (
                <div className="resume-content">
                    <div className="file-info">
                        <div className="file-icon">
                            <FileText size={32} />
                        </div>
                        <div className="file-details">
                            <h4 className="file-name" title={candidate.resumeName || 'Resume'}>
                                {candidate.resumeName || 'Resume'}
                            </h4>
                            <div className="file-meta">
                                <span>{formatFileSize(candidate.resumeSize)}</span>
                                <span className="separator">•</span>
                                <span>{new Date(candidate.resumeUploadedAt || candidate.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="resume-actions">
                        <a
                            href={candidate.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm full-width"
                        >
                            <Eye size={16} /> View
                        </a>
                        <a
                            href={candidate.resumeUrl}
                            download
                            className="btn btn-secondary btn-sm full-width"
                        >
                            <Download size={16} /> Download
                        </a>
                    </div>
                </div>
            ) : (
                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current.click()}
                >
                    {isUploading ? (
                        <div className="uploading-state">
                            <div className="spinner-sm" />
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon">
                                <Upload size={24} />
                            </div>
                            <p className="upload-text">
                                Click or drag file to upload
                            </p>
                            <p className="upload-hint">
                                PDF, DOC, DOCX (Max 5MB)
                            </p>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .resume-card {
                    padding: var(--spacing-lg);
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                }
                
                .card-header h3 {
                    font-size: 1rem;
                    margin: 0;
                }

                .btn-icon {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-fast);
                }

                .btn-icon:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .upload-zone {
                    border: 2px dashed var(--border-secondary);
                    border-radius: var(--radius-md);
                    padding: var(--spacing-xl) var(--spacing-md);
                    text-align: center;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    background: var(--bg-tertiary);
                }

                .upload-zone:hover, .upload-zone.dragging {
                    border-color: var(--accent-primary);
                    background: var(--bg-glass-hover);
                }

                .upload-icon {
                    color: var(--text-secondary);
                    margin-bottom: var(--spacing-sm);
                }

                .upload-text {
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .upload-hint {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .uploading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-sm);
                    color: var(--accent-primary);
                }

                .resume-content {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .file-info {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-md);
                    padding: var(--spacing-md);
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-md);
                }

                .file-icon {
                    padding: var(--spacing-sm);
                    background: var(--bg-card);
                    border-radius: var(--radius-sm);
                    color: var(--accent-primary);
                }

                .file-details {
                    flex: 1;
                    min-width: 0;
                }

                .file-name {
                    font-size: 0.9375rem;
                    font-weight: 500;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .file-meta {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .separator {
                    color: var(--border-secondary);
                }

                .resume-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--spacing-md);
                }

                .full-width {
                    width: 100%;
                    justify-content: center;
                }
                
                .spinner-sm {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--accent-primary);
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ResumeCard;
