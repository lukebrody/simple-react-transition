import { webcrypto } from 'node:crypto'
global.crypto = webcrypto as unknown as typeof global.crypto

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
	cleanup()
})