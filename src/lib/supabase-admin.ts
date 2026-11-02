import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export function supabasePublic(token?: string) {
 if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},global:token?{headers:{Authorization:"Bearer "+token}}:undefined});
}
export async function authenticatedUser(request:Request) {
 const token=request.headers.get("authorization")?.replace(/^Bearer\\s+/i,"");
 if(!token) return null;
 const {data,error}=await supabasePublic(token).auth.getUser(token);
 return error?null:data.user;
}