import {NextResponse} from "next/server";
import {supabasePublic} from "@/lib/supabase-admin";
import manifest from "../../../../../../public/plugins.json";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const {searchParams}=new URL(req.url); const q=searchParams.get("q");
 const plugin=(manifest as {plugins:Array<{id:string;enabled:boolean;name:string}>}).plugins.find(p=>p.id===id);
 if(!plugin)return NextResponse.json({error:"Plugin desconocido."},{status:404});
 if(!plugin.enabled)return NextResponse.json({plugin:plugin.name,enabled:false,items:[],status:"adapter_not_enabled",message:"El adaptador necesita una fuente y autorización del proveedor."},{status:409});
 try{
  const {data,error}=await supabasePublic().rpc("tv_dexter_catalog",{p_category:null,p_q:q,p_live:null});
  if(error)throw error;
  const items=(data?.items||[]).filter((item:{source_name?:string;metadata?:{plugin_source?:string}})=>String(item.metadata?.plugin_source||item.source_name||"").toLowerCase()===id.toLowerCase());
  return NextResponse.json({plugin:plugin.name,enabled:true,items,status:items.length?"ready":"empty"});
 }catch{return NextResponse.json({error:"No se pudo consultar el catálogo del plugin."},{status:500});}
}
