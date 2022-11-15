import { ClipboardCopyIcon } from "@heroicons/react/solid";
import React, { useState } from "react";
import { Button } from "../ui/Button";

export const ShareButton: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText((window.top || window).location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="w-36">
      <Button onClick={copy} wide>
        {isCopied ? (
          "Copied to clipboard!"
        ) : (
          <div className="flex items-center space-x-1">
            <ClipboardCopyIcon className="w-4 h-4" />
            <span>Copy share link</span>
          </div>
        )}
      </Button>
    </div>
  );
};
