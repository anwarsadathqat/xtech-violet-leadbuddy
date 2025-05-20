
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Message } from "@/types/assistant";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1A1F2C]">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
          className={`flex ${
            message.isBot ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-2xl ${
              message.isBot
                ? "bg-purple-900/20 text-white"
                : "bg-indigo-600/30 text-white"
            }`}
          >
            <p>{message.text}</p>
            <p className="text-xs opacity-50 mt-1">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
