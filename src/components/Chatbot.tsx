import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Search, Bot, User } from "lucide-react";
import Fuse from "fuse.js";
import type { SearchItem } from "./SearchReact";

export interface ChatbotProps {
  searchList: SearchItem[];
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  searchResults?: SearchItem[];
}

export default function Chatbot({ searchList }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fuse = new Fuse(searchList, {
    keys: ["title", "description"],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.4,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chatbot is first opened
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Hi! I'm your blog assistant. I can help you search for articles or answer questions about the content. What are you looking for?",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const searchArticles = (query: string): SearchItem[] => {
    return fuse
      .search(query)
      .map(({ item }) => item)
      .slice(0, 5);
  };

  const generateResponse = (
    userMessage: string
  ): { text: string; searchResults?: SearchItem[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Check if it's a greeting
    if (
      lowerMessage.match(
        /^(hi|hello|hey|good morning|good afternoon|good evening)/
      )
    ) {
      return {
        text: "Hello! I'm here to help you find the perfect article. You can ask me about security, DevOps, technology topics, or just tell me what you're interested in learning about.",
      };
    }

    // Check if it's a help request
    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("what can you do")
    ) {
      return {
        text: "I can help you:\n• Search for specific articles by topic\n• Find posts about security, DevOps, automation\n• Recommend articles based on your interests\n• Answer questions about the blog content\n\nJust tell me what you're looking for!",
      };
    }

    // Search for articles
    const searchResults = searchArticles(userMessage);

    if (searchResults.length > 0) {
      const response =
        searchResults.length === 1
          ? "I found a great article that matches your search:"
          : `I found ${searchResults.length} articles that might interest you:`;

      return {
        text: response,
        searchResults,
      };
    } else {
      return {
        text: "I couldn't find any articles matching your search. Try searching for topics like 'security', 'automation', 'DevOps', 'cloud', or 'containers'. You can also ask me about specific technologies!",
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const { text, searchResults } = generateResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text,
        isBot: true,
        timestamp: new Date(),
        searchResults,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-toggle text-white rounded-full p-4 shadow-lg"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window absolute bottom-16 right-0 w-96 h-[32rem] bg-skin-card rounded-2xl border border-skin-line flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-skin-accent text-skin-inverted p-4 flex items-center gap-3">
            <div className="bg-skin-inverted/20 rounded-full p-2">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Blog Assistant</h3>
              <p className="text-sm opacity-90">
                Here to help you find articles
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`chatbot-message max-w-[80%] ${message.isBot ? "bg-skin-card-muted text-skin-base" : "bg-skin-accent text-skin-inverted"} rounded-2xl p-3`}
                >
                  <div className="flex items-start gap-2">
                    {message.isBot && (
                      <Bot className="h-4 w-4 mt-1 text-skin-accent flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">
                        {message.text}
                      </p>

                      {/* Search Results */}
                      {message.searchResults &&
                        message.searchResults.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.searchResults.map(result => (
                              <a
                                key={result.slug}
                                href={`/posts/${result.slug}/`}
                                className="block p-3 bg-skin-card rounded-lg border border-skin-line hover:border-skin-accent/30 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <h4 className="font-medium text-sm text-skin-base mb-1">
                                  {result.title}
                                </h4>
                                <p className="text-xs text-skin-base/70 line-clamp-2">
                                  {result.description}
                                </p>
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                    {!message.isBot && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-skin-card-muted rounded-2xl p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-skin-accent" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-skin-base/40 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-skin-base/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-skin-base/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-skin-line">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about articles..."
                className="flex-1 px-4 py-2 border border-skin-line rounded-full focus:outline-none focus:ring-2 focus:ring-skin-accent focus:border-transparent bg-skin-card text-skin-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-skin-accent hover:bg-skin-accent/90 disabled:bg-skin-base/30 disabled:cursor-not-allowed text-skin-inverted rounded-full p-2 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
