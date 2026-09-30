import type {Uso} from './tipos';
import type {Resultado} from './motor';

export const nombresUso:Record<Uso,string>={
  beber:'Beber',cocinar:'Cocinar',banarse:'Bañarse',utensilios:'Lavar utensilios',
  ropa:'Lavar ropa',ganado:'Ganado',cultivo:'Cultivos',
};

/** Presenta el resultado del motor sin convertir usos no evaluados en autorizaciones. */
export function orientarUso(r:Resultado,uso:Uso){
  const destinos=r.destinos;
  const estado=uso==='beber'||uso==='cocinar'?destinos.humano:
    uso==='ganado'?destinos.animal:uso==='cultivo'?destinos.riego:
    uso==='banarse'?destinos.bano:uso==='utensilios'?destinos.utensilios:destinos.ropa;
  if(r.plan==='alternativa')return {estado,pasos:[
    'No uses esta agua para el uso que elegiste.',
    'Busca otra fuente de agua mientras se revisa la causa.',
    'Muestra la medición y lo que observaste a una persona técnica o a la autoridad local.',
  ]};
  if(r.plan==='repetir')return {estado,pasos:[
    'No decidas este uso con una lectura sin verificar.',
    'Revisa la calibración y repite la medición.',
    'Si el olor o el aspecto te preocupa, busca otra fuente y pide orientación.',
  ]};
  if(uso==='beber'||uso==='cocinar'||uso==='utensilios')return {estado,pasos:[
    'Si ves partículas, deja que se asienten y pasa la parte clara por una tela limpia. Si sigue turbia, busca otra fuente.',
    'Pon el agua clara al fuego. Cuando hierva con burbujas grandes y continuas, mantenla hirviendo 3 minutos.',
    'Deja enfriar el agua protegida de suciedad. Guárdala en un recipiente limpio, desinfectado y tapado.',
  ]};
  if(uso==='banarse')return {estado,pasos:[
    'No uses esta lectura para confirmar que el agua sirve para bañarse.',
    'Consulta la orientación sanitaria local; evita tragar agua o dejarla entrar en los ojos.',
  ]};
  if(uso==='ropa')return {estado,pasos:[
    'Esta lectura no confirma si el agua sirve para lavar ropa.',
    'Si sospechas químicos, aguas residuales u otro contaminante, busca otra fuente y consulta.',
  ]};
  return {estado,pasos:[
    'Esta lectura no confirma si el agua sirve para animales o cultivos.',
    'Consulta a una persona técnica sobre el animal, cultivo y suelo antes de usarla.',
  ]};
}
