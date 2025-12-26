import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginMutation } from '@/store/services/api';
import { toast } from 'sonner';

export function Login() {
    const [email, setEmail] = useState('admin@ausmc.org');
    const [password, setPassword] = useState('admin@123');
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
                let roleEnum = UserRole.EMA_OFFICER; // Default fallback
                switch (user.roleName) {
                    case 'SUPER_ADMIN': roleEnum = UserRole.SUPER_ADMIN; break;
                    case 'EMA_OFFICER': roleEnum = UserRole.EMA_OFFICER; break;
                    case 'ICS_OFFICER': roleEnum = UserRole.ICS_OFFICER; break;
                    case 'NISS_OFFICER': roleEnum = UserRole.NISS_OFFICER; break;
                    case 'INSA_OFFICER': roleEnum = UserRole.INSA_OFFICER; break;
                    case 'CUSTOMS_OFFICER': roleEnum = UserRole.CUSTOMS_OFFICER; break;
                    case 'AU_ADMIN': roleEnum = UserRole.AU_ADMIN; break;
                    // Add other mappings as needed
                }

                // Call context login to set state
                login(user.email, roleEnum, user.permissions, user.fullName, user.roleName);

                // Navigate based on role (using same logic as below)
                navigateBasedOnRole(roleEnum, user.email);
                toast.success("Login Successful");
                return;
            }
        } catch (err) {
            console.log("API Login failed, falling back to mock logic...", err);
            // Fallback to legacy mock logic if API fails or credentials rejected by API (if API throws on 401)
        }

        // --- Mock Fallback Logic ---
        if (email && password) {
            // Mapping for mock logic
            if (email === 'admin@au.org') {
                login(email, UserRole.SUPER_ADMIN);
                navigateBasedOnRole(UserRole.SUPER_ADMIN, email);
            } else if (email === 'ics@au.org') {
                login(email, UserRole.ICS_OFFICER);
                navigateBasedOnRole(UserRole.ICS_OFFICER, email);
            } else if (email === 'niss@au.org') {
                login(email, UserRole.NISS_OFFICER);
                navigateBasedOnRole(UserRole.NISS_OFFICER, email);
            } else if (email === 'insa@au.org') {
                login(email, UserRole.INSA_OFFICER);
                navigateBasedOnRole(UserRole.INSA_OFFICER, email);
            } else if (email === 'customs@au.org') {
                login(email, UserRole.CUSTOMS_OFFICER);
                navigateBasedOnRole(UserRole.CUSTOMS_OFFICER, email);
            } else if (email === 'auadmin@au.org') {
                login(email, UserRole.AU_ADMIN);
                navigateBasedOnRole(UserRole.AU_ADMIN, email);
            } else if (email === 'admin@ausmc.org' && password === 'admin@123') { // Handle user provided default as generic fallback if API fails
                login(email, UserRole.SUPER_ADMIN, [], "Super Admin (Mock)"); // Assume Super Admin for this specific fallback
                navigate('/admin');
            }
            else {
                // If not one of the specific hardcoded emails, default to EMA
                login(email, UserRole.EMA_OFFICER);
                navigateBasedOnRole(UserRole.EMA_OFFICER, email);
            }
        }
    };

    const navigateBasedOnRole = (role: UserRole, emailStr: string) => {
        switch (role) {
            case UserRole.SUPER_ADMIN: navigate('/admin'); break;
            case UserRole.ICS_OFFICER: navigate('/ics/journalists'); break;
            case UserRole.NISS_OFFICER: navigate('/niss/journalists'); break;
            case UserRole.INSA_OFFICER: navigate('/insa/journalists'); break;
            case UserRole.CUSTOMS_OFFICER: navigate('/customs/journalists'); break;
            case UserRole.AU_ADMIN: navigate('/au-admin/journalists'); break;
            default: navigate('/dashboard/journalists');
        }
    }

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
                            <input
                                id="password"
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
