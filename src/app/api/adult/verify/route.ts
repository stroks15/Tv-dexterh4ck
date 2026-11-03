import {createHash,createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
export const runtime="nodejs";
const cookieName="tv_dexter_adult";
function configured(){return !!process.env.TV_ADULT_PIN_HASH&&!!process.env.TV_ADULT_SESSION_SECRET;}
function digest(v:string){return createHash("sha256").update(v).digest();}
function validToken(value:string|null){if(!value||!process.env.TV_ADULT_SESSION_SECRET)return false;const [exp,sig]=value.split(".");if(!exp||!sig||Number(exp)<Date.now())return false;const expected=createHmac("sha256",process.env.TV_ADULT_SESSION_SECRET).update(exp).digest("hex");const a=Buffer.from(sig);const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export async function GET(req:Request){const res=NextResponse.json({configured:configured(),unlocked:validToken(req.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="))?.slice(cookieName.length+1)||null)});return res;}
export async function POST(req:Request){
 if(!configured())return NextResponse.json({error:"El control parental no está configurado en el servidor."},{status:503});
 let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:"Solicitud inválida."},{status:400});}
 const pin=body&&typeof body==="object"&&"pin" in body?(body as {pin?:unknown}).pin:null;
 if(typeof pin!=="string"||!/^\d{4,8}$/.test(pin))return NextResponse.json({error:"PIN inválido."},{status:400});
 const expected=Buffer.from(process.env.TV_ADULT_PIN_HASH!.toLowerCase(),"hex");
 const actual=digest(pin);
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return NextResponse.json({error:"PIN incorrecto."},{status:401});
 const exp=String(Date.now()+20*60*1000);
 const sig=createHmac("sha256",process.env.TV_ADULT_SESSION_SECRET!).update(exp).digest("hex");
 const res=NextResponse.json({ok:true,expiresInSeconds:1200});
 res.cookies.set(cookieName,exp+"."+sig,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:1200});
 return res;
}
