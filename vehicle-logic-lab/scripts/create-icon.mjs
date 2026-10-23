import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),size=256
const pixels=Buffer.alloc(size*(size*4+1))
const round=(x,y,l,t,w,h,r)=>{const dx=Math.max(l+r-x,0,x-(l+w-r)),dy=Math.max(t+r-y,0,y-(t+h-r));return x>=l&&x<=l+w&&y>=t&&y<=t+h&&dx*dx+dy*dy<=r*r}
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let c=[0,0,0,0]
  if(round(x,y,6,6,244,244,58))c=[247,237,207,255]
  if(round(x,y,18,18,220,220,48))c=[158,194,166,255]
  if(round(x,y,46,156,35,47,13)||round(x,y,175,156,35,47,13))c=[76,98,80,255]
  if(round(x,y,43,103,170,83,25))c=[255,248,219,255]
  if(round(x,y,62,66,132,83,29))c=[255,248,219,255]
  if(round(x,y,74,77,108,48,16))c=[181,211,197,255]
  if((x-75)**2+(y-149)**2<95||(x-181)**2+(y-149)**2<95)c=[232,190,135,255]
  if(round(x,y,103,150,50,12,5))c=[130,161,130,255]
  const o=y*(size*4+1)+1+x*4;pixels.set(c,o)
}
function crc(buf){let n=0xffffffff;for(const b of buf){n^=b;for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1}return(n^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,sum])}
const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))])
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18)
mkdirSync(resolve(root,'desktop'),{recursive:true});writeFileSync(resolve(root,'desktop/app.png'),png);writeFileSync(resolve(root,'desktop/app.ico'),Buffer.concat([ico,png]))
