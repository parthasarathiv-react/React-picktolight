import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Dummy login logic
        navigate('/monitoring');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-ot-surface-elev-top border border-ot-border flex items-center justify-center shadow-lg mb-4">
                        <Activity className="w-8 h-8 text-ot-action" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wider">SARATHI</h1>
                    <p className="text-muted-foreground uppercase text-sm tracking-widest mt-2">Pick-to-Light System</p>
                </div>

                <Card>
                    <form onSubmit={handleLogin}>
                        <CardHeader>
                            <CardTitle>Operator Login</CardTitle>
                            <CardDescription>Enter your credentials to access the terminal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Username</label>
                                <Input type="text" placeholder="admin" required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                                    <a href="#" className="text-xs text-ot-action hover:text-ot-action-hover">Forgot password?</a>
                                </div>
                                <Input type="password" placeholder="••••••••" required />
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" id="remember" className="rounded border-ot-border bg-ot-surface-bottom text-ot-action focus:ring-ot-action" />
                                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                                    Remember my session
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Initialize Terminal</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
