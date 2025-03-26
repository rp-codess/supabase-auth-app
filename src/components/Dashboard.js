// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          setUser(user);
          console.log("User data:", user);
          
          // Try to get the profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle() instead of single()
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Profile fetch error:", profileError);
            throw profileError;
          }
          
          // Check if profile exists
          if (!profileData) {
            console.log("Profile not found, creating one...");
            
            // Create a profile if one doesn't exist
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  phone_number: user.user_metadata?.phone_number || ''
                }
              ])
              .select()
              .single();
            
            if (insertError) {
              console.error("Error creating profile:", insertError);
              throw insertError;
            }
            
            setProfile(newProfile);
          } else {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load profile: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="section">
        <h2>Profile Information</h2>
        {error && <p className="error">{error}</p>}
        {user ? (
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            
            {profile ? (
              <>
                <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
                <p><strong>Phone Number:</strong> {profile.phone_number || 'Not set'}</p>
                <p><strong>Created At:</strong> {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Unknown'}</p>
              </>
            ) : (
              <p>No additional profile information found.</p>
            )}
          </div>
        ) : (
          <p>No user information found. <a href="/login">Please log in</a>.</p>
        )}
      </div>
      
      <div className="section">
        <h2>Actions</h2>
        <button onClick={handleSignOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>
      
      <div className="section">
        <h2>Usage Statistics</h2>
        <p><strong>Last Login:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}</p>
        <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</p>
      </div>
      
      
    </div>
  );
};

export default Dashboard;