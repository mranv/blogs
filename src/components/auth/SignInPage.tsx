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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-background via-secondary to-background">
      <div className="z-10 w-full max-w-6xl">
        <div className="bg-card/50 backdrop-blur-lg overflow-hidden rounded-[40px] shadow-2xl border border-border/20">
          <div className="grid min-h-[700px] lg:grid-cols-2">
            {/* Left Side */}
            <div className="brand-side relative m-4 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-12 text-foreground border border-border/20">
              <div>
                <div className="mb-12 text-lg font-semibold uppercase text-primary">
                  PixelForge Studio
                </div>
                <h1 className="mb-4 text-6xl font-medium text-foreground">
                  Create, Design, and Innovate
                </h1>
                <p className="mb-12 text-xl text-muted-foreground">
                  Join thousands of creators who trust PixelForge Studio to
                  bring their vision to life
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

            {/* Right Side */}
            <div className="flex flex-col justify-center p-12">
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
                      "mb-6 p-4 rounded-lg text-sm",
                      message.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-600"
                        : "bg-red-500/10 border border-red-500/20 text-red-600"
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
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="border-border bg-input block w-full rounded-lg border py-3 pr-3 pl-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
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
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="border-border bg-input block w-full rounded-lg border py-3 pr-12 pl-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-5 w-5 text-muted-foreground" />
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
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          className="border-border bg-input block w-full rounded-lg border py-3 pr-12 pl-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-muted-foreground flex items-center text-sm">
                      <input
                        type="checkbox"
                        className="border-border text-primary h-4 w-4 rounded focus:ring-2 focus:ring-primary"
                      />
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
                    className="relative flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="ml-2">
                          {isLoginMode
                            ? "Signing in..."
                            : "Creating account..."}
                        </span>
                      </>
                    ) : isLoginMode ? (
                      "Sign in to your account"
                    ) : (
                      "Create account"
                    )}
                  </button>

                  <div className="relative text-center text-sm text-muted-foreground">
                    <div className="absolute inset-0 flex items-center">
                      <div className="border-border w-full border-t"></div>
                    </div>
                    <span className="relative px-2 bg-card">
                      Or continue with
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="border-border bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors"
                    >
                      <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        className="h-5 w-5"
                        alt="Google"
                      />
                      <span className="ml-2">Google</span>
                    </button>
                    <button
                      type="button"
                      className="border-border bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors"
                    >
                      <Github className="h-5 w-5" />
                      <span className="ml-2">GitHub</span>
                    </button>
                  </div>
                </form>

                <div className="text-muted-foreground mt-8 text-center text-sm">
                  {isLoginMode
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    onClick={toggleMode}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {isLoginMode ? "Sign up for free" : "Sign in"}
                  </button>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-secondary/20 rounded-lg border border-border/20">
                  <p className="text-sm text-foreground mb-2">
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
    </div>
  );
}
