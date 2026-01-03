/**
 * AI-Powered Chatbot System
 * Natural language processing, intent recognition, and intelligent responses
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
}

export interface ChatContext {
  userId: string;
  sessionId: string;
  messages: ChatMessage[];
  userProfile?: {
    name: string;
    role: string;
    preferences: Record<string, any>;
  };
}

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
}

/**
 * Intent patterns for matching user queries
 */
const INTENT_PATTERNS = {
  greeting: [
    /^(hi|hello|hey|good\s+(morning|afternoon|evening))/i,
    /^how\s+are\s+you/i,
  ],
  
  goodbye: [
    /^(bye|goodbye|see\s+you|thanks|thank\s+you)/i,
  ],

  stock_check: [
    /how\s+(much|many).*stock/i,
    /what.*(stock|inventory).*level/i,
    /check.*stock/i,
    /do\s+we\s+have/i,
    /how\s+many.*left/i,
  ],

  product_search: [
    /find.*product/i,
    /search.*for/i,
    /looking\s+for/i,
    /where.*is/i,
    /show.*me/i,
  ],

  order_status: [
    /where.*order/i,
    /order.*status/i,
    /track.*order/i,
    /when.*arrive/i,
  ],

  create_order: [
    /create.*order/i,
    /place.*order/i,
    /new.*order/i,
    /order.*(product|item)/i,
  ],

  low_stock_alert: [
    /low.*stock/i,
    /running.*out/i,
    /reorder/i,
    /need.*to.*order/i,
  ],

  sales_report: [
    /sales.*report/i,
    /how.*much.*sold/i,
    /revenue/i,
    /performance/i,
  ],

  help: [
    /help/i,
    /what.*can.*you.*do/i,
    /how.*to/i,
    /need.*assistance/i,
  ],

  price_inquiry: [
    /how\s+much.*cost/i,
    /what.*price/i,
    /price.*of/i,
  ],
};

/**
 * Extract entities from user message
 */
function extractEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // Extract numbers
  const numbers = message.match(/\d+/g);
  if (numbers) {
    entities.numbers = numbers.map(n => parseInt(n));
  }

  // Extract product names (simple heuristic - words after "for", "of", "about")
  const productMatch = message.match(/(?:for|of|about)\s+([a-z\s]+?)(?:\s|$|,|\.|\?)/i);
  if (productMatch?.[1]) {
    entities.product = productMatch[1].trim();
  }

  // Extract dates (simple patterns)
  const datePatterns = [
    /today/i,
    /yesterday/i,
    /last\s+week/i,
    /this\s+month/i,
  ];

  datePatterns.forEach(pattern => {
    if (pattern.test(message)) {
      entities.timeframe = pattern.source.replace(/\\/g, '').replace(/i$/, '');
    }
  });

  return entities;
}

/**
 * Recognize intent from user message
 */
export function recognizeIntent(message: string): Intent {
  const normalized = message.toLowerCase().trim();

  for (const [intentName, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        const entities = extractEntities(message);
        return {
          name: intentName,
          confidence: 0.9,
          entities,
        };
      }
    }
  }

  // Default unknown intent
  return {
    name: "unknown",
    confidence: 0.5,
    entities: extractEntities(message),
  };
}

/**
 * Generate response based on intent
 */
export function generateResponse(intent: Intent, context: ChatContext): string {
  const { name, entities } = intent;

  switch (name) {
    case "greeting":
      return context.userProfile?.name
        ? `Hello ${context.userProfile.name}! How can I help you today?`
        : "Hello! How can I assist you with your inventory management today?";

    case "goodbye":
      return "Thank you for using LogiVox! Have a great day!";

    case "stock_check":
      if (entities.product) {
        return `Let me check the stock level for "${entities.product}". One moment...`;
      }
      return "Which product would you like to check stock for?";

    case "product_search":
      if (entities.product) {
        return `Searching for "${entities.product}"...`;
      }
      return "What product are you looking for?";

    case "order_status":
      if (entities.numbers && entities.numbers.length > 0) {
        return `Looking up order #${entities.numbers[0]}...`;
      }
      return "Please provide your order number so I can track it for you.";

    case "create_order":
      if (entities.product) {
        return `I can help you create an order for "${entities.product}". How many units would you like to order?`;
      }
      return "What product would you like to order?";

    case "low_stock_alert":
      return "I'll show you all products with low stock levels that need reordering...";

    case "sales_report":
      if (entities.timeframe) {
        return `Generating sales report for ${entities.timeframe}...`;
      }
      return "What time period would you like the sales report for? (e.g., today, this week, this month)";

    case "price_inquiry":
      if (entities.product) {
        return `Let me check the price for "${entities.product}"...`;
      }
      return "Which product's price would you like to know?";

    case "help":
      return `I can help you with:
• Check stock levels
• Search for products
• Track orders
• Create new orders
• View low stock alerts
• Generate sales reports
• Check product prices

What would you like to do?`;

    default:
      return "I'm not sure I understand. Could you rephrase that? Or type 'help' to see what I can do.";
  }
}

