import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import Playground from "./components/Playground.vue";
import SampleDataDemo from "./components/SampleDataDemo.vue";
import ConsoleHome from "./ConsoleHome.vue";

// Design layer — import order matters: tokens → fonts → base → surfaces.
import "./styles/tokens.css";
import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/sidebar.css";
import "./styles/code.css";
import "./styles/home.css";

export default {
  extends: DefaultTheme,
  // index.md uses layout:home with no hero/features, so our injected sections render while nav/search/footer stay.
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-before": () => h(ConsoleHome),
    });
  },
  enhanceApp({ app }) {
    app.component("Playground", Playground);
    app.component("SampleDataDemo", SampleDataDemo);
  },
};
