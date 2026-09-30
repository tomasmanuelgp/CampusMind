import { describe,it,expect } from 'vitest';
import { ParserTramas,leerTrama } from './parser';
import { esEstable,lecturaRecienteValida } from './estabilidad';
const trama='VER:1\r\nESTADO:0\r\nICA:96\r\npH:7.4\r\nTDS:145\r\nTURB:2\r\nTEMP:24\r\n---\r\n';
describe('Contrato SPP',()=>{
  it('tolera cualquier corte del transporte',()=>{
    for(let corte=0;corte<=trama.length;corte++) {
      const p=new ParserTramas();
      const salidas=[...p.recibir(trama.slice(0,corte),1),...p.recibir(trama.slice(corte),1)];
      expect(salidas).toHaveLength(1); expect(salidas[0].ph).toBe(7.4);
    }
  });
  it('no inventa lecturas ni acepta marcadores dentro de un campo',()=>{
    const p=new ParserTramas(); expect(p.recibir('basura\n---\n',1)).toEqual([]);
    expect(p.recibir('pH:7.4---\n',1)).toEqual([]);
  });
  it('conserva valores fuera de rango y detecta claves duplicadas',()=>{
    expect(leerTrama('pH:15\nTDS:1\nTURB:0',1)?.ph).toBe(15);
    expect(leerTrama('pH:7\npH:8\nTDS:1\nTURB:0',1)?.ph).toBeNull();
    expect(leerTrama('pH:7abc\nTDS:\nTURB:0',1)?.errores.length).toBeGreaterThan(0);
  });
  it('trata temperatura ausente y versión antigua',()=>{
    const l=leerTrama('pH:7.4\nTDS:145\nTURB:2\nTEMP:-127\nOTRA:9',1)!;
    expect(l.temperatura).toBeNull(); expect(l.versionProtocolo).toBe(0); expect(l.errores).toEqual([]);
  });
  it('descarta un desbordamiento y se recupera en la siguiente trama',()=>{
    const p=new ParserTramas(); expect(p.recibir('x'.repeat(5000)+'\n---\n',1)).toEqual([]);
    expect(p.recibir(trama,2)).toHaveLength(1);
  });
  it('entrega varias tramas sin mezclarlas',()=> expect(new ParserTramas().recibir(trama+trama,1)).toHaveLength(2));
});
describe('estabilidad',()=>{
  const lecturas=()=>[0,1500,3000,4500].map(t=>leerTrama(trama,t)!);
  it('exige cuatro lecturas recientes',()=>{
    expect(esEstable(lecturas(),4500)).toBe(true);
    expect(esEstable(lecturas().slice(1),4500)).toBe(false);
    expect(esEstable(lecturas(),9500)).toBe(false);
  });
  it('una trama íntegra reciente sirve para orientar aunque no sea estable',()=>{
    const primera=lecturas().slice(0,1);
    expect(lecturaRecienteValida(primera,0)).not.toBeNull();
    expect(esEstable(primera,0)).toBe(false);
    expect(lecturaRecienteValida(primera,5000)).toBeNull();
    expect(lecturaRecienteValida([{...primera[0],errores:['Dato inválido']}],0)).toBeNull();
  });
  it('rechaza ráfagas, huecos e inestabilidad',()=>{
    const l=lecturas(); l[3].ph=8; expect(esEstable(l,4500)).toBe(false);
    expect(esEstable(l.map(v=>({...v,recibidaEn:4500})),4500)).toBe(false);
    l[3].recibidaEn=10000; expect(esEstable(l,10000)).toBe(false);
  });
  it('no divide entre cero ni acepta incompletas',()=>{
    const l=lecturas().map(v=>({...v,tds:0})); expect(esEstable(l,4500)).toBe(true);
    l[3].tds=1; expect(esEstable(l,4500)).toBe(false);
    expect(esEstable(lecturas().map(v=>({...v,ph:null})),4500)).toBe(false);
  });
});
