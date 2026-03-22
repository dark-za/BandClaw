import { EventEmitter } from 'node:events';
import type { IDatabaseService } from '../interfaces/services.js';

export interface AgentCycleData {
  userId: string;
  db: IDatabaseService;
}

// Strongly typed event emitter
export declare interface AgentEventBus {
  on(event: 'AGENT_CYCLE_COMPLETED', listener: (data: AgentCycleData) => void): this;
  emit(event: 'AGENT_CYCLE_COMPLETED', data: AgentCycleData): boolean;
}

export class AgentEventBus extends EventEmitter {}

export const eventBus = new AgentEventBus();
