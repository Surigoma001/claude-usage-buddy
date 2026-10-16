export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Snapshot = {
  contextPercent: number | null
  limits: Limit[]
}

declare module 'claude-code' {
  interface PluginState {
    'usage-buddy': { snapshot: Snapshot | null; isOpen: boolean }
  }
}
