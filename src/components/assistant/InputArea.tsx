
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputAreaProps {
  onSendMessage: (text: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-purple-500/20 bg-[#1A1F2C]">
      <div className="flex items-center gap-2 bg-[#232838] rounded-full p-1 pl-4 border border-purple-500/20">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-full p-2 h-9 w-9"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

export default InputArea;
