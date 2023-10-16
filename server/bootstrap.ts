import { Strapi } from '@strapi/strapi';
import pluginId from '../admin/src/pluginId';


export default async ({ strapi }: { strapi: Strapi }) => {
  const rulesService = strapi.plugin(pluginId).service('rulesService');
  const redirectService = strapi.plugin(pluginId).service('redirectService');

  strapi.db?.lifecycles.subscribe({
    async beforeUpdate(evt) {
      const rules = await rulesService.getRules();
      const rule = rules[evt.model.uid];
      if (!rule?.enabled) {
        return 
      }

      const contentService = strapi.service(evt.model.uid as any);
      const values = evt.params.data;
      const current = await contentService.findOne(values.id)

      const currentValue = current[rule.field];
      const newValue = values[rule.field];
 
      if (currentValue !== newValue) {
        const from = redirectService.format(rule.url, currentValue, current.locale);
        const to = redirectService.format(rule.url, newValue, current.locale);
  
        await redirectService.createRedirect(from, to);
      }
    }
  })
};
