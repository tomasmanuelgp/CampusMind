import {describe,it,expect} from 'vitest';
import {resumirEnVivo} from './resumenEnVivo';
import type {Lectura,Observacion,Calibracion} from './tipos';
const l:Lectura={ph:7.4,tds:145,turbidez:2,temperatura:24,icaDispositivo:96,estadoDispositivo:0,versionProtocolo:1,recibidaEn:1000,errores:[]};
const o:Observacion={origen:'corriente',olor:'normal',visual:'limpia'};
const c:Calibracion={verificadaEn:0,venceEn:2000,responsable:'Técnica',referencia:'Registro'};
describe('conclusión que cambia con las respuestas y lecturas',()=>{
  it('aparece sin datos ni respuestas y no supone agua favorable',()=>{
    expect(resumirEnVivo(null,{},null).titulo).toBe('No consumir todavía');
    expect(resumirEnVivo(l,{},c,undefined,true).confiable).toBe(false);
  });
  it('orienta desde la primera lectura sin nombre ni estabilidad',()=>{
    const r=resumirEnVivo(l,o,c,'cocinar');
    expect(r.plan).toBe('hervido');expect(r.titulo).toContain('Posible tratamiento');
    expect(r.confiable).toBe(false);expect(r.pasos.join(' ')).toContain('3 minutos');
    expect(r.descargo).toContain('No certifica potabilidad');
  });
  it.each(['verdosa','aceitosa'] as const)('el aspecto %s cambia inmediatamente la conclusión',visual=>{
    const r=resumirEnVivo(l,{visual},null,'beber');
    expect(r.plan).toBe('alternativa');expect(r.titulo).toContain('No consumir');
    expect(r.pasos.join(' ')).not.toContain('3 minutos');
  });
  it('olor extraño veta incluso sin equipo conectado',()=>{
    expect(resumirEnVivo(null,{olor:'raro'},null).plan).toBe('alternativa');
  });
  it('permite corregir respuestas sin conservar el veto anterior',()=>{
    expect(resumirEnVivo(l,{...o,olor:'raro'},c).plan).toBe('alternativa');
    expect(resumirEnVivo(l,{...o,olorTipo:'combustible'},c).plan).toBe('hervido');
    expect(resumirEnVivo(l,{...o,visual:'no_se'},c).plan).toBe('repetir');
  });
  it('cambia ante una lectura peligrosa y pierde tratamiento al faltar datos',()=>{
    expect(resumirEnVivo({...l,tds:1500},o,c).plan).toBe('alternativa');
    expect(resumirEnVivo(null,o,c).plan).toBe('repetir');
    expect(resumirEnVivo(l,o,null).plan).toBe('repetir');
    expect(resumirEnVivo(l,o,{...c,venceEn:900}).plan).toBe('repetir');
  });
  it('el uso seleccionado cambia su orientación, sin autorizar baño o cultivos',()=>{
    expect(resumirEnVivo(l,o,c,'banarse').estadoUso).toContain('No podemos confirmar');
    expect(resumirEnVivo(l,o,c,'cultivo').estadoUso).toContain('cultivo');
    expect(resumirEnVivo(l,o,c,'utensilios').pasos.join(' ')).toContain('3 minutos');
  });
});
