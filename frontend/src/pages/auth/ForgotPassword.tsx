import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForgotPassword } from "@/services/authService";
import heroImage from "@/assets/hero-quickcourt.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Missing email",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      await forgotPassword.mutateAsync(email);

      toast({
        title: "Password reset link sent! 📧",
        description:
          "If an account with this email exists, you'll receive a password reset link.",
      });

      // Clear the email input
      setEmail("");
    } catch (error) {
      toast({
        title: "Failed to send reset link",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEO
        title="Forgot Password | QuickCourt"
        description="Reset your QuickCourt account password."
      />

      {/* Left Section - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <img
          src={heroImage}
          alt="Sports Court"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Forgot Your Password?
            </h1>
            <p className="text-lg lg:text-xl opacity-90 max-w-md">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your email address"
                disabled={forgotPassword.isPending}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={forgotPassword.isPending}
              className="w-full bg-black text-white hover:bg-gray-800 font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forgotPassword.isPending
                ? "Sending reset link..."
                : "Send Reset Link"}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ← Back to Login
              </Link>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 mt-8">
            <p>
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
