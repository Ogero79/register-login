// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('REACT_APP_API_URL/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies with the request
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful logout
        navigate('/login');
      } else {
        console.error(data.message || 'Logout failed');
      }
    } catch (err) {
      console.error('Error during logout', err);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('REACT_APP_API_URL/home', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message); // Set welcome message
        } else {
          navigate('/login'); // Redirect to login if not logged in
        }
      } catch (err) {
        console.error('Error fetching home page data', err);
        navigate('/login');
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div>
      <h2>Home Page</h2>
      <p>{message}</p>
      <button onClick={handleLogout}>Logout</button> {/* Logout button */}
    </div>
  );
};

export default Home;
