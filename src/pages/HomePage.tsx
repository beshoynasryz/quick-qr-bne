
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";

export default function HomePage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">BNE QR Code Generator</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate custom QR codes for your website, text, or any data. 
          Customize colors and size, then download or share.
        </p>
      </div>
      
      <QRCodeGenerator />
    </div>
  );
}
