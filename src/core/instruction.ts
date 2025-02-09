export interface InstructionResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
}

export interface InstructionParams {
  [key: string]: unknown
}

export interface Instruction {
  name: string
  description: string
  requiredParams: string[]
  execute: (params: InstructionParams) => Promise<InstructionResult>
}

export abstract class BaseInstruction implements Instruction {
  abstract name: string
  abstract description: string
  abstract requiredParams: string[]

  protected validateParams (params: InstructionParams): string | null {
    for (const param of this.requiredParams) {
      if (params[param] === undefined) {
        return `Missing required parameter: ${param}`
      }
    }
    return null
  }

  abstract execute (params: InstructionParams): Promise<InstructionResult>
}
