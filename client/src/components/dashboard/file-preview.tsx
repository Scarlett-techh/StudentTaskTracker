import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  attachmentId?: number;
  photoId?: number;
  noteId?: number;
  attachmentType: "photo" | "note" | "task-proof";
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
  totalItems = 1,
}: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [pdfError, setPdfError] = React.useState(false);

  // Fetch photo data if this is a photo attachment
  const { data: photo, isLoading: isLoadingPhoto } = useQuery({
    queryKey: [`/api/photos/${photoId}`],
    enabled: attachmentType === "photo" && !!photoId,
  });

  // Fetch note data if this is a note attachment
  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: [`/api/notes/${noteId}`],
    enabled: attachmentType === "note" && !!noteId,
  });

  // Determine file type for photos or proof files
  const getFileType = (url: string) => {
    // Handle data URIs first
    if (url.startsWith("data:")) {
      const matches = url.match(/^data:([^;]+);/);
      if (matches && matches[1]) {
        const mimeType = matches[1];
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.includes("pdf")) return "pdf";
        if (mimeType.includes("text")) return "text";
        if (
          mimeType.includes("document") ||
          mimeType.includes("msword") ||
          mimeType.includes("wordprocessing")
        )
          return "document";
        return "unknown";
      }
    }

    // Handle regular URLs - check both file extension and URL patterns
    const urlLower = url.toLowerCase();

    // Image extensions
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(urlLower)) return "image";
    // PDF extensions
    if (/\.(pdf)$/i.test(urlLower)) return "pdf";
    // Document extensions
    if (/\.(doc|docx|ppt|pptx|xls|xlsx|odt|ods|odp)$/i.test(urlLower))
      return "document";
    // Text extensions
    if (/\.(txt|md|json|xml|csv|log)$/i.test(urlLower)) return "text";

    // Handle API endpoints and uploads - check for common patterns
    if (
      url.includes("/api/") ||
      url.includes("/uploads/") ||
      url.includes("/files/")
    ) {
      // Try to determine from URL pattern or query parameters
      if (
        url.includes("type=image") ||
        url.includes("image") ||
        url.match(/\/images?\//)
      )
        return "image";
      if (url.includes("type=pdf") || url.includes("pdf")) return "pdf";
      if (url.includes("type=document") || url.includes("document"))
        return "document";

      // Default to image for uploads if we can't determine
      return "image";
    }

    return "unknown";
  };

  // Get MIME type from data URI
  const getMimeType = (url: string): string => {
    if (url.startsWith("data:")) {
      const matches = url.match(/^data:([^;]+);/);
      return matches && matches[1] ? matches[1] : "application/octet-stream";
    }
    return "application/octet-stream";
  };

  // Generate filename for download
  const getFileName = (url: string, index: number): string => {
    if (url.startsWith("data:")) {
      const mimeType = getMimeType(url);
      const extension = mimeType.split("/")[1] || "bin";
      return `proof-${index + 1}.${extension}`;
    }

    // Extract filename from URL if possible
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastPart = pathname.split("/").pop();
      if (lastPart && lastPart.includes(".")) {
        return lastPart;
      }
    } catch {
      // If URL parsing fails, try simple string extraction
      const urlParts = url.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes(".")) {
        return lastPart;
      }
    }

    return `proof-${index + 1}`;
  };

  // Handle file opening in new tab
  const openInNewTab = (url: string) => {
    // For non-data URLs, just open directly
    if (!url.startsWith("data:")) {
      window.open(url, "_blank");
      return;
    }

    // For data URLs, create a new window with the content
    const newWindow = window.open();
    if (newWindow) {
      const fileType = getFileType(url);
      const mimeType = getMimeType(url);

      if (fileType === "image") {
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
              <img src="${url}" alt="Image preview" onerror="this.style.display='none'; document.body.innerHTML='<div style=\\'display: flex; justify-content: center; align-items: center; height: 100vh;\\'><p>Failed to load image</p></div>';" />
            </body>
          </html>
        `);
      } else if (fileType === "pdf") {
        newWindow.document.write(`
          <html>
            <head>
              <title>PDF Preview</title>
              <style>
                body { margin: 0; }
                .pdf-container { width: 100%; height: 100vh; }
                .error { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
              </style>
            </head>
            <body>
              <embed src="${url}" type="application/pdf" width="100%" height="100%" onerror="document.body.innerHTML='<div class=\\'error\\'><p>Failed to load PDF</p><p><a href=\\'${url}\\' download>Download instead</a></p></div>';" />
            </body>
          </html>
        `);
      } else {
        // For other file types, create a download link
        newWindow.document.write(`
          <html>
            <head>
              <title>File Download</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
              </style>
            </head>
            <body>
              <p>This file type cannot be previewed in the browser.</p>
              <a href="${url}" download="file">Download File</a>
            </body>
          </html>
        `);
      }
    }
  };

  // Handle file download
  const handleDownload = (url: string, index: number) => {
    const fileName = getFileName(url, index);

    if (url.startsWith("data:")) {
      // For data URIs, create a download link
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For regular URLs, create a temporary link for download
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get display URL for files (handles both data URIs and regular URLs)
  const getDisplayUrl = (url: string): string => {
    if (url.startsWith("data:")) {
      return url;
    }

    // For regular URLs, ensure they're absolute
    if (url.startsWith("/")) {
      return `${window.location.origin}${url}`;
    }

    // If it's already an absolute URL, return as is
    if (url.startsWith("http")) {
      return url;
    }

    // For relative URLs without leading slash, add it
    return `${window.location.origin}/${url}`;
  };

  // Render loading state
  if (
    (attachmentType === "photo" && isLoadingPhoto) ||
    (attachmentType === "note" && isLoadingNote)
  ) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 animate-pulse">
        Loading file...
      </div>
    );
  }

  // Render task proof
  if (attachmentType === "task-proof") {
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
                const blob = new Blob([proofText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "proof.txt";
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

          <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
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
              onClick={() => window.open(proofLink, "_blank")}
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
      const displayUrl = getDisplayUrl(currentFile);
      const fileType = getFileType(currentFile);
      const isImage = fileType === "image";
      const isPdf = fileType === "pdf";
      const isText = fileType === "text";
      const isDocument = fileType === "document";

      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">
              File Proof{" "}
              {totalItems > 1 ? `(${currentIndex + 1} of ${totalItems})` : ""}
            </div>
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
                onClick={() => openInNewTab(displayUrl)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(displayUrl, currentIndex)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {isImage && (
            <div
              className={`border rounded-md overflow-hidden bg-gray-50 flex justify-center ${isExpanded ? "h-auto" : "max-h-96"}`}
            >
              <img
                src={displayUrl}
                alt="Proof preview"
                className={`${isExpanded ? "max-w-full" : "max-h-96 object-contain"}`}
                onClick={() => setIsExpanded(!isExpanded)}
                onError={() => setImageError(true)}
                style={{ cursor: isExpanded ? "zoom-out" : "zoom-in" }}
              />
              {imageError && (
                <div className="flex flex-col items-center justify-center p-4">
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Failed to load image</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(displayUrl, currentIndex)}
                    className="mt-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {isPdf && (
            <div className="border rounded-md overflow-hidden bg-gray-50 h-96">
              <embed
                src={displayUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                onError={() => setPdfError(true)}
              />
              {pdfError && (
                <div className="flex flex-col items-center justify-center p-4 h-full">
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Failed to load PDF
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(displayUrl, currentIndex)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {isText && currentFile.startsWith("data:text") && (
            <div className="border rounded-md bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="p-4 whitespace-pre-wrap text-sm">
                {atob(currentFile.split(",")[1])}
              </pre>
            </div>
          )}

          {(isDocument || (!isImage && !isPdf && !isText)) && (
            <div className="border rounded-md p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-2" />
              <p className="font-medium">
                {isDocument ? "Document Preview" : "File preview not available"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {isDocument
                  ? "Document files can be downloaded and opened with appropriate software"
                  : "This file type cannot be previewed directly"}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => openInNewTab(displayUrl)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(displayUrl, currentIndex)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
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
  if (attachmentType === "photo" && photo && photo.fileData) {
    const fileType = getFileType(photo.mimeType);
    const isImage = fileType === "image";
    const isPdf = fileType === "pdf";

    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-medium">{photo.title || "File Preview"}</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openInNewTab(`data:${photo.mimeType};base64,${photo.fileData}`)
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleDownload(
                  `data:${photo.mimeType};base64,${photo.fileData}`,
                  0,
                )
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {isImage && (
          <div
            className={`border rounded-md overflow-hidden bg-gray-50 flex justify-center ${isExpanded ? "h-auto" : "max-h-96"}`}
          >
            <img
              src={`data:${photo.mimeType};base64,${photo.fileData}`}
              alt={photo.title || "Image preview"}
              className={`${isExpanded ? "max-w-full" : "max-h-96 object-contain"}`}
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ cursor: isExpanded ? "zoom-out" : "zoom-in" }}
            />
          </div>
        )}

        {isPdf && (
          <div className="border rounded-md overflow-hidden bg-gray-50 h-96">
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
            <p className="text-sm text-muted-foreground mb-4">
              This file type cannot be previewed directly
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  openInNewTab(
                    `data:${photo.mimeType};base64,${photo.fileData}`,
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleDownload(
                    `data:${photo.mimeType};base64,${photo.fileData}`,
                    0,
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render note preview (original functionality)
  if (attachmentType === "note" && note) {
    return (
      <div className="p-4 space-y-4">
        <div className="font-medium">{note.title || "Note Preview"}</div>
        <div className="border rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
          <p className="whitespace-pre-wrap">{note.content || "No content"}</p>
        </div>
      </div>
    );
  }

  // Render fallback if data is not available
  return (
    <div className="p-4 text-center">
      <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">
        This attachment is no longer available
      </p>
    </div>
  );
}
