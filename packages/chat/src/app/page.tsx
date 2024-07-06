"use client";
import { useChat } from "ai/react";
import { useState } from "react";

export function Pagee() {
  const [generation, setGeneration] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div
        onClick={async () => {
          setIsLoading(true);

          await fetch("/api/completion", {
            method: "POST",
            body: JSON.stringify({
              prompt: "Make a complex finance china model.",
            }),
          }).then((response) => {
            response.json().then((json) => {
              setGeneration(json.code);
              setIsLoading(false);
            });
          });
        }}
      >
        Generate
        {JSON.stringify(generation)}
      </div>

      {isLoading ? "Loading..." : <pre>{JSON.stringify(generation)}</pre>}
    </div>
  );
}
export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col py-24">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 mb-8 w-full max-w-md rounded border border-gray-300 p-2 shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <Pagee />
    </main>
  );
}
