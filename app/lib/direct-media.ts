export function isDirectOriginUrl(value: string, resolverEndpoint?: string) {
  let target: URL;
  try {
    target = new URL(value);
  } catch {
    return false;
  }

  if (!/^https?:$/.test(target.protocol)) return false;

  let pathname: string;
  try {
    pathname = decodeURIComponent(target.pathname);
  } catch {
    return false;
  }
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  if (segments.includes("tunnel") || segments.includes("proxy")) return false;

  if (resolverEndpoint) {
    try {
      if (target.origin === new URL(resolverEndpoint).origin) return false;
    } catch {
      return false;
    }
  }

  return true;
}
