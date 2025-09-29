// src/RefreshHandler.jsx
import { useEffect } from "react";

export default function RefreshHandler({ setIsAuthenticated }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          method: "GET",
          credentials: "include",
        });
        setIsAuthenticated(res.ok);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [setIsAuthenticated]);

  return null;
}
