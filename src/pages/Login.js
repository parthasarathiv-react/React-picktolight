import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, LogIn, X, MapPin, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { API_URL } from 'config/api';

import LocationSelectionDialog from 'components/LocationSelectionDialog';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: username, password }),
            });

            if (response.ok) {
                const data = await response.json();

                // Handle different common token response structures
                const token = data.token || data.access_token || data.accessToken;
                if (token) {
                    localStorage.setItem('token', token);
                }

                setShowLocationDialog(true);
            } else {
                let errorMsg = 'Invalid username or password';
                try {
                    const errorData = await response.json();
                    if (errorData.message) errorMsg = errorData.message;
                } catch (parseError) { }
                setError(errorMsg);
            }
        } catch (err) {
            setError('Network error. Please try again later.');
        }
    };

    const handleLocationSelect = (location) => {
        localStorage.setItem('selectedLocation', JSON.stringify(location));
        setShowLocationDialog(false);
        navigate('/monitoring');
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
            {/* Location Selection Overlay */}
            <LocationSelectionDialog 
                open={showLocationDialog}
                onOpenChange={setShowLocationDialog}
                onSelectLocation={handleLocationSelect}
            />
        </div>
    );
}
