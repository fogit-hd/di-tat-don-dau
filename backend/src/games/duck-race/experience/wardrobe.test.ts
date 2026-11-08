import { describe, expect, it } from 'vitest'
import { HEAD_COSMETICS, BODY_COSMETICS, OUTFIT_COSMETICS, cosmeticItems, selectCosmetic } from '../experience-contracts'
import { createExperience, joinExperience, customizeExperience, startExperience, endExperience, snapshotExperience } from './engine'

describe('approved wardrobe slots and exclusive outfits',()=>{
 it('allows all approved head/body pairs without changing points or original model',()=>{
  const room=createExperience(),p=joinExperience(room,'Thử đồ','green')
  for(const glasses of HEAD_COSMETICS)for(const scarf of BODY_COSMETICS){
   customizeExperience(room,p,{color:'purple',glasses,scarf})
   expect(snapshotExperience(room,p.id).me).toMatchObject({color:'purple',model:'duckee',points:0,cosmetics:{glasses,scarf}})
  }
 })
 it('removes all separate items when a set is selected and removes the set for glasses',()=>{
  const outfit=selectCosmetic({glasses:'brass',scarf:'red'},'outfit','suit')
  expect(outfit).toEqual({glasses:'',scarf:'',outfit:'suit'})
  expect(cosmeticItems(outfit)).toEqual(['suit'])
  expect(selectCosmetic(outfit,'glasses','dark')).toEqual({glasses:'dark',scarf:'',outfit:''})
  expect(selectCosmetic(outfit,'scarf','tie')).toEqual({glasses:'',scarf:'tie',outfit:''})
  expect(selectCosmetic(outfit,'glasses','')).toEqual(outfit)
 })
 it('validates exclusivity on the server before changing the saved appearance',()=>{
  const room=createExperience(),p=joinExperience(room,'Bộ đồ','green')
  customizeExperience(room,p,{color:'blue',outfit:'worker'})
  for(const data of [{glasses:'brass',outfit:'suit'},{scarf:'red',outfit:'worker'},{outfit:'unknown'},{glasses:'crown'}]){
   expect(()=>customizeExperience(room,p,{color:'red',...data})).toThrow()
   expect(snapshotExperience(room,p.id).me).toMatchObject({color:'blue',cosmetics:{outfit:'worker'}})
  }
 })
 it('preserves both full outfits through persistence and results for host and player',()=>{
  for(const outfit of OUTFIT_COSMETICS.filter(Boolean)){
   const room=createExperience(1000),p=joinExperience(room,'Nhóm mặc bộ','green',1000)
   customizeExperience(room,p,{color:'red',outfit})
   const saved:typeof room=JSON.parse(JSON.stringify(room)),player=saved.players[0]
   startExperience(saved,1000);endExperience(saved,'host',4100)
   expect(snapshotExperience(saved).players[0].cosmetics).toEqual({glasses:'',scarf:'',outfit})
   expect(snapshotExperience(saved,player.id).me!.cosmetics).toEqual({glasses:'',scarf:'',outfit})
  }
 })
})
