/**
 * Extracts a human-readable short name from ccusage project identifiers.
 *
 * ccusage encodes paths like: C--Users-xavie-Documents-Code-reloaded
 * The -- separates drive letter from path, but subdirs use single -.
 * We strip the common user home prefix and show only the project-relevant part.
 *
 * Examples:
 *   "C--Users-xavie-Documents-Code-reloaded" → "reloaded"
 *   "C--Users-xavie-Documents-CfC-AM-Framework" → "CfC/AM-Framework"
 *   "C--Users-xavie" → "~"
 *   "G--My-Drive-Obsidian" → "My-Drive/Obsidian"
 */
export function extractProjectShortName(fullName: string): string {
  if (!fullName) return "unknown";

  // Split on -- to separate drive letter from path
  const parts = fullName.split("--");
  if (parts.length < 2) return fullName;

  // Reconstruct path portion (everything after drive letter)
  const pathPart = parts.slice(1).join("/");

  // Known home directory prefixes to strip (just the user home portion)
  const homePrefix = "Users-xavie";
  if (pathPart === homePrefix) return "~";
  if (pathPart.startsWith(homePrefix + "-")) {
    const afterHome = pathPart.slice(homePrefix.length + 1);

    // Strip common intermediate dirs
    const stripPrefixes = ["Documents-Code-", "Documents-CfC-", "Documents-"];
    for (const prefix of stripPrefixes) {
      if (afterHome.startsWith(prefix)) {
        const projectPart = afterHome.slice(prefix.length);
        return projectPart || afterHome;
      }
    }

    return afterHome;
  }

  // For non-home paths (like G--My-Drive-Obsidian), return everything after drive
  return pathPart;
}

/**
 * Reconstructs a plausible file path from the ccusage project name.
 * e.g. "C--Users-xavie-Documents-Code-reloaded" → "C:/Users/xavie/Documents/Code/reloaded"
 *
 * Note: This is a best-effort reconstruction since we can't distinguish
 * path separators from dashes in directory names.
 */
export function projectNameToPath(fullName: string): string {
  if (!fullName) return "";

  const parts = fullName.split("--");
  if (parts.length < 2) return fullName;

  const drive = parts[0];
  const pathPart = parts.slice(1).join("/");

  // Try to reconstruct by replacing dashes in known path segments
  // We know the structure: Users/xavie/Documents/...
  const segments = pathPart.split("-");
  const knownDirs = ["Users", "Documents", "Code", "CfC"];

  const result: string[] = [];
  let i = 0;
  while (i < segments.length) {
    if (knownDirs.includes(segments[i])) {
      result.push(segments[i]);
      i++;
    } else {
      // Accumulate remaining segments as the project name (they might contain dashes)
      result.push(segments.slice(i).join("-"));
      break;
    }
  }

  return `${drive}:/${result.join("/")}`;
}
