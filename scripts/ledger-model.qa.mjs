import assert from 'node:assert/strict'
import { groupYearCauses, summarizeYear } from '../frontend/src/lib/year-ledger.ts'

const input = [
  { kind: 'investment', label: 'Công nghệ sạch', cash: -4500, packages: 5, detail: '5 gói · giá ưu đãi' },
  { kind: 'investment', label: 'Công nghệ sạch', cash: -1000, detail: '1 gói · giá thường' },
  { kind: 'investment', label: 'Đào tạo', cash: -900 },
  { kind: 'production', label: 'Sản xuất', cash: 1570 },
  { kind: 'event', label: 'Mất tài sản', cash: 0, detail: 'Tài sản -49%' },
]
const before = JSON.stringify(input)
const grouped = groupYearCauses(input)
assert.equal(grouped.length, 4)
assert.equal(grouped[0].packages, 6)
assert.equal(grouped[0].cash, -5500)
assert.equal(grouped[0].entries.length, 2)
assert.equal(grouped[1].packages, 1)
assert.equal(grouped[3].entries[0].detail, 'Tài sản -49%')
assert.equal(grouped.reduce((sum, group) => sum + group.cash, 0), input.reduce((sum, entry) => sum + entry.cash, 0))
assert.equal(summarizeYear(input).find(group => group.kind === 'investment').packages, 7)
assert.equal(JSON.stringify(input), before)
assert.equal(groupYearCauses([{kind:'investment',label:'Cũ',cash:-9000,detail:'10 gói · thực chi 9 tỷ'}])[0].packages, 10)
assert.deepEqual(groupYearCauses([]), [])
console.log('Ledger grouping: package counts, mixed prices, cash totals, legacy records and non-cash effects passed.')
