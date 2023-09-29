import React, { useState } from "react";

import { ClipboardCopyIcon, Button } from "@quri/ui";

export const ShareButton = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText((window.top || window).location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="w-32">
      <Button onClick={copy} wide size="small">
        {isCopied ? (
          "Copied!"
        ) : (
          <div className="flex items-center space-x-1">
            <ClipboardCopyIcon className="w-4 h-4" />
            <span>Share link</span>
          </div>
        )}
      </Button>
    </div>
  );
};
