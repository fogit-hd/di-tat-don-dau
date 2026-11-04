export type EventTags = { industryIds: string[]; contextIds: string[] }

export function eventApplies(row: EventTags, industryId: string, contextId: string) {
  const industryOk = row.industryIds.length === 0 || row.industryIds.includes(industryId)
  const contextOk = row.contextIds.length === 0 || row.contextIds.includes(contextId)
  return industryOk && contextOk
}
