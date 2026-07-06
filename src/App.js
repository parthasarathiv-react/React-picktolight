import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from 'layouts/MainLayout';

// Code-split all pages — each becomes its own JS chunk loaded on demand
const Login = lazy(() => import('pages/Login'));
const Settings = lazy(() => import('pages/Settings'));
const Monitoring = lazy(() => import('pages/Monitoring'));
const Users = lazy(() => import('pages/Users'));

// Minimal loading indicator shown while a route chunk is fetching
function PageLoader() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#010a25',
                color: 'rgba(139,175,229,0.7)',
                fontSize: '0.875rem',
                fontFamily: '"Bai Jamjuree", sans-serif',
                gap: '0.5rem',
            }}
        >
            <span
                style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid rgba(139,175,229,0.3)',
                    borderTopColor: '#5fa6ff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }}
            />
            Loading…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Toaster
                position="top-right"
                richColors
                closeButton
                expand={false}
                gap={10}
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: '"Bai Jamjuree", sans-serif',
                    },
                }}
            />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<MainLayout />}>
                        <Route path="monitoring" element={<Monitoring />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="users" element={<Users />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
