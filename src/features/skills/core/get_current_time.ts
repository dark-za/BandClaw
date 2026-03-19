import type { Skill } from '../../../interfaces/types.js';

export const getCurrentTime: Skill = {
  name: 'get_current_time',
  description: 'Returns the current date and time in ISO 8601 format with timezone info.',
  category: 'core',
  schema: {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Returns the current date and time in ISO 8601 format with timezone info.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  execute: async () => {
    const now = new Date();
    return JSON.stringify({
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      unix: Math.floor(now.getTime() / 1000),
    });
  },
};
