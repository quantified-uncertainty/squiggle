"use client";
import React, { useEffect } from "react";

export default function () {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    }
  }, []);

  return (
    <div>
      <h2>You have now reached the fourth level of recursion!!</h2>
    </div>
  );
}
