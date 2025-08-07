"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { logoutUser } from "@/lib/auth";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("role");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-4">
            <Link href="/" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            {user && (
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Logout & Login as Different User
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}