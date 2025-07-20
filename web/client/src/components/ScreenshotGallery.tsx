import React, { useState, useEffect } from 'react';
import { Download, Eye, Trash2, RefreshCw } from 'lucide-react';

interface Screenshot {
  name: string;
  path: string;
  size: number;
  created: string;
}

interface ScreenshotGalleryProps {
  isVisible: boolean;
  onClose: () => void;
}

const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ isVisible, onClose }) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/screenshots');
      if (response.ok) {
        const data = await response.json();
        setScreenshots(data.screenshots || []);
      }
    } catch (error) {
      console.error('Failed to fetch screenshots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchScreenshots();
    }
  }, [isVisible]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadScreenshot = (path: string, name: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Screenshot Gallery</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchScreenshots}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              <p>Loading screenshots...</p>
            </div>
          ) : screenshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No screenshots found</p>
              <p className="text-sm">Screenshots will appear here when taken during automation</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots.map((screenshot) => (
                <div
                  key={screenshot.name}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                    {selectedScreenshot === screenshot.name ? (
                      <img
                        src={screenshot.path}
                        alt={screenshot.name}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    ) : (
                      <button
                        onClick={() => setSelectedScreenshot(screenshot.name)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm truncate" title={screenshot.name}>
                      {screenshot.name}
                    </h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Size: {formatFileSize(screenshot.size)}</p>
                      <p>Created: {formatDate(screenshot.created)}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadScreenshot(screenshot.path, screenshot.name)}
                        className="btn-primary flex-1 flex items-center justify-center gap-1 text-xs"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenshotGallery; 