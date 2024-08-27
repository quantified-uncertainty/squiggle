"use client";

import Link from "next/link";

// Main Component
export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-3xl font-bold">Welcome to My App</h1>
      <p className="mb-4">This is the home page of our application.</p>
      <Link href="/create" className="text-blue-500 hover:underline">
        Go to Create Page
      </Link>
    </div>
  );
}
