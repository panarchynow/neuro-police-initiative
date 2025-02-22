import { gristConfig } from '../../config/settings'
import { GristTableConfig, GristRecord, GristResponse } from './types'
import { logger } from '../../utils/logger'

export class GristService {
  private readonly token: string
  private readonly baseUrl: string

  constructor () {
    this.token = gristConfig.token
    this.baseUrl = gristConfig.baseUrl

    if (!this.token) {
      throw new Error('GRIST_TOKEN is not set')
    }
  }

  private async request<T> (
    method: string,
    table: GristTableConfig,
    params: URLSearchParams = new URLSearchParams(),
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${table.accessId}/tables/${table.tableName}/records`)
    url.search = params.toString()

    const response = await fetch(url, {
      method,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`Grist request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json() as T
  }

  async fetchData (
    table: GristTableConfig,
    sort?: string,
    filter?: Record<string, unknown[]>
  ): Promise<GristRecord[]> {
    try {
      const params = new URLSearchParams()
      if (sort != null) {
        params.set('sort', sort)
      }
      if (filter != null) {
        params.set('filter', JSON.stringify(filter))
      }

      const response = await this.request<GristResponse>('GET', table, params)
      return response.records.map(record => ({ id: record.id, ...record.fields }))
    } catch (error) {
      logger.error({ error, table }, 'Failed to fetch data from Grist')
      throw error
    }
  }

  async putData (table: GristTableConfig, data: Record<string, unknown>): Promise<boolean> {
    try {
      await this.request<unknown>('PUT', table, new URLSearchParams(), data)
      return true
    } catch (error) {
      logger.error({ error, table }, 'Failed to put data to Grist')
      throw error
    }
  }

  async patchData (table: GristTableConfig, data: Record<string, unknown>): Promise<boolean> {
    try {
      await this.request<unknown>('PATCH', table, new URLSearchParams(), data)
      return true
    } catch (error) {
      logger.error({ error, table }, 'Failed to patch data in Grist')
      throw error
    }
  }
} 