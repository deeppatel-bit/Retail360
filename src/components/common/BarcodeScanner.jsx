import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. Scanner ID નક્કી કરો
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
      fps: 10, // Frames per second
      qrbox: { width: 250, height: 150 }, // Scanning Box Size
      aspectRatio: 1.0 
    };

    // 2. ડાયરેક્ટ કેમેરો ચાલુ કરો (Rear Camera)
    html5QrCode.start(
      { facingMode: "environment" }, // "user" for front, "environment" for back
      config,
      (decodedText) => {
        // 3. સ્કેન સફળ થાય ત્યારે
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            onScanSuccess(decodedText);
        }).catch(err => console.error("Stop failed", err));
      },
      (errorMessage) => {
        // સ્કેનિંગ ચાલુ હોય ત્યારે એરર આવે તો ઈગ્નોર કરો
      }
    ).catch(err => {
      console.error("Camera start failed", err);
    });

    // 4. Cleanup (જ્યારે બંધ કરો ત્યારે કેમેરો બંધ થવો જોઈએ)
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(err => console.error(err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <span className="text-white/80 font-medium text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
            Scanning...
          </span>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Area */}
        <div id="reader" className="w-full h-[400px] bg-black"></div>

        <div className="p-4 bg-gray-900 text-center">
           <p className="text-gray-400 text-xs">Point camera at a barcode to scan</p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;