
import React from 'react';
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

const LeadStatusBadge = ({ status, className }: LeadStatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'contacted':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'qualified':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'converted':
        return "bg-green-100 text-green-800 border-green-200";
      case 'lost':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span className={cn(
      "px-2 py-1 text-xs font-medium rounded-full border",
      getStatusColor(status),
      className
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default LeadStatusBadge;
