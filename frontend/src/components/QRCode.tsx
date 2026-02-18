import { useState, useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }, (err) => {
      if (err) {
        setError('Failed to generate QR code');
        console.error('QR Code error:', err);
      }
    });
  }, [value, size]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'secret-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="qr-container">
        <canvas
          ref={canvasRef}
          className="rounded"
        />
      </div>
      <button
        onClick={downloadQR}
        className="btn btn-secondary text-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download QR
      </button>
    </div>
  );
}
