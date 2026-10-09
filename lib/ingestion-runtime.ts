import 'server-only';
import {notFound} from 'next/navigation';
import {headers} from 'next/headers';
import {resolveIngestionPilotConfig,checkIngestionRequest} from './ingestion-pilot-config';
export function ingestionConfig(){
 if(process.env.ENABLE_DATA_INGESTION!=='true')notFound();
 return resolveIngestionPilotConfig(process.env);
}
export async function ingestionRequest(mutation=false){const config=ingestionConfig();checkIngestionRequest(config,await headers(),mutation);return config;}
