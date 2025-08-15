import SEO from "@/components/SEO";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Edit, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useVerifyOTP, useResendOTP } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-quickcourt.jpg";

const OTPVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const verifyOTP = useVerifyOTP();
  const resendOTP = useResendOTP();

  // Get email from navigation state or default
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);

  // Redirect if no email provided
  useEffect(() => {
    if (!email && !location.state?.fromRegistration) {
      navigate("/login");
    }
  }, [email, location.state, navigate]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const authResponse = await verifyOTP.mutateAsync({
        email,
        otp,
      });

      // Login the user after successful verification
      authLogin(authResponse.user, authResponse.token);

      toast({
        title: "Email verified successfully! 🎉",
        description: "Welcome to QuickCourt!",
      });

      // Redirect based on user role
      const redirectPath =
        authResponse.user.role === "facility_owner"
          ? "/owner/dashboard"
          : "/venues";

      navigate(redirectPath);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid OTP code. Please try again.";
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP.mutateAsync(email);
      toast({
        title: "OTP sent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Please try again later.";
      toast({
        title: "Failed to resend OTP",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEmailEdit = () => {
    if (isEditingEmail) {
      // Save the new email
      setEmail(tempEmail);
      setIsEditingEmail(false);
      toast({
        title: "Email updated",
        description: "Please request a new OTP for the updated email.",
      });
    } else {
      // Start editing
      setTempEmail(email);
      setIsEditingEmail(true);
    }
  };

  const cancelEmailEdit = () => {
    setTempEmail(email);
    setIsEditingEmail(false);
  };
  return (
    <div className="min-h-screen flex bg-white text-black">
      <SEO
        title="Verify your email – QuickCourt"
        description="Complete your signup by verifying the OTP sent to your email."
      />

      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 z-10" />
        <img
          src={heroImage}
          alt="QuickCourt"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-8 left-8 z-20">
          <div className="text-green-600 font-medium text-lg">IMAGE</div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">QUICKCOURT</h1>
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-5 h-5 text-orange-500 mr-2" />
              <h2 className="text-xl font-semibold">VERIFY YOUR EMAIL</h2>
            </div>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* Description */}
            <div className="text-center space-y-4">
              {isEditingEmail ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="text-center"
                  />
                  <div className="flex justify-center gap-2 mt-2">
                    <Button
                      type="button"
                      onClick={handleEmailEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEmailEdit}
                      className="px-4 py-1 text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-green-600 text-sm">
                  We've sent a code to your email: <strong>{email}</strong>
                </p>
              )}

              {/* OTP Input */}
              {!isEditingEmail && (
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    aria-label="One-time password input"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={3}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-12 h-12 border-gray-300 bg-transparent text-black text-lg"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}
            </div>

            {/* Verify Button */}
            {!isEditingEmail && (
              <Button
                type="submit"
                disabled={verifyOTP.isPending || otp.length !== 6}
                className="w-full bg-black text-white hover:bg-gray-800 font-medium py-2.5 mt-8 disabled:opacity-50"
              >
                {verifyOTP.isPending ? "Verifying..." : "Verify & Continue"}
              </Button>
            )}

            {/* Action Links */}
            {!isEditingEmail && (
              <div className="text-center space-y-2 text-sm">
                <p className="text-gray-600">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendOTP.isPending}
                    className="text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                  >
                    {resendOTP.isPending ? "Sending..." : "Resend OTP"}
                  </button>
                </p>
                <p className="text-gray-600">
                  Wrong email?{" "}
                  <button
                    type="button"
                    onClick={handleEmailEdit}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit Email
                  </button>
                </p>
                <p className="text-gray-600">
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to Signup
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;
