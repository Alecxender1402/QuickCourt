import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-quickcourt.jpg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const { login: authLogin } = useAuth();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      const authResponse = await login.mutateAsync({ email, password });

      // Update auth context
      authLogin(authResponse.user, authResponse.token);

      toast({
        title: "Login successful! 🎉",
        description: "Welcome back to QuickCourt!",
      });

      // Navigate to intended destination or dashboard based on role
      let redirectPath = from;

      if (from === "/" || from === "/login") {
        switch (authResponse.user.role) {
          case "admin":
            redirectPath = "/admin/dashboard";
            break;
          case "facility_owner":
            redirectPath = "/owner/dashboard";
            break;
          default:
            redirectPath = "/";
        }
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-black">
      <SEO
        title="Login – QuickCourt"
        description="Log in to book courts, manage facilities, or administer QuickCourt."
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
            <h2 className="text-xl font-semibold mb-8">LOGIN</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-gray-300 text-black placeholder-gray-500"
                placeholder="Enter your email"
                disabled={login.isPending}
                required
              />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-gray-300 text-black placeholder-gray-500 pr-10"
                  placeholder="Enter your password"
                  disabled={login.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                  disabled={login.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-black text-white hover:bg-gray-800 font-medium py-2.5 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {login.isPending ? "Logging in..." : "Login"}
            </Button>

            {/* Signup Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Sign up
              </Link>
            </p>

            {/* Forgot Password */}
            <p className="text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Forgot password?
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
