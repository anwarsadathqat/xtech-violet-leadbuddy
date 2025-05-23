
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";
import LeadManagement from "@/components/admin/LeadManagement";
import LeadBuddyChat from "@/components/admin/LeadBuddyChat";
import AdminHeader from "@/components/admin/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Simple authentication check - in a real app, you would implement a proper auth system
  useEffect(() => {
    const checkAuth = async () => {
      // For MVP, we're using a simple authentication check
      // In a production application, you would integrate with Supabase Auth
      const adminPassword = localStorage.getItem('adminPassword');
      if (adminPassword === 'xtech-admin-2023') {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (password: string) => {
    if (password === 'xtech-admin-2023') {
      localStorage.setItem('adminPassword', password);
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "Welcome to the XTech Admin Dashboard",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-xtech-dark">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-t-4 border-b-4 border-xtech-blue rounded-full animate-spin"></div>
          <p className="text-xtech-light">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-xtech-dark flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md p-8 space-y-8 bg-white/5 backdrop-blur-lg rounded-lg shadow-lg border border-white/10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Admin Login</h2>
              <p className="mt-2 text-sm text-gray-400">Enter your password to access the admin dashboard</p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const password = (e.target as HTMLFormElement).password.value;
              handleLogin(password);
            }}>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-xtech-blue focus:border-xtech-blue"
                  placeholder="Admin Password"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
        <Footer />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-xtech-dark">
      <AdminHeader onLogout={handleLogout} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="leadbuddy">LeadBuddy Assistant</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <LeadManagement />
          </TabsContent>
          
          <TabsContent value="leadbuddy" className="space-y-4">
            <LeadBuddyChat />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="p-8 rounded-lg bg-white/5 backdrop-blur-lg border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Lead Analytics</h2>
              <p className="text-gray-400">Analytics dashboard will be implemented in the next phase.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
};

export default AdminDashboard;
