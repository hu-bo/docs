import { createApp } from 'vue';
import { createPinia } from 'pinia';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import App from './App.vue';
import router from './router';

// dayjs 全局配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// Import Tailwind CSS with DaisyUI (must be first)
import './styles/main.css';
// Import additional custom styles
import './styles/global.less';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
