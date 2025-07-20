import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, Wifi, WifiOff } from 'lucide-react';
import { ConnectionStatus, Config } from '../types';

interface ConnectionPanelProps {
  onInitialize: () => void;
  onConnect: (serverPathOrUrl: string) => void;
  onDisconnect: () => void;
  connectionStatus: ConnectionStatus;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  onInitialize,
  onConnect,
  onDisconnect,
  connectionStatus
}) => {
  const [serverPathOrUrl, setServerPathOrUrl] = useState('');
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      await onInitialize();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!serverPathOrUrl.trim()) return;
    
    setIsLoading(true);
    try {
      await onConnect(serverPathOrUrl);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await onDisconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'claude':
        return '🧠';
      case 'ollama':
        return '🦙';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
          {connectionStatus.connected ? (
            <Wifi className="text-green-600" size={20} />
          ) : (
            <WifiOff className="text-red-600" size={20} />
          )}
        </div>
        
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus.connected ? 'status-connected' : 'status-disconnected'
        }`}>
          {connectionStatus.connected ? 'Connected' : 'Disconnected'}
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {connectionStatus.message}
        </p>
      </div>

      {/* Configuration Card */}
      {config && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Provider:</span>
              <span className="text-sm font-medium">
                {getProviderIcon(config.aiProvider)} {config.aiProvider}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Model:</span>
              <span className="text-sm font-medium">{config.model}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Max Tokens:</span>
              <span className="text-sm font-medium">{config.maxTokens}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Temperature:</span>
              <span className="text-sm font-medium">{config.temperature}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Keys:</span>
                <div className="flex gap-2">
                  {config.hasOpenAIKey && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">OpenAI</span>
                  )}
                  {config.hasClaudeKey && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Claude</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Controls</h3>
        
        <div className="space-y-4">
          {/* Initialize Button */}
          <button
            onClick={handleInitialize}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            Initialize MCP Client
          </button>

          {/* Server URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MCP Server Path/URL
            </label>
            <input
              type="text"
              value={serverPathOrUrl}
              onChange={(e) => setServerPathOrUrl(e.target.value)}
              placeholder="e.g., ./my-server.py or http://localhost:8931/sse"
              className="input-field"
              disabled={isLoading}
            />
          </div>

          {/* Connect/Disconnect Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={!serverPathOrUrl.trim() || isLoading || connectionStatus.connected}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              Connect
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={isLoading || !connectionStatus.connected}
              className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square size={16} />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Examples</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => setServerPathOrUrl('./my-server.py')}
            className="text-left w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Local Python Server
          </button>
          
          <button
            onClick={() => setServerPathOrUrl('http://localhost:8931/sse')}
            className="text-left w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
          >
            HTTP SSE Server
          </button>
          
          <button
            onClick={() => setServerPathOrUrl('ws://localhost:8931')}
            className="text-left w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
          >
            WebSocket Server
          </button>
        </div>
      </div>

      {/* Screenshot Test */}
      {connectionStatus.connected && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshot Test</h3>
          <p className="text-sm text-gray-600 mb-3">
            Test the screenshot functionality with these example queries:
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                // This will be handled by the parent component
                const event = new CustomEvent('screenshotTest', {
                  detail: 'Take a screenshot of the current page'
                });
                window.dispatchEvent(event);
              }}
              className="text-left w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
            >
              📸 Take Screenshot
            </button>
            <button
              onClick={() => {
                const event = new CustomEvent('screenshotTest', {
                  detail: 'Navigate to google.com and take a screenshot'
                });
                window.dispatchEvent(event);
              }}
              className="text-left w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors"
            >
              🌐 Google + Screenshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel; 