export const canAccessRoute = (user, route) => {
  if (!route?.requiredPermission) return true;
  return Boolean(user?.permissions?.includes(route.requiredPermission));
};

export const firstAccessibleRoute = (user, routes) => {
  return routes.find((route) => canAccessRoute(user, route)) ?? routes[0];
};
