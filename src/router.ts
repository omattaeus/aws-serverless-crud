export type Route = { method: string; path: RegExp; handler: (params: Record<string,string>, body: any, userId: string) => Promise<{statusCode:number; body: any}> };

export function matchRoute(method: string, rawPath: string, routes: Route[]) {
  for (const r of routes) {
    if (r.method === method && r.path.test(rawPath)) {
      const m = rawPath.match(r.path)!;
      const groups = (m as any).groups ?? {};
      return { route: r, params: groups as Record<string,string> };
    }
  }
  return null;
}