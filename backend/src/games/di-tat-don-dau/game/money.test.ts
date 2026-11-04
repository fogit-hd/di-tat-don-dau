import { describe, expect, it } from 'vitest'
import { money, moneyTemplate } from './money'

describe('million-VND economy display', () => {
  it('uses millions below a billion and billions for larger values without changing scale', () => {
    expect(money(900)).toBe('900 triệu')
    expect(money(1000)).toBe('1 tỷ')
    expect(money(10000)).toBe('10 tỷ')
    expect(money(35852)).toBe('35,852 tỷ')
    expect(money(1000000)).toBe('1.000 tỷ')
    expect(money(-1250)).toBe('-1,25 tỷ')
    expect(money(0)).toBe('0 triệu')
  })
  it('formats legacy database narration templates without leaving the old unit behind', () => {
    expect(moneyTemplate('Vốn {{cash}} tỷ VNĐ, {{engineers}} kỹ sư.', { cash: 10000 })).toBe('Vốn 10 tỷ, {{engineers}} kỹ sư.')
    expect(moneyTemplate('Dòng tiền {{income}} tỷ.', { income: -900 })).toBe('Dòng tiền -900 triệu.')
  })
})
