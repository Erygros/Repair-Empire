import { AuthForm } from "@/components/auth-form"; import { PublicShell } from "@/components/public-shell";
export const metadata={title:"Registrieren | Repair Empire",robots:{index:false,follow:false}}; export default function Register(){return <PublicShell><main className="auth-page"><AuthForm mode="register"/></main></PublicShell>}
