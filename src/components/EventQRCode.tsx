import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface EventQRCodeProps {
  qrCodeId: string;
  eventTitle: string;
}

const EventQRCode: React.FC<EventQRCodeProps> = ({ qrCodeId, eventTitle }) => {
  return (
    <div className="event-qr-container p-4 border rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{eventTitle}</h3>
      <div className="qr-code-wrapper flex justify-center">
        <QRCodeSVG value={qrCodeId} size={256} level="H" includeMargin={true} />
      </div>
      <p className="mt-4 text-sm text-gray-600 text-center">
        Scan this QR code to mark your attendance
      </p>
    </div>
  );
};

export default EventQRCode;
