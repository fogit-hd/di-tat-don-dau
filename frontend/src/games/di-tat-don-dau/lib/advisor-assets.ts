import spriteData from './advisor-sprites.json'

export type Frame = { rect: [number,number,number,number]; anchor: [number,number]; cameraScale: number; body: [number,number,number,number]; shared?: never } | { shared: string }
type Atlas = { referenceHeight:number; waistFraction:number; clips:Record<string,{src:string;frames:Frame[]}> }
export const atlas = spriteData as unknown as Atlas
export type Assets = { frames:Map<string,CanvasImageSource>; plate:HTMLImageElement; load:(name:string)=>Promise<void> }
let assetPromise: Promise<Assets> | undefined
function image(src:string) { return new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Không tải được ảnh cố vấn'));im.src=src}) }
/** Begin during the role intro; only the essential clips delay the entrance. */
export function preloadAdvisor() {
  if(assetPromise)return assetPromise
  assetPromise=(async()=>{
    const frames=new Map<string,CanvasImageSource>(),loading=new Map<string,Promise<void>>()
    const load=(name:string):Promise<void>=>{
      if(loading.has(name))return loading.get(name)!
      const promise=(async()=>{
        const clip=atlas.clips[name],im=await image(clip.src)
        await Promise.all(clip.frames.map(async(f,i)=>{if('rect' in f){
          let bitmap:CanvasImageSource
          if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(im,...f.rect)
          else{const isolated=document.createElement('canvas');isolated.width=f.rect[2];isolated.height=f.rect[3];isolated.getContext('2d')!.drawImage(im,...f.rect,0,0,isolated.width,isolated.height);bitmap=isolated}
          frames.set(`${name}:${i}`,bitmap)
        }}))
      })()
      loading.set(name,promise);return promise
    }
    const platePromise=image('/assets/ui/advisor-v1/nameplate.svg')
    await Promise.all(['talk','breathe','arrive'].map(load))
    const assets={frames,plate:await platePromise,load}
    void Promise.allSettled(['confirm','celebrate'].map(load))
    // Load complete pointing/speaking pairs before optional unused gestures.
    void (async()=>{for(const name of ['point-up','point-steep-right','point-steep-left','point','point-right','point-down-right','point-up-left','point-left','point-down-left'])await Promise.allSettled([load(name),load(name+'-talk')])})()
    return assets
  })().catch(error=>{assetPromise=undefined;throw error})
  return assetPromise
}
