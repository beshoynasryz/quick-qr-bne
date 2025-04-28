
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchQrCodes, deleteQrCode } from "@/lib/api";
import { QrCode } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function QRCodeHistory() {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQrCodes();
  }, []);

  const loadQrCodes = async () => {
    try {
      setLoading(true);
      const data = await fetchQrCodes();
      setQrCodes(data);
    } catch (error) {
      console.error("Failed to load QR codes", error);
      toast({
        title: "Error",
        description: "Failed to load your QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQrCode(id);
      setQrCodes(qrCodes.filter((code) => code.id !== id));
      toast({
        title: "Success",
        description: "QR code deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete QR code", error);
      toast({
        title: "Error",
        description: "Failed to delete QR code",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You haven't generated any QR codes yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your QR Code History</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="shadow-sm">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                  <div 
                    className="text-sm font-medium truncate mb-1" 
                    title={qrCode.content}
                  >
                    {qrCode.content}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive -mt-1 -mr-1"
                  onClick={() => setDeleteId(qrCode.id)}
                >
                  <Trash size={16} />
                </Button>
              </div>
              
              <div className="mt-2 flex justify-center">
                <div 
                  className="border border-gray-200 rounded-md p-1 bg-white"
                  style={{ 
                    width: Math.min(qrCode.size, 150),
                    height: Math.min(qrCode.size, 150)
                  }}
                >
                  <img
                    src={qrCode.imageUrl}
                    alt="QR Code"
                    style={{ 
                      width: "100%", 
                      height: "100%",
                      objectFit: "contain"
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the QR code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
