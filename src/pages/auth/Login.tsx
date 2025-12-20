import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('admin@au.org');
    const [password, setPassword] = useState('password');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login logic
        if (email && password) {
            if (email === 'admin@au.org') {
                login(email, UserRole.SUPER_ADMIN);
                navigate('/admin');
            } else if (email === 'ics@au.org') {
                login(email, UserRole.ICS_OFFICER);
                navigate('/ics/journalists');
            } else if (email === 'niss@au.org') {
                login(email, UserRole.NISS_OFFICER);
                navigate('/niss/journalists');
            } else if (email === 'insa@au.org') {
                login(email, UserRole.INSA_OFFICER);
                navigate('/insa/journalists');
            } else if (email === 'customs@au.org') {
                login(email, UserRole.CUSTOMS_OFFICER);
                navigate('/customs/journalists');
            } else if (email === 'auadmin@au.org') {
                login(email, UserRole.AU_ADMIN);
                navigate('/au-admin/journalists');
            } else {
                login(email, UserRole.EMA_OFFICER);
                navigate('/dashboard/journalists');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {/* <div className="mb-8 flex flex-col items-center">
                <div className="flex items-center gap-2 text-primary mb-2">
                    <Plane className="h-10 w-10" />
                    <h1 className="text-3xl font-bold font-sans text-primary leading-tight">
                        Border Security<br />Officer
                    </h1>
                </div>
            </div> */}

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
                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* <p className="mt-8 text-xs text-muted-foreground">
                © 2025 Ethiopian Media Association.
            </p> */}
        </div>
    );
}
