import { createApp } from './app';
import { config } from './config';

createApp().listen(config.API_PORT, () => {
  console.log(`API listening on http://localhost:${config.API_PORT}`);
});
