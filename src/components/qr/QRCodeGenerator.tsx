
import { useState, useRef } from "react";
import QRCode from "qrcode";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Copy, Download, QrCode } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveQrCode } from "@/lib/api";

export function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrColor, setQrColor] = useState("#1EAEDB");
  const [size, setSize] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateQRCode = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL or text",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create the QR code
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: {
          dark: qrColor,
          light: "#FFFFFF",
        },
      });
      
      setQrImage(qrDataUrl);

      // If user is logged in, save to history
      if (user) {
        try {
          await saveQrCode({
            content: text,
            color: qrColor,
            size,
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Failed to save QR code to history", error);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
      console.error("Error generating QR code", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrImage) return;
    
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `bne-qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "QR Code downloaded successfully",
    });
  };

  const copyToClipboard = async () => {
    if (!qrImage) return;
    
    try {
      await navigator.clipboard.writeText(qrImage);
      toast({
        title: "Success",
        description: "QR Code URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
      console.error("Error copying to clipboard", error);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card className="shadow-md">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="qr-text">Enter URL or Text</Label>
            <Input
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com or your text"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>QR Code Size</Label>
              <Slider
                value={[size]}
                min={100}
                max={400}
                step={50}
                onValueChange={(value) => setSize(value[0])}
                className="py-4"
              />
              <div className="text-sm text-muted-foreground text-center">
                {size} x {size} px
              </div>
            </div>

            <div className="space-y-2">
              <Label>QR Code Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ color: qrColor }}
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: qrColor }}
                    />
                    {qrColor}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                  <HexColorPicker color={qrColor} onChange={setQrColor} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button 
            onClick={generateQRCode} 
            className="w-full"
            disabled={isGenerating}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generate QR Code
          </Button>
          
          {qrImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="border border-gray-200 rounded-md p-2 bg-white">
                  <img 
                    src={qrImage} 
                    alt="Generated QR Code" 
                    className="mx-auto"
                    style={{ width: size, height: size }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={copyToClipboard}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button 
                  onClick={downloadQRCode}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
