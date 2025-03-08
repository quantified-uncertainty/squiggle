import { PropsWithChildren } from "react";

export default function SpecListsLayout({ children }: PropsWithChildren) {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Specs & Evals</h1>
        <p className="text-gray-500 mt-1">
          Experimental feature - AI evaluations for spec lists
        </p>
      </div>
      {children}
    </div>
  );
}