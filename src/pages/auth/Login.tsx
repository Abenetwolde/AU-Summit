import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginMutation } from '@/store/services/api';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [apiLogin, { isLoading }] = useLoginMutation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Attempt API Login
            const response = await apiLogin({ email, password }).unwrap();

            if (response.success && response.data) {
                const { user, requirePasswordChange } = response.data;

                // Determine UserRole enum from API roleName string
                let roleEnum: any = user.roleName; // Default fallback for valid login with unknown string
                // switch (user.roleName) {
                //     case 'SUPER_ADMIN': roleEnum = UserRole.SUPER_ADMIN; break;
                //     case 'EMA_OFFICER': roleEnum = UserRole.EMA_OFFICER; break;
                //     case 'ICS_OFFICER': roleEnum = UserRole.ICS_OFFICER; break;
                //     case 'NISS_OFFICER': roleEnum = UserRole.NISS_OFFICER; break;
                //     case 'INSA_OFFICER': roleEnum = UserRole.INSA_OFFICER; break;
                //     case 'CUSTOMS_OFFICER': roleEnum = UserRole.CUSTOMS_OFFICER; break;
                //     case 'AU_ADMIN': roleEnum = UserRole.AU_ADMIN; break;
                //     case 'AU_OFFICER': roleEnum = UserRole.AU_OFFICER; break;
                //     // Add other mappings as needed
                // }

                // Call context login to set state
                const apiUser = user as any;
                login(apiUser.email, roleEnum, apiUser.permissions, apiUser.fullName, apiUser.roleName, String(apiUser.id), apiUser.workflowStepKey, apiUser.organization, apiUser.authorizedWorkflowSteps, requirePasswordChange);

                // Always navigate to the unified dashboard
                navigate('/dashboard/admin');
                toast.success("Login Successful");
                return;
            }
        } catch (err) {
            console.log("API Login failed or credentials incorrect", err);
        }

        // --- Explicit Mock Overrides for Dev/Testing (Only if matching exactly) ---


        // Strict failure if no match
        toast.error("Incorrect email or password");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {/* <div className="flex justify-end">
                            <button type="button" className="text-sm text-blue-600 hover:underline">
                                Forgot Password?
                            </button>
                        </div> */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
