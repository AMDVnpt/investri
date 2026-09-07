const bundled = {
  "/assets/photos/welcome-waterfront.jpg": require("../assets/photos/welcome-waterfront.jpg"),
  "/assets/photos/growth-fund-hero.jpg": require("../assets/photos/growth-fund-hero.jpg"),
  "/assets/photos/pawtucket-housing.jpg": require("../assets/photos/pawtucket-housing.jpg"),
  "/assets/photos/newport-ocean-tech.jpg": require("../assets/photos/newport-ocean-tech.jpg"),
  "/assets/photos/providence-housing.jpg": require("../assets/photos/providence-housing.jpg"),
  "/assets/photos/statewide-small-business.jpg": require("../assets/photos/statewide-small-business.jpg"),
} as const;

function moduleUri(mod: unknown): string | undefined {
  if (typeof mod === "string" && (mod.startsWith("/") || mod.startsWith("http") || mod.startsWith("data:"))) {
    return mod;
  }
  if (mod && typeof mod === "object" && "uri" in mod && typeof mod.uri === "string") {
    return mod.uri;
  }
  return undefined;
}

export function bundledPhotoUri(path?: string | null) {
  if (!path) {
    return undefined;
  }
  return moduleUri(bundled[path as keyof typeof bundled]);
}

export function photoSource(path?: string | null) {
  if (!path) {
    return undefined;
  }
  const local = bundled[path as keyof typeof bundled];
  if (local != null) {
    return local;
  }
  return undefined;
}
