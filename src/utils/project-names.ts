/**
 * Client-side path reconstruction for hover tooltips.
 * Best-effort since we can't distinguish path separators from dashes.
 */
export function projectNameToPath(fullName: string): string {
  if (!fullName) return "";

  const parts = fullName.split("--");
  if (parts.length < 2) return fullName;

  const drive = parts[0];
  const pathPart = parts.slice(1).join("/");

  const segments = pathPart.split("-");
  const knownDirs = ["Users", "Documents", "Code", "CfC"];

  const result: string[] = [];
  let i = 0;
  while (i < segments.length) {
    if (knownDirs.includes(segments[i])) {
      result.push(segments[i]);
      i++;
    } else {
      result.push(segments.slice(i).join("-"));
      break;
    }
  }

  return `${drive}:/${result.join("/")}`;
}
