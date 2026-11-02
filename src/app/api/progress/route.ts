import { NextResponse } from "next/server";
import { authenticatedUser, supabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request:Request) {
 const user=await authenticatedUser(request); if(!user) return NextResponse.json({error:"No autorizado"},{status:401});
 const b=await request.json().catch(()=>({}));
 if(typeof b.itemId!=="string" || !Number.isInteger(b.positionSeconds) || b.positionSeconds<0) return NextResponse.json({error:"Datos de reproducción inválidos"},{status:400});
 const duration=Number.isInteger(b.durationSeconds)&&b.durationSeconds>0?b.durationSeconds:null;
 const db=supabaseAdmin(); const {error}=await db.from("playback_progress").upsert({user_id:user.id,item_id:b.itemId,position_seconds:b.positionSeconds,duration_seconds:duration,completed:!!duration&&b.positionSeconds>=duration*0.92,updated_at:new Date().toISOString()},{onConflict:"user_id,item_id"});
 if(error) return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({ok:true});
}