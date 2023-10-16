export default [
  {
    method: 'GET',
    path: '/rules',
    handler: 'adminController.getRules',
    config: {
      policies: [],
    }
  },
  {
    method: 'POST',
    path: '/delete-redirect',
    handler: 'adminController.delete',
    config: {
      policies: [],
    }
  },
  {
    method: 'POST',
    path: '/rules',
    handler: 'adminController.save',
    config: {
      policies: [],
    }
  },
];
