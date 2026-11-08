import {beforeEach,describe,expect,it,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import type {Captura} from '../../dominio/tipos';

// Ejecuta el SQL de producción en SQLite real; sustituye solo el puente de Expo.
const soporte=vi.hoisted(()=>({sqlite:null as unknown as DatabaseSync,fallar:false}));
vi.mock('expo-crypto',()=>({randomUUID:()=>'00000000-0000-4000-8000-000000000000'}));
vi.mock('expo-sqlite',async()=>{
  const {DatabaseSync}=await import('node:sqlite');
  soporte.sqlite=new DatabaseSync(':memory:');
  type Parametro=null|number|string;
  return {openDatabaseSync:()=>({
    execSync:(sql:string)=>soporte.sqlite.exec(sql),
    runSync:(sql:string,...args:Parametro[])=>{
      if(soporte.fallar&&sql.startsWith('UPDATE medicion'))throw new Error('Disco lleno');
      return soporte.sqlite.prepare(sql).run(...args);
    },
    getFirstSync:(sql:string,...args:Parametro[])=>soporte.sqlite.prepare(sql).get(...args),
    getAllSync:(sql:string,...args:Parametro[])=>soporte.sqlite.prepare(sql).all(...args),
    withTransactionSync:(fn:()=>void)=>{
      soporte.sqlite.exec('BEGIN');
      try{fn();soporte.sqlite.exec('COMMIT');}catch(e){soporte.sqlite.exec('ROLLBACK');throw e;}
    },
  })};
});
import {guardarAjuste,leerAjuste,guardarBorrador,completarCaptura,obtenerCaptura,listarCapturas,
  borrarCaptura,borrarTodo,exportarCsv,contarCapturas,referenciaEquipo} from './repositorio';
const captura:Captura={id:'uno',fuente:'Quebrada',equipo:'equipo-1',demo:false,calibracion:null,observacion:{},
  lectura:{ph:7,tds:100,turbidez:2,temperatura:24,icaDispositivo:90,estadoDispositivo:0,versionProtocolo:1,recibidaEn:1000,errores:[]}};
beforeEach(()=>{soporte.fallar=false;guardarAjuste('inicio','1');soporte.sqlite.exec('DELETE FROM ajustes; DELETE FROM medicion;');});
describe('persistencia SQLite',()=>{
  it('recupera borradores y observaciones tras perder el estado de sesión',()=>{
    guardarBorrador(captura);guardarBorrador({...captura,observacion:{olor:'raro'}});
    expect(obtenerCaptura('uno')?.captura.observacion.olor).toBe('raro');
    expect(obtenerCaptura('uno')?.completa).toBe(false);
  });
  it('no permite modificar una captura finalizada ni su resultado',()=>{
    completarCaptura(captura,{nivel:2});
    completarCaptura({...captura,fuente:'Otra'},{nivel:0});
    expect(obtenerCaptura('uno')).toEqual({captura,completa:true,resultado:'{"nivel":2}'});
  });
  it('revierte todo el cierre si falla la escritura del resultado',()=>{
    guardarBorrador(captura);soporte.fallar=true;
    expect(()=>completarCaptura({...captura,observacion:{olor:'raro'}},{nivel:2})).toThrow('Disco lleno');
    expect(obtenerCaptura('uno')).toEqual({captura,completa:false,resultado:null});
  });
  it('mantiene identidad y orden sin duplicar mediciones, con paginación',()=>{
    guardarBorrador(captura);guardarBorrador(captura);
    guardarBorrador({...captura,id:'dos',lectura:{...captura.lectura,recibidaEn:2000}});
    expect(listarCapturas().map(r=>r.captura.id)).toEqual(['dos','uno']);
    expect(listarCapturas(1,1).map(r=>r.captura.id)).toEqual(['uno']);
    expect(contarCapturas()).toBe(2);
    expect(obtenerCaptura('ausente')).toBeNull();
  });
  it('guarda ajustes usando parámetros incluso con comillas',()=>{
    guardarAjuste("equipo'; DROP TABLE medicion;--",'a');
    guardarAjuste("equipo'; DROP TABLE medicion;--",'b');
    expect(leerAjuste("equipo'; DROP TABLE medicion;--")).toBe('b');
    expect(leerAjuste('ausente')).toBeNull();expect(listarCapturas()).toEqual([]);
  });
  it('guarda cada dato en su columna, con unidades y fechas UTC',()=>{
    const completa:Captura={...captura,uso:'beber',estabilidad:'estable',observacion:{origen:'corriente',olor:'raro',olorTipo:'azufre',visual:'limpia'},
      calibracion:{verificadaEn:0,venceEn:5000,referencia:'Acta 7',responsable:'registrado en Mi equipo'},
      lectura:{...captura.lectura,avisos:['aviso'],tramaOriginal:'VER:1'}};
    completarCaptura(completa,{version:'0.3.0',nivel:2,reglaId:'R02',reglas:['R02','R14'],plan:'alternativa',ica:91.2,confiable:true});
    const fila=soporte.sqlite.prepare('SELECT * FROM medicion').get() as Record<string,unknown>;
    expect(fila).toMatchObject({recibida_utc:'1970-01-01T00:00:01.000Z',ph:7,turbidez_ntu:2,tds_ppm:100,temperatura_c:24,
      version_protocolo:1,fuente_nombre:'Quebrada',uso:'beber',olor:'raro',olor_tipo:'azufre',aspecto:'limpia',
      calibracion_vence_ms:5000,calibracion_ref:'Acta 7',version_motor:'0.3.0',nivel:2,regla_principal:'R02',
      reglas_json:'["R02","R14"]',plan:'alternativa',ica_app:91.2,confiable:1,estado:'finalizada'});
    expect(Object.keys(fila)).not.toContain('responsable');
    expect(obtenerCaptura('uno')?.captura).toEqual(completa);
  });
  it('borra una medición, su avance, o todas, sin tocar el equipo',()=>{
    guardarBorrador(captura);guardarBorrador({...captura,id:'dos'});
    guardarAjuste('progreso:uno','{"paso":1}');guardarAjuste('equipo','{"id":"A"}');
    borrarCaptura('uno');
    expect(obtenerCaptura('uno')).toBeNull();expect(leerAjuste('progreso:uno')).toBeNull();
    borrarTodo();
    expect(contarCapturas()).toBe(0);expect(leerAjuste('equipo')).toBe('{"id":"A"}');
  });
  it('exporta CSV escapando comas y comillas, sin el JSON interno',()=>{
    completarCaptura({...captura,fuente:'Pozo "viejo", finca'},{nivel:0,plan:'hervido'});
    const [cabecera,fila]=exportarCsv().trim().split('\r\n');
    expect(cabecera.split(',')).toContain('turbidez_ntu');
    expect(cabecera).not.toContain('resultado_json');
    expect(fila).toContain('"Pozo ""viejo"", finca"');
  });
  it('da a cada equipo una referencia estable que no revela su MAC',()=>{
    const ref=referenciaEquipo('AA:BB:CC:DD:EE:FF');
    expect(ref).toBe('equipo-00000000-0000-4000-8000-000000000000');
    expect(referenciaEquipo('AA:BB:CC:DD:EE:FF')).toBe(ref);
    expect(referenciaEquipo('DEMO')).toBe('DEMO');
  });
});
