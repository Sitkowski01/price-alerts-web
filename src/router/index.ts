import { createRouter, createWebHistory } from "vue-router";

// Widoki ładowane leniwie — każdy trafia do osobnej paczki i wchodzi
// dopiero przy wejściu na trasę.
const routes = [
  { path: "/", name: "alerty", component: () => import("../views/AlertsView.vue") },
  {
    path: "/alerty/:id",
    name: "alert",
    component: () => import("../views/AlertDetailView.vue"),
    props: true,
  },
  { path: "/notowanie", name: "notowanie", component: () => import("../views/QuoteView.vue") },
  { path: "/ustawienia", name: "ustawienia", component: () => import("../views/SettingsView.vue") },
  { path: "/:sciezka(.*)*", name: "404", component: () => import("../views/NotFoundView.vue") },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
