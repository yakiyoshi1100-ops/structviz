import Ajv from 'ajv'

import { RESPONSE_SCHEMA, type RawGraphResponse } from './responseSchema'

const ajv = new Ajv({
  allErrors: true,
  strict: false,
})

const validate = ajv.compile(RESPONSE_SCHEMA)

export function validateAgainstSchema(data: unknown): asserts data is RawGraphResponse {
  if (validate(data)) {
    return
  }

  const message = ajv.errorsText(validate.errors, {
    separator: '\n',
    dataVar: 'response',
  })

  throw new Error(`Claude response schema validation failed:\n${message}`)
}
