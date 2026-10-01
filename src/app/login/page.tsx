import { AuthForm } from "@/components/auth-form"; import { PublicShell } from "@/components/public-shell";
export const metadata={title:"Einloggen | Repair Empire",robots:{index:false,follow:false}}; export default function Login(){return <PublicShell><main className="auth-page"><AuthForm mode="login"/></main></PublicShell>}
