import { exec } from 'node:child_process';
import util from 'node:util';
import type { Skill } from '../../../interfaces/types.js';

const execAsync = util.promisify(exec);

export const n8nPrCreatorSkill: Skill = {
  name: 'n8n_pr_creator',
  description: 'Creates GitHub PRs with titles that pass n8n check-pr-title CI validation using the gh CLI.',
  category: 'integrations',
  schema: {
    type: 'function',
    function: {
      name: 'n8n_pr_creator',
      description: 'Create standardized Pull Requests using gh CLI following the n8n PR conventions.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['feat', 'fix', 'perf', 'test', 'docs', 'refactor', 'build', 'ci', 'chore'],
            description: 'The type of change (e.g., feat, fix).',
          },
          scope: {
            type: 'string',
            description: 'Optional scope (e.g., editor, core, API). Do not include parentheses.',
          },
          summary: {
            type: 'string',
            description: 'What the change does. Imperative tense, capitalized, no period.',
          },
          body: {
            type: 'string',
            description: 'The body/description of the PR.',
          },
          draft: {
            type: 'boolean',
            description: 'Whether to open the PR as a draft. Default: true',
          },
        },
        required: ['type', 'summary', 'body'],
      },
    },
  },
  execute: async (args: Record<string, unknown>) => {
    const { type, scope, summary, body, draft = true } = args;

    if (!type || !summary || !body) {
      return JSON.stringify({ error: 'type, summary, and body are required fields.' });
    }

    // Build the strict PR title
    const scopeStr = scope ? `(${scope})` : '';
    const prTitle = `${type}${scopeStr}: ${summary}`;

    // Validate regex:
    const regex = /^(feat|fix|perf|test|docs|refactor|build|ci|chore|revert)(\([a-zA-Z0-9 ]+( Node)?\))?!?: [A-Z].+[^.]$/;
    if (!regex.test(prTitle)) {
      return JSON.stringify({
        error: "PR Title validation failed against n8n's regex. Ensure Type and Summary start with capital letters and no trailing period.",
        attempted_title: prTitle,
      });
    }

    let cmd = `gh pr create --title "${prTitle}" --body "${body}"`;
    if (draft) cmd += ' --draft';

    try {
      const { stdout } = await execAsync(cmd);
      return JSON.stringify({ status: 'success', url: stdout.trim(), message: 'Pull Request created successfully.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ status: 'error', message: msg, note: 'Make sure you are on a pushed branch and gh CLI is authenticated.' });
    }
  },
};
