import React from "react";

export const FormComment: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <p className="text-sm text-gray-500">{children}</p>;
