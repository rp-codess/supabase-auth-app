// src/components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Login attempt with:", email);
      
      // Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });

      if (error) throw error;
      
      // Check if user has phone number for 2FA
      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', userId)
        .maybeSingle();
        
      console.log("Profile data:", profile);
      
      // First check if there's a phone number in the profile
      if (profile?.phone_number) {
        console.log("Phone number found in profile:", profile.phone_number);
        setPhone(profile.phone_number);
        setShowTwoFactor(true);
        return;
      }
      
      // If no phone in profile or profile fetch error, check user metadata as fallback
      const phoneFromMetadata = data.user.user_metadata?.phone_number;
      console.log("Checking phone from metadata:", phoneFromMetadata);
      
      if (phoneFromMetadata) {
        console.log("Using phone from user metadata:", phoneFromMetadata);
        
        // Optionally update the profile with the phone number for future use
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: userId,
                phone_number: phoneFromMetadata,
                email: data.user.email
              }
            ], { onConflict: 'id' });
            
          if (updateError) {
            console.error("Error updating profile with phone number:", updateError);
          } else {
            console.log("Updated profile with phone number from metadata");
          }
        } catch (updateError) {
          console.error("Exception updating profile:", updateError);
        }
        
        setPhone(phoneFromMetadata);
        setShowTwoFactor(true);
        return;
      }
      
      // No phone number found anywhere, skip 2FA
      console.log("No phone number found, skipping 2FA");
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Sending verification code to:", phone);
      
      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token available. Please login again.');
      }
      
      const response = await fetch(
        'https://ptaszbnzvjjjgndsbrhw.supabase.co/functions/v1/send-verification-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ phone: phone })
        }
      );
      
      // Process response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        responseData = { rawResponse: text };
      }
      
      console.log("Verification code response:", responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to send verification code (${response.status})`);
      }
      
      alert('Verification code sent successfully!');
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(`Failed to send code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Verifying code:", { phone, code: verificationCode });
      
      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token available. Please login again.');
      }
      
      // Verify the code via edge function
      const response = await fetch(
        'https://ptaszbnzvjjjgndsbrhw.supabase.co/functions/v1/verify-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            phone: phone,
            code: verificationCode 
          })
        }
      );
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        data = { rawResponse: text };
      }
      
      console.log("Verify code response:", data);
      
      if (!response.ok) {
        const errorMsg = data.error || `Verification failed (${response.status})`;
        throw new Error(errorMsg);
      }
      
      // Code verified, proceed with login
      navigate('/dashboard');
    } catch (error) {
      console.error("Verification error:", error);
      setError(`Code verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      
      {!showTwoFactor ? (
        <form onSubmit={handleLogin}>
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
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <p>Two-factor authentication required.</p>
          <p>Phone number: {phone}</p>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              placeholder="Enter verification code"
            />
          </div>
          <div className="button-group">
            <button 
              type="button" 
              onClick={sendVerificationCode} 
              disabled={loading}
              className="secondary-btn"
            >
              Send Code
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}
      
      <p>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login;