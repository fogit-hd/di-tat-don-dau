import { money } from './format.ts'
export const figure = (n: number, digits = 2) => n.toLocaleString('vi-VN', { maximumFractionDigits: digits })
export const rate = (n: number) => `${figure(n * 100)}%`
export const signedRate = (n:number) => `${n>0?'+':''}${rate(Object.is(n,-0)?0:n)}`
export const signedMoney = (n: number) => `${n > 0 ? '+' : ''}${money(Object.is(n, -0) ? 0 : n)}`


export const count = (n: number) => Math.max(0,Math.floor(n+1e-9)).toLocaleString('vi-VN')
