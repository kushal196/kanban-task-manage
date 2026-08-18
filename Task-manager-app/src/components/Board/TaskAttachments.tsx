import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  FileImage,
  File,
  Download,
  X,
  AlertCircle,
} from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

interface TaskAttachmentsProps {
  taskId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType === 'application/pdf') return FileText;
  return File;
}

function isImageType(fileType: string) {
  return fileType.startsWith('image/');
}

export const TaskAttachments = ({ taskId }: TaskAttachmentsProps) => {
  const { attachments, fetchAttachments, addAttachment, deleteAttachment, error } = useTaskStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const taskAttachments = attachments[taskId] || [];

  useEffect(() => {
    fetchAttachments(taskId);
  }, [taskId, fetchAttachments]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null);
    setUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 5 MB limit.`);
        continue;
      }
      await addAttachment(taskId, file);
    }
    setUploading(false);
    setSuccessMsg('Attachment added successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  }, [taskId, addAttachment]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

  const handleDelete = async (attachmentId: string) => {
    if (window.confirm('Delete this attachment?')) {
      await deleteAttachment(attachmentId, taskId);
    }
  };

  const handleDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (dataUrl: string, fileName: string) => {
    setPreviewUrl(dataUrl);
    setPreviewName(fileName);
  };

  return (
    <div>
      {/* Upload Zone */}
      <div
        className={`attachment-drop-zone ${isDragOver ? 'attachment-drop-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-2 py-4">
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-500">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className={`w-8 h-8 ${isDragOver ? 'text-primary-500' : 'text-neutral-400'} transition-colors`} />
              <p className="text-sm text-neutral-500">
                <span className="text-primary-500 font-medium cursor-pointer hover:text-primary-600">Browse files</span>
                {' '}or drag & drop here
              </p>
              <p className="text-xs text-neutral-400">Max 5 MB per file</p>
            </>
          )}
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="mt-3 bg-success-light border border-success text-success px-3 py-2 rounded-lg text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-success hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(uploadError || error) && (
        <div className="mt-3 flex items-center gap-2 bg-danger-light border border-danger text-danger px-3 py-2 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Attachment List */}
      <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
        {taskAttachments.map((attachment) => {
          const IconComponent = getFileIcon(attachment.file_type);
          const isImage = isImageType(attachment.file_type);

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
            >
              {/* Thumbnail / Icon */}
              {isImage ? (
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-neutral-200 hover:border-primary-300 transition-colors"
                  onClick={() => handlePreview(attachment.data_url, attachment.file_name)}
                >
                  <img
                    src={attachment.data_url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-primary-500" />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium text-neutral-900 truncate ${isImage ? 'cursor-pointer hover:text-primary-600' : ''}`}
                  onClick={() => isImage ? handlePreview(attachment.data_url, attachment.file_name) : handleDownload(attachment.data_url, attachment.file_name)}
                  title={attachment.file_name}
                >
                  {attachment.file_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatFileSize(attachment.file_size)} · {new Date(attachment.created_at).toLocaleDateString('en-US')}
                </p>
              </div>

              {/* Actions - always visible for clarity */}
              <div className="flex items-center gap-1">
                {isImage && (
                  <button
                    onClick={() => handlePreview(attachment.data_url, attachment.file_name)}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-600 rounded transition-colors"
                    title="Preview Image"
                  >
                    <FileImage className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(attachment.data_url, attachment.file_name)}
                  className="p-1.5 hover:bg-neutral-200 text-neutral-600 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1.5 hover:bg-danger-light text-danger rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {taskAttachments.length === 0 && !uploading && (
          <div className="text-center py-8">
            <Paperclip className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-400 text-sm">No attachments yet</p>
          </div>
        )}
      </div>

      {/* Explicit Add Button Bar at bottom */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {taskAttachments.length} {taskAttachments.length === 1 ? 'file' : 'files'} attached
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {/* Image Preview Lightbox */}
      {previewUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium truncate pr-4">{previewName}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewUrl, previewName)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <img
              src={previewUrl}
              alt={previewName}
              className="max-w-full max-h-[75vh] rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
