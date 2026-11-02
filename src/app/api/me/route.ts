import { NextResponse } from "next/server";
import { authenticatedUser, supabaseAdmin } from "@/lib/supabase-admin";
export async function GET(request: Request) {
 const user = await authenticatedUser(request);
 if (!user) return NextResponse.json({error:"Inicia sesión para consultar tu perfil."},{status:401});
 const db=supabaseAdmin();
 const [{data:favorites},{data:progress}] = await Promise.all([
  db.from("favorites").select("item_id").eq("user_id",user.id),
  db.from("playback_progress").select("item_id,position_seconds,duration_seconds,completed,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(30)
 ]);
 return NextResponse.json({user:{id:user.id,email:user.email},favorites:favorites??[],progress:progress??[]});
}