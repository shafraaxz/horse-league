import dynamic from 'next/dynamic';
const FutsalLeagueApp = dynamic(() => import('@/components/App'), { ssr: false });
export default function Home() { return <FutsalLeagueApp />; }
