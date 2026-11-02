import { NextResponse } from "next/server";
import { authenticatedUser, supabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request:Request) {
 const user=await authenticatedUser(request); if(!user) return NextResponse.json({error:"No autorizado"},{status:401});
 const body=await request.json().catch(()=>({})); if(typeof body.itemId!=="string") return NextResponse.json({error:"itemId requerido"},{status:400});
 const db=supabaseAdmin(); const {error}= body.favorite===false
  ? await db.from("favorites").delete().eq("user_id",user.id).eq("item_id",body.itemId)
  : await db.from("favorites").upsert({user_id:user.id,item_id:body.itemId},{onConflict:"user_id,item_id"});
 if(error) return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({ok:true});
}