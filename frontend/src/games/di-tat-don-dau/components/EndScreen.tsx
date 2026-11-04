import type { Snapshot } from '../api/types'
import { PlayerResults } from './PlayerResults'

export function EndScreen({snap}:{snap:Snapshot}){return <PlayerResults snap={snap}/>}
