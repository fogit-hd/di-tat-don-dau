/** All apparel shares the original duckee frame registration. */
export const APPAREL_ROOT='/assets/duck-race/wardrobe-v2/'
export const COSMETIC_LABELS:Record<string,string>={brass:'Kính đồng',dark:'Kính tối',beanie:'Mũ len',helmet:'Mũ bảo hộ',leaf:'Ghim lá',red:'Khăn đỏ',teal:'Khăn ngọc',bow:'Nơ cổ',tie:'Cà vạt',satchel:'Túi đeo chéo',suit:'Vét · quần tây',worker:'Đồ công nhân'}
export const newApparel=(item:string)=>!['brass','dark','red','teal'].includes(item)
export const awardApparelUrl=(item:string,pose:string)=>newApparel(item)?`${APPAREL_ROOT}awards/${item}/${pose}.png`:`/assets/duck-race/results-v1/cosmetics/${item}/${pose}.png`
