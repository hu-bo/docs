import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Import Tailwind CSS with DaisyUI (must be first)
import './styles/main.css';
// Import additional custom styles
import './styles/global.less';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
