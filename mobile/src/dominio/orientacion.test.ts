import {describe,it,expect} from 'vitest';
import {evaluar} from './motor';
import {orientarUso} from './orientacion';
import type {Lectura,Observacion,Calibracion} from './tipos';
const lectura:Lectura={ph:7.4,tds:145,turbidez:2,temperatura:24,icaDispositivo:96,estadoDispositivo:0,versionProtocolo:1,recibidaEn:1000,errores:[]};
const observacion:Observacion={origen:'corriente',olor:'normal',visual:'limpia'};
const calibracion:Calibracion={verificadaEn:0,venceEn:2000,responsable:'Técnica',referencia:'Registro'};
describe('orientación según el uso elegido',()=>{
  it('no convierte una lectura favorable en permiso para bañarse',()=>{
    const guia=orientarUso(evaluar(lectura,observacion,calibracion),'banarse');
    expect(guia.estado).toContain('No podemos confirmar');
    expect(guia.pasos.join(' ')).not.toMatch(/hervir|desinfecta para bañarse/i);
  });
  it('el olor a combustible prohíbe el baño y no ofrece tratar para levantar el veto',()=>{
    const resultado=evaluar(lectura,{...observacion,olor:'raro',olorTipo:'combustible'},calibracion);
    const guia=orientarUso(resultado,'banarse');
    expect(guia.estado).toContain('No te bañes');
    expect(guia.pasos[0]).toContain('No uses esta agua');
    expect(guia.pasos.join(' ')).not.toMatch(/hervir|filtrar|clorar/i);
  });
  it('una lectura sin calibración no recomienda lavar utensilios',()=>{
    const guia=orientarUso(evaluar(lectura,observacion,null),'utensilios');
    expect(guia.estado).toContain('lectura sin verificar');
    expect(guia.pasos[0]).toContain('No decidas');
  });
  it('muestra el tratamiento para cocinar sin abrir otra pantalla',()=>{
    const guia=orientarUso(evaluar(lectura,observacion,calibracion),'cocinar');
    expect(guia.pasos.join(' ')).toContain('3 minutos');
    expect(guia.pasos.join(' ')).toContain('recipiente limpio');
  });
});
