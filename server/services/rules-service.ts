import { Strapi } from '@strapi/strapi';
import pluginId from '../../admin/src/pluginId';

interface Value {
  field: string;
  enabled: boolean;
  url: string;
}

type Config = Record<string, Value>;

type UpdateInput = Value & {
  uid: string;
}

export default ({ strapi }: { strapi: Strapi }) => {
  const STORE_KEY = 'config';
  const store = strapi.store!({
    type: 'plugin',
    name: pluginId,
  })

  const redirectService = strapi.plugin(pluginId).service('redirectService');

  return {
    async getRules() {
      return (await store.get({ key: STORE_KEY }) || {}) as Config;
    },

    async getList() {
      const FIELD_TYPES = ['string', 'uid'];
      const SKIP_FIELDS = ['locale'];
      const SKIP_PLUGINS = ['admin', 'upload', 'i18n', 'users-permissions', pluginId];
      const result: any[] = [];

      Object.keys(strapi.contentTypes).forEach((key) => {
        const contentType = strapi.contentTypes[key];
        if (SKIP_PLUGINS.includes(contentType.plugin)) {
          return;
        }

        const fields: { name: string; type: string }[] = [];

        Object.keys(contentType.attributes).forEach((attributeKey) => {
          const attribute = contentType.attributes[attributeKey];

          if (FIELD_TYPES.includes(attribute.type) && !SKIP_FIELDS.includes(attributeKey)) {
            fields.push({
              name: attributeKey,
              type: attribute.type,
            });
          }
        });
        
        if (fields.length > 0) {
          result.push({
            uid: contentType.uid,
            info: contentType.info,
            fields,
          });
        }
      });

      const rules = await this.getRules();

      return result.map((item) => {
        const config = rules[item.uid];
        
        return {
          ...item,
          field: config?.field,
          url: config?.url,
          enabled: config?.enabled,
        }
      })
    },

    async save(update: UpdateInput, generate?: boolean) {
      const rules = await this.getRules();
      const rule = rules[update.uid];

      await store.set({
        key: STORE_KEY,
        value: {
          ...rules,
          [update.uid]: {
            field: update.field,
            url: update.url,
            enabled: update.enabled,
          }
        }
      });

      const urlChanged = rule && update.url !== rule.url;
      const fieldChanged = rule && update.field !== rule.field;
      const created: any[] = [];

      // url structure changed redirect all old urls to new urls
      if (urlChanged || fieldChanged) {
        const items = await strapi.query(update.uid as any).findMany({
          limit: -1
        });

        for await (const item of items) {
          const fromValue = item[rule.field];
          const toValue = item[update.field];

          const from = redirectService.format(rule.url, fromValue, item.locale);
          const to = redirectService.format(update.url, toValue, item.locale);

          if (fromValue && toValue && from !== to) {
            created.push(await redirectService.createRedirect(from, to));
          }
        }
      }

      return {
        created
      };
    }
  }
};
