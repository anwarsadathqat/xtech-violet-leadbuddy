
import { Message } from "@/types/assistant";
import { predefinedResponses } from "@/data/assistantResponses";

export const findResponse = (query: string, expertRequested: boolean): string => {
  const lowercaseQuery = query.toLowerCase();
  
  // Handle the case when a user responds "yes" after being asked about an expert
  if (expertRequested && (lowercaseQuery === "yes" || lowercaseQuery === "y")) {
    return "Great! To connect you with the right expert, could you please let me know which specific service you're interested in (AI Implementation, Cloud Solutions, or Digital Transformation)? Or you can provide your email for a follow-up.";
  }
  
  // Check each keyword for a match
  for (const [keyword, responses] of Object.entries(predefinedResponses)) {
    if (lowercaseQuery.includes(keyword)) {
      // Randomly select one of the available responses for variety
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // If no specific match is found, check for general topic matches
  if (lowercaseQuery.includes("help") || lowercaseQuery.includes("support")) {
    return "I'd be happy to help! Could you please specify what kind of assistance you're looking for? We offer help with AI implementation, cloud solutions, and digital transformation.";
  }
  
  if (lowercaseQuery.includes("cost") || lowercaseQuery.includes("fee")) {
    return "Our pricing is tailored to each client's specific needs. Would you like to discuss your project requirements so we can provide a customized quote?";
  }
  
  if (lowercaseQuery.includes("time") || lowercaseQuery.includes("long") || lowercaseQuery.includes("duration")) {
    return "Project timelines vary based on scope and complexity. Typically, our implementations range from 2-12 weeks. Would you like to discuss your specific project needs?";
  }
  
  // Default response with an offer to connect with an expert
  return "I don't have specific information about that. Would you like to speak with one of our experts who can provide more detailed assistance?";
};
