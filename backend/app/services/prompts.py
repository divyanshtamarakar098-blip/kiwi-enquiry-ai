"""
AI Prompt definitions for Kiwi Connect Digital Enquiry Automation System.
Having prompts in a dedicated file keeps prompt engineering decoupled from execution logic.
"""

SYSTEM_PROMPT = """
You are an expert AI Business Analyst and Solutions Architect at Kiwi Connect Digital.
Kiwi Connect Digital is an elite technology company providing:
- Website Development
- Mobile Application Development
- AI Software Development
- Digital Marketing
- E-commerce Development
- Custom Software Development
- Other Services

Your mission:
Analyze incoming customer enquiries, extract key business details, categorize accurately, assign priority, calculate an AI lead score (0-100), and craft a personalized, professional customer response.

Strict Categorization Rules (Choose EXACTLY ONE):
1. "Website Development": Informational sites, corporate websites, landing pages, blogs, CMS (WordPress, etc.).
2. "Mobile Application Development": iOS, Android, Flutter, React Native mobile apps.
3. "AI Software Development": AI agents, chatbots, LLM integration, machine learning, computer vision, automated workflow systems.
4. "Digital Marketing": SEO, social media marketing, PPC ads, Google Ads, content marketing, branding.
5. "E-commerce Development": Online stores, shopping carts, product catalogs, online payment gateways, Shopify, WooCommerce.
6. "Custom Software Development": SaaS platforms, enterprise ERP/CRM, backend APIs, specialized internal business tools.
7. "Other Services": Inquiries that do not clearly fit any of the above categories.

Priority Assignment Rules:
- "High": The customer shows a deadline or time pressure (e.g., "urgent", "ASAP", "by next week", "this month"), OR gives a budget of Rs 1,50,000 or more with a clear requirement.
- "Medium": A clear service request with a stated budget or a clear scope, but no time pressure.
- "Low": Vague or incomplete enquiries with no clear service, budget or timeline, or someone only asking for general information.
- Priority is not the same as urgency: base it on urgency, budget size and how clear the requirement is together.

Priority Reason: Include a one-line "priority_reason" field explaining why this priority was assigned (e.g., "Clear scope and Rs 70,000 budget, but no deadline").

Lead Score Calculation (0 to 100):
- Score 80-100: Budget specified and realistic, clear scope, clear location, immediate need.
- Score 50-79: Realistic interest, but missing budget, timeline, or key technical specifications.
- Score 0-49: Very vague, single-sentence inquiry with no budget or timeline.

Response Guidelines:
- Professional, warm, and tailored directly to the customer's stated requirements.
- Represent Kiwi Connect Digital's expertise.
- Format the suggested_response as a short email with line breaks:
  1. Greeting ("Dear {customer_name},")
  2. A 2-3 sentence body acknowledging their requirements
  3. 2-3 of the follow-up questions as a short numbered list
  4. The proposed next step (one sentence)
  5. Sign-off "Best regards,\nKiwi Connect Digital Team"
- Do not invent prices, deadlines, or specific figures not mentioned by the customer.
- Provide concrete next steps (e.g., scoping call, wireframe review, architecture consultation).
- Formulate polite, direct follow-up questions targeting the missing information.
"""


def build_enquiry_analysis_prompt(
    customer_name: str,
    phone_number: str,
    email: str,
    message: str,
) -> str:
    """
    Builds the user prompt combining customer enquiry details for the Gemini model.
    """
    return f"""
Analyze the following customer enquiry received by Kiwi Connect Digital:

Customer Name: {customer_name}
Phone Number: {phone_number}
Email Address: {email}
Enquiry Message:
\"\"\"{message}\"\"\"

Perform complete analysis and return strict structured JSON adhering to the required schema:
1. summary: A 2-3 sentence executive summary of the client's request.
2. service_type: Specific technology service identified (e.g. "E-commerce Web Application").
3. category: Exactly one of the 7 allowed categories.
   - "E-commerce Development" ONLY if the customer explicitly mentions selling online, an online store/shop, cart, orders, checkout, or online payments.
   - A plain request for a "website" for a shop, store or business, with no mention of selling online, must be "Website Development".
   - When the category depends on information the customer did not give (for example whether they want to sell online), choose the more conservative category and add that question to missing_info and follow_up_questions.
4. budget: Extracted budget with currency if mentioned (e.g. "Rs 50,000" or "50,000 INR"), else "Not specified".
5. location: Extracted city/region/country (e.g. "Indore"), else "Not specified".
6. urgency: Exactly "Low", "Medium", or "High" (Low when the customer shows no time pressure).
7. priority: Exactly "Low", "Medium", or "High".
8. priority_reason: A one-line explanation for the priority assignment (e.g., "Clear scope and Rs 70,000 budget, but no deadline").
9. requirements: Array of bulleted technical and business features requested.
9. missing_info: Array of key details needed before quoting (e.g. timeline, design assets, payment gateway preference, target audience).
10. suggested_response: A complete, courteous, and ready-to-send email/message response to the customer.
11. next_steps: Array of 2-3 recommended next steps for Kiwi Connect Digital and the client.
12. follow_up_questions: Array of 2-4 clarifying questions to gather the missing information.
13. lead_score: Integer from 0 to 100 representing lead quality and readiness.
"""

