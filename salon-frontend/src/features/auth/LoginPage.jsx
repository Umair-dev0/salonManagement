import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginAPI } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css'; // Standard CSS Import

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await loginAPI({
                email: formData.email,
                password: formData.password
            });

            // Console log jaisa aapne bheja
            console.log("Backend ka Response:", response);

            // NAYA LOGIC: Backend ke actual structure ke hisaab se
            if (response.success && response.data) {
                // Token seedha response.data.token se nikalenge
                const token = response.data.token;

                // User data bhi seedha response.data me hi hai (id, fullName, role)
                const userData = response.data;

                // Ab AuthContext me sahi data jayega jisme 'role' available hoga
                login(userData, token);
                navigate('/dashboard');
            } else {
                setError('Login failed: Invalid credentials.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">

            {/* Left Side - Image & Tagline */}
            <div className="login-left-panel">
                <img
                    // src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&q=80&w=2000"
                    src="\public\Login.png"
                    alt="Salon Interior"
                    className="login-image"
                />
                <div className="login-image-overlay"></div>

                <div className="login-image-text">
                    <h2>Elevating the Art of Wellness.</h2>
                    <p>
                        Experience the gold standard in salon management. A refined workspace designed for elite professionals who demand effortless control and aesthetic clarity.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form Container */}
            <div className="login-right-panel">
                <div className="login-form-container">

                    {/* Header & Error */}
                    <div className="login-header">
                        <h1>Welcome back</h1>
                        <p>Enter your credentials to access your suite.</p>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div className="input-group">
                            <div className="input-label-row">
                                <label className="input-label">Email</label>
                            </div>
                            <div className="input-wrapper">
                                <div className="input-icon-left">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="professional@salon.com"
                                    className="custom-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="input-group">
                            <div className="input-label-row">
                                <label className="input-label">Password</label>
                                <a href="#" className="forgot-link">Forgot password?</a>
                            </div>
                            <div className="input-wrapper">
                                <div className="input-icon-left">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="custom-input"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="input-icon-right"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="remember-group">
                            <input
                                id="rememberMe"
                                name="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="remember-checkbox"
                            />
                            <label htmlFor="rememberMe" className="remember-label">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="submit-btn"
                        >
                            {isLoading ? 'Logging in...' : 'Login to Dashboard'}
                            {!isLoading && <ArrowRight size={16} />}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="login-footer">
                        <p className="request-access">
                            Don't have an account yet?{' '}
                            <a href="#">Request Access</a>
                        </p>

                        <div className="divider">
                            <span className="divider-line"></span>
                            <span className="divider-circle">○</span>
                            <span className="divider-line"></span>
                        </div>

                        <div className="footer-links">
                            <a href="#">Support Center</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}