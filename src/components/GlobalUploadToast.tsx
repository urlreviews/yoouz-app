import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Video } from 'lucide-react';

interface UploadState {
  id: string;
  percent: number;
  statusText: string;
  isError: boolean;
  isComplete: boolean;
}

export const GlobalUploadToast: React.FC = () => {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});

  useEffect(() => {
    const handleProgress = (e: any) => {
      const { id, percent, statusText } = e.detail;
      setUploads(prev => ({
        ...prev,
        [id]: { id, percent, statusText, isError: false, isComplete: false }
      }));
    };

    const handleSuccess = (e: any) => {
      const { id } = e.detail;
      setUploads(prev => ({
        ...prev,
        [id]: { ...prev[id], percent: 100, statusText: "Upload complete!", isError: false, isComplete: true }
      }));
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setUploads(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 5000);
    };

    const handleError = (e: any) => {
      const { id, error } = e.detail;
      setUploads(prev => ({
        ...prev,
        [id]: { ...prev[id], statusText: "Upload failed. " + (error.message || ""), isError: true, isComplete: true }
      }));
      
      setTimeout(() => {
        setUploads(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 7000);
    };

    window.addEventListener("copo-upload-progress", handleProgress);
    window.addEventListener("copo-upload-success", handleSuccess);
    window.addEventListener("copo-upload-error", handleError);

    return () => {
      window.removeEventListener("copo-upload-progress", handleProgress);
      window.removeEventListener("copo-upload-success", handleSuccess);
      window.removeEventListener("copo-upload-error", handleError);
    };
  }, []);

  const activeUploads = Object.values(uploads);

  if (activeUploads.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {activeUploads.map((up) => (
        <div key={up.id} className="bg-zinc-900 text-white rounded-2xl p-4 border border-zinc-800 shadow-2xl flex items-center gap-4 w-72 pointer-events-auto animate-in slide-in-from-right-8 duration-300">
          <div className="shrink-0">
            {up.isError ? (
              <XCircle className="w-8 h-8 text-red-500" />
            ) : up.isComplete ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <Video className="w-3 h-3 text-white absolute" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold truncate">
                {up.isError ? "Upload Failed" : up.isComplete ? "Published!" : "Uploading Video"}
              </p>
              {!up.isComplete && !up.isError && (
                <span className="text-xs font-medium text-blue-400">{up.percent}%</span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate">{up.statusText}</p>
            
            {!up.isComplete && !up.isError && (
              <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${up.percent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
