import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Search, Bot, User, Tag } from "lucide-react";
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

  // Extract all unique tags from the search list
  const allTags = Array.from(
    new Set(
      searchList.flatMap(
        item => item.data.tags?.map(tag => tag.toLowerCase()) || []
      )
    )
  ).sort();

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
        text: `Hi! I'm your Static Tag Assistant. I can help you find articles by topic.

Popular topics include: ${allTags.slice(0, 10).join(", ")}${allTags.length > 10 ? "..." : ""}

Type /help to see available commands or just type any topic to search!`,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const searchArticlesByTags = (query: string): SearchItem[] => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

    // Find matching tags
    const matchingTags = allTags.filter(tag =>
      queryWords.some(word => tag.includes(word) || word.includes(tag))
    );

    // If no matching tags, try to find tags that contain any query word
    if (matchingTags.length === 0) {
      const partialMatches = allTags.filter(tag =>
        queryWords.some(word =>
          tag
            .split(/[-_]/)
            .some(tagPart => tagPart.includes(word) || word.includes(tagPart))
        )
      );
      matchingTags.push(...partialMatches);
    }

    // Find articles that have any of the matching tags
    const matchedArticles = searchList.filter(item => {
      const itemTags = item.data.tags?.map(tag => tag.toLowerCase()) || [];
      return matchingTags.some(tag => itemTags.includes(tag));
    });

    // Sort by relevance (number of matching tags)
    matchedArticles.sort((a, b) => {
      const aTags = a.data.tags?.map(tag => tag.toLowerCase()) || [];
      const bTags = b.data.tags?.map(tag => tag.toLowerCase()) || [];
      const aMatches = matchingTags.filter(tag => aTags.includes(tag)).length;
      const bMatches = matchingTags.filter(tag => bTags.includes(tag)).length;
      return bMatches - aMatches;
    });

    return matchedArticles.slice(0, 5);
  };

  const generateResponse = (
    userMessage: string
  ): { text: string; searchResults?: SearchItem[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for slash commands
    if (userMessage.startsWith("/")) {
      const command = userMessage.slice(1).toLowerCase().split(" ")[0];
      const args = userMessage.slice(command.length + 2).trim();

      switch (command) {
        case "help":
          return {
            text: `Available commands:

/help - Show this help message
/tags - List all available tags
/recent - Show recent articles
/featured - Show featured articles
/search <query> - Search for articles by tags
/clear - Clear chat history
/about - About this Static Tag Assistant

Or just type any topic to search!`,
          };

        case "tags":
          return {
            text: `Available tags (${allTags.length} total):

${allTags.map(tag => `• ${tag}`).join("\n")}`,
          };

        case "recent":
          const recentPosts = searchList
            .sort((a, b) => {
              const dateA = new Date(a.data.pubDatetime).getTime();
              const dateB = new Date(b.data.pubDatetime).getTime();
              return dateB - dateA;
            })
            .slice(0, 5);
          return {
            text: "Here are the most recent articles:",
            searchResults: recentPosts,
          };

        case "featured":
          const featuredPosts = searchList.filter(post => post.data.featured);
          if (featuredPosts.length > 0) {
            return {
              text: "Here are the featured articles:",
              searchResults: featuredPosts.slice(0, 5),
            };
          } else {
            return {
              text: "No featured articles found.",
            };
          }

        case "search":
          if (!args) {
            return {
              text: "Please provide a search query. Usage: /search <topic>",
            };
          }
          const searchResults = searchArticlesByTags(args);
          if (searchResults.length > 0) {
            return {
              text: `Search results for "${args}":`,
              searchResults,
            };
          } else {
            return {
              text: `No articles found for "${args}". Try /tags to see available topics.`,
            };
          }

        case "clear":
          // Clear will be handled in handleSendMessage
          return {
            text: "Chat history cleared!",
          };

        case "about":
          return {
            text: `I'm your Static Tag Assistant! I help you find articles using tag-based search.

I can search through ${searchList.length} articles across ${allTags.length} different topics.

Type /help to see available commands or just type any topic to search!`,
          };

        default:
          return {
            text: `Unknown command: /${command}. Type /help for available commands.`,
          };
      }
    }

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
        text: `I can help you find articles by topic. Available topics include:

${allTags.map(tag => `• ${tag}`).join("\n")}

Just type any topic you're interested in!`,
      };
    }

    // Search for articles by tags
    const searchResults = searchArticlesByTags(userMessage);

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
      // Suggest similar tags if no exact match
      const suggestedTags = allTags
        .filter(
          tag =>
            tag.includes(queryLower.split(/\s+/)[0]) ||
            queryLower.split(/\s+/).some(word => tag.includes(word))
        )
        .slice(0, 5);

      return {
        text: `I couldn't find articles matching "${userMessage}". ${
          suggestedTags.length > 0
            ? `Did you mean: ${suggestedTags.join(", ")}?`
            : `Try searching for topics like: ${allTags.slice(0, 8).join(", ")}`
        }`,
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if it's the clear command
    if (inputValue.toLowerCase() === "/clear") {
      setMessages([]);
      setInputValue("");
      // Add welcome message again after clearing
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Chat cleared! How can I help you find articles today?

Type /help to see available commands or just type any topic to search!`,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      return;
    }

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
              <h3 className="font-semibold">Static Tag Assistant</h3>
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
                                <p className="text-xs text-skin-base/70 line-clamp-2 mb-2">
                                  {result.description}
                                </p>
                                {result.data.tags &&
                                  result.data.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {result.data.tags
                                        .slice(0, 3)
                                        .map((tag, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-skin-accent/10 text-skin-accent rounded-full"
                                          >
                                            <Tag className="h-2.5 w-2.5" />
                                            {tag}
                                          </span>
                                        ))}
                                      {result.data.tags.length > 3 && (
                                        <span className="text-xs text-skin-base/50">
                                          +{result.data.tags.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
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
