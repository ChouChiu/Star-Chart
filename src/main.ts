import Varlet, { StyleProvider, Themes } from "@varlet/ui";
import { createApp } from "vue";
import App from "./App.vue";

import "@varlet/ui/es/style.mjs";

const app = createApp(App);
app.use(Varlet);

// Activate Material Design 3 dark theme (default violet primary)
StyleProvider(Themes.md3Dark);

app.mount("#app");
