// POSIX path helpers for root-relative API paths ("dir/file.squiggle").

export function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
}

export function basename(p: string): string {
  return p.slice(p.lastIndexOf("/") + 1);
}

// Joins and normalizes; throws if the result would escape the root.
export function joinPath(base: string, rel: string): string {
  const out: string[] = [];
  for (const segment of [...base.split("/"), ...rel.split("/")]) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (!out.length) {
        throw new Error(`Import path escapes the open folder: ${rel}`);
      }
      out.pop();
    } else {
      out.push(segment);
    }
  }
  return out.join("/");
}
