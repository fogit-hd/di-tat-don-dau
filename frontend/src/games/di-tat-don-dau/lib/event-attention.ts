import { createContext, useContext } from 'react'
export const Attention = createContext<{ unread: ReadonlySet<string>; markSeen: (key: string) => void }>({ unread:new Set(),markSeen:()=>{} })
export const useEventAttention=()=>useContext(Attention)
