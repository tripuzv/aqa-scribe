import React, { useState, useEffect } from 'react';
import { Activity, Clock, Wifi, WifiOff, Image } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  onOpenScreenshotGallery?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ connectionStatus, onOpenScreenshotGallery }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <Wifi className="text-green-600" size={16} />
            ) : (
              <WifiOff className="text-red-600" size={16} />
            )}
            <span className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Server Info */}
          {connectionStatus.connected && (
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={16} />
              <span>MCP Server Active</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Screenshot Gallery Button */}
          {onOpenScreenshotGallery && (
            <button
              onClick={onOpenScreenshotGallery}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Image size={16} />
              <span>Screenshots</span>
            </button>
          )}

          {/* Current Time */}
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Uptime */}
          <div className="flex items-center gap-2">
            <Activity size={16} />
            <span>Uptime: {formatUptime(uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar; 