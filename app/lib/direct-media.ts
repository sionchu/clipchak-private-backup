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

export function isSignedResolverDownloadUrl(value: string, resolverEndpoint?: string) {
  if (!resolverEndpoint) return false;
  try {
    const target = new URL(value);
    const resolver = new URL(resolverEndpoint);
    return target.protocol === "https:"
      && target.origin === resolver.origin
      && target.pathname === "/download"
      && target.searchParams.has("ticket")
      && target.searchParams.get("ticket")!.length >= 40
      && !target.username
      && !target.password
      && !target.hash;
  } catch {
    return false;
  }
}
