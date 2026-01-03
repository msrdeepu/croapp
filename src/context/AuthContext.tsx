import React, { createContext, useContext, useState } from 'react';
import { ENDPOINTS } from '../config';

interface User {
    id: number;
    name: string;
    email: string;
    user_type: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('auth_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    device_name: 'web-browser',
                }),
            });

            const text = await response.text();
            let rawData;
            try {
                rawData = JSON.parse(text);
            } catch (e) {
                // Handle malformed JSON (e.g. prefixed with [])
                if (text.trim().startsWith('[]')) {
                    const fixedText = text.trim().substring(2);
                    try {
                        rawData = JSON.parse(fixedText);
                    } catch (e2) {
                        console.error('Failed to parse corrected JSON:', e2);
                        throw new Error('Invalid server response');
                    }
                } else {
                    console.error('Failed to parse JSON:', e);
                    throw new Error('Invalid server response');
                }
            }

            const data = Array.isArray(rawData) ? rawData[0] : rawData;

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.status && data.token) {
                // Store token and user data
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));

                setToken(data.token);
                setUser(data.user);

                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (token) {
                // Call logout API
                await fetch(ENDPOINTS.LOGOUT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear local storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');

            setToken(null);
            setUser(null);

            // Redirect to root
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
