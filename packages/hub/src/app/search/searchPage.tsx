"use client";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

export const SearchPage: FC<{}> = ({}) => {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const [contentType, setContent] = useState(
    searchParams.get("contentType") || "models"
  );

  const handleClick = (type: string) => {
    setContent(type);
    router.push(`/search?contentType=${type}`);
  };

  return (
    <div>
      {contentType}
      <div onClick={() => handleClick("models")}>Model</div>
      <div onClick={() => handleClick("groups")}>groups</div>
    </div>
  );
};
