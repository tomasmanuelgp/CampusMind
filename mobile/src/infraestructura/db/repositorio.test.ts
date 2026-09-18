import {beforeEach,describe,expect,it,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import type {Captura} from '../../dominio/tipos';

// Ejecuta el SQL de producción en SQLite real; sustituye solo el puente de Expo.
const soporte=vi.hoisted(()=>({sqlite:null as unknown as DatabaseSync,fallar:false}));
vi.mock('expo-sqlite',async()=>{
  const {DatabaseSync}=await import('node:sqlite');
  soporte.sqlite=new DatabaseSync(':memory:');
  return {openDatabaseSync:()=>({
    execSync:(sql:string)=>soporte.sqlite.exec(sql),
    runSync:(sql:string,...args:any[])=>{
      if(soporte.fallar&&sql.startsWith('UPDATE capturas'))throw new Error('Disco lleno');
      return soporte.sqlite.prepare(sql).run(...args);
    },
    getFirstSync:(sql:string,...args:any[])=>soporte.sqlite.prepare(sql).get(...args),
    getAllSync:(sql:string,...args:any[])=>soporte.sqlite.prepare(sql).all(...args),
    withTransactionSync:(fn:()=>void)=>{
      soporte.sqlite.exec('BEGIN');
      try{fn();soporte.sqlite.exec('COMMIT');}catch(e){soporte.sqlite.exec('ROLLBACK');throw e;}
    },
  })};
});
import {guardarAjuste,leerAjuste,guardarBorrador,completarCaptura,obtenerCaptura,listarCapturas} from './repositorio';
const captura:Captura={id:'uno',fuente:'Quebrada',equipo:'real',demo:false,calibracion:null,observacion:{},
  lectura:{ph:7,tds:100,turbidez:2,temperatura:24,icaDispositivo:90,estadoDispositivo:0,versionProtocolo:1,recibidaEn:1000,errores:[]}};
beforeEach(()=>{soporte.fallar=false;guardarAjuste('inicio','1');soporte.sqlite.exec('DELETE FROM ajustes; DELETE FROM capturas;');});
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
  it('mantiene identidad y orden sin duplicar mediciones',()=>{
    guardarBorrador(captura);guardarBorrador(captura);
    guardarBorrador({...captura,id:'dos',lectura:{...captura.lectura,recibidaEn:2000}});
    expect(listarCapturas().map(r=>r.captura.id)).toEqual(['dos','uno']);
    expect(obtenerCaptura('ausente')).toBeNull();
  });
  it('guarda ajustes usando parámetros incluso con comillas',()=>{
    guardarAjuste("equipo'; DROP TABLE capturas;--",'a');
    guardarAjuste("equipo'; DROP TABLE capturas;--",'b');
    expect(leerAjuste("equipo'; DROP TABLE capturas;--")).toBe('b');
    expect(leerAjuste('ausente')).toBeNull();expect(listarCapturas()).toEqual([]);
  });
});
