import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function AlertsList({ alerts }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${getSeverityClass(alert.severity)} flex items-start`}
        >
          <div className="mr-4">{getSeverityIcon(alert.severity)}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">{alert.title}</h3>
              <span className="text-sm text-gray-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span>Source: {alert.sourceIP}</span>
              <span>Destination: {alert.destinationIP}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                alert.status === 'new' ? 'bg-red-500/20 text-red-400' :
                alert.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
