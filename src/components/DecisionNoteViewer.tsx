import React from 'react';
import DOMPurify from 'dompurify';
import { FileText, Image as ImageIcon, Download, ExternalLink, Paperclip } from 'lucide-react';
import { FILE_BASE_URL } from '@/store/services/api';

export interface NoteAttachment {
    originalName: string;
    path: string;
    mimeType: string;
}

interface DecisionNoteViewerProps {
    htmlContent?: string | null;
    attachments?: NoteAttachment[] | null;
    className?: string;
}

export const DecisionNoteViewer: React.FC<DecisionNoteViewerProps> = ({
    htmlContent,
    attachments,
    className
}) => {
    if (!htmlContent && (!attachments || attachments.length === 0)) {
        return null;
    }

    const cleanHtml = htmlContent ? DOMPurify.sanitize(htmlContent) : '';

    return (
        <div className={`space-y-3 ${className || ''}`}>
            {cleanHtml && (
                <div 
                    className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                    dangerouslySetInnerHTML={{ __html: cleanHtml }}
                />
            )}

            {attachments && attachments.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        <span>Attached Decision Documents ({attachments.length}):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {attachments.map((file, idx) => {
                            const cleanPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
                            const fileUrl = file.path.startsWith('http') 
                                ? file.path 
                                : `${FILE_BASE_URL}/${cleanPath}`;

                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        {file.mimeType?.startsWith('image/') ? (
                                            <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        )}
                                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {file.originalName}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                                            title="View File"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                        <a
                                            href={fileUrl}
                                            download={file.originalName}
                                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                                            title="Download File"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
