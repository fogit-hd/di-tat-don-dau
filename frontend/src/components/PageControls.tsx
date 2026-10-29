import { ArtText as T } from './ArtText'
import { PAGE_SIZE } from '../lib/pagination'

export function PageControls({page,count,onChange,label='Trang danh sách'}:{page:number;count:number;onChange:(page:number)=>void;label?:string}){
 const pages=Math.max(1,Math.ceil(count/PAGE_SIZE)),current=Math.min(page,pages-1)
 if(pages===1)return null
 return <nav className="list-pagination" aria-label={label}>
  <button type="button" disabled={current===0} onClick={()=>onChange(current-1)}><T text="Trước"/></button>
  <span role="status"><T text={`${current*PAGE_SIZE+1}–${Math.min(count,(current+1)*PAGE_SIZE)} / ${count}`}/></span>
  <button type="button" disabled={current===pages-1} onClick={()=>onChange(current+1)}><T text="Tiếp"/></button>
 </nav>
}
