import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
    Bold, Italic, List, ListOrdered, Heading2, Quote, Undo, Redo, 
    Paperclip, X, FileText, Image as ImageIcon, Loader2 
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { FILE_BASE_URL } from '@/store/services/api';

export interface NoteAttachment {
    originalName: string;
    path: string;
    mimeType: string;
}

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    attachments: NoteAttachment[];
    onAttachmentsChange: (attachments: NoteAttachment[]) => void;
    placeholder?: string;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    attachments,
    onAttachmentsChange,
    placeholder = "Type structured decision notes or feedback here...",
    className
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] }
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[140px] px-3 py-2 text-sm text-slate-800 leading-relaxed'
            }
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));

        try {
            const token = localStorage.getItem('managment_token') || localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const uploadUrl = `${FILE_BASE_URL}/api/v1/applications/decision-note-files/upload`;
            let res = await fetch(uploadUrl, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: formData
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${FILE_BASE_URL}/api/v1/applications/decision-note-files/upload`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: formData
                });
            }

            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                onAttachmentsChange([...attachments, ...data.data]);
            } else if (data.data && Array.isArray(data.data)) {
                onAttachmentsChange([...attachments, ...data.data]);
            }
        } catch (err) {
            console.error('Failed to upload decision note attachment:', err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        const updated = [...attachments];
        updated.splice(index, 1);
        onAttachmentsChange(updated);
    };

    if (!editor) return null;

    return (
        <div className={cn("border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs transition-all focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50/70 text-slate-600">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-slate-200 text-slate-900")}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-slate-200 text-slate-900")}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 2 }) && "bg-slate-200 text-slate-900")}
                    title="Heading"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-slate-200 text-slate-900")}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-slate-200 text-slate-900")}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-slate-200 text-slate-900")}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="h-8 w-8 p-0"
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="h-8 w-8 p-0"
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>

                <div className="ml-auto flex items-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-7 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                        {isUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Paperclip className="h-3.5 w-3.5" />
                        )}
                        Attach File
                    </Button>
                </div>
            </div>

            {/* Content editable area */}
            <EditorContent editor={editor} placeholder={placeholder} />

            {/* Attachments preview list */}
            {attachments && attachments.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                        <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs group"
                        >
                            {file.mimeType?.startsWith('image/') ? (
                                <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                                <FileText className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            <span className="max-w-[140px] truncate font-medium">{file.originalName}</span>
                            <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="ml-1 text-slate-400 hover:text-red-500 rounded p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
