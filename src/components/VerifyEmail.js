// src/components/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check if we have a type=recovery or type=signup in the URL
        const params = new URLSearchParams(location.hash.substring(1));
        const type = params.get('type');
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          setMessage('Processing verification...');
          
          // First try to exchange the token if present
          if (accessToken) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: params.get('refresh_token')
              });
              
              if (error) throw error;
              
              console.log("Session data:", data);
            } catch (tokenError) {
              console.error("Error setting session:", tokenError);
              // Continue anyway, as getSession below might still work
            }
          }
          
          // Check if we have a session after the redirect
          const { data, error } = await supabase.auth.getSession();
          
          console.log("Current session:", data);
          
          if (error) throw error;
          
          if (data?.session) {
            // Additional check - get the user
            const { data: userData } = await supabase.auth.getUser();
            console.log("User data:", userData);
            
            if (userData?.user?.email_confirmed_at || userData?.user?.confirmed_at) {
              setMessage('Email verified successfully! Redirecting to login...');
              // Redirect to login page after 2 seconds
              setTimeout(() => navigate('/login'), 2000);
            } else {
              setMessage('Your email is pending verification. Please check your inbox.');
              
              // Try manual profile creation if needed
              if (userData?.user) {
                try {
                  const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userData.user.id)
                    .single();
                  
                  if (profileError || !profileData) {
                    console.log("Creating profile for verified user:", userData.user.id);
                    
                    // Create profile if it doesn't exist
                    await supabase
                      .from('profiles')
                      .insert([
                        {
                          id: userData.user.id,
                          email: userData.user.email,
                          full_name: userData.user.user_metadata?.full_name || '',
                          phone_number: userData.user.user_metadata?.phone_number || '',
                          isDeleted: false
                        }
                      ]);
                  }
                } catch (profileError) {
                  console.error("Error with profile check/creation:", profileError);
                }
              }
            }
          } else {
            setMessage('Unable to confirm verification status. Please try logging in.');
          }
        } else {
          setMessage('Please check your email and click the verification link.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError('Failed to verify email: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [navigate, location]);

  return (
    <div className="auth-container">
      <h1>Email Verification</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="links">
        <Link to="/login">Go to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;