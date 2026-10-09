import sharp from 'sharp';
import { createHash } from 'node:crypto';
export const EVIDENCE_MAX_BYTES=5*1024*1024;
export async function validateIngestionImage(file:File) {
 if(file.size<1 || file.size>EVIDENCE_MAX_BYTES || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Use a JPEG, PNG or WebP image of at most 5 MB.');
 const original=Buffer.from(await file.arrayBuffer());
 const image=sharp(original,{limitInputPixels:10_000_000,failOn:'error',animated:false});
 const m=await image.metadata();
 const types:Record<string,string>={jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
 if(!m.width||!m.height||m.width>10000||m.height>10000||types[m.format??'']!==file.type||(m.pages??1)>1) throw new Error('Image format/dimensions do not match a supported single image.');
 const preview=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 if(preview.length>EVIDENCE_MAX_BYTES) throw new Error('Preview exceeds the evidence limit.');
 return {original,preview,mime:file.type,bytes:original.length,sha256:createHash('sha256').update(original).digest('hex')};
}
