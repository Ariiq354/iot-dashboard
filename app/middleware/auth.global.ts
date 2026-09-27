import { useAuthSession } from "~/composables/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { session } = await useAuthSession();

  if (to.path === "/") {
    if (session.value) {
      return navigateTo({ path: "/dashboard" });
    }
  };

  if (to.path.startsWith("/dashboard")) {
    if (!session.value) {
      return navigateTo({ path: "/" });
    }
  }
});
