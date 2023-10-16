import { Strapi } from '@strapi/strapi';
import pluginId from '../../admin/src/pluginId';

export default ({ strapi }: { strapi: Strapi }) => {
  const rulesService = strapi.plugin(pluginId).service('rulesService');
  const redirectService = strapi.plugin(pluginId).service('redirectService');
  
  return {
    async getRules() {
      const items = await rulesService.getList();
      return {
        items
      }
    },

    async delete(ctx) {
      const { id } = ctx.request.body;
      await redirectService.delete(id);

      return {
        status: 'ok'
      }
    },

    async save(ctx) {
      const { updated } = ctx.request.body;
      const { created } = await rulesService.save(updated);

      return {
        status: 'ok',
        created
      }
    }
  }
};
