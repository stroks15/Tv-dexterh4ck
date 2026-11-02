import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const {searchParams}=new URL(request.url);
  const {data,error}=await supabasePublic().rpc("tv_dexter_catalog",{p_category:searchParams.get("category"),p_q:searchParams.get("q"),p_live:searchParams.get("live")==="true"});
  if(error) throw error;
  return NextResponse.json(data??{items:[],categories:[]},{headers:{"Cache-Control":"s-maxage=30, stale-while-revalidate=120"}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo cargar el catálogo."},{status:500});}
}