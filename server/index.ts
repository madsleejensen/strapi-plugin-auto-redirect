import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import contentTypes from './content-types';
import controllers from './controllers';
import routes from './routes';
import services from './services';

export default {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes: {
    admin: {
      type: 'admin',
      routes,
    },
    "content-api": {
      type: 'content-api',
      routes: [
        {
          method: 'GET',
          path: '/',
          handler: 'contentController.find',
          config: {
            auth: false,
            policies: [],
          }
        },
      ],
    }
  },
  services,
  contentTypes,
};
