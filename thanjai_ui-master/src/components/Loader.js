// Loader.js
import React from 'react';

const Loader = () => {
  return (
    <div style={loaderStyles.container}>
      <div style={loaderStyles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
};

const loaderStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    border: '8px solid #f3f3f3', 
    borderTop: '8px solid #3498db',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 2s linear infinite',
  },
};

export default Loader;
