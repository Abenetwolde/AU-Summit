import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLoginMutation } from '@/store/services/api';
import { toast } from 'sonner';
import { Mail, Eye, EyeOff, User } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('admin@ausmc.org');
    const [password, setPassword] = useState('admin@123');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [apiLogin, { isLoading }] = useLoginMutation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Attempt API Login
            const response = await apiLogin({ email, password }).unwrap();

            if (response.success && response.data) {
                const { token, user } = response.data;
                // Store token in localStorage for API calls
                localStorage.setItem('managment_token', token);

                // Determine UserRole enum from API roleName string
                let roleEnum = UserRole.EMA_OFFICER; // Default fallback for valid login with unknown string
                switch (user.roleName) {
                    case 'SUPER_ADMIN': roleEnum = UserRole.SUPER_ADMIN; break;
                    case 'EMA_OFFICER': roleEnum = UserRole.EMA_OFFICER; break;
                    case 'ICS_OFFICER': roleEnum = UserRole.ICS_OFFICER; break;
                    case 'NISS_OFFICER': roleEnum = UserRole.NISS_OFFICER; break;
                    case 'INSA_OFFICER': roleEnum = UserRole.INSA_OFFICER; break;
                    case 'CUSTOMS_OFFICER': roleEnum = UserRole.CUSTOMS_OFFICER; break;
                    case 'AU_ADMIN': roleEnum = UserRole.AU_ADMIN; break;
                }

                // Call context login to set state
                login(user.email, roleEnum, user.permissions, user.fullName, user.roleName, String(user.id));

                // Always navigate to the unified dashboard
                navigate('/dashboard/admin');
                toast.success("Login Successful");
                return;
            }
        } catch (err) {
            console.log("API Login failed or credentials incorrect", err);
        }

        // --- Explicit Mock Overrides for Dev/Testing (Only if matching exactly) ---
        if (email === 'admin@ausmc.org' && password === 'admin@123') {
            login(email, UserRole.SUPER_ADMIN, [], "Super Admin (Mock)");
            navigate('/dashboard/admin');
            return;
        }

        toast.error("Incorrect email or password");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-[#009b4d]/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
            </div>

            {/* Sign In Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Card Content */}
                    <div className="p-8 space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center mb-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#009b4d]/20 to-blue-500/20 rounded-full blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#009b4d] to-green-600 p-4 rounded-full shadow-lg">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Sign in to Dashboard
                            </h1>
                            <p className="text-sm text-slate-500">Enter your credentials to access the system</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-4 pr-12 h-12 border-slate-200 focus-visible:border-[#009b4d] focus-visible:ring-[#009b4d]/20"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-4 pr-12 h-12 border-slate-200 focus-visible:border-[#009b4d] focus-visible:ring-[#009b4d]/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {/* Remember Me & Reset Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm text-slate-600 font-normal cursor-pointer"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                <Link
                                    to="/reset-password"
                                    className="text-sm text-[#009b4d] hover:text-[#007a3d] font-medium transition-colors"
                                >
                                    Reset password
                                </Link>
                            </div>

                            {/* Sign In Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
