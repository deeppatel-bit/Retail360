import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, // Barcode માટે લંબચોરસ બોક્સ
        aspectRatio: 1.0 
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // સ્કેન સફળ થાય ત્યારે
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // સ્કેનિંગ ચાલુ હોય ત્યારે એરર ઇગ્નોર કરો
      }
    );

    // Cleanup function when component unmounts
    return () => {
      scanner.clear().catch((error) => console.error("Failed to clear scanner. ", error));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-3 border-b bg-gray-100">
          <h3 className="font-bold text-gray-700">Scan Barcode</h3>
          <button onClick={onClose} className="p-1 bg-gray-200 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Camera Viewport */}
        <div id="reader" className="w-full"></div>
        
        <div className="p-4 text-center text-sm text-gray-500">
          Point camera at a barcode to scan automatically.
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;