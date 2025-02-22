export interface GristConfig {
  token: string
  baseUrl: string
}

export const gristConfig: GristConfig = {
  token: process.env.GRIST_TOKEN ?? '',
  baseUrl: 'https://montelibero.getgrist.com/api/docs'
} 