
import React from "react";
import { Check } from "lucide-react";

const ThankYouMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="p-2 rounded-full bg-green-600/20 mb-3">
        <Check size={20} className="text-green-500" />
      </div>
      <h4 className="text-lg font-medium text-white mb-1">Thank you!</h4>
      <p className="text-sm text-gray-300 text-center">
        We'll use your feedback to personalize your experience
      </p>
    </div>
  );
};

export default ThankYouMessage;
