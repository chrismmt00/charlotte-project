// Server-safe: read by the root layout's inline <head> script.
export const THEME_KEY = "klyvora-theme";

export const SEEN_KEY = "klyvora-seen";

// Sets the saved theme, and marks repeat visits in this session so the Home loader stays hidden.
export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}try{if(sessionStorage.getItem("${SEEN_KEY}"))d.setAttribute("data-seen","1");else sessionStorage.setItem("${SEEN_KEY}","1")}catch(e){d.setAttribute("data-seen","1")}})()`;
