import { readFileSafe } from '../../utils/fs-utils.js'

export interface MockGeneratorInput {
  typeName: string
  file?: string
}

export interface MockGeneratorOutput {
  mockCode: string
  mockEmpty: string
  mockInvalid: string
}

export async function mockGenerator(input: MockGeneratorInput): Promise<MockGeneratorOutput> {
  const { typeName, file } = input

  // Simplified mock generation
  const mockCode = `export const mock${typeName}: ${typeName} = {
  id: "mock-id-123",
  name: "Mock ${typeName}",
  createdAt: new Date()
}`

  const mockEmpty = `export const mock${typeName}Empty: Partial<${typeName}> = {
  id: "",
  name: ""
}`

  const mockInvalid = `export const mock${typeName}Invalid: any = {
  id: null,
  name: 123 // wrong type
}`

  return { mockCode, mockEmpty, mockInvalid }
}
