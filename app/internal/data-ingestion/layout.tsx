import type { Metadata } from 'next';
// The pilot gate is evaluated per request, including builds made while disabled.
export const dynamic='force-dynamic';
export const metadata:Metadata={robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return children;}
