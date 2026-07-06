import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, LogIn, X } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCredentials, setShowCredentials] = useState(true);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (username === 'admin' && password === 'admin@123') {
            navigate('/monitoring');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-ot-surface-elev-top border border-ot-border flex items-center justify-center shadow-lg mb-4">
                        <Activity className="w-8 h-8 text-ot-action" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wider">Raster</h1>
                    <p className="text-muted-foreground uppercase text-sm tracking-widest mt-2">Pick-to-Light System</p>
                </div>

                <Card>
                    <form onSubmit={handleLogin}>
                        <CardHeader>
                            <CardTitle>Login</CardTitle>
                            <CardDescription>Enter your credentials to access the terminal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2 rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Username</label>
                                <Input
                                    type="text"
                                    placeholder="username"
                                    className="placeholder:text-gray-600"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="placeholder:text-gray-600 pr-10"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Button variant="ghost"
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-white transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="
      group
      relative
      w-full
      h-12
      overflow-hidden
      rounded-xl
      bg-ot-action
      hover:bg-ot-action-hover
      text-white
      font-semibold
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:shadow-xl
      hover:shadow-ot-action/30
      active:scale-95
    "
                            >
                                {/* Shine Effect */}
                                <span
                                    className="
        absolute
        inset-0
        -translate-x-full
        bg-gradient-to-r
        from-transparent
        via-white/20
        to-transparent
        transition-transform
        duration-700
        group-hover:translate-x-full
      "
                                />

                                <LogIn className="relative z-10 mr-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                <span className="relative z-10">Login</span>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Test Credentials Display */}
            {showCredentials && (
                <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 p-6 rounded-xl border border-ot-border bg-ot-surface-elev-top shadow-2xl z-50">
                    <Button variant="ghost" 
                        onClick={() => setShowCredentials(false)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <h3 className="text-white font-bold mb-3 text-lg pr-4">Test Credentials</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="flex justify-between gap-4"><span className="text-white">Username:</span> <span>admin</span></p>
                        <p className="flex justify-between gap-4"><span className="text-white">Password:</span> <span>admin@123</span></p>
                    </div>
                </div>
            )}
        </div>
    );
}
