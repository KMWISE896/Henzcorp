import React from 'react';
import Alert from './Alert';
import type { AlertProps } from './Alert';
import type { AlertData } from '../hooks/useAlert';

interface AlertContainerProps {
  alerts: AlertData[];
  onClose: (id: string) => void;
}

export default function AlertContainer({ alerts, onClose }: AlertContainerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="relative h-full">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              top: `${16 + index * 80}px`,
              left: '16px',
              right: '16px',
              zIndex: 50 + index
            }}
          >
            <Alert
              id={alert.id}
              type={alert.type}
              title={alert.title}
              message={alert.message}
              duration={alert.duration}
              onClose={onClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
}