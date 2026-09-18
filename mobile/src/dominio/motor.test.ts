import {describe,it,expect} from 'vitest';
import {evaluar,calcularIca,calibracionVigente,DESCARGO} from './motor';
import type {Lectura,Observacion,Calibracion} from './tipos';
import golden from './__tests__/casos-golden.json';
const lectura:Lectura={ph:7.4,tds:145,turbidez:2,temperatura:24,icaDispositivo:96,estadoDispositivo:0,versionProtocolo:1,recibidaEn:1000,errores:[]};
const observacion:Observacion={origen:'corriente',olor:'normal',visual:'limpia'};
const calibracion:Calibracion={verificadaEn:0,venceEn:2000,responsable:'Técnico',referencia:'Registro 1'};
describe('motor determinista',()=>{
  for(const caso of golden) it(caso.nombre,()=>{
    const r=evaluar({...lectura,...caso.lectura},{...observacion,...caso.observacion} as Observacion,caso.sinCalibracion?null:calibracion);
    expect([r.reglaId,r.nivel,r.plan]).toEqual([caso.regla,caso.nivel,caso.plan]);
    expect(r.advertencias).toContain(DESCARGO);
  });
  it('preserva vetos y restricciones en combinaciones de entradas',()=>{
    for(const ph of [null,NaN,Infinity,-1,0,5,6.4,6.5,7.4,8.5,8.6,10,14,15])
    for(const turbidez of [null,-1,0,25,100,201])
    for(const tds of [null,-1,0,600,1500,2001])
    for(const origen of ['corriente','estancada','no_se'] as const)
    for(const olor of ['normal','raro','no_se'] as const)
    for(const visual of ['limpia','verdosa','aceitosa','turbia','no_se'] as const) {
      const l={...lectura,ph,turbidez,tds}; const o={origen,olor,visual};
      const r=evaluar(l,o,calibracion);
      if(olor==='raro') expect(r.nivel).toBe(2);
      if(visual==='verdosa'||visual==='aceitosa') expect(r.plan).not.toBe('hervido');
      if(r.ica!==null) { expect(r.ica).toBeGreaterThanOrEqual(0); expect(r.ica).toBeLessThanOrEqual(100); }
      expect(r.reglas.length).toBeGreaterThan(0);
      if(!r.confiable) expect(r.plan).not.toBe('hervido');
    }
  });
  it('no confía en errores ni versiones desconocidas',()=>{
    expect(evaluar({...lectura,errores:['inválido']},observacion,calibracion).confiable).toBe(false);
    expect(evaluar({...lectura,versionProtocolo:2},observacion,calibracion).confiable).toBe(false);
    expect(calcularIca({...lectura,ph:7.4,tds:0,turbidez:0})).toBe(100);
  });
  it('calibración exige referencia, responsable y fechas coherentes',()=>{
    for(const c of [null,{...calibracion,verificadaEn:NaN},{...calibracion,venceEn:NaN},
      {...calibracion,verificadaEn:1001},{...calibracion,venceEn:1000},
      {...calibracion,responsable:''},{...calibracion,referencia:''}]) expect(calibracionVigente(c,1000)).toBe(false);
    expect(calibracionVigente(calibracion,1000)).toBe(true);
  });
});
