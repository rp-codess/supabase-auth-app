// src/components/SignUp.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      console.log("Signing up with:", { email, password, fullName, phoneNumber });
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber
          },
          emailRedirectTo: 'http://localhost:3000/verify-email'
        }
      });

      console.log("Sign up response:", { data, error });

      if (error) throw error;
      
      setMessage('Check your email for a verification link.');
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form onSubmit={handleSignUp}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number (E.164 format, e.g., +14155552671)</label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default SignUp;