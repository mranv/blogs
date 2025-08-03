"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Palette,
  Users,
  Cloud,
  ShieldCheck,
  Github,
} from "lucide-react";
import { cn } from "@utils/cn";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // Simulate API call
    setTimeout(() => {
      if (isLoginMode) {
        // Login logic
        if (email === "demo@example.com" && password === "demo123") {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userEmail", email);
          setMessage({
            text: "Login successful! Redirecting...",
            type: "success",
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setMessage({
            text: "Invalid email or password. Try demo@example.com / demo123",
            type: "error",
          });
        }
      } else {
        // Signup logic
        if (password !== confirmPassword) {
          setMessage({ text: "Passwords do not match!", type: "error" });
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setMessage({
            text: "Password must be at least 6 characters long!",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // For demo purposes, just log them in
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", email);
        setMessage({
          text: "Account created successfully! Redirecting...",
          type: "success",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
      setLoading(false);
    }, 2000);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setMessage({ text: "", type: "" });
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-container">
      {/* Background gradient using theme colors */}
      <div className="auth-background-gradient"></div>

      <div className="auth-card">
        <div className="grid min-h-[700px] lg:grid-cols-2">
          {/* Left Side - Brand Section */}
          <div className="auth-brand-side">
            <div>
              <div className="mb-12 text-lg font-semibold uppercase text-primary">
                PixelForge Studio
              </div>
              <h1 className="mb-4 text-6xl font-medium text-foreground">
                Create, Design, and Innovate
              </h1>
              <p className="mb-12 text-xl text-muted-foreground">
                Join thousands of creators who trust PixelForge Studio to bring
                their vision to life
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: <Palette size={16} />,
                    title: "Advanced Design Tools",
                    desc: "Professional-grade tools for every project",
                  },
                  {
                    icon: <Users size={16} />,
                    title: "Team Collaboration",
                    desc: "Work together seamlessly in real-time",
                  },
                  {
                    icon: <Cloud size={16} />,
                    title: "Cloud Storage",
                    desc: "Access your projects from anywhere",
                  },
                  {
                    icon: <ShieldCheck size={16} />,
                    title: "Enterprise Security",
                    desc: "Bank-level security for your data",
                  },
                ].map(({ icon, title, desc }, i) => (
                  <div
                    key={i}
                    className="feature-item animate-fadeInUp flex items-center"
                    style={{ animationDelay: `${0.2 * (i + 1)}s` }}
                  >
                    <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary backdrop-blur-sm">
                      {icon}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Authentication Form */}
          <div className="auth-form-side">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-light uppercase text-foreground">
                  {isLoginMode ? "Welcome back" : "Create account"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isLoginMode
                    ? "Sign in to continue your creative journey"
                    : "Join us and start creating amazing content"}
                </p>
              </div>

              {message.text && (
                <div
                  className={cn(
                    "auth-message",
                    message.type === "success" ? "success" : "error"
                  )}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium uppercase text-foreground"
                  >
                    Email address
                  </label>
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="auth-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium uppercase text-foreground"
                  >
                    Password
                  </label>
                  <div className="auth-input-group">
                    <div className="auth-input-icon">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="auth-input pr-12"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="auth-toggle-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLoginMode && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium uppercase text-foreground"
                    >
                      Confirm Password
                    </label>
                    <div className="auth-input-group">
                      <div className="auth-input-icon">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        className="auth-input pr-12"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-muted-foreground">
                    <input type="checkbox" className="auth-checkbox" />
                    <span className="ml-2">Remember me</span>
                  </label>
                  <a
                    href="#"
                    className="text-primary hover:text-primary/80 text-sm transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="ml-2">
                        {isLoginMode ? "Signing in..." : "Creating account..."}
                      </span>
                    </>
                  ) : isLoginMode ? (
                    "Sign in to your account"
                  ) : (
                    "Create account"
                  )}
                </button>

                <div className="auth-divider">
                  <span className="auth-divider-text">Or continue with</span>
                </div>

                <div className="auth-oauth-grid">
                  <button type="button" className="auth-button-oauth">
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      className="h-5 w-5"
                      alt="Google"
                    />
                    <span className="ml-2">Google</span>
                  </button>
                  <button type="button" className="auth-button-oauth">
                    <Github className="h-5 w-5" />
                    <span className="ml-2">GitHub</span>
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                {isLoginMode
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {isLoginMode ? "Sign up for free" : "Sign in"}
                </button>
              </div>

              {/* Demo Credentials */}
              <div className="auth-demo-credentials">
                <p className="text-sm text-foreground mb-2 font-medium">
                  Demo Credentials:
                </p>
                <p className="text-xs text-muted-foreground">
                  Email: demo@example.com
                </p>
                <p className="text-xs text-muted-foreground">
                  Password: demo123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
