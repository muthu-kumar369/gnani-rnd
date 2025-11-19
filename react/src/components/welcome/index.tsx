import React from "react";

const WelcomePage: React.FC = () => {
  const handleGetStarted = () => {
    alert("Let's get started!");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome dude 🚀</h1>
        <p style={styles.subtitle}>
          We're excited to have you on board. Click the button below to get
        </p>
        <button style={styles.button} onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

interface Styles {
  container: React.CSSProperties;
  card: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  button: React.CSSProperties;
}

const styles: Styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #6e8efb, #a777e3)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "40px 60px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
    maxWidth: "500px"
  },
  title: {
    margin: 0,
    fontSize: "2.5rem",
    color: "#333"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#666",
    margin: "20px 0"
  },
  button: {
    padding: "12px 30px",
    fontSize: "1rem",
    color: "#fff",
    backgroundColor: "#6e8efb",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease"
  }
};

export default WelcomePage;
