import { factories } from '@strapi/strapi';
import pluginId from '../../admin/src/pluginId';

export default factories.createCoreService(`plugin::${pluginId}.redirect`, ({ strapi }) => ({
  format(urlTemplate: string, fieldValue: string, locale = '') {
    return urlTemplate
      .replace('[field]', fieldValue)
      .replace('[locale]', locale);
  },

  async createRedirect(from: string, to: string) {
    const items = await strapi.query(`plugin::${pluginId}.redirect`).findMany({
      filters: {
        $or: [
          // if any redirects match new url -> delete them
          { from: to },
        ]
      },
      limit: -1
    })

    for await (const item of items) {
      await super.delete(item.id)
      console.debug('[auto-redirect] deleted redirect', item.from, '->', item.to)
    }

    console.debug('[auto-redirect] created', from, '->', to)

    // create redirect from old url to new url
    return await super.create({
      data: {
        from,
        to,
      }
    })
  },
}));

