mermaid.initialize({
    startOnLoad: true,
    security: "sandbox",
    theme: mapTheme(theme),
});

/**
 * Maps an mdbook theme to it's correspoding mermaid theme
 */
 function mapTheme(theme) {
    switch (theme) {
      case "coal":
      case "navy":
      case "ayu":
        return "dark";
  
      case "light":
      case "rust":
      default:
        return "default";
    }
  }