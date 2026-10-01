import { redirect } from "next/navigation"; import { GameShell } from "@/components/game-shell"; import { requireSession } from "@/lib/session";
export const metadata={title:"Spielen | Repair Empire",robots:{index:false,follow:false}};
export default async function Play(){if(process.env.NODE_ENV==="production"||process.env.DATABASE_URL){const session=await requireSession();if(!(session.user as typeof session.user&{characterCreated?:boolean}).characterCreated)redirect("/create-character");}return <GameShell/>}
