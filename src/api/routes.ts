import { http } from "@/utils/http";

export const getAsyncRoutes = () => {
  return http.get("/auth/get-permission-info");
};
