
import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Copy, 
  Download, 
  QrCode, 
  Globe, 
  Mail, 
  Phone, 
  Wifi,
  Contact, 
  FileText,
  Files,
  FilePen,
  ImageIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveQrCode } from "@/lib/api";
import { QrDataType } from "@/types";
import { generateQrData } from "@/lib/qr-utils";

export function QRCodeGenerator() {
  // Basic state
  const [qrContent, setQrContent] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrForeground, setQrForeground] = useState("#000000");
  const [qrBackground, setQrBackground] = useState("#FFFFFF");
  const [size, setSize] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataType, setDataType] = useState<QrDataType>("url");
  const [downloadFormat, setDownloadFormat] = useState<"png" | "svg" | "pdf">("png");
  
  // Form fields for different QR types
  const [email, setEmail] = useState({ address: "", subject: "", body: "" });
  const [phone, setPhone] = useState("");
  const [wifi, setWifi] = useState({ ssid: "", password: "", encryption: "WPA" });
  const [vcard, setVcard] = useState({ name: "", phone: "", email: "", org: "", title: "" });
  
  // Logo embedding
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoSize, setLogoSize] = useState(30); // % of QR code size
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle logo selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 500000) { // 500KB limit
      toast({
        title: "Error",
        description: "Logo must be less than 500KB",
        variant: "destructive",
      });
      return;
    }
    
    setLogo(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setLogoPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Size presets
  const handleSizePreset = (preset: "small" | "medium" | "large") => {
    const sizes = {
      small: 150,
      medium: 250,
      large: 350
    };
    setSize(sizes[preset]);
  };

  // Generate QR code
  const generateQRCode = async () => {
    // Generate the appropriate content based on data type
    const content = generateQrData({
      type: dataType,
      url: qrContent,
      email: email,
      phone: phone,
      wifi: wifi,
      vcard: vcard,
    });
    
    if (!content) {
      toast({
        title: "Error",
        description: "Please enter valid content for the QR code",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create the QR code
      const qrDataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 1,
        color: {
          dark: qrForeground,
          light: qrBackground,
        },
      });
      
      // Apply logo if one is selected
      if (logoPreview) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const qrImage = new Image();
        
        qrImage.onload = async () => {
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;
          
          // Draw QR code
          if (ctx) {
            ctx.drawImage(qrImage, 0, 0);
          
            // Draw logo in center
            if (logoPreview) {
              const logoImg = new Image();
              logoImg.onload = () => {
                const logoWidth = qrImage.width * (logoSize / 100);
                const logoHeight = logoWidth;
                const x = (qrImage.width - logoWidth) / 2;
                const y = (qrImage.height - logoHeight) / 2;
                
                // Create white background for logo
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(x - 5, y - 5, logoWidth + 10, logoHeight + 10);
                
                // Draw logo
                ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
                
                // Convert to data URL
                const finalQrWithLogo = canvas.toDataURL('image/png');
                setQrImage(finalQrWithLogo);
                saveToDatabaseIfLoggedIn(content);
              };
              logoImg.src = logoPreview;
            }
          }
        };
        qrImage.src = qrDataUrl;
      } else {
        setQrImage(qrDataUrl);
        saveToDatabaseIfLoggedIn(content);
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

  // Save to database if user is logged in
  const saveToDatabaseIfLoggedIn = async (content: string) => {
    if (user) {
      try {
        await saveQrCode({
          content: content,
          color: qrForeground,
          size,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to save QR code to history", error);
      }
    }
  };

  const downloadQRCode = () => {
    if (!qrImage) return;
    
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `bne-qr-code-${Date.now()}.${downloadFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: `QR Code downloaded as ${downloadFormat.toUpperCase()}`,
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
          {/* Data Type Selection */}
          <div className="space-y-2">
            <Label>QR Code Type</Label>
            <Tabs defaultValue="url" className="w-full" onValueChange={(value) => setDataType(value as QrDataType)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="url" className="flex flex-col items-center">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs mt-1">URL</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex flex-col items-center">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs mt-1">Email</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex flex-col items-center">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs mt-1">Phone</span>
                </TabsTrigger>
                <TabsTrigger value="wifi" className="flex flex-col items-center">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs mt-1">WiFi</span>
                </TabsTrigger>
                <TabsTrigger value="vcard" className="flex flex-col items-center">
                  <Contact className="h-4 w-4" />
                  <span className="text-xs mt-1">vCard</span>
                </TabsTrigger>
              </TabsList>
              
              {/* URL Content */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="url-input">Website URL</Label>
                  <Input
                    id="url-input"
                    value={qrContent}
                    onChange={(e) => setQrContent(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>
              </TabsContent>
              
              {/* Email Content */}
              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-address">Email Address</Label>
                  <Input
                    id="email-address"
                    value={email.address}
                    onChange={(e) => setEmail({...email, address: e.target.value})}
                    placeholder="example@domain.com"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject (optional)</Label>
                  <Input
                    id="email-subject"
                    value={email.subject}
                    onChange={(e) => setEmail({...email, subject: e.target.value})}
                    placeholder="Meeting Request"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-body">Body (optional)</Label>
                  <Input
                    id="email-body"
                    value={email.body}
                    onChange={(e) => setEmail({...email, body: e.target.value})}
                    placeholder="Hello, I would like to schedule a meeting..."
                    className="w-full"
                  />
                </div>
              </TabsContent>
              
              {/* Phone Content */}
              <TabsContent value="phone" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-input">Phone Number</Label>
                  <Input
                    id="phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full"
                  />
                </div>
              </TabsContent>
              
              {/* WiFi Content */}
              <TabsContent value="wifi" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
                  <Input
                    id="wifi-ssid"
                    value={wifi.ssid}
                    onChange={(e) => setWifi({...wifi, ssid: e.target.value})}
                    placeholder="My WiFi Network"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-password">Password</Label>
                  <Input
                    id="wifi-password"
                    type="password"
                    value={wifi.password}
                    onChange={(e) => setWifi({...wifi, password: e.target.value})}
                    placeholder="WiFi Password"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-encryption">Encryption Type</Label>
                  <Select 
                    value={wifi.encryption} 
                    onValueChange={(value) => setWifi({...wifi, encryption: value})}
                  >
                    <SelectTrigger id="wifi-encryption">
                      <SelectValue placeholder="Select encryption type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="nopass">No Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              {/* vCard Content */}
              <TabsContent value="vcard" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="vcard-name">Full Name</Label>
                  <Input
                    id="vcard-name"
                    value={vcard.name}
                    onChange={(e) => setVcard({...vcard, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vcard-phone">Phone</Label>
                  <Input
                    id="vcard-phone"
                    value={vcard.phone}
                    onChange={(e) => setVcard({...vcard, phone: e.target.value})}
                    placeholder="+1234567890"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vcard-email">Email</Label>
                  <Input
                    id="vcard-email"
                    value={vcard.email}
                    onChange={(e) => setVcard({...vcard, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vcard-org">Organization</Label>
                  <Input
                    id="vcard-org"
                    value={vcard.org}
                    onChange={(e) => setVcard({...vcard, org: e.target.value})}
                    placeholder="Company Inc."
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vcard-title">Job Title</Label>
                  <Input
                    id="vcard-title"
                    value={vcard.title}
                    onChange={(e) => setVcard({...vcard, title: e.target.value})}
                    placeholder="Senior Developer"
                    className="w-full"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Size Control */}
            <div className="space-y-2">
              <Label>QR Code Size</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSizePreset("small")}
                  className={size === 150 ? "bg-primary text-primary-foreground" : ""}
                >
                  Small
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSizePreset("medium")}
                  className={size === 250 ? "bg-primary text-primary-foreground" : ""}
                >
                  Medium
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSizePreset("large")}
                  className={size === 350 ? "bg-primary text-primary-foreground" : ""}
                >
                  Large
                </Button>
              </div>
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

            {/* Colors */}
            <div className="space-y-2">
              <Label>QR Code Colors</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: qrForeground }}
                      />
                      Foreground
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4">
                    <HexColorPicker color={qrForeground} onChange={setQrForeground} />
                    <Input 
                      value={qrForeground} 
                      onChange={(e) => setQrForeground(e.target.value)} 
                      className="mt-2" 
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: qrBackground }}
                      />
                      Background
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4">
                    <HexColorPicker color={qrBackground} onChange={setQrBackground} />
                    <Input 
                      value={qrBackground} 
                      onChange={(e) => setQrBackground(e.target.value)} 
                      className="mt-2" 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Logo embedding */}
          <div className="space-y-2">
            <Label>Embed Logo (optional)</Label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {logo ? 'Change Logo' : 'Select Logo'}
                </Button>
                {logo && (
                  <div className="mt-2">
                    <Label>Logo Size: {logoSize}%</Label>
                    <Slider
                      value={[logoSize]}
                      min={10}
                      max={50}
                      step={5}
                      onValueChange={(value) => setLogoSize(value[0])}
                      className="py-4"
                    />
                  </div>
                )}
              </div>
              {logoPreview && (
                <div className="h-16 w-16 border rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-full w-full object-contain" 
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Download format options */}
          <div className="space-y-2">
            <Label>Download Format</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={downloadFormat === "png" ? "bg-primary text-primary-foreground" : ""} 
                onClick={() => setDownloadFormat("png")}
              >
                <FilePen className="h-4 w-4 mr-2" />
                PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={downloadFormat === "svg" ? "bg-primary text-primary-foreground" : ""} 
                onClick={() => setDownloadFormat("svg")}
              >
                <Files className="h-4 w-4 mr-2" />
                SVG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={downloadFormat === "pdf" ? "bg-primary text-primary-foreground" : ""} 
                onClick={() => setDownloadFormat("pdf")}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Generate button */}
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
