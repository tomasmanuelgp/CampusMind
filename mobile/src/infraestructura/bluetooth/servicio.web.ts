export interface Equipo { id:string; nombre:string; emparejado:boolean }
export async function buscarEquipos(): Promise<Equipo[]> { throw new Error('Para conectar tu equipo, instala la APK en Android. Aquí puedes practicar el recorrido.'); }
export async function conectarEquipo(_id:string,_recibir:(datos:string)=>void,_desconectado:()=>void): Promise<()=>Promise<void>> {
  throw new Error('Bluetooth Classic está disponible en la APK Android.');
}
