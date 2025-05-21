import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paperclip, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  attachmentId: number;
  photoId?: number;
  noteId?: number;
  attachmentType: 'photo' | 'note';
}

export default function FilePreview({
  attachmentId,
  photoId,
  noteId,
  attachmentType,
}: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Fetch photo data if this is a photo attachment
  const { data: photo, isLoading: isLoadingPhoto } = useQuery({
    queryKey: [`/api/photos/${photoId}`],
    enabled: attachmentType === 'photo' && !!photoId,
  });

  // Fetch note data if this is a note attachment
  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: [`/api/notes/${noteId}`],
    enabled: attachmentType === 'note' && !!noteId,
  });

  // Determine file type for photos
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('doc')) return 'document';
    if (mimeType.includes('text')) return 'text';
    return 'unknown';
  };

  // Generate download link for photos
  const getDownloadLink = (fileData: string, mimeType: string, fileName: string) => {
    return `data:${mimeType};base64,${fileData}`;
  };

  // Handle file opening in new tab
  const openInNewTab = (fileData: string, mimeType: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>File Preview</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9f9f9; }
              img { max-width: 95%; max-height: 95%; object-fit: contain; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              .pdf-container { width: 100%; height: 100vh; }
            </style>
          </head>
          <body>
            ${
              mimeType.startsWith('image/') 
                ? `<img src="data:${mimeType};base64,${fileData}" alt="File preview" />` 
                : mimeType.includes('pdf')
                ? `<embed src="data:${mimeType};base64,${fileData}" type="application/pdf" width="100%" height="100%" />`
                : `<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <h2>File Preview</h2>
                    <p>This file type cannot be previewed directly in the browser.</p>
                    <a href="data:${mimeType};base64,${fileData}" download="file">Download File</a>
                  </div>`
            }
          </body>
        </html>
      `);
    }
  };

  // Render loading state
  if ((attachmentType === 'photo' && isLoadingPhoto) || (attachmentType === 'note' && isLoadingNote)) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 animate-pulse">
        Loading file...
      </div>
    );
  }

  // Render photo preview
  if (attachmentType === 'photo' && photo && photo.fileData) {
    const fileType = getFileType(photo.mimeType);
    const isImage = fileType === 'image';
    const isPdf = fileType === 'pdf';
    
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-medium">{photo.title || 'File Preview'}</div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openInNewTab(photo.fileData, photo.mimeType)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <a 
              href={getDownloadLink(photo.fileData, photo.mimeType, photo.title || 'download')} 
              download={photo.title || 'download'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </a>
          </div>
        </div>
        
        {isImage && (
          <div className={`border rounded-md overflow-hidden bg-gray-50 flex justify-center ${isExpanded ? 'h-auto' : 'h-[200px]'}`}>
            <img 
              src={`data:${photo.mimeType};base64,${photo.fileData}`}
              alt={photo.title || 'Image preview'}
              className={`${isExpanded ? 'max-w-full' : 'h-full object-contain'}`}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </div>
        )}
        
        {isPdf && (
          <div className="border rounded-md overflow-hidden bg-gray-50 h-[400px]">
            <embed 
              src={`data:${photo.mimeType};base64,${photo.fileData}`}
              type="application/pdf"
              width="100%"
              height="100%"
            />
          </div>
        )}
        
        {!isImage && !isPdf && (
          <div className="border rounded-md p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <p className="font-medium">File preview not available</p>
            <p className="text-sm text-muted-foreground mb-4">This file type cannot be previewed directly</p>
            <a 
              href={getDownloadLink(photo.fileData, photo.mimeType, photo.title || 'download')} 
              download={photo.title || 'download'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </a>
          </div>
        )}
      </div>
    );
  }

  // Render note preview
  if (attachmentType === 'note' && note) {
    return (
      <div className="p-4 space-y-4">
        <div className="font-medium">{note.title || 'Note Preview'}</div>
        <div className="border rounded-md p-4 bg-gray-50">
          <p className="whitespace-pre-wrap">{note.content || 'No content'}</p>
        </div>
      </div>
    );
  }

  // Render fallback if data is not available
  return (
    <div className="p-4 text-center">
      <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">This attachment is no longer available</p>
    </div>
  );
}