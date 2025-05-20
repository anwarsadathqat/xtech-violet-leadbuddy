
import React from "react";
import { Zap } from "lucide-react";
import { QuestionData } from "@/types/smartInsights";

interface InsightQuestionProps {
  questionData: QuestionData;
  onResponse: (value: string) => void;
}

const InsightQuestion: React.FC<InsightQuestionProps> = ({ 
  questionData, 
  onResponse 
}) => {
  return (
    <>
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-full bg-purple-600/20 mr-3">
          <Zap size={20} className="text-purple-500" />
        </div>
        <div>
          <h4 className="text-lg font-medium text-white mb-1">Quick Question</h4>
          <p className="text-sm text-gray-300">{questionData.question}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        {questionData.options.slice(0, 2).map((option) => (
          <button 
            key={option}
            onClick={() => onResponse(option)}
            className="text-white py-3 px-4 bg-purple-900/40 hover:bg-purple-800/60 rounded-xl transition-colors text-sm font-medium"
          >
            {option}
          </button>
        ))}
        {questionData.options.slice(2, 4).map((option) => (
          <button 
            key={option}
            onClick={() => onResponse(option)}
            className="text-white py-3 px-4 bg-blue-900/40 hover:bg-blue-800/60 rounded-xl transition-colors text-sm font-medium"
          >
            {option}
          </button>
        ))}
        {questionData.options.length > 4 && (
          <button 
            key={questionData.options[4]}
            onClick={() => onResponse(questionData.options[4])}
            className="text-white py-3 px-4 col-span-2 bg-indigo-900/40 hover:bg-indigo-800/60 rounded-xl transition-colors text-sm font-medium"
          >
            {questionData.options[4]}
          </button>
        )}
      </div>
    </>
  );
};

export default InsightQuestion;
