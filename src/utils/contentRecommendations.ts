
export const getRecommendationMessage = (preference: string): string => {
  switch(preference) {
    case "AI Implementation":
      return "We've highlighted AI implementation content that might interest you";
    case "Cloud Solutions":
      return "Check out our latest cloud solutions case studies below";
    case "Digital Transformation":
      return "We've customized the page with digital transformation insights";
    case "Cost Optimization":
      return "See how our solutions can reduce your operational costs";
    case "Security":
      return "Explore our enterprise-grade security solutions";
    default:
      return "We'll customize your experience based on your interests";
  }
};
