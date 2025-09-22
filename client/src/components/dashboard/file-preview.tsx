import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paperclip, FileText, Download, ExternalLink, ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  attachmentId?: number;
  photoId?: number;
  noteId?: number;
  attachmentType: 'photo' | 'note' | 'task-proof';
  // For task-proof type
  proofFiles?: string[];
  proofText?: string;
  proofLink?: string;
  currentIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  totalItems?: number;
}

export default function FilePreview({
  attachmentId,
  photoId,
  noteId,
  attachmentType,
  proofFiles = [],
  proofText,
  proofLink,
  currentIndex = 0,
  onNext,
  onPrev,
  totalItems = 1
}: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

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

  // Determine file type for photos or proof files
  const getFileType = (url: string) => {
    if (url.startsWith('data:image/')) return 'image';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
    if (/\.(pdf)$/i.test(url)) return 'pdf';
    if (/\.(doc|docx)$/i.test(url)) return 'document';
    if (/\.(txt)$/i.test(url)) return 'text';

    // Handle portfolio items that might have a different URL structure
    if (url.includes('/api/') || url.includes('/uploads/')) {
      // Assume it's an image if it's from our API or uploads directory
      return 'image';
    }

    return 'unknown';
  };

  // Generate download link for photos
  const getDownloadLink = (fileData: string, mimeType: string, fileName: string) => {
    return `data:${mimeType};base64,${fileData}`;
  };

  // Handle file opening in new tab
  const openInNewTab = (url: string, mimeType: string) => {
    const newWindow = window.open();
    if (newWindow) {
      if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Image Preview</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9f9f9; }
                img { max-width: 95%; max-height: 95%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${url}" alt="Image preview" />
            </body>
          </html>
        `);
      } else if (mimeType.includes('pdf') || /\.(pdf)$/i.test(url)) {
        newWindow.document.write(`
          <html>
            <head>
              <title>PDF Preview</title>
              <style>
                body { margin: 0; }
                .pdf-container { width: 100%; height: 100vh; }
              </style>
            </head>
            <body>
              <embed src="${url}" type="application/pdf" width="100%" height="100%" />
            </body>
          </html>
        `);
      } else {
        // For other file types or links, just redirect to the URL
        newWindow.location.href = url;
      }
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

  // Render task proof
  if (attachmentType === 'task-proof') {
    // Handle text proof
    if (proofText) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">Text Proof</div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const blob = new Blob([proofText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'proof.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="border rounded-md p-4 bg-gray-50">
            <p className="whitespace-pre-wrap">{proofText}</p>
          </div>
        </div>
      );
    }

    // Handle link proof
    if (proofLink) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">Link Proof</div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(proofLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </Button>
          </div>

          <div className="border rounded-md p-4 bg-gray-50">
            <a 
              href={proofLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {proofLink}
            </a>
          </div>
        </div>
      );
    }

    // Handle file proofs
    if (proofFiles.length > 0) {
      const currentFile = proofFiles[currentIndex];
      const fileType = getFileType(currentFile);
      const isImage = fileType === 'image';
      const isPdf = fileType === 'pdf';

      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">File Proof {totalItems > 1 ? `(${currentIndex + 1} of ${totalItems})` : ''}</div>
            <div className="flex gap-2">
              {totalItems > 1 && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onPrev}
                    disabled={currentIndex === 0}
                  >
                    ←
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onNext}
                    disabled={currentIndex === totalItems - 1}
                  >
                    →
                  </Button>
                </>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openInNewTab(currentFile, isImage ? 'image/jpeg' : isPdf ? 'application/pdf' : '')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <a 
                href={currentFile} 
                download="proof"
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
                src={currentFile}
                alt="Proof preview"
                className={`${isExpanded ? 'max-w-full' : 'h-full object-contain'}`}
                onClick={() => setIsExpanded(!isExpanded)}
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="flex flex-col items-center justify-center p-4">
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Failed to load image</p>
                </div>
              )}
            </div>
          )}

          {isPdf && (
            <div className="border rounded-md overflow-hidden bg-gray-50 h-[400px]">
              <embed 
                src={currentFile}
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
                href={currentFile} 
                download="proof"
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

    // Fallback if no proof is available
    return (
      <div className="p-4 text-center">
        <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">No proof available</p>
      </div>
    );
  }

  // Render photo preview (original functionality)
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
              onClick={() => openInNewTab(getDownloadLink(photo.fileData, photo.mimeType, photo.title || 'download'), photo.mimeType)}
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

  // Render note preview (original functionality)
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