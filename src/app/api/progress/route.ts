import { NextResponse } from "next/server";
import { authenticatedUser,supabasePublic } from "@/lib/supabase-admin";
export async function POST(request:Request){
 const user=await authenticatedUser(request);if(!user)return NextResponse.json({error:"No autorizado"},{status:401});
 const b=await request.json().catch(()=>({}));if(typeof b.itemId!=="string"||!Number.isInteger(b.positionSeconds)||b.positionSeconds<0)return NextResponse.json({error:"Datos de reproducción inválidos"},{status:400});
 const token=request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"")||"";
 const duration=Number.isInteger(b.durationSeconds)&&b.durationSeconds>0?b.durationSeconds:null;
 const {error}=await supabasePublic(token).rpc("tv_dexter_save_progress",{p_item_id:b.itemId,p_position_seconds:b.positionSeconds,p_duration_seconds:duration});
 if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});
}