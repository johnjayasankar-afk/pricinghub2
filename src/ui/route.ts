export type Route =
  | "home"
  | "catalog"
  | "pay"
  | "thanks"
  | "help"
  | "privacy"
  | "terms"
  | "refund"
  | "sources"
  | "notfound";

const MAP: Record<string, Route> = {
  "": "home",
  home: "home",
  catalog: "catalog",
  pay: "pay",
  thanks: "thanks",
  help: "help",
  privacy: "privacy",
  terms: "terms",
  refund: "refund",
  sources: "sources",
  "not-found": "notfound",
};

export function pathFromHash(hash: string): string {
  return hash.replace(/^#\/?/, "").split("?")[0] ?? "";
}

export function isHomeHash(hash: string): boolean {
  const path = pathFromHash(hash);
  return path === "" || path === "home";
}

export function routeFromPath(path: string): Route {
  if (path === "" || path === "home") return "home";
  return MAP[path] ?? "notfound";
}

export function readRoute(): Route {
  return routeFromPath(pathFromHash(window.location.hash));
}

export function href(route: Route): string {
  if (route === "home") return "#/";
  if (route === "notfound") return "#/not-found";
  return `#/${route}`;
}

export function hashQuery(): string {
  const hash = window.location.hash;
  const i = hash.indexOf("?");
  return i >= 0 ? hash.slice(i + 1) : "";
}

export function skipLabel(route: Route): string {
  if (route === "home") return "Skip to worksheet";
  if (route === "catalog") return "Skip to catalog";
  return "Skip to content";
}

export function titles(route: Route): string {
  const map: Record<Route, string> = {
    home: "KeepFloor — the Etsy price that still pays you",
    catalog: "KeepFloor — catalog",
    pay: "KeepFloor — catalog unlock",
    thanks: "KeepFloor — catalog unlocked",
    help: "KeepFloor — help",
    privacy: "KeepFloor — privacy",
    terms: "KeepFloor — terms",
    refund: "KeepFloor — refunds",
    sources: "KeepFloor — fee sources",
    notfound: "KeepFloor — page not found",
  };
  return map[route];
}
