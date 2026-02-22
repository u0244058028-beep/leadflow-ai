// Erstatt den gamle prompten med denne
const prompt = `You are an expert in creating HIGH-CONVERTING lead generation pages.

Create a landing page specifically designed to CAPTURE LEADS for a business.

Business details:
- Name: ${form.businessName || form.businessType}
- Type: ${form.businessType}
- Target audience: ${form.targetAudience}
- Goal: ${goalOptions.find(g => g.value === form.goal)?.label}

IMPORTANT RULES:
1. This is for LEAD GENERATION, not selling a product
2. NO mentions of "free trial", "credit card", or "pricing"
3. Focus on getting visitors to SUBMIT THEIR INFORMATION
4. Offer something valuable in exchange (e-book, guide, consultation, demo)
5. The CTA should be about getting the offer, not about buying

Return a JSON object with this exact format:
{
  "title": "Benefit-driven headline about what they'll get",
  "subheadline": "Brief explanation of the value they'll receive",
  "description": "What they'll learn or get by submitting",
  "offer": "What they get in exchange for their info (e.g., 'Free eBook', 'Expert Consultation')",
  "benefits": ["Benefit 1 of the offer", "Benefit 2", "Benefit 3"],
  "fields": [
    { "type": "text", "label": "Full Name", "placeholder": "John Doe" },
    { "type": "email", "label": "Email Address", "placeholder": "john@company.com" }
  ],
  "buttonText": "Get My Free Guide",
  "trustElements": ["No spam, unsubscribe anytime", "We respect your privacy"]
}

Make it compelling and focused on LEAD GENERATION, not sales.`