/**
 * Chatbot class for managing conversations
 */
export class Chatbot {
  private contexts: Map<string, ChatContext> = new Map();

  /**
   * Start a new chat session
   */
  startSession(userId: string, userProfile?: ChatContext["userProfile"]): string {
    const sessionId = Math.random().toString(36).substring(7);
    
    this.contexts.set(sessionId, {
      userId,
      sessionId,
      messages: [],
      userProfile,
    });

    return sessionId;
  }

  /**
   * Send a message and get response
   */
  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error("Session not found");
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    context.messages.push(userMessage);

    // Recognize intent
    const intent = recognizeIntent(message);

    // Generate response
    const responseContent = generateResponse(intent, context);

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
      intent: intent.name,
      entities: intent.entities,
    };
    context.messages.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): ChatMessage[] {
    const context = this.contexts.get(sessionId);
    return context?.messages || [];
  }

  /**
   * Clear session
   */
  endSession(sessionId: string) {
    this.contexts.delete(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): string[] {
    return Array.from(this.contexts.entries())
      .filter(([_, context]) => context.userId === userId)
      .map(([sessionId]) => sessionId);
  }
}

/**
 * Quick replies for common actions
 */
export const QUICK_REPLIES = [
  { label: "Check Stock", action: "stock_check" },
  { label: "Low Stock Alerts", action: "low_stock_alert" },
  { label: "Create Order", action: "create_order" },
  { label: "Sales Report", action: "sales_report" },
  { label: "Search Products", action: "product_search" },
  { label: "Help", action: "help" },
];

/**
 * Suggested questions based on context
 */
export function getSuggestedQuestions(context: ChatContext): string[] {
  const lastIntent = context.messages[context.messages.length - 1]?.intent;

  const suggestions: Record<string, string[]> = {
    greeting: [
      "Show me low stock items",
      "What were today's sales?",
      "Search for a product",
    ],
    stock_check: [
      "Show me more products",
      "Create a reorder",
      "View all low stock items",
    ],
    product_search: [
      "Check stock level",
      "View product details",
      "Create an order",
    ],
    order_status: [
      "Create a new order",
      "View all orders",
      "Track another order",
    ],
  };

  return (suggestions[lastIntent ?? "greeting"] ?? suggestions.greeting) || [];
}

/**
 * Format chatbot response with rich content
 */
export interface RichResponse {
  text: string;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
  data?: any;
  type: "text" | "product" | "order" | "report" | "alert";
}

export function formatRichResponse(intent: Intent, data?: any): RichResponse {
  switch (intent.name) {
    case "stock_check":
      return {
        text: data?.product
          ? `${data.product.name} has ${data.product.stock} units in stock.`
          : "Product not found.",
        type: "product",
        data,
        actions: data?.product
          ? [
              { label: "Create Order", action: "create_order", data: data.product },
              { label: "View Details", action: "view_product", data: data.product },
            ]
          : undefined,
      };

    case "low_stock_alert":
      return {
        text: `Found ${data?.products?.length || 0} products with low stock.`,
        type: "alert",
        data,
        actions: [
          { label: "View All", action: "view_low_stock" },
          { label: "Create Reorders", action: "bulk_reorder" },
        ],
      };

    case "sales_report":
      return {
        text: `Sales report for ${data?.period || "today"}`,
        type: "report",
        data,
        actions: [
          { label: "Download PDF", action: "download_report", data: { format: "pdf" } },
          { label: "View Details", action: "view_full_report" },
        ],
      };

    default:
      return {
        text: generateResponse(intent, {} as ChatContext),
        type: "text",
      };
  }
}
