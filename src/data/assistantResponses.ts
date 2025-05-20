
export const initialMessages = [
  {
    text: "Hi there! I'm XTech Assistant. How can I help you today?",
    isBot: true,
    timestamp: new Date(),
  },
];

export const predefinedResponses: Record<string, string[]> = {
  "hello": ["Hello! How can I assist you with XTech's services today?", "Hi there! I'm XTech Assistant. What can I help you with?"],
  "services": [
    "XTech offers three main services: AI Implementation, Cloud Solutions, and Digital Transformation. Would you like more details about any specific service?",
    "Our core services include AI Implementation, Cloud Solutions, and Digital Transformation. Each is customized to your business needs. Which interests you most?"
  ],
  "pricing": [
    "Our pricing is customized based on your specific requirements. Would you like to schedule a consultation to receive a personalized quote?",
    "XTech pricing varies depending on project scope, timeline, and complexity. Our team would be happy to provide a detailed proposal after understanding your needs."
  ],
  "contact": [
    "You can reach our team through the contact form on our website, schedule a consultation call, or email us directly at contact@xtech.com.",
    "The best way to contact us is through our online form, or call us at +1-234-567-8900 for immediate assistance."
  ],
  "ai": [
    "Our AI implementation team specializes in custom solutions that transform business operations. We design, build, and deploy AI systems tailored to your specific industry challenges.",
    "XTech's AI services include predictive analytics, machine learning integration, automated decision systems, and intelligent process automation."
  ],
  "cloud": [
    "Our cloud solutions offer secure, scalable infrastructure tailored to your business. We handle migration, optimization, and ongoing management of cloud resources.",
    "XTech provides end-to-end cloud services including multi-cloud strategies, infrastructure-as-code, containerization, and cloud-native application development."
  ],
  "digital": [
    "Our digital transformation services help organizations evolve into data-driven, agile businesses. We modernize legacy systems, optimize processes, and build new digital capabilities.",
    "XTech approaches digital transformation holistically - addressing technology, people, and process changes required for true organizational evolution."
  ],
  "consultation": [
    "We'd be happy to schedule a free consultation with one of our experts. Please provide your contact information and preferred time, and we'll reach out to you.",
    "Our consultations are personalized to understand your specific challenges. Would you like to speak with a specialist in AI, cloud, or digital transformation?"
  ],
  "yes": [
    "Great! What specific topic or service would you like our expert to help you with? We have specialists in AI implementation, cloud solutions, and digital transformation.",
    "Excellent! Please let me know which area you need assistance with, and I'll connect you with the right specialist. You can also provide your contact details for a follow-up."
  ],
  "no": [
    "No problem! If you have any other questions I can help with, please feel free to ask.",
    "That's fine. Is there anything else I can assist you with today?"
  ]
};
