import { z } from 'zod'

// Factory names include the industry's full Vietnamese name, often longer than 40 characters.
export const FACTORY_NAME_MAX_LENGTH = 256
export const factoryNameSchema = z.string({
  required_error: 'Vui lòng nhập tên nhà máy.',
  invalid_type_error: 'Tên nhà máy phải là chuỗi ký tự.',
}).trim().max(FACTORY_NAME_MAX_LENGTH, `Tên nhà máy không quá ${FACTORY_NAME_MAX_LENGTH} ký tự.`)

export const introRequestSchema = z.object({ factoryName: factoryNameSchema })

export function introFactoryName(value: string, fallback: string) {
  return factoryNameSchema.parse(value) || fallback.trim().slice(0, FACTORY_NAME_MAX_LENGTH)
}
