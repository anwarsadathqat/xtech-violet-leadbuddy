
import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, BarChart2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminHeaderProps {
  onLogout: () => void;
}

const AdminHeader = ({ onLogout }: AdminHeaderProps) => {
  return (
    <header className="bg-xtech-dark-purple border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/admin" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">XTech Admin</span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/admin" className="text-xtech-light hover:text-xtech-blue transition-colors flex items-center gap-2">
                <Users size={18} />
                <span>Leads</span>
              </Link>
              <Link to="/admin?tab=analytics" className="text-xtech-light hover:text-xtech-blue transition-colors flex items-center gap-2">
                <BarChart2 size={18} />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-1 bg-xtech-blue/10 rounded-full">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
              <span className="text-sm text-xtech-light">LeadBuddy Active</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xtech-light hover:text-white hover:bg-red-500/20"
              onClick={onLogout}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
