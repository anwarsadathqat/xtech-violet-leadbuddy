
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";
import AdminHeader from "@/components/admin/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedLeadManagement from "@/components/admin/EnhancedLeadManagement";
import LeadBuddyChat from "@/components/admin/LeadBuddyChat";
import LeadAnalytics from "@/components/admin/LeadAnalytics";
import LeadAutomation from "@/components/admin/LeadAutomation";

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
        title: "🎉 Welcome to XTech Admin",
        description: "LeadBuddy AI is now active and monitoring your leads",
      });
    } else {
      toast({
        title: "Access denied",
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
          <p className="text-xtech-light">Initializing LeadBuddy AI...</p>
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
              <h2 className="text-3xl font-bold text-white">XTech Admin Portal</h2>
              <p className="mt-2 text-sm text-gray-400">AI-Powered Lead Management Platform</p>
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-blue-400 text-sm">🤖 LeadBuddy AI is ready to automate your lead lifecycle</p>
              </div>
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
                  placeholder="Enter admin password"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple transition-all duration-200"
                >
                  Access Admin Dashboard
                </button>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Demo Password: xtech-admin-2023
                </p>
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
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/5 border border-white/10">
            <TabsTrigger value="leads" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-xtech-purple data-[state=active]:to-xtech-blue">
              Lead Management
            </TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-xtech-purple data-[state=active]:to-xtech-blue">
              AI Automation
            </TabsTrigger>
            <TabsTrigger value="leadbuddy" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-xtech-purple data-[state=active]:to-xtech-blue">
              LeadBuddy Chat
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-xtech-purple data-[state=active]:to-xtech-blue">
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <EnhancedLeadManagement />
          </TabsContent>
          
          <TabsContent value="automation" className="space-y-4">
            <LeadAutomation />
          </TabsContent>
          
          <TabsContent value="leadbuddy" className="space-y-4">
            <LeadBuddyChat />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <LeadAnalytics />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
};

export default AdminDashboard;
