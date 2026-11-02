import { NextResponse } from "next/server";
import { authenticatedUser,supabasePublic } from "@/lib/supabase-admin";
export async function POST(request:Request){
 const user=await authenticatedUser(request);if(!user)return NextResponse.json({error:"No autorizado"},{status:401});
 const body=await request.json().catch(()=>({}));if(typeof body.itemId!=="string")return NextResponse.json({error:"itemId requerido"},{status:400});
 const token=request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"")||"";
 const {error}=await supabasePublic(token).rpc("tv_dexter_set_favorite",{p_item_id:body.itemId,p_favorite:body.favorite!==false});
 if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});
}