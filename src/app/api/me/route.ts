import { NextResponse } from "next/server";
import { authenticatedUser,supabasePublic } from "@/lib/supabase-admin";
export async function GET(request:Request){
 const user=await authenticatedUser(request);if(!user)return NextResponse.json({error:"Inicia sesión para consultar tu perfil."},{status:401});
 const token=request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"")||"";
 const {data,error}=await supabasePublic(token).rpc("tv_dexter_get_me");
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({user:{id:user.id,email:user.email},favorites:data?.favorites??[],progress:data?.progress??[]});
}