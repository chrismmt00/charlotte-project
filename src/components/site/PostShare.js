"use client";

import { useState } from "react";

// "Copy link" and "Email it" under a post. The URL is built on the server from SITE_URL.
export default function PostShare({ url, title }) {
  const [copied, setCopied] = useState(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(null), 2500);
  }

  const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={copy} className="bg-transparent border-0 p-0 font-[inherit] text-sm text-accent-light min-h-11 inline-flex items-center cursor-pointer hover:text-fg">
        {copied === "ok" ? "Link copied" : "Copy link"}
      </button>
      <a href={mailto} className="text-sm text-accent-light min-h-11 inline-flex items-center hover:text-fg">
        Email it
      </a>
      <span role="status" className="sr-only">
        {copied === "ok" ? "Link copied to the clipboard." : copied === "fail" ? "Couldn’t copy. Select the address bar and copy it from there." : ""}
      </span>
    </div>
  );
}
