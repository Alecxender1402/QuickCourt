import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-quickcourt.jpg";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    role: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Error state
  const [errors, setErrors] = useState({
    role: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Random name avatars array
  const avatars = useMemo(
    () => [
      "👩‍🦰",
      "👩🏻‍🦰",
      "👩🏼‍🦰",
      "👩🏽‍🦰",
      "👩🏾‍🦰",
      "👩🏿‍🦰",
      "👩‍🎤",
      "👩🏻‍🎤",
      "👩🏼‍🎤",
      "👩🏽‍🎤",
      "👩🏾‍🎤",
      "👩🏿‍🎤",
      "👩‍💼",
      "👩🏻‍💼",
      "👩🏼‍💼",
      "👩🏽‍💼",
      "👩🏾‍💼",
      "👩🏿‍💼",
      "👨‍🦱",
      "👨🏻‍🦱",
      "👨🏼‍🦱",
      "👨🏽‍🦱",
      "👨🏾‍🦱",
      "👨🏿‍🦱",
      "👨‍💼",
      "👨🏻‍💼",
      "👨🏼‍💼",
      "👨🏽‍💼",
      "👨🏾‍💼",
      "👨🏿‍💼",
      "👨‍🎤",
      "👨🏻‍🎤",
      "👨🏼‍🎤",
      "👨🏽‍🎤",
      "👨🏾‍🎤",
      "👨🏿‍🎤",
      "👩‍🦱",
      "👩🏻‍🦱",
      "👩🏼‍🦱",
      "👩🏽‍🦱",
      "👩🏾‍🦱",
      "👩🏿‍🦱",
      "👩‍🔬",
      "👩🏻‍🔬",
      "👩🏼‍🔬",
      "👩🏽‍🔬",
      "👩🏾‍🔬",
      "👩🏿‍🔬",
    ],
    []
  );

  const generateRandomAvatar = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * avatars.length);
    setCurrentAvatar(avatars[randomIndex]);
  }, [avatars]);

  // Generate random avatar on component mount
  useEffect(() => {
    generateRandomAvatar();
  }, [generateRandomAvatar]);

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!name.trim()) return "Full name is required";
    if (!nameRegex.test(name))
      return "Name must contain only letters and spaces (2-50 characters)";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8 || password.length > 20)
      return "Password must be 8-20 characters long";

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase)
      return "Password must contain at least one uppercase letter";
    if (!hasLowercase)
      return "Password must contain at least one lowercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar)
      return "Password must contain at least one special character";

    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validateRole = (role) => {
    if (!role) return "Please select your role";
    return "";
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (register.isPending) return; // Prevent double submission

    const newErrors = {
      role: validateRole(formData.role),
      fullName: validateName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      try {
        const registerData = {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: (formData.role === "owner" ? "facility_owner" : "user") as
            | "user"
            | "facility_owner",
        };

        const authResponse = await register.mutateAsync(registerData);

        // Show success toast
        toast({
          title: "Account created successfully! 🎉",
          description: "Please verify your email with the OTP sent to you.",
          duration: 4000,
        });

        // Redirect to OTP verification page
        navigate("/otp", {
          state: {
            email: formData.email,
            fromRegistration: true,
          },
        });
      } catch (error: unknown) {
        // Show error toast if something goes wrong
        const errorMessage =
          error instanceof Error ? error.message : "Please try again later.";

        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-black">
      <SEO
        title="Sign up – QuickCourt"
        description="Create your QuickCourt account and start booking or managing sports venues."
      />

      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 z-10" />
        <img
          src={heroImage}
          alt="QuickCourt"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">QUICKCOURT</h1>
            <h2 className="text-xl font-semibold mb-8">SIGN UP</h2>
          </div>

          {/* Random Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 text-2xl">
                {currentAvatar}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign up as */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm text-gray-700">
                Sign up as
              </Label>
              <Select
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger
                  className={`w-full bg-transparent border text-black ${
                    errors.role ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <SelectValue placeholder="User / Facility Owner" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="user" className="text-black">
                    User
                  </SelectItem>
                  <SelectItem value="owner" className="text-black">
                    Facility Owner
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-xs">{errors.role}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm text-gray-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={`w-full bg-transparent text-black placeholder-gray-500 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full bg-transparent text-black placeholder-gray-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full bg-transparent text-black placeholder-gray-500 pr-10 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
              <div className="text-xs text-gray-500">
                Password must be 8-20 characters with uppercase, lowercase,
                number, and special character
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm text-gray-700"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full bg-transparent text-black placeholder-gray-500 pr-10 ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-black text-white hover:bg-gray-800 font-medium py-2.5 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {register.isPending ? "Creating Account..." : "Sign Up"}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
