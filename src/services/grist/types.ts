export interface GristTableConfig {
  accessId: string
  tableName: string
}

export const MTLGrist = {
  USERS: { accessId: 'aYk6cpKAp9CDPJe51sP3AT', tableName: 'Users' },
} as const

export type GristRecord = {
  id: number
  [key: string]: any
}

export type GristResponse = {
  records: Array<{
    id: number
    fields: Record<string, any>
  }>
} 