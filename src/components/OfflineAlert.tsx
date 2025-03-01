import React from 'react';
import { Alert } from 'react-bootstrap';
import { WifiOff } from 'lucide-react';

const OfflineAlert: React.FC = () => {
  return (
    <Alert variant="warning" className="d-flex align-items-center">
      <WifiOff size={20} className="me-2" />
      <div>
        You are currently offline. Some features may be limited, and you're viewing cached data.
      </div>
    </Alert>
  );
};

export default OfflineAlert;