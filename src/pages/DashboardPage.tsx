
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { QRCodeHistory } from "@/components/qr/QRCodeHistory";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Create New QR Code</h2>
            <QRCodeGenerator />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <QRCodeHistory />
        </div>
      </div>
    </div>
  );
}
