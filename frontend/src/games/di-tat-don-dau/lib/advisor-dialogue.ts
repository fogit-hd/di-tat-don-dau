export const LETTER_SECONDS = .042
export const RESPONSE_SECONDS = 2.5

/** Short spoken turns; preserve every word and every Vietnamese diacritic. */
export function dialogueChunks(text:string,limit=150) {
  const sentences=text.normalize('NFC').trim().split(/(?<=[.!?])\s+/u)
  const chunks:string[]=[];let current=''
  for(const sentence of sentences){
    if(current&&current.length+sentence.length+1>limit){chunks.push(current);current=''}
    for(const word of sentence.split(/\s+/)){
      const next=current?current+' '+word:word
      if(next.length>limit&&current){chunks.push(current);current=word}else current=next
    }
    // End at a sentence boundary instead of cutting the next sentence in half.
    if(current.length>limit*.5){chunks.push(current);current=''}
  }
  if(current)chunks.push(current)
  return chunks.length?chunks:['']
}
