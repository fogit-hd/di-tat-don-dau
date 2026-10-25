import { money } from './format.ts'
export const figure = (n: number, digits = 2) => n.toLocaleString('vi-VN', { maximumFractionDigits: digits })
export const rate = (n: number) => `${figure(n * 100)}%`
export const signedMoney = (n: number) => `${n > 0 ? '+' : ''}${money(Object.is(n, -0) ? 0 : n)}`

