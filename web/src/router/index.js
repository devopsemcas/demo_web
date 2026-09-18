import { createRouter, createWebHistory } from "vue-router";
import CitizensListView from "../views/CitizensListView.vue";
import PrintFormView from "../views/PrintFormView.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "citizens-list", component: CitizensListView },
        { path: "/print/:id", name: "print-form", component: PrintFormView, props: true },
    ],
});

export default router;
