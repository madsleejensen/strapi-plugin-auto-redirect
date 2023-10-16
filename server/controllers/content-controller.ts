import { Strapi } from '@strapi/strapi';
import pluginId from '../../admin/src/pluginId';

export default ({ strapi }: { strapi: Strapi }) => {
  const redirectService = strapi.plugin(pluginId).service('redirectService');
  
  return {
    find(ctx) {
      return redirectService.find(ctx.params);
    }
  }
};
