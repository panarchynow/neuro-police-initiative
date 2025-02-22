export interface ProtocolResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

export abstract class BaseProtocol {
  abstract name: string
  abstract description: string
  abstract execute (): Promise<ProtocolResult>
} 