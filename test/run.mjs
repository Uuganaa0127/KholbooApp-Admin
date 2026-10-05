import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['test/editors.test.jsx'],bundle:true,platform:'node',packages:'external',format:'cjs',outfile:'test/generated.test.cjs',define:{'import.meta.env.VITE_API_URL':'undefined'}});
const result=spawnSync(process.execPath,['--test','test/generated.test.cjs'],{stdio:'inherit'});process.exitCode=result.status??1;
