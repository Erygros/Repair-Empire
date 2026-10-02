import { redirect } from "next/navigation"; import { GameShell } from "@/components/game-shell"; import { requireSession } from "@/lib/session";
export const metadata={title:"Spielen | Repair Empire",robots:{index:false,follow:false}};
export default async function Play(){const session=await requireSession();if(!session.user.characterCreated)redirect("/create-character");return <GameShell/>}
